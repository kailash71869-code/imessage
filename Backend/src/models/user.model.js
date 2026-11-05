import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    default: "",
  },
  profilepic: {
    type: String,
    default: "",
  },
  publicKey: {
    type: String,
    default: "", // E2EE ECDH public key exported as JWK string or SPKI
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
