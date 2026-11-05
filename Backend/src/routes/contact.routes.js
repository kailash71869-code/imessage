import express from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import { authMiddleware, optionalAuthMiddleware } from '../lib/jwt.js';
import { isUserOnline } from '../socket/socket.js';

const router = express.Router();

function isDbReady() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// In-memory contacts store for fast fallback
const inMemoryUserContacts = new Map();

// Fallback contacts for test/demo environments
const DEFAULT_CONTACTS = [
  {
    _id: 'mock_alex',
    clerkId: 'user_alex',
    fullName: 'Alex Vance',
    username: 'alex_ops',
    phone: '+15551234567',
    email: 'alex@example.com',
    bio: 'DevOps Lead & Cloud Architect',
    profilepic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    isOnline: true,
  },
  {
    _id: 'mock_sarah',
    clerkId: 'user_sarah',
    fullName: 'Sarah Chen',
    username: 'sarah_sec',
    phone: '+15559876543',
    email: 'sarah@example.com',
    bio: 'Security Architect & Cryptography Enthusiast',
    profilepic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    isOnline: true,
  },
  {
    _id: 'mock_marcus',
    clerkId: 'user_marcus',
    fullName: 'Marcus Wright',
    username: 'marcus_w',
    phone: '+15552468101',
    email: 'marcus@example.com',
    bio: 'FullStack Engineer',
    profilepic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    status: 'offline',
    isOnline: false,
  },
];

/**
 * Helper to escape regex special characters
 */
function escapeRegex(text) {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Format user for response with isOnline status
 */
function formatContact(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;

  const online = isUserOnline(obj.clerkId) || isUserOnline(obj._id ? obj._id.toString() : null) || obj.status === 'online';
  return {
    ...obj,
    isOnline: !!online,
  };
}

/**
 * POST /api/contacts/sync
 * Accept { phoneNumbers: [], emails: [] } and return matched registered users
 */
router.post('/sync', optionalAuthMiddleware, async (req, res) => {
  try {
    const { phoneNumbers = [], emails = [] } = req.body;

    const rawPhones = Array.isArray(phoneNumbers) ? phoneNumbers : [];
    const rawEmails = Array.isArray(emails) ? emails : [];

    // Normalize phone numbers (both raw and digit-only variants for better matching)
    const cleanPhones = new Set();
    for (const p of rawPhones) {
      if (typeof p === 'string' && p.trim()) {
        const trimmed = p.trim();
        cleanPhones.add(trimmed);
        const digits = trimmed.replace(/[^\d+]/g, '');
        if (digits) cleanPhones.add(digits);
      }
    }

    const cleanEmails = rawEmails
      .filter((e) => typeof e === 'string' && e.trim())
      .map((e) => e.trim().toLowerCase());

    if (cleanPhones.size === 0 && cleanEmails.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        contacts: [],
      });
    }

    let matchedUsers = [];

    if (isDbReady()) {
      try {
        const matchCriteria = [];
        if (cleanPhones.size > 0) {
          matchCriteria.push({ phone: { $in: Array.from(cleanPhones) } });
        }
        if (cleanEmails.length > 0) {
          matchCriteria.push({ email: { $in: cleanEmails } });
        }

        const query = { $or: matchCriteria };

        // Exclude self if authenticated
        if (req.user?.userId) {
          const selfIds = [req.user.userId];
          if (mongoose.Types.ObjectId.isValid(req.user.userId)) {
            selfIds.push(new mongoose.Types.ObjectId(req.user.userId));
          }
          query._id = { $nin: selfIds };
        }
        if (req.user?.clerkId) {
          query.clerkId = { $ne: req.user.clerkId };
        }

        const docs = await User.find(query).select('-passwordHash');
        matchedUsers = docs.map(formatContact);
      } catch (dbErr) {
        console.warn('[Contact Routes] DB sync fallback:', dbErr.message);
      }
    }

    if (matchedUsers.length === 0) {
      // Fallback matching against default contacts
      matchedUsers = DEFAULT_CONTACTS.filter((c) => {
        const phoneMatch = c.phone && (cleanPhones.has(c.phone) || cleanPhones.has(c.phone.replace(/[^\d+]/g, '')));
        const emailMatch = c.email && cleanEmails.includes(c.email.toLowerCase());
        return phoneMatch || emailMatch;
      });
    }

    return res.status(200).json({
      success: true,
      count: matchedUsers.length,
      contacts: matchedUsers,
    });
  } catch (error) {
    console.error('[Contact Routes] sync error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Contact sync failed',
    });
  }
});

