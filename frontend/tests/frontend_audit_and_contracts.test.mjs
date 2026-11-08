import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_SRC = path.resolve(__dirname, '../src');

test('1. Karaoke JSON Normalization Utility (downloadKaraokeTemplate.js) accurately normalizes sentences and words', async () => {
  const { normalizeKaraokeJson } = await import('../src/utils/downloadKaraokeTemplate.js');

  const rawStory = {
    title: 'Im Restaurant',
    englishTitle: 'At the Restaurant',
    duration: 12.5,
    sentences: [
      {
        text: 'Die Speisekarte bitte.',
        translation: 'The menu please.',
        speaker: 'Gast',
        start: 1.0,
        end: 3.5,
        words: [
          { word: 'Die', start: 1.0, end: 1.5 },
          { word: 'Speisekarte', start: 1.6, end: 2.8 },
          { word: 'bitte.', start: 2.9, end: 3.5 },
        ],
      },
    ],
  };

  const normalized = normalizeKaraokeJson(rawStory);
  assert.equal(normalized.title, 'Im Restaurant');
  assert.equal(normalized.sentences.length, 1);
  assert.equal(normalized.sentences[0].words.length, 3);
  assert.ok(Array.isArray(normalized.words), 'Top-level words array should be generated');
  assert.equal(normalized.words.length, 3);
  assert.equal(normalized.words[2].clean, 'bitte');
});

test('2. Frontend Route Architecture (App.jsx) registers all core Student, Trainer, and Admin routes', () => {
  const appJsx = fs.readFileSync(path.join(FRONTEND_SRC, 'App.jsx'), 'utf8');

  const requiredRoutes = [
    '/login',
    '/register',
    '/dashboard',
    '/lingodolphy',
    '/lessons',
    '/notes',
    '/quizzes',
    '/flashcards',
    '/videos',
    '/activity',
    '/profile',
    '/admin',
    '/admin/pages',
    '/admin/notifications',
  ];

  for (const route of requiredRoutes) {
    assert.ok(
      appJsx.includes(route),
      `Expected App.jsx to register route: ${route}`
    );
  }
});

test('3. LingoDolphy & Curriculum Studio Component Integrity', () => {
  const lingoPage = fs.readFileSync(path.join(FRONTEND_SRC, 'pages/LingoDolphyPage.jsx'), 'utf8');
  const lessonModal = fs.readFileSync(path.join(FRONTEND_SRC, 'components/lingodolphy/LingoLessonModal.jsx'), 'utf8');
  const editorModal = fs.readFileSync(path.join(FRONTEND_SRC, 'components/curriculum/LessonEditorModal.jsx'), 'utf8');

  // Verify LingoDolphy fetches status and path
  assert.ok(lingoPage.includes('/gamification/status'));
  assert.ok(lingoPage.includes('/gamification/path'));

  // Verify LingoLessonModal submits node completion
  assert.ok(lessonModal.includes('/gamification/complete-node'));

  // Verify LessonEditorModal supports all interactive stage types
  const stageTypes = [
    'word_match',
    'listen_tap',
    'sentence_builder',
    'sprechen',
    'picture_select',
    'cloze_test',
    'type_word',
    'dialogue_bubble',
    'karaoke',
  ];
  for (const st of stageTypes) {
    assert.ok(editorModal.includes(st), `Expected LessonEditorModal to include stage type ${st}`);
  }
});

test('4. Registration and OTP Email Verification Contract (FE-01)', () => {
  const authContext = fs.readFileSync(path.join(FRONTEND_SRC, 'contexts/AuthContext.jsx'), 'utf8');
  const registerJsx = fs.readFileSync(path.join(FRONTEND_SRC, 'pages/Register.jsx'), 'utf8');
  const loginJsx = fs.readFileSync(path.join(FRONTEND_SRC, 'pages/Login.jsx'), 'utf8');

  // Verify AuthContext exports OTP verification functions
  assert.ok(authContext.includes('verifyRegistrationOtp'), 'AuthContext should export verifyRegistrationOtp');
  assert.ok(authContext.includes('resendRegistrationOtp'), 'AuthContext should export resendRegistrationOtp');
  assert.ok(authContext.includes('/auth/verify-registration-otp'), 'AuthContext should hit /auth/verify-registration-otp');
  assert.ok(authContext.includes('/auth/resend-registration-otp'), 'AuthContext should hit /auth/resend-registration-otp');

  // Verify Register.jsx implements 2-step flow with OTP input
  assert.ok(registerJsx.includes("step === 'form'"), 'Register.jsx should support form step');
  assert.ok(registerJsx.includes('requireVerification'), 'Register.jsx should check requireVerification');
  assert.ok(registerJsx.includes('verifyRegistrationOtp'), 'Register.jsx should call verifyRegistrationOtp');
  assert.ok(registerJsx.includes('resendRegistrationOtp'), 'Register.jsx should call resendRegistrationOtp');
  assert.ok(registerJsx.includes('resendCooldown'), 'Register.jsx should implement resend cooldown timer');

  // Verify Login.jsx handles unverified redirection
  assert.ok(loginJsx.includes('requireVerification'), 'Login.jsx should handle requireVerification');
  assert.ok(loginJsx.includes("step: 'otp'"), 'Login.jsx should redirect unverified users to OTP step');
});

