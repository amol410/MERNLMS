# 🇩🇪 DolphinCoder German A1 — Complete CEFR Curriculum (12 Units / Islands)

> **Curriculum Standard**: Common European Framework of Reference for Languages (CEFR A1 / Goethe-Zertifikat A1: Start Deutsch 1).  
> **Course Architecture**: 12 Units (Archipelago Islands) • 84 Interactive Lessons • 350+ Core Vocabulary Items • Real-world Communicative Competence.

---

## 🗺️ Archipelago Island Overview

| Unit # | Island Theme (German / English) | Core Grammar Concept | Key Vocabulary Targets |
|:---:|---|---|---|
| **1** | **Erste Schritte** *(First Steps & Greetings)* | Verb conjugation (*sein, heißen, kommen*), W-Questions | *Hallo, Guten Morgen, Danke, Bitte, Tschüss, Name, Land* |
| **2** | **Im Café & Zahlen** *(At the Café & Numbers 0–20)* | Verb *möchten*, Numbers 0–20, Articles Intro (*der/die/das*) | *Kaffee, Tee, Wasser, Milch, Zucker, Euro, Zahlen* |
| **3** | **Familie & Freunde** *(Family & People)* | Possessive pronouns (*mein/meine, dein/deine*), Plurals | *Vater, Mutter, Bruder, Schwester, Kind, Eltern, Freund* |
| **4** | **Essen & Markt** *(Food & Groceries)* | Accusative Case Intro (*den Apfel, das Brot, die Tomate*) | *Brot, Käse, Obst, Gemüse, Fleisch, Ei, lecker, schmecken* |
| **5** | **Mein Tag & Uhrzeit** *(Daily Routine & Time)* | Separable Verbs (*aufstehen, fernsehen*), Time expressions | *Uhr, Minute, Morgen, Abend, Montag–Sonntag, arbeiten, schlafen* |
| **6** | **Kleidung & Farben** *(Shopping & Colors)* | Adjectives & Colors, Accusative pronouns (*mich, dich, ihn*) | *Hemd, Hose, Kleid, Jacke, Schuhe, rot, blau, schwarz, teuer, billig* |
| **7** | **Zuhause & Wohnen** *(Home & Living)* | Prepositions (*in, auf, neben*), Two-way prepositions intro | *Haus, Wohnung, Zimmer, Küche, Bad, Tisch, Stuhl, Bett, Balkon* |
| **8** | **Weg & Stadtverkehr** *(City & Transport)* | Modal verb *können*, Directions, Imperative (*Gehen Sie...*) | *Bahnhof, Bus, Zug, Straße, links, rechts, geradeaus, Ticket* |
| **9** | **Freizeit & Hobbys** *(Hobbies & Interests)* | Adverb *gern/nicht gern*, Verbs (*spielen, lesen, schwimmen*) | *Sport, Musik, Buch, Fußball, Gitarre, Kino, Freunde treffen* |
| **10** | **Wetter & Jahreszeiten** *(Weather & Seasons)* | Impersonal *Es gibt / Es ist*, Seasons & Months | *Sonne, Regen, Schnee, Wind, Sommer, Winter, kalt, warm, heiß* |
| **11** | **Beim Arzt & Körper** *(Health & The Body)* | Modal verb *müssen / sollen*, Body parts, Ailments | *Kopf, Bauch, Hand, Bein, Schmerz, krank, Arzt, Apotheke, Termin* |
| **12** | **Reise & A1 Finale** *(Travel & Grand A1 Exam)* | Perfect Tense Intro (*haben/sein + Partizip II*), Synthesis | *Hotel, Koffer, Urlaub, Strand, Meer, Pass, gereist, gelernt* |

---

# 🏝️ UNIT 1: Erste Schritte (First Steps & Greetings)
**Island 1 • Coral Reef**  
*Grammar Focus*: Present tense conjugation of *sein* (to be), *heißen* (to be called), and *kommen* (to come). Question words: *Wer* (who), *Wie* (how), *Woher* (from where).

---

