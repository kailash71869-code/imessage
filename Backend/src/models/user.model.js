import mongoose from 'mongoose';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
      default: () => `user_${crypto.randomBytes(8).toString('hex')}`,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      lowercase: true,
      default: undefined,
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
      default: undefined,
    },
    passwordHash: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: 'Hey there! I am using ChatApp',
    },
    about: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    contacts: [
      {
        type: String,
      },
    ],
    blockedUsers: [
      {
        type: String,
      },
    ],
    role: {
      type: String,
      default: 'user',
    },
    profilepic: {
      type: String,
      default: '',
    },
    publicKey: {
      type: String,
      default: '', // E2EE ECDH public key exported as JWK string or SPKI
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Helpful indexes
userSchema.index({ fullName: 'text', username: 'text' });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
