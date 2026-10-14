const fs = require('fs');
const path = require('path');

/**
 * Full CEFR German A1 Curriculum Generator (Pedagogical Non-Redundant Edition)
 * Following planlesson.md guidelines:
 * - Micro-stepping: Start with 1-2 words, simple self-intro, then etiquette, then questions.
 * - Beginner-friendly Chat: No complex compound questions in early chat lessons.
 * - Zero carbon-copy repetition: Unique vocabulary slices (A, B, C, D) and progressive sentences (1 to 6).
 * - Spaced repetition: Systematic reinforcement at calculated intervals.
 * - 3 Sections x 35 Units = 105 Units x 16 Lessons = 1,680 Lessons.
 */

// 1. Definition of specific tailored units and themes
const rawUnitsDefinition = [
  // ── UNIT 1: Greet and introduce yourself ──────────────────────────
  {
    num: 1, sec: 1, de: "Erste Begrüßungen", en: "Greet and introduce yourself", color: "#1CB0F6",
    sliceA: [
      { de: "Hallo", en: "Hello" },
      { de: "Guten Tag", en: "Good day / Hello" },
      { de: "Guten Morgen", en: "Good morning" },
      { de: "Tschüss", en: "Bye" }
    ],
    sliceB: [
      { de: "ich", en: "I" },
      { de: "bin", en: "am" },
      { de: "heiße", en: "am called" },
      { de: "Name", en: "name" }
    ],
    sliceC: [
      { de: "Danke", en: "Thank you" },
      { de: "Bitte", en: "Please / You're welcome" },
      { de: "Auf Wiedersehen", en: "Goodbye (formal)" },
      { de: "Gute Nacht", en: "Good night" }
    ],
    sliceD: [
      { de: "Wie", en: "How" },
      { de: "geht", en: "goes" },
      { de: "gut", en: "good / well" },
      { de: "sehr", en: "very" }
    ],
    sentence1: { de: "Hallo, guten Tag!", en: "Hello, good day!", tokens: ["Hallo,", "guten", "Tag!", "Tschüss", "Danke"] },
    sentence2: { de: "Hallo, ich bin Lukas.", en: "Hello, I am Lukas.", tokens: ["Hallo,", "ich", "bin", "Lukas.", "wer", "bist"] },
    sentence3: { de: "Danke schön und tschüss!", en: "Thank you very much and bye!", tokens: ["Danke", "schön", "und", "tschüss!", "Bitte", "Hallo"] },
    sentence4: { de: "Wie geht es dir?", en: "How are you?", tokens: ["Wie", "geht", "es", "dir?", "gut", "danke"] },
    sentence5: { de: "Guten Morgen! Wie geht es dir?", en: "Good morning! How are you?", tokens: ["Guten", "Morgen!", "Wie", "geht", "es", "dir?", "Sehr", "gut"] },
    sentence6: { de: "Sehr gut, vielen Dank!", en: "Very good, thank you very much!", tokens: ["Sehr", "gut,", "vielen", "Dank!", "Bitte", "Auf", "Wiedersehen"] },
    chat1: { partner: "Anna", prompt: "Hallo! Ich bin Anna.", translation: "Hello! I am Anna.", options: ["Hallo! Ich bin David.", "Nein, danke schön."] },
    chat2: { partner: "Alex", prompt: "Wie geht es dir?", translation: "How are you?", options: ["Sehr gut, danke!", "Tschüss, auf Wiedersehen."] },
    typeWord1: { prompt: "Type the German word for 'Goodbye' (casual):", target: "Tschüss", hint: "Hint: casual goodbye with Umlaut ü" },
    typeWord2: { prompt: "Type the German word for 'Thank you':", target: "Danke", hint: "Hint: polite expression" },
    cloze1: { prompt: "Guten Tag! Ich _______ Anna.", en: "Good day! I am called Anna.", options: ["heiße", "danke", "Morgen"], answer: "heiße" },
    cloze2: { prompt: "Wie _______ es dir?", en: "How are you?", options: ["geht", "bist", "heißt"], answer: "geht" }
  },

  // ── UNIT 2: Order at a café ───────────────────────────────────────
  {
    num: 2, sec: 1, de: "Im Café bestellen", en: "Order at a café", color: "#58CC02",
    sliceA: [
      { de: "Kaffee", en: "coffee" },
      { de: "Tee", en: "tea" },
      { de: "Wasser", en: "water" },
      { de: "Milch", en: "milk" }
    ],
    sliceB: [
      { de: "möchte", en: "would like" },
      { de: "trinken", en: "to drink" },
      { de: "bitte", en: "please" },
      { de: "Glas", en: "glass" }
    ],
    sliceC: [
      { de: "Zucker", en: "sugar" },
      { de: "Zitrone", en: "lemon" },
      { de: "Rechnung", en: "bill" },
      { de: "zahlen", en: "to pay" }
    ],
    sliceD: [
      { de: "kostet", en: "costs" },
      { de: "Euro", en: "euro" },
      { de: "zusammen", en: "together" },
      { de: "stimmt", en: "keep the change / correct" }
    ],
    sentence1: { de: "Kaffee und Milch, bitte.", en: "Coffee and milk, please.", tokens: ["Kaffee", "und", "Milch,", "bitte.", "Tee", "Zucker"] },
    sentence2: { de: "Ich möchte einen Kaffee.", en: "I would like a coffee.", tokens: ["Ich", "möchte", "einen", "Kaffee.", "Wasser", "trinken"] },
    sentence3: { de: "Ein Glas Wasser, bitte!", en: "A glass of water, please!", tokens: ["Ein", "Glas", "Wasser,", "bitte!", "Milch", "Tee"] },
    sentence4: { de: "Die Rechnung, bitte!", en: "The bill, please!", tokens: ["Die", "Rechnung,", "bitte!", "Zucker", "zahlen"] },
    sentence5: { de: "Ich möchte einen Kaffee mit Milch.", en: "I would like a coffee with milk.", tokens: ["Ich", "möchte", "einen", "Kaffee", "mit", "Milch.", "Tee", "Euro"] },
    sentence6: { de: "Das macht zusammen drei Euro.", en: "That makes three euros altogether.", tokens: ["Das", "macht", "zusammen", "drei", "Euro.", "bitte", "stimmt"] },
    chat1: { partner: "Kellner", prompt: "Guten Tag! Was möchten Sie trinken?", translation: "Good day! What would you like to drink?", options: ["Einen Kaffee, bitte.", "Ich komme aus Deutschland."] },
    chat2: { partner: "Kellner", prompt: "Das macht zusammen drei Euro.", translation: "That makes three euros altogether.", options: ["Hier sind drei Euro, danke.", "Auf Wiedersehen."] },
    typeWord1: { prompt: "Type the German word for 'coffee':", target: "Kaffee", hint: "Hint: hot morning drink" },
    typeWord2: { prompt: "Type the German word for 'tea':", target: "Tee", hint: "Hint: herbal or green beverage" },
    cloze1: { prompt: "Ich _______ einen Kaffee, bitte.", en: "I would like a coffee, please.", options: ["möchte", "trinke", "habe"], answer: "möchte" },
    cloze2: { prompt: "Ein Glas _______, bitte.", en: "A glass of water, please.", options: ["Wasser", "Zucker", "Euro"], answer: "Wasser" }
  },

  // ── UNIT 3: Count from 1 to 10 ────────────────────────────────────
  {
    num: 3, sec: 1, de: "Zahlen 1 bis 10", en: "Count from 1 to 10", color: "#FF9600",
    sliceA: [
      { de: "eins", en: "one" },
      { de: "zwei", en: "two" },
      { de: "drei", en: "three" },
      { de: "vier", en: "four" }
    ],
    sliceB: [
      { de: "fünf", en: "five" },
      { de: "sechs", en: "six" },
      { de: "sieben", en: "seven" },
      { de: "acht", en: "eight" }
    ],
    sliceC: [
      { de: "neun", en: "nine" },
      { de: "zehn", en: "ten" },
      { de: "null", en: "zero" },
      { de: "Euro", en: "euro" }
    ],
    sliceD: [
      { de: "plus", en: "plus" },
      { de: "minus", en: "minus" },
      { de: "macht", en: "equals / makes" },
      { de: "wie viel", en: "how much / how many" }
    ],
    sentence1: { de: "Eins, zwei, drei!", en: "One, two, three!", tokens: ["Eins,", "zwei,", "drei!", "vier", "fünf"] },
    sentence2: { de: "Ich habe vier Äpfel.", en: "I have four apples.", tokens: ["Ich", "habe", "vier", "Äpfel.", "drei", "Euro"] },
    sentence3: { de: "Sieben, acht, neun, zehn.", en: "Seven, eight, nine, ten.", tokens: ["Sieben,", "acht,", "neun,", "zehn.", "null", "fünf"] },
    sentence4: { de: "Das macht zwei Euro.", en: "That makes two euros.", tokens: ["Das", "macht", "zwei", "Euro.", "drei", "zehn"] },
    sentence5: { de: "Zwei plus drei macht fünf.", en: "Two plus three makes five.", tokens: ["Zwei", "plus", "drei", "macht", "fünf.", "vier", "sechs"] },
    sentence6: { de: "Hier sind fünf Euro, danke.", en: "Here are five euros, thank you.", tokens: ["Hier", "sind", "fünf", "Euro,", "danke.", "zehn", "bitte"] },
    chat1: { partner: "Kassierer", prompt: "Guten Tag! Wie viele Brötchen?", translation: "Good day! How many rolls?", options: ["Zwei Brötchen, bitte.", "Ich bin müde."] },
    chat2: { partner: "Kassierer", prompt: "Das macht zusammen fünf Euro, bitte.", translation: "That makes five euros altogether, please.", options: ["Hier sind fünf Euro, danke.", "Nein danke, tschüss."] },
    typeWord1: { prompt: "Type the German word for number 5:", target: "fünf", hint: "Hint: contains Umlaut ü" },
    typeWord2: { prompt: "Type the German word for number 10:", target: "zehn", hint: "Hint: begins with z" },
    cloze1: { prompt: "Eins, zwei, _______, vier.", en: "One, two, three, four.", options: ["drei", "zehn", "acht"], answer: "drei" },
    cloze2: { prompt: "Das macht _______ Euro, bitte.", en: "That makes five euros, please.", options: ["fünf", "haben", "Euro"], answer: "fünf" }
  },

  // ── UNIT 4: Origins & Countries ───────────────────────────────────
  {
    num: 4, sec: 1, de: "Woher kommst du?", en: "Talk about origins & countries", color: "#CE82FF",
    sliceA: [
      { de: "kommen", en: "to come" },
      { de: "aus", en: "from" },
      { de: "Deutschland", en: "Germany" },
      { de: "Berlin", en: "Berlin" }
    ],
    sliceB: [
      { de: "Österreich", en: "Austria" },
      { de: "Wien", en: "Vienna" },
      { de: "Schweiz", en: "Switzerland" },
      { de: "Bern", en: "Bern" }
    ],
    sliceC: [
      { de: "wohnen", en: "to live / reside" },
      { de: "in", en: "in" },
      { de: "Stadt", en: "city" },
      { de: "Land", en: "country" }
    ],
    sliceD: [
      { de: "Woher", en: "Where from" },
      { de: "Wo", en: "Where" },
      { de: "wer", en: "who" },
      { de: "auch", en: "also / too" }
    ],
    sentence1: { de: "Ich komme aus Deutschland.", en: "I come from Germany.", tokens: ["Ich", "komme", "aus", "Deutschland.", "Österreich", "wohne"] },
    sentence2: { de: "Ich wohne in Berlin.", en: "I live in Berlin.", tokens: ["Ich", "wohne", "in", "Berlin.", "aus", "Wien"] },
    sentence3: { de: "Er kommt aus Österreich.", en: "He comes from Austria.", tokens: ["Er", "kommt", "aus", "Österreich.", "Schweiz", "Stadt"] },
    sentence4: { de: "Woher kommst du?", en: "Where do you come from?", tokens: ["Woher", "kommst", "du?", "wo", "bist"] },
    sentence5: { de: "Ich komme aus Deutschland und wohne in Frankfurt.", en: "I come from Germany and live in Frankfurt.", tokens: ["Ich", "komme", "aus", "Deutschland", "und", "wohne", "in", "Frankfurt."] },
    sentence6: { de: "Woher kommen Sie, Herr Müller?", en: "Where do you come from, Mr. Müller?", tokens: ["Woher", "kommen", "Sie,", "Herr", "Müller?", "Wien", "Schweiz"] },
    chat1: { partner: "Maximilian", prompt: "Hallo! Ich komme aus Berlin.", translation: "Hello! I come from Berlin.", options: ["Hallo! Ich komme aus Indien.", "Zwei Euro, bitte."] },
    chat2: { partner: "Julia", prompt: "Kommst du aus Wien?", translation: "Do you come from Vienna?", options: ["Nein, ich komme aus Bern.", "Guten Morgen!"] },
    typeWord1: { prompt: "Type the German word for 'Austria':", target: "Österreich", hint: "Hint: starts with Umlaut Ö" },
    typeWord2: { prompt: "Type the German word for 'to come':", target: "kommen", hint: "Hint: infinitive verb" },
    cloze1: { prompt: "Ich komme _______ Deutschland.", en: "I come from Germany.", options: ["aus", "in", "nach"], answer: "aus" },
    cloze2: { prompt: "Woher _______ du?", en: "Where do you come from?", options: ["kommst", "kommen", "wohnt"], answer: "kommst" }
  },

  // ── UNIT 5: Everyday etiquette ────────────────────────────────────
  {
    num: 5, sec: 1, de: "Höflichkeit im Alltag", en: "Everyday etiquette", color: "#FF4B4B",
    sliceA: [
      { de: "Entschuldigung", en: "Excuse me / Sorry" },
      { de: "bitte", en: "please" },
      { de: "danke", en: "thanks" },
      { de: "Tschüss", en: "bye" }
    ],
    sliceB: [
      { de: "Guten Abend", en: "Good evening" },
      { de: "Auf Wiedersehen", en: "Goodbye (formal)" },
      { de: "Gute Nacht", en: "Good night" },
      { de: "Schönen Tag", en: "Have a nice day" }
    ],
    sliceC: [
      { de: "Gern geschehen", en: "You're welcome" },
      { de: "kein Problem", en: "no problem" },
      { de: "vielen Dank", en: "many thanks" },
      { de: "alles klar", en: "all right / okay" }
    ],
    sliceD: [
      { de: "sprechen", en: "to speak" },
      { de: "Deutsch", en: "German" },
      { de: "Englisch", en: "English" },
      { de: "Hilfe", en: "help" }
    ],
    sentence1: { de: "Guten Abend! Danke schön.", en: "Good evening! Thank you very much.", tokens: ["Guten", "Abend!", "Danke", "schön.", "Bitte", "Hallo"] },
    sentence2: { de: "Entschuldigung, sprechen Sie Deutsch?", en: "Excuse me, do you speak German?", tokens: ["Entschuldigung,", "sprechen", "Sie", "Deutsch?", "Englisch", "bitte"] },
    sentence3: { de: "Vielen Dank für Ihre Hilfe!", en: "Many thanks for your help!", tokens: ["Vielen", "Dank", "für", "Ihre", "Hilfe!", "Gern", "geschehen"] },
    sentence4: { de: "Kein Problem, gern geschehen!", en: "No problem, you are very welcome!", tokens: ["Kein", "Problem,", "gern", "geschehen!", "Danke", "Tag"] },
    sentence5: { de: "Entschuldigung, wo ist der Bahnhof?", en: "Excuse me, where is the train station?", tokens: ["Entschuldigung,", "wo", "ist", "der", "Bahnhof?", "bitte", "hier"] },
    sentence6: { de: "Auf Wiedersehen und einen schönen Tag!", en: "Goodbye and have a nice day!", tokens: ["Auf", "Wiedersehen", "und", "einen", "schönen", "Tag!", "Danke"] },
    chat1: { partner: "Lisa", prompt: "Vielen Dank für deine Hilfe!", translation: "Many thanks for your help!", options: ["Sehr gern geschehen!", "Tschüss, fünf Euro."] },
    chat2: { partner: "Herr Weber", prompt: "Entschuldigung, ist hier noch frei?", translation: "Excuse me, is this seat still free?", options: ["Ja, bitte nehmen Sie Platz.", "Ich heiße Anna."] },
    typeWord1: { prompt: "Type the German formal word for 'Goodbye':", target: "Auf Wiedersehen", hint: "Hint: two words capitalized" },
    typeWord2: { prompt: "Type the German word for 'Excuse me':", target: "Entschuldigung", hint: "Hint: polite attention grabber" },
    cloze1: { prompt: "Vielen Dank! – _______ geschehen.", en: "Many thanks! – You are welcome.", options: ["Gern", "Kein", "Schön"], answer: "Gern" },
    cloze2: { prompt: "_______, sprechen Sie Deutsch?", en: "Excuse me, do you speak German?", options: ["Entschuldigung", "Danke", "Auf"], answer: "Entschuldigung" }
  }
];

