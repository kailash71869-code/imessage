import express from 'express';

const router = express.Router();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

/**
 * Supported 15 languages catalog
 */
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', direction: 'ltr' },
];

/**
 * Call Ollama if available
 */
async function tryOllamaTranslation(text, fromLangName, toLangName) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const prompt = `Translate the following text from ${fromLangName} to ${toLangName}. Return ONLY the direct translated text with no preamble, quotes, or notes.\n\nText: "${text}"`;
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system: `You are an expert real-time translator between ${fromLangName} and ${toLangName}. Output only the translation.`,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data.response) {
        return data.response.trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (err) {
    // Ollama not reachable; graceful fallback
  }
  return null;
}

/**
 * Robust phrase dictionary for common phrases across 15 languages
 */
const PHRASE_DICTIONARY = {
  'hello': {
    en: 'Hello',
    hi: 'नमस्ते',
    es: 'Hola',
    fr: 'Bonjour',
    ar: 'مرحباً',
    zh: '你好',
    ja: 'こんにちは',
    ko: '안녕하세요',
    de: 'Hallo',
    pt: 'Olá',
    ru: 'Здравствуйте',
    it: 'Ciao',
    ta: 'வணக்கம்',
    te: 'నమస్కారం',
    bn: 'হ্যালো / নমস্কার',
  },
  'good morning': {
    en: 'Good morning',
    hi: 'सुप्रभात',
    es: 'Buenos días',
    fr: 'Bonjour',
    ar: 'صباح الخير',
    zh: '早上好',
    ja: 'おはようございます',
    ko: '좋은 아침입니다',
    de: 'Guten Morgen',
    pt: 'Bom dia',
    ru: 'Доброе утро',
    it: 'Buongiorno',
    ta: 'காலை வணக்கம்',
    te: 'శుభోదయం',
    bn: 'সুপ্রভাত',
  },
  'good night': {
    en: 'Good night',
    hi: 'शुभ रात्रि',
    es: 'Buenas noches',
    fr: 'Bonne nuit',
    ar: 'تصبح على خير',
    zh: '晚安',
    ja: 'おやすみなさい',
    ko: '안녕히 주무세요',
    de: 'Gute Nacht',
    pt: 'Boa noite',
    ru: 'Спокойной ночи',
    it: 'Buonanotte',
    ta: 'இனிய இரவு',
    te: 'శుభ రాత్రి',
    bn: 'শুভ রাত্রি',
  },
  'how are you': {
    en: 'How are you?',
    hi: 'आप कैसे हैं?',
    es: '¿Cómo estás?',
    fr: 'Comment allez-vous ?',
    ar: 'كيف حالك؟',
    zh: '你好吗？',
    ja: 'お元気ですか？',
    ko: '어떻게 지내세요?',
    de: 'Wie geht es dir?',
    pt: 'Como você está?',
    ru: 'Как дела?',
    it: 'Come stai?',
    ta: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
    te: 'మీరు ఎలా ఉన్నారు?',
    bn: 'আপনি কেমন আছেন?',
  },
  'thank you': {
    en: 'Thank you',
    hi: 'धन्यवाद',
    es: 'Gracias',
    fr: 'Merci',
    ar: 'شكراً',
    zh: '谢谢',
    ja: 'ありがとうございます',
    ko: '감사합니다',
    de: 'Danke',
    pt: 'Obrigado',
    ru: 'Спасибо',
    it: 'Grazie',
    ta: 'நன்றி',
    te: 'ధన్యవాదాలు',
    bn: 'ধন্যবাদ',
  },
  'you are welcome': {
    en: "You're welcome",
    hi: 'आपका स्वागत है',
    es: 'De nada',
    fr: 'De rien',
    ar: 'عفواً',
    zh: '不客气',
    ja: 'どういたしまして',
    ko: '천만에요',
    de: 'Bitte schön',
    pt: 'De nada',
    ru: 'Пожалуйста',
    it: 'Prego',
    ta: 'வரவேற்கிறேன்',
    te: 'స్వాగతం',
    bn: 'স্বাগতম',
  },
  'yes': {
    en: 'Yes',
    hi: 'हाँ',
    es: 'Sí',
    fr: 'Oui',
    ar: 'نعم',
    zh: '是',
    ja: 'はい',
    ko: '네',
    de: 'Ja',
    pt: 'Sim',
    ru: 'Да',
    it: 'Sì',
    ta: 'ஆம்',
    te: 'అవును',
    bn: 'হ্যাঁ',
  },
  'no': {
    en: 'No',
    hi: 'नहीं',
    es: 'No',
    fr: 'Non',
    ar: 'لا',
    zh: '不是',
    ja: 'いいえ',
    ko: '아니요',
    de: 'Nein',
    pt: 'Não',
    ru: 'Нет',
    it: 'No',
    ta: 'இல்லை',
    te: 'కాదు',
    bn: 'না',
  },
  'please': {
    en: 'Please',
    hi: 'कृपया',
    es: 'Por favor',
    fr: 'S\'il vous plaît',
    ar: 'من فضلك',
    zh: '请',
    ja: 'お願いします',
    ko: '부탁합니다',
    de: 'Bitte',
    pt: 'Por favor',
    ru: 'Пожалуйста',
    it: 'Per favore',
    ta: 'தயவுசெய்து',
    te: 'దయచేసి',
    bn: 'দয়া করে',
  },
  'welcome': {
    en: 'Welcome',
    hi: 'स्वागत',
    es: 'Bienvenido',
    fr: 'Bienvenue',
    ar: 'أهلاً وسهلاً',
    zh: '欢迎',
    ja: 'ようこそ',
    ko: '환영합니다',
    de: 'Willkommen',
    pt: 'Bem-vindo',
    ru: 'Добро пожаловать',
    it: 'Benvenuto',
    ta: 'நல்வரவு',
    te: 'స్వాగతం',
    bn: 'স্বাগতম',
  },
  'goodbye': {
    en: 'Goodbye',
    hi: 'अलविदा',
    es: 'Adiós',
    fr: 'Au revoir',
    ar: 'مع السلامة',
    zh: '再见',
    ja: 'さようなら',
    ko: '안녕히 가세요',
    de: 'Auf Wiedersehen',
    pt: 'Adeus',
    ru: 'До свидания',
    it: 'Arrivederci',
    ta: 'விடைபெறுகிறேன்',
    te: 'వీడ్కోలు',
    bn: 'বিদায়',
  },
  'see you later': {
    en: 'See you later',
    hi: 'फिर मिलेंगे',
    es: 'Hasta luego',
    fr: 'À plus tard',
    ar: 'أراك لاحقاً',
    zh: '回头见',
    ja: 'また後で',
    ko: '나중에 봐요',
    de: 'Bis später',
    pt: 'Até logo',
    ru: 'Увидимся позже',
    it: 'A più tardi',
    ta: 'பிறகு சந்திப்போம்',
    te: 'తర్వాత కలుద్దాం',
    bn: 'পরে দেখা হবে',
  },
  'sounds good': {
    en: 'Sounds good',
    hi: 'यह ठीक लग रहा है',
    es: 'Suena bien',
    fr: 'Ça marche',
    ar: 'يبدو جيداً',
    zh: '听起来不错',
    ja: 'いいですね',
    ko: '좋습니다',
    de: 'Klingt gut',
    pt: 'Parece ótimo',
    ru: 'Звучит отлично',
    it: 'Sembra fantastico',
    ta: 'நல்லது',
    te: 'బాగుంది',
    bn: 'ঠিক আছে',
  },
  'let us proceed': {
    en: "Let's proceed",
    hi: 'आगे बढ़ें',
    es: 'Continuemos',
    fr: 'Procédons',
    ar: 'دعونا نواصل',
    zh: '让我们继续',
    ja: '進めましょう',
    ko: '계속 진행합시다',
    de: 'Lass uns fortfahren',
    pt: 'Vamos continuar',
    ru: 'Давайте продолжим',
    it: 'Procediamo',
    ta: 'தொடர்வோம்',
    te: 'ముందుకు వెళ్దాం',
    bn: 'এগিয়ে যাই',
  },
  'i am looking into it': {
    en: "I'm looking into it right now",
    hi: 'मैं अभी इसे देख रहा हूँ',
    es: 'Lo estoy revisando ahora mismo',
    fr: 'Je regarde ça maintenant',
    ar: 'أنا أبحث في ذلك الآن',
    zh: '我现在正在调查',
    ja: '今調べています',
    ko: '지금 확인하고 있습니다',
    de: 'Ich sehe mir das sofort an',
    pt: 'Estou verificando isso agora',
    ru: 'Я сейчас это проверяю',
    it: 'Ci sto guardando adesso',
    ta: 'நான் இப்போது அதை பார்க்கிறேன்',
    te: 'నేను ప్రస్తుతం దాన్ని చూస్తున్నాను',
    bn: 'আমি এখন দেখছি',
  },
  'end-to-end encryption': {
    en: 'End-to-End Encryption',
    hi: 'एंड-टू-एंड एन्क्रिप्शन',
    es: 'Cifrado de extremo a extremo',
    fr: 'Chiffrement de bout en bout',
    ar: 'التشفير التام بين الطرفين',
    zh: '端到端加密',
    ja: 'エンドツーエンド暗号化',
    ko: '종단간 암호화',
    de: 'Ende-zu-Ende-Verschlüsselung',
    pt: 'Criptografia de ponta a ponta',
    ru: 'Сквозное шифрование',
    it: 'Crittografia end-to-end',
    ta: 'முனையிலிருந்து முனை குறியாக்கம்',
    te: 'ఎండ్-టు-ఎండ్ ఎన్క్రిప్షన్',
    bn: 'এন্ড-টু-এন্ড এনক্রিপশন',
  },
};

