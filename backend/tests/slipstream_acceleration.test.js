const { Op } = require('sequelize');
const CurriculumLesson = require('../models/CurriculumLesson');
const UserNodeProgress = require('../models/UserNodeProgress');
const gamificationController = require('../controllers/gamificationController');
const curriculumController = require('../controllers/curriculumController');

describe('Project Slipstream - Backend Acceleration & Windowing Tests', () => {
    describe('1. Database Model & B-Tree Compound Indexes', () => {
        it('verifies CurriculumLesson has the Slipstream compound index on (learningLanguage, nativeLanguage, level, isLive, unitNumber)', () => {
            const indexes = CurriculumLesson.options.indexes || [];
            const slipstreamIndex = indexes.find(idx => {
                const fields = idx.fields || [];
                return (
                    fields.length === 5 &&
                    fields[0] === 'learningLanguage' &&
                    fields[1] === 'nativeLanguage' &&
                    fields[2] === 'level' &&
                    fields[3] === 'isLive' &&
                    fields[4] === 'unitNumber'
                );
            });

            expect(slipstreamIndex).toBeDefined();
            expect(slipstreamIndex.fields).toEqual([
                'learningLanguage',
                'nativeLanguage',
                'level',
                'isLive',
                'unitNumber',
            ]);
        });
    });

    describe('2. Path Controller Lookahead Windowing & Query Logic', () => {
        let originalFindAll;
        let originalProgressFindAll;
        let capturedWhere;
        let capturedAttributes;

        beforeEach(() => {
            originalFindAll = CurriculumLesson.findAll;
            originalProgressFindAll = UserNodeProgress.findAll;

            UserNodeProgress.findAll = jest.fn().mockResolvedValue([]);
            CurriculumLesson.findAll = jest.fn(async (options) => {
                capturedWhere = options.where;
                capturedAttributes = options.attributes;
                return [
                    {
                        id: 1,
                        unitNumber: 1,
                        unitTitle: 'Greetings',
                        unitDescription: 'Intro',
                        lessonIndex: 0,
                        title: 'Hello',
                        subtitle: 'Basic',
                        nodeType: 'lesson',
                        xpReward: 15,
                        pearlsReward: 5,
                        audioUrl: null,
                        sourceNoteId: null,
                    },
                ];
            });
        });

        afterEach(() => {
            CurriculumLesson.findAll = originalFindAll;
            UserNodeProgress.findAll = originalProgressFindAll;
        });

        it('supports windowing query parameters (startUnit and endUnit)', async () => {
            const req = {
                user: { id: 1, currentLevel: 'A1' },
                query: {
                    targetLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                    startUnit: '2',
                    endUnit: '4',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            await gamificationController.getPath(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();
            const jsonResponse = res.json.mock.calls[0][0];
            expect(jsonResponse.success).toBe(true);

            // Verify where clause filtered by unitNumber range [2, 4]
            expect(capturedWhere.unitNumber).toEqual({ [Op.between]: [2, 4] });
            expect(capturedWhere.learningLanguage).toBe('de');
            expect(capturedWhere.nativeLanguage).toBe('en');
            expect(capturedWhere.level).toBe('A1');
            expect(capturedWhere.isLive).toBe(true);

            // Verify heavy stages & karaokeData are omitted from map query attributes
            expect(capturedAttributes).toBeDefined();
            expect(capturedAttributes).not.toContain('stages');
            expect(capturedAttributes).not.toContain('karaokeData');
        });

        it('maintains 100% backward compatibility when windowing params are omitted (returns all units)', async () => {
            const req = {
                user: { id: 1, currentLevel: 'A1' },
                query: {
                    targetLanguage: 'de',
                    nativeLanguage: 'en',
                    level: 'A1',
                },
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            };
            const next = jest.fn();

            await gamificationController.getPath(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();
            const jsonResponse = res.json.mock.calls[0][0];
            expect(jsonResponse.success).toBe(true);

            // unitNumber should NOT be constrained, returning all course units to legacy apps
            expect(capturedWhere.unitNumber).toBeUndefined();
        });
    });

    describe('3. Admin Units Summary Optimization (getUnitsSummary)', () => {
        let originalFindAll;
        let capturedSummaryAttributes;

        beforeEach(() => {
            originalFindAll = CurriculumLesson.findAll;
            CurriculumLesson.findAll = jest.fn(async (options) => {
                capturedSummaryAttributes = options.attributes;
                return [
                    {
                        id: 101,
                        unitNumber: 1,
                        unitTitle: 'Unit 1 Title',
                        unitDescription: 'Desc 1',
                        lessonIndex: 0,
                        title: 'Lesson 1',
                        isLive: true,
                    },
                    {
                        id: 102,
                        unitNumber: 1,
                        unitTitle: 'Unit 1 Title',
                        unitDescription: 'Desc 1',
                        lessonIndex: 1,
                        title: 'Lesson 2',
                        isLive: false,
                    },
                    {
                        id: 201,
                        unitNumber: 2,
                        unitTitle: 'Unit 2 Title',
                        unitDescription: 'Desc 2',
                        lessonIndex: 0,
                        title: 'Lesson 3',
                        isLive: true,
                    },
                ];
            });
        });

        afterEach(() => {
            CurriculumLesson.findAll = originalFindAll;
        });

        it('projects lightweight metadata attributes and omits heavy stages arrays', async () => {
            const req = {
                query: { learningLanguage: 'de', nativeLanguage: 'en', level: 'A1' },
            };
            const res = {
                json: jest.fn(),
            };
            const next = jest.fn();

            await curriculumController.getUnitsSummary(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalled();
            const response = res.json.mock.calls[0][0];
            expect(response.success).toBe(true);
            expect(response.totalUnits).toBe(2);
            expect(response.units).toHaveLength(2);

            // Unit 1 stats
            expect(response.units[0].unitNumber).toBe(1);
            expect(response.units[0].totalLessons).toBe(2);
            expect(response.units[0].liveLessons).toBe(1);
            expect(response.units[0].draftLessons).toBe(1);

            // Unit 2 stats
            expect(response.units[1].unitNumber).toBe(2);
            expect(response.units[1].totalLessons).toBe(1);
            expect(response.units[1].liveLessons).toBe(1);
            expect(response.units[1].draftLessons).toBe(0);

            // Crucial performance verification: heavy JSON columns omitted
            expect(capturedSummaryAttributes).toBeDefined();
            expect(capturedSummaryAttributes).not.toContain('stages');
            expect(capturedSummaryAttributes).not.toContain('karaokeData');
        });
    });
});