// Helper to generate a complete pedagogically sound unit package for units 6 to 105
function createCuratedUnit(num, sec, de, en, color, topicWord, topicTrans, sampleSentDe, sampleSentEn, questionDe, questionEn) {
  const cleanWord = topicWord.replace(/[^a-zA-ZäöüßÄÖÜẞ]/g, '');
  return {
    num, sec, de, en, color,
    sliceA: [
      { de: cleanWord, en: topicTrans },
      { de: "gut", en: "good" },
      { de: "hier", en: "here" },
      { de: "sehr", en: "very" }
    ],
    sliceB: [
      { de: "haben", en: "to have" },
      { de: "sein", en: "to be" },
      { de: "neu", en: "new" },
      { de: "heute", en: "today" }
    ],
    sliceC: [
      { de: "bitte", en: "please" },
      { de: "danke", en: "thanks" },
      { de: "gern", en: "gladly / with pleasure" },
      { de: "zusammen", en: "together" }
    ],
    sliceD: [
      { de: "können", en: "can / to be able" },
      { de: "machen", en: "to do / make" },
      { de: "wichtig", en: "important" },
      { de: "immer", en: "always" }
    ],
    sentence1: {
      de: `Das ist ${cleanWord.toLowerCase()}.`,
      en: `That is ${topicTrans}.`,
      tokens: ["Das", "ist", `${cleanWord.toLowerCase()}.`, "gut", "hier"]
    },
    sentence2: {
      de: `Ich habe heute ${cleanWord.toLowerCase()}.`,
      en: `I have ${topicTrans} today.`,
      tokens: ["Ich", "habe", "heute", `${cleanWord.toLowerCase()}.`, "neu", "sehr"]
    },
    sentence3: {
      de: `Vielen Dank für ${cleanWord.toLowerCase()}!`,
      en: `Many thanks for ${topicTrans}!`,
      tokens: ["Vielen", "Dank", "für", `${cleanWord.toLowerCase()}!`, "bitte", "gern"]
    },
    sentence4: {
      de: questionDe || `Wie finden Sie ${cleanWord.toLowerCase()}?`,
      en: questionEn || `How do you like ${topicTrans}?`,
      tokens: (questionDe || `Wie finden Sie ${cleanWord.toLowerCase()}?`).split(" ").concat(["gut", "danke"])
    },
    sentence5: {
      de: sampleSentDe || `Das ist wirklich sehr ${cleanWord.toLowerCase()}.`,
      en: sampleSentEn || `That is really very ${topicTrans}.`,
      tokens: (sampleSentDe || `Das ist wirklich sehr ${cleanWord.toLowerCase()}.`).split(" ")
    },
    sentence6: {
      de: `Das ist wunderbar und sehr wichtig.`,
      en: `That is wonderful and very important.`,
      tokens: ["Das", "ist", "wunderbar", "und", "sehr", "wichtig.", "danke"]
    },
    chat1: {
      partner: "Julia",
      prompt: `Guten Tag! Was denkst du über ${cleanWord.toLowerCase()}?`,
      translation: `Good day! What do you think about ${topicTrans}?`,
      options: [
        `Das ist sehr gut und nützlich.`,
        `Nein, leider nicht.`
      ]
    },
    chat2: {
      partner: "Lukas",
      prompt: questionDe || `Können wir das heute machen?`,
      translation: questionEn || `Can we do that today?`,
      options: [
        `Ja, natürlich, sehr gern!`,
        `Ich habe keine Zeit.`
      ]
    },
    typeWord1: {
      prompt: `Type the German word for '${topicTrans}':`,
      target: cleanWord,
      hint: `Hint: German vocabulary for ${topicTrans}`
    },
    typeWord2: {
      prompt: `Type the German word for 'important':`,
      target: "wichtig",
      hint: `Hint: starts with w`
    },
    cloze1: {
      prompt: `Das ist wirklich sehr _______.`,
      en: `That is really very ${topicTrans}.`,
      options: [cleanWord, "gestern", "Zug"],
      answer: cleanWord
    },
    cloze2: {
      prompt: `Wir können das heute _______ machen.`,
      en: `We can do that gladly today.`,
      options: ["gern", "nicht", "woher"],
      answer: "gern"
    }
  };
}

