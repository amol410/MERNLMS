# 🇩🇪 DolphinCoder German A1 — Complete CEFR Curriculum Architecture

> **Curriculum Standard**: Common European Framework of Reference for Languages (**CEFR A1** / **Goethe-Zertifikat A1: Start Deutsch 1**).  
> **Course Architecture**: 
> * **3 Distinct Sections**: Section 1 (Rookie), Section 2 (Explorer), Section 3 (Traveler)
> * **105 Thematic Units** (35 Units per Section)
> * **16 Pedagogical Lesson Nodes per Unit** (1,680 Total Path Nodes)
> * **8 Interactive Stage Types**: `word_match`, `listen_tap`, `sentence_builder`, `sprechen`, `cloze_test`, `type_word` (with Umlauts), `dialogue_bubble`, and `listen_select`.

---

## 🏛️ Pedagogical Structure & Goethe A1 Alignment

To guarantee genuine conversational fluency and exam readiness (*Goethe-Zertifikat A1: Start Deutsch 1*), the curriculum is structured into three progressive macro-sections that take learners from zero prior knowledge through complete elementary independence:

```
                    GERMAN A1 CURRICULUM HIERARCHY
                    
  ┌─────────────────────────────────────────────────────────────┐
  │ SECTION 1: ROOKIE (Erste Schritte & Grundlagen)             │
  │ 35 Units • 560 Lesson Nodes • Present Tense, Sein/Haben, W-Q│
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ SECTION 2: EXPLORER (Alltag, Stadt & Unterwegs)             │
  │ 35 Units • 560 Lesson Nodes • Accusative, Modals, Separable │
  └──────────────────────────────┬──────────────────────────────┘
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ SECTION 3: TRAVELER (Reisen, Dialoge & Meisterschaft)       │
  │ 35 Units • 560 Lesson Nodes • Dative, Perfekt Intro, Goethe │
  └─────────────────────────────────────────────────────────────┘
  
  Total: 3 Sections • 105 Units • 1,680 Interactive Nodes
```

---

## 🔄 The 16-Lesson Rhythm Inside Every Unit

Each of the 105 units contains **16 distinct stepping stones**, balancing vocabulary acquisition, conversational dialogues, ear training, writing with German umlauts, and milestone rewards:

| Node Index | Node Type | Title / Focus | Interactive Stages & Pedagogical Goal |
|:---:|:---:|:---|:---|
| **0** | `lesson` | **Wortschatz-Entdeckung 1** | `word_match` + `listen_tap` + `sentence_builder`. First contact with 5 core words. |
| **1** | `lesson` | **Satzkontext & Verstehen** | `cloze_test` + `listen_select` + `sprechen`. Comprehending words in full phrases. |
| **2** | `lesson` | **Satzbau-Architekt** | `sentence_builder` + `word_match`. Internalizing German V2 (Verb position 2). |
| **3** | `lesson` | **Chat-Dialog 1** 💬 | `dialogue_bubble` + `cloze_test`. Interactive messenger story with visual partner. |
| **4** | `lesson` | **Grammatik-Fokus 1** | `cloze_test` + `type_word`. Direct drills on target verb conjugations/articles. |
| **5** | `lesson` | **Hörverständnis (Audio)** | `listen_select` (1.0x & 0.75x turtle) + `listen_tap`. Ear training and phonetics. |
| **6** | `lesson` | **Sprechtraining (Aussprache)** | `sprechen` (Google Speech STT evaluation) + `word_match`. Tactile vocalization. |
| **7** | `chest` | **Versunkene Schatzkiste 1** 🎁 | Milestone milestone chest: **25 Pearls** + **15 XP** + instant review. |
| **8** | `lesson` | **Wortschatz-Erweiterung 2** | `word_match` + `sentence_builder`. Introducing 5 secondary/enriching vocabulary terms. |
| **9** | `lesson` | **Grammatik-Fokus 2** | `cloze_test` + `type_word`. Complex word forms, plurals, or negation (*nicht/kein*). |
| **10** | `lesson` | **Tempo-Übersetzung** | `sentence_builder` + `listen_tap`. Rapid recall under fluid interactive pacing. |
| **11** | `lesson` | **Chat-Dialog 2** 💬 | `dialogue_bubble` + `sentence_builder`. Real-life conversational roleplay. |
| **12** | `lesson` | **Rechtschreibung & Umlaute** | `type_word` (with Umlaut toolbar `ä, ö, ü, ß`) + `cloze_test`. Accurate orthography. |
| **13** | `lesson` | **Fluency-Sprint** | `listen_select` + `sprechen` + `sentence_builder`. Combining listening and speaking. |
| **14** | `chest` | **Versunkene Schatzkiste 2** 🎁 | Streak booster chest: **35 Pearls** + **20 XP** + oxygen refill bonus. |
| **15** | `lesson` | **Einheits-Meisterprüfung** 🏆 | Unit Boss Exam: 4 comprehensive stages covering all vocabulary with zero hints. |