### Node 0: Hallo & Guten Tag (Basic Greetings)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`** (Vocabulary Introduction)
   * `Guten Morgen` ↔ `Good morning`
   * `Guten Tag` ↔ `Hello / Good day`
   * `Danke` ↔ `Thank you`
   * `Bitte` ↔ `Please / You're welcome`
   * `Tschüss` ↔ `Bye`

2. **`listen_tap`** (Ear Training)
   * Target: `"Guten Morgen! Danke schön."`
   * Tokens: `["Guten", "Morgen!", "Danke", "schön.", "Kaffee", "Tee"]` *(Distractors: Kaffee, Tee)*

3. **`sentence_builder`** (Active Assembly)
   * Prompt: `"Translate: Hello, thank you very much!"`
   * Target: `"Guten Tag, vielen Dank!"`
   * Tokens: `["Guten", "Tag,", "vielen", "Dank!", "Tschüss", "Bitte"]` *(Distractors: Tschüss, Bitte)*

4. **`sprechen`** (Pronunciation Evaluation)
   * Prompt: `"Guten Tag! Wie geht es dir?"`
   * Translation: `"Hello! How are you?"`
   * Min Accuracy: `75%`

---

### Node 1: Ich heiße... (Introductions & Names)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `Ich heiße` ↔ `My name is`
   * `Wie heißt du?` ↔ `What is your name?`
   * `Wer bist du?` ↔ `Who are you?`
   * `Freut mich` ↔ `Nice to meet you`

2. **`listen_tap`**
   * Target: `"Hallo, ich heiße Lukas."`
   * Tokens: `["Hallo,", "ich", "heiße", "Lukas.", "wer", "bist"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: Who are you? My name is Anna."`
   * Target: `"Wer bist du? Ich heiße Anna."`
   * Tokens: `["Wer", "bist", "du?", "Ich", "heiße", "Anna.", "Guten", "Morgen"]`

4. **`sprechen`**
   * Prompt: `"Freut mich, dich kennenzulernen!"`
   * Translation: `"Pleased to meet you!"`
   * Min Accuracy: `75%`

---

### Node 2: Woher kommst du? (Origins & Countries)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `Deutschland` ↔ `Germany`
   * `Indien` ↔ `India`
   * `kommen aus` ↔ `to come from`
   * `wohnen in` ↔ `to live in`
   * `Ja / Nein` ↔ `Yes / No`

2. **`listen_tap`**
   * Target: `"Ich komme aus Deutschland."`
   * Tokens: `["Ich", "komme", "aus", "Deutschland.", "wohne", "Indien"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: Where do you come from? I come from India."`
   * Target: `"Woher kommst du? Ich komme aus Indien."`
   * Tokens: `["Woher", "kommst", "du?", "Ich", "komme", "aus", "Indien.", "heiße"]`

4. **`sprechen`**
   * Prompt: `"Ich komme aus Indien und wohne hier."`
   * Translation: `"I come from India and live here."`
   * Min Accuracy: `75%`

---

### Node 3: Karaoke Story: Das erste Treffen (The First Meeting)
* **Type**: `karaoke`
* **XP**: 25 | **Pearls**: 10
* **Story German**:
  `"Guten Tag! Ich heiße Florian. Und wer bist du? Hallo Florian, ich heiße Meera. Ich komme aus Indien. Schön, dich kennenzulernen!"`
* **Story English**:
  `"Good day! My name is Florian. And who are you? Hello Florian, my name is Meera. I come from India. Nice to meet you!"`

---

### Node 4: Sunken Treasure Chest (Unit 1 Milestone)
* **Type**: `chest`
* **XP**: 20 | **Pearls**: 30

---

### Node 5: Unit 1 Boss Exam (Coral Reef Mastery)
* **Type**: `boss`
* **XP**: 35 | **Pearls**: 15

#### Stages:
1. **`word_match`** (Speed Review of all 8 core words)
2. **`listen_tap`**: `"Auf Wiedersehen und schönen Tag!"`
3. **`sentence_builder`**: `"Hallo, wie geht es dir heute?"`
4. **`sprechen`**: `"Guten Abend! Ich heiße Florian und komme aus Berlin."`

---