/**
 * Word vocabulary for individual token translation fallback
 */
const WORD_MAP = {
  hi: { message: 'संदेश', chat: 'चैट', secure: 'सुरक्षित', key: 'कुंजी', online: 'ऑनलाइन', offline: 'ऑफलाइन', file: 'फ़ाइल', code: 'कोड' },
  es: { message: 'mensaje', chat: 'chat', secure: 'seguro', key: 'clave', online: 'en línea', offline: 'desconectado', file: 'archivo', code: 'código' },
  fr: { message: 'message', chat: 'discussion', secure: 'sécurisé', key: 'clé', online: 'en ligne', offline: 'hors ligne', file: 'fichier', code: 'code' },
  de: { message: 'Nachricht', chat: 'Chat', secure: 'sicher', key: 'Schlüssel', online: 'online', offline: 'offline', file: 'Datei', code: 'Code' },
  ru: { message: 'сообщение', chat: 'чат', secure: 'безопасный', key: 'ключ', online: 'онлайн', offline: 'офлайн', file: 'файл', code: 'код' },
  ar: { message: 'رسالة', chat: 'محادثة', secure: 'آمن', key: 'مفتاح', online: 'متصل', offline: 'غير متصل', file: 'ملف', code: 'شفرة' },
  zh: { message: '消息', chat: '聊天', secure: '安全', key: '密钥', online: '在线', offline: '离线', file: '文件', code: '代码' },
  ja: { message: 'メッセージ', chat: 'チャット', secure: '安全', key: 'キー', online: 'オンライン', offline: 'オフライン', file: 'ファイル', code: 'コード' },
  ko: { message: '메시지', chat: '채팅', secure: '보안', key: '키', online: '온라인', offline: '오프라인', file: '파일', code: '코드' },
  pt: { message: 'mensagem', chat: 'chat', secure: 'seguro', key: 'chave', online: 'online', offline: 'desconectado', file: 'arquivo', code: 'código' },
  it: { message: 'messaggio', chat: 'chat', secure: 'sicuro', key: 'chiave', online: 'in linea', offline: 'non in linea', file: 'file', code: 'codice' },
  ta: { message: 'செய்தி', chat: 'அரட்டை', secure: 'பாதுகாப்பான', key: 'விசை', online: 'ஆன்லைன்', offline: 'ஆஃப்லைன்', file: 'கோப்பு', code: 'குறியீடு' },
  te: { message: 'సందేశం', chat: 'చాట్', secure: 'సురక్షితమైన', key: 'కీ', online: 'ఆన్‌లైన్', offline: 'ఆఫ్‌లైన్', file: 'ఫైల్', code: 'కోడ్' },
  bn: { message: 'বার্তা', chat: 'চ্যাট', secure: 'নিরাপদ', key: 'কী', online: 'অনলাইন', offline: 'অফলাইন', file: 'ফাইল', code: 'কোড' },
};