---

# 🧭 SECTION 1: ROOKIE (Erste Schritte & Grundlagen)
*Focus: Phonetics, Greetings, Personal Identity, Numbers, Café, Essential Questions, and Present Tense.*  
*Target CEFR Grammar: Present tense regular verb endings (`-e, -st, -t, -en`), `sein` & `haben`, Nominative articles (`der, die, das, ein, eine`), Question words (`Wer, Wie, Wo, Woher, Was`), Negation (`nicht, kein`).*

### Master Index of Section 1 Units (Units 1 to 35)

| Unit # | German Title | English Subtitle | Color Theme | Core Grammar Target | Key Vocabulary Targets (5-10 words) |
|:---:|---|---|:---:|---|---|
| **1** | **Erste Begrüßungen** | Greet and introduce yourself | `#1CB0F6` (Sky Blue) | *sein* (ich bin, du bist), *heißen* | *Hallo, Guten Morgen, Guten Tag, Tschüss, Name* |
| **2** | **Im Café bestellen** | Order at a café | `#58CC02` (Lime Green) | Verb *möchten*, Polite *bitte* | *Kaffee, Tee, Wasser, Milch, bitte, danke* |
| **3** | **Zahlen 1 bis 10** | Count from 1 to 10 | `#FF9600` (Orange) | Cardinal numbers, Questions with *wie viel* | *eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn* |
| **4** | **Woher kommst du?** | Talk about origins & countries | `#CE82FF` (Purple) | *kommen aus* + Country names | *Deutschland, Österreich, Schweiz, kommen, aus, Land* |
| **5** | **Höflichkeit im Alltag** | Everyday etiquette | `#FF4B4B` (Coral) | Question *Wie geht's?*, Responses | *Guten Abend, Auf Wiedersehen, Bitte, Danke, Entschuldigung* |
| **6** | **Persönliche Daten** | Share personal info | `#00CD9C` (Teal) | Verbs *wohnen, sprechen* | *wohnen, Stadt, Sprache, Deutsch, Englisch, Adresse* |
| **7** | **Zahlen 11 bis 20 & Preise** | Numbers 11–20 and prices | `#FFC800` (Gold) | Numbers 11–20, Currency *Euro/Cent* | *elf, zwölf, dreizehn, zwanzig, Euro, Cent, kosten* |
| **8** | **Meine Familie** | Introduce your family | `#1CB0F6` (Sky Blue) | Possessive *mein/meine, dein/deine* | *Mutter, Vater, Eltern, Bruder, Schwester, Sohn, Tochter* |
| **9** | **W-Fragen meistern** | Master German W-questions | `#58CC02` (Lime Green) | Question syntax (Verb in position 2) | *Wer, Wie, Wo, Woher, Was, Wann, Warum* |
| **10** | **Ja/Nein-Fragen** | Ask yes or no questions | `#FF9600` (Orange) | Verb-first question inversion | *Ja, Nein, Doch, verstehen, wissen, glauben* |
| **11** | **Farben der Welt** | Describe colors | `#CE82FF` (Purple) | Predicative adjectives (no declension) | *rot, blau, grün, gelb, schwarz, weiß, bunt* |
| **12** | **Im Supermarkt: Obst** | Buy fresh fruit | `#FF4B4B` (Coral) | Plural nouns intro (*die Äpfel*) | *Apfel, Banane, Orange, Zitrone, frisch, lecker* |
| **13** | **Tage der Woche** | Days of the week | `#00CD9C` (Teal) | Preposition *am* + Day of the week | *Montag, Dienstag, Mittwoch, Donnerstag, Freitag, Wochenende* |
| **14** | **Mein Lieblingstag** | Talk about daily routine basics | `#FFC800` (Gold) | Adverb *heute, morgen, gestern* | *heute, morgen, Tag, Woche, Zeit, frei* |
| **15** | **Einfache Hobbys** | Talk about basic hobbies | `#1CB0F6` (Sky Blue) | Verb *spielen* + Sports/Games | *Fußball, Tennis, Musik, spielen, hören, schwimmen* |
| **16** | **Gern oder nicht gern?** | Express likes and dislikes | `#58CC02` (Lime Green) | Adverb *gern / nicht gern* placement | *gern, lieber, mögen, Spaß, Sport, Buch* |
| **17** | **Klassenzimmer & Lernen** | Classroom and study items | `#FF9600` (Orange) | Articles *der Stift, das Buch, die Tafel* | *Buch, Stift, Papier, Tisch, Lehrer, lernen* |
| **18** | **Negation mit 'nicht'** | Negate actions and adjectives | `#CE82FF` (Purple) | Sentence negation with *nicht* | *nicht, gar nicht, schwer, leicht, richtig, falsch* |
| **19** | **Negation mit 'kein'** | Negate nouns with 'kein' | `#FF4B4B` (Coral) | Negative article *kein / keine* | *kein, keine, Zeit, Geld, Problem, Hunger, Durst* |
| **20** | **Frühstückszeit** | Talk about breakfast | `#00CD9C` (Teal) | Verbs *essen* (du isst) & *trinken* | *Brot, Brötchen, Butter, Käse, Ei, Marmelade, Kaffee* |
| **21** | **Zahlen bis 100** | Count up to 100 | `#FFC800` (Gold) | Inverted numbers (*einundzwanzig*) | *dreißig, vierzig, fünfzig, hundert, Zahl, zählen* |
| **22** | **Tageszeiten & Begrüßung** | Times of day | `#1CB0F6` (Sky Blue) | Preposition *am Morgen, am Abend* | *Morgen, Vormittag, Mittag, Nachmittag, Abend, Nacht* |
| **23** | **Uhrzeit: Offiziell** | Tell formal time | `#58CC02` (Lime Green) | Formula: *Es ist ... Uhr ...* | *Uhr, Minute, Stunde, spät, wie spät, pünktlich* |
| **24** | **Uhrzeit: Alltagssprache** | Tell casual time | `#FF9600` (Orange) | *viertel vor / viertel nach / halb* | *halb, viertel, vor, nach, kurz vor, gleich* |
| **25** | **Mein Beruf** | Describe professions | `#CE82FF` (Purple) | Feminine suffix *-in* (*Lehrerin*) | *Arzt, Ärztin, Ingenieur, Student, Kellner, Beruf* |
| **26** | **Wo arbeitest du?** | Describe workplaces | `#FF4B4B` (Coral) | Prepositions *bei* (company) & *in* | *Büro, Schule, Krankenhaus, Firma, arbeiten, Kollege* |
| **27** | **Tiere im Alltag** | Domestic animals & pets | `#00CD9C` (Teal) | Noun genders (*der Hund, die Katze*) | *Hund, Katze, Vogel, Pferd, Tier, süß* |
| **28** | **Einfache Gefühle** | Express basic emotions | `#FFC800` (Gold) | *sein* + adjective (*Ich bin müde*) | *glücklich, traurig, müde, fit, gestresst, gut* |
| **29** | **Getränke & Durst** | Drinks and thirst | `#1CB0F6` (Sky Blue) | Idiom *Durst haben* | *Saft, Apfelsaft, Bier, Wein, Glas, trinken* |
| **30** | **Körper & Wohlbefinden** | Body parts basics | `#58CC02` (Lime Green) | Plurals of body parts | *Kopf, Auge, Ohr, Hand, Fuß, Rücken* |
| **31** | **Einfache Kleidung** | Basic clothing items | `#FF9600` (Orange) | Verb *tragen* (er trägt) | *Hemd, Hose, T-Shirt, Jacke, Schuhe, tragen* |
| **32** | **Wetter heute** | Talk about basic weather | `#CE82FF` (Purple) | Impersonal *Es ist warm / kalt* | *Sonne, Regen, warm, kalt, schön, Wetter* |
| **33** | **Monate & Geburtstag** | Months and birthdays | `#FF4B4B` (Coral) | Preposition *im* + Month | *Januar, Mai, August, Dezember, Monat, Geburtstag* |
| **34** | **Jahreszeiten** | The four seasons | `#00CD9C` (Teal) | Preposition *im Frühling/Sommer* | *Frühling, Sommer, Herbst, Winter, Jahr, Jahreszeit* |
| **35** | **Sektion 1 Finale: Rückblick** | Section 1 Grand Review | `#FFC800` (Gold) | Synthesis of all Section 1 grammar | *alles, zusammen, Test, fertig, super, Goethe A1* |

