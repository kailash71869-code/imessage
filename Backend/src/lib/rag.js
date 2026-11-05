/**
 * Simple In-Memory RAG (Retrieval-Augmented Generation) Engine
 * Pure JavaScript implementation with TF-IDF keyword vector search
 * and pre-loaded knowledge base for the iMessage platform.
 */

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t',
  'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
  'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s',
  'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re',
  'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t',
  'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
  'yourselves'
]);

export class RAGEngine {
  constructor() {
    this.documents = new Map(); // id -> { id, text, metadata, terms, termFreq, length }
    this.docFrequency = new Map(); // term -> number of docs containing term
    this.totalDocs = 0;
    this.initDefaultKnowledgeBase();
  }

  /**
   * Tokenize, lowercase, and filter stop words
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
  }

  /**
   * Add a document to the in-memory knowledge store
   */
  addDocument(id, text, metadata = {}) {
    if (!id || !text) return false;

    // If document already exists, remove old counts first
    if (this.documents.has(id)) {
      this.removeDocument(id);
    }

    const tokens = this.tokenize(text);
    const termFreq = new Map();

    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }

    // Update document frequencies
    for (const term of termFreq.keys()) {
      this.docFrequency.set(term, (this.docFrequency.get(term) || 0) + 1);
    }

    this.documents.set(id, {
      id,
      text,
      metadata,
      tokens,
      termFreq,
      length: tokens.length || 1,
    });