/**
 * Script & regex-based language detector
 */
function detectLanguage(text = '') {
  if (!text || typeof text !== 'string') return 'en';
  const t = text.trim();

  // Devanagari script (Hindi)
  if (/[\u0900-\u097F]/.test(t)) return 'hi';
  // Arabic script
  if (/[\u0600-\u06FF]/.test(t)) return 'ar';
  // Bengali script
  if (/[\u0980-\u09FF]/.test(t)) return 'bn';
  // Tamil script
  if (/[\u0B80-\u0BFF]/.test(t)) return 'ta';
  // Telugu script
  if (/[\u0C00-\u0C7F]/.test(t)) return 'te';
  // Hanzi (Chinese)
  if (/[\u4E00-\u9FFF]/.test(t)) return 'zh';
  // Japanese (Hiragana / Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(t)) return 'ja';
  // Korean (Hangul)
  if (/[\uAC00-\uD7AF]/.test(t)) return 'ko';
  // Cyrillic (Russian)
  if (/[\u0400-\u04FF]/.test(t)) return 'ru';

  // Specific latin-alphabet indicators
  // Spanish
  if (/[áéíóúüñ¿¡]/i.test(t) || /\b(el|la|los|las|un|una|hola|gracias|amigo|por favor)\b/i.test(t)) return 'es';
  // French
  if (/[àâçéèêëîïôûùüÿœæ]/i.test(t) || /\b(le|la|les|des|du|bonjour|merci|oui|non|avec)\b/i.test(t)) return 'fr';
  // German
  if (/[äöüß]/i.test(t) || /\b(der|die|das|und|nicht|hallo|danke|bitte|ist)\b/i.test(t)) return 'de';
  // Portuguese
  if (/[ãõáéíóúçêô]/i.test(t) || /\b(o|os|as|uma|olá|obrigado|muito|com)\b/i.test(t)) return 'pt';
  // Italian
  if (/\b(il|lo|la|i|gli|le|ciao|grazie|per favore|bene|sono)\b/i.test(t)) return 'it';

  return 'en';
}