# ☕ UNIT 2: Im Café & Zahlen 0–20 (At the Café & Numbers)
**Island 2 • Emerald Bay**  
*Grammar Focus*: The polite modal verb *möchten* (*ich möchte, du möchtest*), grammatical gender introduction (*der Kaffee, der Tee, das Wasser, die Milch*), numbers 0–20.

---

### Node 0: Was möchten Sie trinken? (Ordering Drinks)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `der Kaffee` ↔ `the coffee (masculine)`
   * `der Tee` ↔ `the tea (masculine)`
   * `das Wasser` ↔ `the water (neuter)`
   * `die Milch` ↔ `the milk (feminine)`
   * `Ich möchte` ↔ `I would like`

2. **`listen_tap`**
   * Target: `"Ich möchte einen Kaffee, bitte."`
   * Tokens: `["Ich", "möchte", "einen", "Kaffee,", "bitte.", "Tee", "Milch"]` *(Distractors: Tee, Milch)*

3. **`sentence_builder`**
   * Prompt: `"Translate: A water with milk, please."`
   * Target: `"Ein Wasser mit Milch, bitte."`
   * Tokens: `["Ein", "Wasser", "mit", "Milch,", "bitte.", "Kaffee", "Guten", "Tag"]` *(Recycled Unit 1 distractors)*

4. **`sprechen`**
   * Prompt: `"Einen Tee mit Zucker, bitte."`
   * Translation: `"A tea with sugar, please."`
   * Min Accuracy: `75%`

---

### Node 1: Zahlen 0 bis 10 (Counting Drinks)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `eins, zwei, drei` ↔ `one, two, three`
   * `vier, fünf, sechs` ↔ `four, five, six`
   * `sieben, acht, neun, zehn` ↔ `seven, eight, nine, ten`
   * `zwei Kaffee` ↔ `two coffees`

2. **`listen_tap`**
   * Target: `"Zwei Kaffee und drei Tee, bitte."`
   * Tokens: `["Zwei", "Kaffee", "und", "drei", "Tee,", "bitte.", "vier", "Wasser"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: I would like five waters, please."`
   * Target: `"Ich möchte fünf Wasser, bitte."`
   * Tokens: `["Ich", "möchte", "fünf", "Wasser,", "bitte.", "sechs", "Danke"]`

4. **`sprechen`**
   * Prompt: `"Bitte zwei Kaffee und ein Wasser."`
   * Translation: `"Two coffees and one water, please."`
   * Min Accuracy: `75%`

---

### Node 2: Zahlen 11 bis 20 & Die Rechnung (Paying the Bill)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `elf, zwölf` ↔ `eleven, twelve`
   * `fünfzehn, zwanzig` ↔ `fifteen, twenty`
   * `die Rechnung` ↔ `the bill`
   * `Was kostet das?` ↔ `How much does that cost?`
   * `Euro` ↔ `Euro`

2. **`listen_tap`**
   * Target: `"Das macht zusammen zwölf Euro."`
   * Tokens: `["Das", "macht", "zusammen", "zwölf", "Euro.", "zehn", "Kaffee"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: The bill, please! That costs four euros."`
   * Target: `"Die Rechnung, bitte! Das kostet vier Euro."`
   * Tokens: `["Die", "Rechnung,", "bitte!", "Das", "kostet", "vier", "Euro.", "Wasser"]`

4. **`sprechen`**
   * Prompt: `"Zahlen, bitte! Wir möchten bezahlen."`
   * Translation: `"Check, please! We would like to pay."`
   * Min Accuracy: `75%`

---

### Node 3: Karaoke Story: Im Wiener Café
* **Type**: `karaoke`
* **XP**: 25 | **Pearls**: 10
* **Story German**:
  `"Guten Tag! Was möchten Sie trinken? Ich möchte einen Kaffee mit Milch und einen Tee mit Zucker. Das macht sieben Euro, bitte. Vielen Dank!"`
* **Story English**:
  `"Good day! What would you like to drink? I would like a coffee with milk and a tea with sugar. That comes to seven euros, please. Thank you very much!"`

---

### Node 4: Sunken Treasure Chest (Unit 2 Milestone)
* **Type**: `chest`
* **XP**: 20 | **Pearls**: 30

---

