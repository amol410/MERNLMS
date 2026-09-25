/**
 * downloadKaraokeTemplate.js
 * Downloads a sample JSON template for creating frame-perfect, millisecond-accurate Karaoke notes.
 */

export function downloadKaraokeTemplate() {
  const template = {
    title: "Die Schildkröte und der Hase",
    englishTitle: "The Tortoise and the Hare",
    subject: "German",
    topic: "Reading Practice",
    duration: 42.35,
    sentences: [
      {
        index: 0,
        text: "Es war einmal eine kleine Schildkröte und ein schneller Hase.",
        translation: "Once upon a time there was a little tortoise and a fast hare.",
        start: 0.0,
        end: 3.41,
        words: [
          { word: "Es", clean: "Es", start: 0.0, end: 0.13, sentenceIndex: 0 },
          { word: "war", clean: "war", start: 0.13, end: 0.33, sentenceIndex: 0 },
          { word: "einmal", clean: "einmal", start: 0.33, end: 0.72, sentenceIndex: 0 },
          { word: "eine", clean: "eine", start: 0.72, end: 0.98, sentenceIndex: 0 },
          { word: "kleine", clean: "kleine", start: 0.98, end: 1.37, sentenceIndex: 0 },
          { word: "Schildkröte", clean: "Schildkröte", start: 1.37, end: 2.09, sentenceIndex: 0 },
          { word: "und", clean: "und", start: 2.09, end: 2.29, sentenceIndex: 0 },
          { word: "ein", clean: "ein", start: 2.29, end: 2.49, sentenceIndex: 0 },
          { word: "schneller", clean: "schneller", start: 2.49, end: 3.08, sentenceIndex: 0 },
          { word: "Hase.", clean: "Hase", start: 3.08, end: 3.41, sentenceIndex: 0 }
        ]
      },
      {
        index: 1,
        text: "Der Hase lachte oft über die langsame Schildkröte.",
        translation: "The hare often laughed at the slow tortoise.",
        start: 3.85,
        end: 6.76,
        words: [
          { word: "Der", clean: "Der", start: 3.85, end: 4.05, sentenceIndex: 1 },
          { word: "Hase", clean: "Hase", start: 4.05, end: 4.45, sentenceIndex: 1 },
          { word: "lachte", clean: "lachte", start: 4.45, end: 4.88, sentenceIndex: 1 },
          { word: "oft", clean: "oft", start: 4.88, end: 5.15, sentenceIndex: 1 },
          { word: "über", clean: "über", start: 5.15, end: 5.42, sentenceIndex: 1 },
          { word: "die", clean: "die", start: 5.42, end: 5.65, sentenceIndex: 1 },
          { word: "langsame", clean: "langsame", start: 5.65, end: 6.12, sentenceIndex: 1 },
          { word: "Schildkröte.", clean: "Schildkröte", start: 6.12, end: 6.76, sentenceIndex: 1 }
        ]
      }
    ],
    vocab: {
      "Schildkröte": "tortoise / turtle",
      "Hase": "hare / rabbit",
      "schneller": "faster",
      "langsame": "slow",
      "lachte": "laughed"
    }
  };

  const jsonStr = JSON.stringify(template, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'karaoke_story_template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Normalizes any uploaded JSON object so that it complies with the KaraokeNoteReader expectations
 */
export function normalizeKaraokeJson(parsed, fallbackAudioUrl = null) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON format: file must contain a valid JSON object.');
  }

  const rawSentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
  if (rawSentences.length === 0) {
    throw new Error('JSON must contain a "sentences" array with at least one sentence.');
  }

  const allWords = [];
  const normalizedSentences = rawSentences.map((s, sIdx) => {
    const sStart = typeof s.start === 'number' ? s.start : 0;
    const sEnd = typeof s.end === 'number' ? s.end : (sStart + 3.0);
    const sText = s.text || '';
    const sTranslation = s.translation || '';

    let sWords = [];
    if (Array.isArray(s.words) && s.words.length > 0) {
      sWords = s.words.map((w) => {
        const cleanWord = w.clean || w.word?.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '') || '';
        const wordObj = {
          word: w.word || '',
          clean: cleanWord,
          start: typeof w.start === 'number' ? w.start : sStart,
          end: typeof w.end === 'number' ? w.end : sEnd,
          sentenceIndex: sIdx,
        };
        allWords.push(wordObj);
        return wordObj;
      });
    } else {
      // Auto-split sentence text into words if words array was omitted
      const tokens = sText.split(/\s+/).filter(Boolean);
      const span = Math.max(sEnd - sStart, 0.5);
      const step = span / Math.max(tokens.length, 1);
      tokens.forEach((t, tIdx) => {
        const wStart = parseFloat((sStart + tIdx * step).toFixed(2));
        const wEnd = parseFloat((wStart + step).toFixed(2));
        const cleanWord = t.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '');
        const wordObj = {
          word: t,
          clean: cleanWord,
          start: wStart,
          end: wEnd,
          sentenceIndex: sIdx,
        };
        sWords.push(wordObj);
        allWords.push(wordObj);
      });
    }

    return {
      index: sIdx,
      text: sText,
      translation: sTranslation,
      start: sStart,
      end: sEnd,
      words: sWords,
    };
  });

  // Calculate duration if not provided
  let calculatedDuration = parsed.duration;
  if (!calculatedDuration || isNaN(calculatedDuration)) {
    const lastSentence = normalizedSentences[normalizedSentences.length - 1];
    calculatedDuration = lastSentence ? lastSentence.end + 1.0 : 45;
  }

  return {
    title: parsed.title || 'Karaoke Story',
    englishTitle: parsed.englishTitle || '',
    subject: parsed.subject || 'German',
    topic: parsed.topic || 'Reading Practice',
    duration: parseFloat(calculatedDuration),
    sentences: normalizedSentences,
    words: allWords,
    vocab: parsed.vocab && typeof parsed.vocab === 'object' ? parsed.vocab : {},
    audioUrl: parsed.audioUrl || fallbackAudioUrl || null,
  };
}