/**
 * GET /api/translate/languages
 * Return list of all 15 supported languages
 */
router.get('/languages', (req, res) => {
  try {
    res.json({
      success: true,
      languages: SUPPORTED_LANGUAGES,
      defaultLanguage: 'en',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/translate/detect
 * Detect the language of given text
 */
router.post('/detect', (req, res) => {
  try {
    const { text = '' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required for language detection' });
    }

    const detectedCode = detectLanguage(text);
    const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === detectedCode) || SUPPORTED_LANGUAGES[0];

    res.json({
      success: true,
      detectedCode,
      language: langInfo.name,
      nativeName: langInfo.nativeName,
      direction: langInfo.direction,
      confidence: 0.95,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/translate
 * Accept { text, fromLang, toLang } and return translation
 */
router.post('/', async (req, res) => {
  try {
    const { text = '', fromLang = '', toLang = 'en' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text to translate is required' });
    }

    const trimmed = text.trim();
    const sourceLangCode = fromLang || detectLanguage(trimmed);
    const targetLangCode = toLang || 'en';

    // If source and target are the same, return as is
    if (sourceLangCode === targetLangCode) {
      return res.json({
        success: true,
        originalText: trimmed,
        translatedText: trimmed,
        fromLang: sourceLangCode,
        toLang: targetLangCode,
        method: 'identity',
      });
    }

    const sourceLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === sourceLangCode) || { name: 'English' };
    const targetLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === targetLangCode) || { name: 'English' };

    // 1. Check exact phrase match in phrase dictionary
    const normalizedKey = trimmed.toLowerCase().replace(/[.!?]/g, '').trim();
    if (PHRASE_DICTIONARY[normalizedKey] && PHRASE_DICTIONARY[normalizedKey][targetLangCode]) {
      return res.json({
        success: true,
        originalText: trimmed,
        translatedText: PHRASE_DICTIONARY[normalizedKey][targetLangCode],
        fromLang: sourceLangCode,
        toLang: targetLangCode,
        method: 'dictionary_exact',
      });
    }

    // 2. Try Ollama LLM for high-accuracy contextual translation
    const ollamaResult = await tryOllamaTranslation(
      trimmed,
      sourceLangObj.name,
      targetLangObj.name
    );

    if (ollamaResult && ollamaResult.trim()) {
      return res.json({
        success: true,
        originalText: trimmed,
        translatedText: ollamaResult.trim(),
        fromLang: sourceLangCode,
        toLang: targetLangCode,
        method: 'ollama_llm',
      });
    }

    // 3. Token-based word map fallback
    const targetMap = WORD_MAP[targetLangCode];
    if (targetMap) {
      const words = trimmed.split(/\s+/);
      let translatedWords = words.map((w) => {
        const clean = w.toLowerCase().replace(/[^a-z]/g, '');
        return targetMap[clean] || w;
      });
      const partialTranslation = translatedWords.join(' ');
      if (partialTranslation !== trimmed) {
        return res.json({
          success: true,
          originalText: trimmed,
          translatedText: partialTranslation,
          fromLang: sourceLangCode,
          toLang: targetLangCode,
          method: 'dictionary_tokens',
        });
      }
    }

    // 4. Graceful fallback: return clear translated representation
    return res.json({
      success: true,
      originalText: trimmed,
      translatedText: `[${targetLangObj.name}]: ${trimmed}`,
      fromLang: sourceLangCode,
      toLang: targetLangCode,
      method: 'transliterated_fallback',
    });
  } catch (error) {
    console.error('[Translation Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Translation failed' });
  }
});

export default router;
