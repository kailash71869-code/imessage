import express from 'express';
import rag from '../lib/rag.js';

const router = express.Router();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Call Ollama if available
 */
async function tryOllama(prompt, systemPrompt = '') {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system: systemPrompt,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
  } catch (err) {
    // Ollama not running or timed out; continue to graceful fallback
  }
  return null;
}

/**
 * Simple language detector for incoming messages
 */
function detectMsgLanguage(text = '') {
  const t = text.trim();
  // Devanagari script (Hindi, Marathi, etc.)
  if (/[\u0900-\u097F]/.test(t)) return 'hi';
  // Arabic script
  if (/[\u0600-\u06FF]/.test(t)) return 'ar';
  // Hanzi (Chinese)
  if (/[\u4E00-\u9FFF]/.test(t)) return 'zh';
  // Hiragana / Katakana (Japanese)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return 'ja';
  // Hangul (Korean)
  if (/[\uAC00-\uD7AF]/.test(t)) return 'ko';
  // Cyrillic (Russian)
  if (/[\u0400-\u04FF]/.test(t)) return 'ru';
  // Tamil script
  if (/[\u0B80-\u0BFF]/.test(t)) return 'ta';
  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(t)) return 'te';
  // Bengali script
  if (/[\u0980-\u09FF]/.test(t)) return 'bn';

  // Spanish keywords
  if (/\b(hola|gracias|por favor|ayuda|noticias|ajustes|seguridad|como|idioma)\b/i.test(t)) return 'es';
  // French keywords
  if (/\b(bonjour|merci|salut|aide|nouvelles|paramètres|sécurité|comment|langue)\b/i.test(t)) return 'fr';
  // German keywords
  if (/\b(hallo|danke|bitte|hilfe|nachrichten|einstellungen|sicherheit|wie|sprache)\b/i.test(t)) return 'de';
  // Portuguese keywords
  if (/\b(olá|ola|obrigado|ajuda|notícias|noticias|configurações|segurança)\b/i.test(t)) return 'pt';
  // Italian keywords
  if (/\b(ciao|grazie|aiuto|notizie|impostazioni|sicurezza|come|lingua)\b/i.test(t)) return 'it';

  return 'en';
}

/**
 * Capability catalog
 */
const CAPABILITIES = [
  {
    id: 'app_help',
    name: 'App Usage Tips & Guides',
    description: 'Learn how to send encrypted chats, record voice notes, and share code.',
    example: 'How do I send an encrypted message?',
  },
  {
    id: 'features',
    name: 'Platform Features Overview',
    description: 'Explore E2EE encryption, offline-first IndexedDB, and AI summarization.',
    example: 'What features does iMessage offer?',
  },
  {
    id: 'translation',
    name: 'Multi-Language Translation',
    description: 'Translate messages across 15 world languages with instant detection.',
    example: 'Translate "Good morning team" to Spanish',
  },
  {
    id: 'news',
    name: 'Curated News Highlights',
    description: 'Get real-time summaries and share articles directly to chats.',
    example: 'What is the latest tech news?',
  },
  {
    id: 'study',
    name: 'Study & Learning Tips',
    description: 'Discover best practices for coding, devops, and security architectures.',
    example: 'Study tips for Docker and Redis pub/sub',
  },
  {
    id: 'security',
    name: 'Security & E2EE Verification',
    description: 'Inspect ECDH P-256 key exchange, AES-GCM 256 ciphering, and privacy.',
    example: 'How is my data encrypted?',
  },
  {
    id: 'settings',
    name: 'Settings & Identity Management',
    description: 'Guidance on dark mode, profiles, and offline synchronization.',
    example: 'How do I toggle dark mode?',
  },
];

/**
 * Identify intent from user message
 */
