const fs = require('fs');
const path = require('path');

/**
 * Full CEFR German A1 Curriculum Generator
 * 3 Sections x 35 Units = 105 Units
 * 16 Lessons per Unit = 1,680 Lessons
 * Outputs:
 * - german_a1.json
 * - seed_german_a1.sql
 */

// 1. Master List of 105 Units with authentic CEFR A1 themes, grammar, and vocabulary
const unitsMaster = [
  // SECTION 1: ROOKIE (Units 1 to 35)
  { num: 1, sec: 1, de: "Erste Begrüßungen", en: "Greet and introduce yourself", color: "#1CB0F6",
    vocab: [
      { de: "Hallo", en: "Hello" },
      { de: "Guten Morgen", en: "Good morning" },
      { de: "Guten Tag", en: "Good day / Hello" },
      { de: "Tschüss", en: "Bye" },
      { de: "Danke", en: "Thank you" },
      { de: "Bitte", en: "Please / You're welcome" }
    ],
    sentences: [
      { de: "Guten Morgen! Wie geht es dir?", en: "Good morning! How are you?", tokens: ["Guten", "Morgen!", "Wie", "geht", "es", "dir?", "Kaffee", "Tee"] },
      { de: "Hallo, ich heiße Lukas.", en: "Hello, my name is Lukas.", tokens: ["Hallo,", "ich", "heiße", "Lukas.", "wer", "bist"] },
      { de: "Danke schön und auf Wiedersehen!", en: "Thank you very much and goodbye!", tokens: ["Danke", "schön", "und", "auf", "Wiedersehen!", "Bitte"] }
    ],
    dialogue: { partner: "Anna", prompt: "Hallo! Ich bin Anna. Und wer bist du?", translation: "Hello! I am Anna. And who are you?", options: ["Ich heiße David, freut mich!", "Nein, danke schön."] },
    chatPrompt: "Wie heißt du?", chatReply: "Ich heiße David.",
    cloze: { prompt: "Guten Tag, wie _______ es Ihnen?", en: "Hello, how are you?", options: ["geht", "heißt", "bist"], answer: "geht" },
    typeWord: { prompt: "Type the German word for 'Goodbye' (casual):", target: "Tschüss" }
  },
  { num: 2, sec: 1, de: "Im Café bestellen", en: "Order at a café", color: "#58CC02",
    vocab: [
      { de: "Kaffee", en: "coffee" },
      { de: "Tee", en: "tea" },
      { de: "Wasser", en: "water" },
      { de: "Milch", en: "milk" },
      { de: "Zucker", en: "sugar" },
      { de: "Rechnung", en: "bill" }
    ],
    sentences: [
      { de: "Ich möchte einen Kaffee mit Milch.", en: "I would like a coffee with milk.", tokens: ["Ich", "möchte", "einen", "Kaffee", "mit", "Milch.", "Tee", "Zucker"] },
      { de: "Ein Glas Wasser, bitte.", en: "A glass of water, please.", tokens: ["Ein", "Glas", "Wasser,", "bitte.", "Kaffee", "Milch"] },
      { de: "Die Rechnung, bitte!", en: "The bill, please!", tokens: ["Die", "Rechnung,", "bitte!", "Zucker", "Tee"] }
    ],
    dialogue: { partner: "Kellner", prompt: "Guten Tag! Was möchten Sie trinken?", translation: "Good day! What would you like to drink?", options: ["Einen Kaffee mit Zucker, bitte.", "Ich komme aus Deutschland."] },
    chatPrompt: "Möchten Sie auch Zucker?", chatReply: "Ja, gern.",
    cloze: { prompt: "Ich _______ einen Tee mit Zitrone, bitte.", en: "I would like a tea with lemon, please.", options: ["möchte", "trinke", "habe"], answer: "möchte" },
    typeWord: { prompt: "Type the German word for 'tea':", target: "Tee" }
  },
  { num: 3, sec: 1, de: "Zahlen 1 bis 10", en: "Count from 1 to 10", color: "#FF9600",
    vocab: [
      { de: "eins", en: "one" },
      { de: "zwei", en: "two" },
      { de: "drei", en: "three" },
      { de: "vier", en: "four" },
      { de: "fünf", en: "five" },
      { de: "zehn", en: "ten" }
    ],
    sentences: [
      { de: "Das macht zwei Euro.", en: "That makes two euros.", tokens: ["Das", "macht", "zwei", "Euro.", "drei", "zehn"] },
      { de: "Ich habe vier Äpfel.", en: "I have four apples.", tokens: ["Ich", "habe", "vier", "Äpfel.", "fünf", "eins"] }
    ],
    dialogue: { partner: "Kassierer", prompt: "Das macht zusammen fünf Euro, bitte.", translation: "That makes five euros altogether, please.", options: ["Hier sind fünf Euro, danke.", "Ich bin müde."] },
    chatPrompt: "Wie viele Brötchen möchten Sie?", chatReply: "Drei Brötchen, bitte.",
    cloze: { prompt: "Eins, zwei, _______, vier, fünf.", en: "One, two, three, four, five.", options: ["drei", "zehn", "acht"], answer: "drei" },
    typeWord: { prompt: "Type the German word for number 5:", target: "fünf" }
  },
  { num: 4, sec: 1, de: "Woher kommst du?", en: "Talk about origins & countries", color: "#CE82FF",
    vocab: [
      { de: "kommen", en: "to come" },
      { de: "aus", en: "from" },
      { de: "Deutschland", en: "Germany" },
      { de: "Österreich", en: "Austria" },
      { de: "Schweiz", en: "Switzerland" },
      { de: "Land", en: "country" }
    ],
    sentences: [
      { de: "Ich komme aus Deutschland.", en: "I come from Germany.", tokens: ["Ich", "komme", "aus", "Deutschland.", "Österreich", "wohne"] },
      { de: "Woher kommst du?", en: "Where do you come from?", tokens: ["Woher", "kommst", "du?", "wer", "bist"] }
    ],
    dialogue: { partner: "Maximilian", prompt: "Hallo! Ich komme aus Berlin. Und du?", translation: "Hello! I come from Berlin. And you?", options: ["Ich komme aus Indien.", "Guten Tag, zwei Euro."] },
    chatPrompt: "Kommst du aus Wien?", chatReply: "Nein, ich komme aus Bern.",
    cloze: { prompt: "Woher _______ Sie, Herr Müller?", en: "Where do you come from, Mr. Müller?", options: ["kommen", "kommst", "kommt"], answer: "kommen" },
    typeWord: { prompt: "Type the German word for 'Austria':", target: "Österreich" }
  },
  { num: 5, sec: 1, de: "Höflichkeit im Alltag", en: "Everyday etiquette", color: "#FF4B4B",
    vocab: [
      { de: "Entschuldigung", en: "Excuse me / Sorry" },
      { de: "Guten Abend", en: "Good evening" },
      { de: "Auf Wiedersehen", en: "Goodbye (formal)" },
      { de: "gern geschehen", en: "you're welcome" },
      { de: "kein Problem", en: "no problem" }
    ],
    sentences: [
      { de: "Entschuldigung, sprechen Sie Deutsch?", en: "Excuse me, do you speak German?", tokens: ["Entschuldigung,", "sprechen", "Sie", "Deutsch?", "Englisch", "bitte"] },
      { de: "Vielen Dank! – Gern geschehen.", en: "Many thanks! – You are welcome.", tokens: ["Vielen", "Dank!", "–", "Gern", "geschehen.", "Hallo"] }
    ],
    dialogue: { partner: "Lisa", prompt: "Vielen Dank für deine Hilfe!", translation: "Many thanks for your help!", options: ["Sehr gern geschehen!", "Tschüss, fünf Euro."] },
    chatPrompt: "Entschuldigung, ist hier noch frei?", chatReply: "Ja, bitte nehmen Sie Platz.",
    cloze: { prompt: "_______, wo ist der Bahnhof?", en: "Excuse me, where is the train station?", options: ["Entschuldigung", "Danke", "Tschüss"], answer: "Entschuldigung" },
    typeWord: { prompt: "Type the German formal word for 'Goodbye':", target: "Auf Wiedersehen" }
  }
];