### Node 5: Unit 2 Boss Challenge
* **Type**: `boss`
* **XP**: 35 | **Pearls**: 15

---

# 👨‍👩‍👧 UNIT 3: Familie & Freunde (Family & People)
**Island 3 • Palm Grove**  
*Grammar Focus*: Possessive pronouns in nominative (*mein / meine, dein / deine*), verb *haben* (to have), plural forms (*die Kinder, die Eltern*).

---

### Node 0: Meine Familie (Core Family Members)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `der Vater` ↔ `the father`
   * `die Mutter` ↔ `the mother`
   * `die Eltern` ↔ `the parents`
   * `das Kind / die Kinder` ↔ `the child / children`
   * `mein / meine` ↔ `my (masc/fem)`

2. **`listen_tap`**
   * Target: `"Das ist mein Vater und meine Mutter."`
   * Tokens: `["Das", "ist", "mein", "Vater", "und", "meine", "Mutter.", "dein", "Kaffee"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: My parents live in Berlin."`
   * Target: `"Meine Eltern wohnen in Berlin."`
   * Tokens: `["Meine", "Eltern", "wohnen", "in", "Berlin.", "Vater", "kommen"]`

4. **`sprechen`**
   * Prompt: `"Das ist meine Familie. Wir haben zwei Kinder."`
   * Translation: `"This is my family. We have two children."`
   * Min Accuracy: `75%`

---

### Node 1: Geschwister & Freunde (Siblings & Friends)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `der Bruder` ↔ `the brother`
   * `die Schwester` ↔ `the sister`
   * `der Freund` ↔ `the (male) friend`
   * `die Freundin` ↔ `the (female) friend`
   * `Hast du...?` ↔ `Do you have...?`

2. **`listen_tap`**
   * Target: `"Ich habe einen Bruder und eine Schwester."`
   * Tokens: `["Ich", "habe", "einen", "Bruder", "und", "eine", "Schwester.", "Mutter", "Tee"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: Is that your friend? Yes, that is David."`
   * Target: `"Ist das dein Freund? Ja, das ist David."`
   * Tokens: `["Ist", "das", "dein", "Freund?", "Ja,", "das", "ist", "David.", "mein"]`

4. **`sprechen`**
   * Prompt: `"Mein Bruder heißt Max und ist zwanzig Jahre alt."`
   * Translation: `"My brother is called Max and is twenty years old."`
   * Min Accuracy: `75%`

---

### Node 2: Karaoke Story: Ein Foto von der Familie
* **Type**: `karaoke`
* **XP**: 25 | **Pearls**: 10
* **Story German**:
  `"Schau mal, das ist meine Familie! Das sind meine Eltern und das ist meine Schwester Lisa. Hast du auch Geschwister? Ja, ich habe zwei Brüder."`
* **Story English**:
  `"Look, this is my family! Those are my parents and that is my sister Lisa. Do you also have siblings? Yes, I have two brothers."`

---

### Node 3: Chest & Boss Challenge
* **Chest**: 30 Pearls, 20 XP
* **Boss Exam**: Mixed Family, Greetings, and Café vocabulary.

---

# 🥖 UNIT 4: Essen & Markt (Food & Groceries)
**Island 4 • Market Square**  
*Grammar Focus*: Accusative Case Direct Objects (*den Apfel [masc changes to den/einen], das Brot, die Banane*), verbs *essen* (irregular: *du isst, er isst*), *schmecken*.

---

### Node 0: Auf dem Markt (Bread, Cheese, Fruit)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `das Brot` ↔ `the bread`
   * `der Käse` ↔ `the cheese`
   * `der Apfel` ↔ `the apple`
   * `die Banane` ↔ `the banana`
   * `das Obst & Gemüse` ↔ `fruit & vegetables`

2. **`listen_tap`**
   * Target: `"Ich esse gern Brot mit Käse."`
   * Tokens: `["Ich", "esse", "gern", "Brot", "mit", "Käse.", "Wasser", "trinke"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: I would like an apple and three bananas, please."`
   * Target: `"Ich möchte einen Apfel und drei Bananen, bitte."`
   * Tokens: `["Ich", "möchte", "einen", "Apfel", "und", "drei", "Bananen,", "bitte.", "Kaffee"]`