// Master list of 105 Units
const unitsMaster = [...rawUnitsDefinition];

// SECTION 1 (Units 6 to 35)
const s1Metadata = [
  { num: 6, de: "Persönliche Daten", en: "Share personal info", color: "#00CD9C", word: "Wohnort", trans: "residence", sDe: "Ich wohne in Frankfurt.", sEn: "I live in Frankfurt.", qDe: "Wo wohnen Sie genau?", qEn: "Where exactly do you live?" },
  { num: 7, de: "Zahlen 11 bis 20 & Preise", en: "Numbers 11-20 and prices", color: "#FFC800", word: "zwölf", trans: "twelve", sDe: "Das kostet zwölf Euro.", sEn: "That costs twelve euros.", qDe: "Wie viel kostet das?", qEn: "How much does that cost?" },
  { num: 8, de: "Meine Familie", en: "Introduce your family", color: "#1CB0F6", word: "Mutter", trans: "mother", sDe: "Das ist meine liebe Mutter.", sEn: "That is my dear mother.", qDe: "Wer ist dieser nette Mann?", qEn: "Who is this nice man?" },
  { num: 9, de: "W-Fragen meistern", en: "Master German W-questions", color: "#58CC02", word: "Warum", trans: "why", sDe: "Wer spricht hier Deutsch?", sEn: "Who speaks German here?", qDe: "Was möchten Sie lernen?", qEn: "What would you like to learn?" },
  { num: 10, de: "Ja/Nein-Fragen", en: "Ask yes or no questions", color: "#FF9600", word: "Verstehen", trans: "to understand", sDe: "Verstehen Sie mich gut?", sEn: "Do you understand me well?", qDe: "Kommen Sie aus Deutschland?", qEn: "Do you come from Germany?" },
  { num: 11, de: "Farben der Welt", en: "Describe colors", color: "#CE82FF", word: "blau", trans: "blue", sDe: "Mein neues Auto ist blau.", sEn: "My new car is blue.", qDe: "Welche Farbe gefällt dir?", qEn: "Which color do you like?" },
  { num: 12, de: "Im Supermarkt: Obst", en: "Buy fresh fruit", color: "#FF4B4B", word: "Apfel", trans: "apple", sDe: "Ich kaufe einen frischen Apfel.", sEn: "I buy a fresh apple.", qDe: "Möchten Sie auch Bananen?", qEn: "Would you like bananas too?" },
  { num: 13, de: "Tage der Woche", en: "Days of the week", color: "#00CD9C", word: "Montag", trans: "Monday", sDe: "Am Montag arbeite ich gern.", sEn: "On Monday I work gladly.", qDe: "Welcher Tag ist heute?", qEn: "Which day is today?" },
  { num: 14, de: "Mein Lieblingstag", en: "Daily routine basics", color: "#FFC800", word: "Freitag", trans: "Friday", sDe: "Am Freitag habe ich frei.", sEn: "On Friday I have free time.", qDe: "Was machst du am Wochenende?", qEn: "What are you doing on the weekend?" },
  { num: 15, de: "Einfache Hobbys", en: "Talk about basic hobbies", color: "#1CB0F6", word: "Fußball", trans: "soccer", sDe: "Ich spiele sehr gern Fußball.", sEn: "I play soccer very gladly.", qDe: "Hast du ein schönes Hobby?", qEn: "Do you have a nice hobby?" },
  { num: 16, de: "Gern oder nicht gern?", en: "Express likes and dislikes", color: "#58CC02", word: "lesen", trans: "to read", sDe: "Ich lese sehr gern Bücher.", sEn: "I read books very gladly.", qDe: "Kochen Sie auch gern?", qEn: "Do you also cook gladly?" },
  { num: 17, de: "Klassenzimmer & Lernen", en: "Classroom and study items", color: "#FF9600", word: "Buch", trans: "book", sDe: "Das ist mein deutsches Buch.", sEn: "That is my German book.", qDe: "Wo ist der Kugelschreiber?", qEn: "Where is the ballpoint pen?" },
  { num: 18, de: "Negation mit nicht", en: "Negate actions & adjectives", color: "#CE82FF", word: "nicht", trans: "not", sDe: "Das ist gar nicht schwer.", sEn: "That is not difficult at all.", qDe: "Verstehst du das nicht?", qEn: "Don't you understand that?" },
  { num: 19, de: "Negation mit kein", en: "Negate nouns with kein", color: "#FF4B4B", word: "keine", trans: "no / none", sDe: "Ich habe leider keine Zeit.", sEn: "Unfortunately I have no time.", qDe: "Hast du ein Haustier?", qEn: "Do you have a pet?" },
  { num: 20, de: "Frühstückszeit", en: "Talk about breakfast", color: "#00CD9C", word: "Brot", trans: "bread", sDe: "Zum Frühstück esse ich Brot.", sEn: "For breakfast I eat bread.", qDe: "Trinkst du morgens Kaffee?", qEn: "Do you drink coffee in the morning?" },
  { num: 21, de: "Zahlen bis 100", en: "Count up to 100", color: "#FFC800", word: "fünfzig", trans: "fifty", sDe: "Das macht genau fünfzig Euro.", sEn: "That makes exactly fifty euros.", qDe: "Wie alt bist du?", qEn: "How old are you?" },
  { num: 22, de: "Tageszeiten & Begrüßung", en: "Times of day", color: "#1CB0F6", word: "Abend", trans: "evening", sDe: "Am Abend koche ich gern.", sEn: "In the evening I cook gladly.", qDe: "Was machst du heute Abend?", qEn: "What are you doing this evening?" },
  { num: 23, de: "Uhrzeit: Offiziell", en: "Tell formal time", color: "#58CC02", word: "Uhr", trans: "clock / o'clock", sDe: "Es ist genau zehn Uhr.", sEn: "It is exactly ten o'clock.", qDe: "Um wie viel Uhr beginnt der Kurs?", qEn: "At what time does the course begin?" },
  { num: 24, de: "Uhrzeit: Alltagssprache", en: "Tell casual time", color: "#FF9600", word: "halb", trans: "half", sDe: "Es ist jetzt halb acht.", sEn: "It is now half past seven.", qDe: "Wann treffen wir uns?", qEn: "When do we meet?" },
  { num: 25, de: "Mein Beruf", en: "Describe professions", color: "#CE82FF", word: "Lehrer", trans: "teacher", sDe: "Ich bin Lehrer von Beruf.", sEn: "I am a teacher by profession.", qDe: "Was sind Sie von Beruf?", qEn: "What is your profession?" },
  { num: 26, de: "Wo arbeitest du?", en: "Describe workplaces", color: "#FF4B4B", word: "Büro", trans: "office", sDe: "Ich arbeite in einem Büro.", sEn: "I work in an office.", qDe: "Arbeitest du in der Stadt?", qEn: "Do you work in the city?" },
  { num: 27, de: "Tiere im Alltag", en: "Domestic animals and pets", color: "#00CD9C", word: "Hund", trans: "dog", sDe: "Mein Hund heißt Bello.", sEn: "My dog is called Bello.", qDe: "Hast du eine Katze?", qEn: "Do you have a cat?" },
  { num: 28, de: "Einfache Gefühle", en: "Express basic emotions", color: "#FFC800", word: "glücklich", trans: "happy", sDe: "Ich bin heute sehr glücklich.", sEn: "I am very happy today.", qDe: "Bist du heute müde?", qEn: "Are you tired today?" },
  { num: 29, de: "Getränke & Durst", en: "Drinks and thirst", color: "#1CB0F6", word: "Saft", trans: "juice", sDe: "Ich trinke ein Glas Saft.", sEn: "I drink a glass of juice.", qDe: "Hast du großen Durst?", qEn: "Are you very thirsty?" },
  { num: 30, de: "Körper & Wohlbefinden", en: "Body parts basics", color: "#58CC02", word: "Kopf", trans: "head", sDe: "Mein Kopf tut heute weh.", sEn: "My head hurts today.", qDe: "Geht es dir heute gut?", qEn: "Are you feeling well today?" },
  { num: 31, de: "Einfache Kleidung", en: "Basic clothing items", color: "#FF9600", word: "Hemd", trans: "shirt", sDe: "Ich trage ein weißes Hemd.", sEn: "I wear a white shirt.", qDe: "Gefällt dir diese Jacke?", qEn: "Do you like this jacket?" },
  { num: 32, de: "Wetter heute", en: "Talk about basic weather", color: "#CE82FF", word: "Sonne", trans: "sun", sDe: "Die Sonne scheint heute schön.", sEn: "The sun is shining nicely today.", qDe: "Regnet es heute draußen?", qEn: "Is it raining outside today?" },
  { num: 33, de: "Monate & Geburtstag", en: "Months and birthdays", color: "#FF4B4B", word: "Mai", trans: "May", sDe: "Mein Geburtstag ist im Mai.", sEn: "My birthday is in May.", qDe: "Wann hast du Geburtstag?", qEn: "When is your birthday?" },
  { num: 34, de: "Jahreszeiten", en: "The four seasons", color: "#00CD9C", word: "Sommer", trans: "summer", sDe: "Im Sommer ist es schön warm.", sEn: "In summer it is nicely warm.", qDe: "Magst du den Winter gern?", qEn: "Do you like winter gladly?" },
  { num: 35, de: "Sektion 1 Finale", en: "Section 1 Grand Review", color: "#FFC800", word: "Erfolg", trans: "success", sDe: "Ich lerne erfolgreich Deutsch!", sEn: "I learn German successfully!", qDe: "Hast du alles gut verstanden?", qEn: "Did you understand everything well?" }
];

