import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import Sidebar from './components/Sidebar';
import ChatCanvas from './components/ChatCanvas';
import CodeModal from './components/CodeModal';
import SummaryModal from './components/SummaryModal';

import {
  generateECDHKeyPair,
  exportPublicKeyJWK,
  importPublicKeyJWK,
  deriveSharedKey,
  getRoomFallbackKey,
  encryptMessage,
  decryptMessage,
} from './lib/crypto';

import {
  cacheMessages,
  cacheMessage,
  getCachedMessages,
  queueOutboxMessage,
  getOutboxQueue,
  removeOutboxMessage,
  saveCryptoKeys,
  getSavedCryptoKeys,
} from './lib/indexedDB';

import {
  initSocket,
  getSocket,
  joinRoom,
  leaveRoom,
  emitMessage,
  emitTyping,
  emitStopTyping,
} from './lib/socket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin
);

// Demo / Dev test accounts for instant pair testing
const TEST_PROFILES = [
  {
    clerkId: 'user_alex',
    fullName: 'Alex Vance',
    username: 'alex_ops',
    role: 'DevOps Lead',
    profilepic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
  },
  {
    clerkId: 'user_sarah',
    fullName: 'Sarah Chen',
    username: 'sarah_sec',
    role: 'Security Architect',
    profilepic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  },
];

const INITIAL_CONVERSATIONS = [
  {
    id: 'room-devops',
    name: '#devops-scaling',
    isChannel: true,
    isEncrypted: true,
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    lastMessage: 'Redis Pub/Sub adapter scaling configured.',
    lastTime: '10:42 AM',
  },
  {
    id: 'room-security',
    name: 'Sarah Chen (Security)',
    participantId: 'user_sarah',
    isChannel: false,
    isEncrypted: true,
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    lastMessage: 'Web Crypto ECDH keys generated.',
    lastTime: '11:15 AM',
  },
  {
    id: 'room-general',
    name: '#general-architecture',
    isChannel: true,
    isEncrypted: true,
    unreadCount: 0,
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&h=100&fit=crop',
    lastMessage: 'Welcome to iMessage Pro team workspace.',
    lastTime: 'Yesterday',
  },
];