/**
 * GET /api/contacts
 * List current user's contacts with real-time online status
 */
router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const currentClerkId = req.user?.clerkId;
    const userKey = currentClerkId || currentUserId;

    let contacts = [];

    if (isDbReady()) {
      try {
        let currentUser = null;
        if (currentUserId || currentClerkId) {
          const queries = [];
          if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
            queries.push({ _id: currentUserId });
          }
          if (currentClerkId) {
            queries.push({ clerkId: currentClerkId });
          }
          if (queries.length > 0) {
            currentUser = await User.findOne({ $or: queries });
          }
        }

        if (currentUser && Array.isArray(currentUser.contacts) && currentUser.contacts.length > 0) {
          const contactIdentifiers = currentUser.contacts;
          const validObjectIds = contactIdentifiers
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

          const docs = await User.find({
            $or: [
              { clerkId: { $in: contactIdentifiers } },
              { _id: { $in: validObjectIds } },
              { phone: { $in: contactIdentifiers } },
              { email: { $in: contactIdentifiers } },
            ],
          }).select('-passwordHash');

          contacts = docs.map(formatContact);
        } else {
          // Return other registered users if contacts list empty
          const allUsers = await User.find(
            currentClerkId ? { clerkId: { $ne: currentClerkId } } : {}
          )
            .limit(20)
            .select('-passwordHash');

          contacts = allUsers.map(formatContact);
        }
      } catch (dbErr) {
        console.warn('[Contact Routes] GET contacts fallback:', dbErr.message);
      }
    }

    // In-memory fallback
    if (!contacts || contacts.length === 0) {
      if (userKey && inMemoryUserContacts.has(userKey)) {
        const ids = inMemoryUserContacts.get(userKey);
        contacts = DEFAULT_CONTACTS.filter((c) => ids.includes(c.clerkId) || ids.includes(c._id));
      }

      if (!contacts || contacts.length === 0) {
        contacts = DEFAULT_CONTACTS.map((c) => ({
          ...c,
          isOnline: isUserOnline(c.clerkId) || c.status === 'online',
        }));
      }
    }

    return res.status(200).json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error('[Contact Routes] list contacts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to list contacts',
    });
  }
});

/**
 * POST /api/contacts/add
 * Add a contact by userId / clerkId / phone / email
 */
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { userId, clerkId, phone, email } = req.body;
    const currentUserId = req.user?.userId;
    const currentClerkId = req.user?.clerkId;
    const userKey = currentClerkId || currentUserId;

    const identifier = userId || clerkId || phone || email;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a userId, clerkId, phone, or email of the contact to add',
      });
    }

    // Prevent adding oneself
    if (identifier === currentUserId || identifier === currentClerkId) {
      return res.status(400).json({
        success: false,
        error: 'You cannot add yourself as a contact',
      });
    }

    let targetUser = null;

    if (isDbReady()) {
      try {
        const targetQueries = [];
        if (mongoose.Types.ObjectId.isValid(identifier)) {
          targetQueries.push({ _id: identifier });
        }
        targetQueries.push({ clerkId: identifier });
        targetQueries.push({ phone: identifier });
        targetQueries.push({ email: String(identifier).toLowerCase() });

        targetUser = await User.findOne({ $or: targetQueries }).select('-passwordHash');

        if (targetUser) {
          const contactRef = targetUser.clerkId || targetUser._id.toString();
          await User.updateOne(
            {
              $or: [
                ...(currentUserId && mongoose.Types.ObjectId.isValid(currentUserId) ? [{ _id: currentUserId }] : []),
                ...(currentClerkId ? [{ clerkId: currentClerkId }] : []),
              ],
            },
            {
              $addToSet: { contacts: contactRef },
            }
          );
        }
      } catch (dbErr) {
        console.warn('[Contact Routes] POST add fallback:', dbErr.message);
      }
    }

    if (!targetUser) {
      targetUser = DEFAULT_CONTACTS.find(
        (c) => c.clerkId === identifier || c._id === identifier || c.phone === identifier || c.email === identifier
      );
      if (!targetUser) {
        targetUser = {
          _id: identifier,
          clerkId: identifier,
          fullName: 'Contact ' + identifier,
          isOnline: isUserOnline(identifier),
        };
      }
    }

    // Update in-memory user contacts store
    if (userKey) {
      const list = inMemoryUserContacts.get(userKey) || [];
      const ref = targetUser.clerkId || targetUser._id?.toString() || identifier;
      if (!list.includes(ref)) {
        list.push(ref);
        inMemoryUserContacts.set(userKey, list);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Contact added successfully',
      contact: formatContact(targetUser),
    });
  } catch (error) {
    console.error('[Contact Routes] add contact error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to add contact',
    });
  }
});