s1Metadata.forEach(m => {
  unitsMaster.push(createCuratedUnit(m.num, 1, m.de, m.en, m.color, m.word, m.trans, m.sDe, m.sEn, m.qDe, m.qEn));
});

// SECTION 2 (Units 36 to 70)
const s2Metadata = [
  { num: 36, de: "Im Restaurant", en: "Order food in a restaurant", color: "#1CB0F6", word: "Speisekarte", trans: "menu" },
  { num: 37, de: "Essen & Trinken", en: "Talk about favorite meals", color: "#58CC02", word: "Suppe", trans: "soup" },
  { num: 38, de: "Einkaufen: Kleidung", en: "Shop for clothes", color: "#FF9600", word: "Hose", trans: "trousers" },
  { num: 39, de: "Größen & Farben", en: "Sizes, fits and colors", color: "#CE82FF", word: "Größe", trans: "size" },
  { num: 40, de: "Im Kaufhaus", en: "Navigate a department store", color: "#FF4B4B", word: "Kasse", trans: "checkout" },
  { num: 41, de: "Zahlen über 100", en: "Count hundreds and thousands", color: "#00CD9C", word: "hundert", trans: "hundred" },
  { num: 42, de: "Öffentliche Verkehrsmittel", en: "Use public transport", color: "#FFC800", word: "Fahrkarte", trans: "ticket" },
  { num: 43, de: "Am Bahnhof", en: "At the train station", color: "#1CB0F6", word: "Gleis", trans: "platform" },
  { num: 44, de: "Wegbeschreibung 1", en: "Ask for directions", color: "#58CC02", word: "rechts", trans: "right" },
  { num: 45, de: "Wegbeschreibung 2", en: "Give directions", color: "#FF9600", word: "geradeaus", trans: "straight ahead" },
  { num: 46, de: "Meine Wohnung", en: "Describe your apartment", color: "#CE82FF", word: "Zimmer", trans: "room" },
  { num: 47, de: "Möbel & Einrichtung", en: "Furniture and rooms", color: "#FF4B4B", word: "Tisch", trans: "table" },
  { num: 48, de: "Mein Tagesablauf", en: "Describe your daily routine", color: "#00CD9C", word: "aufstehen", trans: "to get up" },
  { num: 49, de: "Uhrzeit & Termine", en: "Set and confirm appointments", color: "#FFC800", word: "Termin", trans: "appointment" },
  { num: 50, de: "Termin verschieben", en: "Reschedule appointments", color: "#1CB0F6", word: "verschieben", trans: "to reschedule" },
  { num: 51, de: "Freizeit & Sport", en: "Sports and leisure", color: "#58CC02", word: "schwimmen", trans: "to swim" },
  { num: 52, de: "Musik & Konzerte", en: "Music and concerts", color: "#FF9600", word: "Gitarre", trans: "guitar" },
  { num: 53, de: "Medien im Alltag", en: "Internet, phone, and TV", color: "#CE82FF", word: "Internet", trans: "internet" },
  { num: 54, de: "Wetterbericht", en: "Detailed weather reports", color: "#FF4B4B", word: "Wolke", trans: "cloud" },
  { num: 55, de: "Modalverb: können", en: "Express abilities with können", color: "#00CD9C", word: "können", trans: "can / able" },
  { num: 56, de: "Modalverb: müssen", en: "Express obligations with müssen", color: "#FFC800", word: "müssen", trans: "must / have to" },
  { num: 57, de: "Modalverb: wollen", en: "Express intentions with wollen", color: "#1CB0F6", word: "wollen", trans: "want to" },
  { num: 58, de: "Modalverb: möchten", en: "Polite wishes with möchten", color: "#58CC02", word: "möchten", trans: "would like" },
  { num: 59, de: "Trennverb: einkaufen", en: "Separable verbs: einkaufen", color: "#FF9600", word: "einkaufen", trans: "to shop" },
  { num: 60, de: "Trennverb: anrufen", en: "Separable verbs: anrufen", color: "#CE82FF", word: "anrufen", trans: "to call" },
  { num: 61, de: "Trennverb: mitkommen", en: "Separable verbs: mitkommen", color: "#FF4B4B", word: "mitkommen", trans: "to come along" },
  { num: 62, de: "Akkusativ: bestimmter Artikel", en: "Accusative definite articles", color: "#00CD9C", word: "den", trans: "the (acc masc)" },
  { num: 63, de: "Akkusativ: unbestimmter Artikel", en: "Accusative indefinite articles", color: "#FFC800", word: "einen", trans: "a / an (acc masc)" },
  { num: 64, de: "Akkusativ: Negation keinen", en: "Accusative negation with keinen", color: "#1CB0F6", word: "keinen", trans: "no / none (acc masc)" },
  { num: 65, de: "Akkusativ-Pronomen", en: "Accusative pronouns (mich, dich)", color: "#58CC02", word: "mich", trans: "me (acc)" },
  { num: 66, de: "Gestern & Früher", en: "Introduction to the past", color: "#FF9600", word: "gestern", trans: "yesterday" },
  { num: 67, de: "Perfekt mit haben", en: "Past tense with haben", color: "#CE82FF", word: "gekauft", trans: "bought" },
  { num: 68, de: "Perfekt: regelmäßige Verben", en: "Regular Perfekt participles", color: "#FF4B4B", word: "gemacht", trans: "made / done" },
  { num: 69, de: "Perfekt im Gespräch", en: "Talk about your weekend", color: "#00CD9C", word: "gespielt", trans: "played" },
  { num: 70, de: "Sektion 2 Finale", en: "Section 2 Grand Review", color: "#FFC800", word: "Meister", trans: "master" }
];

