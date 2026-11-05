import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Message from '../models/message.model.js';
import { addMediaJob } from '../lib/queue.js';

const router = express.Router();

// Prepare uploads directory
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.webm' : '.dat');
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// Fetch messages for a specific room or conversation
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    let messages = [];

    try {
      messages = await Message.find({ roomId }).sort({ createdAt: 1 }).limit(100);
    } catch (dbErr) {
      console.warn('[Messages] DB find fallback:', dbErr.message);
    }

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new message
router.post('/', async (req, res) => {
  try {
    const {
      senderId,
      receiverId,
      roomId,
      isEncrypted = true,
      ciphertext = "",
      iv = "",
      text = "",
      messageType = "text",
      codeSnippet,
      voiceNote,
      mediaUrl = "",
      status = "sent",
    } = req.body;

    let savedMessage = {
      _id: 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      senderId,
      receiverId,
      roomId,
      isEncrypted,
      ciphertext,
      iv,
      text,
      messageType,
      codeSnippet,
      voiceNote,
      mediaUrl,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const msgDoc = new Message(savedMessage);
      const dbSaved = await msgDoc.save();
      savedMessage = dbSaved.toObject();
    } catch (dbErr) {
      console.warn('[Message Save] DB write error (using memory object):', dbErr.message);
    }

    // Broadcast via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('receive-message', savedMessage);
    }

    res.status(201).json({ success: true, message: savedMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload media or voice note and add to BullMQ queue
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { roomId, senderId, receiverId, fileType = "file", duration = 0 } = req.body;
    const mediaUrl = `/uploads/${req.file.filename}`;
    const io = req.app.get('io');

    const job = await addMediaJob({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      fileType,
      duration: parseFloat(duration) || 0,
      roomId,
      senderId,
      receiverId,
      mediaUrl,
    }, io);

    res.json({
      success: true,
      mediaUrl,
      jobId: job?.id,
      fileType,
      originalName: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update message status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await Message.findByIdAndUpdate(id, { status });
    } catch (dbErr) {
      // fallback
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('message-status-updated', { messageId: id, status });
    }

    res.json({ success: true, messageId: id, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