---

# 🧭 SECTION 2: EXPLORER (Alltag, Stadt & Unterwegs)
*Focus: Daily Life, City Navigation, Shopping, Housing, Public Transit, Train Station, Booking Rooms, and Accusative Case.*  
*Target CEFR Grammar: Accusative Case (`den / einen / keinen`), Accusative Personal Pronouns (`mich, dich, ihn, sie, uns`), Modal Verbs (`können, müssen, möchten, wollen`), Separable Verbs (`aufstehen, einsteigen, mitkommen`), Direction Prepositions (`nach, zu, in`).*

### Master Index of Section 2 Units (Units 36 to 70 / Section 2 Units 1 to 35)

| Unit # | German Title | English Subtitle | Color Theme | Core Grammar Target | Key Vocabulary Targets (5-10 words) |
|:---:|---|---|:---:|---|---|
| **36 (2.1)** | **Fragen stellen** | Ask questions | `#1CB0F6` (Sky Blue) | Advanced question intonation & syntax | *Frage, Antwort, fragen, antworten, genau, warum* |
| **37 (2.2)** | **Familienleben im Detail** | Discuss family details | `#58CC02` (Lime Green) | Extended family & possessives | *Großmutter, Großvater, Tante, Onkel, Cousin, ledig, verheiratet* |
| **38 (2.3)** | **Meine Wohnung** | Describe your home | `#FF9600` (Orange) | Rooms & Articles (*die Küche, das Bad*) | *Wohnung, Zimmer, Küche, Bad, Wohnzimmer, Schlafzimmer, Balkon* |
| **39 (2.4)** | **Möbel & Einrichtung** | Furniture and household items | `#CE82FF` (Purple) | Accusative Intro (*den Tisch kaufen*) | *Tisch, Stuhl, Bett, Sofa, Schrank, Lampe, bequem* |
| **40 (2.5)** | **Gesundheit & Beschwerden** | Discuss health issues | `#FF4B4B` (Coral) | *weh tun* + Dative pronoun (*tut mir weh*) | *Schmerz, Fieber, Husten, wehtun, krank, Apotheke* |
| **41 (2.6)** | **Am Flughafen** | Navigate the airport | `#00CD9C` (Teal) | Direction *nach* + City/Country | *Flughafen, Flugzeug, Flug, Abflug, Pass, Gepäck, fliegen* |
| **42 (2.7)** | **Im Restaurant speisen** | Order food and drink | `#FFC800` (Gold) | Accusative food orders (*einen Salat*) | *Speisekarte, Suppe, Fleisch, Fisch, Rechnung, bestellen, zahlen* |
| **43 (2.8)** | **Beim Einkaufen bewerten** | Evaluate items while shopping | `#1CB0F6` (Sky Blue) | Adjectives of evaluation (*zu teuer*) | *teuer, billig, modern, schön, alt, Qualität, gefallen* |
| **44 (2.9)** | **Schule & Unterricht** | Navigate school life | `#58CC02` (Lime Green) | Modal verb *müssen* (ich muss lernen) | *Schule, Kurs, Aufgabe, Prüfung, Hausaufgabe, verstehen, üben* |
| **45 (2.10)** | **Haushalt & Pflichten** | Help with chores | `#FF9600` (Orange) | Separable verbs (*aufräumen, putzen*) | *aufräumen, putzen, waschen, kochen, sauber, schmutzig* |
| **46 (2.11)** | **Wochenendplanung** | Plan weekend activities | `#CE82FF` (Purple) | Future meaning with Präsens + *am Samstag* | *Samstag, Sonntag, Ausflug, planen, treffen, mitkommen* |
| **47 (2.12)** | **Vorlieben ausdrücken** | Use verbs to express preferences | `#FF4B4B` (Coral) | Comparative adverb *lieber als* | *lieber, am liebsten, mögen, vorziehen, interessant* |
| **48 (2.13)** | **Hobbys vertiefen** | Talk about hobbies in detail | `#00CD9C` (Teal) | Verbs + Nouns (*Gitarre spielen*) | *fotografieren, malen, wandern, tanzen, kochen, Hobby* |
| **49 (2.14)** | **Party & Feiern** | Enjoy a dance party | `#FFC800` (Gold) | Conjunction *und / aber / oder* | *Party, Fest, Musik, tanzen, Freunde, Spaß, feiern* |
| **50 (2.15)** | **Gefühle & Befinden** | Check in on feelings | `#FF4B4B` (Coral) | Modal *fühlen* & adjectives (*glücklich*) | *fühlen, glücklich, traurig, wütend, nervös, erleichtert* |
| **51 (2.16)** | **Am Bahnhof** | Navigate a train station | `#58CC02` (Lime Green) | Separable verbs (*einsteigen, abfahren*) | *Bahnhof, Zug, Gleis, Fahrkarte, abfahren, ankommen, umsteigen* |
| **52 (2.17)** | **Hotelzimmer buchen** | Book a hotel room | `#1CB0F6` (Sky Blue) | Politeness *Ich hätte gern ein Einzelzimmer* | *Hotel, Zimmer, Einzelzimmer, Doppelzimmer, Nacht, reservieren* |
| **53 (2.18)** | **Die Stadt erkunden** | Explore the city | `#00CD9C` (Teal) | Locative *in der Stadt / ins Zentrum* | *Zentrum, Platz, Park, Museum, Kirche, besichtigen* |
| **54 (2.19)** | **Arbeitsalltag & Büro** | Interact and help out at work | `#CE82FF` (Purple) | Modal *können* (Können Sie mir helfen?) | *Chef, Kollege, Büro, Computer, E-Mail, helfen, drucken* |
| **55 (2.20)** | **Tagesablauf schildern** | Discuss activities throughout day | `#FF9600` (Orange) | Separable *aufstehen, frühstücken* | *aufstehen, duschen, anziehen, losgehen, einschlafen* |
| **56 (2.21)** | **Teamarbeit im Büro** | Collaborate at work | `#1CB0F6` (Sky Blue) | Modal verb *wollen* (Wir wollen anfangen) | *Projekt, Termin, Meeting, Pause, besprechen, zusammen* |
| **57 (2.22)** | **Grillen & Picknick** | Shop for a BBQ | `#58CC02` (Lime Green) | Partitive quantities (*ein Kilo Fleisch*) | *Grill, Wurst, Steak, Salat, Kohle, Flasche, Kilo, Gramm* |
| **58 (2.23)** | **Uni & Studium** | Discuss university life | `#FFC800` (Gold) | Verbs *studieren, besuchen* | *Universität, Student, Vorlesung, Mensa, Semester, studieren* |
| **59 (2.24)** | **Auf der Autobahn** | Navigate a road trip | `#FF4B4B` (Coral) | Prepositions *mit dem Auto, auf der Straße* | *Auto, Autobahn, fahren, Stau, Benzin, Tankstelle, anhalten* |
| **60 (2.25)** | **Feste Tagesroutinen** | Manage daily routines | `#00CD9C` (Teal) | Time sequence words (*zuerst, dann, danach*) | *zuerst, dann, danach, schließlich, Routine, pünktlich* |
| **61 (2.26)** | **Besitz & Eigentum** | Indicate ownership | `#CE82FF` (Purple) | Possessive pronouns (*sein, ihr, unser, euer*) | *gehören, mein, dein, sein, ihr, unser, Tasche, Schlüssel* |
| **62 (2.27)** | **Nachbarschaft** | Talk about your neighbors | `#FF9600` (Orange) | Adjectives for people (*freundlich, laut*) | *Nachbar, Nachbarin, Haus, Garten, freundlich, laut, ruhig* |
| **63 (2.28)** | **Orientierung in der Stadt** | Navigate a city & directions | `#58CC02` (Lime Green) | Imperative directions (*Gehen Sie geradeaus*) | *geradeaus, links, rechts, Kreuzung, Ampel, Ecke, biegen* |
| **64 (2.29)** | **Wetterbericht** | Discuss the weather forecast | `#1CB0F6` (Sky Blue) | Weather verbs (*regnen, schneien, scheinen*) | *Wolke, Wind, Schnee, Regen, scheinen, Grad, Wetterbericht* |
| **65 (2.30)** | **Geschenke kaufen** | Shop for gifts | `#FF4B4B` (Coral) | Dative object intro (*Ich schenke dir...*) | *Geschenk, Geburtstag, schenken, Blumen, Schokolade, Einpacken* |
| **66 (2.31)** | **Heimatstadt beschreiben** | Talk about your city | `#00CD9C` (Teal) | *Es gibt* + Accusative (*Es gibt einen Fluss*) | *Fluss, Brücke, Gebäude, Geschichte, Einwohner, berühmt* |
| **67 (2.32)** | **Kleidung anprobieren** | Clothes shopping & fitting | `#CE82FF` (Purple) | Demonstrative pronouns (*dieser, diese, dieses*) | *Größe, anprobieren, Umkleidekabine, passen, Farbe, Pullover* |
| **68 (2.33)** | **Post & Bank** | Post office and bank services | `#FFC800` (Gold) | Modal verb *dürfen* (Darf ich hier...?) | *Brief, Marke, Paket, Geldautomat, Konto, überweisen, schicken* |
| **69 (2.34)** | **Termine vereinbaren** | Schedule appointments | `#58CC02` (Lime Green) | Preposition *am / um* + *passen* | *Termin, vereinbaren, verschieben, absagen, Zeit haben, passen* |
| **70 (2.35)** | **Sektion 2 Finale: Rückblick** | Section 2 Grand Review | `#FFC800` (Gold) | Comprehensive Accusative & Modals Exam | *alles, Alltag, Prüfung, Gespräch, Zertifikat, Erfolg* |