// Helper to fill units 6 to 35 for Section 1
const section1Themes = [
  { num: 6, de: "Persönliche Daten", en: "Share personal info", color: "#00CD9C", word: "wohnen", target: "Ich wohne in Frankfurt." },
  { num: 7, de: "Zahlen 11 bis 20 & Preise", en: "Numbers 11-20 and prices", color: "#FFC800", word: "zwölf", target: "Das kostet zwölf Euro." },
  { num: 8, de: "Meine Familie", en: "Introduce your family", color: "#1CB0F6", word: "Mutter", target: "Das ist meine Mutter." },
  { num: 9, de: "W-Fragen meistern", en: "Master German W-questions", color: "#58CC02", word: "Wer", target: "Wer ist dieser Mann?" },
  { num: 10, de: "Ja/Nein-Fragen", en: "Ask yes or no questions", color: "#FF9600", word: "Verstehen", target: "Verstehen Sie mich?" },
  { num: 11, de: "Farben der Welt", en: "Describe colors", color: "#CE82FF", word: "blau", target: "Mein Auto ist blau." },
  { num: 12, de: "Im Supermarkt: Obst", en: "Buy fresh fruit", color: "#FF4B4B", word: "Apfel", target: "Ich kaufe einen Apfel." },
  { num: 13, de: "Tage der Woche", en: "Days of the week", color: "#00CD9C", word: "Montag", target: "Am Montag arbeite ich." },
  { num: 14, de: "Mein Lieblingstag", en: "Talk about daily routine basics", color: "#FFC800", word: "heute", target: "Heute habe ich frei." },
  { num: 15, de: "Einfache Hobbys", en: "Talk about basic hobbies", color: "#1CB0F6", word: "spielen", target: "Ich spiele gern Fußball." },
  { num: 16, de: "Gern oder nicht gern?", en: "Express likes and dislikes", color: "#58CC02", word: "gern", target: "Ich lese sehr gern Bücher." },
  { num: 17, de: "Klassenzimmer & Lernen", en: "Classroom and study items", color: "#FF9600", word: "Buch", target: "Das ist mein Buch." },
  { num: 18, de: "Negation mit nicht", en: "Negate actions and adjectives", color: "#CE82FF", word: "nicht", target: "Das ist nicht schwer." },
  { num: 19, de: "Negation mit kein", en: "Negate nouns with kein", color: "#FF4B4B", word: "keine", target: "Ich habe keine Zeit." },
  { num: 20, de: "Frühstückszeit", en: "Talk about breakfast", color: "#00CD9C", word: "Brot", target: "Zum Frühstück esse ich Brot." },
  { num: 21, de: "Zahlen bis 100", en: "Count up to 100", color: "#FFC800", word: "fünfzig", target: "Das macht fünfzig Euro." },
  { num: 22, de: "Tageszeiten & Begrüßung", en: "Times of day", color: "#1CB0F6", word: "Abend", target: "Am Abend koche ich." },
  { num: 23, de: "Uhrzeit: Offiziell", en: "Tell formal time", color: "#58CC02", word: "Uhr", target: "Es ist genau zehn Uhr." },
  { num: 24, de: "Uhrzeit: Alltagssprache", en: "Tell casual time", color: "#FF9600", word: "halb", target: "Es ist halb acht." },
  { num: 25, de: "Mein Beruf", en: "Describe professions", color: "#CE82FF", word: "Arzt", target: "Ich bin Arzt von Beruf." },
  { num: 26, de: "Wo arbeitest du?", en: "Describe workplaces", color: "#FF4B4B", word: "Büro", target: "Ich arbeite in einem Büro." },
  { num: 27, de: "Tiere im Alltag", en: "Domestic animals and pets", color: "#00CD9C", word: "Hund", target: "Mein Hund heißt Bello." },
  { num: 28, de: "Einfache Gefühle", en: "Express basic emotions", color: "#FFC800", word: "müde", target: "Ich bin heute sehr müde." },
  { num: 29, de: "Getränke & Durst", en: "Drinks and thirst", color: "#1CB0F6", word: "Saft", target: "Ich trinke ein Glas Saft." },
  { num: 30, de: "Körper & Wohlbefinden", en: "Body parts basics", color: "#58CC02", word: "Kopf", target: "Mein Kopf tut weh." },
  { num: 31, de: "Einfache Kleidung", en: "Basic clothing items", color: "#FF9600", word: "Hemd", target: "Ich trage ein weißes Hemd." },
  { num: 32, de: "Wetter heute", en: "Talk about basic weather", color: "#CE82FF", word: "Sonne", target: "Die Sonne scheint schön." },
  { num: 33, de: "Monate & Geburtstag", en: "Months and birthdays", color: "#FF4B4B", word: "Mai", target: "Mein Geburtstag ist im Mai." },
  { num: 34, de: "Jahreszeiten", en: "The four seasons", color: "#00CD9C", word: "Sommer", target: "Im Sommer ist es warm." },
  { num: 35, de: "Sektion 1 Finale", en: "Section 1 Grand Review", color: "#FFC800", word: "Deutsch", target: "Ich lerne erfolgreich Deutsch!" }
];

