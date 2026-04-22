/**
 * Arabic NLP Tools
 * Provides dialect detection, sentiment analysis, entity extraction, and morphological analysis.
 */

// Arabic dialect patterns (simplified — for production, use CAMeL Tools or similar)
const dialectPatterns = {
  gulf: {
    markers: ['يبي', 'وايد', 'شلون', 'زين', 'يالله', 'حيل', 'خوش', 'اشلون', 'ليش', 'هالحين', 'عاد', 'يعني'],
    countries: ['KW', 'SA', 'AE', 'BH', 'QA', 'OM'],
  },
  egyptian: {
    markers: ['ازيك', 'كده', 'فين', 'عايز', 'بتاع', 'دي', 'يعم', 'ايوه', 'ماشي', 'خالص'],
    countries: ['EG'],
  },
  levantine: {
    markers: ['كيفك', 'هلق', 'منيح', 'شو', 'هيك', 'كتير', 'بعدين', 'يلا'],
    countries: ['SY', 'LB', 'JO', 'PS'],
  },
  maghrebi: {
    markers: ['واش', 'كيفاش', 'بزاف', 'هذا', 'ديال', 'نتاع', 'غادي'],
    countries: ['MA', 'DZ', 'TN', 'LY'],
  },
  msa: {
    markers: ['إن', 'الذي', 'التي', 'حيث', 'لكن', 'بالتالي', 'علاوة', 'فضلاً'],
    countries: [],
  },
};

// Sentiment lexicon (Arabic)
const positiveLexicon = [
  'ممتاز', 'رائع', 'جميل', 'سعيد', 'نجاح', 'فوز', 'تطور', 'إنجاز', 'تقدم', 'أفضل',
  'حب', 'شكر', 'مبارك', 'خير', 'بركة', 'فرح', 'أمل', 'ثقة', 'قوة', 'نمو',
  'excellent', 'great', 'good', 'happy', 'success',
];

const negativeLexicon = [
  'سيء', 'فشل', 'مشكلة', 'خسارة', 'أزمة', 'خطر', 'تراجع', 'انخفاض', 'ضعف', 'قلق',
  'حزن', 'غضب', 'رفض', 'كره', 'عقوبة', 'غرامة', 'مخالفة', 'تأخير', 'ركود', 'تدهور',
  'bad', 'fail', 'problem', 'loss', 'crisis',
];

// Named entity patterns
const entityPatterns = {
  PERSON: {
    prefixes: ['السيد', 'السيدة', 'الأستاذ', 'الأستاذة', 'الدكتور', 'الدكتورة', 'المهندس', 'الشيخ', 'الأمير', 'الملك'],
  },
  ORG: {
    keywords: ['شركة', 'مؤسسة', 'هيئة', 'بنك', 'مصرف', 'جامعة', 'وزارة', 'مجلس', 'منظمة', 'جمعية', 'مجموعة'],
  },
  LOC: {
    keywords: ['مدينة', 'دولة', 'منطقة', 'محافظة', 'إمارة', 'حي', 'شارع', 'طريق'],
    known: ['الرياض', 'جدة', 'دبي', 'أبوظبي', 'الكويت', 'الدوحة', 'المنامة', 'مسقط', 'مكة', 'المدينة'],
  },
  MONEY: {
    pattern: /(\d[\d,.]*)\s*(ريال|درهم|دينار|دولار|يورو|SAR|AED|KWD|BHD|OMR|QAR|USD|EUR)/g,
  },
  DATE: {
    pattern: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/g,
  },
  PHONE: {
    pattern: /(\+?\d{1,3}[\s-]?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})/g,
  },
  EMAIL: {
    pattern: /[\w.-]+@[\w.-]+\.\w{2,}/g,
  },
};

/**
 * Detect Arabic dialect
 */