function classifyIntent(message = '') {
  const m = message.toLowerCase();

  if (/^(hi|hello|hey|greetings|hola|bonjour|namaste|salaam|good\s+(morning|afternoon|evening))\b/i.test(m)) {
    return 'greeting';
  }
  if (m.includes('help') || m.includes('how to') || m.includes('how do i') || m.includes('guide') || m.includes('tutorial')) {
    return 'help';
  }
  if (m.includes('feature') || m.includes('what can') || m.includes('capabilities') || m.includes('what do you do') || m.includes('functions')) {
    return 'feature';
  }
  if (m.includes('translate') || m.includes('language') || m.includes('translation') || m.includes('spanish') || m.includes('hindi') || m.includes('french')) {
    return 'translate';
  }
  if (m.includes('news') || m.includes('headline') || m.includes('breaking') || m.includes('article')) {
    return 'news';
  }
  if (m.includes('study') || m.includes('learn') || m.includes('course') || m.includes('exam') || m.includes('revision') || m.includes('tips')) {
    return 'study';
  }
  if (m.includes('setting') || m.includes('profile') || m.includes('theme') || m.includes('dark mode') || m.includes('account') || m.includes('switch user')) {
    return 'settings';
  }
  if (m.includes('encrypt') || m.includes('security') || m.includes('e2ee') || m.includes('aes') || m.includes('ecdh') || m.includes('cipher') || m.includes('privacy')) {
    return 'encrypt';
  }

  return 'general';
}

/**
 * Pre-baked template answers across languages and intents
 */