section1Themes.forEach(t => {
  unitsMaster.push({
    num: t.num, sec: 1, de: t.de, en: t.en, color: t.color,
    vocab: [
      { de: t.word, en: t.word.toLowerCase() },
      { de: "gut", en: "good" },
      { de: "neu", en: "new" },
      { de: "hier", en: "here" },
      { de: "sehr", en: "very" }
    ],
    sentences: [
      { de: t.target, en: `German phrase for ${t.en}`, tokens: t.target.split(" ") }
    ],
    dialogue: { partner: "Felix", prompt: `Guten Tag! Kannst du mir sagen: ${t.target}?`, translation: "Can you tell me that?", options: [t.target, "Nein, danke."] },
    chatPrompt: `Wie geht es dir bei: ${t.de}?`, chatReply: "Sehr gut, danke!",
    cloze: { prompt: `${t.target.replace(t.word, "_______")}`, en: `Sentence context for ${t.word}`, options: [t.word, "Kaffee", "heute"], answer: t.word },
    typeWord: { prompt: `Type the German word '${t.word}':`, target: t.word }
  });
});

// SECTION 2: EXPLORER (Units 36 to 70)
const section2Themes = [
  { num: 36, de: "Fragen stellen", en: "Ask questions", color: "#1CB0F6", word: "Frage", target: "Darf ich eine Frage stellen?" },
  { num: 37, de: "Familienleben im Detail", en: "Discuss family details", color: "#58CC02", word: "Großmutter", target: "Meine Großmutter kocht sehr gut." },
  { num: 38, de: "Meine Wohnung", en: "Describe your home", color: "#FF9600", word: "Zimmer", target: "Die Wohnung hat drei Zimmer." },
  { num: 39, de: "Möbel & Einrichtung", en: "Furniture and household items", color: "#CE82FF", word: "Schrank", target: "Der Schrank steht im Schlafzimmer." },
  { num: 40, de: "Gesundheit & Beschwerden", en: "Discuss health issues", color: "#FF4B4B", word: "Arzt", target: "Ich muss heute zum Arzt gehen." },
  { num: 41, de: "Am Flughafen", en: "Navigate the airport", color: "#00CD9C", word: "Flughafen", target: "Wo ist das Gate zum Flugzeug?" },
  { num: 42, de: "Im Restaurant speisen", en: "Order food and drink", color: "#FFC800", word: "Speisekarte", target: "Bringen Sie mir bitte die Speisekarte." },
  { num: 43, de: "Beim Einkaufen bewerten", en: "Evaluate items while shopping", color: "#1CB0F6", word: "teuer", target: "Diese Jacke ist mir zu teuer." },
  { num: 44, de: "Schule & Unterricht", en: "Navigate school life", color: "#58CC02", word: "Prüfung", target: "Morgen schreiben wir eine Prüfung." },
  { num: 45, de: "Haushalt & Pflichten", en: "Help with chores", color: "#FF9600", word: "aufräumen", target: "Ich muss mein Zimmer aufräumen." },
  { num: 46, de: "Wochenendplanung", en: "Plan weekend activities", color: "#CE82FF", word: "Ausflug", target: "Am Wochenende machen wir einen Ausflug." },
  { num: 47, de: "Vorlieben ausdrücken", en: "Use verbs to express preferences", color: "#FF4B4B", word: "lieber", target: "Ich trinke lieber Tee als Kaffee." },
  { num: 48, de: "Hobbys vertiefen", en: "Talk about hobbies in detail", color: "#00CD9C", word: "wandern", target: "Wir wandern gerne in den Bergen." },
  { num: 49, de: "Party & Feiern", en: "Enjoy a dance party", color: "#FFC800", word: "feiern", target: "Wir feiern heute meinen Geburtstag!" },
  { num: 50, de: "Gefühle & Befinden", en: "Check in on feelings", color: "#FF4B4B", word: "glücklich", target: "Ich fühle mich heute sehr glücklich." },
  { num: 51, de: "Am Bahnhof", en: "Navigate a train station", color: "#58CC02", word: "Gleis", target: "Der Zug nach München fährt auf Gleis 4." },
  { num: 52, de: "Hotelzimmer buchen", en: "Book a hotel room", color: "#1CB0F6", word: "Einzelzimmer", target: "Ich möchte ein Einzelzimmer reservieren." },
  { num: 53, de: "Die Stadt erkunden", en: "Explore the city", color: "#00CD9C", word: "Museum", target: "Wir besuchen heute das berühmte Museum." },
  { num: 54, de: "Arbeitsalltag & Büro", en: "Interact and help out at work", color: "#CE82FF", word: "Kollege", target: "Mein Kollege hilft mir beim Computer." },
  { num: 55, de: "Tagesablauf schildern", en: "Discuss activities throughout day", color: "#FF9600", word: "aufstehen", target: "Ich stehe jeden Morgen um sieben Uhr auf." },
  { num: 56, de: "Teamarbeit im Büro", en: "Collaborate at work", color: "#1CB0F6", word: "Meeting", target: "Wir haben um zehn Uhr ein wichtiges Meeting." },
  { num: 57, de: "Grillen & Picknick", en: "Shop for a BBQ", color: "#58CC02", word: "Wurst", target: "Wir kaufen Fleisch und Wurst zum Grillen." },
  { num: 58, de: "Uni & Studium", en: "Discuss university life", color: "#FFC800", word: "Vorlesung", target: "Die Vorlesung beginnt um neun Uhr." },
  { num: 59, de: "Auf der Autobahn", en: "Navigate a road trip", color: "#FF4B4B", word: "Auto", target: "Auf der Autobahn gibt es einen Stau." },
  { num: 60, de: "Feste Tagesroutinen", en: "Manage daily routines", color: "#00CD9C", word: "zuerst", target: "Zuerst frühstücke ich, dann gehe ich zur Arbeit." },
  { num: 61, de: "Besitz & Eigentum", en: "Indicate ownership", color: "#CE82FF", word: "Schlüssel", target: "Das ist mein Schlüssel für die Wohnung." },
  { num: 62, de: "Nachbarschaft", en: "Talk about your neighbors", color: "#FF9600", word: "Nachbar", target: "Unsere Nachbarn sind sehr freundlich." },
  { num: 63, de: "Orientierung in der Stadt", en: "Navigate a city & directions", color: "#58CC02", word: "geradeaus", target: "Gehen Sie bitte immer geradeaus bis zur Ampel." },
  { num: 64, de: "Wetterbericht", en: "Discuss the weather forecast", color: "#1CB0F6", word: "Regen", target: "Morgen gibt es im Norden viel Regen." },
  { num: 65, de: "Geschenke kaufen", en: "Shop for gifts", color: "#FF4B4B", word: "Geschenk", target: "Ich kaufe ein schönes Geschenk für meine Mutter." },
  { num: 66, de: "Heimatstadt beschreiben", en: "Talk about your city", color: "#00CD9C", word: "Fluss", target: "Durch unsere Stadt fließt ein schöner Fluss." },
  { num: 67, de: "Kleidung anprobieren", en: "Clothes shopping & fitting", color: "#CE82FF", word: "anprobieren", target: "Kann ich diesen Pullover in Größe M anprobieren?" },
  { num: 68, de: "Post & Bank", en: "Post office and bank services", color: "#FFC800", word: "Brief", target: "Ich werfe diesen Brief in den Kasten." },
  { num: 69, de: "Termine vereinbaren", en: "Schedule appointments", color: "#58CC02", word: "Termin", target: "Ich möchte einen Termin für Dienstag vereinbaren." },
  { num: 70, de: "Sektion 2 Finale", en: "Section 2 Grand Review", color: "#FFC800", word: "Erfolg", target: "Ich habe die zweite Sektion mit Erfolg gemeistert!" }
];

