import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  isEncrypted: {
    type: Boolean,
    default: true,
  },
  ciphertext: {
    type: String,
    default: "", // E2EE AES-GCM encrypted payload (server never decrypts this)
  },
  iv: {
    type: String,
    default: "", // AES-GCM Initialization Vector
  },
  text: {
    type: String,
    default: "", // Plaintext fallback if encryption toggled off
  },
  messageType: {
    type: String,
    enum: ['text', 'code', 'voice', 'image', 'file'],
    default: 'text',
  },
  codeSnippet: {
    code: { type: String, default: "" },
    language: { type: String, default: "javascript" },
    title: { type: String, default: "" },
  },
  voiceNote: {
    audioUrl: { type: String, default: "" },
    duration: { type: Number, default: 0 },
    transcription: { type: String, default: "" },
    transcriptionStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    confidence: { type: Number, default: 0 },
  },
  mediaUrl: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'read'],
    default: 'sent',
  },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
