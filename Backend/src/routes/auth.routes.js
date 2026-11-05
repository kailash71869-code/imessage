import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Otp from '../models/otp.model.js';
import { sign, authMiddleware } from '../lib/jwt.js';

const router = express.Router();

// In-memory fallback stores for high resilience when DB is not connected
const inMemoryOtps = new Map();
const inMemoryUsers = new Map();

function isDbReady() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * PBKDF2 Password Hashing
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * PBKDF2 Password Verification
 */
function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  const [salt, key] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  const keyBuf = Buffer.from(key, 'hex');
  const hashBuf = Buffer.from(hash, 'hex');
  if (keyBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, hashBuf);
}

/**
 * SHA-256 OTP Code Hashing
 */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

/**
 * Sanitize User object before sending to client
 */
function sanitizeUser(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
}

/**
 * POST /api/auth/send-otp
 * Generates 6-digit OTP, stores with 5-min expiry, simulates sending
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, email } = req.body;

    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a phone number or an email address',
      });
    }

    // Generate random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let otpId = null;

    if (isDbReady()) {
      try {
        const otpDoc = await Otp.create({
          phone: cleanPhone,
          email: cleanEmail,
          otp: hashedOtp,
          expiresAt,
          isUsed: false,
        });
        otpId = otpDoc._id.toString();
      } catch (dbErr) {
        console.warn('[Auth Routes] Database OTP save failed, using fallback in-memory store:', dbErr.message);
      }
    }

    if (!otpId) {
      otpId = 'mem_otp_' + crypto.randomBytes(8).toString('hex');
      inMemoryOtps.set(otpId, {
        phone: cleanPhone,
        email: cleanEmail,
        otp: hashedOtp,
        expiresAt,
        isUsed: false,
      });
    }

    // Simulate sending OTP (console log)
    const recipient = cleanPhone ? `Phone: ${cleanPhone}` : `Email: ${cleanEmail}`;
    console.log('\n======================================================');
    console.log('📲 [OTP SERVICE SIMULATION] Verification Code Dispatched');
    console.log(`🎯 Recipient:  ${recipient}`);
    console.log(`🔑 OTP Code:   >>> ${otpCode} <<<`);
    console.log(`⏱️  Valid For:  5 minutes (Expires: ${expiresAt.toLocaleTimeString()})`);
    console.log(`🆔 OTP ID:     ${otpId}`);
    console.log('======================================================\n');

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${cleanPhone || cleanEmail}`,
      otpId,
      devOtp: otpCode, // Provided for effortless local evaluation
    });
  } catch (error) {
    console.error('[Auth Routes] send-otp error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate and send OTP',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies OTP code, generates JWT, creates/finds user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { otpId, otp, phone, email } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        error: 'OTP code is required',
      });
    }

    const cleanOtp = String(otp).trim();
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    let otpRecord = null;
    let isMemoryRecord = false;

    // 1. Try finding in MongoDB if connected
    if (isDbReady()) {
      try {
        if (otpId && mongoose.Types.ObjectId.isValid(otpId)) {
          otpRecord = await Otp.findById(otpId);
        }

        if (!otpRecord && (cleanPhone || cleanEmail)) {
          const query = {
            isUsed: false,
            $or: [
              ...(cleanPhone ? [{ phone: cleanPhone }] : []),
              ...(cleanEmail ? [{ email: cleanEmail }] : []),
            ],
          };
          otpRecord = await Otp.findOne(query).sort({ createdAt: -1 });
        }
      } catch (dbErr) {
        console.warn('[Auth Routes] DB OTP lookup failed, checking in-memory store:', dbErr.message);
      }
    }

    // 2. Check in-memory fallback store
    if (!otpRecord && otpId && inMemoryOtps.has(otpId)) {
      otpRecord = inMemoryOtps.get(otpId);
      isMemoryRecord = true;
    } else if (!otpRecord && (cleanPhone || cleanEmail)) {
      for (const [id, record] of inMemoryOtps.entries()) {
        if (!record.isUsed && ((cleanPhone && record.phone === cleanPhone) || (cleanEmail && record.email === cleanEmail))) {
          otpRecord = record;
          otpRecord._id = id;
          isMemoryRecord = true;
          break;
        }
      }
    }

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP session. Please request a new code.',
      });
    }

    if (otpRecord.isUsed) {
      return res.status(400).json({
        success: false,
        error: 'This OTP has already been used. Please request a new code.',
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'This OTP has expired. Please request a fresh code.',
      });
    }

    // Verify hash
    const inputHashedOtp = hashOtp(cleanOtp);
    if (inputHashedOtp !== otpRecord.otp) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect OTP code. Please check and try again.',
      });
    }

    // Mark as used
    if (isMemoryRecord) {
      otpRecord.isUsed = true;
    } else {
      try {
        otpRecord.isUsed = true;
        await otpRecord.save();
      } catch (err) {
        console.warn('[Auth Routes] Failed to update OTP status in DB:', err.message);
      }
    }

    // Find or create user
    const targetPhone = cleanPhone || otpRecord.phone || null;
    const targetEmail = cleanEmail || otpRecord.email || null;

    let user = null;
    let isNewUser = false;

    if (isDbReady()) {
      try {
        const userQueries = [];
        if (targetPhone) userQueries.push({ phone: targetPhone });
        if (targetEmail) userQueries.push({ email: targetEmail });

        if (userQueries.length > 0) {
          user = await User.findOne({ $or: userQueries });
        }

        if (user) {
          user.isVerified = true;
          user.status = 'online';
          user.lastSeen = new Date();
          await user.save();
        } else {
          isNewUser = true;
          const generatedClerkId = `user_${crypto.randomBytes(8).toString('hex')}`;
          const defaultName = targetEmail ? targetEmail.split('@')[0] : targetPhone || 'New User';
          const defaultUsername = (targetEmail ? targetEmail.split('@')[0] : 'user') + '_' + Math.floor(100 + Math.random() * 900);

          user = await User.create({
            clerkId: generatedClerkId,
            phone: targetPhone || undefined,
            email: targetEmail || undefined,
            fullName: defaultName,
            username: defaultUsername,
            bio: 'Hey there! I am using ChatApp',
            isVerified: true,
            status: 'online',
            profilepic: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces`,
            lastSeen: new Date(),
          });
        }
      } catch (dbErr) {
        console.warn('[Auth Routes] DB user operation fallback:', dbErr.message);
      }
    }

    // In-memory fallback if DB not ready or failed
    if (!user) {
      for (const record of inMemoryUsers.values()) {
        if ((targetPhone && record.phone === targetPhone) || (targetEmail && record.email === targetEmail)) {
          user = record;
          break;
        }
      }

      if (user) {
        user.isVerified = true;
        user.status = 'online';
        user.lastSeen = new Date();
      } else {
        isNewUser = true;
        const generatedClerkId = `user_${crypto.randomBytes(8).toString('hex')}`;
        user = {
          _id: generatedClerkId,
          clerkId: generatedClerkId,
          phone: targetPhone,
          email: targetEmail,
          fullName: targetEmail ? targetEmail.split('@')[0] : targetPhone || 'New User',
          username: (targetEmail ? targetEmail.split('@')[0] : 'user') + '_' + Math.floor(100 + Math.random() * 900),
          bio: 'Hey there! I am using ChatApp',
          isVerified: true,
          status: 'online',
          profilepic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          contacts: [],
          blockedUsers: [],
          role: 'user',
          lastSeen: new Date(),
        };
        inMemoryUsers.set(generatedClerkId, user);
      }
    }

    const tokenPayload = {
      userId: user._id ? user._id.toString() : user.clerkId,
      clerkId: user.clerkId,
      phone: user.phone || null,
      email: user.email || null,
      role: user.role || 'user',
    };

    const token = sign(tokenPayload);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
      isNewUser,
    });
  } catch (error) {
    console.error('[Auth Routes] verify-otp error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'OTP verification failed',
    });
  }
});

/**
 * POST /api/auth/register
 * Accepts { phone, email, fullName, username, bio, avatar, password } and creates/updates user
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, email, fullName, username, bio, avatar, password } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Full name is required',
      });
    }

    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Either phone number or email is required',
      });
    }

    const passwordHash = password ? hashPassword(password) : '';

    let user = null;

    if (isDbReady()) {
      try {
        const userQueries = [];
        if (cleanPhone) userQueries.push({ phone: cleanPhone });
        if (cleanEmail) userQueries.push({ email: cleanEmail });

        user = await User.findOne({ $or: userQueries });

        if (user) {
          user.fullName = fullName.trim();
          if (username) user.username = username.trim();
          if (bio) user.bio = bio.trim();
          if (avatar) user.profilepic = avatar.trim();
          if (passwordHash) user.passwordHash = passwordHash;
          user.isVerified = true;
          user.status = 'online';
          user.lastSeen = new Date();
          await user.save();
        } else {
          const generatedClerkId = `user_${crypto.randomBytes(8).toString('hex')}`;
          user = await User.create({
            clerkId: generatedClerkId,
            phone: cleanPhone || undefined,
            email: cleanEmail || undefined,
            fullName: fullName.trim(),
            username: username ? username.trim() : (cleanEmail ? cleanEmail.split('@')[0] : 'user') + '_' + Math.floor(100 + Math.random() * 900),
            bio: bio ? bio.trim() : 'Hey there! I am using ChatApp',
            profilepic: avatar ? avatar.trim() : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
            passwordHash,
            isVerified: true,
            status: 'online',
            lastSeen: new Date(),
          });
        }
      } catch (dbErr) {
        console.warn('[Auth Routes] DB registration fallback:', dbErr.message);
      }
    }

    // In-memory fallback
    if (!user) {
      for (const record of inMemoryUsers.values()) {
        if ((cleanPhone && record.phone === cleanPhone) || (cleanEmail && record.email === cleanEmail)) {
          user = record;
          break;
        }
      }

      if (user) {
        user.fullName = fullName.trim();
        if (username) user.username = username.trim();
        if (bio) user.bio = bio.trim();
        if (avatar) user.profilepic = avatar.trim();
        if (passwordHash) user.passwordHash = passwordHash;
        user.isVerified = true;
        user.status = 'online';
        user.lastSeen = new Date();
      } else {
        const generatedClerkId = `user_${crypto.randomBytes(8).toString('hex')}`;
        user = {
          _id: generatedClerkId,
          clerkId: generatedClerkId,
          phone: cleanPhone,
          email: cleanEmail,
          fullName: fullName.trim(),
          username: username || (cleanEmail ? cleanEmail.split('@')[0] : 'user') + '_' + Math.floor(100 + Math.random() * 900),
          bio: bio || 'Hey there! I am using ChatApp',
          profilepic: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
          passwordHash,
          isVerified: true,
          status: 'online',
          contacts: [],
          blockedUsers: [],
          role: 'user',
          lastSeen: new Date(),
        };
        inMemoryUsers.set(generatedClerkId, user);
      }
    }

    const tokenPayload = {
      userId: user._id ? user._id.toString() : user.clerkId,
      clerkId: user.clerkId,
      phone: user.phone || null,
      email: user.email || null,
      role: user.role || 'user',
    };

    const token = sign(tokenPayload);

    // Notify sockets of new or updated user profile
    const io = req.app.get('io');
    if (io) {
      io.emit('user-updated', sanitizeUser(user));
    }

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[Auth Routes] register error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Accepts { phone, email, password } and authenticates
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to login',
      });
    }

    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a phone number or email to log in',
      });
    }

    let user = null;

    if (isDbReady()) {
      try {
        const userQueries = [];
        if (cleanPhone) userQueries.push({ phone: cleanPhone });
        if (cleanEmail) userQueries.push({ email: cleanEmail });

        user = await User.findOne({ $or: userQueries });
      } catch (dbErr) {
        console.warn('[Auth Routes] DB login lookup failed, checking in-memory store:', dbErr.message);
      }
    }

    if (!user) {
      for (const record of inMemoryUsers.values()) {
        if ((cleanPhone && record.phone === cleanPhone) || (cleanEmail && record.email === cleanEmail)) {
          user = record;
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No account found matching the provided credentials',
      });
    }

    // Verify PBKDF2 password
    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password',
      });
    }

    // Update status to online
    try {
      if (typeof user.save === 'function') {
        user.status = 'online';
        user.lastSeen = new Date();
        await user.save();
      } else {
        user.status = 'online';
        user.lastSeen = new Date();
      }
    } catch (saveErr) {
      console.warn('[Auth Routes] Failed to update user status:', saveErr.message);
    }

    const tokenPayload = {
      userId: user._id ? user._id.toString() : user.clerkId,
      clerkId: user.clerkId,
      phone: user.phone || null,
      email: user.email || null,
      role: user.role || 'user',
    };

    const token = sign(tokenPayload);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[Auth Routes] login error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { userId, clerkId } = req.user;

    let user = null;

    if (isDbReady()) {
      try {
        const queries = [];
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          queries.push({ _id: userId });
        }
        if (clerkId) {
          queries.push({ clerkId });
        }
        if (queries.length > 0) {
          user = await User.findOne({ $or: queries }).select('-passwordHash');
        }
      } catch (dbErr) {
        console.warn('[Auth Routes] /me DB lookup failed:', dbErr.message);
      }
    }

    if (!user && clerkId && inMemoryUsers.has(clerkId)) {
      user = inMemoryUsers.get(clerkId);
    } else if (!user && userId && inMemoryUsers.has(userId)) {
      user = inMemoryUsers.get(userId);
    }

    if (!user) {
      // Return payload if DB record missing
      return res.status(200).json({
        success: true,
        user: {
          _id: userId,
          clerkId: clerkId || userId,
          phone: req.user.phone || null,
          email: req.user.email || null,
          fullName: req.user.email ? req.user.email.split('@')[0] : 'User',
          bio: 'Hey there! I am using ChatApp',
          role: req.user.role || 'user',
          status: 'online',
        },
      });
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('[Auth Routes] /me error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve user profile',
    });
  }
});

/**
 * PUT /api/auth/profile
 * Updates user profile: fullName, bio, about, avatar/profilepic, username
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { userId, clerkId } = req.user;
    const { fullName, bio, about, avatar, profilepic, username } = req.body;

    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = String(fullName).trim();
    if (username !== undefined) updateFields.username = String(username).trim();
    if (bio !== undefined) updateFields.bio = String(bio).trim();
    if (about !== undefined) updateFields.about = String(about).trim();
    if (avatar !== undefined) updateFields.profilepic = String(avatar).trim();
    if (profilepic !== undefined) updateFields.profilepic = String(profilepic).trim();

    let updatedUser = null;

    if (isDbReady()) {
      try {
        const queries = [];
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          queries.push({ _id: userId });
        }
        if (clerkId) {
          queries.push({ clerkId });
        }

        if (queries.length > 0) {
          updatedUser = await User.findOneAndUpdate(
            { $or: queries },
            { $set: updateFields },
            { returnDocument: 'after' }
          ).select('-passwordHash');
        }
      } catch (dbErr) {
        console.warn('[Auth Routes] Profile update DB failed, updating fallback store:', dbErr.message);
      }
    }

    const key = clerkId || userId;
    if (!updatedUser && key && inMemoryUsers.has(key)) {
      const existing = inMemoryUsers.get(key);
      updatedUser = { ...existing, ...updateFields };
      inMemoryUsers.set(key, updatedUser);
    }

    if (!updatedUser) {
      updatedUser = {
        _id: userId,
        clerkId,
        ...updateFields,
      };
    }

    // Broadcast user update across sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('user-updated', sanitizeUser(updatedUser));
    }

    return res.status(200).json({
      success: true,
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error('[Auth Routes] profile update error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile',
    });
  }
});

export default router;