---

# 🧭 SECTION 3: TRAVELER (Reisen, Dialoge & Meisterschaft)
*Focus: Deepening Foundations, Dative Case, Two-Way Prepositions, Polite Requests, Perfekt Tense Intro, and Goethe-Zertifikat A1 Simulation.*  
*Target CEFR Grammar: Dative Case (`dem / der / dem / einem / einer`), Dative Personal Pronouns (`mir, dir, ihm, ihr, uns, Ihnen`), Two-way prepositions (`in, an, auf, unter, vor, hinter`), Comparative Adjectives (`schneller als, besser`), Past Tense Perfekt with `haben` & `sein`, Formal letter/email writing.*

### Master Index of Section 3 Units (Units 71 to 105 / Section 3 Units 1 to 35)

| Unit # | German Title | English Subtitle | Color Theme | Core Grammar Target | Key Vocabulary Targets (5-10 words) |
|:---:|---|---|:---:|---|---|
| **71 (3.1)** | **Neue Stelle antreten** | Discuss a new job | `#1CB0F6` (Sky Blue) | Verbs *beginnen, anfangen* + Dative *mit* | *Stelle, Vertrag, Gehalt, Kollegium, anfangen, Beginn, Chef* |
| **72 (3.2)** | **Gewohnheiten & Alltag** | Talk about your habits | `#58CC02` (Lime Green) | Frequency adverbs (*immer, meistens, selten*) | *Gewohnheit, immer, oft, manchmal, selten, nie, regelmäßig* |
| **73 (3.3)** | **Urlaubskoffer packen** | Pack for a vacation | `#FF9600` (Orange) | Accusative objects list (*Ich packe ein...*) | *Koffer, Tasche, Sonnenbrille, Pass, Handtuch, packen, vergessen* |
| **74 (3.4)** | **Abendessen mit Gästen** | Plan a dinner party | `#CE82FF` (Purple) | Modal verb *sollen* (Was soll ich mitbringen?) | *Gäste, Einladung, vorbereiten, kochen, Tisch decken, Dessert* |
| **75 (3.5)** | **Komplexe Verben** | Use complex prefix verbs | `#FF4B4B` (Coral) | Inseparable prefixes (*verstehen, bezahlen*) | *bezahlen, verstehen, bekommen, gefallen, erklären, wiederholen* |
| **76 (3.6)** | **WG-Leben & Regeln** | Live with flatmates | `#00CD9C` (Teal) | Modal verb *dürfen / nicht dürfen* (Regeln) | *WG, Mitbewohner, Ordnung, Regel, Küche putzen, Müll, leise* |
| **77 (3.7)** | **Dativ: Grundlagen** | Introduction to the Dative case | `#FFC800` (Gold) | Definite articles Dativ (*dem Mann, der Frau*) | *Dativ, dem, der, den, helfen, antworten, danken, gefallen* |
| **78 (3.8)** | **Grillfest organisieren** | Plan a community barbecue | `#1CB0F6` (Sky Blue) | Preposition *mit* + Dative (*mit den Freunden*) | *Grillfest, Nachbarn, mitbringen, Einladung, draußen, Wetter* |
| **79 (3.9)** | **Akkusativ vs. Dativ** | Differentiate Accusative & Dative | `#58CC02` (Lime Green) | Object contrast (*Ich gebe dem Mann den Apfel*) | *geben, schenken, zeigen, senden, Unterschied, Fall* |
| **80 (3.10)** | **Zusammengesetzte Nomen** | Form compound words | `#FF9600` (Orange) | Compound noun gender takes last noun | *Hauptbahnhof, Wörterbuch, Haustür, Fahrkarte, Apfelsaft* |
| **81 (3.11)** | **Einladungen schreiben** | Invite someone to a party | `#CE82FF` (Purple) | Formal/Informal invitations (*Liebe/Lieber*) | *Einladung, feiern, herzlich, antworten, Zusage, Absage, Fest* |
| **82 (3.12)** | **Geschmack & Stil** | Describe style preferences | `#FF4B4B` (Coral) | Verb *gefallen* + Dative (*Das gefällt mir*) | *gefallen, Geschmack, Stil, elegant, modern, passen, Kleidung* |
| **83 (3.13)** | **Dativ-Pronomen** | Master dative pronouns | `#00CD9C` (Teal) | Pronouns *mir, dir, ihm, ihr, uns, euch, Ihnen* | *mir, dir, ihm, ihr, uns, euch, Ihnen, schmecken, passen* |
| **84 (3.14)** | **Vergleiche ziehen** | Form comparative adjectives | `#FFC800` (Gold) | Suffix *-er* + *als* (*besser als, schneller*) | *schneller, billiger, größer, kleiner, besser, mehr, als, wie* |
| **85 (3.15)** | **Ausreden & Entschuldigungen** | Make polite excuses | `#1CB0F6` (Sky Blue) | Politeness *Es tut mir leid, aber...* | *Ausrede, Entschuldigung, leider, Verspätung, Stau, verpassen* |
| **86 (3.16)** | **Um Hilfe bitten** | Ask for assistance politely | `#58CC02` (Lime Green) | Subjunctive *Könnten Sie / Würden Sie bitte...* | *Hilfe, helfen, unterstützen, Problem, bitte, Moment, dringend* |
| **87 (3.17)** | **Wo oder Wohin?** | Location vs. Motion prepositions | `#FF9600` (Orange) | Two-way prepositions (*in, an, auf*) | *liegen, stehen, hängen, legen, stellen, hängen, wo, wohin* |
| **88 (3.18)** | **In den Urlaub fahren** | Travel destinations & transport | `#CE82FF` (Purple) | Preposition *nach* (cities) vs. *in die* (countries) | *Urlaub, Meer, Berge, Strand, See, reisen, buchen, Ticket* |
| **89 (3.19)** | **Beim Arzt: Der Termin** | Doctor's visit & symptoms | `#FF4B4B` (Coral) | Describing health conditions | *Arztpraxis, Sprechstunde, Untersuchung, Rezept, Medikament, Bett* |
| **90 (3.20)** | **Medikamente & Apotheke** | At the pharmacy | `#00CD9C` (Teal) | Dosage instructions (*zweimal am Tag*) | *Apotheke, Tablette, Tropfen, Salbe, einnehmen, vor dem Essen* |
| **91 (3.21)** | **Kulturelle Ereignisse** | Theater, Cinema & Concerts | `#FFC800` (Gold) | Preposition *im Kino / ins Konzert* | *Kino, Film, Theater, Konzert, Eintrittskarte, Vorstellung, Anfang* |
| **92 (3.22)** | **Im Hotel: Reklamation** | Report a hotel room issue | `#1CB0F6` (Sky Blue) | Polite complaints (*Die Heizung funktioniert nicht*) | *Rezeption, Problem, Lärm, kalt, Handtuch, funktioniert nicht, Schlüssel* |
| **93 (3.23)** | **Vergangenheit: Haben** | Past Perfekt with 'haben' | `#58CC02` (Lime Green) | Regular Partizip II (*Ich habe gemacht / gelernt*) | *gemacht, gelernt, gekauft, gekocht, gehört, gesagt, gestern* |
| **94 (3.24)** | **Vergangenheit: Sein** | Past Perfekt with 'sein' | `#FF9600` (Orange) | Motion Partizip II (*Ich bin gefahren / gegangen*) | *gegangen, gefahren, geflogen, gekommen, geblieben, passiert* |
| **95 (3.25)** | **Mein letzter Urlaub** | Describe your last vacation | `#CE82FF` (Purple) | Narrative Perfekt sentences | *Erlebnis, Wetter war super, besichtigt, gewandert, Foto, Spaß* |
| **96 (3.26)** | **Formulare ausfüllen** | Complete official forms | `#FF4B4B` (Coral) | Goethe A1 Form-filling (*Schreiben Teil 1*) | *Formular, Vorname, Familienname, Geburtsdatum, Unterschrift* |
| **97 (3.27)** | **Kurze E-Mails schreiben** | Write short messages & emails | `#00CD9C` (Teal) | Goethe A1 Letter/Email (*Schreiben Teil 2*) | *Sehr geehrte Damen und Herren, Viele Grüße, Anrede, Grußformel* |
| **98 (3.28)** | **Ansagen verstehen** | Understand public announcements | `#FFC800` (Gold) | Public loudspeaker audio (*Hören Teil 2*) | *Durchsage, Gleiswechsel, Verspätung, Ausstieg, Achtung, Bahnsteig* |
| **99 (3.29)** | **Telefonieren im Alltag** | Everyday phone calls | `#1CB0F6` (Sky Blue) | Phone idioms (*Kann ich Herrn Müller sprechen?*) | *anrufen, zurückrufen, Nachricht, Nummer, verbinden, Auf Wiederhören* |
| **100 (3.30)** | **Ein Gespräch führen** | Carry out social conversations | `#58CC02` (Lime Green) | Natural conversational flow & fillers | *stimmt, natürlich, echt, übrigens, auf jeden Fall, genau* |
| **101 (3.31)** | **Meinungen begründen** | Give opinions with 'weil' | `#FF9600` (Orange) | Subordinating conjunction *weil* (Verb at end) | *Meinung, finden, denken, weil, wichtig, richtig, interessant* |
| **102 (3.32)** | **Zukunftspläne** | Express plans and wishes | `#CE82FF` (Purple) | Verb *wollen* & *hoffen* | *Plan, Traum, hoffen, möchten, nächste Woche, nächstes Jahr* |
| **103 (3.33)** | **Goethe A1 Simulation: Hören** | Exam Simulation: Listening | `#FF4B4B` (Coral) | Authentic exam question format | *Prüfung, Aufgabe, Kreuz, Dialog, richtig/falsch, Text* |
| **104 (3.34)** | **Goethe A1 Simulation: Sprechen** | Exam Simulation: Speaking | `#00CD9C` (Teal) | Prompt cards & questioning partner | *Vorstellung, Karte, Bitte formulieren, Frage stellen, Antwort* |
| **105 (3.35)** | **Das Große A1-Finale** | Grand A1 Mastery Exam | `#FFC800` (Gold) | Comprehensive Start Deutsch 1 Certification | *Zertifikat, A1 abgeschlossen, Erfolg, Gratulation, Meisterschaft* |