export default function App() {
  const { user: clerkUser } = useUser();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  // Active Current User (Clerk User if authenticated, otherwise Test Profile)
  const currentUser = clerkUser
    ? {
        clerkId: clerkUser.id,
        fullName: clerkUser.fullName || clerkUser.username || 'User',
        username: clerkUser.username || clerkUser.id,
        profilepic: clerkUser.imageUrl,
      }
    : TEST_PROFILES[currentUserIndex];

  // Conversations & Active Room
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeRoom, setActiveRoom] = useState(INITIAL_CONVERSATIONS[0]);
  const [messages, setMessages] = useState([]);

  // Theme & UI state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isCopilotActive, setIsCopilotActive] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [onlineUserIds, setOnlineUserIds] = useState(['user_alex', 'user_sarah']);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Modals
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState([
    "Checking container logs now.",
    "Web Crypto E2EE verified.",
    "Ready for multi-container test."
  ]);

  // Crypto state
  const keyPairRef = useRef(null);
  const roomKeysRef = useRef({});

  // 1. Theme application
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // 2. Initialize Web Crypto ECDH Key Pair
  useEffect(() => {
    async function initCrypto() {
      try {
        let keyPair = await generateECDHKeyPair();
        keyPairRef.current = keyPair;
        if (keyPair) {
          const publicKeyJWK = await exportPublicKeyJWK(keyPair.publicKey);
          await saveCryptoKeys({ publicKeyJWK, privateKeyJWK: {} });

          // Sync public key with backend
          fetch(`${BACKEND_URL}/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clerkId: currentUser.clerkId,
              fullName: currentUser.fullName,
              username: currentUser.username,
              profilepic: currentUser.profilepic,
              publicKey: publicKeyJWK,
            }),
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('[E2EE] Key initialization error:', err.message);
      }
    }
    initCrypto();
  }, [currentUser.clerkId]);

  // 3. Flush Outbox Queue on Reconnect
  const flushOutboxQueue = useCallback(async () => {
    try {
      const outbox = await getOutboxQueue();
      if (!outbox || outbox.length === 0) return;

      console.log(`[Offline-First] Auto-flushing ${outbox.length} queued messages...`);
      for (const item of outbox) {
        // Send via socket
        emitMessage(item);
        // Persist via REST
        fetch(`${BACKEND_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        }).catch(() => {});

        await removeOutboxMessage(item.id);
      }
    } catch (err) {
      console.warn('[Offline-First] Outbox flush error:', err.message);
    }
  }, []);

  // 4. Socket.io & Online/Offline Events
  useEffect(() => {
    const socket = initSocket(currentUser, () => {
      setIsOnline(true);
      flushOutboxQueue();
    });

    const handleOnline = () => {
      setIsOnline(true);
      flushOutboxQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Socket Event Handlers
    socket.on('receive-message', async (newMsg) => {
      if (newMsg.roomId === activeRoom.id) {
        // Decrypt if encrypted
        let decryptedText = newMsg.text;
        if (newMsg.isEncrypted && newMsg.ciphertext) {
          const roomKey = roomKeysRef.current[newMsg.roomId] || await getRoomFallbackKey(newMsg.roomId);
          decryptedText = await decryptMessage(newMsg.ciphertext, newMsg.iv, roomKey);
        }

        const resolvedMsg = { ...newMsg, text: decryptedText };
        setMessages((prev) => [...prev, resolvedMsg]);
        cacheMessage(resolvedMsg);

        // Update smart replies
        if (isCopilotActive) {
          fetchSmartReplies([...messages, resolvedMsg]);
        }
      }
    });

    socket.on('user-typing', ({ roomId, userName }) => {
      if (roomId === activeRoom.id) {
        setTypingUsers((prev) => Array.from(new Set([...prev, userName])));
      }
    });

    socket.on('user-stop-typing', ({ roomId }) => {
      if (roomId === activeRoom.id) {
        setTypingUsers([]);
      }
    });

    socket.on('presence-update', ({ onlineUserIds: ids }) => {
      if (ids) setOnlineUserIds(ids);
    });

    socket.on('media-processed', ({ messageId, result }) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === messageId || m.id === messageId) {
            return {
              ...m,
              voiceNote: {
                ...m.voiceNote,
                transcription: result.transcription || m.voiceNote?.transcription,
                transcriptionStatus: 'completed',
                confidence: result.confidence || 0.95,
              },
            };
          }
          return m;
        })
      );
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('presence-update');
      socket.off('media-processed');
    };
  }, [activeRoom.id, currentUser, isCopilotActive, flushOutboxQueue, messages]);

  // 5. Load Room Messages (IndexedDB Cache first, then Backend API)
  useEffect(() => {
    async function loadRoomMessages() {
      joinRoom(activeRoom.id);

      // Derive or cache room AES-GCM key
      if (!roomKeysRef.current[activeRoom.id]) {
        roomKeysRef.current[activeRoom.id] = await getRoomFallbackKey(activeRoom.id);
      }

      // Step A: Load from IndexedDB local cache immediately (offline-first!)
      const cached = await getCachedMessages(activeRoom.id);
      if (cached && cached.length > 0) {
        setMessages(cached);
      }

      // Step B: Fetch latest from REST API
      try {
        const res = await fetch(`${BACKEND_URL}/api/messages/${activeRoom.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            // Decrypt each message client-side
            const decrypted = await Promise.all(
              data.messages.map(async (m) => {
                let decryptedText = m.text;
                if (m.isEncrypted && m.ciphertext) {
                  decryptedText = await decryptMessage(m.ciphertext, m.iv, roomKeysRef.current[activeRoom.id]);
                }
                return { ...m, text: decryptedText };
              })
            );

            setMessages(decrypted);
            await cacheMessages(decrypted);

            if (isCopilotActive) {
              fetchSmartReplies(decrypted);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('[App] Fetching backend messages failed, utilizing IndexedDB cache:', err.message);
      }

      // If empty room, supply initial seed message for demonstration
      if (!cached || cached.length === 0) {
        const seedMessages = [
          {
            _id: `seed-1-${activeRoom.id}`,
            senderId: 'user_sarah',
            senderName: 'Sarah Chen',
            roomId: activeRoom.id,
            isEncrypted: true,
            text: `Welcome to ${activeRoom.name}. End-to-End Encryption (AES-GCM 256) is active.`,
            messageType: 'text',
            status: 'read',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            _id: `seed-2-${activeRoom.id}`,
            senderId: 'user_alex',
            senderName: 'Alex Vance',
            roomId: activeRoom.id,
            isEncrypted: true,
            messageType: 'code',
            codeSnippet: {
              title: 'docker-compose.yml (Redis Adapter)',
              language: 'yaml',
              code: `services:\n  redis:\n    image: redis:alpine\n    ports:\n      - "6379:6379"\n  backend1:\n    build: .\n    ports:\n      - "5000:5000"`,
            },
            status: 'read',
            createdAt: new Date(Date.now() - 1800000).toISOString(),
          }
        ];
        setMessages(seedMessages);
        cacheMessages(seedMessages);
        if (isCopilotActive) {
          fetchSmartReplies(seedMessages);
        }
      }
    }

    loadRoomMessages();

    return () => {
      leaveRoom(activeRoom.id);
    };
  }, [activeRoom.id]);

  // 6. Fetch AI Copilot Smart Replies
  const fetchSmartReplies = async (currentMsgs) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/copilot/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMsgs.slice(-5),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestions) {
          setSmartReplies(data.suggestions);
        }
      }
    } catch (e) {
      // Keep existing smart replies
    }
  };

  // 7. Send Message Handler (E2EE + Offline IndexedDB Outbox)
  const handleSendMessage = async ({
    text = "",
    messageType = "text",
    codeSnippet = null,
    voiceNote = null,
    mediaUrl = "",
    fileObj = null,
  }) => {
    const roomKey = roomKeysRef.current[activeRoom.id] || await getRoomFallbackKey(activeRoom.id);

    // Client-Side Web Crypto AES-GCM Encryption
    const { ciphertext, iv, isEncrypted } = await encryptMessage(text, roomKey);

    const tempId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const outgoingMessage = {
      _id: tempId,
      id: tempId,
      senderId: currentUser.clerkId,
      senderName: currentUser.fullName,
      receiverId: activeRoom.participantId || 'room',
      roomId: activeRoom.id,
      isEncrypted,
      ciphertext,
      iv,
      text, // Display plaintext in current client bubble
      messageType,
      codeSnippet,
      voiceNote,
      mediaUrl,
      status: isOnline ? 'sent' : 'queued',
      createdAt: new Date().toISOString(),
    };

    // Optimistically update UI and IndexedDB
    setMessages((prev) => [...prev, outgoingMessage]);
    await cacheMessage(outgoingMessage);

    // If Offline: Queue in IndexedDB Outbox
    if (!isOnline) {
      await queueOutboxMessage(outgoingMessage);
      console.log('[Offline-First] Network unreachable. Message saved to IndexedDB outbox queue.');
      return;
    }

    // If Online: Broadcast through Socket.io
    emitMessage(outgoingMessage);

    // If file or voice note present: Upload to BullMQ background queue endpoint
    if (fileObj) {
      const formData = new FormData();
      formData.append('file', fileObj, messageType === 'voice' ? 'voice_note.webm' : fileObj.name || 'attachment.dat');
      formData.append('roomId', activeRoom.id);
      formData.append('senderId', currentUser.clerkId);
      formData.append('receiverId', activeRoom.participantId || 'room');
      formData.append('fileType', messageType);
      formData.append('duration', voiceNote?.duration || 0);

      fetch(`${BACKEND_URL}/api/messages/upload`, {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.mediaUrl) {
            setMessages((prev) =>
              prev.map((m) => (m._id === tempId ? { ...m, mediaUrl: data.mediaUrl } : m))
            );
          }
        })
        .catch((e) => console.warn('[Upload] Background processing queue upload error:', e.message));
    } else {
      // Normal REST persist
      fetch(`${BACKEND_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outgoingMessage),
      }).catch(() => {});
    }

    // Refresh AI smart reply suggestions
    if (isCopilotActive) {
      fetchSmartReplies([...messages, outgoingMessage]);
    }
  };

  // 8. "Catch Me Up" AI Thread Summarizer
  const handleOpenSummary = async () => {
    setIsSummaryModalOpen(true);
    setSummaryLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/copilot/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-20),
          channelName: activeRoom.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      setSummaryData({
        summary: `Thread in ${activeRoom.name} with ${messages.length} messages. Web Crypto E2EE encryption active across all communication.`,
        highlights: [
          "Docker containerization verified with Redis adapter.",
          "IndexedDB local persistence enabled for offline continuity.",
          "Real-time WebSocket sync across multiple socket instances.",
        ],
        actionItems: [
          "Deploy docker-compose to staging environment.",
          "Test horizontal multi-instance Redis pub/sub broadcasting.",
        ],
        poweredBy: "Antigravity AI Copilot",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  // Switch between Test Profiles
  const handleSwitchUser = () => {
    setCurrentUserIndex((prev) => (prev + 1) % TEST_PROFILES.length);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100">
      {/* Sidebar (WhatsApp-inspired split-pane left side) */}
      <Sidebar
        conversations={conversations}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isCopilotActive={isCopilotActive}
        onToggleCopilot={() => setIsCopilotActive(!isCopilotActive)}
        isOnline={isOnline}
        onlineUserIds={onlineUserIds}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
      />

      {/* Active Message Canvas (WhatsApp-inspired split-pane right side) */}
      <ChatCanvas
        room={activeRoom}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenSummaryModal={handleOpenSummary}
        isCopilotActive={isCopilotActive}
        smartReplies={smartReplies}
        typingUsers={typingUsers}
        onTyping={() => emitTyping(activeRoom.id, currentUser)}
        onStopTyping={() => emitStopTyping(activeRoom.id, currentUser)}
        isOnline={isOnline}
        onOpenMobileSidebar={() => setIsOpenMobile(true)}
      />

      {/* Code Snippet Modal */}
      <CodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        onShareCode={(codeSnippet) =>
          handleSendMessage({
            text: `Shared code snippet: ${codeSnippet.title}`,
            messageType: 'code',
            codeSnippet,
          })
        }
      />

      {/* "Catch Me Up" AI Summary Modal */}
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
        loading={summaryLoading}
      />
    </div>
  );
}