function detectDialect(text) {
  const scores = {};
  for (const [dialect, info] of Object.entries(dialectPatterns)) {
    scores[dialect] = 0;
    for (const marker of info.markers) {
      if (text.includes(marker)) scores[dialect]++;
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const topDialect = sorted[0];

  if (topDialect[1] === 0) {
    // Check if it's mostly Arabic characters
    const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    if (arabicChars / totalChars > 0.5) {
      return { dialect: 'msa', confidence: 0.4, reason: 'No dialect markers detected, defaulting to MSA' };
    }
    return { dialect: 'unknown', confidence: 0, reason: 'Text does not appear to be primarily Arabic' };
  }

  return {
    dialect: topDialect[0],
    confidence: Math.min(0.95, 0.3 + topDialect[1] * 0.15),
    countries: dialectPatterns[topDialect[0]].countries,
    markers_found: sorted.filter(s => s[1] > 0).map(s => ({ dialect: s[0], score: s[1] })),
  };
}

/**
 * Simple sentiment analysis
 */
function analyzeSentiment(text) {
  let positive = 0;
  let negative = 0;

  for (const word of positiveLexicon) {
    if (text.includes(word)) positive++;
  }
  for (const word of negativeLexicon) {
    if (text.includes(word)) negative++;
  }

  const total = positive + negative;
  if (total === 0) return { sentiment: 'neutral', score: 0, confidence: 0.3 };

  const score = (positive - negative) / total;
  return {
    sentiment: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
    score: Math.round(score * 100) / 100,
    confidence: Math.min(0.85, 0.3 + total * 0.1),
    positive_matches: positive,
    negative_matches: negative,
  };
}

/**
 * Extract keywords from Arabic text
 */
function extractKeywords(text) {
  // Remove common Arabic stop words
  const stopWords = new Set([
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك',
    'التي', 'الذي', 'هو', 'هي', 'هم', 'نحن', 'أنت', 'أنا', 'كان', 'كانت',
    'يكون', 'لا', 'لم', 'لن', 'قد', 'ما', 'أو', 'و', 'ثم', 'بل', 'لكن',
    'أن', 'إن', 'حتى', 'إذا', 'عند', 'بعد', 'قبل', 'بين', 'فوق', 'تحت',
  ]);

  const words = text.split(/[\s,.،؛:!؟?()[\]{}]+/).filter(w => w.length > 2);
  const freq = {};

  for (const word of words) {
    const clean = word.replace(/^(ال|و|ف|ب|ل|ك)/, '');
    if (!stopWords.has(word) && !stopWords.has(clean) && clean.length > 2) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, frequency: count }));
}

/**
 * Main text analysis function
 */
export async function analyzeArabicText({ text, analyses }) {
  const result = { text_length: text.length, word_count: text.split(/\s+/).length };

  if (analyses.includes('dialect')) {
    result.dialect = detectDialect(text);
  }
  if (analyses.includes('sentiment')) {
    result.sentiment = analyzeSentiment(text);
  }
  if (analyses.includes('entities')) {
    result.entities = extractEntitiesFromText(text);
  }
  if (analyses.includes('keywords')) {
    result.keywords = extractKeywords(text);
  }
  if (analyses.includes('morphology')) {
    result.morphology = {
      note: 'Full morphological analysis requires CAMeL Tools integration. Basic analysis provided.',
      arabic_char_ratio: (text.match(/[\u0600-\u06FF]/g) || []).length / text.replace(/\s/g, '').length,
      has_diacritics: /[\u064B-\u065F]/.test(text),
      has_tatweel: /\u0640/.test(text),
    };
  }

  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

/**
 * Internal entity extraction
 */
function extractEntitiesFromText(text, filterTypes) {
  const entities = [];

  // Pattern-based extraction
  for (const [type, config] of Object.entries(entityPatterns)) {
    if (filterTypes && !filterTypes.includes(type)) continue;

    if (config.pattern) {
      const matches = [...text.matchAll(config.pattern)];
      for (const match of matches) {
        entities.push({ type, value: match[0], position: match.index });
      }
    }

    if (config.prefixes) {
      for (const prefix of config.prefixes) {
        const regex = new RegExp(`${prefix}\\s+([\\u0600-\\u06FF]+(?:\\s+[\\u0600-\\u06FF]+)?)`, 'g');
        const matches = [...text.matchAll(regex)];
        for (const match of matches) {
          entities.push({ type, value: `${prefix} ${match[1]}`, position: match.index });
        }
      }
    }

    if (config.keywords) {
      for (const keyword of config.keywords) {
        const regex = new RegExp(`${keyword}\\s+([\\u0600-\\u06FF]+(?:\\s+[\\u0600-\\u06FF]+){0,3})`, 'g');
        const matches = [...text.matchAll(regex)];
        for (const match of matches) {
          entities.push({ type, value: `${keyword} ${match[1]}`, position: match.index });
        }
      }
    }

    if (config.known) {
      for (const place of config.known) {
        if (text.includes(place)) {
          entities.push({ type, value: place, position: text.indexOf(place) });
        }
      }
    }
  }

  return entities.sort((a, b) => a.position - b.position);
}

/**
 * Exported entity extraction (tool entry point)
 */
export async function extractEntities({ text, entity_types }) {
  const entities = extractEntitiesFromText(text, entity_types);
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total_entities: entities.length,
        entities,
        filtered_by: entity_types || 'all',
      }, null, 2),
    }],
  };
}