section2Themes.forEach(t => {
  unitsMaster.push({
    num: t.num, sec: 2, de: t.de, en: t.en, color: t.color,
    vocab: [
      { de: t.word, en: t.word.toLowerCase() },
      { de: "können", en: "can / to be able" },
      { de: "müssen", en: "must / to have to" },
      { de: "schnell", en: "fast" },
      { de: "wichtig", en: "important" }
    ],
    sentences: [
      { de: t.target, en: `Context for ${t.en}`, tokens: t.target.split(" ") }
    ],
    dialogue: { partner: "Julia", prompt: `Entschuldigung, kannst du mir helfen mit: ${t.target}?`, translation: "Can you help me with that?", options: [t.target, "Leider keine Zeit."] },
    chatPrompt: `Was denkst du über: ${t.de}?`, chatReply: "Das ist sehr nützlich!",
    cloze: { prompt: `${t.target.replace(t.word, "_______")}`, en: `Missing word practice for ${t.word}`, options: [t.word, "Zug", "gestern"], answer: t.word },
    typeWord: { prompt: `Type the German word '${t.word}':`, target: t.word }
  });
});

// SECTION 3: TRAVELER (Units 71 to 105)
const section3Themes = [
  { num: 71, de: "Neue Stelle antreten", en: "Discuss a new job", color: "#1CB0F6", word: "Vertrag", target: "Ich unterschreibe heute meinen Arbeitsvertrag." },
  { num: 72, de: "Gewohnheiten & Alltag", en: "Talk about your habits", color: "#58CC02", word: "oft", target: "Ich gehe oft am Abend spazieren." },
  { num: 73, de: "Urlaubskoffer packen", en: "Pack for a vacation", color: "#FF9600", word: "Koffer", target: "Ich packe meinen Koffer für die Reise." },
  { num: 74, de: "Abendessen mit Gästen", en: "Plan a dinner party", color: "#CE82FF", word: "Gäste", target: "Heute Abend kommen liebe Gäste zum Essen." },
  { num: 75, de: "Komplexe Verben", en: "Use complex prefix verbs", color: "#FF4B4B", word: "bezahlen", target: "Wir bezahlen die Rechnung mit Karte." },
  { num: 76, de: "WG-Leben & Regeln", en: "Live with flatmates", color: "#00CD9C", word: "Mitbewohner", target: "Mein Mitbewohner wäscht heute das Geschirr." },
  { num: 77, de: "Dativ: Grundlagen", en: "Introduction to the Dative case", color: "#FFC800", word: "helfen", target: "Ich helfe dem netten Mann gern." },
  { num: 78, de: "Grillfest organisieren", en: "Plan a community barbecue", color: "#1CB0F6", word: "mitbringen", target: "Jeder bringt etwas Leckeres zum Essen mit." },
  { num: 79, de: "Akkusativ vs. Dativ", en: "Differentiate Accusative & Dative", color: "#58CC02", word: "geben", target: "Ich gebe der Frau den Apfel." },
  { num: 80, de: "Zusammengesetzte Nomen", en: "Form compound words", color: "#FF9600", word: "Hauptbahnhof", target: "Wir treffen uns direkt am Hauptbahnhof." },
  { num: 81, de: "Einladungen schreiben", en: "Invite someone to a party", color: "#CE82FF", word: "Einladung", target: "Herzlichen Dank für Ihre freundliche Einladung!" },
  { num: 82, de: "Geschmack & Stil", en: "Describe style preferences", color: "#FF4B4B", word: "gefallen", target: "Das blaue Kleid gefällt mir besonders gut." },
  { num: 83, de: "Dativ-Pronomen", en: "Master dative pronouns", color: "#00CD9C", word: "mir", target: "Wie geht es dir? – Es geht mir sehr gut!" },
  { num: 84, de: "Vergleiche ziehen", en: "Form comparative adjectives", color: "#FFC800", word: "besser", target: "Dieser Zug ist viel schneller und besser." },
  { num: 85, de: "Ausreden & Entschuldigungen", en: "Make polite excuses", color: "#1CB0F6", word: "Verspätung", target: "Entschuldigung für die Verspätung, der Bus hatte Panne." },
  { num: 86, de: "Um Hilfe bitten", en: "Ask for assistance politely", color: "#58CC02", word: "könnten", target: "Könnten Sie mir bitte kurz den Weg zeigen?" },
  { num: 87, de: "Wo oder Wohin?", en: "Location vs Motion prepositions", color: "#FF9600", word: "stellen", target: "Ich stelle die Vase auf den Tisch." },
  { num: 88, de: "In den Urlaub fahren", en: "Travel destinations & transport", color: "#CE82FF", word: "Meer", target: "Im August fahren wir für zwei Wochen ans Meer." },
  { num: 89, de: "Beim Arzt: Der Termin", en: "Doctor's visit & symptoms", color: "#FF4B4B", word: "Rezept", target: "Der Arzt gibt mir ein Rezept für Medikamente." },
  { num: 90, de: "Medikamente & Apotheke", en: "At the pharmacy", color: "#00CD9C", word: "Tablette", target: "Nehmen Sie diese Tablette bitte nach dem Essen." },
  { num: 91, de: "Kulturelle Ereignisse", en: "Theater, Cinema & Concerts", color: "#FFC800", word: "Konzert", target: "Wir gehen am Samstagabend in ein klassisches Konzert." },
  { num: 92, de: "Im Hotel: Reklamation", en: "Report a hotel room issue", color: "#1CB0F6", word: "funktionieren", target: "Die Klimaanlage im Zimmer funktioniert leider nicht." },
  { num: 93, de: "Vergangenheit: Haben", en: "Past Perfekt with haben", color: "#58CC02", word: "gelernt", target: "Ich habe gestern den ganzen Tag Deutsch gelernt." },
  { num: 94, de: "Vergangenheit: Sein", en: "Past Perfekt with sein", color: "#FF9600", word: "gefahren", target: "Wir sind mit dem Zug nach Berlin gefahren." },
  { num: 95, de: "Mein letzter Urlaub", en: "Describe your last vacation", color: "#CE82FF", word: "gewandert", target: "Im Urlaub sind wir viel in den Bergen gewandert." },
  { num: 96, de: "Formulare ausfüllen", en: "Complete official forms", color: "#FF4B4B", word: "Unterschrift", target: "Vergessen Sie bitte nicht Ihre Unterschrift hier." },
  { num: 97, de: "Kurze E-Mails schreiben", en: "Write short messages & emails", color: "#00CD9C", word: "Grüße", target: "Mit freundlichen Grüßen an Ihre Familie!" },
  { num: 98, de: "Ansagen verstehen", en: "Understand public announcements", color: "#FFC800", word: "Achtung", target: "Achtung an Gleis zwei: Der Zug hat zehn Minuten Verspätung." },
  { num: 99, de: "Telefonieren im Alltag", en: "Everyday phone calls", color: "#1CB0F6", word: "anrufen", target: "Ich rufe Sie morgen Vormittag noch einmal an." },
  { num: 100, de: "Ein Gespräch führen", en: "Carry out social conversations", color: "#58CC02", word: "natürlich", target: "Natürlich, das sehe ich ganz genauso wie du!" },
  { num: 101, de: "Meinungen begründen", en: "Give opinions with weil", color: "#FF9600", word: "weil", target: "Ich lerne Deutsch, weil ich in Deutschland studieren will." },
  { num: 102, de: "Zukunftspläne", en: "Express plans and wishes", color: "#CE82FF", word: "hoffen", target: "Ich hoffe, dass wir uns bald wiedersehen!" },
  { num: 103, de: "Goethe A1 Simulation: Hören", en: "Exam Simulation: Listening", color: "#FF4B4B", word: "Prüfung", target: "Hören Sie die Nachricht und wählen Sie die richtige Lösung." },
  { num: 104, de: "Goethe A1 Simulation: Sprechen", en: "Exam Simulation: Speaking", color: "#00CD9C", word: "Sprechen", target: "Stellen Sie Ihrem Partner bitte eine höfliche Frage." },
  { num: 105, de: "Das Große A1-Finale", en: "Grand A1 Mastery Exam", color: "#FFC800", word: "Zertifikat", target: "Herzlichen Glückwunsch! Du hast das Goethe A1 Niveau erreicht!" }
];

