/**
 * DolphinCoder LMS - Stage Sanitizer Utility
 * Filters out challenge formats that are blank, incomplete, or lack essential challenge tokens.
 * Validates schemas and prevents payload/script injections in modular stages JSON.
 * Guarantees that mobile and web clients only receive active, valid challenges.
 */

function cleanScriptTags(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
}

/**
 * Validates challenge schemas before database writes.
 * Rejects malformed stages with descriptive error messages.
 * @param {Array|string} stages 
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function validateLessonStages(stages) {
  if (!stages) return { isValid: true, errors: [] };
  let parsedStages = stages;
  if (typeof stages === 'string') {
    try {
      parsedStages = JSON.parse(stages);
    } catch (_) {
      return { isValid: false, errors: ['Malformed JSON in stages payload'] };
    }
  }
  if (!Array.isArray(parsedStages)) {
    return { isValid: false, errors: ['Stages must be an array'] };
  }

  const errors = [];

  parsedStages.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') {
      errors.push(`Stage ${idx}: must be a valid JSON object`);
      return;
    }
    const type = raw.type?.toString()?.trim();
    if (!type) {
      errors.push(`Stage ${idx}: missing required "type" field`);
      return;
    }

    switch (type) {
      case 'word_match':
      case 'match_pairs': {
        if (!Array.isArray(raw.pairs)) {
          errors.push(`Stage ${idx} (${type}): missing or invalid "pairs" array. Must have at least 2 word pairs.`);
          break;
        }
        const validPairs = raw.pairs.filter(p => {
          if (!p || typeof p !== 'object') return false;
          const target = (p.target || p.german || p.word || '').toString().trim();
          const native = (p.native || p.english || p.translation || '').toString().trim();
          return target.length > 0 && native.length > 0;
        });
        if (validPairs.length < 2) {
          errors.push(`Stage ${idx} (${type}): word_match requires at least 2 valid pairs (received ${validPairs.length})`);
        }
        break;
      }

      case 'picture_select':
      case 'picture_cards': {
        if (!Array.isArray(raw.options) || raw.options.length === 0) {
          errors.push(`Stage ${idx} (${type}): picture_select missing options array or options is empty`);
          break;
        }
        const validOptions = raw.options.filter(o => {
          if (!o || typeof o !== 'object') return false;
          const text = (o.text || o.word || '').toString().trim();
          const img = (o.imageUrl || o.image || '').toString().trim();
          return text.length > 0 || img.length > 0;
        });
        if (validOptions.length === 0) {
          errors.push(`Stage ${idx} (${type}): picture_select missing valid options (must contain text or imageUrl)`);
        }
        break;
      }

      case 'cloze_test':
      case 'cloze': {
        const sentence = (raw.sentence || raw.prompt || '').toString().trim();
        const blank = (raw.blank || raw.target || raw.correctOption || raw.correctAnswer || raw.answer || '').toString().trim();
        if (!sentence) {
          errors.push(`Stage ${idx} (${type}): cloze_test requires a non-empty sentence`);
        }
        if (!blank) {
          errors.push(`Stage ${idx} (${type}): cloze_test requires a non-empty blank`);
        }
        break;
      }

      case 'listen_tap': {
        const target = (raw.targetSentence || '').toString().trim();
        const tokens = Array.isArray(raw.tokens)
          ? raw.tokens.map(t => t.toString().trim()).filter(Boolean)
          : [];
        if (!target && tokens.length === 0) {
          errors.push(`Stage ${idx} (${type}): listen_tap requires targetSentence or tokens bank`);
        }
        break;
      }

      case 'sentence_builder': {
        const target = (raw.targetSentence || '').toString().trim();
        const tokens = Array.isArray(raw.tokens)
          ? raw.tokens.map(t => t.toString().trim()).filter(Boolean)
          : [];
        if (!target && tokens.length === 0) {
          errors.push(`Stage ${idx} (${type}): sentence_builder requires targetSentence or tokens`);
        }
        break;
      }

      case 'type_word':
      case 'type_input': {
        const target = (raw.target || raw.targetWord || raw.word || raw.correctAnswer || '').toString().trim();
        const prompt = (raw.prompt || raw.sentence || '').toString().trim();
        if (!target && !prompt) {
          errors.push(`Stage ${idx} (${type}): type_word requires target word or prompt`);
        }
        break;
      }

      case 'dialogue_bubble':
      case 'dialogue': {
        const message = (raw.partnerMessage || raw.message || raw.prompt || '').toString().trim();
        if (!message) {
          errors.push(`Stage ${idx} (${type}): dialogue_bubble requires partnerMessage`);
        }
        break;
      }

      case 'listen_select':
      case 'listen_comprehension': {
        const sentence = (raw.spokenGerman || raw.sentence || raw.targetSentence || raw.question || raw.prompt || '').toString().trim();
        const options = Array.isArray(raw.options) ? raw.options.filter(Boolean) : [];
        if (!sentence || options.length === 0) {
          errors.push(`Stage ${idx} (${type}): listen_select requires sentence and options`);
        }
        break;
      }

      case 'sprechen': {
        const prompt = (raw.prompt || '').toString().trim();
        if (!prompt) {
          errors.push(`Stage ${idx} (${type}): sprechen requires prompt`);
        }
        break;
      }

      case 'karaoke': {
        const story = (raw.storyText || '').toString().trim();
        const hasData = raw.karaokeData && (Array.isArray(raw.karaokeData.words) || Array.isArray(raw.karaokeData.sentences));
        if (!story && !hasData) {
          errors.push(`Stage ${idx} (${type}): karaoke requires storyText or karaokeData`);
        }
        break;
      }

      default:
        break;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function sanitizeLessonStages(stages) {
  if (!stages) return [];
  let parsedStages = stages;
  if (typeof stages === 'string') {
    try {
      parsedStages = JSON.parse(stages);
    } catch (_) {
      return [];
    }
  }
  if (!Array.isArray(parsedStages)) return [];

  const validStages = [];

  for (const raw of parsedStages) {
    if (!raw || typeof raw !== 'object') continue;
    const type = raw.type?.toString()?.trim();
    if (!type) continue;

    switch (type) {
      case 'word_match':
      case 'match_pairs': {
        if (!Array.isArray(raw.pairs) || raw.pairs.length === 0) continue;
        const validPairs = raw.pairs.filter(p => {
          if (!p || typeof p !== 'object') return false;
          const target = cleanScriptTags((p.target || p.german || p.word || '').toString());
          const native = cleanScriptTags((p.native || p.english || p.translation || '').toString());
          return target.length > 0 && native.length > 0;
        }).map(p => {
          const item = { ...p };
          if (item.target !== undefined) item.target = cleanScriptTags(item.target.toString());
          if (item.native !== undefined) item.native = cleanScriptTags(item.native.toString());
          if (item.german !== undefined) item.german = cleanScriptTags(item.german.toString());
          if (item.english !== undefined) item.english = cleanScriptTags(item.english.toString());
          if (item.word !== undefined) item.word = cleanScriptTags(item.word.toString());
          if (item.translation !== undefined) item.translation = cleanScriptTags(item.translation.toString());
          return item;
        });
        if (validPairs.length > 0) {
          validStages.push({
            ...raw,
            type: 'word_match',
            pairs: validPairs,
          });
        }
        break;
      }

      case 'listen_tap': {
        const target = cleanScriptTags((raw.targetSentence || '').toString());
        const tokens = Array.isArray(raw.tokens)
          ? raw.tokens.map(t => cleanScriptTags(t.toString())).filter(Boolean)
          : [];
        // Requires either a non-empty targetSentence or tokens bank
        if (target.length > 0 || tokens.length > 0) {
          validStages.push({
            ...raw,
            type: 'listen_tap',
            targetSentence: target,
            tokens: tokens.length > 0 ? tokens : (target ? target.split(/\s+/).filter(Boolean) : []),
          });
        }
        break;
      }

      case 'picture_select':
      case 'picture_cards': {
        if (!Array.isArray(raw.options) || raw.options.length === 0) continue;
        const validOptions = raw.options.filter(o => {
          if (!o || typeof o !== 'object') return false;
          const text = cleanScriptTags((o.text || o.word || '').toString());
          const img = cleanScriptTags((o.imageUrl || o.image || '').toString());
          return text.length > 0 || img.length > 0;
        }).map(o => {
          const item = { ...o };
          if (item.text !== undefined) item.text = cleanScriptTags(item.text.toString());
          if (item.word !== undefined) item.word = cleanScriptTags(item.word.toString());
          if (item.imageUrl !== undefined) item.imageUrl = cleanScriptTags(item.imageUrl.toString());
          if (item.image !== undefined) item.image = cleanScriptTags(item.image.toString());
          return item;
        });
        if (validOptions.length > 0) {
          validStages.push({
            ...raw,
            type: 'picture_select',
            options: validOptions,
          });
        }
        break;
      }

      case 'cloze_test':
      case 'cloze': {
        const sentence = cleanScriptTags((raw.sentence || raw.prompt || '').toString());
        const blank = cleanScriptTags((raw.blank || raw.target || raw.correctOption || raw.correctAnswer || raw.answer || '').toString());
        if (sentence.length > 0 && blank.length > 0) {
          validStages.push({
            ...raw,
            type: 'cloze_test',
            sentence,
            blank,
          });
        }
        break;
      }

      case 'sentence_builder': {
        const target = cleanScriptTags((raw.targetSentence || '').toString());
        const tokens = Array.isArray(raw.tokens)
          ? raw.tokens.map(t => cleanScriptTags(t.toString())).filter(Boolean)
          : [];
        if (target.length > 0 || tokens.length > 0) {
          validStages.push({
            ...raw,
            type: 'sentence_builder',
            targetSentence: target,
            tokens: tokens.length > 0 ? tokens : (target ? target.split(/\s+/).filter(Boolean) : []),
          });
        }
        break;
      }

      case 'type_word':
      case 'type_input': {
        const target = cleanScriptTags((raw.target || raw.targetWord || raw.word || raw.correctAnswer || '').toString());
        const prompt = cleanScriptTags((raw.prompt || raw.sentence || '').toString());
        if (target.length > 0 || prompt.length > 0) {
          validStages.push({
            ...raw,
            type: 'type_word',
            target,
            prompt,
          });
        }
        break;
      }

      case 'dialogue_bubble':
      case 'dialogue': {
        const message = cleanScriptTags((raw.partnerMessage || raw.message || raw.prompt || '').toString());
        if (message.length > 0) {
          validStages.push({
            ...raw,
            type: 'dialogue_bubble',
            partnerMessage: message,
          });
        }
        break;
      }

      case 'listen_select':
      case 'listen_comprehension': {
        const sentence = cleanScriptTags((raw.spokenGerman || raw.sentence || raw.targetSentence || raw.question || raw.prompt || '').toString());
        const options = Array.isArray(raw.options) ? raw.options.map(o => {
          if (!o) return '';
          if (typeof o === 'object') {
            return { ...o, text: cleanScriptTags((o.text || '').toString()) };
          }
          return cleanScriptTags(o.toString());
        }).filter(o => {
          if (!o) return false;
          const text = (typeof o === 'object' ? (o.text || '') : o).toString().trim();
          return text.length > 0;
        }) : [];
        if (sentence.length > 0 && options.length > 0) {
          validStages.push({
            ...raw,
            type: 'listen_select',
            sentence,
            options,
          });
        }
        break;
      }

      case 'sprechen': {
        const prompt = cleanScriptTags((raw.prompt || '').toString());
        if (prompt.length > 0) {
          validStages.push({
            ...raw,
            type: 'sprechen',
            prompt,
          });
        }
        break;
      }

      case 'karaoke': {
        const story = cleanScriptTags((raw.storyText || '').toString());
        const hasData = raw.karaokeData && (Array.isArray(raw.karaokeData.words) || Array.isArray(raw.karaokeData.sentences));
        if (story.length > 0 || hasData) {
          validStages.push({
            ...raw,
            type: 'karaoke',
          });
        }
        break;
      }

      default: {
        // Unknown or custom stages: keep if non-empty object
        if (Object.keys(raw).length > 1) {
          validStages.push(raw);
        }
        break;
      }
    }
  }

  return validStages;
}

module.exports = { sanitizeLessonStages, validateLessonStages, cleanScriptTags };