function getTemplateReply(intent, lang = 'en', message = '') {
  // Multilingual Greetings
  if (intent === 'greeting') {
    switch (lang) {
      case 'hi':
        return "नमस्ते! मैं आपका iMessage AI सहायक हूँ। मैं एन्क्रिप्शन, कोड शेयरिंग, अनुवाद और समाचार में आपकी मदद कर सकता हूँ। आज मैं आपकी क्या मदद करूँ?";
      case 'es':
        return "¡Hola! Soy tu asistente de iMessage. Puedo ayudarte con el cifrado E2EE, traducción, notas de voz y noticias. ¿En qué puedo ayudarte hoy?";
      case 'fr':
        return "Bonjour ! Je suis votre assistant iMessage. Je peux vous aider avec le chiffrement de bout en bout, la traduction et les actualités. Que puis-je faire pour vous aujourd'hui ?";
      case 'de':
        return "Hallo! Ich bin Ihr iMessage KI-Assistent. Ich kann Ihnen bei Verschlüsselung, Code-Sharing, Übersetzung und Nachrichten helfen. Wie kann ich helfen?";
      default:
        return "Hello! I'm your iMessage AI Assistant. I can help you with End-to-End Encryption, sharing code snippets, voice notes, live news, and multi-language translation. How can I assist you today?";
    }
  }

  // Help & How-To
  if (intent === 'help') {
    switch (lang) {
      case 'hi':
        return "यहाँ iMessage के त्वरित उपयोग सुझाव हैं:\n• संदेश भेजें: नीचे टाइप करें और Send दबाएँ (AES-GCM से स्वतः एन्क्रिप्ट होता है)।\n• कोड शेयरिंग: कोड स्निपेट साझा करने के लिए Code Icon (</>) पर क्लिक करें।\n• वॉयस नोट्स: माइक्रोफ़ोन आइकन दबाएँ और बोलें; AI इसे स्वतः ट्रांसक्राइब करेगा।\n• ऑफलाइन मोड: नेटवर्क जाने पर संदेश IndexedDB में सुरक्षित रहते हैं।";
      case 'es':
        return "Aquí tienes consejos para usar iMessage:\n• Envía mensajes: Todo está protegido con cifrado AES-GCM 256 bits.\n• Código: Haz clic en </> para compartir código con resaltado.\n• Notas de voz: Mantén presionado el icono del micrófono con transcripción por IA.\n• Modo sin conexión: Tus mensajes se guardan automáticamente en IndexedDB.";
      default:
        return "Here are the top tips for using iMessage:\n\n1. End-to-End Encryption: Every message, attachment, and voice note is encrypted using Web Crypto ECDH (P-256) & AES-GCM 256 before leaving your browser.\n2. Code Snippets: Click the '</>' icon to paste code with syntax highlighting across 8 languages.\n3. Voice Notes: Tap the mic icon to record high-fidelity voice notes with automated AI transcription.\n4. Offline-First: If you disconnect, messages queue into IndexedDB and auto-flush on reconnect.\n5. Catch Me Up: Tap the AI Sparkles button in the header for instant conversation summaries.";
    }
  }

  // Feature List
  if (intent === 'feature') {
    return "Here are the core features built into iMessage:\n\n" +
      "🔐 Military-Grade E2EE: Web Crypto ECDH P-256 key exchange & AES-GCM 256.\n" +
      "⚡ Real-time Redis Pub/Sub: Horizontal WebSocket broadcast across clustered servers.\n" +
      "💾 Offline-First Architecture: Client IndexedDB queue with automated reconnect flush.\n" +
      "🎙️ Voice Notes & AI Transcription: BullMQ audio processing queues.\n" +
      "💻 Code Sharing: Integrated editor with syntax coloring and one-tap copy.\n" +
      "📰 Curated News Feed: 8 categories with one-tap 'Share to Chat'.\n" +
      "🌐 15-Language Translation: Instant translation with automatic script detection.\n" +
      "🖼️ Rich Media Viewer: Pan/zoom images, video playback, and document previews.";
  }

  // Translation Help
  if (intent === 'translate') {
    return "iMessage features integrated multi-language support across 15 languages:\n" +
      "• Supported: English, Hindi, Spanish, French, Arabic, Chinese, Japanese, Korean, German, Portuguese, Russian, Italian, Tamil, Telugu, and Bengali.\n" +
      "• You can ask me: 'Translate \"We are deploying the build now\" to Spanish' or use the Translate tab.\n" +
      "• All incoming foreign scripts are automatically detected and mapped.";
  }

  // News Summary
  if (intent === 'news') {
    return "The iMessage News Feed gives you instant updates across 8 categories:\n" +
      "• Categories: World, Sports, Technology, Education, Science, Entertainment, Business, Health.\n" +
      "• Each card features source, read time, and a 'Share to Chat' button to discuss articles directly with teammates.\n" +
      "• Check out the News tab in the sidebar for top headlines!";
  }

  // Study & Learning Tips
  if (intent === 'study') {
    return "Here are study and learning tips for software engineering & security:\n\n" +
      "1. Distributed Systems: Study Redis Pub/Sub adapters and WebSocket clustering for scalable real-time messaging.\n" +
      "2. Modern Cryptography: Master Web Crypto API primitives (ECDH key derivation, AES-GCM authenticated encryption, SHA-256).\n" +
      "3. Offline Storage: Learn IndexedDB transaction scopes (idb) for resilient client-first offline outbox queues.\n" +
      "4. Asynchronous Queues: Practice decoupling heavy I/O (like audio transcription) with BullMQ workers and Redis.";
  }

  // Settings & Profile
  if (intent === 'settings') {
    return "Settings & Customization Guidance:\n\n" +
      "• Dark Mode: Click the Sun/Moon icon in the sidebar header to toggle dark theme.\n" +
      "• User Switcher: Click 'Switch User ⇄' in the sidebar identity banner to toggle between Alex Vance (DevOps) and Sarah Chen (Security).\n" +
      "• Encryption Status: Check the lock badge in the chat header to verify active AES-GCM session keys.";
  }

  // Encryption & Security
  if (intent === 'encrypt') {
    return "End-to-End Encryption (E2EE) Architecture:\n\n" +
      "• Key Exchange: Elliptic Curve Diffie-Hellman (ECDH) on curve P-256.\n" +
      "• Message Encryption: AES-GCM with 256-bit symmetric keys and unique 96-bit IVs per message.\n" +
      "• Zero Knowledge: The server, MongoDB, and Redis only store ciphertext. Decryption happens entirely in browser memory.\n" +
      "• Key Persistence: Cryptographic keys are saved locally in the browser's encrypted IndexedDB.";
  }

  // General Fallback
  return null;
}