    this.totalDocs = this.documents.size;
    return true;
  }

  /**
   * Remove a document by ID
   */
  removeDocument(id) {
    const existing = this.documents.get(id);
    if (!existing) return false;

    for (const term of existing.termFreq.keys()) {
      const count = this.docFrequency.get(term) || 0;
      if (count <= 1) {
        this.docFrequency.delete(term);
      } else {
        this.docFrequency.set(term, count - 1);
      }
    }

    this.documents.delete(id);
    this.totalDocs = this.documents.size;
    return true;
  }

  /**
   * Simple TF-IDF search for topK matching documents
   */
  search(query, topK = 3) {
    if (!query || this.totalDocs === 0) return [];

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores = [];

    for (const [id, doc] of this.documents.entries()) {
      let score = 0;
      let matchedTerms = 0;

      for (const token of queryTokens) {
        const tf = (doc.termFreq.get(token) || 0) / doc.length;
        if (tf > 0) {
          const df = this.docFrequency.get(token) || 1;
          const idf = Math.log((this.totalDocs + 1) / (df + 1)) + 1;
          score += tf * idf * 10;
          matchedTerms++;
        }
      }

      // Metadata / Title keyword boost
      const title = (doc.metadata?.title || '').toLowerCase();
      const category = (doc.metadata?.category || '').toLowerCase();
      for (const token of queryTokens) {
        if (title.includes(token)) score += 5;
        if (category.includes(token)) score += 3;
      }

      // Multi-word phrase exact match bonus
      const lowerText = doc.text.toLowerCase();
      if (lowerText.includes(query.toLowerCase().trim())) {
        score += 8;
      }

      if (score > 0) {
        scores.push({
          id,
          score,
          matchedTerms,
          text: doc.text,
          metadata: doc.metadata,
        });
      }
    }

    // Sort descending by score and pick topK
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK);
  }

  /**
   * Combine retrieved knowledge docs with user query to generate a structured answer
   */
  generateAnswer(query, contextDocs = []) {
    if (!contextDocs || contextDocs.length === 0) {
      contextDocs = this.search(query, 2);
    }

    if (contextDocs.length === 0) {
      return {
        answer: "I couldn't find a direct match in the app documentation. You can ask me about End-to-End Encryption, sharing code snippets, voice notes, translation, the news feed, or offline mode!",
        sources: [],
      };
    }

    const primaryDoc = contextDocs[0];
    const sources = contextDocs.map((d) => d.metadata?.title || d.id);

    // Format synthesized answer
    let answer = `Here is what I found regarding "${query}":\n\n`;
    answer += primaryDoc.text;

    if (contextDocs.length > 1 && contextDocs[1].score > 2) {
      answer += `\n\nRelated Information:\n${contextDocs[1].text}`;
    }

    return {
      answer,
      sources,
      topConfidence: Math.min(100, Math.round(primaryDoc.score * 12)),
    };
  }

  /**
   * Pre-load comprehensive documentation into the RAG knowledge base
   */
  initDefaultKnowledgeBase() {
    const docs = [
      {
        id: 'feat-e2ee',
        metadata: { title: 'End-to-End Encryption (E2EE)', category: 'security' },
        text: 'iMessage protects every message, voice note, and shared file with military-grade End-to-End Encryption using the Web Crypto API. We use ECDH (Elliptic Curve Diffie-Hellman P-256) for zero-trust public key exchange and AES-GCM 256-bit with unique initialization vectors (IVs) for message encryption. Plaintext never leaves your browser; the server and Redis pub/sub brokers only handle encrypted ciphertexts.',
      },
      {
        id: 'feat-ai-copilot',
        metadata: { title: 'AI Copilot and Catch Me Up', category: 'features' },
        text: 'The AI Copilot provides three intelligent capabilities: 1) Catch Me Up: one-click thread summarization that extracts key decisions and action items from long discussions; 2) Contextual Smart Reply Pills: dynamic quick responses based on current message intent; 3) AI Reply Drafter: assists with generating friendly, concise, or technical responses. Powered by local Ollama LLMs with smart heuristic fallbacks.',
      },
      {
        id: 'feat-voice-notes',
        metadata: { title: 'Voice Notes & AI Transcription', category: 'multimedia' },
        text: 'You can record voice notes directly in the chat with visual audio waveforms. Audio is captured in WebM/Ogg format, encrypted, and uploaded to background processing queues managed by BullMQ and Redis. Voice notes are automatically transcribed to text with confidence scores so recipients can read or listen.',
      },
      {
        id: 'feat-code-sharing',
        metadata: { title: 'Code Snippet Sharing', category: 'developer' },
        text: 'Collaborate with developers using the dedicated Code Share modal. Select from JavaScript, TypeScript, Python, Go, Rust, HTML, CSS, JSON, or YAML. Code snippets feature syntax highlighting, one-click clipboard copying, line numbers, and inline execution reviews.',
      },
      {
        id: 'feat-offline-mode',
        metadata: { title: 'Offline-First & IndexedDB Persistence', category: 'architecture' },
        text: 'When your network connection drops, iMessage switches to Offline-First mode seamlessly. Messages and files are saved to an IndexedDB local outbox queue. The moment your connection is restored, the queue automatically flushes and synchronizes all pending messages over Socket.io and REST without data loss.',
      },
      {
        id: 'feat-news-feed',
        metadata: { title: 'Curated News Feed', category: 'news' },
        text: 'The News Feed tab brings real-time breaking news directly into iMessage. Filter by World, Technology, Sports, Education, Science, Entertainment, Business, or Health. Click "Share to Chat" on any news article to send a rich card preview directly into your active conversation.',
      },
      {
        id: 'feat-translate',
        metadata: { title: 'Multi-Language Translation', category: 'language' },
        text: 'iMessage supports real-time translation across 15 global languages: English, Hindi, Spanish, French, Arabic, Chinese, Japanese, Korean, German, Portuguese, Russian, Italian, Tamil, Telugu, and Bengali. Automatic script and language detection lets you communicate seamlessly across international borders.',
      },
      {
        id: 'feat-media-viewer',
        metadata: { title: 'Rich Media Viewer Modal', category: 'multimedia' },
        text: 'Click any photo, video, or document to launch the full-screen Media Viewer. Features include pinch/button zoom and pan, video playback controls, PDF and spreadsheet document preview, previous/next media navigation, and one-click download and share actions.',
      },
      {
        id: 'guide-how-to-encrypt',
        metadata: { title: 'How to verify message encryption', category: 'how-to' },
        text: 'Look for the green lock badge "E2EE AES-GCM" in the chat header. Every chat displays an encryption handshake notice. You can verify your public key fingerprint in Settings > Security. Messages are decrypted only on recipient devices with their derived shared secret.',
      },
      {
        id: 'guide-how-to-switch-users',
        metadata: { title: 'How to switch users for testing', category: 'how-to' },
        text: 'Use the "Switch User" button located in the sidebar banner below your profile avatar. This instantly toggles between test personas (e.g., Alex Vance DevOps Lead and Sarah Chen Security Architect) to test two-way encrypted conversations without logging out.',
      },
      {
        id: 'guide-how-to-use-bot',
        metadata: { title: 'How to use the In-App AI Helper Bot', category: 'how-to' },
        text: 'Click the Bot tab or conversation to open the AI Assistant. Tap quick action chips such as "App Help", "Translate", "News", or "Study Tips", or ask open-ended questions like "How do I share code?" or "Translate Hello to Spanish".',
      },
      {
        id: 'faq-dark-mode',
        metadata: { title: 'Dark Mode and Theme Settings', category: 'faq' },
        text: 'Toggle between WhatsApp dark mode and light theme by clicking the Sun/Moon icon in the sidebar header. The app automatically respects your system OS preference and saves your choice in local storage.',
      },
    ];

    for (const doc of docs) {
      this.addDocument(doc.id, doc.text, doc.metadata);
    }
  }
}

// Export singleton instance for app-wide use
export const rag = new RAGEngine();
export default rag;
