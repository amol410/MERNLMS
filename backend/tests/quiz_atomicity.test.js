const request = require('supertest');
const app = require('../server');
const { createTestUser, createTestAdmin } = require('./setup');
const QuizAttempt = require('../models/QuizAttempt');

describe('Quiz Submission Atomicity & Rollback Suite (DB-01)', () => {
    let adminToken;
    let studentToken;
    let studentUser;
    let quizId;
    let questionId;

    beforeAll(async () => {
        const admin = await createTestAdmin();
        adminToken = admin.token;
        const student = await createTestUser();
        studentToken = student.token;
        studentUser = student.user;

        // Create a test quiz
        const res = await request(app)
            .post('/api/quizzes')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Atomicity Test Quiz',
                description: 'Verifies transaction rollback on attempt submission',
                passingScore: 50,
                timeLimit: 10,
                isPublished: true,
                questions: [
                    {
                        text: 'What is 2 + 2?',
                        type: 'multiple-choice',
                        options: ['3', '4', '5'],
                        correctIndex: 1,
                        points: 10,
                    },
                ],
            });
        expect(res.status).toBe(201);
        quizId = res.body.quiz.id || res.body.quiz._id;
        questionId = res.body.quiz.questions[0]._id ?? 0;
    });

    it('1. Submits initial quiz attempt successfully and stores score', async () => {
        const attemptRes = await request(app)
            .post(`/api/quizzes/${quizId}/attempt`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                timeTakenSecs: 15,
                answers: [
                    {
                        questionId,
                        chosenIndex: 1, // Correct answer
                    },
                ],
            });

        expect(attemptRes.status).toBe(201);
        expect(attemptRes.body.result.attempt.score).toBe(10);
        expect(attemptRes.body.result.attempt.percentage).toBe(100);
        expect(attemptRes.body.result.attempt.attemptNumber).toBe(1);

        const savedAttempts = await QuizAttempt.findAll({
            where: { quizId, studentId: studentUser.id },
        });
        expect(savedAttempts.length).toBe(1);
        expect(savedAttempts[0].score).toBe(10);
    });

    it('2. Atomically rolls back deletion when an error occurs during submission (prior score preserved)', async () => {
        // Spy on QuizAttempt.create to simulate an unexpected crash or timeout inside the transaction
        const originalCreate = QuizAttempt.create;
        const createSpy = jest.spyOn(QuizAttempt, 'create').mockImplementationOnce(async () => {
            throw new Error('SIMULATED_DB_TIMEOUT_CRASH');
        });

        // Submit re-take that crashes mid-transaction
        const failedRes = await request(app)
            .post(`/api/quizzes/${quizId}/attempt`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                timeTakenSecs: 20,
                answers: [
                    {
                        questionId,
                        chosenIndex: 0, // Wrong answer
                    },
                ],
            });

        // Verify the server handled the error and did not succeed
        expect(failedRes.status).toBe(500);

        // Verify the original attempt was NOT destroyed (Transaction Rollback Verification)
        const attemptsAfterCrash = await QuizAttempt.findAll({
            where: { quizId, studentId: studentUser.id },
        });
        expect(attemptsAfterCrash.length).toBe(1);
        expect(attemptsAfterCrash[0].score).toBe(10);
        expect(attemptsAfterCrash[0].percentage).toBe(100);

        // Restore original method
        createSpy.mockRestore();
    });

    it('3. Successfully updates attempt on valid re-take', async () => {
        const retakeRes = await request(app)
            .post(`/api/quizzes/${quizId}/attempt`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                timeTakenSecs: 10,
                answers: [
                    {
                        questionId,
                        chosenIndex: 1,
                    },
                ],
            });

        expect(retakeRes.status).toBe(201);
        expect(retakeRes.body.result.attempt.score).toBe(10);
        expect(retakeRes.body.result.attempt.attemptNumber).toBe(2);

        const currentAttempts = await QuizAttempt.findAll({
            where: { quizId, studentId: studentUser.id },
        });
        expect(currentAttempts.length).toBe(1);
        expect(currentAttempts[0].attemptNumber).toBe(2);
    });
});