---

## 🎯 Concrete Lesson Specification Example (Section 2, Unit 16: Hotelzimmer buchen)

Here is the exact interactive blueprint for **Unit 52 (Section 2, Unit 16)**, which is directly featured in the reference screenshots:

### Node 0 (Lesson 1): Wortschatz Hotel (Core Vocabulary)
* **Type**: `lesson` | **XP**: 15 | **Pearls**: 5
* **Stages**:
  1. `word_match`:
     * `das Hotel` ↔ `hotel`
     * `das Zimmer` ↔ `room`
     * `das Einzelzimmer` ↔ `single room`
     * `das Doppelzimmer` ↔ `double room`
     * `die Nacht` ↔ `night`
  2. `listen_tap`:
     * Target: `"Ich brauche ein Zimmer für zwei Nächte."`
     * Tokens: `["Ich", "brauche", "ein", "Zimmer", "für", "zwei", "Nächte.", "Hotel", "bitte"]`
  3. `sentence_builder`:
     * Prompt: `"Translate: A single room with breakfast, please."`
     * Target: `"Ein Einzelzimmer mit Frühstück, bitte."`
     * Tokens: `["Ein", "Einzelzimmer", "mit", "Frühstück,", "bitte.", "Doppelzimmer", "Kaffee"]`

