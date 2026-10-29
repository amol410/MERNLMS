const { sanitizeLessonStages } = require('../utils/stageSanitizer');

describe('sanitizeLessonStages Utility', () => {
    it('returns empty array when input is null, undefined, or empty', () => {
        expect(sanitizeLessonStages(null)).toEqual([]);
        expect(sanitizeLessonStages(undefined)).toEqual([]);
        expect(sanitizeLessonStages([])).toEqual([]);
        expect(sanitizeLessonStages('invalid json')).toEqual([]);
    });

    it('filters out stages with blank or missing critical content for all 10 formats', () => {
        const inputStages = [
            // 1. Blank word_match
            { type: 'word_match', pairs: [] },
            { type: 'word_match', pairs: [{ target: '   ', native: 'Hello' }] },
            // 2. Blank listen_tap
            { type: 'listen_tap', targetSentence: '   ', tokens: [] },
            // 3. Blank picture_select
            { type: 'picture_select', options: [] },
            { type: 'picture_select', options: [{ text: '', imageUrl: '' }] },
            // 4. Blank cloze_test
            { type: 'cloze_test', sentence: '', blank: '' },
            // 5. Blank sentence_builder
            { type: 'sentence_builder', targetSentence: '   ', tokens: [] },
            // 6. Blank type_word
            { type: 'type_word', target: '', prompt: '' },
            // 7. Blank dialogue_bubble
            { type: 'dialogue_bubble', partnerMessage: '' },
            // 8. Blank listen_select
            { type: 'listen_select', sentence: '', options: [] },
            // 9. Blank sprechen
            { type: 'sprechen', prompt: '   ' },
            // 10. Blank karaoke
            { type: 'karaoke', storyText: '', karaokeData: null },
        ];

        const result = sanitizeLessonStages(inputStages);
        expect(result).toEqual([]);
    });

    it('preserves and sanitizes all 10 valid challenge formats', () => {
        const inputStages = [
            {
                type: 'word_match',
                pairs: [
                    { target: 'Hallo', native: 'Hello' },
                    { target: '   ', native: 'Invalid' }, // Should be stripped
                ],
            },
            {
                type: 'listen_tap',
                targetSentence: 'Guten Tag',
                tokens: ['Guten', 'Tag'],
            },
            {
                type: 'picture_select',
                options: [
                    { text: 'Apfel', imageUrl: '/uploads/curriculum/curr-1.webp', isCorrect: true },
                    { text: 'Banane', imageUrl: '/uploads/curriculum/curr-2.webp', isCorrect: false },
                ],
            },
            {
                type: 'cloze_test',
                sentence: 'Ich _____ aus Indien.',
                blank: 'komme',
            },
            {
                type: 'sentence_builder',
                targetSentence: 'Ich bin Anna',
                tokens: ['Ich', 'bin', 'Anna'],
            },
            {
                type: 'type_word',
                prompt: 'The coffee is hot.',
                target: 'heiß',
            },
            {
                type: 'dialogue_bubble',
                partnerMessage: 'Hallo! Wie gehts?',
            },
            {
                type: 'listen_select',
                sentence: 'Zwei Kaffee, bitte.',
                options: ['Two coffees', 'One tea'],
            },
            {
                type: 'sprechen',
                prompt: 'Guten Morgen',
            },
            {
                type: 'karaoke',
                storyText: 'Der Fuchs und der Hase...',
            },
        ];

        const result = sanitizeLessonStages(inputStages);
        expect(result.length).toBe(10);
        expect(result.map(s => s.type)).toEqual([
            'word_match',
            'listen_tap',
            'picture_select',
            'cloze_test',
            'sentence_builder',
            'type_word',
            'dialogue_bubble',
            'listen_select',
            'sprechen',
            'karaoke',
        ]);
        // Confirm whitespace pair was stripped from word_match
        expect(result[0].pairs).toEqual([{ target: 'Hallo', native: 'Hello' }]);
    });

    it('normalizes legacy stage aliases to canonical types', () => {
        const legacyStages = [
            { type: 'match_pairs', pairs: [{ german: 'Guten Tag', english: 'Good day' }] },
            { type: 'picture_cards', options: [{ word: 'Hund', image: 'dog.webp' }] },
            { type: 'cloze', prompt: 'Das ist _____ Buch.', target: 'ein' },
            { type: 'type_input', targetWord: 'Wasser', sentence: 'Water' },
            { type: 'dialogue', message: 'Wie geht es Ihnen?' },
            { type: 'listen_comprehension', targetSentence: 'Ein Tee, bitte.', options: ['Tea', 'Coffee'] },
        ];

        const result = sanitizeLessonStages(legacyStages);
        expect(result.length).toBe(6);
        expect(result[0].type).toBe('word_match');
        expect(result[1].type).toBe('picture_select');
        expect(result[2].type).toBe('cloze_test');
        expect(result[3].type).toBe('type_word');
        expect(result[4].type).toBe('dialogue_bubble');
        expect(result[5].type).toBe('listen_select');
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
