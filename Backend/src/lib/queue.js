import { Queue, Worker } from 'bullmq';
import { getRedisUrl, getRedisClients } from './redis.js';

let mediaQueue = null;
let mediaWorker = null;

// Simulated Speech-to-Text dictionary & heuristic transcription for voice notes
function generateSimulatedTranscription(duration, mimeType) {
  const phrases = [
    "Hey! Just checking in on the Docker container deployment status.",
    "The end-to-end encryption handshake completed successfully.",
    "I shared the updated docker-compose.yml file with the Redis adapter configuration.",
    "Sounds great, let's sync up after testing the offline IndexedDB queue.",
    "Make sure the WebSocket typing indicator is broadcasting across both instances.",
    "The AI Copilot summarization endpoint returned a clean thread breakdown.",
    "All tests are passing smoothly. Ready for deployment!"
  ];
  const idx = Math.floor(Math.random() * phrases.length);
  return {
    transcription: phrases[idx],
    confidence: +(0.92 + Math.random() * 0.07).toFixed(2),
    language: 'en-US',
  };
}

export function initQueue(io) {
  const { isRedisConnected } = getRedisClients();
  const redisUrl = getRedisUrl();

  if (isRedisConnected) {
    try {
      const url = new URL(redisUrl);
      const connection = {
        host: url.hostname || 'localhost',
        port: parseInt(url.port || '6379', 10),
      };

      mediaQueue = new Queue('media-processing-queue', { connection });

      mediaWorker = new Worker(
        'media-processing-queue',
        async (job) => {
          console.log(`[BullMQ] Processing job ${job.id}: ${job.name}`);
          const { fileType, originalName, duration, messageId, roomId } = job.data;

          // Simulate background async processing time (1.5 seconds)
          await new Promise((r) => setTimeout(r, 1500));

          let result = {};
          if (fileType === 'voice' || originalName?.endsWith('.webm') || originalName?.endsWith('.wav') || originalName?.endsWith('.mp3')) {
            result = generateSimulatedTranscription(duration, fileType);
          } else {
            result = {
              status: 'processed',
              dimensions: { width: 1280, height: 720 },
              optimized: true,
            };
          }

          console.log(`[BullMQ] Completed job ${job.id} for message ${messageId}`);

          // Emit real-time event to clients if Socket.io is provided
          if (io && roomId) {
            io.to(roomId).emit('media-processed', {
              messageId,
              result,
            });
          }

          return result;
        },
        { connection }
      );

      mediaWorker.on('failed', (job, err) => {
        console.error(`[BullMQ] Job ${job?.id} failed:`, err.message);
      });

      console.log('[BullMQ] Media & Voice processing queue initialized with Redis');
    } catch (err) {
      console.warn('[BullMQ] Could not initialize BullMQ with Redis, falling back to async processor:', err.message);
      mediaQueue = null;
    }
  } else {
    console.log('[BullMQ] Running in-memory async background task handler for media & voice processing');
  }
}

export async function addMediaJob(data, io) {
  if (mediaQueue) {
    try {
      return await mediaQueue.add('process-media', data);
    } catch (e) {
      console.warn('[BullMQ] Queue.add failed, processing in-memory:', e.message);
    }
  }

  // In-memory fallback async execution
  setTimeout(async () => {
    const { fileType, originalName, duration, messageId, roomId } = data;
    let result = {};
    if (fileType === 'voice' || originalName?.endsWith('.webm') || originalName?.endsWith('.wav') || originalName?.endsWith('.mp3')) {
      result = generateSimulatedTranscription(duration, fileType);
    } else {
      result = {
        status: 'processed',
        dimensions: { width: 1280, height: 720 },
        optimized: true,
      };
    }

    if (io && roomId) {
      io.to(roomId).emit('media-processed', {
        messageId,
        result,
      });
    }
  }, 1000);

  return { id: `inmem-${Date.now()}` };
}