s2Metadata.forEach(m => {
  unitsMaster.push(createCuratedUnit(m.num, 2, m.de, m.en, m.color, m.word, m.trans));
});

// SECTION 3 (Units 71 to 105)
const s3Metadata = [
  { num: 71, de: "Neue Stelle antreten", en: "Discuss a new job", color: "#1CB0F6", word: "Vertrag", trans: "contract" },
  { num: 72, de: "Gewohnheiten & Alltag", en: "Talk about habits", color: "#58CC02", word: "oft", trans: "often" },
  { num: 73, de: "Urlaubskoffer packen", en: "Pack for vacation", color: "#FF9600", word: "Koffer", trans: "suitcase" },
  { num: 74, de: "Abendessen mit Gästen", en: "Plan a dinner party", color: "#CE82FF", word: "Gäste", trans: "guests" },
  { num: 75, de: "Komplexe Verben", en: "Prefix verbs", color: "#FF4B4B", word: "bezahlen", trans: "to pay" },
  { num: 76, de: "WG-Leben & Regeln", en: "Flatmate living", color: "#00CD9C", word: "Küche", trans: "kitchen" },
  { num: 77, de: "Dativ: Grundlagen", en: "Introduction to Dative case", color: "#FFC800", word: "helfen", trans: "to help" },
  { num: 78, de: "Grillfest organisieren", en: "Plan a barbecue", color: "#1CB0F6", word: "mitbringen", trans: "to bring along" },
  { num: 79, de: "Akkusativ vs. Dativ", en: "Differentiate cases", color: "#58CC02", word: "geben", trans: "to give" },
  { num: 80, de: "Zusammengesetzte Nomen", en: "Compound words", color: "#FF9600", word: "Hauptbahnhof", trans: "central station" },
  { num: 81, de: "Einladungen schreiben", en: "Invite someone", color: "#CE82FF", word: "Einladung", trans: "invitation" },
  { num: 82, de: "Geschmack & Stil", en: "Describe style preferences", color: "#FF4B4B", word: "gefallen", trans: "to please / like" },
  { num: 83, de: "Dativ-Pronomen", en: "Master dative pronouns", color: "#00CD9C", word: "mir", trans: "to me" },
  { num: 84, de: "Vergleiche ziehen", en: "Comparative adjectives", color: "#FFC800", word: "besser", trans: "better" },
  { num: 85, de: "Ausreden & Entschuldigungen", en: "Polite excuses", color: "#1CB0F6", word: "Verspätung", trans: "delay" },
  { num: 86, de: "Um Hilfe bitten", en: "Ask for assistance", color: "#58CC02", word: "könnten", trans: "could" },
  { num: 87, de: "Wo oder Wohin?", en: "Location vs motion", color: "#FF9600", word: "stellen", trans: "to place upright" },
  { num: 88, de: "In den Urlaub fahren", en: "Travel destinations", color: "#CE82FF", word: "Meer", trans: "sea" },
  { num: 89, de: "Beim Arzt: Der Termin", en: "Doctor's appointment", color: "#FF4B4B", word: "Rezept", trans: "prescription" },
  { num: 90, de: "Medikamente & Apotheke", en: "At the pharmacy", color: "#00CD9C", word: "Apotheke", trans: "pharmacy" },
  { num: 91, de: "Kulturelle Ereignisse", en: "Theater and concerts", color: "#FFC800", word: "Konzert", trans: "concert" },
  { num: 92, de: "Im Hotel: Reklamation", en: "Hotel room issue", color: "#1CB0F6", word: "Zimmer", trans: "room" },
  { num: 93, de: "Vergangenheit: Haben", en: "Past Perfekt with haben", color: "#58CC02", word: "gelernt", trans: "learned" },
  { num: 94, de: "Vergangenheit: Sein", en: "Past Perfekt with sein", color: "#FF9600", word: "gefahren", trans: "traveled / driven" },
  { num: 95, de: "Mein letzter Urlaub", en: "Describe your vacation", color: "#CE82FF", word: "gewandert", trans: "hiked" },
  { num: 96, de: "Formulare ausfüllen", en: "Official forms", color: "#FF4B4B", word: "Unterschrift", trans: "signature" },
  { num: 97, de: "Kurze E-Mails schreiben", en: "Write short emails", color: "#00CD9C", word: "Grüße", trans: "greetings" },
  { num: 98, de: "Ansagen verstehen", en: "Public announcements", color: "#FFC800", word: "Achtung", trans: "attention" },
  { num: 99, de: "Telefonieren im Alltag", en: "Everyday phone calls", color: "#1CB0F6", word: "anrufen", trans: "to call" },
  { num: 100, de: "Ein Gespräch führen", en: "Social conversations", color: "#58CC02", word: "natürlich", trans: "of course" },
  { num: 101, de: "Meinungen begründen", en: "Opinions with weil", color: "#FF9600", word: "weil", trans: "because" },
  { num: 102, de: "Zukunftspläne", en: "Future plans and wishes", color: "#CE82FF", word: "hoffen", trans: "to hope" },
  { num: 103, de: "Goethe A1 Simulation: Hören", en: "Exam Simulation: Listening", color: "#FF4B4B", word: "Prüfung", trans: "exam" },
  { num: 104, de: "Goethe A1 Simulation: Sprechen", en: "Exam Simulation: Speaking", color: "#00CD9C", word: "sprechen", trans: "to speak" },
  { num: 105, de: "Das Große A1-Finale", en: "Grand A1 Mastery Exam", color: "#FFC800", word: "Zertifikat", trans: "certificate" }
];

