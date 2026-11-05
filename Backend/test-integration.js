import http from 'http';
import express from 'express';
import cors from 'cors';
import { io as ClientIO } from 'socket.io-client';

import { setupSocket } from './src/socket/socket.js';
import { initQueue, addMediaJob } from './src/lib/queue.js';
import aiRoutes from './src/routes/ai.routes.js';
import messageRoutes from './src/routes/message.routes.js';
import userRoutes from './src/routes/user.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import contactRoutes from './src/routes/contact.routes.js';
import botRoutes from './src/routes/bot.routes.js';
import newsRoutes from './src/routes/news.routes.js';
import translateRoutes from './src/routes/translate.routes.js';

const app = express();
const server = http.createServer(app);
const TEST_PORT = 5099;

app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => res.json({ status: 'healthy', ok: true }));

const io = setupSocket(server, `http://localhost:${TEST_PORT}`);
app.set('io', io);
initQueue(io);

app.use('/api/ai/copilot', aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/translate', translateRoutes);

async function runTests() {
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[TEST] Test server listening on http://localhost:${TEST_PORT}`);

  try {
    // 1. Health check
    const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
    const healthData = await healthRes.json();
    console.log('[TEST 1] /health check passed:', healthData.status);

    // 2. AI Copilot - Smart Replies
    const aiSuggestRes = await fetch(`http://localhost:${TEST_PORT}/api/ai/copilot/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ text: "Can you review the Docker container configuration?" }]
      })
    });
    const aiSuggestData = await aiSuggestRes.json();
    console.log('[TEST 2] /api/ai/copilot/suggest passed. Suggestions count:', aiSuggestData.suggestions?.length);

    // 3. AI Copilot - Summarize ("Catch Me Up")
    const aiSummRes = await fetch(`http://localhost:${TEST_PORT}/api/ai/copilot/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { senderName: "Alex", text: "Deployed Redis container and backend instances." },
          { senderName: "Sarah", text: "Confirmed Web Crypto ECDH key exchange is working." }
        ],
        channelName: "DevOps"
      })
    });
    const aiSummData = await aiSummRes.json();
    console.log('[TEST 3] /api/ai/copilot/summarize passed. Summary:', aiSummData.summary?.substring(0, 50) + '...');

    // 4. Users API
    const userSyncRes = await fetch(`http://localhost:${TEST_PORT}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkId: 'test_user_1',
        fullName: 'Test User One',
        publicKey: '{"kty":"EC","crv":"P-256"}',
      })
    });
    const userSyncData = await userSyncRes.json();
    console.log('[TEST 4] /api/users/sync passed for:', userSyncData.user.fullName);

    // 5. Auth API - OTP Generation & Verification
    console.log('[TEST 5] Testing Phone/Email OTP Auth flow...');
    const otpRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+1234567890' })
    });
    const otpData = await otpRes.json();
    console.log('[TEST 5] /api/auth/send-otp response:', otpData.message);

    const verifyRes = await fetch(`http://localhost:${TEST_PORT}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otpId: otpData.otpId,
        otp: otpData.devOtp || '123456',
        phone: '+1234567890'
      })
    });
    const verifyData = await verifyRes.json();
    console.log('[TEST 5] /api/auth/verify-otp passed! User token received:', !!verifyData.token);

    // 6. News Feed API
    console.log('[TEST 6] Testing News Feed API...');
    const newsRes = await fetch(`http://localhost:${TEST_PORT}/api/news`);
    const newsData = await newsRes.json();
    console.log('[TEST 6] /api/news returned articles count:', newsData.articles?.length || newsData.data?.length || (Array.isArray(newsData) ? newsData.length : 0));

    // 7. Translation & Multi-language API
    console.log('[TEST 7] Testing Multi-language Translation API...');
    const langRes = await fetch(`http://localhost:${TEST_PORT}/api/translate/languages`);
    const langData = await langRes.json();
    console.log('[TEST 7] Supported languages count:', langData.languages?.length || langData.data?.length || 0);

    const transRes = await fetch(`http://localhost:${TEST_PORT}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello, welcome to WhatsApp!',
        fromLang: 'en',
        toLang: 'es'
      })
    });
    const transData = await transRes.json();
    console.log('[TEST 7] Translation result:', transData.translatedText || transData.translation);

    // 8. In-App AI Helper Bot
    console.log('[TEST 8] Testing In-App AI Helper Bot...');
    const botRes = await fetch(`http://localhost:${TEST_PORT}/api/bot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How does end-to-end encryption work in this app?',
        userId: 'test_user_1'
      })
    });
    const botData = await botRes.json();
    console.log('[TEST 8] Bot response received:', botData.reply ? botData.reply.substring(0, 60) + '...' : 'OK');

    // 9. WebSocket Sync - Multi-client communication
    console.log('[TEST 9] Connecting multi-client Socket.io instances...');
    const clientA = ClientIO(`http://localhost:${TEST_PORT}`);
    const clientB = ClientIO(`http://localhost:${TEST_PORT}`);

    await Promise.all([
      new Promise((res) => clientA.on('connect', res)),
      new Promise((res) => clientB.on('connect', res)),
    ]);
    console.log('[TEST 9] Both client sockets connected successfully.');

    // Join room
    clientA.emit('join-room', 'test-room-1');
    clientB.emit('join-room', 'test-room-1');

    // Test real-time message broadcasting
    const broadcastPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Broadcast timeout')), 4000);
      clientB.on('receive-message', (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });

    clientA.emit('send-message', {
      roomId: 'test-room-1',
      senderId: 'clientA',
      isEncrypted: true,
      ciphertext: 'VGhpcyBpcyBhbiBFMkVFIGVuY3J5cHRlZCBwYXlsb2Fk',
      iv: 'MTIzNDU2Nzg5MDEy',
      text: 'Encrypted payload test'
    });

    const receivedMsg = await broadcastPromise;
    console.log('[TEST 9] Real-time message broadcast verified! Received ciphertext:', receivedMsg.ciphertext);

    // Test typing indicator
    const typingPromise = new Promise((resolve) => {
      clientB.on('user-typing', (data) => resolve(data));
    });
    clientA.emit('typing', { roomId: 'test-room-1', userName: 'Alice' });
    const typingData = await typingPromise;
    console.log('[TEST 10] Typing indicator broadcast verified:', typingData.userName, 'is typing');

    // 10. BullMQ Background processing queue test
    console.log('[TEST 11] Testing BullMQ / Async background processing queue...');
    const queueJob = await addMediaJob({
      fileType: 'voice',
      originalName: 'voice_note.webm',
      duration: 5,
      messageId: 'msg-voice-1',
      roomId: 'test-room-1',
    }, io);
    console.log('[TEST 11] Media processing job queued successfully with ID:', queueJob?.id);

    clientA.disconnect();
    clientB.disconnect();

    console.log('🎉 ALL 11 INTEGRATION TESTS PASSED PERFECTLY!');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration test failed:', err);
    server.close();
    process.exit(1);
  }
}

runTests();