section3Themes.forEach(t => {
  unitsMaster.push({
    num: t.num, sec: 3, de: t.de, en: t.en, color: t.color,
    vocab: [
      { de: t.word, en: t.word.toLowerCase() },
      { de: "wunderbar", en: "wonderful" },
      { de: "sicher", en: "sure / certain" },
      { de: "verstehen", en: "to understand" },
      { de: "sprechen", en: "to speak" }
    ],
    sentences: [
      { de: t.target, en: `CEFR sentence for ${t.en}`, tokens: t.target.split(" ") }
    ],
    dialogue: { partner: "Frau Schmidt", prompt: `Herzlich willkommen! Können Sie mir sagen: ${t.target}?`, translation: "Welcome! Can you tell me that?", options: [t.target, "Vielen Dank für alles."] },
    chatPrompt: `Guten Tag! Haben Sie das verstanden: ${t.de}?`, chatReply: "Ja, vollkommen verstanden!",
    cloze: { prompt: `${t.target.replace(t.word, "_______")}`, en: `Missing word test for ${t.word}`, options: [t.word, "Kaffee", "heute"], answer: t.word },
    typeWord: { prompt: `Type the German word '${t.word}':`, target: t.word }
  });
});

console.log(`Loaded ${unitsMaster.length} units across 3 sections.`);