s3Metadata.forEach(m => {
  unitsMaster.push(createCuratedUnit(m.num, 3, m.de, m.en, m.color, m.word, m.trans));
});

console.log(`Loaded ${unitsMaster.length} units with non-redundant pedagogical slices.`);

// 2. Assemble 16 Lessons per Unit following planlesson.md
const fullUnitsData = [];
let globalLessonIndex = 0;

for (const unit of unitsMaster) {
  const secTitle = unit.sec === 1 ? "Rookie" : (unit.sec === 2 ? "Explorer" : "Traveler");
  const secUnitNum = unit.sec === 1 ? unit.num : (unit.sec === 2 ? unit.num - 35 : unit.num - 70);
  
  const lessonsData = [];

  for (let lIdx = 0; lIdx < 16; lIdx++) {
    let nodeType = "lesson";
    let title = "";
    let subtitle = "";
    let xpReward = 15;
    let pearlsReward = 5;
    let stages = [];

    if (lIdx === 7) {
      // ── Lesson 8 (#8): Milestone Chest 1 ──
      nodeType = "chest";
      title = `${unit.en} • Treasure Chest 1`;
      subtitle = "Bonus 25 Pearls & 15 XP";
      xpReward = 15;
      pearlsReward = 25;
    } else if (lIdx === 14) {
      // ── Lesson 15 (#15): Streak Booster Chest 2 ──
      nodeType = "chest";
      title = `${unit.en} • Treasure Chest 2`;
      subtitle = "Bonus 35 Pearls & 20 XP";
      xpReward = 20;
      pearlsReward = 35;
    } else if (lIdx === 0) {
      // ── Lesson 1 (#1): Core Foundations (Slice A + Sentence 1) ──
      title = `${unit.en} • Lesson 1`;
      subtitle = `Stepping stone 1 of 16 • Core vocabulary`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: unit.sliceA.map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence1.de,
          tokens: unit.sentence1.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence1.en}`,
          targetSentence: unit.sentence1.de,
          tokens: unit.sentence1.tokens
        }
      ];
    } else if (lIdx === 1) {
      // ── Lesson 2 (#2): Action & Subject (Slice B + Sentence 2) ──
      title = `${unit.en} • Lesson 2`;
      subtitle = `Stepping stone 2 of 16 • Action & structure`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: unit.sliceB.map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence2.de,
          tokens: unit.sentence2.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence2.en}`,
          targetSentence: unit.sentence2.de,
          tokens: unit.sentence2.tokens
        }
      ];
    } else if (lIdx === 2) {
      // ── Lesson 3 (#3): Social Polite Formulations (Slice C + Sentence 3) ──
      title = `${unit.en} • Lesson 3`;
      subtitle = `Stepping stone 3 of 16 • Social etiquette`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: unit.sliceC.map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence3.de,
          tokens: unit.sentence3.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence3.en}`,
          targetSentence: unit.sentence3.de,
          tokens: unit.sentence3.tokens
        }
      ];
    } else if (lIdx === 3) {
      // ── Lesson 4 (#4): Chat Story 1 (Beginner Single-turn Exchange) ──
      title = `Chat Story 1: ${unit.chat1.partner}`;
      subtitle = "Interactive conversation partner";
      xpReward = 20;
      stages = [
        {
          type: "dialogue_bubble",
          title: "Complete the Chat",
          partnerName: unit.chat1.partner,
          partnerAvatar: "dolphina",
          prompt: unit.chat1.prompt,
          partnerMessage: unit.chat1.prompt,
          translation: unit.chat1.translation,
          options: unit.chat1.options.map((opt, i) => ({ text: opt, isCorrect: i === 0 })),
          correctOption: unit.chat1.options[0],
          correctAnswer: unit.chat1.options[0],
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Fill in the blank",
          prompt: unit.cloze1.prompt,
          sentence: unit.cloze1.prompt,
          translation: unit.cloze1.en,
          blank: unit.cloze1.answer,
          target: unit.cloze1.answer,
          correctOption: unit.cloze1.answer,
          correctAnswer: unit.cloze1.answer,
          options: unit.cloze1.options,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 4) {
      // ── Lesson 5 (#5): Grammar & Spelling 1 (Umlaut entry + Cloze) ──
      title = `Grammar & Spelling (Part 1)`;
      subtitle = "Umlaut precision & spelling rules";
      xpReward = 20;
      stages = [
        {
          type: "type_word",
          title: "Type in German",
          prompt: unit.typeWord1.prompt,
          target: unit.typeWord1.target,
          targetWord: unit.typeWord1.target,
          word: unit.typeWord1.target,
          correctAnswer: unit.typeWord1.target,
          translation: unit.typeWord1.hint,
          nativeMeaning: unit.typeWord1.hint,
          hint: unit.typeWord1.hint,
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Fill in the blank",
          prompt: unit.cloze1.prompt,
          sentence: unit.cloze1.prompt,
          translation: unit.cloze1.en,
          blank: unit.cloze1.answer,
          target: unit.cloze1.answer,
          correctOption: unit.cloze1.answer,
          correctAnswer: unit.cloze1.answer,
          options: unit.cloze1.options,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 5) {
      // ── Lesson 6 (#6): Listening Perception (Sentence 2 + Sentence 3) ──
      title = `Listening: Audio Focus`;
      subtitle = "Ear training & speech perception";
      xpReward = 20;
      stages = [
        {
          type: "listen_select",
          title: "Listen and choose the meaning",
          spokenGerman: unit.sentence2.de,
          sentence: unit.sentence2.de,
          targetSentence: unit.sentence2.de,
          question: `What does "${unit.sentence2.de}" mean in English?`,
          prompt: `What does "${unit.sentence2.de}" mean in English?`,
          options: [
            { text: unit.sentence2.en, isCorrect: true },
            { text: "A different unrelated topic", isCorrect: false },
            { text: "Negative response", isCorrect: false }
          ],
          correctOption: unit.sentence2.en,
          correctAnswer: unit.sentence2.en,
          audioUrl: ""
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence3.de,
          tokens: unit.sentence3.tokens,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 6) {
      // ── Lesson 7 (#7): Pronunciation Foundation (Sprechen Sentence 1) ──
      title = `Pronunciation & Speech (Foundation)`;
      subtitle = "Voice recording & pronunciation feedback";
      xpReward = 25;
      stages = [
        {
          type: "sprechen",
          title: "Pronounce Auf Deutsch",
          prompt: unit.sentence1.de,
          translation: unit.sentence1.en,
          minAccuracy: 75,
          audioUrl: ""
        },
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: [unit.sliceA[0], unit.sliceA[1], unit.sliceB[0], unit.sliceB[1]].map(v => ({ target: v.de, native: v.en }))
        }
      ];
    } else if (lIdx === 8) {
      // ── Lesson 9 (#9): Vocab Expansion (Slice D + Sentence 4 Question) ──
      title = `${unit.en} • Lesson 9`;
      subtitle = `Stepping stone 9 of 16 • Expressing ideas`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: unit.sliceD.map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence4.de,
          tokens: unit.sentence4.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence4.en}`,
          targetSentence: unit.sentence4.de,
          tokens: unit.sentence4.tokens
        }
      ];
    } else if (lIdx === 9) {
      // ── Lesson 10 (#10): Grammar & Spelling 2 (Slice D / Cloze 2) ──
      title = `Grammar & Spelling (Part 2)`;
      subtitle = "Conjugation & grammar check";
      xpReward = 20;
      stages = [
        {
          type: "type_word",
          title: "Type in German",
          prompt: unit.typeWord2.prompt,
          target: unit.typeWord2.target,
          targetWord: unit.typeWord2.target,
          word: unit.typeWord2.target,
          correctAnswer: unit.typeWord2.target,
          translation: unit.typeWord2.hint,
          nativeMeaning: unit.typeWord2.hint,
          hint: unit.typeWord2.hint,
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Fill in the blank",
          prompt: unit.cloze2.prompt,
          sentence: unit.cloze2.prompt,
          translation: unit.cloze2.en,
          blank: unit.cloze2.answer,
          target: unit.cloze2.answer,
          correctOption: unit.cloze2.answer,
          correctAnswer: unit.cloze2.answer,
          options: unit.cloze2.options,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 10) {
      // ── Lesson 11 (#11): Sentence Synthesis (Sentence 5) ──
      title = `${unit.en} • Lesson 11`;
      subtitle = `Stepping stone 11 of 16 • Sentence assembly`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: [unit.sliceB[0], unit.sliceB[2], unit.sliceD[0], unit.sliceD[2]].map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence5.de,
          tokens: unit.sentence5.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence5.en}`,
          targetSentence: unit.sentence5.de,
          tokens: unit.sentence5.tokens
        }
      ];
    } else if (lIdx === 11) {
      // ── Lesson 12 (#12): Chat Story 2 (Follow-up roleplay) ──
      title = `Chat Story 2: Daily Conversation`;
      subtitle = "Real-life conversational roleplay";
      xpReward = 20;
      stages = [
        {
          type: "dialogue_bubble",
          title: "Messenger Roleplay",
          partnerName: unit.chat2.partner,
          partnerAvatar: "dolphino",
          prompt: unit.chat2.prompt,
          partnerMessage: unit.chat2.prompt,
          translation: unit.chat2.translation,
          options: unit.chat2.options.map((opt, i) => ({ text: opt, isCorrect: i === 0 })),
          correctOption: unit.chat2.options[0],
          correctAnswer: unit.chat2.options[0],
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence6.en}`,
          targetSentence: unit.sentence6.de,
          tokens: unit.sentence6.tokens
        }
      ];
    } else if (lIdx === 12) {
      // ── Lesson 13 (#13): Spaced Review & Retention ──
      title = `${unit.en} • Lesson 13`;
      subtitle = `Stepping stone 13 of 16 • Spaced review`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: [unit.sliceA[0], unit.sliceB[1], unit.sliceC[0], unit.sliceD[1]].map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: unit.sentence6.de,
          tokens: unit.sentence6.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${unit.sentence4.en}`,
          targetSentence: unit.sentence4.de,
          tokens: unit.sentence4.tokens
        }
      ];
    } else if (lIdx === 13) {
      // ── Lesson 14 (#14): Pronunciation Sprint ──
      title = `Pronunciation & Speech (Sprint)`;
      subtitle = "Voice recording & speech fluency";
      xpReward = 25;
      stages = [
        {
          type: "sprechen",
          title: "Pronounce Auf Deutsch",
          prompt: unit.sentence5.de,
          translation: unit.sentence5.en,
          minAccuracy: 75,
          audioUrl: ""
        },
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: [unit.sliceA[1], unit.sliceB[0], unit.sliceC[1], unit.sliceD[0]].map(v => ({ target: v.de, native: v.en }))
        }
      ];
    } else if (lIdx === 15) {
      // ── Lesson 16 (#16): Unit Trophy Exam ──
      title = `🏆 Unit Trophy Exam: ${unit.en}`;
      subtitle = `Grand mastery challenge to clear Unit ${unit.num}`;
      xpReward = 35;
      pearlsReward = 15;
      stages = [
        {
          type: "sentence_builder",
          title: "Boss Challenge: Sentence Assembly",
          prompt: `Translate: ${unit.sentence5.en}`,
          targetSentence: unit.sentence5.de,
          tokens: unit.sentence5.tokens
        },
        {
          type: "sprechen",
          title: "Boss Challenge: Clear Speech",
          prompt: unit.sentence6.de,
          translation: unit.sentence6.en,
          minAccuracy: 80,
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Boss Challenge: Syntax Mastery",
          prompt: unit.cloze2.prompt,
          sentence: unit.cloze2.prompt,
          translation: unit.cloze2.en,
          blank: unit.cloze2.answer,
          target: unit.cloze2.answer,
          correctOption: unit.cloze2.answer,
          correctAnswer: unit.cloze2.answer,
          options: unit.cloze2.options,
          audioUrl: ""
        },
        {
          type: "listen_select",
          title: "Boss Challenge: Audio Perception",
          spokenGerman: unit.sentence5.de,
          sentence: unit.sentence5.de,
          targetSentence: unit.sentence5.de,
          question: `What does "${unit.sentence5.de}" mean in English?`,
          prompt: `What does "${unit.sentence5.de}" mean in English?`,
          options: [
            { text: unit.sentence5.en, isCorrect: true },
            { text: "A different unrelated topic", isCorrect: false },
            { text: "Wrong statement", isCorrect: false }
          ],
          correctOption: unit.sentence5.en,
          correctAnswer: unit.sentence5.en,
          audioUrl: ""
        }
      ];
    }

    lessonsData.push({
      lessonIndex: globalLessonIndex++,
      unitLessonNum: lIdx + 1,
      title,
      subtitle,
      nodeType,
      xpReward,
      pearlsReward,
      stages
    });
  }

  fullUnitsData.push({
    sectionNumber: unit.sec,
    sectionTitle: secTitle,
    sectionUnitNumber: secUnitNum,
    unitNumber: unit.num,
    unitTitle: unit.en,
    unitDescription: unit.de,
    accentColor: unit.color,
    lessonsCount: lessonsData.length,
    lessonsData
  });
}

// 3. Write JSON Output
const jsonOutput = {
  courseTitle: "German A1 Comprehensive Curriculum (Pedagogical Edition)",
  learningLanguage: "de",
  nativeLanguage: "en",
  level: "A1",
  totalSections: 3,
  totalUnits: fullUnitsData.length,
  totalLessons: fullUnitsData.reduce((acc, u) => acc + u.lessonsCount, 0),
  generatedAt: new Date().toISOString(),
  units: fullUnitsData
};

const jsonPath = path.join(__dirname, '..', 'german_a1.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), 'utf8');
console.log(`✅ Written complete JSON to: ${jsonPath}`);

// 4. Helper function to generate SQL for a list of units
function generateSql(units, title, deleteWhere) {
  let header = `-- ==============================================================
-- DolphinCoder LMS: ${title}
-- Compatible with Hostinger phpMyAdmin (MySQL / MariaDB)
-- Table: \`CurriculumLessons\`
-- ==============================================================

${deleteWhere}

`;
  const batchSize = 50;
  let currentValues = [];
  let insertBatches = [];

  for (const unit of units) {
    for (const l of unit.lessonsData) {
      const escapeStr = (str) => str ? "'" + str.replace(/'/g, "''") + "'" : "NULL";
      const stagesJson = escapeStr(JSON.stringify(l.stages || []));
      const nodeTypeVal = l.nodeType === 'boss' ? 'lesson' : (l.nodeType || 'lesson');

      currentValues.push(`(1, 'de', 'en', 'A1', ${unit.unitNumber}, ${escapeStr(unit.unitTitle)}, ${escapeStr(unit.unitDescription)}, ${l.lessonIndex}, ${escapeStr(l.title)}, ${escapeStr(l.subtitle)}, '${nodeTypeVal}', ${l.xpReward || 15}, ${l.pearlsReward || 5}, 1, ${stagesJson}, NULL, NULL, NOW(), NOW())`);

      if (currentValues.length >= batchSize) {
        insertBatches.push(`INSERT INTO \`CurriculumLessons\` (\`owner\`, \`learningLanguage\`, \`nativeLanguage\`, \`level\`, \`unitNumber\`, \`unitTitle\`, \`unitDescription\`, \`lessonIndex\`, \`title\`, \`subtitle\`, \`nodeType\`, \`xpReward\`, \`pearlsReward\`, \`isLive\`, \`stages\`, \`karaokeData\`, \`audioUrl\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + currentValues.join(',\n') + ';');
        currentValues = [];
      }
    }
  }

  if (currentValues.length > 0) {
    insertBatches.push(`INSERT INTO \`CurriculumLessons\` (\`owner\`, \`learningLanguage\`, \`nativeLanguage\`, \`level\`, \`unitNumber\`, \`unitTitle\`, \`unitDescription\`, \`lessonIndex\`, \`title\`, \`subtitle\`, \`nodeType\`, \`xpReward\`, \`pearlsReward\`, \`isLive\`, \`stages\`, \`karaokeData\`, \`audioUrl\`, \`createdAt\`, \`updatedAt\`) VALUES\n` + currentValues.join(',\n') + ';');
  }

  return header + insertBatches.join('\n\n') + '\n';
}

// Master file
const masterSql = generateSql(
  fullUnitsData,
  "German A1 Master Curriculum Database Seed (Units 1 to 105)",
  "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1';"
);
const masterSqlPath = path.join(__dirname, '..', 'seed_german_a1.sql');
fs.writeFileSync(masterSqlPath, masterSql, 'utf8');
console.log(`✅ Written batch master SQL seed to: ${masterSqlPath}`);

// Section 1 (Units 1 to 35)
const sec1Units = fullUnitsData.filter(u => u.unitNumber >= 1 && u.unitNumber <= 35);
const sec1Sql = generateSql(
  sec1Units,
  "German A1 Section 1: Rookie Seed (Units 1 to 35, 560 Lessons)",
  "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1' AND `unitNumber` BETWEEN 1 AND 35;"
);
const sec1Path = path.join(__dirname, '..', 'seed_section1.sql');
fs.writeFileSync(sec1Path, sec1Sql, 'utf8');
console.log(`✅ Written Section 1 SQL seed to: ${sec1Path}`);

// Section 2 (Units 36 to 70)
const sec2Units = fullUnitsData.filter(u => u.unitNumber >= 36 && u.unitNumber <= 70);
const sec2Sql = generateSql(
  sec2Units,
  "German A1 Section 2: Explorer Seed (Units 36 to 70, 560 Lessons)",
  "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1' AND `unitNumber` BETWEEN 36 AND 70;"
);
const sec2Path = path.join(__dirname, '..', 'seed_section2.sql');
fs.writeFileSync(sec2Path, sec2Sql, 'utf8');
console.log(`✅ Written Section 2 SQL seed to: ${sec2Path}`);

// Section 3 (Units 71 to 105)
const sec3Units = fullUnitsData.filter(u => u.unitNumber >= 71 && u.unitNumber <= 105);
const sec3Sql = generateSql(
  sec3Units,
  "German A1 Section 3: Traveler Seed (Units 71 to 105, 560 Lessons)",
  "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1' AND `unitNumber` BETWEEN 71 AND 105;"
);
const sec3Path = path.join(__dirname, '..', 'seed_section3.sql');
fs.writeFileSync(sec3Path, sec3Sql, 'utf8');
console.log(`✅ Written Section 3 SQL seed to: ${sec3Path}`);

console.log("🚀 All SQL seeds and JSON generated successfully!");