4. **`sprechen`**
   * Prompt: `"Der Käse schmeckt sehr lecker!"`
   * Translation: `"The cheese tastes very delicious!"`
   * Min Accuracy: `75%`

---

### Node 1: Im Supermarkt (Meat, Eggs, Milk)
* **Type**: `lesson`
* **XP**: 15 | **Pearls**: 5

#### Stages:
1. **`word_match`**
   * `das Fleisch` ↔ `the meat`
   * `der Fisch` ↔ `the fish`
   * `das Ei / die Eier` ↔ `the egg / eggs`
   * `die Tomate` ↔ `the tomato`
   * `frisch` ↔ `fresh`

2. **`listen_tap`**
   * Target: `"Wir brauchen sechs Eier und frische Milch."`
   * Tokens: `["Wir", "brauchen", "sechs", "Eier", "und", "frische", "Milch.", "Brot"]`

3. **`sentence_builder`**
   * Prompt: `"Translate: Do you eat fish? No, I do not eat meat or fish."`
   * Target: `"Isst du Fisch? Nein, ich esse kein Fleisch."`
   * Tokens: `["Isst", "du", "Fisch?", "Nein,", "ich", "esse", "kein", "Fleisch.", "gern"]`

4. **`sprechen`**
   * Prompt: `"Das Obst und Gemüse hier ist sehr frisch."`
   * Translation: `"The fruit and vegetables here are very fresh."`
   * Min Accuracy: `75%`

---

### Node 2: Karaoke Story & Boss Exam (Market Square)
* **Story**: Shopping at the farmer's market (*"Was kostet ein Kilo Äpfel? Zwei Euro."*)
* **Chest**: 30 Pearls
* **Boss Exam**: Comprehensive Food + Accusative evaluation.

---

# ⏰ UNIT 5: Mein Tag & Uhrzeit (Daily Routine & Time)
**Island 5 • Clocktower Haven**  
*Grammar Focus*: Telling the time (*Wie spät ist es?*), Days of the week (*am Montag, am Dienstag*), Separable verbs (*aufstehen, anrufen, fernsehen*).

---

