import { openDB } from 'idb';

const DB_NAME = 'imessage_offline_db';
const DB_VERSION = 1;

let dbPromise = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: '_id' });
          messageStore.createIndex('roomId', 'roomId', { unique: false });
          messageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Outbox queue for offline outgoing messages
        if (!db.objectStoreNames.contains('outbox')) {
          const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
          outboxStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          db.createObjectStore('conversations', { keyPath: 'roomId' });
        }

        // Key storage for Web Crypto ECDH key pair
        if (!db.objectStoreNames.contains('cryptoKeys')) {
          db.createObjectStore('cryptoKeys', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// 1. Messages Cache
export async function cacheMessages(messages) {
  const db = await getDB();
  const tx = db.transaction('messages', 'readwrite');
  for (const msg of messages) {
    if (msg && msg._id) {
      await tx.store.put(msg);
    }
  }
  await tx.done;
}

export async function cacheMessage(message) {
  const db = await getDB();
  await db.put('messages', message);
}

export async function getCachedMessages(roomId) {
  const db = await getDB();
  const index = db.transaction('messages').store.index('roomId');
  const messages = await index.getAll(roomId);
  return messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// 2. Outbox Queue for Offline-First sending
export async function queueOutboxMessage(msg) {
  const db = await getDB();
  const outboxItem = {
    ...msg,
    id: msg._id || `outbox-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'queued',
    queuedAt: new Date().toISOString(),
  };
  await db.put('outbox', outboxItem);
  return outboxItem;
}

export async function getOutboxQueue() {
  const db = await getDB();
  return await db.getAll('outbox');
}

export async function removeOutboxMessage(id) {
  const db = await getDB();
  await db.delete('outbox', id);
}

// 3. User Crypto Key Pair Persistence
export async function saveCryptoKeys(keyPairJWK) {
  const db = await getDB();
  await db.put('cryptoKeys', {
    id: 'user_ecdh_keys',
    publicKeyJWK: keyPairJWK.publicKeyJWK,
    privateKeyJWK: keyPairJWK.privateKeyJWK,
    updatedAt: new Date().toISOString(),
  });
}

export async function getSavedCryptoKeys() {
  const db = await getDB();
  return await db.get('cryptoKeys', 'user_ecdh_keys');
}