### Node 3 (Lesson 4): Chat-Dialog an der Rezeption 💬
* **Type**: `lesson` | **XP**: 20 | **Pearls**: 5
* **Stages**:
  1. `dialogue_bubble`:
     * Speaker: Receptionist (*Frau Meyer*)
     * German: `"Guten Tag! Haben Sie eine Reservierung bei uns?"`
     * Translation: `"Good day! Do you have a reservation with us?"`
     * User Choices:
       * ✅ `"Ja, auf den Namen Weber für zwei Nächte."`
       * ❌ `"Nein, ich möchte ein Kilo Äpfel."`
  2. `cloze_test`:
     * German Prompt: `"Hier ist Ihr Zimmerschlüssel. Ihr Zimmer ist im dritten _______."`
     * English: `"Here is your room key. Your room is on the third floor."`
     * Missing word options: `["Stock", "Bett", "Gleis"]` (Correct: `Stock`)

### Node 4 (Lesson 5): Grammatik & Umlaute
* **Type**: `lesson` | **XP**: 20 | **Pearls**: 5
* **Stages**:
  1. `type_word`:
     * Prompt: `"Type the German word for 'nights' (plural of Nacht with Umlaut):"`
     * Target: `"Nächte"`
     * Umlaut Toolbar: `[ä, ö, ü, ß, Ä, Ö, Ü]` enabled.
  2. `cloze_test`:
     * Prompt: `"Haben Sie noch ein freies Doppelzimmer für _______?"`
     * Target: `"heute"`
     * Options: `["heute", "gestern", "morgen"]`