### Core Vocabulary Bank:
* `die Uhrzeit` (time), `Wie spät ist es?` (What time is it?), `Es ist acht Uhr` (It is eight o'clock).
* `Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Samstag, Sonntag`.
* `aufstehen` (to wake up: *Ich stehe um sieben Uhr auf*).
* `frühstücken` (to have breakfast), `arbeiten` (to work), `schlafen` (to sleep).

---

# 👕 UNIT 6: Kleidung & Farben (Shopping & Colors)
**Island 6 • Rainbow Bazaar**  
*Grammar Focus*: Color adjectives, Accusative direct object practice (*Ich trage einen blauen Pullover*), Prices and shopping dialogues.

---

### Core Vocabulary Bank:
* `das Hemd` (shirt), `die Hose` (pants), `das Kleid` (dress), `die Jacke` (jacket), `die Schuhe` (shoes), `der Pullover` (sweater).
* Colors: `rot, blau, grün, gelb, schwarz, weiß, grau, braun`.
* `Wie gefällt dir...?` (How do you like...?), `Das steht dir gut!` (That suits you well!), `teuer / billig` (expensive / cheap).

---

# 🏡 UNIT 7: Zuhause & Wohnen (Home & Living)
**Island 7 • Lighthouse Bay**  
*Grammar Focus*: Rooms of the house, furniture, prepositions of location (*in der Küche, im Wohnzimmer, auf dem Tisch*).

---

### Core Vocabulary Bank:
* `das Haus` (house), `die Wohnung` (apartment), `das Zimmer` (room), `die Küche` (kitchen), `das Bad` (bathroom), `das Schlafzimmer` (bedroom), `der Balkon` (balcony).
* `der Tisch` (table), `der Stuhl` (chair), `das Bett` (bed), `der Schrank` (wardrobe), `das Sofa` (couch).
* `groß, klein, hell, dunkel, gemütlich` (large, small, bright, dark, cozy).

---

# 🚆 UNIT 8: Weg & Stadtverkehr (City & Transport)
**Island 8 • Transit Junction**  
*Grammar Focus*: Modal verb *können* (can), asking directions (*Wo ist der Bahnhof?*), transport prepositions (*mit dem Bus, mit dem Zug*), imperative directions (*Gehen Sie geradeaus*).

---

### Core Vocabulary Bank:
* `der Bahnhof` (train station), `die Haltestelle` (bus stop), `der Bus` (bus), `der Zug` (train), `die U-Bahn` (subway), `das Fahrrad` (bicycle), `das Ticket / die Fahrkarte` (ticket).
* `links` (left), `rechts` (right), `geradeaus` (straight ahead), `an der Ecke` (at the corner), `in der Nähe` (nearby).
* `Entschuldigung, wie komme ich zum Bahnhof?` (Excuse me, how do I get to the train station?).

---

# ⚽ UNIT 9: Freizeit & Hobbys (Hobbies & Interests)
**Island 9 • Coral Arena**  
*Grammar Focus*: Expressing preference with *gern / lieber / am liebsten*, verb *spielen* with games and instruments, leisure time expressions.

---

### Core Vocabulary Bank:
* `der Sport` (sports), `der Fußball` (soccer), `die Musik` (music), `die Gitarre` (guitar), `das Buch / lesen` (book / to read), `das Kino` (cinema), `schwimmen` (to swim), `tanzen` (to dance).
* `Was machst du in deiner Freizeit?` (What do you do in your free time?).
* `Ich spiele gern Fußball und höre Musik.` (I like playing soccer and listening to music).

---

# ⛅ UNIT 10: Wetter & Jahreszeiten (Weather & Seasons)
**Island 10 • Monsoon Atoll**  
*Grammar Focus*: Weather verbs and impersonal phrases (*Es regnet, Es schneit, Die Sonne scheint, Es ist windig*), seasons and calendar months.

---

### Core Vocabulary Bank:
* `die Sonne` (sun), `der Regen` (rain), `der Schnee` (snow), `der Wind` (wind), `die Wolke` (cloud), `das Wetter` (weather).
* `der Frühling` (spring), `der Sommer` (summer), `der Herbst` (autumn), `der Winter` (winter).
* `Wie ist das Wetter heute?` (How is the weather today?), `Es ist sonnig und warm.` (It is sunny and warm).

---

# 🩺 UNIT 11: Beim Arzt & Körper (Health & The Body)
**Island 11 • Healing Spring**  
*Grammar Focus*: Modal verbs *müssen* (must) and *sollen* (should), parts of the body, expressing pain (*Mein Kopf tut weh*), booking a doctor's appointment (*einen Termin vereinbaren*).

---

### Core Vocabulary Bank:
* `der Kopf` (head), `das Auge` (eye), `das Ohr` (ear), `der Mund` (mouth), `der Hals` (throat), `der Bauch` (stomach), `der Rücken` (back), `der Arm` (arm), `das Bein` (leg), `die Hand` (hand), `der Fuß` (foot).
* `der Arzt / die Ärztin` (doctor), `das Krankenhaus` (hospital), `die Apotheke` (pharmacy), `das Medikament` (medicine), `Fieber` (fever).
* `Ich habe Kopfschmerzen.` (I have a headache), `Gute Besserung!` (Get well soon!).

---

# ✈️ UNIT 12: Reise & Ferien (Travel & Grand A1 Exam)
**Island 12 • Pinnacle Island (Grand Finale)**  
*Grammar Focus*: Perfect Tense Intro (*Ich bin nach Berlin gereist / Ich habe Deutsch gelernt*), checking into a hotel, comprehensive A1 synthesis.

---

### Core Vocabulary Bank:
* `das Hotel` (hotel), `der Koffer` (suitcase), `der Urlaub` (vacation), `der Strand` (beach), `das Meer` (sea), `die Berge` (mountains), `der Reisepass` (passport).
* `Ich habe ein Zimmer reserviert.` (I have booked a room).
* `Wir haben viel Deutsch gelernt und die A1 Stufe geschafft!` (We have learned a lot of German and completed the A1 level!).
