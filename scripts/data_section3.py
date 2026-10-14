try:
    from scripts.generate_curriculum_data import make_unit
except ImportError:
    from generate_curriculum_data import make_unit

def get_section3_units():
    units = []

    # Unit 71: Neue Stelle antreten
    units.append(make_unit(
        71, 3, "Neue Stelle antreten", "Discuss a new job", "#1CB0F6",
        [{"de": "Vertrag", "en": "contract"}, {"de": "Stelle", "en": "job position"}, {"de": "Gehalt", "en": "salary"}, {"de": "Chef", "en": "boss"}],
        [{"de": "Kollege", "en": "colleague"}, {"de": "Bewerbung", "en": "application"}, {"de": "unterschreiben", "en": "to sign"}, {"de": "beginnen", "en": "to begin / start"}],
        [{"de": "Probezeit", "en": "probation period"}, {"de": "Arbeitsplatz", "en": "workplace"}, {"de": "Vollzeit", "en": "full-time"}, {"de": "Teilzeit", "en": "part-time"}],
        [{"de": "Erfahrung", "en": "experience"}, {"de": "Lebenslauf", "en": "resume / CV"}, {"de": "Team", "en": "team"}, {"de": "Aufgabe", "en": "task"}],
        {"de": "Ich habe einen neuen Arbeitsvertrag unterschrieben.", "en": "I have signed a new employment contract."},
        {"de": "Mein neuer Chef ist sehr nett.", "en": "My new boss is very nice."},
        {"de": "Die Stelle ist ab ersten März frei.", "en": "The position is open from March 1st."},
        {"de": "Wann beginnen Sie mit Ihrer neuen Arbeit?", "en": "When do you start your new job?"},
        {"de": "Ich arbeite in Vollzeit in einem tollen Team.", "en": "I work full-time in a great team."},
        {"de": "In der Probezeit lerne ich alle Kollegen kennen.", "en": "During probation I get to know all colleagues."},
        {"partner": "Chef", "prompt": "Herzlich willkommen in unserem Unternehmen!", "translation": "Welcome to our company!", "options": ["Vielen Dank, ich freue mich auf die Arbeit!", "Ich esse Pizza."]},
        {"partner": "Chef", "prompt": "Haben Sie alle Dokumente dabei?", "translation": "Do you have all documents with you?", "options": ["Ja, hier ist mein unterschriebener Vertrag.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'contract':", "target": "Vertrag", "hint": "Hint: 7 letters starting with V"},
        {"prompt": "Type the German word for 'salary':", "target": "Gehalt", "hint": "Hint: monthly pay noun"},
        {"prompt": "Ich habe den neuen _______ unterschrieben.", "en": "I have signed the new contract.", "options": ["Vertrag", "Kollege", "Probezeit"], "answer": "Vertrag"},
        {"prompt": "Ich arbeite ab nächster Woche in _______.", "en": "I work full-time starting next week.", "options": ["Vollzeit", "Gehalt", "Chef"], "answer": "Vollzeit"}
    ))

    # Unit 72: Gewohnheiten & Alltag
    units.append(make_unit(
        72, 3, "Gewohnheiten & Alltag", "Talk about habits", "#58CC02",
        [{"de": "oft", "en": "often"}, {"de": "manchmal", "en": "sometimes"}, {"de": "selten", "en": "rarely"}, {"de": "meistens", "en": "mostly / usually"}],
        [{"de": "täglich", "en": "daily"}, {"de": "Gewohnheit", "en": "habit"}, {"de": "Routine", "en": "routine"}, {"de": "Feierabend", "en": "after-work time"}],
        [{"de": "regelmäßig", "en": "regularly"}, {"de": "morgens", "en": "in the mornings"}, {"de": "abends", "en": "in the evenings"}, {"de": "aufwachen", "en": "to wake up"}],
        [{"de": "spazieren", "en": "to stroll / walk"}, {"de": "Sport treiben", "en": "to do sports"}, {"de": "gesund leben", "en": "to live healthily"}, {"de": "entspannen", "en": "to relax"}],
        {"de": "Ich trinke morgens meistens grünen Tee.", "en": "In the morning I usually drink green tea."},
        {"de": "Wir gehen oft im Wald spazieren.", "en": "We often go for a walk in the forest."},
        {"de": "Er treibt regelmäßig Sport im Verein.", "en": "He does sports regularly in the club."},
        {"de": "Welche Gewohnheiten hast du im Alltag?", "en": "Which habits do you have in daily life?"},
        {"de": "Ich wache täglich um sechs Uhr auf.", "en": "I wake up daily at six o'clock."},
        {"de": "Am Abend entspanne ich mich auf dem Sofa.", "en": "In the evening I relax on the sofa."},
        {"partner": "David", "prompt": "Wie oft gehst du in der Woche joggen?", "translation": "How often do you go jogging in the week?", "options": ["Ich gehe meistens dreimal pro Woche joggen.", "Heute ist Sonntag."]},
        {"partner": "David", "prompt": "Liest du abends gerne im Bett?", "translation": "Do you like reading in bed in the evening?", "options": ["Ja, das ist meine tägliche Gewohnheit.", "Danke sehr."]},
        {"prompt": "Type the German word for 'often':", "target": "oft", "hint": "Hint: 3 letters starting with o"},
        {"prompt": "Type the German word for 'rarely':", "target": "selten", "hint": "Hint: opposite of oft"},
        {"prompt": "Ich trinke _______ grünen Tee zum Frühstück.", "en": "I usually drink green tea for breakfast.", "options": ["meistens", "Routine", "selten"], "answer": "meistens"},
        {"prompt": "Wir gehen sonntags oft im Park _______.", "en": "We often go walking in the park on Sundays.", "options": ["spazieren", "aufwachen", "entspannen"], "answer": "spazieren"}
    ))

    # Unit 73: Urlaubskoffer packen
    units.append(make_unit(
        73, 3, "Urlaubskoffer packen", "Pack for vacation", "#FF9600",
        [{"de": "Koffer", "en": "suitcase"}, {"de": "packen", "en": "to pack"}, {"de": "Pass", "en": "passport"}, {"de": "Flugticket", "en": "flight ticket"}],
        [{"de": "Sonnenbrille", "en": "sunglasses"}, {"de": "Badehose", "en": "swim trunks"}, {"de": "Handtuch", "en": "towel"}, {"de": "Zahnbürste", "en": "toothbrush"}],
        [{"de": "Kosmetik", "en": "cosmetics / toiletries"}, {"de": "Kleidung", "en": "clothing"}, {"de": "vergessen", "en": "to forget"}, {"de": "einpacken", "en": "to pack inside"}],
        [{"de": "Reise", "en": "trip / journey"}, {"de": "Flughafen", "en": "airport"}, {"de": "schwer", "en": "heavy"}, {"de": "leicht", "en": "light"}],
        {"de": "Ich packe meinen großen Koffer.", "en": "I pack my big suitcase."},
        {"de": "Vergiss bitte deinen Reisepass nicht!", "en": "Please do not forget your passport!"},
        {"de": "Das Flugticket liegt schon auf dem Tisch.", "en": "The flight ticket is already on the table."},
        {"de": "Hast du deine Sonnenbrille und Badehose eingepackt?", "en": "Have you packed your sunglasses and swim trunks?"},
        {"de": "Der Koffer wiegt genau zwanzig Kilo.", "en": "The suitcase weighs exactly twenty kilos."},
        {"de": "Morgen früh fahren wir gemeinsam zum Flughafen.", "en": "Tomorrow morning we drive together to the airport."},
        {"partner": "Reisebegleiter", "prompt": "Hast du alle wichtigen Dokumente eingepackt?", "translation": "Have you packed all important documents?", "options": ["Ja, Pass und Flugticket sind im Rucksack.", "Ich trinke Kaffee."]},
        {"partner": "Reisebegleiter", "prompt": "Ist dein Koffer zu schwer?", "translation": "Is your suitcase too heavy?", "options": ["Nein, er ist erstaunlich leicht.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'suitcase':", "target": "Koffer", "hint": "Hint: luggage item noun"},
        {"prompt": "Type the German word for 'passport':", "target": "Pass", "hint": "Hint: travel ID with double s"},
        {"prompt": "Vergiss bitte nicht deinen _______!", "en": "Please do not forget your passport!", "options": ["Pass", "Koffer", "Handtuch"], "answer": "Pass"},
        {"prompt": "Ich muss heute meinen Koffer _______.", "en": "I must pack my suitcase today.", "options": ["packen", "vergessen", "fliegen"], "answer": "packen"}
    ))

    # Unit 74: Abendessen mit Gästen
    units.append(make_unit(
        74, 3, "Abendessen mit Gästen", "Plan a dinner party", "#CE82FF",
        [{"de": "Gäste", "en": "guests"}, {"de": "einladen", "en": "to invite"}, {"de": "Tisch decken", "en": "to set table"}, {"de": "servieren", "en": "to serve"}],
        [{"de": "Vorspeise", "en": "appetizer"}, {"de": "Hauptgericht", "en": "main course"}, {"de": "Dessert", "en": "dessert"}, {"de": "Wein", "en": "wine"}],
        [{"de": "Gastfreundschaft", "en": "hospitality"}, {"de": "willkommen", "en": "welcome"}, {"de": "feiern", "en": "to celebrate"}, {"de": "Gemütlichkeit", "en": "coziness"}],
        [{"de": "Teller", "en": "plate"}, {"de": "Besteck", "en": "cutlery"}, {"de": "Kerze", "en": "candle"}, {"de": "anstoßen", "en": "to toast / clink glasses"}],
        {"de": "Heute Abend haben wir liebe Gäste.", "en": "Tonight we have lovely guests."},
        {"de": "Ich decke den Tisch mit Kerzen.", "en": "I set the table with candles."},
        {"de": "Wir stoßen mit einem Glas Wein an.", "en": "We toast with a glass of wine."},
        {"de": "Wie viele Gäste hast du eingeladen?", "en": "How many guests did you invite?"},
        {"de": "Als Hauptgericht serviere ich frischen Fisch.", "en": "As a main course I serve fresh fish."},
        {"de": "Herzlich willkommen in unserem gemütlichen Zuhause!", "en": "Warm welcome to our cozy home!"},
        {"partner": "Gast", "prompt": "Vielen Dank für die Einladung!", "translation": "Many thanks for the invitation!", "options": ["Schön, dass du da bist! Komm herein.", "Ich habe keine Zeit."]},
        {"partner": "Gast", "prompt": "Das Essen riecht wirklich fantastisch!", "translation": "The food smells really fantastic!", "options": ["Guten Appetit, lasst es euch schmecken!", "Zehn Euro bitte."]},
        {"prompt": "Type the German word for 'guests':", "target": "Gäste", "hint": "Hint: plural noun with Umlaut ä"},
        {"prompt": "Type the German word for 'wine':", "target": "Wein", "hint": "Hint: fermented grape drink"},
        {"prompt": "Heute Abend kommen viele liebe _______.", "en": "Many lovely guests are coming tonight.", "options": ["Gäste", "Besteck", "Teller"], "answer": "Gäste"},
        {"prompt": "Ich _______ den Tisch für das Abendessen.", "en": "I set the table for dinner.", "options": ["decke", "einlade", "trinke"], "answer": "decke"}
    ))

    # Unit 75: Komplexe Verben
    units.append(make_unit(
        75, 3, "Komplexe Verben", "Prefix verbs", "#FF4B4B",
        [{"de": "bezahlen", "en": "to pay for"}, {"de": "verstehen", "en": "to understand"}, {"de": "beginnen", "en": "to begin"}, {"de": "erklären", "en": "to explain"}],
        [{"de": "vergessen", "en": "to forget"}, {"de": "behalten", "en": "to keep"}, {"de": "erkennen", "en": "to recognize"}, {"de": "gefallen", "en": "to please / appeal to"}],
        [{"de": "gehören", "en": "to belong to"}, {"de": "verlieren", "en": "to lose"}, {"de": "gewinnen", "en": "to win"}, {"de": "empfehlen", "en": "to recommend"}],
        [{"de": "beschreiben", "en": "to describe"}, {"de": "bedeuten", "en": "to mean"}, {"de": "erleben", "en": "to experience"}, {"de": "Vorsilbe", "en": "prefix"}],
        {"de": "Ich bezahle die Rechnung sofort.", "en": "I pay the bill immediately."},
        {"de": "Der Lehrer erklärt die schwierige Grammatik.", "en": "The teacher explains the difficult grammar."},
        {"de": "Ich habe seinen Namen leider vergessen.", "en": "Unfortunately I forgot his name."},
        {"de": "Können Sie diese Situation genauer beschreiben?", "en": "Can you describe this situation more accurately?"},
        {"de": "Das rote Auto gehört meinem Bruder.", "en": "The red car belongs to my brother."},
        {"de": "Wir erleben jeden Tag etwas ganz Neues.", "en": "We experience something completely new every day."},
        {"partner": "Lehrer", "prompt": "Verstehst du alle neuen Verben?", "translation": "Do you understand all the new verbs?", "options": ["Ja, Sie haben es sehr gut erklärt.", "Ich nehme den Bus."]},
        {"partner": "Lehrer", "prompt": "Welches Gericht kannst du empfehlen?", "translation": "Which dish can you recommend?", "options": ["Ich empfehle die hausgemachte Suppe.", "Danke schön!"]},
        {"prompt": "Type the German non-separable verb for 'to explain':", "target": "erklären", "hint": "Hint: prefix er- with Umlaut ä"},
        {"prompt": "Type the German verb for 'to pay':", "target": "bezahlen", "hint": "Hint: prefix be-"},
        {"prompt": "Ich _______ die Rechnung mit Bargeld.", "en": "I pay the bill with cash.", "options": ["bezahle", "verstehe", "gehöre"], "answer": "bezahle"},
        {"prompt": "Der Lehrer _______ die Übung noch einmal.", "en": "The teacher explains the exercise once more.", "options": ["erklärt", "vergisst", "verliert"], "answer": "erklärt"}
    ))

    # Unit 76: WG-Leben & Regeln
    units.append(make_unit(
        76, 3, "WG-Leben & Regeln", "Flatmate living", "#00CD9C",
        [{"de": "Küche", "en": "kitchen"}, {"de": "WG", "en": "shared apartment"}, {"de": "Mitbewohner", "en": "flatmate / roommate"}, {"de": "Putzplan", "en": "cleaning schedule"}],
        [{"de": "Müll", "en": "trash / garbage"}, {"de": "rausbringen", "en": "to take out"}, {"de": "sauber", "en": "clean"}, {"de": "schmutzig", "en": "dirty"}],
        [{"de": "Ordnung", "en": "order / neatness"}, {"de": "teilen", "en": "to share"}, {"de": "Regel", "en": "rule"}, {"de": "Ruhezeit", "en": "quiet hours"}],
        [{"de": "Badezimmer", "en": "bathroom"}, {"de": "Gemeinschaft", "en": "community"}, {"de": "einigen", "en": "to agree"}, {"de": "Zusammenleben", "en": "living together"}],
        {"de": "Ich wohne in einer gemütlichen WG.", "en": "I live in a cozy shared flat."},
        {"de": "Wer bringt heute den Müll raus?", "en": "Who is taking out the trash today?"},
        {"de": "Die Küche muss immer sauber sein.", "en": "The kitchen must always be clean."},
        {"de": "Haben Sie einen festen Putzplan in der WG?", "en": "Do you have a fixed cleaning schedule in the flat?"},
        {"de": "Ab zweiundzwanzig Uhr gilt die gesetzliche Ruhezeit.", "en": "From 10 PM quiet hours apply."},
        {"de": "Wir teilen uns die Miete und die Nebenkosten.", "en": "We share the rent and utility costs."},
        {"partner": "Mitbewohnerin", "prompt": "Bist du heute mit dem Putzen dran?", "translation": "Is it your turn to clean today?", "options": ["Ja, ich putze heute das Badezimmer.", "Heute ist Mai."]},
        {"partner": "Mitbewohnerin", "prompt": "Kochen wir heute Abend zusammen?", "translation": "Are we cooking together tonight?", "options": ["Gute Idee, lass uns Pasta machen!", "Auf Wiedersehen."]},
        {"prompt": "Type the German abbreviation for 'shared apartment':", "target": "WG", "hint": "Hint: 2 capital letters (Wohngemeinschaft)"},
        {"prompt": "Type the German word for 'flatmate':", "target": "Mitbewohner", "hint": "Hint: person living with you"},
        {"prompt": "Die Küche muss immer _______ sein.", "en": "The kitchen must always be clean.", "options": ["sauber", "schmutzig", "Müll"], "answer": "sauber"},
        {"prompt": "Wer bringt heute den _______ raus?", "en": "Who is taking out the trash today?", "options": ["Müll", "Putzplan", "Regel"], "answer": "Müll"}
    ))

    # Unit 77: Dativ: Grundlagen
    units.append(make_unit(
        77, 3, "Dativ: Grundlagen", "Introduction to Dative case", "#FFC800",
        [{"de": "helfen", "en": "to help"}, {"de": "danken", "en": "to thank"}, {"de": "antworten", "en": "to answer"}, {"de": "gefallen", "en": "to appeal to / like"}],
        [{"de": "schmecken", "en": "to taste good to"}, {"de": "gehören", "en": "to belong to"}, {"de": "passen", "en": "to fit / suit"}, {"de": "gratulieren", "en": "to congratulate"}],
        [{"de": "dem Mann", "en": "the man (dat)"}, {"de": "der Frau", "en": "the woman (dat)"}, {"de": "dem Kind", "en": "the child (dat)"}, {"de": "den Freunden", "en": "the friends (dat)"}],
        [{"de": "Dativ", "en": "dative case"}, {"de": "Fall", "en": "grammatical case"}, {"de": "wichtig", "en": "important"}, {"de": "Regel", "en": "rule"}],
        {"de": "Ich helfe dem alten Mann.", "en": "I help the old man."},
        {"de": "Wir danken der freundlichen Lehrerin.", "en": "We thank the friendly teacher."},
        {"de": "Das Buch gehört dem kleinen Kind.", "en": "The book belongs to the small child."},
        {"de": "Antworten Sie dem Prüfer bitte auf Deutsch?", "en": "Do you answer the examiner in German, please?"},
        {"de": "Das Essen schmeckt den Gästen ausgezeichnet.", "en": "The food tastes excellent to the guests."},
        {"de": "Ich gratuliere meinem Freund herzlich zum Geburtstag.", "en": "I congratulate my friend warmly on his birthday."},
        {"partner": "Anna", "prompt": "Kannst du der neuen Kollegin helfen?", "translation": "Can you help the new female colleague?", "options": ["Ja, ich helfe der Kollegin sehr gerne.", "Ich mag Hunde."]},
        {"partner": "Anna", "prompt": "Gehört dieser Schal dem Mann dort?", "translation": "Does this scarf belong to the man over there?", "options": ["Ja, der Schal gehört dem Mann.", "Gute Nacht."]},
        {"prompt": "Type the German dative verb for 'to help':", "target": "helfen", "hint": "Hint: 6 letters starting with h"},
        {"prompt": "Type the German dative verb for 'to thank':", "target": "danken", "hint": "Hint: 6 letters starting with d"},
        {"prompt": "Ich helfe _______ Mann beim Tragen.", "en": "I help the man with carrying.", "options": ["dem", "den", "der"], "answer": "dem"},
        {"prompt": "Wir danken _______ freundlichen Lehrerin.", "en": "We thank the friendly teacher.", "options": ["der", "die", "dem"], "answer": "der"}
    ))

    # Unit 78: Grillfest organisieren
    units.append(make_unit(
        78, 3, "Grillfest organisieren", "Plan a barbecue", "#1CB0F6",
        [{"de": "mitbringen", "en": "to bring along"}, {"de": "Wurst", "en": "sausage"}, {"de": "Steak", "en": "steak"}, {"de": "Salat", "en": "salad"}],
        [{"de": "Grill", "en": "barbecue grill"}, {"de": "Holzkohle", "en": "charcoal"}, {"de": "Garten", "en": "garden"}, {"de": "Sommer", "en": "summer"}],
        [{"de": "Grillfest", "en": "barbecue party"}, {"de": "Getränke", "en": "drinks"}, {"de": "hungrig", "en": "hungry"}, {"de": "durstig", "en": "thirsty"}],
        [{"de": "organisieren", "en": "to organize"}, {"de": "feiern", "en": "to celebrate"}, {"de": "Gemüsegrill", "en": "vegetable grill"}, {"de": "Sauce", "en": "sauce"}],
        {"de": "Wir organisieren ein großes Grillfest.", "en": "We are organizing a big barbecue party."},
        {"de": "Ich bringe leckere Würstchen und Salat mit.", "en": "I bring delicious sausages and salad along."},
        {"de": "Der Grill steht draußen im sonnigen Garten.", "en": "The grill stands outside in the sunny garden."},
        {"de": "Was bringst du zum Grillfest am Samstag mit?", "en": "What are you bringing along to the barbecue on Saturday?"},
        {"de": "Wir haben genügend Holzkohle und kühle Getränke.", "en": "We have enough charcoal and cool drinks."},
        {"de": "Alle Freunde feiern fröhlich bis spät in die Nacht.", "en": "All friends celebrate happily until late at night."},
        {"partner": "Florian", "prompt": "Soll ich etwas zum Grillen mitbringen?", "translation": "Should I bring something for grilling along?", "options": ["Bring gerne einen Kartoffelsalat mit!", "Ich heiße David."]},
        {"partner": "Florian", "prompt": "Um wie viel Uhr zünden wir den Grill an?", "translation": "At what time do we light the grill?", "options": ["Gegen achtzehn Uhr fangen wir an.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'sausage':", "target": "Wurst", "hint": "Hint: German grilled staple"},
        {"prompt": "Type the German separable verb for 'to bring along':", "target": "mitbringen", "hint": "Hint: prefix mit-"},
        {"prompt": "Ich bringe einen frischen Kartoffelsalat _______.", "en": "I bring a fresh potato salad along.", "options": ["mit", "aus", "ein"], "answer": "mit"},
        {"prompt": "Der Grill steht draußen im _______.", "en": "The grill stands outside in the garden.", "options": ["Garten", "Küche", "Zimmer"], "answer": "Garten"}
    ))

    # Unit 79: Akkusativ vs. Dativ
    units.append(make_unit(
        79, 3, "Akkusativ vs. Dativ", "Differentiate cases", "#58CC02",
        [{"de": "geben", "en": "to give"}, {"de": "schenken", "en": "to gift / give as present"}, {"de": "zeigen", "en": "to show"}, {"de": "schicken", "en": "to send"}],
        [{"de": "bringen", "en": "to bring"}, {"de": "leihen", "en": "to lend / borrow"}, {"de": "Geschenk", "en": "gift / present"}, {"de": "Brief", "en": "letter"}],
        [{"de": "Buch", "en": "book"}, {"de": "Blume", "en": "flower"}, {"de": "Geld", "en": "money"}, {"de": "Kamera", "en": "camera"}],
        [{"de": "Person", "en": "person (dative)"}, {"de": "Sache", "en": "thing (accusative)"}, {"de": "Fall", "en": "case"}, {"de": "Regel", "en": "rule"}],
        {"de": "Ich gebe dem Freund das Buch.", "en": "I give the friend the book."},
        {"de": "Er schenkt der Mutter schöne Blumen.", "en": "He gifts the mother beautiful flowers."},
        {"de": "Ich zeige dem Touristen den richtigen Weg.", "en": "I show the tourist the right way."},
        {"de": "Schickst du der Kollegin die wichtige E-Mail?", "en": "Are you sending the female colleague the important email?"},
        {"de": "Ich leihe meinem Bruder etwas Geld.", "en": "I lend my brother some money."},
        {"de": "Dem Vater schenken wir eine neue Uhr zum Fest.", "en": "We gift the father a new watch for the festival."},
        {"partner": "Trainer", "prompt": "Wem gibst du das Geschenk?", "translation": "To whom do you give the gift?", "options": ["Ich gebe meiner Schwester das Geschenk.", "Ich bin 25 Jahre alt."]},
        {"partner": "Trainer", "prompt": "Was schenkst du deinem Vater?", "translation": "What do you gift your father?", "options": ["Ich schenke ihm ein deutsches Buch.", "Danke schön!"]},
        {"prompt": "Type the German verb for 'to give':", "target": "geben", "hint": "Hint: 5 letters starting with g"},
        {"prompt": "Type the German verb for 'to gift / present':", "target": "schenken", "hint": "Hint: 8 letters starting with sch"},
        {"prompt": "Ich gebe _______ Freund das Buch.", "en": "I give the friend the book.", "options": ["dem", "den", "der"], "answer": "dem"},
        {"prompt": "Er schenkt der Mutter schöne _______.", "en": "He gifts the mother beautiful flowers.", "options": ["Blumen", "Brief", "Kamera"], "answer": "Blumen"}
    ))

    # Unit 80: Zusammengesetzte Nomen
    units.append(make_unit(
        80, 3, "Zusammengesetzte Nomen", "Compound words", "#FF9600",
        [{"de": "Hauptbahnhof", "en": "central train station"}, {"de": "Fahrkarte", "en": "ticket"}, {"de": "Apfelsaft", "en": "apple juice"}, {"de": "Deutschkurs", "en": "German course"}],
        [{"de": "Wörterbuch", "en": "dictionary"}, {"de": "Haustür", "en": "front door"}, {"de": "Sonnenbrille", "en": "sunglasses"}, {"de": "Kühlschrank", "en": "refrigerator"}],
        [{"de": "Zahnbürste", "en": "toothbrush"}, {"de": "Waschmaschine", "en": "washing machine"}, {"de": "Schreibtisch", "en": "desk"}, {"de": "Kinderzimmer", "en": "children's room"}],
        [{"de": "Grundwort", "en": "base word"}, {"de": "Bestimmungswort", "en": "qualifying word"}, {"de": "Artikel", "en": "article"}, {"de": "Regel", "en": "rule"}],
        {"de": "Wir treffen uns am Hauptbahnhof.", "en": "We meet at the central station."},
        {"de": "Ich trinke gerne frischen Apfelsaft.", "en": "I like drinking fresh apple juice."},
        {"de": "Das deutsche Wörterbuch liegt auf dem Schreibtisch.", "en": "The German dictionary lies on the desk."},
        {"de": "Haben Sie die neue Waschmaschine schon angeschlossen?", "en": "Have you already connected the new washing machine?"},
        {"de": "Die Milch steht kühl im Kühlschrank.", "en": "The milk stands cool in the refrigerator."},
        {"de": "Das letzte Nomen bestimmt immer den Artikel.", "en": "The final noun always determines the article."},
        {"partner": "Lehrer", "prompt": "Welcher Artikel gehört zu 'Apfelsaft'?", "translation": "Which article belongs to 'Apfelsaft'?", "options": ["Der Apfelsaft, weil es 'der Saft' heißt.", "Ich habe Hunger."]},
        {"partner": "Lehrer", "prompt": "Wo treffen wir uns heute Nachmittag?", "translation": "Where do we meet this afternoon?", "options": ["Direkt vor dem Hauptbahnhof.", "Auf Wiedersehen."]},
        {"prompt": "Type the German compound noun for 'central train station':", "target": "Hauptbahnhof", "hint": "Hint: Haupt + Bahn + Hof"},
        {"prompt": "Type the German compound noun for 'refrigerator':", "target": "Kühlschrank", "hint": "Hint: cool closet with Umlaut ü"},
        {"prompt": "Wir treffen uns um drei am _______.", "en": "We meet at three at the central station.", "options": ["Hauptbahnhof", "Haustür", "Zahnbürste"], "answer": "Hauptbahnhof"},
        {"prompt": "Die Milch steht kalt im _______.", "en": "The milk stands cold in the fridge.", "options": ["Kühlschrank", "Schreibtisch", "Deutschkurs"], "answer": "Kühlschrank"}
    ))

    # Unit 81: Einladungen schreiben
    units.append(make_unit(
        81, 3, "Einladungen schreiben", "Invite someone", "#CE82FF",
        [{"de": "Einladung", "en": "invitation"}, {"de": "einladen", "en": "to invite"}, {"de": "Geburtstag", "en": "birthday"}, {"de": "Party", "en": "party"}],
        [{"de": "zusagen", "en": "to accept / confirm"}, {"de": "absagen", "en": "to decline / cancel"}, {"de": "freuen", "en": "to look forward / be glad"}, {"de": "Adresse", "en": "address"}],
        [{"de": "Datum", "en": "date"}, {"de": "Uhrzeit", "en": "time"}, {"de": "Feier", "en": "celebration"}, {"de": "Überraschung", "en": "surprise"}],
        [{"de": "Gast", "en": "guest"}, {"de": "mitbringen", "en": "to bring along"}, {"de": "Bescheid geben", "en": "to let know"}, {"de": "herzlich", "en": "warmly"}],
        {"de": "Ich lade dich herzlich zu meiner Party ein.", "en": "I warmly invite you to my party."},
        {"de": "Ich freue mich sehr über die Einladung.", "en": "I am very pleased about the invitation."},
        {"de": "Kannst du mir bis Freitag Bescheid geben?", "en": "Can you let me know by Friday?"},
        {"de": "Kommst du am Samstag zu meiner Geburtstagsfeier?", "en": "Are you coming to my birthday party on Saturday?"},
        {"de": "Ich muss leider absagen, da ich verreist bin.", "en": "Unfortunately I have to decline as I am away."},
        {"de": "Die Feier beginnt um zwanzig Uhr bei mir zu Hause.", "en": "The party begins at 8 PM at my home."},
        {"partner": "Freund", "prompt": "Kommst du am Wochenende zu meinem Geburtstag?", "translation": "Are you coming to my birthday on the weekend?", "options": ["Ja natürlich, ich sage sehr gerne zu!", "Ich nehme den Zug."]},
        {"partner": "Freund", "prompt": "Soll ich einen Kuchen mitbringen?", "translation": "Should I bring a cake along?", "options": ["Das wäre fantastisch, vielen Dank!", "Danke sehr."]},
        {"prompt": "Type the German noun for 'invitation':", "target": "Einladung", "hint": "Hint: 9 letters starting with E"},
        {"prompt": "Type the German separable verb for 'to accept an invite':", "target": "zusagen", "hint": "Hint: opposite of absagen"},
        {"prompt": "Ich lade dich herzlich zu meiner Party _______.", "en": "I warmly invite you to my party.", "options": ["ein", "auf", "mit"], "answer": "ein"},
        {"prompt": "Vielen Dank für die nette _______!", "en": "Many thanks for the nice invitation!", "options": ["Einladung", "Adresse", "Uhrzeit"], "answer": "Einladung"}
    ))

    # Unit 82: Geschmack & Stil
    units.append(make_unit(
        82, 3, "Geschmack & Stil", "Describe style preferences", "#FF4B4B",
        [{"de": "gefallen", "en": "to appeal to / like"}, {"de": "Geschmack", "en": "taste / style"}, {"de": "Stil", "en": "style"}, {"de": "modern", "en": "modern"}],
        [{"de": "klassisch", "en": "classic"}, {"de": "elegant", "en": "elegant"}, {"de": "bequem", "en": "comfortable"}, {"de": "hässlich", "en": "ugly"}],
        [{"de": "schön", "en": "beautiful"}, {"de": "passen", "en": "to fit / suit"}, {"de": "Farbe", "en": "color"}, {"de": "Schnitt", "en": "cut / fit"}],
        [{"de": "Kleidung", "en": "clothing"}, {"de": "Auswahl", "en": "selection"}, {"de": "Mode", "en": "fashion"}, {"de": "stehen", "en": "to suit (look good on)"}],
        {"de": "Dieser moderne Mantel gefällt mir sehr.", "en": "This modern coat appeals to me very much."},
        {"de": "Die blaue Farbe steht dir ausgezeichnet.", "en": "The blue color suits you excellently."},
        {"de": "Er hat einen sehr guten modischen Geschmack.", "en": "He has very good fashionable taste."},
        {"de": "Gefällt dir dieses elegante schwarze Kleid?", "en": "Do you like this elegant black dress?"},
        {"de": "Die Schuhe sind nicht nur schön, sondern auch bequem.", "en": "The shoes are not only pretty, but also comfy."},
        {"de": "Der klassische Stil passt perfekt zu dieser Veranstaltung.", "en": "The classic style fits this event perfectly."},
        {"partner": "Freundin", "prompt": "Wie findest du meine neue Jacke?", "translation": "How do you find my new jacket?", "options": ["Sie sieht absolut fantastisch aus und steht dir!", "Ich trinke Kaffee."]},
        {"partner": "Freundin", "prompt": "Ist der Schnitt nicht zu weit?", "translation": "Isn't the cut too loose?", "options": ["Nein, das ist jetzt genau der moderne Stil.", "Auf Wiedersehen."]},
        {"prompt": "Type the German verb for 'to please / like':", "target": "gefallen", "hint": "Hint: 8 letters starting with g"},
        {"prompt": "Type the German word for 'elegant':", "target": "elegant", "hint": "Hint: stylish and sophisticated"},
        {"prompt": "Die rote Jacke _______ mir wirklich sehr.", "en": "The red jacket appeals to me really very much.", "options": ["gefällt", "passt", "steht"], "answer": "gefällt"},
        {"prompt": "Das Kleid hat einen sehr modernen _______.", "en": "The dress has a very modern style.", "options": ["Stil", "Geschmack", "Schnitt"], "answer": "Stil"}
    ))

    # Unit 83: Dativ-Pronomen
    units.append(make_unit(
        83, 3, "Dativ-Pronomen", "Master dative pronouns", "#00CD9C",
        [{"de": "mir", "en": "to me (dat)"}, {"de": "dir", "en": "to you (dat sing)"}, {"de": "ihm", "en": "to him / it (dat)"}, {"de": "ihr", "en": "to her (dat)"}],
        [{"de": "uns", "en": "to us (dat)"}, {"de": "euch", "en": "to you all (dat pl)"}, {"de": "ihnen", "en": "to them (dat)"}, {"de": "wem", "en": "to whom (dat)"}],
        [{"de": "helfen", "en": "to help"}, {"de": "schmecken", "en": "to taste good to"}, {"de": "passen", "en": "to suit / fit"}, {"de": "gehören", "en": "to belong to"}],
        [{"de": "danken", "en": "to thank"}, {"de": "antworten", "en": "to answer"}, {"de": "Wie geht es", "en": "How goes it"}, {"de": "leid tun", "en": "to be sorry to"}],
        {"de": "Wie geht es dir heute?", "en": "How are you doing today?"},
        {"de": "Mir geht es sehr gut, danke!", "en": "I am doing very well, thank you!"},
        {"de": "Das Hemd passt ihm leider nicht.", "en": "The shirt unfortunately does not fit him."},
        {"de": "Kann ich Ihnen bei der Suche helfen?", "en": "Can I help you with the search?"},
        {"de": "Schmeckt euch das Essen im Restaurant?", "en": "Does the food in the restaurant taste good to you guys?"},
        {"de": "Ich antworte ihr gleich auf ihre wichtige Frage.", "en": "I answer her immediately to her important question."},
        {"partner": "Kollege", "prompt": "Wie geht es Ihnen heute Morgen?", "translation": "How are you doing this morning?", "options": ["Mir geht es hervorragend, vielen Dank!", "Ich esse Brot."]},
        {"partner": "Kollege", "prompt": "Gefällt dir dein neues Büro?", "translation": "Do you like your new office?", "options": ["Ja, es gefällt mir wirklich sehr gut.", "Gute Nacht."]},
        {"prompt": "Type the German dative pronoun for 'to me':", "target": "mir", "hint": "Hint: 3 letters starting with m"},
        {"prompt": "Type the German dative pronoun for 'to you' (informal):", "target": "dir", "hint": "Hint: 3 letters starting with d"},
        {"prompt": "Wie geht es _______ heute?", "en": "How are you doing today?", "options": ["dir", "dich", "du"], "answer": "dir"},
        {"prompt": "_______ geht es sehr gut, danke!", "en": "I am doing very well, thank you!", "options": ["Mir", "Mich", "Ich"], "answer": "Mir"}
    ))

    # Unit 84: Vergleiche ziehen
    units.append(make_unit(
        84, 3, "Vergleiche ziehen", "Comparative adjectives", "#FFC800",
        [{"de": "besser", "en": "better"}, {"de": "schneller", "en": "faster"}, {"de": "billiger", "en": "cheaper"}, {"de": "teurer", "en": "more expensive"}],
        [{"de": "größer", "en": "bigger / taller"}, {"de": "kleiner", "en": "smaller"}, {"de": "älter", "en": "older"}, {"de": "jünger", "en": "younger"}],
        [{"de": "als", "en": "than"}, {"de": "wie", "en": "as"}, {"de": "genauso", "en": "just as"}, {"de": "Vergleich", "en": "comparison"}],
        [{"de": "mehr", "en": "more"}, {"de": "weniger", "en": "less"}, {"de": "am besten", "en": "best of all"}, {"de": "Unterschied", "en": "difference"}],
        {"de": "Der Zug ist schneller als der Bus.", "en": "The train is faster than the bus."},
        {"de": "Dieses Buch ist billiger als jenes.", "en": "This book is cheaper than that one."},
        {"de": "Mein Bruder ist zwei Jahre älter als ich.", "en": "My brother is two years older than me."},
        {"de": "Welches Restaurant findest du besser?", "en": "Which restaurant do you find better?"},
        {"de": "Berlin ist viel größer als Frankfurt.", "en": "Berlin is much bigger than Frankfurt."},
        {"de": "Er spricht genauso gut Deutsch wie Englisch.", "en": "He speaks German just as well as English."},
        {"partner": "Freund", "prompt": "Fährst du lieber mit dem Zug oder mit dem Bus?", "translation": "Do you prefer traveling by train or bus?", "options": ["Mit dem Zug, er ist viel schneller als der Bus.", "Ich trinke Tee."]},
        {"partner": "Freund", "prompt": "Ist deine Wohnung größer als meine?", "translation": "Is your apartment bigger than mine?", "options": ["Nein, sie ist genauso groß wie deine.", "Auf Wiedersehen."]},
        {"prompt": "Type the German comparative for 'better' (gut):", "target": "besser", "hint": "Hint: 6 letters starting with b"},
        {"prompt": "Type the German comparative for 'faster' (schnell):", "target": "schneller", "hint": "Hint: comparative of schnell"},
        {"prompt": "Der Zug ist schneller _______ der Bus.", "en": "The train is faster than the bus.", "options": ["als", "wie", "so"], "answer": "als"},
        {"prompt": "Mein Bruder ist zwei Jahre _______ als ich.", "en": "My brother is two years older than me.", "options": ["älter", "alt", "am ältesten"], "answer": "älter"}
    ))

    # Unit 85: Ausreden & Entschuldigungen
    units.append(make_unit(
        85, 3, "Ausreden & Entschuldigungen", "Polite excuses", "#1CB0F6",
        [{"de": "Verspätung", "en": "delay"}, {"de": "Stau", "en": "traffic jam"}, {"de": "verpasst", "en": "missed"}, {"de": "verzeihen", "en": "to forgive / pardon"}],
        [{"de": "tut mir leid", "en": "I am sorry"}, {"de": "vergessen", "en": "forgotten"}, {"de": "Wecker", "en": "alarm clock"}, {"de": "Panne", "en": "breakdown"}],
        [{"de": "Entschuldigung", "en": "apology / excuse me"}, {"de": "Missverständnis", "en": "misunderstanding"}, {"de": "Problem", "en": "problem"}, {"de": "Schuld", "en": "fault / guilt"}],
        [{"de": "nächstes Mal", "en": "next time"}, {"de": "pünktlich", "en": "punctual"}, {"de": "Verzeihung", "en": "pardon"}, {"de": "Entschuldige", "en": "excuse (informal)"}],
        {"de": "Entschuldigung für meine späte Verspätung.", "en": "Excuse me for my late delay."},
        {"de": "Es tut mir leid, ich stand im Stau.", "en": "I am sorry, I was stuck in traffic."},
        {"de": "Ich habe leider den Bus verpasst.", "en": "Unfortunately I missed the bus."},
        {"de": "Warum bist du heute zu spät gekommen?", "en": "Why did you arrive too late today?"},
        {"de": "Mein Wecker hat heute früh nicht geklingelt.", "en": "My alarm clock did not ring this morning."},
        {"de": "Bitte verzeihen Sie, es war ein Missverständnis.", "en": "Please forgive me, it was a misunderstanding."},
        {"partner": "Chef", "prompt": "Warum kommen Sie erst jetzt ins Büro?", "translation": "Why are you only coming into the office now?", "options": ["Es tut mir leid, die S-Bahn hatte eine Panne.", "Ich esse einen Apfel."]},
        {"partner": "Chef", "prompt": "Bitte seien Sie morgen pünktlich.", "translation": "Please be punctual tomorrow.", "options": ["Ja natürlich, das wird nicht wieder vorkommen.", "Danke sehr."]},
        {"prompt": "Type the German word for 'traffic jam':", "target": "Stau", "hint": "Hint: 4 letters starting with S"},
        {"prompt": "Type the German word for 'alarm clock':", "target": "Wecker", "hint": "Hint: morning waking device"},
        {"prompt": "Es _______ mir leid, dass ich zu spät bin.", "en": "I am sorry that I am late.", "options": ["tut", "macht", "hat"], "answer": "tut"},
        {"prompt": "Ich stand eine halbe Stunde im _______.", "en": "I stood in a traffic jam for half an hour.", "options": ["Stau", "Wecker", "Schuld"], "answer": "Stau"}
    ))

    # Unit 86: Um Hilfe bitten
    units.append(make_unit(
        86, 3, "Um Hilfe bitten", "Ask for assistance", "#58CC02",
        [{"de": "könnten Sie", "en": "could you (polite)"}, {"de": "helfen", "en": "to help"}, {"de": "Gefallen", "en": "favor"}, {"de": "Unterstützung", "en": "assistance / support"}],
        [{"de": "Frage", "en": "question"}, {"de": "Problem", "en": "problem"}, {"de": "höflich", "en": "polite"}, {"de": "bitten", "en": "to ask / request"}],
        [{"de": "erklären", "en": "to explain"}, {"de": "zeigen", "en": "to show"}, {"de": "tragen", "en": "to carry"}, {"de": "leihen", "en": "to lend"}],
        [{"de": "wiederholen", "en": "to repeat"}, {"de": "dringend", "en": "urgently"}, {"de": "gern", "en": "gladly"}, {"de": "Moment", "en": "moment"}],
        {"de": "Könnten Sie mir bitte kurz helfen?", "en": "Could you please help me briefly?"},
        {"de": "Ich habe eine dringende Frage zur Aufgabe.", "en": "I have an urgent question about the task."},
        {"de": "Können Sie mir bitte den Koffer tragen helfen?", "en": "Can you please help me carry the suitcase?"},
        {"de": "Darf ich Sie um einen kleinen Gefallen bitten?", "en": "May I ask you for a small favor?"},
        {"de": "Könnten Sie das bitte noch einmal wiederholen?", "en": "Could you please repeat that once more?"},
        {"de": "Vielen Dank für Ihre großartige Unterstützung!", "en": "Many thanks for your great support!"},
        {"partner": "Passant", "prompt": "Entschuldigung, könnten Sie mir kurz helfen?", "translation": "Excuse me, could you briefly help me?", "options": ["Ja natürlich, was kann ich für Sie tun?", "Ich habe zwei Schwestern."]},
        {"partner": "Passant", "prompt": "Können Sie mir zeigen, wo der Bahnhof ist?", "translation": "Can you show me where the station is?", "options": ["Gerne, gehen Sie einfach diese Straße geradeaus.", "Gute Nacht."]},
        {"prompt": "Type the German polite phrase for 'could you':", "target": "könnten Sie", "hint": "Hint: subjunctive modal with Umlaut ö"},
        {"prompt": "Type the German word for 'favor':", "target": "Gefallen", "hint": "Hint: 8 letters starting with G"},
        {"prompt": "_______ Sie mir bitte kurz helfen?", "en": "Could you please help me briefly?", "options": ["Könnten", "Wollen", "Müssen"], "answer": "Könnten"},
        {"prompt": "Darf ich Sie um einen _______ bitten?", "en": "May I ask you for a favor?", "options": ["Gefallen", "Frage", "Problem"], "answer": "Gefallen"}
    ))

    # Unit 87: Wo oder Wohin?
    units.append(make_unit(
        87, 3, "Wo oder Wohin?", "Location vs motion", "#FF9600",
        [{"de": "stellen", "en": "to put upright (motion)"}, {"de": "stehen", "en": "to stand (location)"}, {"de": "legen", "en": "to lay flat (motion)"}, {"de": "liegen", "en": "to lie flat (location)"}],
        [{"de": "hängen", "en": "to hang"}, {"de": "an", "en": "at / on (vertical)"}, {"de": "auf", "en": "on (horizontal)"}, {"de": "in", "en": "in / into"}],
        [{"de": "unter", "en": "under"}, {"de": "über", "en": "over / above"}, {"de": "vor", "en": "in front of"}, {"de": "hinter", "en": "behind"}],
        [{"de": "neben", "en": "next to"}, {"de": "zwischen", "en": "between"}, {"de": "Wo", "en": "Where (dative)"}, {"de": "Wohin", "en": "Where to (accusative)"}],
        {"de": "Ich stelle die Vase auf den Tisch.", "en": "I put the vase on the table."},
        {"de": "Die Vase steht jetzt auf dem Tisch.", "en": "The vase is now standing on the table."},
        {"de": "Ich lege das Buch auf das Bett.", "en": "I lay the book on the bed."},
        {"de": "Wohin hast du meine Brille gelegt?", "en": "Where did you put my glasses?"},
        {"de": "Das Bild hängt an der weißen Wand.", "en": "The picture hangs on the white wall."},
        {"de": "Die Katze schläft gemütlich unter dem Stuhl.", "en": "The cat sleeps cozily under the chair."},
        {"partner": "Mitbewohner", "prompt": "Wohin soll ich die Lampe stellen?", "translation": "Where should I put the lamp?", "options": ["Stell sie bitte neben den Schreibtisch.", "Ich bin 20 Jahre alt."]},
        {"partner": "Mitbewohner", "prompt": "Wo liegt mein Schlüssel?", "translation": "Where is my key lying?", "options": ["Er liegt dort auf dem Küchentisch.", "Danke schön!"]},
        {"prompt": "Type the German verb for 'to place upright' (action):", "target": "stellen", "hint": "Hint: accusative motion verb"},
        {"prompt": "Type the German verb for 'to stand' (position):", "target": "stehen", "hint": "Hint: dative location verb"},
        {"prompt": "Ich stelle die Vase auf _______ Tisch.", "en": "I put the vase on the table.", "options": ["den", "dem", "der"], "answer": "den"},
        {"prompt": "Die Vase steht auf _______ Tisch.", "en": "The vase stands on the table.", "options": ["dem", "den", "das"], "answer": "dem"}
    ))

    # Unit 88: In den Urlaub fahren
    units.append(make_unit(
        88, 3, "In den Urlaub fahren", "Travel destinations", "#CE82FF",
        [{"de": "Meer", "en": "sea / ocean"}, {"de": "Berge", "en": "mountains"}, {"de": "Strand", "en": "beach"}, {"de": "See", "en": "lake"}],
        [{"de": "Wald", "en": "forest"}, {"de": "Italien", "en": "Italy"}, {"de": "Spanien", "en": "Spain"}, {"de": "reisen", "en": "to travel"}],
        [{"de": "Ferien", "en": "vacation / holidays"}, {"de": "buchen", "en": "to book / reserve"}, {"de": "Hotel", "en": "hotel"}, {"de": "wandern", "en": "to hike"}],
        [{"de": "baden", "en": "to swim / bathe"}, {"de": "Erholung", "en": "relaxation"}, {"de": "Abenteuer", "en": "adventure"}, {"de": "Urlaub", "en": "vacation"}],
        {"de": "Wir fahren im Sommer ans Meer.", "en": "We are going to the sea in the summer."},
        {"de": "Im Winter fahre ich gerne in die Berge.", "en": "In winter I like going to the mountains."},
        {"de": "Ich habe ein schönes Hotel am Strand gebucht.", "en": "I booked a nice hotel on the beach."},
        {"de": "Wohin fährst du dieses Jahr in den Urlaub?", "en": "Where are you going on vacation this year?"},
        {"de": "In den Ferien wandern wir durch den grünen Wald.", "en": "During vacation we hike through the green forest."},
        {"de": "Zwei Wochen Erholung in Italien tun wirklich gut.", "en": "Two weeks of relaxation in Italy do really good."},
        {"partner": "Kollege", "prompt": "Wohin fährst du im Sommer in den Urlaub?", "translation": "Where are you going on vacation in summer?", "options": ["Ich fahre mit meiner Familie nach Italien ans Meer.", "Ich habe Durst."]},
        {"partner": "Kollege", "prompt": "Hast du den Flug und das Hotel schon gebucht?", "translation": "Have you already booked flight and hotel?", "options": ["Ja, alles ist schon fertig reserviert.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'sea / ocean':", "target": "Meer", "hint": "Hint: 4 letters starting with M"},
        {"prompt": "Type the German word for 'beach':", "target": "Strand", "hint": "Hint: sandy coastal shore"},
        {"prompt": "Wir fahren im Sommer an das _______.", "en": "We travel to the sea in the summer.", "options": ["Meer", "Berge", "Wald"], "answer": "Meer"},
        {"prompt": "Ich habe ein Hotel am _______ gebucht.", "en": "I booked a hotel on the beach.", "options": ["Strand", "Ferien", "Erholung"], "answer": "Strand"}
    ))

    # Unit 89: Beim Arzt: Der Termin
    units.append(make_unit(
        89, 3, "Beim Arzt: Der Termin", "Doctor's appointment", "#FF4B4B",
        [{"de": "Arzt", "en": "doctor"}, {"de": "Praxis", "en": "doctor's practice"}, {"de": "Rezept", "en": "prescription"}, {"de": "Schmerzen", "en": "pains / aches"}],
        [{"de": "Fieber", "en": "fever"}, {"de": "Grippe", "en": "flu / influenza"}, {"de": "Erkältung", "en": "cold (illness)"}, {"de": "Husten", "en": "cough"}],
        [{"de": "Hals", "en": "throat / neck"}, {"de": "Kopfschmerz", "en": "headache"}, {"de": "untersuchen", "en": "to examine"}, {"de": "ausruhen", "en": "to rest"}],
        [{"de": "Krankmeldung", "en": "sick note"}, {"de": "Wartezimmer", "en": "waiting room"}, {"de": "krank", "en": "sick"}, {"de": "Bett", "en": "bed"}],
        {"de": "Ich habe starke Halsschmerzen und Fieber.", "en": "I have severe throat pain and fever."},
        {"de": "Der Arzt untersucht den Patienten gründlich.", "en": "The doctor examines the patient thoroughly."},
        {"de": "Sie müssen drei Tage im Bett bleiben und sich ausruhen.", "en": "You must stay in bed for three days and rest."},
        {"de": "Haben Sie heute noch einen freien Termin beim Arzt?", "en": "Do you still have an open appointment at the doctor's today?"},
        {"de": "Der Arzt gibt mir ein Rezept für die Apotheke.", "en": "The doctor gives me a prescription for the pharmacy."},
        {"de": "Bitte nehmen Sie kurz im Wartezimmer Platz.", "en": "Please take a seat briefly in the waiting room."},
        {"partner": "Arzthelferin", "prompt": "Guten Tag, was fehlt Ihnen denn?", "translation": "Good day, what is ailing you?", "options": ["Ich habe seit gestern hohes Fieber und Husten.", "Ich trinke Orangensaft."]},
        {"partner": "Arzthelferin", "prompt": "Haben Sie Ihre Krankenversicherungskarte dabei?", "translation": "Do you have your health insurance card with you?", "options": ["Ja, hier ist meine Versichertenkarte.", "Danke schön!"]},
        {"prompt": "Type the German word for 'doctor' (male):", "target": "Arzt", "hint": "Hint: 4 letters starting with A"},
        {"prompt": "Type the German word for 'prescription':", "target": "Rezept", "hint": "Hint: pharmacy slip noun"},
        {"prompt": "Der Arzt gibt mir ein _______ für Tabletten.", "en": "The doctor gives me a prescription for pills.", "options": ["Rezept", "Fieber", "Praxis"], "answer": "Rezept"},
        {"prompt": "Bitte nehmen Sie im _______ Platz.", "en": "Please take a seat in the waiting room.", "options": ["Wartezimmer", "Hals", "Husten"], "answer": "Wartezimmer"}
    ))

    # Unit 90: Medikamente & Apotheke
    units.append(make_unit(
        90, 3, "Medikamente & Apotheke", "At the pharmacy", "#00CD9C",
        [{"de": "Apotheke", "en": "pharmacy"}, {"de": "Medikament", "en": "medication"}, {"de": "Tablette", "en": "tablet / pill"}, {"de": "Tropfen", "en": "drops"}],
        [{"de": "Salbe", "en": "ointment / cream"}, {"de": "Pflaster", "en": "band-aid / plaster"}, {"de": "Apotheker", "en": "pharmacist"}, {"de": "Packung", "en": "pack / box"}],
        [{"de": "einnehmen", "en": "to take (medicine)"}, {"de": "dreimal täglich", "en": "three times daily"}, {"de": "Schmerzmittel", "en": "painkiller"}, {"de": "Nebenwirkung", "en": "side effect"}],
        [{"de": "Besserung", "en": "recovery / improvement"}, {"de": "Wasser", "en": "water"}, {"de": "Magen", "en": "stomach"}, {"de": "gesund", "en": "healthy"}],
        {"de": "Ich hole das Medikament aus der Apotheke.", "en": "I pick up the medication from the pharmacy."},
        {"de": "Nehmen Sie die Tabletten dreimal täglich mit Wasser ein.", "en": "Take the tablets three times daily with water."},
        {"de": "Haben Sie ein gutes Mittel gegen Halsschmerzen?", "en": "Do you have a good remedy against throat pain?"},
        {"de": "Wie oft muss ich diese Tropfen einnehmen?", "en": "How often do I have to take these drops?"},
        {"de": "Bitte lesen Sie die Packungsbeilage wegen möglicher Nebenwirkungen.", "en": "Please read the leaflet regarding possible side effects."},
        {"de": "Gute Besserung und werden Sie schnell wieder gesund!", "en": "Get well soon and become healthy again quickly!"},
        {"partner": "Apotheker", "prompt": "Guten Tag, wie kann ich Ihnen helfen?", "translation": "Good day, how can I help you?", "options": ["Ich habe hier ein Rezept vom Arzt.", "Ich heiße David."]},
        {"partner": "Apotheker", "prompt": "Nehmen Sie diese Tablette immer nach dem Essen.", "translation": "Always take this pill after meals.", "options": ["Vielen Dank für die gute Beratung!", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'pharmacy':", "target": "Apotheke", "hint": "Hint: medicine dispensary"},
        {"prompt": "Type the German word for 'pill / tablet':", "target": "Tablette", "hint": "Hint: solid oral medicine"},
        {"prompt": "Ich hole die Salbe aus der _______.", "en": "I fetch the ointment from the pharmacy.", "options": ["Apotheke", "Packung", "Tropfen"], "answer": "Apotheke"},
        {"prompt": "Nehmen Sie die Tropfen dreimal _______ ein.", "en": "Take the drops three times daily.", "options": ["täglich", "Schmerzmittel", "Wasser"], "answer": "täglich"}
    ))

    # Unit 91: Kulturelle Ereignisse
    units.append(make_unit(
        91, 3, "Kulturelle Ereignisse", "Theater and concerts", "#FFC800",
        [{"de": "Konzert", "en": "concert"}, {"de": "Theater", "en": "theater"}, {"de": "Museum", "en": "museum"}, {"de": "Oper", "en": "opera"}],
        [{"de": "Ausstellung", "en": "exhibition"}, {"de": "Kunst", "en": "art"}, {"de": "Eintrittskarte", "en": "admission ticket"}, {"de": "Bühne", "en": "stage"}],
        [{"de": "Schauspieler", "en": "actor"}, {"de": "Kultur", "en": "culture"}, {"de": "applaudieren", "en": "to applaud"}, {"de": "begeistert", "en": "enthusiastic"}],
        [{"de": "Beginn", "en": "start / beginning"}, {"de": "Programm", "en": "program"}, {"de": "Besuch", "en": "visit"}, {"de": "berühmt", "en": "famous"}],
        {"de": "Wir gehen heute Abend ins Theater.", "en": "We are going to the theater tonight."},
        {"de": "Die neue Kunstausstellung im Museum ist beeindruckend.", "en": "The new art exhibition in the museum is impressive."},
        {"de": "Der berühmte Schauspieler steht auf der Bühne.", "en": "The famous actor stands on the stage."},
        {"de": "Um wie viel Uhr beginnt die Oper heute?", "en": "At what time does the opera begin today?"},
        {"de": "Das Publikum applaudiert begeistert nach der Vorstellung.", "en": "The audience applauds enthusiastically after the performance."},
        {"de": "Ich habe zwei Eintrittskarten für das klassische Konzert gekauft.", "en": "I bought two admission tickets for the classical concert."},
        {"partner": "Freund", "prompt": "Möchtest du am Sonntag ins Museum mitkommen?", "translation": "Would you like to come along to the museum on Sunday?", "options": ["Sehr gerne, die moderne Kunst interessiert mich!", "Ich trinke Kaffee."]},
        {"partner": "Freund", "prompt": "Wie teuer sind die Eintrittskarten?", "translation": "How expensive are the admission tickets?", "options": ["Zehn Euro für Erwachsene.", "Danke sehr."]},
        {"prompt": "Type the German word for 'theater':", "target": "Theater", "hint": "Hint: stage play venue"},
        {"prompt": "Type the German word for 'art':", "target": "Kunst", "hint": "Hint: 5 letters starting with K"},
        {"prompt": "Wir gehen heute Abend ins _______.", "en": "We are going to the theater tonight.", "options": ["Theater", "Bühne", "Kunst"], "answer": "Theater"},
        {"prompt": "Die Schauspieler stehen auf der _______.", "en": "The actors stand on the stage.", "options": ["Bühne", "Oper", "Kultur"], "answer": "Bühne"}
    ))

    # Unit 92: Im Hotel: Reklamation
    units.append(make_unit(
        92, 3, "Im Hotel: Reklamation", "Hotel room issue", "#1CB0F6",
        [{"de": "Zimmer", "en": "room"}, {"de": "Hotel", "en": "hotel"}, {"de": "Rezeption", "en": "reception desk"}, {"de": "Reklamation", "en": "complaint / claim"}],
        [{"de": "Schlüssel", "en": "key"}, {"de": "Dusche", "en": "shower"}, {"de": "kaputt", "en": "broken"}, {"de": "schmutzig", "en": "dirty"}],
        [{"de": "Lärm", "en": "noise"}, {"de": "reparieren", "en": "to repair"}, {"de": "wechseln", "en": "to change / switch"}, {"de": "Gast", "en": "guest"}],
        [{"de": "warmes Wasser", "en": "hot water"}, {"de": "Handtuch", "en": "towel"}, {"de": "Heizung", "en": "heating"}, {"de": "funktionieren", "en": "to work / function"}],
        {"de": "In meinem Zimmer funktioniert die Dusche nicht.", "en": "In my room the shower does not work."},
        {"de": "Es gibt leider kein warmes Wasser im Bad.", "en": "Unfortunately there is no hot water in the bathroom."},
        {"de": "Ich möchte bitte sofort das Zimmer wechseln.", "en": "I would like to change rooms immediately please."},
        {"de": "Können Sie bitte jemanden schicken, der die Heizung repariert?", "en": "Could you please send someone who repairs the heating?"},
        {"de": "Der Lärm von der Straße ist nachts viel zu laut.", "en": "The noise from the street is way too loud at night."},
        {"de": "Die Rezeption entschuldigt sich höflich für die Unannehmlichkeit.", "en": "The reception politely apologizes for the inconvenience."},
        {"partner": "Rezeptionist", "prompt": "Guten Tag, was kann ich für Sie tun?", "translation": "Good day, what can I do for you?", "options": ["In meinem Zimmer ist die Heizung kaputt.", "Ich mag Äpfel."]},
        {"partner": "Rezeptionist", "prompt": "Wir geben Ihnen sofort ein anderes ruhiges Zimmer.", "translation": "We give you another quiet room right away.", "options": ["Vielen Dank für Ihre schnelle Hilfe!", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'reception desk':", "target": "Rezeption", "hint": "Hint: front desk noun"},
        {"prompt": "Type the German word for 'broken':", "target": "kaputt", "hint": "Hint: not working"},
        {"prompt": "In meinem Zimmer ist die Dusche _______.", "en": "In my room the shower is broken.", "options": ["kaputt", "Lärm", "Rezeption"], "answer": "kaputt"},
        {"prompt": "Ich möchte bitte das Zimmer _______.", "en": "I would like to change the room please.", "options": ["wechseln", "reparieren", "funktionieren"], "answer": "wechseln"}
    ))

    # Unit 93: Vergangenheit: Haben
    units.append(make_unit(
        93, 3, "Vergangenheit: Haben", "Past Perfekt with haben", "#58CC02",
        [{"de": "gelernt", "en": "learned"}, {"de": "gemacht", "en": "done / made"}, {"de": "gesagt", "en": "said"}, {"de": "bezahlt", "en": "paid"}],
        [{"de": "gekauft", "en": "bought"}, {"de": "studiert", "en": "studied"}, {"de": "gefragt", "en": "asked"}, {"de": "gelebt", "en": "lived"}],
        [{"de": "geschlafen", "en": "slept"}, {"de": "gegessen", "en": "eaten"}, {"de": "getrunken", "en": "drunk"}, {"de": "gelesen", "en": "read"}],
        [{"de": "geschrieben", "en": "written"}, {"de": "gehört", "en": "heard"}, {"de": "gesucht", "en": "searched"}, {"de": "gefunden", "en": "found"}],
        {"de": "Ich habe fleißig Deutsch gelernt.", "en": "I learned German diligently."},
        {"de": "Wir haben die Rechnung im Restaurant bezahlt.", "en": "We paid the bill in the restaurant."},
        {"de": "Er hat gestern lange und fest geschlafen.", "en": "He slept long and soundly yesterday."},
        {"de": "Was hast du gestern den ganzen Tag gemacht?", "en": "What did you do all day yesterday?"},
        {"de": "Ich habe meinen verlorenen Schlüssel wieder gefunden.", "en": "I found my lost key again."},
        {"de": "Sie haben viele interessante Bücher auf Deutsch gelesen.", "en": "They read many interesting books in German."},
        {"partner": "Freund", "prompt": "Was hast du gestern Schönes gemacht?", "translation": "What nice thing did you do yesterday?", "options": ["Ich habe mit Freunden gekocht und Musik gehört.", "Ich bin 25 Jahre alt."]},
        {"partner": "Freund", "prompt": "Hast du für deine Prüfung gelernt?", "translation": "Did you study for your exam?", "options": ["Ja, ich habe den ganzen Nachmittag gelernt.", "Gute Nacht."]},
        {"prompt": "Type the German past participle for 'learned':", "target": "gelernt", "hint": "Hint: ge- + lern + -t"},
        {"prompt": "Type the German past participle for 'paid':", "target": "bezahlt", "hint": "Hint: be- + zahl + -t"},
        {"prompt": "Ich habe die Rechnung im Hotel _______.", "en": "I paid the bill in the hotel.", "options": ["bezahlt", "gelernt", "gemacht"], "answer": "bezahlt"},
        {"prompt": "Wir haben fleißig Grammatik _______.", "en": "We diligently practiced grammar.", "options": ["gelernt", "studiert", "gehört"], "answer": "gelernt"}
    ))

    # Unit 94: Vergangenheit: Sein
    units.append(make_unit(
        94, 3, "Vergangenheit: Sein", "Past Perfekt with sein", "#FF9600",
        [{"de": "gefahren", "en": "driven / traveled"}, {"de": "gegangen", "en": "walked / gone"}, {"de": "gekommen", "en": "come / arrived"}, {"de": "aufgewacht", "en": "woken up"}],
        [{"de": "geflogen", "en": "flown"}, {"de": "geblieben", "en": "stayed / remained"}, {"de": "gewesen", "en": "been"}, {"de": "gelaufen", "en": "run"}],
        [{"de": "geschwommen", "en": "swum"}, {"de": "gewandert", "en": "hiked"}, {"de": "eingestiegen", "en": "boarded"}, {"de": "ausgestiegen", "en": "alighted / got off"}],
        [{"de": "aufgestanden", "en": "gotten up"}, {"de": "passiert", "en": "happened"}, {"de": "Bewegung", "en": "movement / motion"}, {"de": "Zustand", "en": "state / condition"}],
        {"de": "Ich bin mit dem Zug nach Berlin gefahren.", "en": "I traveled to Berlin by train."},
        {"de": "Wir sind gestern früh ins Bett gegangen.", "en": "We went to bed early yesterday."},
        {"de": "Er ist am Wochenende zu Hause geblieben.", "en": "He stayed at home on the weekend."},
        {"de": "Wann bist du heute Morgen aufgestanden?", "en": "When did you get up this morning?"},
        {"de": "Sie sind im Urlaub durch die Alpen gewandert.", "en": "They hiked through the Alps on vacation."},
        {"de": "Ich bin pünktlich an der Haltestelle ausgestiegen.", "en": "I got off at the stop on time."},
        {"partner": "Kollegin", "prompt": "Wie bist du heute zur Arbeit gekommen?", "translation": "How did you come to work today?", "options": ["Ich bin mit dem Fahrrad gefahren.", "Ich esse einen Apfel."]},
        {"partner": "Kollegin", "prompt": "Wann bist du heute Morgen aufgewacht?", "translation": "When did you wake up this morning?", "options": ["Ich bin um sechs Uhr aufgewacht.", "Danke schön!"]},
        {"prompt": "Type the German past participle for 'driven / traveled' (fahren):", "target": "gefahren", "hint": "Hint: uses auxiliary verb sein"},
        {"prompt": "Type the German past participle for 'stayed' (bleiben):", "target": "geblieben", "hint": "Hint: uses auxiliary verb sein"},
        {"prompt": "Ich _______ mit dem Zug nach Hamburg gefahren.", "en": "I traveled to Hamburg by train.", "options": ["bin", "habe", "war"], "answer": "bin"},
        {"prompt": "Wir sind am Wochenende zu Hause _______.", "en": "We stayed at home on the weekend.", "options": ["geblieben", "gefahren", "gegangen"], "answer": "geblieben"}
    ))

    # Unit 95: Mein letzter Urlaub
    units.append(make_unit(
        95, 3, "Mein letzter Urlaub", "Describe your vacation", "#CE82FF",
        [{"de": "gewandert", "en": "hiked"}, {"de": "geflogen", "en": "flown"}, {"de": "besichtigt", "en": "visited / toured (sights)"}, {"de": "Urlaub", "en": "vacation"}],
        [{"de": "Strand", "en": "beach"}, {"de": "fantastisch", "en": "fantastic"}, {"de": "Sommer", "en": "summer"}, {"de": "Hotel", "en": "hotel"}],
        [{"de": "Meer", "en": "sea"}, {"de": "sonnig", "en": "sunny"}, {"de": "erholt", "en": "recovered / relaxed"}, {"de": "Fotos", "en": "photos"}],
        [{"de": "Reise", "en": "journey"}, {"de": "erlebt", "en": "experienced"}, {"de": "Rückkehr", "en": "return"}, {"de": "unvergesslich", "en": "unforgettable"}],
        {"de": "Mein letzter Urlaub war absolut fantastisch.", "en": "My last vacation was absolutely fantastic."},
        {"de": "Wir sind nach Spanien an den Strand geflogen.", "en": "We flew to Spain to the beach."},
        {"de": "Ich habe viele historische Sehenswürdigkeiten besichtigt.", "en": "I toured many historical sights."},
        {"de": "Was hast du in deinem letzten Urlaub erlebt?", "en": "What did you experience on your last vacation?"},
        {"de": "Wir haben wunderbare Fotos am Meer gemacht.", "en": "We took wonderful photos by the sea."},
        {"de": "Ich habe mich zwei Wochen lang herrlich erholt.", "en": "I relaxed wonderfully for two weeks."},
        {"partner": "Freund", "prompt": "Wie war dein Urlaub in den Bergen?", "translation": "How was your vacation in the mountains?", "options": ["Es war toll, wir sind jeden Tag gewandert!", "Ich trinke Kaffee."]},
        {"partner": "Freund", "prompt": "Hast du viele schöne Fotos gemacht?", "translation": "Did you take many nice photos?", "options": ["Ja, die Natur war einfach atemberaubend.", "Auf Wiedersehen."]},
        {"prompt": "Type the German past participle for 'hiked':", "target": "gewandert", "hint": "Hint: ge- + wander + -t"},
        {"prompt": "Type the German word for 'vacation':", "target": "Urlaub", "hint": "Hint: 6 letters starting with U"},
        {"prompt": "Wir sind nach Italien _______.", "en": "We flew to Italy.", "options": ["geflogen", "besichtigt", "gewandert"], "answer": "geflogen"},
        {"prompt": "Mein letzter Urlaub war wirklich _______.", "en": "My last vacation was really fantastic.", "options": ["fantastisch", "Strand", "Hotel"], "answer": "fantastisch"}
    ))

    # Unit 96: Formulare ausfüllen
    units.append(make_unit(
        96, 3, "Formulare ausfüllen", "Official forms", "#FF4B4B",
        [{"de": "Unterschrift", "en": "signature"}, {"de": "Formular", "en": "form"}, {"de": "ausfüllen", "en": "to fill out"}, {"de": "Geburtsdatum", "en": "date of birth"}],
        [{"de": "Geburtsort", "en": "place of birth"}, {"de": "Staatsangehörigkeit", "en": "nationality / citizenship"}, {"de": "Adresse", "en": "address"}, {"de": "Familienstand", "en": "marital status"}],
        [{"de": "ledig", "en": "single (unmarried)"}, {"de": "verheiratet", "en": "married"}, {"de": "Passnummer", "en": "passport number"}, {"de": "Datum", "en": "date"}],
        [{"de": "Angabe", "en": "statement / specification"}, {"de": "Behörde", "en": "official authority"}, {"de": "Postleitzahl", "en": "postal code"}, {"de": "unterschreiben", "en": "to sign"}],
        {"de": "Bitte füllen Sie das Formular vollständig aus.", "en": "Please fill out the form completely."},
        {"de": "Hier unten fehlt noch Ihre persönliche Unterschrift.", "en": "Down here your personal signature is still missing."},
        {"de": "Mein Familienstand ist ledig und ich lebe allein.", "en": "My marital status is single and I live alone."},
        {"de": "Welche Staatsangehörigkeit müssen Sie hier angeben?", "en": "Which nationality must you indicate here?"},
        {"de": "Tragen Sie bitte Ihr Geburtsdatum und den Geburtsort ein.", "en": "Please enter your date of birth and birthplace."},
        {"de": "Überprüfen Sie alle Angaben vor der Abgabe gründlich.", "en": "Check all information thoroughly before submission."},
        {"partner": "Beamter", "prompt": "Haben Sie das Antragsformular ausgefüllt?", "translation": "Have you filled out the application form?", "options": ["Ja, hier ist das Formular mit meiner Unterschrift.", "Ich bin hungrig."]},
        {"partner": "Beamter", "prompt": "Bitte zeigen Sie mir auch Ihren Reisepass.", "translation": "Please also show me your passport.", "options": ["Hier ist mein gültiger Reisepass.", "Danke schön!"]},
        {"prompt": "Type the German word for 'signature':", "target": "Unterschrift", "hint": "Hint: signing your name"},
        {"prompt": "Type the German separable verb for 'to fill out':", "target": "ausfüllen", "hint": "Hint: prefix aus- with Umlaut ü"},
        {"prompt": "Hier unten fehlt noch Ihre _______.", "en": "Down here your signature is still missing.", "options": ["Unterschrift", "Formular", "Behörde"], "answer": "Unterschrift"},
        {"prompt": "Bitte _______ Sie das Dokument sorgfältig aus.", "en": "Please fill out the document carefully.", "options": ["füllen", "unterschreiben", "stehen"], "answer": "füllen"}
    ))

    # Unit 97: Kurze E-Mails schreiben
    units.append(make_unit(
        97, 3, "Kurze E-Mails schreiben", "Write short emails", "#00CD9C",
        [{"de": "Grüße", "en": "greetings"}, {"de": "Liebe Grüße", "en": "Warm regards (informal)"}, {"de": "Sehr geehrte", "en": "Dear (formal)"}, {"de": "Betreff", "en": "subject line"}],
        [{"de": "E-Mail", "en": "email"}, {"de": "schreiben", "en": "to write"}, {"de": "antworten", "en": "to reply"}, {"de": "Anrede", "en": "salutation"}],
        [{"de": "Grußformel", "en": "closing formula"}, {"de": "Anhang", "en": "attachment"}, {"de": "senden", "en": "to send"}, {"de": "Bestätigung", "en": "confirmation"}],
        [{"de": "Mit freundlichen Grüßen", "en": "Sincerely (formal)"}, {"de": "Termin", "en": "appointment"}, {"de": "Dank", "en": "thanks"}, {"de": "Nachricht", "en": "message"}],
        {"de": "Sehr geehrte Damen und Herren,", "en": "Dear Sir or Madam,"},
        {"de": "Vielen Dank für Ihre schnelle Nachricht.", "en": "Many thanks for your prompt message."},
        {"de": "Ich sende Ihnen das Dokument im Anhang.", "en": "I send you the document in the attachment."},
        {"de": "Können Sie mir den Erhalt bitte kurz bestätigen?", "en": "Could you please confirm receipt briefly?"},
        {"de": "Mit freundlichen Grüßen, David Müller.", "en": "Sincerely, David Müller."},
        {"de": "Liebe Grüße und bis nächste Woche in Berlin!", "en": "Warm regards and see you next week in Berlin!"},
        {"partner": "Kollege", "prompt": "Hast du die E-Mail an den Chef geschickt?", "translation": "Did you send the email to the boss?", "options": ["Ja, die E-Mail ist mit Anhang verschickt.", "Ich trinke Orangensaft."]},
        {"partner": "Kollege", "prompt": "Wie lautet die offizielle Grußformel?", "translation": "What is the official closing formula?", "options": ["Mit freundlichen Grüßen ist der Standard.", "Auf Wiedersehen."]},
        {"prompt": "Type the German formal closing formula:", "target": "Mit freundlichen Grüßen", "hint": "Hint: capitalized with Umlaut ü and sharp s ß"},
        {"prompt": "Type the German word for 'email attachment':", "target": "Anhang", "hint": "Hint: attached file noun"},
        {"prompt": "Sehr geehrte Damen und _______,", "en": "Dear Sir or Madam,", "options": ["Herren", "Grüße", "Anhang"], "answer": "Herren"},
        {"prompt": "Ich sende Ihnen die Datei im _______.", "en": "I send you the file in the attachment.", "options": ["Anhang", "Betreff", "Grüße"], "answer": "Anhang"}
    ))

    # Unit 98: Ansagen verstehen
    units.append(make_unit(
        98, 3, "Ansagen verstehen", "Public announcements", "#FFC800",
        [{"de": "Achtung", "en": "attention"}, {"de": "Durchsage", "en": "public announcement"}, {"de": "Gleiswechsel", "en": "track change"}, {"de": "Zug fällt aus", "en": "train is cancelled"}],
        [{"de": "Fahrgäste", "en": "passengers"}, {"de": "Verspätung", "en": "delay"}, {"de": "Lautsprecher", "en": "loudspeaker"}, {"de": "beachten", "en": "to pay attention / heed"}],
        [{"de": "Information", "en": "information"}, {"de": "Grund", "en": "reason"}, {"de": "Anschlusszug", "en": "connecting train"}, {"de": "Sicherheit", "en": "safety"}],
        [{"de": "Vorsicht", "en": "caution"}, {"de": "Gepäck", "en": "luggage"}, {"de": "Bahnsteig", "en": "platform"}, {"de": "bitte beachten", "en": "please note"}],
        {"de": "Achtung an Gleis drei, eine wichtige Durchsage!", "en": "Attention on track three, an important announcement!"},
        {"de": "Der ICE nach Hamburg fällt heute leider aus.", "en": "The ICE to Hamburg is unfortunately cancelled today."},
        {"de": "Bitte beachten Sie den kurzfristigen Gleiswechsel.", "en": "Please note the short-term track change."},
        {"de": "Haben alle Fahrgäste die Durchsage verstanden?", "en": "Did all passengers understand the announcement?"},
        {"de": "Reisende nach München nutzen bitte den Ersatzzug.", "en": "Travelers to Munich please use the replacement train."},
        {"de": "Vorsicht an der Bahnsteigkante bei der Einfahrt des Zuges!", "en": "Caution at the platform edge upon train arrival!"},
        {"partner": "Fahrgast", "prompt": "Was hat die Durchsage gerade gesagt?", "translation": "What did the announcement just say?", "options": ["Unser Zug hat zehn Minuten Verspätung.", "Ich habe eine Katze."]},
        {"partner": "Fahrgast", "prompt": "Fährt der Zug wirklich von Gleis vier?", "translation": "Does the train really leave from track four?", "options": ["Nein, es gab einen Gleiswechsel auf Gleis fünf.", "Danke schön!"]},
        {"prompt": "Type the German call for 'attention':", "target": "Achtung", "hint": "Hint: 7 letters starting with A"},
        {"prompt": "Type the German word for 'public announcement':", "target": "Durchsage", "hint": "Hint: loudspeaker announcement"},
        {"prompt": "_______ an alle Fahrgäste auf Gleis zwei!", "en": "Attention to all passengers on track two!", "options": ["Achtung", "Vorsicht", "Grund"], "answer": "Achtung"},
        {"prompt": "Bitte beachten Sie den kurzfristigen _______.", "en": "Please note the short-term track change.", "options": ["Gleiswechsel", "Lautsprecher", "Fahrgäste"], "answer": "Gleiswechsel"}
    ))

    # Unit 99: Telefonieren im Alltag
    units.append(make_unit(
        99, 3, "Telefonieren im Alltag", "Everyday phone calls", "#1CB0F6",
        [{"de": "anrufen", "en": "to call / ring"}, {"de": "wer spricht", "en": "who is speaking"}, {"de": "verbinden", "en": "to connect / transfer"}, {"de": "Nachricht", "en": "message"}],
        [{"de": "hinterlassen", "en": "to leave (message)"}, {"de": "zurückrufen", "en": "to call back"}, {"de": "Mailbox", "en": "voicemail"}, {"de": "verwählt", "en": "dialed wrong number"}],
        [{"de": "Telefonat", "en": "phone conversation"}, {"de": "Nummer", "en": "number"}, {"de": "erreichbar", "en": "reachable / available"}, {"de": "Moment", "en": "moment"}],
        [{"de": "am Apparat", "en": "speaking / on the line"}, {"de": "Geduld", "en": "patience"}, {"de": "ausrichten", "en": "to pass on (message)"}, {"de": "auf Wiederhören", "en": "goodbye (on phone)"}],
        {"de": "Guten Tag, hier spricht David Müller.", "en": "Good day, David Müller speaking here."},
        {"de": "Könnten Sie mich bitte mit Herrn Koch verbinden?", "en": "Could you please connect me with Mr. Koch?"},
        {"de": "Er ist im Moment leider nicht erreichbar.", "en": "Unfortunately he is not reachable at the moment."},
        {"de": "Kann ich ihm eine kurze Nachricht ausrichten?", "en": "Can I pass on a short message to him?"},
        {"de": "Entschuldigung, ich habe mich leider verwählt.", "en": "Excuse me, I unfortunately dialed the wrong number."},
        {"de": "Vielen Dank für Ihren Anruf und auf Wiederhören!", "en": "Many thanks for your call and goodbye!"},
        {"partner": "Sekretärin", "prompt": "Firma Schmidt, guten Tag, wer spricht bitte?", "translation": "Schmidt Company, good day, who is speaking please?", "options": ["Guten Tag, hier spricht David Müller.", "Ich esse einen Apfel."]},
        {"partner": "Sekretärin", "prompt": "Herr Schmidt ist zu Tisch. Kann er Sie zurückrufen?", "translation": "Mr. Schmidt is at lunch. Can he call you back?", "options": ["Ja gern, meine Nummer ist null eins sieben zwei.", "Auf Wiedersehen."]},
        {"prompt": "Type the German telephone farewell 'goodbye':", "target": "auf Wiederhören", "hint": "Hint: two words, phone specific with Umlaut ö"},
        {"prompt": "Type the German word for 'reachable / available':", "target": "erreichbar", "hint": "Hint: 10 letters starting with e"},
        {"prompt": "Hier spricht David Müller am _______.", "en": "David Müller speaking on the line.", "options": ["Apparat", "Telefonat", "Moment"], "answer": "Apparat"},
        {"prompt": "Ich habe mich leider _______.", "en": "Unfortunately I dialed the wrong number.", "options": ["verwählt", "verbunden", "angerufen"], "answer": "verwählt"}
    ))

    # Unit 100: Ein Gespräch führen
    units.append(make_unit(
        100, 3, "Ein Gespräch führen", "Social conversations", "#58CC02",
        [{"de": "natürlich", "en": "of course / naturally"}, {"de": "wirklich", "en": "really / truly"}, {"de": "interessant", "en": "interesting"}, {"de": "genau", "en": "exactly"}],
        [{"de": "plaudern", "en": "to chat / converse"}, {"de": "Meinung", "en": "opinion"}, {"de": "Gespräch", "en": "conversation"}, {"de": "sympathisch", "en": "likeable / pleasant"}],
        [{"de": "Thema", "en": "topic"}, {"de": "Recht haben", "en": "to be right"}, {"de": "zustimmen", "en": "to agree"}, {"de": "unterhalten", "en": "to converse / chat"}],
        [{"de": "kennenlernen", "en": "to get to know"}, {"de": "Freundschaft", "en": "friendship"}, {"de": "Erfahrung", "en": "experience"}, {"de": "Spaß", "en": "fun"}],
        {"de": "Das ist ein wirklich interessantes Thema.", "en": "That is a really interesting topic."},
        {"de": "Ja genau, da stimme ich Ihnen vollkommen zu.", "en": "Yes exactly, I agree with you completely there."},
        {"de": "Wir haben uns sehr nett miteinander unterhalten.", "en": "We had a very nice chat with each other."},
        {"de": "Was ist deine persönliche Meinung dazu?", "en": "What is your personal opinion on that?"},
        {"de": "Sie haben absolut Recht mit diesem wichtigen Punkt.", "en": "You are absolutely right with this important point."},
        {"de": "Es war schön, Sie heute persönlich kennenzulernen.", "en": "It was nice to get to know you personally today."},
        {"partner": "Gesprächspartner", "prompt": "Findest du Deutsch lernen schwierig?", "translation": "Do you find learning German difficult?", "options": ["Am Anfang ja, aber jetzt macht es viel Spaß!", "Ich nehme den Bus."]},
        {"partner": "Gesprächspartner", "prompt": "Stimmst du meinem Vorschlag zu?", "translation": "Do you agree with my suggestion?", "options": ["Ja genau, das klingt nach einem super Plan.", "Gute Nacht."]},
        {"prompt": "Type the German word for 'of course / naturally':", "target": "natürlich", "hint": "Hint: 9 letters with Umlaut ü"},
        {"prompt": "Type the German word for 'conversation':", "target": "Gespräch", "hint": "Hint: dialogue noun with Umlaut ä"},
        {"prompt": "Das ist wirklich sehr _______.", "en": "That is really very interesting.", "options": ["interessant", "Meinung", "Gespräch"], "answer": "interessant"},
        {"prompt": "Da stimme ich dir vollkommen _______.", "en": "I agree with you completely there.", "options": ["zu", "mit", "an"], "answer": "zu"}
    ))

    # Unit 101: Meinungen begründen
    units.append(make_unit(
        101, 3, "Meinungen begründen", "Opinions with weil", "#FF9600",
        [{"de": "weil", "en": "because (verb at end)"}, {"de": "Grund", "en": "reason"}, {"de": "Meinung", "en": "opinion"}, {"de": "wichtig", "en": "important"}],
        [{"de": "gesund", "en": "healthy"}, {"de": "Sport treiben", "en": "to do sports"}, {"de": "lernen", "en": "to learn"}, {"de": "Erfolg", "en": "success"}],
        [{"de": "denken", "en": "to think"}, {"de": "finden", "en": "to find / think"}, {"de": "Argument", "en": "argument / point"}, {"de": "überzeugen", "en": "to convince"}],
        [{"de": "deshalb", "en": "therefore"}, {"de": "warum", "en": "why"}, {"de": "sinnvoll", "en": "meaningful / sensible"}, {"de": "glauben", "en": "to believe"}],
        {"de": "Ich lerne Deutsch, weil ich in Berlin arbeiten will.", "en": "I learn German because I want to work in Berlin."},
        {"de": "Er treibt Sport, weil es sehr gesund ist.", "en": "He does sports because it is very healthy."},
        {"de": "Wir essen Obst, weil es viele Vitamine enthält.", "en": "We eat fruit because it contains many vitamins."},
        {"de": "Warum lernst du jeden Tag fleißig Deutsch?", "en": "Why do you learn German diligently every day?"},
        {"de": "Ich gehe früh schlafen, weil ich morgen fit sein möchte.", "en": "I go to sleep early because I want to be fit tomorrow."},
        {"de": "Das ist meine Meinung, weil das Argument sinnvoll ist.", "en": "That is my opinion because the argument is sensible."},
        {"partner": "Lehrer", "prompt": "Warum möchtest du Deutsch lernen?", "translation": "Why would you like to learn German?", "options": ["Weil ich hier studieren und arbeiten möchte.", "Ich trinke Kaffee."]},
        {"partner": "Lehrer", "prompt": "Warum isst du kein Fleisch?", "translation": "Why do you not eat meat?", "options": ["Weil ich vegetarisches Essen gesünder finde.", "Auf Wiedersehen."]},
        {"prompt": "Type the German conjunction for 'because':", "target": "weil", "hint": "Hint: sends finite verb to the end"},
        {"prompt": "Type the German word for 'reason':", "target": "Grund", "hint": "Hint: 5 letters starting with G"},
        {"prompt": "Ich lerne Deutsch, _______ ich in Deutschland leben möchte.", "en": "I learn German because I want to live in Germany.", "options": ["weil", "deshalb", "warum"], "answer": "weil"},
        {"prompt": "Er treibt Sport, weil es sehr _______ ist.", "en": "He does sports because it is very healthy.", "options": ["gesund", "wichtig", "Grund"], "answer": "gesund"}
    ))

    # Unit 102: Zukunftspläne
    units.append(make_unit(
        102, 3, "Zukunftspläne", "Future plans and wishes", "#CE82FF",
        [{"de": "hoffen", "en": "to hope"}, {"de": "planen", "en": "to plan"}, {"de": "Zukunft", "en": "future"}, {"de": "Traum", "en": "dream"}],
        [{"de": "Ziel", "en": "goal"}, {"de": "Wunsch", "en": "wish"}, {"de": "werden", "en": "to become / will"}, {"de": "vorhaben", "en": "to intend / plan"}],
        [{"de": "nächstes Jahr", "en": "next year"}, {"de": "nächste Woche", "en": "next week"}, {"de": "bald", "en": "soon"}, {"de": "erfolgreich", "en": "successful"}],
        [{"de": "schaffen", "en": "to accomplish / manage"}, {"de": "Karriere", "en": "career"}, {"de": "Familie", "en": "family"}, {"de": "Haus bauen", "en": "to build a house"}],
        {"de": "Ich plane eine lange Reise nach Deutschland.", "en": "I am planning a long trip to Germany."},
        {"de": "Ich hoffe, dass ich die Prüfung bestehe.", "en": "I hope that I pass the exam."},
        {"de": "Nächstes Jahr werde ich mein Studium beenden.", "en": "Next year I will finish my studies."},
        {"de": "Was hast du für deine berufliche Zukunft vor?", "en": "What do you intend for your professional future?"},
        {"de": "Mein größter Traum ist ein eigenes Haus mit Garten.", "en": "My biggest dream is an own house with a garden."},
        {"de": "Wir werden gemeinsam alle unsere Ziele erreichen.", "en": "We will achieve all our goals together."},
        {"partner": "Freund", "prompt": "Was hast du nach der Sprachprüfung vor?", "translation": "What do you plan after the language exam?", "options": ["Ich werde mich an der Universität bewerben.", "Ich habe einen Hund."]},
        {"partner": "Freund", "prompt": "Hoffst du auf eine gute Arbeitsstelle?", "translation": "Do you hope for a good job?", "options": ["Ja, ich hoffe auf eine tolle Stelle in Berlin.", "Danke sehr."]},
        {"prompt": "Type the German verb for 'to hope':", "target": "hoffen", "hint": "Hint: 6 letters starting with h"},
        {"prompt": "Type the German word for 'future':", "target": "Zukunft", "hint": "Hint: time to come noun"},
        {"prompt": "Ich _______, dass das Wetter morgen sonnig wird.", "en": "I hope that the weather will be sunny tomorrow.", "options": ["hoffe", "plane", "werde"], "answer": "hoffe"},
        {"prompt": "Mein großes _______ ist fließend Deutsch sprechen.", "en": "My big goal is speaking fluent German.", "options": ["Ziel", "Traum", "Zukunft"], "answer": "Ziel"}
    ))

    # Unit 103: Goethe A1 Simulation: Hören
    units.append(make_unit(
        103, 3, "Goethe A1 Simulation: Hören", "Exam Simulation: Listening", "#FF4B4B",
        [{"de": "Prüfung", "en": "examination / exam"}, {"de": "Hören", "en": "listening comprehension"}, {"de": "Teil", "en": "part / section"}, {"de": "Aufgabe", "en": "task / exercise"}],
        [{"de": "ankreuzen", "en": "to cross / check box"}, {"de": "Dialog", "en": "dialogue"}, {"de": "richtig", "en": "correct / true"}, {"de": "falsch", "en": "incorrect / false"}],
        [{"de": "Text", "en": "text"}, {"de": "zweimal", "en": "twice"}, {"de": "Lösung", "en": "solution"}, {"de": "Punkt", "en": "point / score"}],
        [{"de": "Zertifikat", "en": "certificate"}, {"de": "Konzentration", "en": "concentration"}, {"de": "bestehen", "en": "to pass"}, {"de": "Lautsprecher", "en": "loudspeaker"}],
        {"de": "Die Prüfung Hören besteht aus drei Teilen.", "en": "The listening exam consists of three parts."},
        {"de": "Sie hören jeden kurzen Text zweimal.", "en": "You will hear each short text twice."},
        {"de": "Kreuzen Sie die richtige Lösung an.", "en": "Cross the correct solution."},
        {"de": "Haben Sie die Aufgabe aufmerksam verstanden?", "en": "Did you understand the task attentively?"},
        {"de": "Konzentration ist bei der Hörprüfung besonders wichtig.", "en": "Concentration is especially important in listening exam."},
        {"de": "Für jede richtige Antwort erhalten Sie einen Punkt.", "en": "For each correct answer you receive one point."},
        {"partner": "Prüfer", "prompt": "Hören Sie jetzt den Text und kreuzen Sie an.", "translation": "Listen to the text now and check the box.", "options": ["Ich habe die Antwort A gewählt.", "Ich esse Käse."]},
        {"partner": "Prüfer", "prompt": "Haben Sie alles gut im Kopf behalten?", "translation": "Did you retain everything well in your head?", "options": ["Ja, der Text war sehr klar und verständlich.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'examination / test':", "target": "Prüfung", "hint": "Hint: test noun with Umlaut ü"},
        {"prompt": "Type the German word for 'solution':", "target": "Lösung", "hint": "Hint: answer to exam question with Umlaut ö"},
        {"prompt": "Kreuzen Sie bitte die richtige _______ an.", "en": "Please check the correct solution.", "options": ["Lösung", "Prüfung", "Aufgabe"], "answer": "Lösung"},
        {"prompt": "Sie hören den Text genau _______.", "en": "You will hear the text exactly twice.", "options": ["zweimal", "Teil", "Punkt"], "answer": "zweimal"}
    ))

    # Unit 104: Goethe A1 Simulation: Sprechen
    units.append(make_unit(
        104, 3, "Goethe A1 Simulation: Sprechen", "Exam Simulation: Speaking", "#00CD9C",
        [{"de": "Sprechen", "en": "speaking"}, {"de": "vorstellen", "en": "to introduce oneself"}, {"de": "bitten", "en": "to request / ask"}, {"de": "formulieren", "en": "to formulate"}],
        [{"de": "Partner", "en": "partner"}, {"de": "Karte", "en": "card / prompt card"}, {"de": "Frage", "en": "question"}, {"de": "Antwort", "en": "answer"}],
        [{"de": "Thema", "en": "theme / topic"}, {"de": "Name", "en": "name"}, {"de": "Alter", "en": "age"}, {"de": "Land", "en": "country"}],
        [{"de": "Wohnort", "en": "residence"}, {"de": "Beruf", "en": "profession"}, {"de": "Sprache", "en": "language"}, {"de": "Hobby", "en": "hobby"}],
        {"de": "Ich stelle mich den Prüfern kurz vor.", "en": "I introduce myself briefly to the examiners."},
        {"de": "Mein Name ist David und ich bin fünfundzwanzig.", "en": "My name is David and I am twenty-five."},
        {"de": "Ich ziehe eine Wortkarte und stelle eine Frage.", "en": "I draw a word card and ask a question."},
        {"de": "Können Sie die Bitte höflich formulieren?", "en": "Can you formulate the request politely?"},
        {"de": "Mein Partner beantwortet meine Frage auf Deutsch.", "en": "My partner answers my question in German."},
        {"de": "Ich spreche Englisch, Hindi und lerne fleißig Deutsch.", "en": "I speak English, Hindi, and learn German diligently."},
        {"partner": "Prüferin", "prompt": "Bitte stellen Sie sich kurz vor.", "translation": "Please introduce yourself briefly.", "options": ["Guten Tag, mein Name ist David, ich komme aus Indien.", "Ich trinke Tee."]},
        {"partner": "Prüferin", "prompt": "Formulieren Sie eine Bitte mit der Karte 'Wasser'.", "translation": "Formulate a request with the card 'water'.", "options": ["Könnten Sie mir bitte ein Glas Wasser geben?", "Gute Nacht."]},
        {"prompt": "Type the German separable verb for 'to introduce oneself':", "target": "vorstellen", "hint": "Hint: prefix vor-"},
        {"prompt": "Type the German word for 'to formulate':", "target": "formulieren", "hint": "Hint: 11 letters ending in -ieren"},
        {"prompt": "Ich _______ mich den Prüfern vor.", "en": "I introduce myself to the examiners.", "options": ["stelle", "mache", "sage"], "answer": "stelle"},
        {"prompt": "Bitte formulieren Sie eine höfliche _______.", "en": "Please formulate a polite request.", "options": ["Bitte", "Karte", "Partner"], "answer": "Bitte"}
    ))

    # Unit 105: Das Große A1-Finale
    units.append(make_unit(
        105, 3, "Das Große A1-Finale", "Grand A1 Mastery Exam", "#FFC800",
        [{"de": "Zertifikat", "en": "certificate"}, {"de": "bestanden", "en": "passed (exam)"}, {"de": "geschafft", "en": "managed / accomplished"}, {"de": "Glückwunsch", "en": "congratulations"}],
        [{"de": "Niveau A2", "en": "CEFR level A2"}, {"de": "stolz", "en": "proud"}, {"de": "Erfolg", "en": "success"}, {"de": "Deutschprofi", "en": "German pro"}],
        [{"de": "Meister", "en": "master"}, {"de": "feiern", "en": "to celebrate"}, {"de": "Abschluss", "en": "graduation / finale"}, {"de": "Reise", "en": "journey"}],
        [{"de": "Wissen", "en": "knowledge"}, {"de": "Zukunft", "en": "future"}, {"de": "Freude", "en": "joy"}, {"de": "Danke", "en": "thank you"}],
        {"de": "Ich habe die Goethe-A1-Prüfung bestanden!", "en": "I have passed the Goethe A1 exam!"},
        {"de": "Herzlichen Glückwunsch zu diesem fantastischen Erfolg!", "en": "Warm congratulations on this fantastic success!"},
        {"de": "Wir haben alle 105 Lektionen gemeistert.", "en": "We have mastered all 105 units."},
        {"de": "Bist du stolz auf dein neues A1-Zertifikat?", "en": "Are you proud of your new A1 certificate?"},
        {"de": "Ich kann mich jetzt sicher auf Deutsch im Alltag verständigen.", "en": "I can now communicate securely in German in daily life."},
        {"de": "Jetzt beginnt die spannende Reise zum Niveau A2!", "en": "Now begins the exciting journey to level A2!"},
        {"partner": "Prüfer", "prompt": "Herzlichen Glückwunsch, Sie haben die A1-Prüfung bestanden!", "translation": "Congratulations, you have passed the A1 exam!", "options": ["Vielen herzlichen Dank, ich bin unglaublich stolz!", "Ich habe keinen Durst."]},
        {"partner": "Prüfer", "prompt": "Werden Sie weiter Deutsch auf Niveau A2 lernen?", "translation": "Will you continue learning German at A2 level?", "options": ["Ja unbedingt, mein Ziel ist das B2-Zertifikat!", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'certificate':", "target": "Zertifikat", "hint": "Hint: official award noun"},
        {"prompt": "Type the German word for 'congratulations':", "target": "Glückwunsch", "hint": "Hint: starts with G with Umlaut ü"},
        {"prompt": "Ich habe die A1-Prüfung erfolgreich _______!", "en": "I have successfully passed the A1 exam!", "options": ["bestanden", "geschafft", "gefeiert"], "answer": "bestanden"},
        {"prompt": "Herzlichen _______ zum großen Erfolg!", "en": "Hearty congratulations on the big success!", "options": ["Glückwunsch", "Zertifikat", "Meister"], "answer": "Glückwunsch"}
    ))

    return units