### Node 15 (Lesson 16): Unit 16 Boss Challenge 🏆
* **Type**: `lesson` (Boss Trophy) | **XP**: 35 | **Pearls**: 15
* **Stages**:
  1. `sentence_builder`: `"Guten Tag, wir möchten ein Doppelzimmer mit Dusche und Balkon reservieren."`
  2. `sprechen`: `"Ist das Frühstück im Preis inklusive?"` (Min accuracy: 80%)
  3. `listen_select`: Receptionist audio at normal speed (1.0x) and turtle speed (0.75x) with 3 comprehension options.
  4. `cloze_test`: `"Ich bezahle die Rechnung gerne mit _______."` (`["Kreditkarte", "Fahrkarte", "Speisekarte"]`)

---

## 🛠️ Data Seeding & Database Integration

To seed the database with all 105 units and 1,680 lessons cleanly:
1. `CurriculumLessons` MySQL schema handles `unitNumber` (1 to 105), `unitTitle`, `unitDescription`, `lessonIndex` (0 to 15), `nodeType`, and `stages` JSON.
2. The Node script `scripts/generate_curriculum_a1.js` systematically generates `german_a1.json` and the corresponding `seed_german_a1.sql` for phpMyAdmin.
3. The mobile app's `ArchipelagoMapScreen` dynamically computes section headers:
   * **Section 1**: Units `1` to `35`
   * **Section 2**: Units `36` to `70` (displayed as `SECTION 2, UNIT 1` through `SECTION 2, UNIT 35`)
   * **Section 3**: Units `71` to `105` (displayed as `SECTION 3, UNIT 1` through `SECTION 3, UNIT 35`)
