/**
 * DolphinCoder LMS - Stage Sanitizer Utility
 * Filters out challenge formats that are blank, incomplete, or lack essential challenge tokens.
 * Guarantees that mobile and web clients only receive active, valid challenges.
 */

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
          const target = (p.target || p.german || p.word || '').toString().trim();
          const native = (p.native || p.english || p.translation || '').toString().trim();
          return target.length > 0 && native.length > 0;
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
        const target = (raw.targetSentence || '').toString().trim();
        const tokens = Array.isArray(raw.tokens)
          ? raw.tokens.map(t => t.toString().trim()).filter(Boolean)
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
          const text = (o.text || o.word || '').toString().trim();
          const img = (o.imageUrl || o.image || '').toString().trim();
          return text.length > 0 || img.length > 0;
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
        const sentence = (raw.sentence || raw.prompt || '').toString().trim();
        const blank = (raw.blank || raw.target || raw.correctOption || raw.correctAnswer || raw.answer || '').toString().trim();
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
        const target = (raw.targetSentence || '').toString().trim();
        const tokens = Array.isArray(raw.tokens)
          ? raw.tokens.map(t => t.toString().trim()).filter(Boolean)
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
        const target = (raw.target || raw.targetWord || raw.word || raw.correctAnswer || '').toString().trim();
        const prompt = (raw.prompt || raw.sentence || '').toString().trim();
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
        const message = (raw.partnerMessage || raw.message || raw.prompt || '').toString().trim();
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
        const sentence = (raw.spokenGerman || raw.sentence || raw.targetSentence || raw.question || raw.prompt || '').toString().trim();
        const options = Array.isArray(raw.options) ? raw.options.filter(o => {
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
        const prompt = (raw.prompt || '').toString().trim();
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
        const story = (raw.storyText || '').toString().trim();
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

module.exports = { sanitizeLessonStages };