/**
 * GET /api/bot/capabilities
 * Return the list of capabilities and intents the bot handles
 */
router.get('/capabilities', (req, res) => {
  try {
    res.json({
      success: true,
      botName: 'iMessage Assistant',
      version: '2.0.0',
      capabilities: CAPABILITIES,
      supportedLanguages: [
        'en', 'hi', 'es', 'fr', 'ar', 'zh', 'ja', 'ko',
        'de', 'pt', 'ru', 'it', 'ta', 'te', 'bn'
      ],
      features: [
        'End-to-End Encryption support',
        'RAG app documentation lookup',
        'Multi-language response generator',
        'Local Ollama LLM integration',
      ],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bot/chat
 * Accept { message, userId, language } and return bot response
 */
router.post('/chat', async (req, res) => {
  try {
    const { message = '', userId = 'guest', language: requestedLang = '' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required',
      });
    }

    const trimmedMsg = message.trim();
    const detectedLang = requestedLang || detectMsgLanguage(trimmedMsg);
    const intent = classifyIntent(trimmedMsg);

    // 1. Check RAG vector store for relevant documentation
    const ragResults = rag.search(trimmedMsg, 3);
    const ragContext = ragResults.map((r) => r.text).join('\n---\n');

    // 2. Try Ollama if running
    let ollamaReply = null;
    const systemPrompt = `You are a helpful, knowledgeable AI helper inside the iMessage app.
The user is asking: "${trimmedMsg}".
Detected intent: ${intent}. Target language: ${detectedLang}.
Reference knowledge base:
${ragContext}

Provide a concise, direct, and well-formatted answer in ${detectedLang === 'en' ? 'English' : detectedLang}. Keep formatting clean with bullet points when applicable.`;

    try {
      ollamaReply = await tryOllama(trimmedMsg, systemPrompt);
    } catch (e) {
      // Ollama not responding, move to fallback
    }

    if (ollamaReply && ollamaReply.trim()) {
      return res.json({
        success: true,
        reply: ollamaReply.trim(),
        intent,
        language: detectedLang,
        suggestions: [
          'How does End-to-End Encryption work?',
          'What features does iMessage offer?',
          'Show latest tech news',
          'How do I record a voice note?'
        ],
        sources: ragResults.map((r) => r.metadata?.title || r.id),
        poweredBy: 'Ollama LLM',
      });
    }

    // 3. Template-based intelligent response
    const templateReply = getTemplateReply(intent, detectedLang, trimmedMsg);

    if (templateReply) {
      return res.json({
        success: true,
        reply: templateReply,
        intent,
        language: detectedLang,
        suggestions: [
          'How does encryption work?',
          'How do I share code snippets?',
          'Tell me about offline mode',
          'Translate to Spanish'
        ],
        sources: ragResults.map((r) => r.metadata?.title || r.id),
        poweredBy: 'iMessage AI Engine',
      });
    }

    // 4. RAG fallback generation
    const ragAnswer = rag.generateAnswer(trimmedMsg, ragResults);
    return res.json({
      success: true,
      reply: ragAnswer.answer,
      intent,
      language: detectedLang,
      suggestions: [
        'How to verify E2EE keys?',
        'Can I share videos and PDFs?',
        'How does Redis pub/sub scale?'
      ],
      sources: ragAnswer.sources,
      poweredBy: 'iMessage RAG Knowledge Base',
    });
  } catch (error) {
    console.error('[Bot Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal bot service error',
    });
  }
});

export default router;
