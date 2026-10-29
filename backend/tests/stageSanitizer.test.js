const { sanitizeLessonStages } = require('../utils/stageSanitizer');

describe('sanitizeLessonStages Utility', () => {
    it('returns empty array when input is null, undefined, or empty', () => {
        expect(sanitizeLessonStages(null)).toEqual([]);
        expect(sanitizeLessonStages(undefined)).toEqual([]);
        expect(sanitizeLessonStages([])).toEqual([]);
        expect(sanitizeLessonStages('invalid json')).toEqual([]);
    });

    it('filters out stages with blank or missing critical content', () => {
        const inputStages = [
            // Blank word_match
            { type: 'word_match', pairs: [] },
            { type: 'word_match', pairs: [{ target: '   ', native: 'Hello' }] },
            // Blank listen_tap
            { type: 'listen_tap', targetSentence: '   ', tokens: [] },
            // Blank cloze_test
            { type: 'cloze_test', sentence: '', blank: '' },
            // Blank sentence_builder
            { type: 'sentence_builder', targetSentence: '   ', tokens: [] },
            // Blank type_word
            { type: 'type_word', target: '', prompt: '' },
            // Blank dialogue_bubble
            { type: 'dialogue_bubble', partnerMessage: '' },
            // Blank listen_select
            { type: 'listen_select', sentence: '', options: [] },
            // Blank sprechen
            { type: 'sprechen', prompt: '   ' },
            // Blank picture_select
            { type: 'picture_select', options: [] },
        ];

        const result = sanitizeLessonStages(inputStages);
        expect(result).toEqual([]);
    });

    it('preserves valid and active challenge formats', () => {
        const inputStages = [
            {
                type: 'word_match',
                pairs: [
                    { target: 'Hallo', native: 'Hello' },
                    { target: '   ', native: 'Invalid' }, // Should be filtered out
                ],
            },
            {
                type: 'sentence_builder',
                targetSentence: 'Ich bin Anna',
                tokens: ['Ich', 'bin', 'Anna'],
            },
            {
                type: 'sprechen',
                prompt: 'Guten Tag',
            },
        ];

        const result = sanitizeLessonStages(inputStages);
        expect(result.length).toBe(3);
        expect(result[0].type).toBe('word_match');
        expect(result[0].pairs).toEqual([{ target: 'Hallo', native: 'Hello' }]);
        expect(result[1].type).toBe('sentence_builder');
        expect(result[1].targetSentence).toBe('Ich bin Anna');
        expect(result[2].type).toBe('sprechen');
        expect(result[2].prompt).toBe('Guten Tag');
    });

    it('parses JSON stringified stages safely', () => {
        const stringified = JSON.stringify([
            { type: 'sprechen', prompt: 'Danke schön' },
            { type: 'listen_tap', targetSentence: '' },
        ]);
        const result = sanitizeLessonStages(stringified);
        expect(result.length).toBe(1);
        expect(result[0].type).toBe('sprechen');
    });
});