// 2. Build 16 Lessons per Unit
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

    const primaryVocab = unit.vocab[0] || { de: "Wort", en: "word" };
    const secondVocab = unit.vocab[1] || { de: "gut", en: "good" };
    const sampleSent = unit.sentences[0] || { de: "Das ist gut.", en: "That is good.", tokens: ["Das", "ist", "gut."] };

    if (lIdx === 7) {
      // Milestone Chest 1
      nodeType = "chest";
      title = `${unit.en} • Treasure Chest 1`;
      subtitle = "Bonus 25 Pearls & 15 XP";
      xpReward = 15;
      pearlsReward = 25;
    } else if (lIdx === 14) {
      // Streak Booster Chest 2
      nodeType = "chest";
      title = `${unit.en} • Treasure Chest 2`;
      subtitle = "Bonus 35 Pearls & 20 XP";
      xpReward = 20;
      pearlsReward = 35;
    } else if (lIdx === 3) {
      // Chat Dialogue 1
      title = `Chat Story 1: ${unit.dialogue.partner}`;
      subtitle = "Interactive conversation partner";
      xpReward = 20;
      stages = [
        {
          type: "dialogue_bubble",
          title: "Complete the Chat",
          partnerName: unit.dialogue.partner,
          partnerAvatar: "dolphina",
          prompt: unit.dialogue.prompt,
          partnerMessage: unit.dialogue.prompt,
          translation: unit.dialogue.translation,
          options: unit.dialogue.options.map((opt, i) => ({ text: opt, isCorrect: i === 0 })),
          correctOption: unit.dialogue.options[0],
          correctAnswer: unit.dialogue.options[0],
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Fill in the blank",
          prompt: unit.cloze.prompt,
          sentence: unit.cloze.prompt,
          translation: unit.cloze.en,
          blank: unit.cloze.answer,
          target: unit.cloze.answer,
          correctOption: unit.cloze.answer,
          correctAnswer: unit.cloze.answer,
          options: unit.cloze.options,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 11) {
      // Chat Dialogue 2
      title = `Chat Story 2: Daily Conversation`;
      subtitle = "Real-life conversational roleplay";
      xpReward = 20;
      stages = [
        {
          type: "dialogue_bubble",
          title: "Messenger Roleplay",
          partnerName: "Alex",
          partnerAvatar: "dolphino",
          prompt: unit.chatPrompt,
          partnerMessage: unit.chatPrompt,
          translation: "Everyday conversation prompt",
          options: [
            { text: unit.chatReply, isCorrect: true },
            { text: "Nein, leider nicht.", isCorrect: false }
          ],
          correctOption: unit.chatReply,
          correctAnswer: unit.chatReply,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${sampleSent.en}`,
          targetSentence: sampleSent.de,
          tokens: sampleSent.tokens
        }
      ];
    } else if (lIdx === 4 || lIdx === 9) {
      // Grammar & Umlaut typing
      title = `Grammar & Spelling (${lIdx === 4 ? "Part 1" : "Part 2"})`;
      subtitle = "Umlaut precision & case rules";
      xpReward = 20;
      stages = [
        {
          type: "type_word",
          title: "Type in German",
          prompt: unit.typeWord.prompt,
          target: unit.typeWord.target,
          targetWord: unit.typeWord.target,
          word: unit.typeWord.target,
          correctAnswer: unit.typeWord.target,
          translation: primaryVocab.en,
          nativeMeaning: primaryVocab.en,
          hint: `Meaning: ${primaryVocab.en}`,
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Fill in the blank",
          prompt: unit.cloze.prompt,
          sentence: unit.cloze.prompt,
          translation: unit.cloze.en,
          blank: unit.cloze.answer,
          target: unit.cloze.answer,
          correctOption: unit.cloze.answer,
          correctAnswer: unit.cloze.answer,
          options: unit.cloze.options,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 5) {
      // Listening Ear Training
      title = `Listening: Audio Focus`;
      subtitle = "Ear training & speech perception";
      xpReward = 20;
      stages = [
        {
          type: "listen_select",
          title: "Listen and choose the meaning",
          spokenGerman: sampleSent.de,
          sentence: sampleSent.de,
          targetSentence: sampleSent.de,
          question: `What does "${sampleSent.de}" mean in English?`,
          prompt: `What does "${sampleSent.de}" mean in English?`,
          options: [
            { text: sampleSent.en, isCorrect: true },
            { text: "A different unrelated topic", isCorrect: false },
            { text: "Negative response", isCorrect: false }
          ],
          correctOption: sampleSent.en,
          correctAnswer: sampleSent.en,
          audioUrl: ""
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: sampleSent.de,
          tokens: sampleSent.tokens,
          audioUrl: ""
        }
      ];
    } else if (lIdx === 6 || lIdx === 13) {
      // Speech & Fluency
      title = `Pronunciation & Speech (${lIdx === 6 ? "Foundation" : "Sprint"})`;
      subtitle = "Voice recording & pronunciation feedback";
      xpReward = 25;
      stages = [
        {
          type: "sprechen",
          title: "Pronounce Auf Deutsch",
          prompt: sampleSent.de,
          translation: sampleSent.en,
          minAccuracy: 75,
          audioUrl: ""
        },
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: unit.vocab.slice(0, 4).map(v => ({ target: v.de, native: v.en }))
        }
      ];
    } else if (lIdx === 15) {
      // Unit Boss Challenge
      title = `🏆 Unit Trophy Exam: ${unit.en}`;
      subtitle = `Grand mastery challenge to clear Unit ${unit.num}`;
      xpReward = 35;
      pearlsReward = 15;
      stages = [
        {
          type: "sentence_builder",
          title: "Boss Challenge: Sentence Assembly",
          prompt: `Translate: ${sampleSent.en}`,
          targetSentence: sampleSent.de,
          tokens: sampleSent.tokens
        },
        {
          type: "sprechen",
          title: "Boss Challenge: Clear Speech",
          prompt: sampleSent.de,
          translation: sampleSent.en,
          minAccuracy: 80,
          audioUrl: ""
        },
        {
          type: "cloze_test",
          title: "Boss Challenge: Syntax Mastery",
          prompt: unit.cloze.prompt,
          sentence: unit.cloze.prompt,
          translation: unit.cloze.en,
          blank: unit.cloze.answer,
          target: unit.cloze.answer,
          correctOption: unit.cloze.answer,
          correctAnswer: unit.cloze.answer,
          options: unit.cloze.options,
          audioUrl: ""
        },
        {
          type: "listen_select",
          title: "Boss Challenge: Audio Perception",
          spokenGerman: sampleSent.de,
          sentence: sampleSent.de,
          targetSentence: sampleSent.de,
          question: `What does "${sampleSent.de}" mean in English?`,
          prompt: `What does "${sampleSent.de}" mean in English?`,
          options: [
            { text: sampleSent.en, isCorrect: true },
            { text: "Another choice", isCorrect: false },
            { text: "Wrong meaning", isCorrect: false }
          ],
          correctOption: sampleSent.en,
          correctAnswer: sampleSent.en,
          audioUrl: ""
        }
      ];
    } else {
      // Standard stepping stone lessons (0, 1, 2, 8, 10, 12)
      title = `${unit.en} • Lesson ${lIdx + 1}`;
      subtitle = `Stepping stone ${lIdx + 1} of 16 • ${unit.de}`;
      stages = [
        {
          type: "word_match",
          title: "Match the word pairs",
          pairs: unit.vocab.slice(0, 4).map(v => ({ target: v.de, native: v.en }))
        },
        {
          type: "listen_tap",
          title: "Listen and tap what you hear",
          targetSentence: sampleSent.de,
          tokens: sampleSent.tokens,
          audioUrl: ""
        },
        {
          type: "sentence_builder",
          title: "Construct the German sentence",
          prompt: `Translate: ${sampleSent.en}`,
          targetSentence: sampleSent.de,
          tokens: sampleSent.tokens
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
    unitNumber: unit.num,
    sectionUnitNumber: secUnitNum,
    unitTitle: unit.en,          // ENGLISH MAIN HEADING
    unitDescription: unit.de,    // GERMAN SUBHEADING
    colorHex: unit.color,
    lessonsCount: lessonsData.length,
    lessonsData
  });
}

console.log(`Generated ${fullUnitsData.length} units with ${globalLessonIndex} total lessons.`);

// 3. Write out german_a1.json
const jsonOutput = {
  course: "German A1 (CEFR / Goethe Start Deutsch 1)",
  totalSections: 3,
  totalUnits: fullUnitsData.length,
  totalLessons: globalLessonIndex,
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