/**
 * DELETE /api/contacts/:id
 * Remove a contact by identifier
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const currentClerkId = req.user?.clerkId;
    const userKey = currentClerkId || currentUserId;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Contact id is required',
      });
    }

    if (isDbReady()) {
      try {
        await User.updateOne(
          {
            $or: [
              ...(currentUserId && mongoose.Types.ObjectId.isValid(currentUserId) ? [{ _id: currentUserId }] : []),
              ...(currentClerkId ? [{ clerkId: currentClerkId }] : []),
            ],
          },
          {
            $pull: { contacts: id },
          }
        );
      } catch (dbErr) {
        console.warn('[Contact Routes] DELETE contact fallback:', dbErr.message);
      }
    }

    if (userKey && inMemoryUserContacts.has(userKey)) {
      const list = inMemoryUserContacts.get(userKey) || [];
      inMemoryUserContacts.set(
        userKey,
        list.filter((cId) => cId !== id)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Contact removed successfully',
      removedId: id,
    });
  } catch (error) {
    console.error('[Contact Routes] delete contact error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove contact',
    });
  }
});

/**
 * GET /api/contacts/search?q=query
 * Search users by name, phone, email, username
 */
router.get('/search', optionalAuthMiddleware, async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.status(200).json({
        success: true,
        results: [],
      });
    }

    const regex = new RegExp(escapeRegex(query), 'i');
    let results = [];

    const currentUserId = req.user?.userId;
    const currentClerkId = req.user?.clerkId;
    const userKey = currentClerkId || currentUserId;

    if (isDbReady()) {
      try {
        let currentUser = null;
        if (currentUserId || currentClerkId) {
          currentUser = await User.findOne({
            $or: [
              ...(currentUserId && mongoose.Types.ObjectId.isValid(currentUserId) ? [{ _id: currentUserId }] : []),
              ...(currentClerkId ? [{ clerkId: currentClerkId }] : []),
            ],
          });
        }

        const userContactsSet = new Set(currentUser?.contacts || []);

        const searchFilter = {
          $or: [
            { fullName: regex },
            { username: regex },
            { phone: regex },
            { email: regex },
          ],
        };

        // Exclude current user from search
        if (currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)) {
          searchFilter._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
        }
        if (currentClerkId) {
          searchFilter.clerkId = { $ne: currentClerkId };
        }

        const docs = await User.find(searchFilter).limit(20).select('-passwordHash');

        results = docs.map((doc) => {
          const contact = formatContact(doc);
          const isContact = userContactsSet.has(contact.clerkId) || userContactsSet.has(contact._id?.toString());
          return {
            ...contact,
            isContact,
          };
        });
      } catch (dbErr) {
        console.warn('[Contact Routes] search fallback:', dbErr.message);
      }
    }

    if (results.length === 0) {
      const userContactsSet = new Set(userKey ? inMemoryUserContacts.get(userKey) || [] : []);
      results = DEFAULT_CONTACTS.filter((c) => {
        return (
          regex.test(c.fullName) ||
          regex.test(c.username) ||
          regex.test(c.phone) ||
          regex.test(c.email)
        );
      }).map((c) => ({
        ...c,
        isContact: userContactsSet.has(c.clerkId) || userContactsSet.has(c._id),
        isOnline: isUserOnline(c.clerkId) || c.status === 'online',
      }));
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('[Contact Routes] search error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Search failed',
    });
  }
});

export default router;
