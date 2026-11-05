import express from 'express';
import User from '../models/user.model.js';

const router = express.Router();

// Mock / Default users for quick testing without needing separate signups
const DEFAULT_USERS = [
  {
    clerkId: 'user_alex',
    fullName: 'Alex Vance (DevOps Lead)',
    username: 'alex_ops',
    profilepic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    publicKey: '',
  },
  {
    clerkId: 'user_sarah',
    fullName: 'Sarah Chen (Security Architect)',
    username: 'sarah_sec',
    profilepic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    publicKey: '',
  },
  {
    clerkId: 'user_marcus',
    fullName: 'Marcus Wright (FullStack)',
    username: 'marcus_w',
    profilepic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    status: 'offline',
    publicKey: '',
  }
];

// List all users / contacts
router.get('/', async (req, res) => {
  try {
    let users = [];
    try {
      users = await User.find({}).sort({ updatedAt: -1 });
    } catch (dbErr) {
      console.warn('[User Routes] DB find fallback, returning mock contacts:', dbErr.message);
    }

    if (!users || users.length === 0) {
      users = DEFAULT_USERS;
    }

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync or register user with their E2EE Public Key
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, fullName, username, profilepic, publicKey } = req.body;

    if (!clerkId) {
      return res.status(400).json({ success: false, error: "clerkId is required" });
    }

    let user = null;
    try {
      user = await User.findOneAndUpdate(
        { clerkId },
        {
          $set: {
            fullName: fullName || 'Anonymous User',
            username: username || clerkId,
            profilepic: profilepic || '',
            publicKey: publicKey || '',
            status: 'online',
            lastSeen: new Date(),
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (dbErr) {
      user = {
        clerkId,
        fullName: fullName || 'Anonymous User',
        username: username || clerkId,
        profilepic: profilepic || '',
        publicKey: publicKey || '',
        status: 'online',
        lastSeen: new Date(),
      };
    }

    // Broadcast public key update to active socket clients
    const io = req.app.get('io');
    if (io) {
      io.emit('user-updated', user);
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch user's public key for E2EE handshake
router.get('/:id/key', async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    try {
      user = await User.findOne({ $or: [{ clerkId: id }, { _id: id }] });
    } catch (dbErr) {
      user = DEFAULT_USERS.find(u => u.clerkId === id);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, publicKey: user.publicKey || "", clerkId: user.clerkId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
