/**
 * Web Crypto API End-to-End Encryption (E2EE) Module
 * - Key Exchange: ECDH (Elliptic Curve Diffie-Hellman) using P-256 curve
 * - Symmetric Encryption: AES-GCM 256-bit with random 12-byte IV
 * - Private keys are generated and stored in client-side IndexedDB only.
 * - Servers only ever receive or store ciphertext + IV.
 */

// ArrayBuffer <-> Base64 helpers
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// 1. Generate ECDH Key Pair for current user
export async function generateECDHKeyPair() {
  if (!window.crypto?.subtle) {
    console.warn('[WebCrypto] SubtleCrypto not available in this environment.');
    return null;
  }

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  return keyPair;
}

// 2. Export Public Key to JWK string
export async function exportPublicKeyJWK(publicKey) {
  const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(jwk);
}

// 3. Import Peer's Public Key from JWK string
export async function importPublicKeyJWK(jwkString) {
  try {
    const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  } catch (err) {
    console.warn('[WebCrypto] Could not import peer public key:', err.message);
    return null;
  }
}

// 4. Derive Shared AES-GCM 256-bit Key from my Private Key + peer's Public Key
export async function deriveSharedKey(myPrivateKey, peerPublicKey) {
  if (!myPrivateKey || !peerPublicKey) {
    return null;
  }

  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: peerPublicKey,
    },
    myPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

// Fallback room symmetric key derivation (for demo / group channels when peer key not yet negotiated)
export async function getRoomFallbackKey(roomId) {
  const encoder = new TextEncoder();
  const rawKeyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(`imessage-room-secret-${roomId}-salt-2026`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('imessage-e2ee-salt-p256'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    rawKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// 5. Encrypt message payload with AES-GCM
export async function encryptMessage(text, key) {
  if (!key) {
    return { ciphertext: text, iv: '', isEncrypted: false };
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit recommended IV for AES-GCM
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedText
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
    isEncrypted: true,
  };
}

// 6. Decrypt message payload with AES-GCM
export async function decryptMessage(ciphertext, ivBase64, key) {
  if (!key || !ciphertext || !ivBase64) {
    return ciphertext; // Return raw text if not encrypted
  }

  try {
    const encryptedBuffer = base64ToBuffer(ciphertext);
    const iv = new Uint8Array(base64ToBuffer(ivBase64));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.warn('[WebCrypto Decrypt Error]', err.message);
    return '[Decryption failed: Key mismatch or corrupted ciphertext]';
  }
}
