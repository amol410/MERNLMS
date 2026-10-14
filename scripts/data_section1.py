try:
    from scripts.generate_curriculum_data import make_unit
except ImportError:
    from generate_curriculum_data import make_unit

def get_section1_units():
    units = []

    # Unit 1: Erste Begrüßungen
    units.append(make_unit(
        1, 1, "Erste Begrüßungen", "Greet and introduce yourself", "#1CB0F6",
        [{"de": "Hallo", "en": "Hello"}, {"de": "Guten Tag", "en": "Good day / Hello"}, {"de": "Guten Morgen", "en": "Good morning"}, {"de": "Tschüss", "en": "Bye"}],
        [{"de": "ich", "en": "I"}, {"de": "bin", "en": "am"}, {"de": "heiße", "en": "am called"}, {"de": "Name", "en": "name"}],
        [{"de": "Danke", "en": "Thank you"}, {"de": "Bitte", "en": "Please / You're welcome"}, {"de": "Auf Wiedersehen", "en": "Goodbye (formal)"}, {"de": "Gute Nacht", "en": "Good night"}],
        [{"de": "Wie", "en": "How"}, {"de": "geht", "en": "goes"}, {"de": "gut", "en": "good / well"}, {"de": "sehr", "en": "very"}],
        {"de": "Hallo, guten Tag!", "en": "Hello, good day!", "tokens": ["Hallo,", "guten", "Tag!", "Tschüss", "Danke"]},
        {"de": "Hallo, ich bin Lukas.", "en": "Hello, I am Lukas.", "tokens": ["Hallo,", "ich", "bin", "Lukas.", "wer", "bist"]},
        {"de": "Danke schön und tschüss!", "en": "Thank you very much and bye!", "tokens": ["Danke", "schön", "und", "tschüss!", "Bitte", "Hallo"]},
        {"de": "Wie geht es dir?", "en": "How are you?", "tokens": ["Wie", "geht", "es", "dir?", "gut", "danke"]},
        {"de": "Guten Morgen! Wie geht es dir?", "en": "Good morning! How are you?", "tokens": ["Guten", "Morgen!", "Wie", "geht", "es", "dir?", "Sehr", "gut"]},
        {"de": "Sehr gut, vielen Dank!", "en": "Very good, thank you very much!", "tokens": ["Sehr", "gut,", "vielen", "Dank!", "Bitte", "Auf", "Wiedersehen"]},
        {"partner": "Anna", "prompt": "Hallo! Ich bin Anna.", "translation": "Hello! I am Anna.", "options": ["Hallo! Ich bin David.", "Guten Tag, danke!"]},
        {"partner": "Alex", "prompt": "Wie geht es dir?", "translation": "How are you?", "options": ["Sehr gut, danke!", "Tschüss, bis bald!"]},
        {"prompt": "Type the German word for 'Goodbye' (casual):", "target": "Tschüss", "hint": "Hint: casual goodbye with Umlaut ü"},
        {"prompt": "Type the German word for 'Thank you':", "target": "Danke", "hint": "Hint: polite expression for thank you"},
        {"prompt": "Guten Tag! Ich _______ Anna.", "en": "Good day! I am called Anna.", "options": ["heiße", "danke", "Morgen"], "answer": "heiße"},
        {"prompt": "Wie _______ es dir?", "en": "How are you?", "options": ["geht", "bist", "heißt"], "answer": "geht"}
    ))

    # Unit 2: Im Café bestellen
    units.append(make_unit(
        2, 1, "Im Café bestellen", "Order at a café", "#58CC02",
        [{"de": "Kaffee", "en": "coffee"}, {"de": "Tee", "en": "tea"}, {"de": "Wasser", "en": "water"}, {"de": "Milch", "en": "milk"}],
        [{"de": "möchte", "en": "would like"}, {"de": "trinken", "en": "to drink"}, {"de": "bitte", "en": "please"}, {"de": "Glas", "en": "glass"}],
        [{"de": "Zucker", "en": "sugar"}, {"de": "Zitrone", "en": "lemon"}, {"de": "Rechnung", "en": "bill"}, {"de": "zahlen", "en": "to pay"}],
        [{"de": "kostet", "en": "costs"}, {"de": "Euro", "en": "euro"}, {"de": "zusammen", "en": "together"}, {"de": "stimmt", "en": "keep the change / correct"}],
        {"de": "Kaffee und Milch, bitte.", "en": "Coffee and milk, please.", "tokens": ["Kaffee", "und", "Milch,", "bitte.", "Tee", "Zucker"]},
        {"de": "Ich möchte einen Kaffee.", "en": "I would like a coffee.", "tokens": ["Ich", "möchte", "einen", "Kaffee.", "Wasser", "trinken"]},
        {"de": "Ein Glas Wasser, bitte!", "en": "A glass of water, please!", "tokens": ["Ein", "Glas", "Wasser,", "bitte!", "Milch", "Tee"]},
        {"de": "Die Rechnung, bitte!", "en": "The bill, please!", "tokens": ["Die", "Rechnung,", "bitte!", "Zucker", "zahlen"]},
        {"de": "Ich möchte einen Kaffee mit Milch.", "en": "I would like a coffee with milk.", "tokens": ["Ich", "möchte", "einen", "Kaffee", "mit", "Milch.", "Tee", "Euro"]},
        {"de": "Das macht zusammen drei Euro.", "en": "That makes three euros altogether.", "tokens": ["Das", "macht", "zusammen", "drei", "Euro.", "bitte", "stimmt"]},
        {"partner": "Kellner", "prompt": "Guten Tag! Was möchten Sie trinken?", "translation": "Good day! What would you like to drink?", "options": ["Einen Kaffee, bitte.", "Ich komme aus Deutschland."]},
        {"partner": "Kellner", "prompt": "Das macht zusammen drei Euro.", "translation": "That makes three euros altogether.", "options": ["Hier sind drei Euro, danke.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'coffee':", "target": "Kaffee", "hint": "Hint: hot morning drink"},
        {"prompt": "Type the German word for 'tea':", "target": "Tee", "hint": "Hint: herbal or green beverage"},
        {"prompt": "Ich _______ einen Kaffee, bitte.", "en": "I would like a coffee, please.", "options": ["möchte", "trinke", "habe"], "answer": "möchte"},
        {"prompt": "Ein Glas _______, bitte.", "en": "A glass of water, please.", "options": ["Wasser", "Zucker", "Euro"], "answer": "Wasser"}
    ))

    # Unit 3: Zahlen 1 bis 10
    units.append(make_unit(
        3, 1, "Zahlen 1 bis 10", "Count from 1 to 10", "#FF9600",
        [{"de": "eins", "en": "one"}, {"de": "zwei", "en": "two"}, {"de": "drei", "en": "three"}, {"de": "vier", "en": "four"}],
        [{"de": "fünf", "en": "five"}, {"de": "sechs", "en": "six"}, {"de": "sieben", "en": "seven"}, {"de": "acht", "en": "eight"}],
        [{"de": "neun", "en": "nine"}, {"de": "zehn", "en": "ten"}, {"de": "null", "en": "zero"}, {"de": "Euro", "en": "euro"}],
        [{"de": "plus", "en": "plus"}, {"de": "minus", "en": "minus"}, {"de": "macht", "en": "equals / makes"}, {"de": "wie viel", "en": "how much / how many"}],
        {"de": "Eins, zwei, drei!", "en": "One, two, three!", "tokens": ["Eins,", "zwei,", "drei!", "vier", "fünf"]},
        {"de": "Ich habe vier Äpfel.", "en": "I have four apples.", "tokens": ["Ich", "habe", "vier", "Äpfel.", "drei", "Euro"]},
        {"de": "Sieben, acht, neun, zehn.", "en": "Seven, eight, nine, ten.", "tokens": ["Sieben,", "acht,", "neun,", "zehn.", "null", "fünf"]},
        {"de": "Das macht zwei Euro.", "en": "That makes two euros.", "tokens": ["Das", "macht", "zwei", "Euro.", "drei", "zehn"]},
        {"de": "Zwei plus drei macht fünf.", "en": "Two plus three makes five.", "tokens": ["Zwei", "plus", "drei", "macht", "fünf.", "vier", "sechs"]},
        {"de": "Hier sind fünf Euro, danke.", "en": "Here are five euros, thank you.", "tokens": ["Hier", "sind", "fünf", "Euro,", "danke.", "zehn", "bitte"]},
        {"partner": "Kassierer", "prompt": "Guten Tag! Wie viele Brötchen?", "translation": "Good day! How many rolls?", "options": ["Zwei Brötchen, bitte.", "Ich bin müde."]},
        {"partner": "Kassierer", "prompt": "Das macht zusammen fünf Euro, bitte.", "translation": "That makes five euros altogether, please.", "options": ["Hier sind fünf Euro, danke.", "Nein danke, tschüss."]},
        {"prompt": "Type the German word for number 5:", "target": "fünf", "hint": "Hint: contains Umlaut ü"},
        {"prompt": "Type the German word for number 10:", "target": "zehn", "hint": "Hint: begins with z"},
        {"prompt": "Eins, zwei, _______, vier.", "en": "One, two, three, four.", "options": ["drei", "zehn", "acht"], "answer": "drei"},
        {"prompt": "Das macht _______ Euro, bitte.", "en": "That makes five euros, please.", "options": ["fünf", "haben", "Euro"], "answer": "fünf"}
    ))

    # Unit 4: Woher kommst du?
    units.append(make_unit(
        4, 1, "Woher kommst du?", "Talk about origins & countries", "#CE82FF",
        [{"de": "kommen", "en": "to come"}, {"de": "aus", "en": "from"}, {"de": "Deutschland", "en": "Germany"}, {"de": "Berlin", "en": "Berlin"}],
        [{"de": "Österreich", "en": "Austria"}, {"de": "Wien", "en": "Vienna"}, {"de": "Schweiz", "en": "Switzerland"}, {"de": "Bern", "en": "Bern"}],
        [{"de": "wohnen", "en": "to live / reside"}, {"de": "in", "en": "in"}, {"de": "Stadt", "en": "city"}, {"de": "Land", "en": "country"}],
        [{"de": "Woher", "en": "Where from"}, {"de": "Wo", "en": "Where"}, {"de": "wer", "en": "who"}, {"de": "auch", "en": "also / too"}],
        {"de": "Ich komme aus Deutschland.", "en": "I come from Germany.", "tokens": ["Ich", "komme", "aus", "Deutschland.", "Österreich", "wohne"]},
        {"de": "Ich wohne in Berlin.", "en": "I live in Berlin.", "tokens": ["Ich", "wohne", "in", "Berlin.", "aus", "Wien"]},
        {"de": "Er kommt aus Österreich.", "en": "He comes from Austria.", "tokens": ["Er", "kommt", "aus", "Österreich.", "Schweiz", "Stadt"]},
        {"de": "Woher kommst du?", "en": "Where do you come from?", "tokens": ["Woher", "kommst", "du?", "wo", "bist"]},
        {"de": "Ich komme aus Deutschland und wohne in Frankfurt.", "en": "I come from Germany and live in Frankfurt.", "tokens": ["Ich", "komme", "aus", "Deutschland", "und", "wohne", "in", "Frankfurt."]},
        {"de": "Woher kommen Sie, Herr Müller?", "en": "Where do you come from, Mr. Müller?", "tokens": ["Woher", "kommen", "Sie,", "Herr", "Müller?", "Wien", "Schweiz"]},
        {"partner": "Maximilian", "prompt": "Hallo! Ich komme aus Berlin.", "translation": "Hello! I come from Berlin.", "options": ["Hallo! Ich komme aus Indien.", "Zwei Euro, bitte."]},
        {"partner": "Julia", "prompt": "Kommst du aus Wien?", "translation": "Do you come from Vienna?", "options": ["Nein, ich komme aus Bern.", "Guten Morgen!"]},
        {"prompt": "Type the German word for 'Austria':", "target": "Österreich", "hint": "Hint: starts with Umlaut Ö"},
        {"prompt": "Type the German word for 'to come':", "target": "kommen", "hint": "Hint: infinitive verb"},
        {"prompt": "Ich komme _______ Deutschland.", "en": "I come from Germany.", "options": ["aus", "in", "nach"], "answer": "aus"},
        {"prompt": "Woher _______ du?", "en": "Where do you come from?", "options": ["kommst", "kommen", "wohnt"], "answer": "kommst"}
    ))

    # Unit 5: Höflichkeit im Alltag (Verzeihung instead of Tschüss)
    units.append(make_unit(
        5, 1, "Höflichkeit im Alltag", "Everyday etiquette", "#FF4B4B",
        [{"de": "Entschuldigung", "en": "Excuse me / Sorry"}, {"de": "bitte", "en": "please"}, {"de": "danke", "en": "thanks"}, {"de": "Verzeihung", "en": "pardon / excuse me"}],
        [{"de": "Guten Abend", "en": "Good evening"}, {"de": "Auf Wiedersehen", "en": "Goodbye (formal)"}, {"de": "Gute Nacht", "en": "Good night"}, {"de": "Schönen Tag", "en": "Have a nice day"}],
        [{"de": "Gern geschehen", "en": "You're welcome"}, {"de": "kein Problem", "en": "no problem"}, {"de": "vielen Dank", "en": "many thanks"}, {"de": "alles klar", "en": "all right / okay"}],
        [{"de": "sprechen", "en": "to speak"}, {"de": "Deutsch", "en": "German"}, {"de": "Englisch", "en": "English"}, {"de": "Hilfe", "en": "help"}],
        {"de": "Guten Abend! Danke schön.", "en": "Good evening! Thank you very much.", "tokens": ["Guten", "Abend!", "Danke", "schön.", "Bitte", "Hallo"]},
        {"de": "Entschuldigung, sprechen Sie Deutsch?", "en": "Excuse me, do you speak German?", "tokens": ["Entschuldigung,", "sprechen", "Sie", "Deutsch?", "Englisch", "bitte"]},
        {"de": "Vielen Dank für Ihre Hilfe!", "en": "Many thanks for your help!", "tokens": ["Vielen", "Dank", "für", "Ihre", "Hilfe!", "Gern", "geschehen"]},
        {"de": "Kein Problem, gern geschehen!", "en": "No problem, you are very welcome!", "tokens": ["Kein", "Problem,", "gern", "geschehen!", "Danke", "Tag"]},
        {"de": "Entschuldigung, wo ist der Bahnhof?", "en": "Excuse me, where is the train station?", "tokens": ["Entschuldigung,", "wo", "ist", "der", "Bahnhof?", "bitte", "hier"]},
        {"de": "Auf Wiedersehen und einen schönen Tag!", "en": "Goodbye and have a nice day!", "tokens": ["Auf", "Wiedersehen", "und", "einen", "schönen", "Tag!", "Danke"]},
        {"partner": "Lisa", "prompt": "Vielen Dank für deine Hilfe!", "translation": "Many thanks for your help!", "options": ["Sehr gern geschehen!", "Auf Wiedersehen."]},
        {"partner": "Herr Weber", "prompt": "Entschuldigung, ist hier noch frei?", "translation": "Excuse me, is this seat still free?", "options": ["Ja, bitte nehmen Sie Platz.", "Ich heiße Anna."]},
        {"prompt": "Type the German formal word for 'Goodbye':", "target": "Auf Wiedersehen", "hint": "Hint: two words capitalized"},
        {"prompt": "Type the German word for 'Excuse me':", "target": "Entschuldigung", "hint": "Hint: polite attention grabber"},
        {"prompt": "Vielen Dank! – _______ geschehen.", "en": "Many thanks! – You are welcome.", "options": ["Gern", "Kein", "Schön"], "answer": "Gern"},
        {"prompt": "_______, sprechen Sie Deutsch?", "en": "Excuse me, do you speak German?", "options": ["Entschuldigung", "Danke", "Auf"], "answer": "Entschuldigung"}
    ))

    # Unit 6: Persönliche Daten
    units.append(make_unit(
        6, 1, "Persönliche Daten", "Share personal info", "#00CD9C",
        [{"de": "Wohnort", "en": "residence"}, {"de": "Vorname", "en": "first name"}, {"de": "Nachname", "en": "last name"}, {"de": "Adresse", "en": "address"}],
        [{"de": "wohnen", "en": "to live"}, {"de": "leben", "en": "to reside"}, {"de": "Straße", "en": "street"}, {"de": "Hausnummer", "en": "house number"}],
        [{"de": "Stadt", "en": "city"}, {"de": "Postleitzahl", "en": "postal code"}, {"de": "Telefon", "en": "phone"}, {"de": "E-Mail", "en": "email"}],
        [{"de": "geboren", "en": "born"}, {"de": "Alter", "en": "age"}, {"de": "Jahre", "en": "years"}, {"de": "alt", "en": "old"}],
        {"de": "Ich wohne in Frankfurt.", "en": "I live in Frankfurt."},
        {"de": "Mein Vorname ist Jonas.", "en": "My first name is Jonas."},
        {"de": "Das ist meine Adresse in Berlin.", "en": "That is my address in Berlin."},
        {"de": "Wo wohnen Sie genau?", "en": "Where exactly do you live?"},
        {"de": "Ich bin zwanzig Jahre alt und wohne hier.", "en": "I am twenty years old and live here."},
        {"de": "Meine Telefonnummer ist null eins sieben zwei.", "en": "My phone number is 0172."},
        {"partner": "Julia", "prompt": "Wo wohnst du?", "translation": "Where do you live?", "options": ["Ich wohne in Frankfurt.", "Mein Name ist Jonas."]},
        {"partner": "Lukas", "prompt": "Wie alt bist du?", "translation": "How old are you?", "options": ["Ich bin zwanzig Jahre alt.", "In Berlin."]},
        {"prompt": "Type the German word for 'residence':", "target": "Wohnort", "hint": "Hint: place of living"},
        {"prompt": "Type the German word for 'address':", "target": "Adresse", "hint": "Hint: street & city details"},
        {"prompt": "Ich _______ in Frankfurt am Main.", "en": "I live in Frankfurt on Main.", "options": ["wohne", "heiße", "komme"], "answer": "wohne"},
        {"prompt": "Mein _______ ist Müller.", "en": "My last name is Müller.", "options": ["Nachname", "Wohnort", "Straße"], "answer": "Nachname"}
    ))

    # Unit 7: Zahlen 11 bis 20 & Preise
    units.append(make_unit(
        7, 1, "Zahlen 11 bis 20 & Preise", "Numbers 11-20 and prices", "#FFC800",
        [{"de": "elf", "en": "eleven"}, {"de": "zwölf", "en": "twelve"}, {"de": "dreizehn", "en": "thirteen"}, {"de": "vierzehn", "en": "fourteen"}],
        [{"de": "fünfzehn", "en": "fifteen"}, {"de": "sechzehn", "en": "sixteen"}, {"de": "siebzehn", "en": "seventeen"}, {"de": "achtzehn", "en": "eighteen"}],
        [{"de": "neunzehn", "en": "nineteen"}, {"de": "zwanzig", "en": "twenty"}, {"de": "Cent", "en": "cent"}, {"de": "Preis", "en": "price"}],
        [{"de": "teuer", "en": "expensive"}, {"de": "billig", "en": "cheap"}, {"de": "kosten", "en": "to cost"}, {"de": "bezahlen", "en": "to pay"}],
        {"de": "Das kostet elf Euro.", "en": "That costs eleven euros."},
        {"de": "Ich bezahle zwölf Euro.", "en": "I pay twelve euros."},
        {"de": "Fünfzehn und fünf macht zwanzig.", "en": "Fifteen and five makes twenty."},
        {"de": "Wie viel kostet das Buch?", "en": "How much does the book cost?"},
        {"de": "Das Buch kostet genau achtzehn Euro.", "en": "The book costs exactly eighteen euros."},
        {"de": "Hier sind zwanzig Euro, das stimmt so.", "en": "Here are twenty euros, keep the change."},
        {"partner": "Verkäufer", "prompt": "Das macht zusammen zwölf Euro, bitte.", "translation": "That makes twelve euros altogether, please.", "options": ["Hier sind zwölf Euro, danke.", "Ich komme aus Köln."]},
        {"partner": "Verkäufer", "prompt": "Ist das Buch zu teuer?", "translation": "Is the book too expensive?", "options": ["Nein, das ist wirklich billig.", "Guten Abend."]},
        {"prompt": "Type the German word for number 12:", "target": "zwölf", "hint": "Hint: has Umlaut ö"},
        {"prompt": "Type the German word for number 20:", "target": "zwanzig", "hint": "Hint: begins with zw"},
        {"prompt": "Das Buch kostet _______ Euro.", "en": "The book costs twelve euros.", "options": ["zwölf", "Cent", "Euro"], "answer": "zwölf"},
        {"prompt": "Wie _______ kostet das Brötchen?", "en": "How much does the bread roll cost?", "options": ["viel", "teuer", "macht"], "answer": "viel"}
    ))

    # Unit 8: Meine Familie
    units.append(make_unit(
        8, 1, "Meine Familie", "Introduce your family", "#1CB0F6",
        [{"de": "Mutter", "en": "mother"}, {"de": "Vater", "en": "father"}, {"de": "Eltern", "en": "parents"}, {"de": "Familie", "en": "family"}],
        [{"de": "Bruder", "en": "brother"}, {"de": "Schwester", "en": "sister"}, {"de": "Geschwister", "en": "siblings"}, {"de": "Sohn", "en": "son"}],
        [{"de": "Tochter", "en": "daughter"}, {"de": "Oma", "en": "grandma"}, {"de": "Opa", "en": "grandpa"}, {"de": "Kind", "en": "child"}],
        [{"de": "mein", "en": "my (masc)"}, {"de": "meine", "en": "my (fem/pl)"}, {"de": "haben", "en": "to have"}, {"de": "groß", "en": "big / tall"}],
        {"de": "Das ist meine Mutter.", "en": "That is my mother."},
        {"de": "Mein Vater heißt Thomas.", "en": "My father is called Thomas."},
        {"de": "Ich habe einen Bruder und eine Schwester.", "en": "I have a brother and a sister."},
        {"de": "Hast du auch Geschwister?", "en": "Do you also have siblings?"},
        {"de": "Meine Familie ist sehr groß und freundlich.", "en": "My family is very big and friendly."},
        {"de": "Meine Oma und mein Opa wohnen in Köln.", "en": "My grandma and grandpa live in Cologne."},
        {"partner": "Lisa", "prompt": "Wer ist dieser nette Mann?", "translation": "Who is this nice man?", "options": ["Das ist mein Vater Thomas.", "Ich trinke Tee."]},
        {"partner": "Lisa", "prompt": "Hast du Geschwister?", "translation": "Do you have siblings?", "options": ["Ja, einen Bruder und eine Schwester.", "Fünfzehn Euro."]},
        {"prompt": "Type the German word for 'mother':", "target": "Mutter", "hint": "Hint: female parent"},
        {"prompt": "Type the German word for 'brother':", "target": "Bruder", "hint": "Hint: male sibling"},
        {"prompt": "Das ist _______ Mutter.", "en": "That is my mother.", "options": ["meine", "mein", "ich"], "answer": "meine"},
        {"prompt": "Mein Vater _______ Thomas.", "en": "My father is called Thomas.", "options": ["heißt", "bin", "wohnt"], "answer": "heißt"}
    ))

    # Unit 9: W-Fragen meistern
    units.append(make_unit(
        9, 1, "W-Fragen meistern", "Master German W-questions", "#58CC02",
        [{"de": "Wer", "en": "Who"}, {"de": "Was", "en": "What"}, {"de": "Wo", "en": "Where"}, {"de": "Wann", "en": "When"}],
        [{"de": "Warum", "en": "Why"}, {"de": "Wohin", "en": "Where to"}, {"de": "Woher", "en": "Where from"}, {"de": "Welche", "en": "Which"}],
        [{"de": "Frage", "en": "question"}, {"de": "Antwort", "en": "answer"}, {"de": "fragen", "en": "to ask"}, {"de": "wissen", "en": "to know"}],
        [{"de": "lernen", "en": "to learn"}, {"de": "verstehen", "en": "to understand"}, {"de": "bedeuten", "en": "to mean"}, {"de": "Wort", "en": "word"}],
        {"de": "Wer spricht hier Deutsch?", "en": "Who speaks German here?"},
        {"de": "Was machen wir heute?", "en": "What are we doing today?"},
        {"de": "Woher kommen Sie eigentlich?", "en": "Where do you come from actually?"},
        {"de": "Warum lernen Sie Deutsch?", "en": "Why are you learning German?"},
        {"de": "Wann beginnt unser Deutschkurs heute?", "en": "When does our German course begin today?"},
        {"de": "Ich verstehe die deutsche Frage sehr gut.", "en": "I understand the German question very well."},
        {"partner": "Trainer", "prompt": "Was möchten Sie heute lernen?", "translation": "What would you like to learn today?", "options": ["Ich möchte Deutsch sprechen lernen.", "Das macht drei Euro."]},
        {"partner": "Trainer", "prompt": "Warum lernen Sie Deutsch?", "translation": "Why are you learning German?", "options": ["Weil ich in Berlin leben möchte.", "Nein danke."]},
        {"prompt": "Type the German question word for 'Why':", "target": "Warum", "hint": "Hint: asks for reason"},
        {"prompt": "Type the German word for 'question':", "target": "Frage", "hint": "Hint: begins with capital F"},
        {"prompt": "_______ spricht hier Deutsch?", "en": "Who speaks German here?", "options": ["Wer", "Was", "Warum"], "answer": "Wer"},
        {"prompt": "_______ beginnt der Kurs?", "en": "When does the course begin?", "options": ["Wann", "Wer", "Wo"], "answer": "Wann"}
    ))

    # Unit 10: Ja/Nein-Fragen
    units.append(make_unit(
        10, 1, "Ja/Nein-Fragen", "Ask yes or no questions", "#FF9600",
        [{"de": "Ja", "en": "Yes"}, {"de": "Nein", "en": "No"}, {"de": "doch", "en": "yes (on the contrary)"}, {"de": "vielleicht", "en": "maybe"}],
        [{"de": "verstehen", "en": "to understand"}, {"de": "hören", "en": "to hear"}, {"de": "sehen", "en": "to see"}, {"de": "glauben", "en": "to believe"}],
        [{"de": "stimmt", "en": "is correct"}, {"de": "richtig", "en": "right"}, {"de": "falsch", "en": "wrong"}, {"de": "sicher", "en": "sure / certain"}],
        [{"de": "Kommst", "en": "Do you come"}, {"de": "Hast", "en": "Do you have"}, {"de": "Bist", "en": "Are you"}, {"de": "Wohnst", "en": "Do you live"}],
        {"de": "Verstehen Sie mich gut?", "en": "Do you understand me well?"},
        {"de": "Kommen Sie aus Deutschland?", "en": "Do you come from Germany?"},
        {"de": "Ja, das stimmt genau.", "en": "Yes, that is exactly right."},
        {"de": "Hast du heute Zeit für mich?", "en": "Do you have time for me today?"},
        {"de": "Bist du schon lange in München?", "en": "Have you been in Munich for a long time?"},
        {"de": "Nein, ich bin erst seit gestern hier.", "en": "No, I have only been here since yesterday."},
        {"partner": "Markus", "prompt": "Kommst du aus Deutschland?", "translation": "Do you come from Germany?", "options": ["Nein, ich komme aus Österreich.", "Guten Tag, danke."]},
        {"partner": "Markus", "prompt": "Verstehst du alles gut?", "translation": "Do you understand everything well?", "options": ["Ja, ich verstehe alles sehr gut.", "Zehn Euro bitte."]},
        {"prompt": "Type the German word for 'to understand':", "target": "verstehen", "hint": "Hint: infinitive verb"},
        {"prompt": "Type the German word for 'maybe':", "target": "vielleicht", "hint": "Hint: expresses uncertainty"},
        {"prompt": "_______ Sie mich gut?", "en": "Do you understand me well?", "options": ["Verstehen", "Kommen", "Haben"], "answer": "Verstehen"},
        {"prompt": "Ja, das _______ genau.", "en": "Yes, that is exactly right.", "options": ["stimmt", "heißt", "bist"], "answer": "stimmt"}
    ))

    # Unit 11: Farben der Welt
    units.append(make_unit(
        11, 1, "Farben der Welt", "Describe colors", "#CE82FF",
        [{"de": "blau", "en": "blue"}, {"de": "rot", "en": "red"}, {"de": "grün", "en": "green"}, {"de": "gelb", "en": "yellow"}],
        [{"de": "schwarz", "en": "black"}, {"de": "weiß", "en": "white"}, {"de": "braun", "en": "brown"}, {"de": "grau", "en": "gray"}],
        [{"de": "Farbe", "en": "color"}, {"de": "bunt", "en": "colorful"}, {"de": "hell", "en": "light / bright"}, {"de": "dunkel", "en": "dark"}],
        [{"de": "Auto", "en": "car"}, {"de": "Tasche", "en": "bag"}, {"de": "gefallen", "en": "to please / like"}, {"de": "schön", "en": "beautiful"}],
        {"de": "Mein neues Auto ist blau.", "en": "My new car is blue."},
        {"de": "Die rote Tasche ist sehr schön.", "en": "The red bag is very beautiful."},
        {"de": "Das Gras im Park ist grün.", "en": "The grass in the park is green."},
        {"de": "Welche Farbe gefällt dir am besten?", "en": "Which color do you like best?"},
        {"de": "Ich mag gelb und dunkelblau sehr gern.", "en": "I like yellow and dark blue very much."},
        {"de": "Die bunte Blume ist weiß und rot.", "en": "The colorful flower is white and red."},
        {"partner": "Sarah", "prompt": "Welche Farbe gefällt dir?", "translation": "Which color do you like?", "options": ["Blau gefällt mir sehr gut.", "Ich bin zwanzig."]},
        {"partner": "Sarah", "prompt": "Ist dein Auto rot?", "translation": "Is your car red?", "options": ["Nein, mein Auto ist schwarz.", "Sehr gern geschehen."]},
        {"prompt": "Type the German word for 'blue':", "target": "blau", "hint": "Hint: color of the sky"},
        {"prompt": "Type the German word for 'red':", "target": "rot", "hint": "Hint: color of strawberries"},
        {"prompt": "Mein neues Auto ist _______.", "en": "My new car is blue.", "options": ["blau", "Auto", "Farbe"], "answer": "blau"},
        {"prompt": "Welche _______ gefällt dir?", "en": "Which color do you like?", "options": ["Farbe", "Buch", "Name"], "answer": "Farbe"}
    ))

    # Unit 12: Im Supermarkt: Obst
    units.append(make_unit(
        12, 1, "Im Supermarkt: Obst", "Buy fresh fruit", "#FF4B4B",
        [{"de": "Apfel", "en": "apple"}, {"de": "Banane", "en": "banana"}, {"de": "Orange", "en": "orange"}, {"de": "Zitrone", "en": "lemon"}],
        [{"de": "Birne", "en": "pear"}, {"de": "Erdbeere", "en": "strawberry"}, {"de": "Obst", "en": "fruit"}, {"de": "frisch", "en": "fresh"}],
        [{"de": "kaufen", "en": "to buy"}, {"de": "Supermarkt", "en": "supermarket"}, {"de": "Kilo", "en": "kilo"}, {"de": "Stück", "en": "piece"}],
        [{"de": "lecker", "en": "delicious"}, {"de": "süß", "en": "sweet"}, {"de": "sauer", "en": "sour"}, {"de": "Markt", "en": "market"}],
        {"de": "Ich kaufe einen frischen Apfel.", "en": "I buy a fresh apple."},
        {"de": "Die Banane ist gelb und süß.", "en": "The banana is yellow and sweet."},
        {"de": "Ein Kilo Orangen kostet drei Euro.", "en": "A kilo of oranges costs three euros."},
        {"de": "Möchten Sie auch frische Birnen kaufen?", "en": "Would you like to buy fresh pears too?"},
        {"de": "Das Obst auf dem Markt ist sehr lecker.", "en": "The fruit at the market is very delicious."},
        {"de": "Ich nehme zwei Kilo Erdbeeren und Zitronen.", "en": "I take two kilos of strawberries and lemons."},
        {"partner": "Verkäufer", "prompt": "Guten Tag! Was möchten Sie kaufen?", "translation": "Good day! What would you like to buy?", "options": ["Zwei Kilo Äpfel, bitte.", "Ich wohne in Berlin."]},
        {"partner": "Verkäufer", "prompt": "Möchten Sie auch Bananen?", "translation": "Would you like bananas too?", "options": ["Ja, vier Bananen bitte.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'apple':", "target": "Apfel", "hint": "Hint: crisp fruit starting with A"},
        {"prompt": "Type the German word for 'banana':", "target": "Banane", "hint": "Hint: yellow curved fruit"},
        {"prompt": "Ich kaufe einen frischen _______.", "en": "I buy a fresh apple.", "options": ["Apfel", "Euro", "Tee"], "answer": "Apfel"},
        {"prompt": "Ein Kilo Orangen _______ drei Euro.", "en": "A kilo of oranges costs three euros.", "options": ["kostet", "kauft", "schmeckt"], "answer": "kostet"}
    ))

    # Unit 13: Tage der Woche
    units.append(make_unit(
        13, 1, "Tage der Woche", "Days of the week", "#00CD9C",
        [{"de": "Montag", "en": "Monday"}, {"de": "Dienstag", "en": "Tuesday"}, {"de": "Mittwoch", "en": "Wednesday"}, {"de": "Donnerstag", "en": "Thursday"}],
        [{"de": "Freitag", "en": "Friday"}, {"de": "Samstag", "en": "Saturday"}, {"de": "Sonntag", "en": "Sunday"}, {"de": "Woche", "en": "week"}],
        [{"de": "Wochenende", "en": "weekend"}, {"de": "heute", "en": "today"}, {"de": "morgen", "en": "tomorrow"}, {"de": "gestern", "en": "yesterday"}],
        [{"de": "arbeiten", "en": "to work"}, {"de": "frei", "en": "free / off"}, {"de": "Tag", "en": "day"}, {"de": "jeder", "en": "every"}],
        {"de": "Am Montag arbeite ich gern.", "en": "On Monday I work gladly."},
        {"de": "Dienstag und Mittwoch habe ich Unterricht.", "en": "Tuesday and Wednesday I have class."},
        {"de": "Am Freitag beginnt das Wochenende.", "en": "On Friday the weekend begins."},
        {"de": "Welcher Tag ist heute eigentlich?", "en": "Which day is today actually?"},
        {"de": "Am Samstag und Sonntag habe ich frei.", "en": "On Saturday and Sunday I am off."},
        {"de": "Jede Woche hat genau sieben Tage.", "en": "Every week has exactly seven days."},
        {"partner": "David", "prompt": "Welcher Tag ist heute?", "translation": "Which day is today?", "options": ["Heute ist Mittwoch.", "Ich heiße David."]},
        {"partner": "David", "prompt": "Arbeitest du am Wochenende?", "translation": "Do you work on the weekend?", "options": ["Nein, am Wochenende habe ich frei.", "Zwei Kilo bitte."]},
        {"prompt": "Type the German word for 'Monday':", "target": "Montag", "hint": "Hint: first day of the work week"},
        {"prompt": "Type the German word for 'Friday':", "target": "Freitag", "hint": "Hint: day before Saturday"},
        {"prompt": "Am _______ arbeite ich nicht.", "en": "On Sunday I do not work.", "options": ["Sonntag", "Woche", "heute"], "answer": "Sonntag"},
        {"prompt": "Heute ist _______, morgen ist Donnerstag.", "en": "Today is Wednesday, tomorrow is Thursday.", "options": ["Mittwoch", "Montag", "Freitag"], "answer": "Mittwoch"}
    ))

    # Unit 14: Mein Lieblingstag
    units.append(make_unit(
        14, 1, "Mein Lieblingstag", "Daily routine basics", "#FFC800",
        [{"de": "Lieblingstag", "en": "favorite day"}, {"de": "Morgen", "en": "morning"}, {"de": "Mittag", "en": "noon"}, {"de": "Abend", "en": "evening"}],
        [{"de": "früh", "en": "early"}, {"de": "spät", "en": "late"}, {"de": "aufstehen", "en": "to get up"}, {"de": "schlafen", "en": "to sleep"}],
        [{"de": "Zeit", "en": "time"}, {"de": "Pause", "en": "break"}, {"de": "Freizeit", "en": "leisure time"}, {"de": "Ruhe", "en": "peace / quiet"}],
        [{"de": "genießen", "en": "to enjoy"}, {"de": "immer", "en": "always"}, {"de": "oft", "en": "often"}, {"de": "manchmal", "en": "sometimes"}],
        {"de": "Freitag ist mein Lieblingstag.", "en": "Friday is my favorite day."},
        {"de": "Am Morgen stehe ich früh auf.", "en": "In the morning I get up early."},
        {"de": "Am Abend habe ich viel Freizeit.", "en": "In the evening I have lots of free time."},
        {"de": "Was machst du an deinem Lieblingstag?", "en": "What do you do on your favorite day?"},
        {"de": "Ich genieße die Ruhe am Sonntag sehr.", "en": "I enjoy the peace on Sunday very much."},
        {"de": "Am Mittag mache ich eine lange Pause.", "en": "At noon I take a long break."},
        {"partner": "Clara", "prompt": "Was ist dein Lieblingstag?", "translation": "What is your favorite day?", "options": ["Samstag ist mein Lieblingstag.", "Drei Euro bitte."]},
        {"partner": "Clara", "prompt": "Stehst du früh auf?", "translation": "Do you get up early?", "options": ["Nein, ich schlafe gern lange.", "Guten Tag!"]},
        {"prompt": "Type the German word for 'morning':", "target": "Morgen", "hint": "Hint: begins with M"},
        {"prompt": "Type the German word for 'evening':", "target": "Abend", "hint": "Hint: time after work"},
        {"prompt": "Freitag ist mein _______.", "en": "Friday is my favorite day.", "options": ["Lieblingstag", "Pause", "Morgen"], "answer": "Lieblingstag"},
        {"prompt": "Am Abend habe ich viel _______.", "en": "In the evening I have lots of free time.", "options": ["Freizeit", "früh", "spät"], "answer": "Freizeit"}
    ))

    # Unit 15: Einfache Hobbys
    units.append(make_unit(
        15, 1, "Einfache Hobbys", "Talk about basic hobbies", "#1CB0F6",
        [{"de": "Fußball", "en": "soccer"}, {"de": "Musik", "en": "music"}, {"de": "Sport", "en": "sports"}, {"de": "Hobby", "en": "hobby"}],
        [{"de": "spielen", "en": "to play"}, {"de": "hören", "en": "to listen"}, {"de": "tanzen", "en": "to dance"}, {"de": "singen", "en": "to sing"}],
        [{"de": "schwimmen", "en": "to swim"}, {"de": "kochen", "en": "to cook"}, {"de": "lesen", "en": "to read"}, {"de": "reisen", "en": "to travel"}],
        [{"de": "Freunde", "en": "friends"}, {"de": "Spaß", "en": "fun"}, {"de": "zusammen", "en": "together"}, {"de": "toll", "en": "great"}],
        {"de": "Ich spiele sehr gern Fußball.", "en": "I play soccer very gladly."},
        {"de": "Meine Schwester hört gern Musik.", "en": "My sister likes listening to music."},
        {"de": "Wir kochen am Wochenende zusammen.", "en": "We cook together on the weekend."},
        {"de": "Hast du ein schönes Hobby?", "en": "Do you have a nice hobby?"},
        {"de": "Sport mit Freunden macht viel Spaß.", "en": "Sports with friends is lots of fun."},
        {"de": "Ich schwimme und lese jeden Tag gern.", "en": "I swim and read gladly every day."},
        {"partner": "Felix", "prompt": "Hast du ein schönes Hobby?", "translation": "Do you have a nice hobby?", "options": ["Ja, ich spiele gern Fußball.", "Ich wohne in Frankfurt."]},
        {"partner": "Felix", "prompt": "Spielst du auch Tennis?", "translation": "Do you also play tennis?", "options": ["Nein, aber ich schwimme gern.", "Danke schön!"]},
        {"prompt": "Type the German word for 'soccer':", "target": "Fußball", "hint": "Hint: has sharp s ß"},
        {"prompt": "Type the German word for 'to play':", "target": "spielen", "hint": "Hint: infinitive verb"},
        {"prompt": "Ich _______ sehr gern Fußball.", "en": "I play soccer very gladly.", "options": ["spiele", "höre", "koche"], "answer": "spiele"},
        {"prompt": "Sport mit Freunden macht _______.", "en": "Sports with friends is lots of fun.", "options": ["Spaß", "Hobby", "Musik"], "answer": "Spaß"}
    ))

    # Unit 16: Gern oder nicht gern?
    units.append(make_unit(
        16, 1, "Gern oder nicht gern?", "Express likes and dislikes", "#58CC02",
        [{"de": "gern", "en": "gladly / like"}, {"de": "lieber", "en": "rather / prefer"}, {"de": "am liebsten", "en": "most of all"}, {"de": "mögen", "en": "to like"}],
        [{"de": "hassen", "en": "to hate"}, {"de": "finden", "en": "to find / consider"}, {"de": "interessant", "en": "interesting"}, {"de": "langweilig", "en": "boring"}],
        [{"de": "wandern", "en": "to hike"}, {"de": "malen", "en": "to paint"}, {"de": "fotografieren", "en": "to take photos"}, {"de": "joggen", "en": "to jog"}],
        [{"de": "Lieblingsbuch", "en": "favorite book"}, {"de": "Film", "en": "movie"}, {"de": "Kino", "en": "cinema"}, {"de": "gar nicht", "en": "not at all"}],
        {"de": "Ich lese sehr gern Bücher.", "en": "I read books very gladly."},
        {"de": "Ich trinke lieber Tee als Kaffee.", "en": "I prefer drinking tea to coffee."},
        {"de": "Am liebsten gehe ich ins Kino.", "en": "Most of all I like going to the cinema."},
        {"de": "Kochen Sie auch gern am Abend?", "en": "Do you also cook gladly in the evening?"},
        {"de": "Das Buch finde ich wirklich sehr interessant.", "en": "I find the book really very interesting."},
        {"de": "Ich jogge gar nicht gern im Regen.", "en": "I do not like jogging in the rain at all."},
        {"partner": "Nina", "prompt": "Liest du gern Bücher?", "translation": "Do you like reading books?", "options": ["Ja, ich lese sehr gern Romane.", "Heute ist Montag."]},
        {"partner": "Nina", "prompt": "Trinkst du lieber Kaffee oder Tee?", "translation": "Do you prefer drinking coffee or tea?", "options": ["Ich trinke lieber Kaffee.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'gladly / with pleasure':", "target": "gern", "hint": "Hint: 4 letters starting with g"},
        {"prompt": "Type the German word for 'prefer / rather':", "target": "lieber", "hint": "Hint: comparative of gern"},
        {"prompt": "Ich trinke _______ Tee als Kaffee.", "en": "I prefer drinking tea to coffee.", "options": ["lieber", "gern", "gar"], "answer": "lieber"},
        {"prompt": "Ich jogge _______ nicht gern im Regen.", "en": "I do not like jogging in the rain at all.", "options": ["gar", "sehr", "am"], "answer": "gar"}
    ))

    # Unit 17: Klassenzimmer & Lernen
    units.append(make_unit(
        17, 1, "Klassenzimmer & Lernen", "Classroom and study items", "#FF9600",
        [{"de": "Buch", "en": "book"}, {"de": "Stift", "en": "pen"}, {"de": "Heft", "en": "notebook"}, {"de": "Tisch", "en": "table"}],
        [{"de": "Stuhl", "en": "chair"}, {"de": "Tafel", "en": "blackboard"}, {"de": "Lehrer", "en": "teacher"}, {"de": "Schüler", "en": "student"}],
        [{"de": "schreiben", "en": "to write"}, {"de": "üben", "en": "to practice"}, {"de": "wiederholen", "en": "to review"}, {"de": "Hausaufgabe", "en": "homework"}],
        [{"de": "Wörterbuch", "en": "dictionary"}, {"de": "Seite", "en": "page"}, {"de": "öffnen", "en": "to open"}, {"de": "schließen", "en": "to close"}],
        {"de": "Das ist mein deutsches Buch.", "en": "That is my German book."},
        {"de": "Ich schreibe mit einem Stift.", "en": "I write with a pen."},
        {"de": "Der Lehrer erklärt die Grammatik.", "en": "The teacher explains the grammar."},
        {"de": "Wo ist das Wörterbuch auf Deutsch?", "en": "Where is the German dictionary?"},
        {"de": "Wir üben jeden Tag neue Vokabeln.", "en": "We practice new vocabulary every day."},
        {"de": "Bitte öffnen Sie das Buch auf Seite zehn.", "en": "Please open the book to page ten."},
        {"partner": "Lehrer", "prompt": "Haben Sie Ihre Hausaufgabe gemacht?", "translation": "Have you done your homework?", "options": ["Ja, ich habe alles geübt.", "Ich wohne in Köln."]},
        {"partner": "Lehrer", "prompt": "Wo ist dein Kugelschreiber?", "translation": "Where is your ballpoint pen?", "options": ["Hier auf meinem Tisch.", "Sehr gern geschehen."]},
        {"prompt": "Type the German word for 'book':", "target": "Buch", "hint": "Hint: reading item"},
        {"prompt": "Type the German word for 'teacher':", "target": "Lehrer", "hint": "Hint: classroom educator"},
        {"prompt": "Ich schreibe mit einem _______.", "en": "I write with a pen.", "options": ["Stift", "Stuhl", "Heft"], "answer": "Stift"},
        {"prompt": "Bitte _______ Sie das Buch.", "en": "Please open the book.", "options": ["öffnen", "lernen", "üben"], "answer": "öffnen"}
    ))

    # Unit 18: Negation mit nicht
    units.append(make_unit(
        18, 1, "Negation mit nicht", "Negate actions & adjectives", "#CE82FF",
        [{"de": "nicht", "en": "not"}, {"de": "schwer", "en": "difficult / heavy"}, {"de": "einfach", "en": "easy / simple"}, {"de": "richtig", "en": "correct"}],
        [{"de": "weit", "en": "far"}, {"de": "nah", "en": "near"}, {"de": "kalt", "en": "cold"}, {"de": "heiß", "en": "hot"}],
        [{"de": "müde", "en": "tired"}, {"de": "wach", "en": "awake"}, {"de": "schnell", "en": "fast"}, {"de": "langsam", "en": "slow"}],
        [{"de": "stimmen", "en": "to be correct"}, {"de": "funktionieren", "en": "to function / work"}, {"de": "fertig", "en": "ready / finished"}, {"de": "sicher", "en": "sure"}],
        {"de": "Das ist gar nicht schwer.", "en": "That is not difficult at all."},
        {"de": "Der Kaffee ist heute nicht heiß.", "en": "The coffee is not hot today."},
        {"de": "Ich bin noch nicht fertig.", "en": "I am not ready yet."},
        {"de": "Verstehst du diesen Satz nicht?", "en": "Don't you understand this sentence?"},
        {"de": "Der Bahnhof ist wirklich nicht weit weg.", "en": "The station is really not far away."},
        {"de": "Das stimmt leider nicht, es ist falsch.", "en": "That is unfortunately not correct, it is wrong."},
        {"partner": "Tobias", "prompt": "Ist die deutsche Sprache schwer?", "translation": "Is the German language difficult?", "options": ["Nein, es ist gar nicht so schwer.", "Ich trinke Kaffee."]},
        {"partner": "Tobias", "prompt": "Bist du heute müde?", "translation": "Are you tired today?", "options": ["Nein, ich bin überhaupt nicht müde.", "Fünf Euro bitte."]},
        {"prompt": "Type the German negation word 'not':", "target": "nicht", "hint": "Hint: 5 letters starting with n"},
        {"prompt": "Type the German word for 'difficult':", "target": "schwer", "hint": "Hint: opposite of einfach"},
        {"prompt": "Das ist gar _______ schwer.", "en": "That is not difficult at all.", "options": ["nicht", "kein", "nie"], "answer": "nicht"},
        {"prompt": "Der Bahnhof ist nicht _______ weg.", "en": "The station is not far away.", "options": ["weit", "kalt", "fertig"], "answer": "weit"}
    ))

    # Unit 19: Negation mit kein
    units.append(make_unit(
        19, 1, "Negation mit kein", "Negate nouns with kein", "#FF4B4B",
        [{"de": "kein", "en": "no / not a (masc/neut)"}, {"de": "keine", "en": "no / not a (fem/pl)"}, {"de": "keinen", "en": "no (acc masc)"}, {"de": "Zeit", "en": "time"}],
        [{"de": "Geld", "en": "money"}, {"de": "Problem", "en": "problem"}, {"de": "Hunger", "en": "hunger"}, {"de": "Durst", "en": "thirst"}],
        [{"de": "Auto", "en": "car"}, {"de": "Fahrrad", "en": "bicycle"}, {"de": "Haustier", "en": "pet"}, {"de": "Ahnung", "en": "idea / clue"}],
        [{"de": "haben", "en": "to have"}, {"de": "brauchen", "en": "to need"}, {"de": "leider", "en": "unfortunately"}, {"de": "mehr", "en": "more"}],
        {"de": "Ich habe leider keine Zeit.", "en": "Unfortunately I have no time."},
        {"de": "Wir haben heute kein Geld dabei.", "en": "We have no money with us today."},
        {"de": "Kein Problem, das macht gar nichts!", "en": "No problem, that doesn't matter at all!"},
        {"de": "Hast du wirklich keinen Hunger?", "en": "Are you really not hungry?"},
        {"de": "Ich habe kein Auto und kein Fahrrad.", "en": "I have no car and no bicycle."},
        {"de": "Ich habe leider überhaupt keine Ahnung.", "en": "Unfortunately I have no clue at all."},
        {"partner": "Hannah", "prompt": "Hast du ein Haustier?", "translation": "Do you have a pet?", "options": ["Nein, ich habe leider kein Haustier.", "Heute ist Freitag."]},
        {"partner": "Hannah", "prompt": "Möchtest du etwas essen?", "translation": "Would you like to eat something?", "options": ["Nein danke, ich habe keinen Hunger.", "Guten Abend."]},
        {"prompt": "Type the German negative article for feminine nouns:", "target": "keine", "hint": "Hint: 5 letters ending with e"},
        {"prompt": "Type the German word for 'money':", "target": "Geld", "hint": "Hint: begins with G"},
        {"prompt": "Ich habe leider _______ Zeit.", "en": "Unfortunately I have no time.", "options": ["keine", "kein", "nicht"], "answer": "keine"},
        {"prompt": "Kein _______, gern geschehen!", "en": "No problem, you are welcome!", "options": ["Problem", "Geld", "Hunger"], "answer": "Problem"}
    ))

    # Unit 20: Frühstückszeit
    units.append(make_unit(
        20, 1, "Frühstückszeit", "Talk about breakfast", "#00CD9C",
        [{"de": "Brot", "en": "bread"}, {"de": "Butter", "en": "butter"}, {"de": "Käse", "en": "cheese"}, {"de": "Ei", "en": "egg"}],
        [{"de": "Marmelade", "en": "jam"}, {"de": "Honig", "en": "honey"}, {"de": "Brötchen", "en": "bread roll"}, {"de": "Müsli", "en": "muesli"}],
        [{"de": "essen", "en": "to eat"}, {"de": "frühstücken", "en": "to have breakfast"}, {"de": "Frühstück", "en": "breakfast"}, {"de": "Teller", "en": "plate"}],
        [{"de": "Messer", "en": "knife"}, {"de": "Gabel", "en": "fork"}, {"de": "Löffel", "en": "spoon"}, {"de": "Tasse", "en": "cup"}],
        {"de": "Zum Frühstück esse ich Brot.", "en": "For breakfast I eat bread."},
        {"de": "Ein frisches Brötchen mit Käse.", "en": "A fresh bread roll with cheese."},
        {"de": "Ich trinke morgens Kaffee mit Milch.", "en": "In the morning I drink coffee with milk."},
        {"de": "Was isst du morgens zum Frühstück?", "en": "What do you eat in the morning for breakfast?"},
        {"de": "Ich esse gern ein Ei und Marmelade.", "en": "I like eating an egg and jam."},
        {"de": "Das Frühstück am Sonntag ist herrlich.", "en": "Breakfast on Sunday is wonderful."},
        {"partner": "Kellnerin", "prompt": "Was möchten Sie zum Frühstück?", "translation": "What would you like for breakfast?", "options": ["Zwei Brötchen mit Butter und Käse.", "Ich bin zwanzig Jahre alt."]},
        {"partner": "Kellnerin", "prompt": "Möchten Sie auch ein gekochtes Ei?", "translation": "Would you also like a boiled egg?", "options": ["Ja, ein Ei bitte.", "Tschüss auf Wiedersehen."]},
        {"prompt": "Type the German word for 'bread':", "target": "Brot", "hint": "Hint: staple breakfast food"},
        {"prompt": "Type the German word for 'cheese':", "target": "Käse", "hint": "Hint: dairy slice with Umlaut ä"},
        {"prompt": "Zum Frühstück _______ ich Brot mit Butter.", "en": "For breakfast I eat bread with butter.", "options": ["esse", "trinke", "wohne"], "answer": "esse"},
        {"prompt": "Ein frisches _______ mit Marmelade.", "en": "A fresh bread roll with jam.", "options": ["Brötchen", "Gabel", "Löffel"], "answer": "Brötchen"}
    ))

    # Unit 21: Zahlen bis 100
    units.append(make_unit(
        21, 1, "Zahlen bis 100", "Count up to 100", "#FFC800",
        [{"de": "dreißig", "en": "thirty"}, {"de": "vierzig", "en": "forty"}, {"de": "fünfzig", "en": "fifty"}, {"de": "sechzig", "en": "sixty"}],
        [{"de": "siebzig", "en": "seventy"}, {"de": "achtzig", "en": "eighty"}, {"de": "neunzig", "en": "ninety"}, {"de": "hundert", "en": "hundred"}],
        [{"de": "einundzwanzig", "en": "twenty-one"}, {"de": "fünfunddreißig", "en": "thirty-five"}, {"de": "Zahl", "en": "number"}, {"de": "zählen", "en": "to count"}],
        [{"de": "Alter", "en": "age"}, {"de": "Hausnummer", "en": "house number"}, {"de": "Kilometer", "en": "kilometer"}, {"de": "hoch", "en": "high"}],
        {"de": "Das macht genau fünfzig Euro.", "en": "That makes exactly fifty euros."},
        {"de": "Mein Großvater ist achtzig Jahre alt.", "en": "My grandfather is eighty years old."},
        {"de": "In dem Buch sind hundert Seiten.", "en": "There are one hundred pages in the book."},
        {"de": "Wie alt ist Ihre Großmutter?", "en": "How old is your grandmother?"},
        {"de": "Ich wohne in der Goethestraße Nummer fünfundvierzig.", "en": "I live on Goethe street number 45."},
        {"de": "Wir zählen zusammen von eins bis hundert.", "en": "We count together from one to one hundred."},
        {"partner": "Verkäufer", "prompt": "Das macht zusammen achtzig Euro, bitte.", "translation": "That makes eighty euros altogether, please.", "options": ["Hier sind hundert Euro.", "Ich habe einen Bruder."]},
        {"partner": "Verkäufer", "prompt": "Wie alt ist das Buch?", "translation": "How old is the book?", "options": ["Es ist fast fünfzig Jahre alt.", "Danke sehr."]},
        {"prompt": "Type the German word for number 50:", "target": "fünfzig", "hint": "Hint: starts with f and umlaut ü"},
        {"prompt": "Type the German word for number 100:", "target": "hundert", "hint": "Hint: century number"},
        {"prompt": "Das macht genau _______ Euro.", "en": "That makes exactly fifty euros.", "options": ["fünfzig", "Zahl", "hoch"], "answer": "fünfzig"},
        {"prompt": "Mein Opa ist _______ Jahre alt.", "en": "My grandpa is eighty years old.", "options": ["achtzig", "hundert", "Alter"], "answer": "achtzig"}
    ))

    # Unit 22: Tageszeiten & Begrüßung
    units.append(make_unit(
        22, 1, "Tageszeiten & Begrüßung", "Times of day", "#1CB0F6",
        [{"de": "Morgen", "en": "morning"}, {"de": "Vormittag", "en": "late morning"}, {"de": "Mittag", "en": "noon"}, {"de": "Nachmittag", "en": "afternoon"}],
        [{"de": "Abend", "en": "evening"}, {"de": "Nacht", "en": "night"}, {"de": "Mitternacht", "en": "midnight"}, {"de": "früh", "en": "early"}],
        [{"de": "Guten Morgen", "en": "Good morning"}, {"de": "Mahlzeit", "en": "blessed mealtime"}, {"de": "Guten Abend", "en": "Good evening"}, {"de": "Gute Nacht", "en": "Good night"}],
        [{"de": "beginnen", "en": "to begin"}, {"de": "enden", "en": "to end"}, {"de": "Tag", "en": "day"}, {"de": "hell", "en": "bright"}],
        {"de": "Am Abend koche ich gern.", "en": "In the evening I cook gladly."},
        {"de": "Am Vormittag arbeite ich im Büro.", "en": "In the late morning I work in the office."},
        {"de": "Am Nachmittag trinke ich Kaffee.", "en": "In the afternoon I drink coffee."},
        {"de": "Was machst du heute Abend?", "en": "What are you doing this evening?"},
        {"de": "Guten Morgen! Ein wunderschöner neuer Tag beginnt.", "en": "Good morning! A wonderful new day begins."},
        {"de": "Gute Nacht und schlaf sehr gut!", "en": "Good night and sleep very well!"},
        {"partner": "Kollege", "prompt": "Was machst du heute Nachmittag?", "translation": "What are you doing this afternoon?", "options": ["Ich habe ein Meeting um drei Uhr.", "Ich komme aus Spanien."]},
        {"partner": "Kollege", "prompt": "Gehen wir heute Abend essen?", "translation": "Are we going out to eat this evening?", "options": ["Ja, sehr gern, um sieben Uhr!", "Nein danke, tschüss."]},
        {"prompt": "Type the German word for 'evening':", "target": "Abend", "hint": "Hint: time before night"},
        {"prompt": "Type the German word for 'night':", "target": "Nacht", "hint": "Hint: dark time to sleep"},
        {"prompt": "Am _______ koche ich ein leckeres Essen.", "en": "In the evening I cook a delicious meal.", "options": ["Abend", "früh", "hell"], "answer": "Abend"},
        {"prompt": "Am Vormittag _______ mein Deutschkurs.", "en": "In the late morning my German course begins.", "options": ["beginnt", "schläft", "endet"], "answer": "beginnt"}
    ))

    # Unit 23: Uhrzeit: Offiziell
    units.append(make_unit(
        23, 1, "Uhrzeit: Offiziell", "Tell formal time", "#58CC02",
        [{"de": "Uhr", "en": "clock / o'clock"}, {"de": "Minute", "en": "minute"}, {"de": "Sekunde", "en": "second"}, {"de": "Stunde", "en": "hour"}],
        [{"de": "offiziell", "en": "official"}, {"de": "genau", "en": "exact / exactly"}, {"de": "beginnen", "en": "to start"}, {"de": "Abfahrt", "en": "departure"}],
        [{"de": "Ankunft", "en": "arrival"}, {"de": "Fahrplan", "en": "schedule"}, {"de": "pünktlich", "en": "punctual"}, {"de": "Verspätung", "en": "delay"}],
        [{"de": "Wie viel Uhr", "en": "What time"}, {"de": "Um wie viel Uhr", "en": "At what time"}, {"de": "wann", "en": "when"}, {"de": "spät", "en": "late"}],
        {"de": "Es ist genau zehn Uhr.", "en": "It is exactly ten o'clock."},
        {"de": "Der Zug fährt um vierzehn Uhr ab.", "en": "The train departs at 14:00."},
        {"de": "Die Ankunft ist um sechzehn Uhr dreißig.", "en": "Arrival is at 16:30."},
        {"de": "Um wie viel Uhr beginnt der Kurs?", "en": "At what time does the course begin?"},
        {"de": "Der Deutschkurs beginnt um neun Uhr morgens.", "en": "The German course begins at nine in the morning."},
        {"de": "Der Bus kommt pünktlich um zwölf Uhr.", "en": "The bus arrives punctually at twelve o'clock."},
        {"partner": "Schaffner", "prompt": "Um wie viel Uhr fährt der Zug ab?", "translation": "At what time does the train depart?", "options": ["Der Zug fährt um dreizehn Uhr fünfzehn ab.", "Ich esse einen Apfel."]},
        {"partner": "Schaffner", "prompt": "Ist der Zug pünktlich?", "translation": "Is the train on time?", "options": ["Ja, er hat keine Verspätung.", "Danke schön!"]},
        {"prompt": "Type the German word for 'o'clock / clock':", "target": "Uhr", "hint": "Hint: 3 letters starting with U"},
        {"prompt": "Type the German word for 'punctual':", "target": "pünktlich", "hint": "Hint: on time with Umlaut ü"},
        {"prompt": "Es ist genau zehn _______.", "en": "It is exactly ten o'clock.", "options": ["Uhr", "Minute", "Sekunde"], "answer": "Uhr"},
        {"prompt": "Um wie viel Uhr _______ der Kurs?", "en": "At what time does the course begin?", "options": ["beginnt", "fährt", "kostet"], "answer": "beginnt"}
    ))

    # Unit 24: Uhrzeit: Alltagssprache
    units.append(make_unit(
        24, 1, "Uhrzeit: Alltagssprache", "Tell casual time", "#FF9600",
        [{"de": "halb", "en": "half past (half to next)"}, {"de": "Viertel", "en": "quarter"}, {"de": "nach", "en": "past / after"}, {"de": "vor", "en": "to / before"}],
        [{"de": "kurz", "en": "shortly"}, {"de": "gleich", "en": "right away / soon"}, {"de": "treffen", "en": "to meet"}, {"de": "Verabredung", "en": "date / appointment"}],
        [{"de": "Mittagspause", "en": "lunch break"}, {"de": "Feierabend", "en": "end of work day"}, {"de": "Zeit", "en": "time"}, {"de": "früh", "en": "early"}],
        [{"de": "schon", "en": "already"}, {"de": "erst", "en": "only / not until"}, {"de": "warten", "en": "to wait"}, {"de": "Eile", "en": "hurry"}],
        {"de": "Es ist jetzt halb acht.", "en": "It is now half past seven."},
        {"de": "Es ist Viertel nach drei.", "en": "It is quarter past three."},
        {"de": "Es ist Viertel vor sechs.", "en": "It is quarter to six."},
        {"de": "Wann treffen wir uns heute?", "en": "When do we meet today?"},
        {"de": "Wir treffen uns um kurz vor acht.", "en": "We meet shortly before eight."},
        {"de": "Endlich Feierabend, es ist fünf Uhr!", "en": "Finally end of workday, it is five o'clock!"},
        {"partner": "Klaus", "prompt": "Wie spät ist es jetzt?", "translation": "How late is it right now?", "options": ["Es ist Viertel vor vier.", "Ich bin müde."]},
        {"partner": "Klaus", "prompt": "Wann treffen wir uns im Café?", "translation": "When do we meet in the café?", "options": ["Um halb fünf am Nachmittag.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'half' (time):", "target": "halb", "hint": "Hint: 4 letters starting with h"},
        {"prompt": "Type the German word for 'quarter' (time):", "target": "Viertel", "hint": "Hint: capital V, 15 minutes"},
        {"prompt": "Es ist jetzt _______ acht.", "en": "It is now half past seven.", "options": ["halb", "nach", "vor"], "answer": "halb"},
        {"prompt": "Es ist Viertel _______ drei.", "en": "It is quarter past three.", "options": ["nach", "vor", "halb"], "answer": "nach"}
    ))

    # Unit 25: Mein Beruf
    units.append(make_unit(
        25, 1, "Mein Beruf", "Describe professions", "#CE82FF",
        [{"de": "Lehrer", "en": "teacher"}, {"de": "Arzt", "en": "doctor"}, {"de": "Kellner", "en": "waiter"}, {"de": "Ingenieur", "en": "engineer"}],
        [{"de": "Student", "en": "student"}, {"de": "Verkäufer", "en": "salesperson"}, {"de": "Koch", "en": "chef / cook"}, {"de": "Polizist", "en": "police officer"}],
        [{"de": "Beruf", "en": "profession"}, {"de": "Arbeit", "en": "work / job"}, {"de": "arbeiten", "en": "to work"}, {"de": "studieren", "en": "to study (university)"}],
        [{"de": "von Beruf", "en": "by profession"}, {"de": "als", "en": "as"}, {"de": "Job", "en": "job"}, {"de": "Kollege", "en": "colleague"}],
        {"de": "Ich bin Lehrer von Beruf.", "en": "I am a teacher by profession."},
        {"de": "Meine Schwester arbeitet als Ärztin.", "en": "My sister works as a doctor."},
        {"de": "Er studiert Informatik in München.", "en": "He studies computer science in Munich."},
        {"de": "Was sind Sie von Beruf?", "en": "What is your profession?"},
        {"de": "Ich arbeite als Ingenieur bei einer Firma.", "en": "I work as an engineer at a company."},
        {"de": "Mein Kollege ist ein sehr guter Koch.", "en": "My colleague is a very good chef."},
        {"partner": "Frau Klein", "prompt": "Was sind Sie von Beruf?", "translation": "What is your profession?", "options": ["Ich bin Lehrerin von Beruf.", "Ich trinke Kaffee."]},
        {"partner": "Frau Klein", "prompt": "Arbeiten Sie gern in Ihrem Job?", "translation": "Do you enjoy working in your job?", "options": ["Ja, meine Arbeit macht mir viel Spaß.", "Fünf Euro bitte."]},
        {"prompt": "Type the German word for 'profession':", "target": "Beruf", "hint": "Hint: occupation noun"},
        {"prompt": "Type the German word for 'doctor' (male):", "target": "Arzt", "hint": "Hint: medical professional"},
        {"prompt": "Ich bin Lehrer von _______.", "en": "I am a teacher by profession.", "options": ["Beruf", "Arbeit", "Job"], "answer": "Beruf"},
        {"prompt": "Meine Schwester arbeitet _______ Ärztin.", "en": "My sister works as a doctor.", "options": ["als", "von", "in"], "answer": "als"}
    ))

    # Unit 26: Wo arbeitest du?
    units.append(make_unit(
        26, 1, "Wo arbeitest du?", "Describe workplaces", "#FF4B4B",
        [{"de": "Büro", "en": "office"}, {"de": "Schule", "en": "school"}, {"de": "Krankenhaus", "en": "hospital"}, {"de": "Restaurant", "en": "restaurant"}],
        [{"de": "Firma", "en": "company"}, {"de": "Fabrik", "en": "factory"}, {"de": "Geschäft", "en": "store / shop"}, {"de": "Universität", "en": "university"}],
        [{"de": "Arbeitsplatz", "en": "workplace"}, {"de": "Chef", "en": "boss"}, {"de": "Team", "en": "team"}, {"de": "Projekt", "en": "project"}],
        [{"de": "arbeiten", "en": "to work"}, {"de": "in", "en": "in"}, {"de": "bei", "en": "at / with"}, {"de": "Zentrum", "en": "center"}],
        {"de": "Ich arbeite in einem Büro.", "en": "I work in an office."},
        {"de": "Der Arzt arbeitet im Krankenhaus.", "en": "The doctor works in the hospital."},
        {"de": "Meine Mutter arbeitet an einer Schule.", "en": "My mother works at a school."},
        {"de": "Arbeitest du in der Stadt?", "en": "Do you work in the city?"},
        {"de": "Unser Büro liegt direkt im Zentrum.", "en": "Our office is located right in the center."},
        {"de": "Ich habe ein tolles Team in der Firma.", "en": "I have a great team in the company."},
        {"partner": "Martin", "prompt": "Wo arbeitest du genau?", "translation": "Where exactly do you work?", "options": ["Ich arbeite in einem Büro in Hamburg.", "Ich habe zwei Schwestern."]},
        {"partner": "Martin", "prompt": "Ist dein Chef nett?", "translation": "Is your boss nice?", "options": ["Ja, mein Chef ist sehr freundlich.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'office':", "target": "Büro", "hint": "Hint: desk workplace with Umlaut ü"},
        {"prompt": "Type the German word for 'hospital':", "target": "Krankenhaus", "hint": "Hint: building for sick people"},
        {"prompt": "Ich arbeite in einem _______.", "en": "I work in an office.", "options": ["Büro", "Schule", "Firma"], "answer": "Büro"},
        {"prompt": "Der Arzt arbeitet im _______.", "en": "The doctor works in the hospital.", "options": ["Krankenhaus", "Restaurant", "Fabrik"], "answer": "Krankenhaus"}
    ))

    # Unit 27: Tiere im Alltag
    units.append(make_unit(
        27, 1, "Tiere im Alltag", "Domestic animals and pets", "#00CD9C",
        [{"de": "Hund", "en": "dog"}, {"de": "Katze", "en": "cat"}, {"de": "Vogel", "en": "bird"}, {"de": "Fisch", "en": "fish"}],
        [{"de": "Pferd", "en": "horse"}, {"de": "Kaninchen", "en": "rabbit"}, {"de": "Maus", "en": "mouse"}, {"de": "Tier", "en": "animal"}],
        [{"de": "Haustier", "en": "pet"}, {"de": "füttern", "en": "to feed"}, {"de": "bellen", "en": "to bark"}, {"de": "spielen", "en": "to play"}],
        [{"de": "süß", "en": "cute / sweet"}, {"de": "treu", "en": "loyal"}, {"de": "klein", "en": "small"}, {"de": "Garten", "en": "garden"}],
        {"de": "Mein Hund heißt Bello.", "en": "My dog is called Bello."},
        {"de": "Die kleine Katze schläft auf dem Sofa.", "en": "The little cat sleeps on the sofa."},
        {"de": "Ich habe zwei bunte Fische.", "en": "I have two colorful fish."},
        {"de": "Hast du auch eine Katze?", "en": "Do you also have a cat?"},
        {"de": "Mein Hund ist sehr treu und spielt im Garten.", "en": "My dog is very loyal and plays in the garden."},
        {"de": "Jeden Morgen füttere ich mein Haustier.", "en": "Every morning I feed my pet."},
        {"partner": "Lena", "prompt": "Hast du ein Haustier?", "translation": "Do you have a pet?", "options": ["Ja, ich habe einen lieben Hund.", "Ich esse Käse."]},
        {"partner": "Lena", "prompt": "Wie heißt dein Hund?", "translation": "What is your dog's name?", "options": ["Mein Hund heißt Bello.", "Danke sehr."]},
        {"prompt": "Type the German word for 'dog':", "target": "Hund", "hint": "Hint: barking pet"},
        {"prompt": "Type the German word for 'cat':", "target": "Katze", "hint": "Hint: purring pet"},
        {"prompt": "Mein _______ heißt Bello.", "en": "My dog is called Bello.", "options": ["Hund", "Katze", "Vogel"], "answer": "Hund"},
        {"prompt": "Die kleine Katze ist wirklich sehr _______.", "en": "The little cat is really very cute.", "options": ["süß", "treu", "bellen"], "answer": "süß"}
    ))

    # Unit 28: Einfache Gefühle
    units.append(make_unit(
        28, 1, "Einfache Gefühle", "Express basic emotions", "#FFC800",
        [{"de": "glücklich", "en": "happy"}, {"de": "traurig", "en": "sad"}, {"de": "müde", "en": "tired"}, {"de": "fit", "en": "fit / energetic"}],
        [{"de": "böse", "en": "angry / mean"}, {"de": "nervös", "en": "nervous"}, {"de": "ruhig", "en": "calm"}, {"de": "Gefühl", "en": "feeling"}],
        [{"de": "fühlen", "en": "to feel"}, {"de": "freuen", "en": "to be glad / rejoice"}, {"de": "lachen", "en": "to laugh"}, {"de": "weinen", "en": "to cry"}],
        [{"de": "heute", "en": "today"}, {"de": "warum", "en": "why"}, {"de": "sehr", "en": "very"}, {"de": "Laune", "en": "mood"}],
        {"de": "Ich bin heute sehr glücklich.", "en": "I am very happy today."},
        {"de": "Er ist nach der Arbeit müde.", "en": "He is tired after work."},
        {"de": "Wir freuen uns über das Geschenk.", "en": "We are glad about the gift."},
        {"de": "Bist du heute auch so müde?", "en": "Are you also so tired today?"},
        {"de": "Sie hat heute wirklich gute Laune.", "en": "She is in a really good mood today."},
        {"de": "Ich fühle mich heute fit und ruhig.", "en": "I feel fit and calm today."},
        {"partner": "Sven", "prompt": "Wie geht es dir heute?", "translation": "How are you today?", "options": ["Ich bin sehr glücklich und fit!", "Ich trinke Tee."]},
        {"partner": "Sven", "prompt": "Bist du nervös vor der Prüfung?", "translation": "Are you nervous before the exam?", "options": ["Ein bisschen, aber ich bleibe ruhig.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'happy':", "target": "glücklich", "hint": "Hint: has Umlaut ü"},
        {"prompt": "Type the German word for 'tired':", "target": "müde", "hint": "Hint: needs sleep with Umlaut ü"},
        {"prompt": "Ich bin heute sehr _______.", "en": "I am very happy today.", "options": ["glücklich", "müde", "Gefühl"], "answer": "glücklich"},
        {"prompt": "Sie hat heute wirklich gute _______.", "en": "She is in a really good mood today.", "options": ["Laune", "Ruhe", "Zeit"], "answer": "Laune"}
    ))

    # Unit 29: Getränke & Durst
    units.append(make_unit(
        29, 1, "Getränke & Durst", "Drinks and thirst", "#1CB0F6",
        [{"de": "Saft", "en": "juice"}, {"de": "Mineralwasser", "en": "mineral water"}, {"de": "Bier", "en": "beer"}, {"de": "Wein", "en": "wine"}],
        [{"de": "Durst", "en": "thirst"}, {"de": "trinken", "en": "to drink"}, {"de": "Getränk", "en": "beverage / drink"}, {"de": "Flasche", "en": "bottle"}],
        [{"de": "Glas", "en": "glass"}, {"de": "kalt", "en": "cold"}, {"de": "warm", "en": "warm"}, {"de": "Kohlensäure", "en": "carbonation"}],
        [{"de": "still", "en": "still (non-carbonated)"}, {"de": "Durst haben", "en": "to be thirsty"}, {"de": "bestellen", "en": "to order"}, {"de": "bitte", "en": "please"}],
        {"de": "Ich trinke ein Glas Saft.", "en": "I drink a glass of juice."},
        {"de": "Ein Mineralwasser ohne Kohlensäure, bitte.", "en": "A still mineral water, please."},
        {"de": "Ich habe großen Durst nach dem Sport.", "en": "I am very thirsty after sports."},
        {"de": "Hast du auch großen Durst?", "en": "Are you also very thirsty?"},
        {"de": "Möchten Sie eine kalte Flasche Wasser?", "en": "Would you like a cold bottle of water?"},
        {"de": "Wir bestellen zwei Gläser Apfelsaft.", "en": "We order two glasses of apple juice."},
        {"partner": "Kellner", "prompt": "Was möchten Sie trinken?", "translation": "What would you like to drink?", "options": ["Ein Glas Orangensaft, bitte.", "Ich habe einen Hund."]},
        {"partner": "Kellner", "prompt": "Mit oder ohne Kohlensäure?", "translation": "Sparkling or still?", "options": ["Ein stilles Wasser, bitte.", "Danke schön."]},
        {"prompt": "Type the German word for 'juice':", "target": "Saft", "hint": "Hint: fruit drink noun"},
        {"prompt": "Type the German word for 'thirst':", "target": "Durst", "hint": "Hint: need for water"},
        {"prompt": "Ich trinke ein Glas _______.", "en": "I drink a glass of juice.", "options": ["Saft", "Durst", "Flasche"], "answer": "Saft"},
        {"prompt": "Ich habe großen _______ nach dem Sport.", "en": "I am very thirsty after sports.", "options": ["Durst", "Hunger", "Tee"], "answer": "Durst"}
    ))

    # Unit 30: Körper & Wohlbefinden
    units.append(make_unit(
        30, 1, "Körper & Wohlbefinden", "Body parts basics", "#58CC02",
        [{"de": "Kopf", "en": "head"}, {"de": "Auge", "en": "eye"}, {"de": "Ohr", "en": "ear"}, {"de": "Mund", "en": "mouth"}],
        [{"de": "Nase", "en": "nose"}, {"de": "Hand", "en": "hand"}, {"de": "Fuß", "en": "foot"}, {"de": "Bein", "en": "leg"}],
        [{"de": "Arm", "en": "arm"}, {"de": "Bauch", "en": "stomach"}, {"de": "Rücken", "en": "back"}, {"de": "Körper", "en": "body"}],
        [{"de": "wehtun", "en": "to hurt"}, {"de": "Schmerz", "en": "pain"}, {"de": "gesund", "en": "healthy"}, {"de": "krank", "en": "sick"}],
        {"de": "Mein Kopf tut heute weh.", "en": "My head hurts today."},
        {"de": "Ich habe Schmerzen im Rücken.", "en": "I have pain in my back."},
        {"de": "Die Hand und der Fuß sind kalt.", "en": "The hand and foot are cold."},
        {"de": "Geht es dir heute körperlich gut?", "en": "Are you feeling physically well today?"},
        {"de": "Mein Bauch tut nach dem Essen weh.", "en": "My stomach hurts after eating."},
        {"de": "Ich bleibe im Bett, weil ich krank bin.", "en": "I stay in bed because I am sick."},
        {"partner": "Arzt", "prompt": "Wo tut es Ihnen weh?", "translation": "Where does it hurt you?", "options": ["Mein Kopf und mein Rücken tun weh.", "Ich heiße Anna."]},
        {"partner": "Arzt", "prompt": "Haben Sie auch Fieber?", "translation": "Do you also have a fever?", "options": ["Nein, kein Fieber, nur Kopfschmerzen.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'head':", "target": "Kopf", "hint": "Hint: 4 letters starting with K"},
        {"prompt": "Type the German word for 'hand':", "target": "Hand", "hint": "Hint: 4 letters starting with H"},
        {"prompt": "Mein Kopf tut heute _______.", "en": "My head hurts today.", "options": ["weh", "gut", "Schmerz"], "answer": "weh"},
        {"prompt": "Ich habe Schmerzen im _______.", "en": "I have pain in my back.", "options": ["Rücken", "Auge", "Nase"], "answer": "Rücken"}
    ))

    # Unit 31: Einfache Kleidung
    units.append(make_unit(
        31, 1, "Einfache Kleidung", "Basic clothing items", "#FF9600",
        [{"de": "Hemd", "en": "shirt"}, {"de": "Hose", "en": "trousers / pants"}, {"de": "Kleid", "en": "dress"}, {"de": "Jacke", "en": "jacket"}],
        [{"de": "Schuhe", "en": "shoes"}, {"de": "Pullover", "en": "sweater"}, {"de": "T-Shirt", "en": "t-shirt"}, {"de": "Mantel", "en": "coat"}],
        [{"de": "Mütze", "en": "cap / beanie"}, {"de": "Socken", "en": "socks"}, {"de": "Kleidung", "en": "clothing"}, {"de": "tragen", "en": "to wear"}],
        [{"de": "kaufen", "en": "to buy"}, {"de": "passen", "en": "to fit"}, {"de": "Größe", "en": "size"}, {"de": "schick", "en": "stylish"}],
        {"de": "Ich trage ein weißes Hemd.", "en": "I wear a white shirt."},
        {"de": "Die schwarze Hose passt perfekt.", "en": "The black pants fit perfectly."},
        {"de": "Im Winter brauche ich eine warme Jacke.", "en": "In winter I need a warm jacket."},
        {"de": "Gefällt dir diese blaue Jacke?", "en": "Do you like this blue jacket?"},
        {"de": "Die neuen Schuhe sind sehr bequem.", "en": "The new shoes are very comfortable."},
        {"de": "Ich kaufe einen Pullover und einen Mantel.", "en": "I buy a sweater and a coat."},
        {"partner": "Verkäuferin", "prompt": "Gefällt Ihnen dieses Hemd?", "translation": "Do you like this shirt?", "options": ["Ja, das weiße Hemd gefällt mir sehr.", "Ich trinke Kaffee."]},
        {"partner": "Verkäuferin", "prompt": "Welche Größe tragen Sie?", "translation": "Which size do you wear?", "options": ["Ich trage Größe vierzig.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'shirt':", "target": "Hemd", "hint": "Hint: button-up top"},
        {"prompt": "Type the German word for 'pants / trousers':", "target": "Hose", "hint": "Hint: 4 letters starting with H"},
        {"prompt": "Ich trage ein weißes _______.", "en": "I wear a white shirt.", "options": ["Hemd", "Hose", "Schuhe"], "answer": "Hemd"},
        {"prompt": "Die neue Jacke _______ mir perfekt.", "en": "The new jacket fits me perfectly.", "options": ["passt", "trägt", "kauft"], "answer": "passt"}
    ))

    # Unit 32: Wetter heute
    units.append(make_unit(
        32, 1, "Wetter heute", "Talk about basic weather", "#CE82FF",
        [{"de": "Sonne", "en": "sun"}, {"de": "Regen", "en": "rain"}, {"de": "Wind", "en": "wind"}, {"de": "Schnee", "en": "snow"}],
        [{"de": "Wolke", "en": "cloud"}, {"de": "Wetter", "en": "weather"}, {"de": "Grad", "en": "degrees"}, {"de": "warm", "en": "warm"}],
        [{"de": "kalt", "en": "cold"}, {"de": "heiß", "en": "hot"}, {"de": "regnen", "en": "to rain"}, {"de": "schneien", "en": "to snow"}],
        [{"de": "scheinen", "en": "to shine"}, {"de": "heute", "en": "today"}, {"de": "draußen", "en": "outside"}, {"de": "schlecht", "en": "bad"}],
        {"de": "Die Sonne scheint heute schön.", "en": "The sun is shining nicely today."},
        {"de": "Es regnet den ganzen Tag.", "en": "It is raining all day."},
        {"de": "Heute ist es zwanzig Grad warm.", "en": "Today it is twenty degrees warm."},
        {"de": "Regnet es heute draußen in Hamburg?", "en": "Is it raining outside in Hamburg today?"},
        {"de": "Im Winter schneit es oft in den Bergen.", "en": "In winter it often snows in the mountains."},
        {"de": "Das Wetter ist heute wirklich wunderbar.", "en": "The weather is really wonderful today."},
        {"partner": "Laura", "prompt": "Wie ist das Wetter heute bei dir?", "translation": "How is the weather today by you?", "options": ["Die Sonne scheint und es ist warm.", "Heute ist Dienstag."]},
        {"partner": "Laura", "prompt": "Brauchst du einen Regenschirm?", "translation": "Do you need an umbrella?", "options": ["Nein, es regnet heute gar nicht.", "Danke sehr."]},
        {"prompt": "Type the German word for 'sun':", "target": "Sonne", "hint": "Hint: celestial source of light"},
        {"prompt": "Type the German word for 'rain':", "target": "Regen", "hint": "Hint: water falling from clouds"},
        {"prompt": "Die Sonne _______ heute wunderbar.", "en": "The sun shines wonderfully today.", "options": ["scheint", "regnet", "schneit"], "answer": "scheint"},
        {"prompt": "Es ist heute zwanzig _______ warm.", "en": "It is twenty degrees warm today.", "options": ["Grad", "Wind", "Regen"], "answer": "Grad"}
    ))

    # Unit 33: Monate & Geburtstag
    units.append(make_unit(
        33, 1, "Monate & Geburtstag", "Months and birthdays", "#FF4B4B",
        [{"de": "Januar", "en": "January"}, {"de": "Februar", "en": "February"}, {"de": "März", "en": "March"}, {"de": "April", "en": "April"}],
        [{"de": "Mai", "en": "May"}, {"de": "Juni", "en": "June"}, {"de": "Juli", "en": "July"}, {"de": "August", "en": "August"}],
        [{"de": "September", "en": "September"}, {"de": "Oktober", "en": "October"}, {"de": "November", "en": "November"}, {"de": "Dezember", "en": "December"}],
        [{"de": "Geburtstag", "en": "birthday"}, {"de": "feiern", "en": "to celebrate"}, {"de": "Geschenk", "en": "gift"}, {"de": "wann", "en": "when"}],
        {"de": "Mein Geburtstag ist im Mai.", "en": "My birthday is in May."},
        {"de": "Im Dezember feiern wir Weihnachten.", "en": "In December we celebrate Christmas."},
        {"de": "Ich habe ein schönes Geschenk bekommen.", "en": "I received a nice gift."},
        {"de": "Wann hast du eigentlich Geburtstag?", "en": "When is your birthday actually?"},
        {"de": "Wir feiern meinen Geburtstag am Samstag.", "en": "We celebrate my birthday on Saturday."},
        {"de": "Das Jahr hat genau zwölf Monate.", "en": "The year has exactly twelve months."},
        {"partner": "Tim", "prompt": "Wann hast du Geburtstag?", "translation": "When is your birthday?", "options": ["Ich habe im Juli Geburtstag.", "Ich spiele Fußball."]},
        {"partner": "Tim", "prompt": "Feierst du eine große Party?", "translation": "Are you celebrating a big party?", "options": ["Ja, mit allen meinen Freunden!", "Guten Tag."]},
        {"prompt": "Type the German word for 'May':", "target": "Mai", "hint": "Hint: 5th month of the year"},
        {"prompt": "Type the German word for 'birthday':", "target": "Geburtstag", "hint": "Hint: day of one's birth"},
        {"prompt": "Mein Geburtstag ist im _______.", "en": "My birthday is in May.", "options": ["Mai", "Geschenk", "feiern"], "answer": "Mai"},
        {"prompt": "Wann _______ du Geburtstag?", "en": "When do you have your birthday?", "options": ["hast", "bist", "wohnst"], "answer": "hast"}
    ))

    # Unit 34: Jahreszeiten
    units.append(make_unit(
        34, 1, "Jahreszeiten", "The four seasons", "#00CD9C",
        [{"de": "Frühling", "en": "spring"}, {"de": "Sommer", "en": "summer"}, {"de": "Herbst", "en": "autumn / fall"}, {"de": "Winter", "en": "winter"}],
        [{"de": "Jahreszeit", "en": "season"}, {"de": "Natur", "en": "nature"}, {"de": "Blume", "en": "flower"}, {"de": "Baum", "en": "tree"}],
        [{"de": "warm", "en": "warm"}, {"de": "kalt", "en": "cold"}, {"de": "bunt", "en": "colorful"}, {"de": "Schnee", "en": "snow"}],
        [{"de": "Urlaub", "en": "vacation"}, {"de": "lieben", "en": "to love"}, {"de": "wechseln", "en": "to change"}, {"de": "Jahr", "en": "year"}],
        {"de": "Im Sommer ist es schön warm.", "en": "In summer it is nicely warm."},
        {"de": "Im Frühling blühen viele Blumen.", "en": "In spring many flowers bloom."},
        {"de": "Im Herbst werden die Blätter bunt.", "en": "In autumn the leaves turn colorful."},
        {"de": "Magst du den kalten Winter gern?", "en": "Do you like the cold winter gladly?"},
        {"de": "Der Sommer ist meine liebste Jahreszeit.", "en": "Summer is my favorite season."},
        {"de": "Vier Jahreszeiten machen das ganze Jahr.", "en": "Four seasons make the entire year."},
        {"partner": "Katrin", "prompt": "Welche Jahreszeit magst du am liebsten?", "translation": "Which season do you like most of all?", "options": ["Ich mag den Frühling am liebsten.", "Ich esse einen Apfel."]},
        {"partner": "Katrin", "prompt": "Fährst du im Sommer in den Urlaub?", "translation": "Are you going on vacation in the summer?", "options": ["Ja, ich fahre im Juli ans Meer.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'summer':", "target": "Sommer", "hint": "Hint: warmest season"},
        {"prompt": "Type the German word for 'winter':", "target": "Winter", "hint": "Hint: coldest season"},
        {"prompt": "Im _______ ist es schön warm.", "en": "In summer it is nicely warm.", "options": ["Sommer", "Winter", "Herbst"], "answer": "Sommer"},
        {"prompt": "Der Frühling ist eine schöne _______.", "en": "Spring is a beautiful season.", "options": ["Jahreszeit", "Blume", "Urlaub"], "answer": "Jahreszeit"}
    ))

    # Unit 35: Sektion 1 Finale
    units.append(make_unit(
        35, 1, "Sektion 1 Finale", "Section 1 Grand Review", "#FFC800",
        [{"de": "Erfolg", "en": "success"}, {"de": "lernen", "en": "to learn"}, {"de": "sprechen", "en": "to speak"}, {"de": "verstehen", "en": "to understand"}],
        [{"de": "Prüfung", "en": "exam / test"}, {"de": "bestehen", "en": "to pass (exam)"}, {"de": "wiederholen", "en": "to review"}, {"de": "üben", "en": "to practice"}],
        [{"de": "Wort", "en": "word"}, {"de": "Satz", "en": "sentence"}, {"de": "Gespräch", "en": "conversation"}, {"de": "Fortschritt", "en": "progress"}],
        [{"de": "stolz", "en": "proud"}, {"de": "bereit", "en": "ready"}, {"de": "Stufe", "en": "level / step"}, {"de": "Meister", "en": "master"}],
        {"de": "Ich lerne erfolgreich Deutsch!", "en": "I learn German successfully!"},
        {"de": "Wir haben alle Lektionen geübt.", "en": "We have practiced all lessons."},
        {"de": "Ich kann einfache Sätze sprechen.", "en": "I can speak simple sentences."},
        {"de": "Hast du alles gut verstanden?", "en": "Did you understand everything well?"},
        {"de": "Ich bin stolz auf meinen großen Fortschritt.", "en": "I am proud of my big progress."},
        {"de": "Jetzt bin ich bereit für die nächste Stufe!", "en": "Now I am ready for the next level!"},
        {"partner": "Prüfer", "prompt": "Sind Sie bereit für die Prüfung?", "translation": "Are you ready for the exam?", "options": ["Ja, ich habe fleißig geübt!", "Ich trinke Kaffee."]},
        {"partner": "Prüfer", "prompt": "Können Sie sich kurz vorstellen?", "translation": "Can you briefly introduce yourself?", "options": ["Guten Tag, ich heiße David und komme aus Indien.", "Zehn Euro bitte."]},
        {"prompt": "Type the German word for 'success':", "target": "Erfolg", "hint": "Hint: achievement noun"},
        {"prompt": "Type the German word for 'progress':", "target": "Fortschritt", "hint": "Hint: moving forward"},
        {"prompt": "Ich lerne _______ Deutsch.", "en": "I learn German successfully.", "options": ["erfolgreich", "stolz", "bereit"], "answer": "erfolgreich"},
        {"prompt": "Ich bin bereit für die nächste _______.", "en": "I am ready for the next level.", "options": ["Stufe", "Prüfung", "Wort"], "answer": "Stufe"}
    ))

    return units
