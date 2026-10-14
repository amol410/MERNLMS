try:
    from scripts.generate_curriculum_data import make_unit
except ImportError:
    from generate_curriculum_data import make_unit

def get_section2_units():
    units = []

    # Unit 36: Im Restaurant
    units.append(make_unit(
        36, 2, "Im Restaurant", "Order food in a restaurant", "#1CB0F6",
        [{"de": "Speisekarte", "en": "menu"}, {"de": "bestellen", "en": "to order"}, {"de": "Kellner", "en": "waiter"}, {"de": "Gericht", "en": "dish"}],
        [{"de": "Vorspeise", "en": "appetizer"}, {"de": "Hauptgericht", "en": "main course"}, {"de": "Dessert", "en": "dessert"}, {"de": "Suppe", "en": "soup"}],
        [{"de": "Salat", "en": "salad"}, {"de": "Fleisch", "en": "meat"}, {"de": "Fisch", "en": "fish"}, {"de": "vegetarisch", "en": "vegetarian"}],
        [{"de": "Rechnung", "en": "bill"}, {"de": "Trinkgeld", "en": "tip"}, {"de": "schmecken", "en": "to taste"}, {"de": "zusammen", "en": "together"}],
        {"de": "Wir möchten gerne bestellen.", "en": "We would like to order."},
        {"de": "Die Suppe schmeckt sehr lecker.", "en": "The soup tastes very delicious."},
        {"de": "Ich nehme das vegetarische Gericht.", "en": "I take the vegetarian dish."},
        {"de": "Haben Sie die Speisekarte auf Englisch?", "en": "Do you have the menu in English?"},
        {"de": "Als Hauptgericht nehme ich Fisch mit Salat.", "en": "As a main course I take fish with salad."},
        {"de": "Herr Ober, die Rechnung bitte zusammen!", "en": "Waiter, the bill altogether please!"},
        {"partner": "Kellner", "prompt": "Guten Abend! Was darf ich Ihnen bringen?", "translation": "Good evening! What may I bring you?", "options": ["Ich nehme das Tagesgericht, bitte.", "Ich habe zwei Brüder."]},
        {"partner": "Kellner", "prompt": "Hat es Ihnen geschmeckt?", "translation": "Did you enjoy your meal?", "options": ["Ja, das Essen war ausgezeichnet, danke!", "Es ist drei Uhr."]},
        {"prompt": "Type the German word for 'menu':", "target": "Speisekarte", "hint": "Hint: list of restaurant dishes"},
        {"prompt": "Type the German word for 'soup':", "target": "Suppe", "hint": "Hint: hot liquid appetizer"},
        {"prompt": "Wir möchten gerne _______.", "en": "We would like to order.", "options": ["bestellen", "wohnen", "kaufen"], "answer": "bestellen"},
        {"prompt": "Herr Ober, die _______ bitte!", "en": "Waiter, the bill please!", "options": ["Rechnung", "Speisekarte", "Vorspeise"], "answer": "Rechnung"}
    ))

    # Unit 37: Essen & Trinken
    units.append(make_unit(
        37, 2, "Essen & Trinken", "Talk about favorite meals", "#58CC02",
        [{"de": "Lieblingsessen", "en": "favorite meal"}, {"de": "Pizza", "en": "pizza"}, {"de": "Pasta", "en": "pasta"}, {"de": "Kartoffeln", "en": "potatoes"}],
        [{"de": "Gemüse", "en": "vegetables"}, {"de": "Reis", "en": "rice"}, {"de": "Nudeln", "en": "noodles"}, {"de": "Soße", "en": "sauce"}],
        [{"de": "kochen", "en": "to cook"}, {"de": "backen", "en": "to bake"}, {"de": "lecker", "en": "delicious"}, {"de": "scharf", "en": "spicy"}],
        [{"de": "salzig", "en": "salty"}, {"de": "süß", "en": "sweet"}, {"de": "gesund", "en": "healthy"}, {"de": "Probieren", "en": "to try / taste"}],
        {"de": "Mein Lieblingsessen ist Pizza.", "en": "My favorite meal is pizza."},
        {"de": "Ich koche heute Nudeln mit Soße.", "en": "I cook noodles with sauce today."},
        {"de": "Das Gemüse ist frisch und gesund.", "en": "The vegetables are fresh and healthy."},
        {"de": "Was ist dein persönliches Lieblingsessen?", "en": "What is your personal favorite meal?"},
        {"de": "Mein Vater kocht am Sonntag für uns.", "en": "My father cooks for us on Sunday."},
        {"de": "Möchtest du von meiner Pasta probieren?", "en": "Would you like to try some of my pasta?"},
        {"partner": "Marco", "prompt": "Was isst du am liebsten?", "translation": "What do you like eating most?", "options": ["Ich esse am liebsten frische Pasta.", "Ich lerne Deutsch."]},
        {"partner": "Marco", "prompt": "Kochst du oft zu Hause?", "translation": "Do you often cook at home?", "options": ["Ja, fast jeden Tag am Abend.", "Danke auf Wiedersehen."]},
        {"prompt": "Type the German word for 'vegetables':", "target": "Gemüse", "hint": "Hint: plant-based food with Umlaut ü"},
        {"prompt": "Type the German word for 'to cook':", "target": "kochen", "hint": "Hint: preparing hot food"},
        {"prompt": "Mein _______ ist Pasta mit Tomatensoße.", "en": "My favorite meal is pasta with tomato sauce.", "options": ["Lieblingsessen", "Salat", "Messer"], "answer": "Lieblingsessen"},
        {"prompt": "Das Gemüse ist frisch und _______.", "en": "The vegetables are fresh and healthy.", "options": ["gesund", "salzig", "scharf"], "answer": "gesund"}
    ))

    # Unit 38: Einkaufen: Kleidung
    units.append(make_unit(
        38, 2, "Einkaufen: Kleidung", "Shop for clothes", "#FF9600",
        [{"de": "anprobieren", "en": "to try on"}, {"de": "Hose", "en": "pants / trousers"}, {"de": "Rock", "en": "skirt"}, {"de": "Kleid", "en": "dress"}],
        [{"de": "Mantel", "en": "coat"}, {"de": "Jacke", "en": "jacket"}, {"de": "Stiefel", "en": "boots"}, {"de": "Schal", "en": "scarf"}],
        [{"de": "Kabine", "en": "fitting room"}, {"de": "Spiegel", "en": "mirror"}, {"de": "Mode", "en": "fashion"}, {"de": "Geschäft", "en": "store / shop"}],
        [{"de": "Kunde", "en": "customer"}, {"de": "Verkäufer", "en": "sales assistant"}, {"de": "nehmen", "en": "to take"}, {"de": "gefallen", "en": "to appeal to / like"}],
        {"de": "Ich möchte diese Hose anprobieren.", "en": "I would like to try on these pants."},
        {"de": "Wo ist die freie Umkleidekabine?", "en": "Where is the free fitting room?"},
        {"de": "Der rote Mantel gefällt mir sehr.", "en": "The red coat appeals to me very much."},
        {"de": "Kann ich diese Jacke anprobieren?", "en": "Can I try on this jacket?"},
        {"de": "Die Stiefel sind modisch und bequem.", "en": "The boots are fashionable and comfortable."},
        {"de": "Ich nehme das blaue Kleid, danke!", "en": "I take the blue dress, thank you!"},
        {"partner": "Verkäufer", "prompt": "Kann ich Ihnen bei der Kleidung helfen?", "translation": "Can I help you with clothing?", "options": ["Ja, ich suche eine schwarze Hose.", "Ich trinke Wasser."]},
        {"partner": "Verkäufer", "prompt": "Die Umkleidekabine ist dort drüben.", "translation": "The fitting room is over there.", "options": ["Vielen Dank, ich probiere es an.", "Zwei Euro bitte."]},
        {"prompt": "Type the German word for 'to try on' (clothing):", "target": "anprobieren", "hint": "Hint: separable verb"},
        {"prompt": "Type the German word for 'skirt':", "target": "Rock", "hint": "Hint: 4 letters starting with R"},
        {"prompt": "Ich möchte die Jacke _______.", "en": "I would like to try on the jacket.", "options": ["anprobieren", "trinken", "essen"], "answer": "anprobieren"},
        {"prompt": "Wo ist bitte die freie _______?", "en": "Where is the free fitting room, please?", "options": ["Kabine", "Jacke", "Mode"], "answer": "Kabine"}
    ))

    # Unit 39: Größen & Farben
    units.append(make_unit(
        39, 2, "Größen & Farben", "Sizes, fits and colors", "#CE82FF",
        [{"de": "Größe", "en": "size"}, {"de": "passen", "en": "to fit"}, {"de": "eng", "en": "tight / narrow"}, {"de": "weit", "en": "wide / loose"}],
        [{"de": "kurz", "en": "short"}, {"de": "lang", "en": "long"}, {"de": "hellblau", "en": "light blue"}, {"de": "dunkelgrün", "en": "dark green"}],
        [{"de": "zu groß", "en": "too big"}, {"de": "zu klein", "en": "too small"}, {"de": "Nummer", "en": "number"}, {"de": "kleiner", "en": "smaller"}],
        [{"de": "größer", "en": "bigger"}, {"de": "Farbe", "en": "color"}, {"de": "bequem", "en": "comfortable"}, {"de": "perfekt", "en": "perfect"}],
        {"de": "Das Hemd ist mir zu klein.", "en": "The shirt is too small for me."},
        {"de": "Haben Sie diese Hose eine Nummer größer?", "en": "Do you have these pants one size larger?"},
        {"de": "Die dunkelgrüne Jacke passt mir perfekt.", "en": "The dark green jacket fits me perfectly."},
        {"de": "Welche Größe haben Sie in diesem Kleid?", "en": "Which size do you have in this dress?"},
        {"de": "Diese Schuhe sind sehr bequem und schön.", "en": "These shoes are very comfortable and beautiful."},
        {"de": "Ich suche ein hellblaues Hemd in Größe M.", "en": "I am looking for a light blue shirt in size M."},
        {"partner": "Beraterin", "prompt": "Passt Ihnen die Jacke gut?", "translation": "Does the jacket fit you well?", "options": ["Sie ist leider ein bisschen zu eng.", "Ich heiße Jonas."]},
        {"partner": "Beraterin", "prompt": "Möchten Sie eine andere Farbe probieren?", "translation": "Would you like to try another color?", "options": ["Ja, gerne in Dunkelblau bitte.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'size':", "target": "Größe", "hint": "Hint: has Umlaut ö and sharp s ß"},
        {"prompt": "Type the German word for 'comfortable':", "target": "bequem", "hint": "Hint: pleasant to wear"},
        {"prompt": "Die Hose ist mir leider zu _______.", "en": "The pants are unfortunately too tight for me.", "options": ["eng", "hellblau", "Farbe"], "answer": "eng"},
        {"prompt": "Haben Sie das Hemd eine Nummer _______?", "en": "Do you have the shirt one size bigger?", "options": ["größer", "Größe", "passen"], "answer": "größer"}
    ))

    # Unit 40: Im Kaufhaus
    units.append(make_unit(
        40, 2, "Im Kaufhaus", "Navigate a department store", "#FF4B4B",
        [{"de": "Kaufhaus", "en": "department store"}, {"de": "Kasse", "en": "checkout / cash register"}, {"de": "Stockwerk", "en": "floor / story"}, {"de": "Erdgeschoss", "en": "ground floor"}],
        [{"de": "Rolltreppe", "en": "escalator"}, {"de": "Aufzug", "en": "elevator / lift"}, {"de": "Ausgang", "en": "exit"}, {"de": "Eingang", "en": "entrance"}],
        [{"de": "Abteilung", "en": "department"}, {"de": "Quittung", "en": "receipt"}, {"de": "Information", "en": "information desk"}, {"de": "Umtausch", "en": "exchange"}],
        [{"de": "suchen", "en": "to search / look for"}, {"de": "finden", "en": "to find"}, {"de": "bezahlen", "en": "to pay"}, {"de": "Sonderangebot", "en": "special offer"}],
        {"de": "Wo ist hier die Kasse?", "en": "Where is the checkout here?"},
        {"de": "Die Damenmode ist im ersten Stockwerk.", "en": "Women's fashion is on the first floor."},
        {"de": "Nehmen Sie die Rolltreppe nach oben.", "en": "Take the escalator upstairs."},
        {"de": "Wo finde ich die Sportabteilung im Kaufhaus?", "en": "Where do I find the sports department in the store?"},
        {"de": "Die Information befindet sich direkt am Eingang.", "en": "The information desk is right at the entrance."},
        {"de": "Bitte behalten Sie die Quittung für den Umtausch.", "en": "Please keep the receipt for the exchange."},
        {"partner": "Mitarbeiter", "prompt": "Kann ich Ihnen weiterhelfen?", "translation": "Can I help you further?", "options": ["Wo finde ich die Kinderabteilung?", "Ich trinke Orangensaft."]},
        {"partner": "Mitarbeiter", "prompt": "Die Kasse ist gleich links.", "translation": "The checkout is right on the left.", "options": ["Vielen Dank für Ihre Hilfe!", "Gute Nacht."]},
        {"prompt": "Type the German word for 'cash register / checkout':", "target": "Kasse", "hint": "Hint: where you pay"},
        {"prompt": "Type the German word for 'elevator':", "target": "Aufzug", "hint": "Hint: vertical transport machine"},
        {"prompt": "Die Information ist im _______.", "en": "The info desk is on the ground floor.", "options": ["Erdgeschoss", "Ausgang", "Quittung"], "answer": "Erdgeschoss"},
        {"prompt": "Wo ist hier bitte die _______?", "en": "Where is the cash register here, please?", "options": ["Kasse", "Rolltreppe", "Abteilung"], "answer": "Kasse"}
    ))

    # Unit 41: Zahlen über 100
    units.append(make_unit(
        41, 2, "Zahlen über 100", "Count hundreds and thousands", "#00CD9C",
        [{"de": "hundert", "en": "hundred"}, {"de": "zweihundert", "en": "two hundred"}, {"de": "fünfhundert", "en": "five hundred"}, {"de": "tausend", "en": "thousand"}],
        [{"de": "Million", "en": "million"}, {"de": "Nummer", "en": "number"}, {"de": "Summe", "en": "sum / total"}, {"de": "Rechnung", "en": "bill"}],
        [{"de": "Rabatt", "en": "discount"}, {"de": "Prozent", "en": "percent"}, {"de": "gesamt", "en": "total"}, {"de": "kosten", "en": "to cost"}],
        [{"de": "bezahlen", "en": "to pay"}, {"de": "Euro", "en": "euro"}, {"de": "Cent", "en": "cent"}, {"de": "teuer", "en": "expensive"}],
        {"de": "Das Fahrrad kostet dreihundert Euro.", "en": "The bicycle costs three hundred euros."},
        {"de": "Eintausend Menschen besuchen das Fest.", "en": "One thousand people visit the festival."},
        {"de": "Sie bekommen zehn Prozent Rabatt.", "en": "You receive ten percent discount."},
        {"de": "Wie viel kostet dieses neue Smartphone?", "en": "How much does this new smartphone cost?"},
        {"de": "Die Gesamtsumme beträgt genau siebenhundert Euro.", "en": "The total sum amounts to exactly 700 euros."},
        {"de": "Berlin hat mehr als drei Millionen Einwohner.", "en": "Berlin has more than three million inhabitants."},
        {"partner": "Kassierer", "prompt": "Das macht zusammen zweihundertfünfzig Euro.", "translation": "That makes 250 euros altogether.", "options": ["Kann ich mit Kreditkarte bezahlen?", "Heute ist Dienstag."]},
        {"partner": "Kassierer", "prompt": "Hier ist Ihr Beleg, danke schön.", "translation": "Here is your receipt, thank you.", "options": ["Vielen Dank und schönen Tag!", "Fünfzehn Jahre alt."]},
        {"prompt": "Type the German word for 'thousand':", "target": "tausend", "hint": "Hint: 1000 in German"},
        {"prompt": "Type the German word for 'hundred':", "target": "hundert", "hint": "Hint: 100 in German"},
        {"prompt": "Das neue Sofa kostet fünf_______ Euro.", "en": "The new sofa costs five hundred euros.", "options": ["hundert", "tausend", "Prozent"], "answer": "hundert"},
        {"prompt": "Sie bekommen zwanzig _______ Rabatt.", "en": "You receive twenty percent discount.", "options": ["Prozent", "Summe", "Nummer"], "answer": "Prozent"}
    ))

    # Unit 42: Öffentliche Verkehrsmittel
    units.append(make_unit(
        42, 2, "Öffentliche Verkehrsmittel", "Use public transport", "#FFC800",
        [{"de": "Fahrkarte", "en": "ticket"}, {"de": "Bus", "en": "bus"}, {"de": "U-Bahn", "en": "subway / metro"}, {"de": "Straßenbahn", "en": "tram"}],
        [{"de": "Haltestelle", "en": "station / bus stop"}, {"de": "Linie", "en": "line / route"}, {"de": "einsteigen", "en": "to board / get in"}, {"de": "aussteigen", "en": "to get off"}],
        [{"de": "umsteigen", "en": "to transfer / change"}, {"de": "Ticketautomat", "en": "ticket machine"}, {"de": "Fahrplan", "en": "timetable"}, {"de": "entwerten", "en": "to validate (ticket)"}],
        [{"de": "Richtung", "en": "direction"}, {"de": "nächste", "en": "next"}, {"de": "fahren", "en": "to ride / drive"}, {"de": "Ticket", "en": "ticket"}],
        {"de": "Ich kaufe eine Fahrkarte am Automaten.", "en": "I buy a ticket at the machine."},
        {"de": "Die U-Bahn Linie zwei kommt sofort.", "en": "Subway line 2 is coming immediately."},
        {"de": "An der nächsten Haltestelle müssen wir umsteigen.", "en": "At the next stop we have to transfer."},
        {"de": "Fährt dieser Bus direkt zum Hauptbahnhof?", "en": "Does this bus go directly to the main station?"},
        {"de": "Bitte steigen Sie vorsichtig in die Straßenbahn ein.", "en": "Please board the tram carefully."},
        {"de": "Vergessen Sie nicht, Ihre Fahrkarte zu entwerten.", "en": "Do not forget to validate your ticket."},
        {"partner": "Fahrgast", "prompt": "Fährt dieser Bus zum Flughafen?", "translation": "Does this bus go to the airport?", "options": ["Ja, Linie hundert fährt direkt dorthin.", "Ich bin Student."]},
        {"partner": "Fahrgast", "prompt": "Muss ich hier umsteigen?", "translation": "Do I have to change here?", "options": ["Nein, bleiben Sie einfach sitzen.", "Danke auf Wiedersehen."]},
        {"prompt": "Type the German word for 'ticket':", "target": "Fahrkarte", "hint": "Hint: transit card noun"},
        {"prompt": "Type the German word for 'bus stop':", "target": "Haltestelle", "hint": "Hint: stopping point"},
        {"prompt": "Ich kaufe eine _______ am Automaten.", "en": "I buy a ticket at the machine.", "options": ["Fahrkarte", "Linie", "Richtung"], "answer": "Fahrkarte"},
        {"prompt": "An der nächsten Station müssen wir _______.", "en": "At the next station we have to transfer.", "options": ["umsteigen", "einsteigen", "fahren"], "answer": "umsteigen"}
    ))

    # Unit 43: Am Bahnhof
    units.append(make_unit(
        43, 2, "Am Bahnhof", "At the train station", "#1CB0F6",
        [{"de": "Gleis", "en": "track / platform"}, {"de": "Bahnhof", "en": "train station"}, {"de": "Zug", "en": "train"}, {"de": "Bahnsteig", "en": "platform"}],
        [{"de": "Abfahrt", "en": "departure"}, {"de": "Ankunft", "en": "arrival"}, {"de": "Verspätung", "en": "delay"}, {"de": "Koffer", "en": "suitcase"}],
        [{"de": "Gepäck", "en": "luggage"}, {"de": "Schalter", "en": "service counter"}, {"de": "Reise", "en": "journey / trip"}, {"de": "Fahrgast", "en": "passenger"}],
        [{"de": "warten", "en": "to wait"}, {"de": "abfahren", "en": "to depart"}, {"de": "ankommen", "en": "to arrive"}, {"de": "Durchsage", "en": "announcement"}],
        {"de": "Der Zug fährt von Gleis vier ab.", "en": "The train departs from platform 4."},
        {"de": "Der ICE nach Berlin hat zehn Minuten Verspätung.", "en": "The ICE to Berlin has a ten minute delay."},
        {"de": "Mein schwerer Koffer steht auf dem Bahnsteig.", "en": "My heavy suitcase stands on the platform."},
        {"de": "Auf welchem Gleis kommt der Zug aus München an?", "en": "On which track does the train from Munich arrive?"},
        {"de": "Die Fahrgäste warten geduldig am Schalter.", "en": "The passengers wait patiently at the counter."},
        {"de": "Achtung an Gleis zwei, der Zug fährt ein!", "en": "Attention on track 2, the train is pulling in!"},
        {"partner": "Bahnbeamter", "prompt": "Wohin möchten Sie heute reisen?", "translation": "Where would you like to travel today?", "options": ["Eine Fahrkarte nach München, bitte.", "Ich trinke Kaffee."]},
        {"partner": "Bahnbeamter", "prompt": "Ihr Zug fährt von Gleis sieben ab.", "translation": "Your train departs from track seven.", "options": ["Vielen Dank für die Auskunft!", "Gute Nacht."]},
        {"prompt": "Type the German word for 'track / platform':", "target": "Gleis", "hint": "Hint: 5 letters starting with G"},
        {"prompt": "Type the German word for 'train':", "target": "Zug", "hint": "Hint: 3 letters starting with Z"},
        {"prompt": "Der Zug fährt von _______ vier ab.", "en": "The train departs from track four.", "options": ["Gleis", "Koffer", "Abfahrt"], "answer": "Gleis"},
        {"prompt": "Der ICE hat zehn Minuten _______.", "en": "The ICE has a ten minute delay.", "options": ["Verspätung", "Ankunft", "Gepäck"], "answer": "Verspätung"}
    ))

    # Unit 44: Wegbeschreibung 1
    units.append(make_unit(
        44, 2, "Wegbeschreibung 1", "Ask for directions", "#58CC02",
        [{"de": "rechts", "en": "right"}, {"de": "links", "en": "left"}, {"de": "geradeaus", "en": "straight ahead"}, {"de": "Weg", "en": "way / path"}],
        [{"de": "Straße", "en": "street"}, {"de": "Platz", "en": "square / plaza"}, {"de": "Kreuzung", "en": "intersection"}, {"de": "Ecke", "en": "corner"}],
        [{"de": "Stadtplan", "en": "city map"}, {"de": "suchen", "en": "to look for"}, {"de": "finden", "en": "to find"}, {"de": "zeigen", "en": "to show"}],
        [{"de": "Entschuldigung", "en": "excuse me"}, {"de": "nah", "en": "near"}, {"de": "weit", "en": "far"}, {"de": "wo ist", "en": "where is"}],
        {"de": "Gehen Sie bitte nach rechts.", "en": "Please go to the right."},
        {"de": "Fahren Sie immer geradeaus weiter.", "en": "Keep driving straight ahead."},
        {"de": "Biegen Sie an der Kreuzung links ab.", "en": "Turn left at the intersection."},
        {"de": "Entschuldigung, wo ist der Marktplatz?", "en": "Excuse me, where is the market square?"},
        {"de": "Das Museum liegt direkt an der nächsten Ecke.", "en": "The museum is right at the next corner."},
        {"de": "Können Sie mir den Weg auf dem Stadtplan zeigen?", "en": "Can you show me the way on the city map?"},
        {"partner": "Passant", "prompt": "Kann ich Ihnen helfen, suchen Sie etwas?", "translation": "Can I help you, are you looking for something?", "options": ["Entschuldigung, wo ist die nächste Bank?", "Ich habe zwei Katzen."]},
        {"partner": "Passant", "prompt": "Gehen Sie geradeaus und dann links.", "translation": "Go straight ahead and then left.", "options": ["Vielen Dank für Ihre Hilfe!", "Heute ist Montag."]},
        {"prompt": "Type the German word for 'right' (direction):", "target": "rechts", "hint": "Hint: opposite of links"},
        {"prompt": "Type the German word for 'left' (direction):", "target": "links", "hint": "Hint: opposite of rechts"},
        {"prompt": "Fahren Sie immer _______ weiter.", "en": "Keep driving straight ahead.", "options": ["geradeaus", "Ecke", "Kreuzung"], "answer": "geradeaus"},
        {"prompt": "Biegen Sie an der Ampel nach _______ ab.", "en": "Turn to the right at the traffic lights.", "options": ["rechts", "Weg", "Stadtplan"], "answer": "rechts"}
    ))

    # Unit 45: Wegbeschreibung 2
    units.append(make_unit(
        45, 2, "Wegbeschreibung 2", "Give directions", "#FF9600",
        [{"de": "geradeaus", "en": "straight ahead"}, {"de": "Ampel", "en": "traffic light"}, {"de": "Brücke", "en": "bridge"}, {"de": "Kreisverkehr", "en": "roundabout"}],
        [{"de": "überqueren", "en": "to cross over"}, {"de": "biegen", "en": "to turn"}, {"de": "folgen", "en": "to follow"}, {"de": "gegenüber", "en": "opposite"}],
        [{"de": "neben", "en": "next to"}, {"de": "zwischen", "en": "between"}, {"de": "Kirche", "en": "church"}, {"de": "Post", "en": "post office"}],
        [{"de": "Apotheke", "en": "pharmacy"}, {"de": "Bank", "en": "bank"}, {"de": "Meter", "en": "meter"}, {"de": "Kilometer", "en": "kilometer"}],
        {"de": "Gehen Sie über die Brücke.", "en": "Go over the bridge."},
        {"de": "An der Ampel biegen Sie rechts ab.", "en": "At the traffic light turn right."},
        {"de": "Die Post liegt direkt gegenüber der Kirche.", "en": "The post office is right opposite the church."},
        {"de": "Wie komme ich am schnellsten zur Apotheke?", "en": "How do I get to the pharmacy fastest?"},
        {"de": "Überqueren Sie die Straße und folgen Sie dem Fluss.", "en": "Cross the street and follow the river."},
        {"de": "Nach zweihundert Metern sehen Sie die Bank.", "en": "After two hundred meters you will see the bank."},
        {"partner": "Tourist", "prompt": "Wie komme ich zur alten Kirche?", "translation": "How do I get to the old church?", "options": ["Gehen Sie über die Brücke und dann links.", "Ich trinke Orangensaft."]},
        {"partner": "Tourist", "prompt": "Ist es weit von hier zu Fuß?", "translation": "Is it far from here on foot?", "options": ["Nein, nur etwa fünf Minuten.", "Danke auf Wiedersehen."]},
        {"prompt": "Type the German word for 'traffic light':", "target": "Ampel", "hint": "Hint: red, yellow, green signal"},
        {"prompt": "Type the German word for 'bridge':", "target": "Brücke", "hint": "Hint: structure over water with Umlaut ü"},
        {"prompt": "An der _______ biegen Sie bitte rechts ab.", "en": "At the traffic light please turn right.", "options": ["Ampel", "Brücke", "Post"], "answer": "Ampel"},
        {"prompt": "Die Apotheke liegt direkt _______ der Bank.", "en": "The pharmacy is right opposite the bank.", "options": ["gegenüber", "überqueren", "folgen"], "answer": "gegenüber"}
    ))

    # Unit 46: Meine Wohnung
    units.append(make_unit(
        46, 2, "Meine Wohnung", "Describe your apartment", "#CE82FF",
        [{"de": "Zimmer", "en": "room"}, {"de": "Wohnung", "en": "apartment"}, {"de": "Küche", "en": "kitchen"}, {"de": "Bad", "en": "bathroom"}],
        [{"de": "Balkon", "en": "balcony"}, {"de": "Flur", "en": "hallway"}, {"de": "Wohnzimmer", "en": "living room"}, {"de": "Schlafzimmer", "en": "bedroom"}],
        [{"de": "Miete", "en": "rent"}, {"de": "mieten", "en": "to rent"}, {"de": "hell", "en": "bright"}, {"de": "dunkel", "en": "dark"}],
        [{"de": "ruhig", "en": "quiet"}, {"de": "laut", "en": "loud"}, {"de": "Quadratmeter", "en": "square meters"}, {"de": "Garten", "en": "garden"}],
        {"de": "Meine Wohnung hat drei Zimmer.", "en": "My apartment has three rooms."},
        {"de": "Die neue Küche ist sehr modern.", "en": "The new kitchen is very modern."},
        {"de": "Das Wohnzimmer ist groß und hell.", "en": "The living room is big and bright."},
        {"de": "Wie viele Zimmer hat Ihre Wohnung?", "en": "How many rooms does your apartment have?"},
        {"de": "Wir haben einen kleinen Balkon mit Blumen.", "en": "We have a small balcony with flowers."},
        {"de": "Die Miete ist günstig und die Lage ist ruhig.", "en": "The rent is affordable and the location is quiet."},
        {"partner": "Makler", "prompt": "Gefällt Ihnen die Wohnung?", "translation": "Do you like the apartment?", "options": ["Ja, das Wohnzimmer ist sehr hell und schön.", "Ich bin 25 Jahre alt."]},
        {"partner": "Makler", "prompt": "Wie hoch ist die Miete pro Monat?", "translation": "How high is the rent per month?", "options": ["Die Miete beträgt sechshundert Euro warm.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'room':", "target": "Zimmer", "hint": "Hint: part of a flat"},
        {"prompt": "Type the German word for 'kitchen':", "target": "Küche", "hint": "Hint: room for cooking with Umlaut ü"},
        {"prompt": "Meine Wohnung hat drei _______.", "en": "My apartment has three rooms.", "options": ["Zimmer", "Küche", "Miete"], "answer": "Zimmer"},
        {"prompt": "Das Wohnzimmer ist sehr groß und _______.", "en": "The living room is very big and bright.", "options": ["hell", "dunkel", "laut"], "answer": "hell"}
    ))

    # Unit 47: Möbel & Einrichtung
    units.append(make_unit(
        47, 2, "Möbel & Einrichtung", "Furniture and rooms", "#FF4B4B",
        [{"de": "Tisch", "en": "table"}, {"de": "Stuhl", "en": "chair"}, {"de": "Bett", "en": "bed"}, {"de": "Sofa", "en": "sofa / couch"}],
        [{"de": "Schrank", "en": "closet / wardrobe"}, {"de": "Regal", "en": "shelf / bookshelf"}, {"de": "Lampe", "en": "lamp"}, {"de": "Teppich", "en": "carpet / rug"}],
        [{"de": "Spiegel", "en": "mirror"}, {"de": "Möbel", "en": "furniture"}, {"de": "stellen", "en": "to place (upright)"}, {"de": "legen", "en": "to lay (flat)"}],
        [{"de": "hängen", "en": "to hang"}, {"de": "gemütlich", "en": "cozy"}, {"de": "modern", "en": "modern"}, {"de": "neu", "en": "new"}],
        {"de": "Der Holztisch steht in der Küche.", "en": "The wooden table stands in the kitchen."},
        {"de": "Das neue Sofa ist sehr gemütlich.", "en": "The new sofa is very cozy."},
        {"de": "Ich brauche einen großen Schrank für Kleidung.", "en": "I need a big wardrobe for clothing."},
        {"de": "Wo möchten Sie das neue Bett hinstellen?", "en": "Where would you like to put the new bed?"},
        {"de": "Die moderne Lampe hängt über dem Tisch.", "en": "The modern lamp hangs above the table."},
        {"de": "Im Wohnzimmer liegt ein weicher roter Teppich.", "en": "In the living room lies a soft red rug."},
        {"partner": "Freund", "prompt": "Gefallen dir deine neuen Möbel?", "translation": "Do you like your new furniture?", "options": ["Ja, das Sofa ist unglaublich gemütlich!", "Ich esse Suppe."]},
        {"partner": "Freund", "prompt": "Woher hast du diese schöne Lampe?", "translation": "Where did you get this beautiful lamp from?", "options": ["Aus einem Möbelgeschäft in Berlin.", "Zehn Euro bitte."]},
        {"prompt": "Type the German word for 'table':", "target": "Tisch", "hint": "Hint: 5 letters starting with T"},
        {"prompt": "Type the German word for 'chair':", "target": "Stuhl", "hint": "Hint: seat with backrest"},
        {"prompt": "Das neue Sofa ist wirklich sehr _______.", "en": "The new sofa is really very cozy.", "options": ["gemütlich", "stellen", "Regal"], "answer": "gemütlich"},
        {"prompt": "Der Holztisch steht in der _______.", "en": "The wooden table stands in the kitchen.", "options": ["Küche", "Lampe", "Spiegel"], "answer": "Küche"}
    ))

    # Unit 48: Mein Tagesablauf
    units.append(make_unit(
        48, 2, "Mein Tagesablauf", "Describe your daily routine", "#00CD9C",
        [{"de": "aufstehen", "en": "to get up"}, {"de": "duschen", "en": "to shower"}, {"de": "frühstücken", "en": "to have breakfast"}, {"de": "Zähne putzen", "en": "to brush teeth"}],
        [{"de": "losgehen", "en": "to leave / set off"}, {"de": "arbeiten", "en": "to work"}, {"de": "Feierabend", "en": "end of work day"}, {"de": "kochen", "en": "to cook"}],
        [{"de": "fernsehen", "en": "to watch TV"}, {"de": "ins Bett gehen", "en": "to go to bed"}, {"de": "schlafen", "en": "to sleep"}, {"de": "Tagesablauf", "en": "daily routine"}],
        [{"de": "jeden Tag", "en": "every day"}, {"de": "zuerst", "en": "first of all"}, {"de": "danach", "en": "afterwards"}, {"de": "schließlich", "en": "finally"}],
        {"de": "Ich stehe jeden Morgen um sieben auf.", "en": "I get up every morning at seven."},
        {"de": "Zuerst dusche ich und trinke Kaffee.", "en": "First I shower and drink coffee."},
        {"de": "Um acht Uhr fahre ich zur Arbeit.", "en": "At eight o'clock I drive to work."},
        {"de": "Wie sieht dein typischer Tagesablauf aus?", "en": "What does your typical daily routine look like?"},
        {"de": "Nach dem Feierabend koche ich mit Freunden.", "en": "After work I cook with friends."},
        {"de": "Schließlich gehe ich um elf Uhr schlafen.", "en": "Finally I go to sleep at eleven o'clock."},
        {"partner": "Kollegin", "prompt": "Wann stehst du morgens normalerweise auf?", "translation": "When do you normally get up in the morning?", "options": ["Ich stehe meistens um halb sieben auf.", "Ich habe einen Hund."]},
        {"partner": "Kollegin", "prompt": "Was machst du nach der Arbeit?", "translation": "What do you do after work?", "options": ["Ich gehe zum Sport oder koche.", "Auf Wiedersehen."]},
        {"prompt": "Type the German separable verb for 'to get up':", "target": "aufstehen", "hint": "Hint: opposite of schlafen"},
        {"prompt": "Type the German word for 'end of work day':", "target": "Feierabend", "hint": "Hint: evening after working hours"},
        {"prompt": "Ich stehe jeden Morgen früh _______.", "en": "I get up early every morning.", "options": ["auf", "aus", "ein"], "answer": "auf"},
        {"prompt": "Zuerst dusche ich, _______ frühstücke ich.", "en": "First I shower, afterwards I have breakfast.", "options": ["danach", "schließlich", "jeden"], "answer": "danach"}
    ))

    # Unit 49: Uhrzeit & Termine
    units.append(make_unit(
        49, 2, "Uhrzeit & Termine", "Set and confirm appointments", "#FFC800",
        [{"de": "Termin", "en": "appointment"}, {"de": "vereinbaren", "en": "to arrange / agree on"}, {"de": "Datum", "en": "date"}, {"de": "Kalender", "en": "calendar"}],
        [{"de": "vormittags", "en": "in the morning"}, {"de": "nachmittags", "en": "in the afternoon"}, {"de": "treffen", "en": "to meet"}, {"de": "passen", "en": "to suit / fit"}],
        [{"de": "Zeit haben", "en": "to have time"}, {"de": "frei", "en": "free / open"}, {"de": "beschäftigt", "en": "busy"}, {"de": "pünktlich", "en": "punctual"}],
        [{"de": "klappen", "en": "to work out"}, {"de": "bestätigen", "en": "to confirm"}, {"de": "Montagvormittag", "en": "Monday morning"}, {"de": "Uhrzeit", "en": "time of day"}],
        {"de": "Ich möchte einen Termin vereinbaren.", "en": "I would like to make an appointment."},
        {"de": "Passt es Ihnen am kommenden Dienstag?", "en": "Does it suit you next Tuesday?"},
        {"de": "Dienstag um zehn Uhr passt mir perfekt.", "en": "Tuesday at ten o'clock suits me perfectly."},
        {"de": "Haben Sie am Freitagvormittag noch Zeit?", "en": "Do you still have time on Friday morning?"},
        {"de": "Ich trage den Termin direkt in meinen Kalender ein.", "en": "I enter the appointment right into my calendar."},
        {"de": "Super, das klappt wunderbar, bis Dienstag!", "en": "Super, that works out wonderfully, see you Tuesday!"},
        {"partner": "Sekretärin", "prompt": "Guten Tag, möchten Sie einen Termin beim Arzt?", "translation": "Good day, would you like an appointment with the doctor?", "options": ["Ja bitte, am liebsten nächste Woche.", "Ich esse Brot."]},
        {"partner": "Sekretärin", "prompt": "Geht es am Donnerstag um elf Uhr?", "translation": "Does Thursday at eleven work?", "options": ["Ja, elf Uhr passt mir sehr gut.", "Danke schön!"]},
        {"prompt": "Type the German word for 'appointment':", "target": "Termin", "hint": "Hint: scheduled meeting noun"},
        {"prompt": "Type the German word for 'calendar':", "target": "Kalender", "hint": "Hint: date tracking book"},
        {"prompt": "Ich möchte einen _______ vereinbaren.", "en": "I would like to make an appointment.", "options": ["Termin", "Datum", "Uhrzeit"], "answer": "Termin"},
        {"prompt": "Dienstag um zehn Uhr _______ mir perfekt.", "en": "Tuesday at ten o'clock suits me perfectly.", "options": ["passt", "treffen", "klappen"], "answer": "passt"}
    ))

    # Unit 50: Termin verschieben
    units.append(make_unit(
        50, 2, "Termin verschieben", "Reschedule appointments", "#1CB0F6",
        [{"de": "verschieben", "en": "to postpone / reschedule"}, {"de": "absagen", "en": "to cancel"}, {"de": "verpassen", "en": "to miss"}, {"de": "möglich", "en": "possible"}],
        [{"de": "leider", "en": "unfortunately"}, {"de": "verlegen", "en": "to shift / relocate"}, {"de": "krank", "en": "sick"}, {"de": "frisch", "en": "fresh"}],
        [{"de": "später", "en": "later"}, {"de": "früher", "en": "earlier"}, {"de": "Bescheid", "en": "notice / word"}, {"de": "nächste Woche", "en": "next week"}],
        [{"de": "Notfall", "en": "emergency"}, {"de": "tut mir leid", "en": "I am sorry"}, {"de": "Entschuldigung", "en": "excuse me"}, {"de": "danken", "en": "to thank"}],
        {"de": "Ich muss unseren Termin leider verschieben.", "en": "Unfortunately I have to postpone our appointment."},
        {"de": "Es tut mir leid, ich bin krank geworden.", "en": "I am sorry, I have become sick."},
        {"de": "Können wir das Treffen auf Freitag verlegen?", "en": "Can we move the meeting to Friday?"},
        {"de": "Wäre ein Termin nächste Woche bei Ihnen möglich?", "en": "Would an appointment next week be possible for you?"},
        {"de": "Ich gebe Ihnen rechtzeitig Bescheid.", "en": "I will give you notice in good time."},
        {"de": "Vielen Dank für Ihr Verständnis und Ihre Geduld.", "en": "Many thanks for your understanding and patience."},
        {"partner": "Praxis", "prompt": "Praxis Dr. Weber, guten Tag!", "translation": "Practice Dr. Weber, good day!", "options": ["Guten Tag, ich muss meinen Termin leider verschieben.", "Ich habe eine Schwester."]},
        {"partner": "Praxis", "prompt": "Wann würde es Ihnen stattdessen passen?", "translation": "When would it suit you instead?", "options": ["Wäre nächsten Mittwoch um drei Uhr möglich?", "Auf Wiedersehen."]},
        {"prompt": "Type the German verb for 'to reschedule / postpone':", "target": "verschieben", "hint": "Hint: prefix ver-"},
        {"prompt": "Type the German verb for 'to cancel':", "target": "absagen", "hint": "Hint: separable verb ab-"},
        {"prompt": "Ich muss den Termin leider _______.", "en": "Unfortunately I have to postpone the appointment.", "options": ["verschieben", "verpassen", "krank"], "answer": "verschieben"},
        {"prompt": "Es _______ mir leid, ich kann nicht kommen.", "en": "I am sorry, I cannot come.", "options": ["tut", "hat", "ist"], "answer": "tut"}
    ))

    # Unit 51: Freizeit & Sport
    units.append(make_unit(
        51, 2, "Freizeit & Sport", "Sports and leisure", "#58CC02",
        [{"de": "schwimmen", "en": "to swim"}, {"de": "laufen", "en": "to run"}, {"de": "joggen", "en": "to jog"}, {"de": "Fitnessstudio", "en": "gym"}],
        [{"de": "Fahrrad", "en": "bicycle"}, {"de": "trainieren", "en": "to train / work out"}, {"de": "Verein", "en": "sports club"}, {"de": "Bewegung", "en": "exercise / movement"}],
        [{"de": "Ball", "en": "ball"}, {"de": "gewinnen", "en": "to win"}, {"de": "verlieren", "en": "to lose"}, {"de": "Turnier", "en": "tournament"}],
        [{"de": "Sportart", "en": "type of sport"}, {"de": "gesund", "en": "healthy"}, {"de": "fit", "en": "fit"}, {"de": "Muskeln", "en": "muscles"}],
        {"de": "Ich gehe dreimal pro Woche schwimmen.", "en": "I go swimming three times a week."},
        {"de": "Wir trainieren regelmäßig im Fitnessstudio.", "en": "We work out regularly in the gym."},
        {"de": "Im Sommer fahre ich gerne Fahrrad.", "en": "In summer I like riding a bicycle."},
        {"de": "Welche Sportart treibst du am liebsten?", "en": "Which sport do you do most of all?"},
        {"de": "Bewegung an der frischen Luft hält gesund.", "en": "Exercise in fresh air keeps you healthy."},
        {"de": "Unser Team hat das Turnier gewonnen!", "en": "Our team has won the tournament!"},
        {"partner": "Trainer", "prompt": "Wie oft machst du Sport in der Woche?", "translation": "How often do you do sports in a week?", "options": ["Ich trainiere zwei- bis dreimal pro Woche.", "Ich bin 20 Jahre alt."]},
        {"partner": "Trainer", "prompt": "Möchtest du in unseren Sportverein eintreten?", "translation": "Would you like to join our sports club?", "options": ["Ja, das klingt super interessant!", "Gute Nacht."]},
        {"prompt": "Type the German word for 'to swim':", "target": "schwimmen", "hint": "Hint: water sport verb"},
        {"prompt": "Type the German word for 'gym':", "target": "Fitnessstudio", "hint": "Hint: workout facility"},
        {"prompt": "Ich gehe regelmäßig im Schwimmbad _______.", "en": "I go swimming regularly in the pool.", "options": ["schwimmen", "laufen", "Ball"], "answer": "schwimmen"},
        {"prompt": "Bewegung hält den Körper _______.", "en": "Exercise keeps the body healthy.", "options": ["gesund", "schwer", "spät"], "answer": "gesund"}
    ))

    # Unit 52: Musik & Konzerte
    units.append(make_unit(
        52, 2, "Musik & Konzerte", "Music and concerts", "#FF9600",
        [{"de": "Gitarre", "en": "guitar"}, {"de": "Klavier", "en": "piano"}, {"de": "Konzert", "en": "concert"}, {"de": "Band", "en": "band"}],
        [{"de": "Lied", "en": "song"}, {"de": "Sänger", "en": "singer"}, {"de": "hören", "en": "to listen / hear"}, {"de": "Ticket", "en": "ticket"}],
        [{"de": "Festival", "en": "festival"}, {"de": "Bühne", "en": "stage"}, {"de": "live", "en": "live"}, {"de": "laut", "en": "loud"}],
        [{"de": "leise", "en": "quiet / soft"}, {"de": "Klang", "en": "sound"}, {"de": "Melodie", "en": "melody"}, {"de": "begeistert", "en": "enthusiastic"}],
        {"de": "Ich spiele seit fünf Jahren Gitarre.", "en": "I have been playing guitar for five years."},
        {"de": "Wir gehen heute Abend auf ein Konzert.", "en": "We are going to a concert tonight."},
        {"de": "Die Band spielt live auf der großen Bühne.", "en": "The band plays live on the big stage."},
        {"de": "Hörst du gerne klassische Musik oder Rock?", "en": "Do you like listening to classical music or rock?"},
        {"de": "Das Lied hat eine wunderschöne Melodie.", "en": "The song has a wonderful melody."},
        {"de": "Das Publikum war von der Musik begeistert.", "en": "The audience was thrilled by the music."},
        {"partner": "Jonas", "prompt": "Kommst du mit zum Rockkonzert am Samstag?", "translation": "Are you coming along to the rock concert on Saturday?", "options": ["Ja, ich habe schon zwei Tickets gekauft!", "Ich wohne in Frankfurt."]},
        {"partner": "Jonas", "prompt": "Spielst du selbst ein Musikinstrument?", "translation": "Do you play a musical instrument yourself?", "options": ["Ja, ich spiele ein bisschen Klavier.", "Danke sehr."]},
        {"prompt": "Type the German word for 'guitar':", "target": "Gitarre", "hint": "Hint: string instrument"},
        {"prompt": "Type the German word for 'concert':", "target": "Konzert", "hint": "Hint: live musical performance"},
        {"prompt": "Ich spiele sehr gerne _______.", "en": "I play guitar very gladly.", "options": ["Gitarre", "Konzert", "Bühne"], "answer": "Gitarre"},
        {"prompt": "Wir gehen heute auf ein tolles _______.", "en": "We are going to a great concert today.", "options": ["Konzert", "Ticket", "Lied"], "answer": "Konzert"}
    ))

    # Unit 53: Medien im Alltag
    units.append(make_unit(
        53, 2, "Medien im Alltag", "Internet, phone, and TV", "#CE82FF",
        [{"de": "Internet", "en": "internet"}, {"de": "Handy", "en": "cell phone / mobile"}, {"de": "Fernseher", "en": "television"}, {"de": "Nachricht", "en": "message / news"}],
        [{"de": "Computer", "en": "computer"}, {"de": "Tablet", "en": "tablet"}, {"de": "surfen", "en": "to surf (online)"}, {"de": "App", "en": "app"}],
        [{"de": "online", "en": "online"}, {"de": "schicken", "en": "to send"}, {"de": "tippen", "en": "to type"}, {"de": "Bildschirm", "en": "screen"}],
        [{"de": "soziale Medien", "en": "social media"}, {"de": "Akkulaufzeit", "en": "battery life"}, {"de": "WLAN", "en": "Wi-Fi"}, {"de": "vernetzt", "en": "connected"}],
        {"de": "Ich surfe jeden Tag im Internet.", "en": "I surf on the internet every day."},
        {"de": "Mein Handy hat leider keinen Akku mehr.", "en": "Unfortunately my phone has no battery left."},
        {"de": "Ich schicke dir eine Nachricht per WhatsApp.", "en": "I send you a message via WhatsApp."},
        {"de": "Wie viele Stunden verbringst du am Computer?", "en": "How many hours do you spend on the computer?"},
        {"de": "Haben Sie hier kostenloses WLAN im Café?", "en": "Do you have free Wi-Fi here in the café?"},
        {"de": "Am Abend schaue ich gerne Nachrichten im Fernsehen.", "en": "In the evening I like watching news on TV."},
        {"partner": "Lea", "prompt": "Hast du meine E-Mail bekommen?", "translation": "Did you get my email?", "options": ["Ja, ich habe sie gerade auf dem Handy gelesen.", "Ich habe zwei Schwestern."]},
        {"partner": "Lea", "prompt": "Wie lautet das WLAN-Passwort hier?", "translation": "What is the Wi-Fi password here?", "options": ["Es steht dort an der Wand.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'mobile phone':", "target": "Handy", "hint": "Hint: 5 letters starting with H"},
        {"prompt": "Type the German word for 'television':", "target": "Fernseher", "hint": "Hint: home TV device"},
        {"prompt": "Ich surfe jeden Abend im _______.", "en": "I surf on the internet every evening.", "options": ["Internet", "Handy", "WLAN"], "answer": "Internet"},
        {"prompt": "Ich schicke dir gleich eine _______.", "en": "I will send you a message right away.", "options": ["Nachricht", "Bildschirm", "Akkulaufzeit"], "answer": "Nachricht"}
    ))

    # Unit 54: Wetterbericht
    units.append(make_unit(
        54, 2, "Wetterbericht", "Detailed weather reports", "#FF4B4B",
        [{"de": "Wolke", "en": "cloud"}, {"de": "Gewitter", "en": "thunderstorm"}, {"de": "Nebel", "en": "fog"}, {"de": "Temperatur", "en": "temperature"}],
        [{"de": "Grad", "en": "degrees"}, {"de": "Schirm", "en": "umbrella"}, {"de": "Sturm", "en": "storm / gale"}, {"de": "Blitz", "en": "lightning"}],
        [{"de": "Donner", "en": "thunder"}, {"de": "bewölkt", "en": "cloudy / overcast"}, {"de": "frostig", "en": "frosty"}, {"de": "Wetterbericht", "en": "weather forecast"}],
        [{"de": "voraussagen", "en": "to forecast"}, {"de": "sinken", "en": "to drop / sink"}, {"de": "steigen", "en": "to rise"}, {"de": "feucht", "en": "humid / damp"}],
        {"de": "Der Wetterbericht meldet ein starkes Gewitter.", "en": "The weather forecast reports a heavy thunderstorm."},
        {"de": "Die Temperatur sinkt heute auf fünf Grad.", "en": "The temperature drops today to five degrees."},
        {"de": "Morgens liegt dichter Nebel über der Stadt.", "en": "In the morning dense fog lies over the city."},
        {"de": "Haben Sie heute einen Regenschirm dabei?", "en": "Do you have an umbrella with you today?"},
        {"de": "Der Himmel ist den ganzen Tag grau und bewölkt.", "en": "The sky is gray and cloudy all day."},
        {"de": "Morgen steigen die Temperaturen wieder auf zwanzig Grad.", "en": "Tomorrow temperatures rise again to twenty degrees."},
        {"partner": "Nachbar", "prompt": "Wird es heute noch regnen?", "translation": "Will it rain today?", "options": ["Ja, am Nachmittag kommt ein Gewitter.", "Ich esse einen Apfel."]},
        {"partner": "Nachbar", "prompt": "Soll ich die Fenster schließen?", "translation": "Should I close the windows?", "options": ["Ja, es kommt starker Wind auf.", "Danke schön!"]},
        {"prompt": "Type the German word for 'cloud':", "target": "Wolke", "hint": "Hint: 5 letters starting with W"},
        {"prompt": "Type the German word for 'thunderstorm':", "target": "Gewitter", "hint": "Hint: storm with lightning and thunder"},
        {"prompt": "Der Himmel ist heute stark _______.", "en": "The sky is heavily overcast today.", "options": ["bewölkt", "frostig", "feucht"], "answer": "bewölkt"},
        {"prompt": "Nimm einen _______ mit, es regnet!", "en": "Take an umbrella along, it's raining!", "options": ["Schirm", "Nebel", "Blitz"], "answer": "Schirm"}
    ))

    # Unit 55: Modalverb: können
    units.append(make_unit(
        55, 2, "Modalverb: können", "Express abilities with können", "#00CD9C",
        [{"de": "können", "en": "can / able to"}, {"de": "kann", "en": "can (1st/3rd pers)"}, {"de": "kannst", "en": "can (2nd pers)"}, {"de": "Fähigkeit", "en": "ability"}],
        [{"de": "schwimmen", "en": "to swim"}, {"de": "sprechen", "en": "to speak"}, {"de": "fahren", "en": "to drive"}, {"de": "kochen", "en": "to cook"}],
        [{"de": "Führerschein", "en": "driver's license"}, {"de": "Gitarre", "en": "guitar"}, {"de": "Sprache", "en": "language"}, {"de": "Möglichkeit", "en": "possibility"}],
        [{"de": "sehr gut", "en": "very well"}, {"de": "leider nicht", "en": "unfortunately not"}, {"de": "helfen", "en": "to help"}, {"de": "verstehen", "en": "to understand"}],
        {"de": "Ich kann gut Deutsch sprechen.", "en": "I can speak German well."},
        {"de": "Kannst du mir bitte kurz helfen?", "en": "Can you please help me briefly?"},
        {"de": "Er kann sehr gut Auto fahren.", "en": "He can drive a car very well."},
        {"de": "Können Sie diese Aufgabe lösen?", "en": "Can you solve this task?"},
        {"de": "Ich kann leider heute Abend nicht kommen.", "en": "Unfortunately I cannot come tonight."},
        {"de": "Wir können drei verschiedene Sprachen fließend sprechen.", "en": "We can speak three different languages fluently."},
        {"partner": "Kollege", "prompt": "Kannst du mir bei diesem Formular helfen?", "translation": "Can you help me with this form?", "options": ["Ja natürlich, ich kann dir gerne helfen.", "Heute ist Donnerstag."]},
        {"partner": "Kollege", "prompt": "Kannst du schon gut Deutsch verstehen?", "translation": "Can you already understand German well?", "options": ["Ja, ich verstehe fast alles.", "Auf Wiedersehen."]},
        {"prompt": "Type the German modal verb for 'can / to be able':", "target": "können", "hint": "Hint: modal verb with Umlaut ö"},
        {"prompt": "Type the 1st person form 'I can':", "target": "kann", "hint": "Hint: irregular form without umlaut"},
        {"prompt": "Ich _______ schon gut Deutsch sprechen.", "en": "I can already speak German well.", "options": ["kann", "können", "kannst"], "answer": "kann"},
        {"prompt": "_______ du mir bitte helfen?", "en": "Can you please help me?", "options": ["Kannst", "Kann", "Können"], "answer": "Kannst"}
    ))

    # Unit 56: Modalverb: müssen
    units.append(make_unit(
        56, 2, "Modalverb: müssen", "Express obligations with müssen", "#FFC800",
        [{"de": "müssen", "en": "must / to have to"}, {"de": "muss", "en": "must (1st/3rd pers)"}, {"de": "musst", "en": "must (2nd pers)"}, {"de": "Pflicht", "en": "duty / obligation"}],
        [{"de": "arbeiten", "en": "to work"}, {"de": "lernen", "en": "to learn / study"}, {"de": "aufstehen", "en": "to get up"}, {"de": "putzen", "en": "to clean"}],
        [{"de": "Hausaufgabe", "en": "homework"}, {"de": "Arzt", "en": "doctor"}, {"de": "Medikament", "en": "medicine"}, {"de": "Regel", "en": "rule"}],
        [{"de": "dringend", "en": "urgent"}, {"de": "pünktlich", "en": "punctual"}, {"de": "erledigen", "en": "to take care of"}, {"de": "gehen", "en": "to go / leave"}],
        {"de": "Ich muss jetzt leider gehen.", "en": "Unfortunately I have to go now."},
        {"de": "Du musst für die Prüfung lernen.", "en": "You have to study for the exam."},
        {"de": "Er muss jeden Tag früh aufstehen.", "en": "He has to get up early every day."},
        {"de": "Musst du heute Abend noch arbeiten?", "en": "Do you still have to work tonight?"},
        {"de": "Wir müssen pünktlich am Bahnhof sein.", "en": "We have to be at the station on time."},
        {"de": "Ich muss dringend ein wichtiges Formular ausfüllen.", "en": "I urgently have to fill out an important form."},
        {"partner": "Freundin", "prompt": "Kommst du mit ins Kino heute Abend?", "translation": "Are you coming along to the cinema tonight?", "options": ["Ich muss leider für meine Prüfung lernen.", "Ich mag Äpfel."]},
        {"partner": "Freundin", "prompt": "Musst du morgen auch früh aufstehen?", "translation": "Do you also have to get up early tomorrow?", "options": ["Ja, mein Wecker klingelt um sechs Uhr.", "Gute Nacht."]},
        {"prompt": "Type the German modal verb for 'must / have to':", "target": "müssen", "hint": "Hint: modal verb with Umlaut ü"},
        {"prompt": "Type the 1st person form 'I must':", "target": "muss", "hint": "Hint: 4 letters without umlaut"},
        {"prompt": "Ich _______ jetzt zur Arbeit fahren.", "en": "I must drive to work now.", "options": ["muss", "müssen", "musst"], "answer": "muss"},
        {"prompt": "Du _______ deine Hausaufgabe machen.", "en": "You must do your homework.", "options": ["musst", "muss", "müssen"], "answer": "musst"}
    ))

    # Unit 57: Modalverb: wollen
    units.append(make_unit(
        57, 2, "Modalverb: wollen", "Express intentions with wollen", "#1CB0F6",
        [{"de": "wollen", "en": "to want to"}, {"de": "will", "en": "wants (1st/3rd pers)"}, {"de": "willst", "en": "want (2nd pers)"}, {"de": "Absicht", "en": "intention"}],
        [{"de": "reisen", "en": "to travel"}, {"de": "kaufen", "en": "to buy"}, {"de": "besuchen", "en": "to visit"}, {"de": "planen", "en": "to plan"}],
        [{"de": "Traum", "en": "dream"}, {"de": "Ziel", "en": "goal"}, {"de": "Wunsch", "en": "wish"}, {"de": "Zukunft", "en": "future"}],
        [{"de": "unbedingt", "en": "absolutely"}, {"de": "morgen", "en": "tomorrow"}, {"de": "später", "en": "later"}, {"de": "nächstes Jahr", "en": "next year"}],
        {"de": "Ich will Deutsch fließend lernen.", "en": "I want to learn German fluently."},
        {"de": "Was willst du am Wochenende machen?", "en": "What do you want to do on the weekend?"},
        {"de": "Er will im Sommer nach Deutschland reisen.", "en": "He wants to travel to Germany in the summer."},
        {"de": "Wollt ihr heute mit uns essen gehen?", "en": "Do you guys want to go eat with us today?"},
        {"de": "Ich will unbedingt mein Studium erfolgreich beenden.", "en": "I absolutely want to finish my studies successfully."},
        {"de": "Wir wollen ein schönes Haus am See kaufen.", "en": "We want to buy a beautiful house by the lake."},
        {"partner": "Simon", "prompt": "Was willst du nach dem Deutschkurs machen?", "translation": "What do you want to do after the German course?", "options": ["Ich will an der Universität studieren.", "Ich trinke Tee."]},
        {"partner": "Simon", "prompt": "Willst du mit mir einen Kaffee trinken?", "translation": "Do you want to drink a coffee with me?", "options": ["Ja gerne, ich will eine Pause machen.", "Auf Wiedersehen."]},
        {"prompt": "Type the German modal verb for 'to want':", "target": "wollen", "hint": "Hint: verb of intention"},
        {"prompt": "Type the 1st person form 'I want':", "target": "will", "hint": "Hint: 4 letters starting with w"},
        {"prompt": "Ich _______ im Sommer nach Berlin reisen.", "en": "I want to travel to Berlin in the summer.", "options": ["will", "wollen", "willst"], "answer": "will"},
        {"prompt": "Was _______ du am Wochenende machen?", "en": "What do you want to do on the weekend?", "options": ["willst", "will", "wollen"], "answer": "willst"}
    ))

    # Unit 58: Modalverb: möchten
    units.append(make_unit(
        58, 2, "Modalverb: möchten", "Polite wishes with möchten", "#58CC02",
        [{"de": "möchten", "en": "would like"}, {"de": "möchte", "en": "would like (1st/3rd pers)"}, {"de": "möchtest", "en": "would like (2nd pers)"}, {"de": "Höflichkeit", "en": "politeness"}],
        [{"de": "bestellen", "en": "to order"}, {"de": "fragen", "en": "to ask"}, {"de": "einladen", "en": "to invite"}, {"de": "trinken", "en": "to drink"}],
        [{"de": "Wunsch", "en": "wish"}, {"de": "Platz nehmen", "en": "to take a seat"}, {"de": "helfen", "en": "to help"}, {"de": "wissen", "en": "to know"}],
        [{"de": "gerne", "en": "gladly"}, {"de": "bitte", "en": "please"}, {"de": "Tasse", "en": "cup"}, {"de": "Stück", "en": "piece"}],
        {"de": "Ich möchte einen Kaffee bitte.", "en": "I would like a coffee please."},
        {"de": "Möchtest du ein Stück Kuchen essen?", "en": "Would you like to eat a piece of cake?"},
        {"de": "Wir möchten gerne ein Zimmer reservieren.", "en": "We would gladly like to reserve a room."},
        {"de": "Was möchten Sie trinken, Herr Weber?", "en": "What would you like to drink, Mr. Weber?"},
        {"de": "Ich möchte Ihnen ganz herzlich danken.", "en": "I would like to thank you very warmly."},
        {"de": "Möchten Sie hier am Fenster Platz nehmen?", "en": "Would you like to take a seat here by the window?"},
        {"partner": "Kellner", "prompt": "Was möchten Sie bestellen?", "translation": "What would you like to order?", "options": ["Ich möchte das Tagesgericht und ein Wasser.", "Ich bin 30 Jahre alt."]},
        {"partner": "Kellner", "prompt": "Möchten Sie noch ein Dessert haben?", "translation": "Would you like another dessert?", "options": ["Nein danke, nur die Rechnung bitte.", "Tschüss auf Wiedersehen."]},
        {"prompt": "Type the German polite verb form 'would like':", "target": "möchten", "hint": "Hint: has Umlaut ö"},
        {"prompt": "Type the 1st person form 'I would like':", "target": "möchte", "hint": "Hint: ends with e"},
        {"prompt": "Ich _______ gerne einen Apfelsaft.", "en": "I would gladly like an apple juice.", "options": ["möchte", "möchtest", "möchten"], "answer": "möchte"},
        {"prompt": "Was _______ Sie trinken?", "en": "What would you like to drink?", "options": ["möchten", "möchte", "möchtest"], "answer": "möchten"}
    ))

    # Unit 59: Trennverb: einkaufen
    units.append(make_unit(
        59, 2, "Trennverb: einkaufen", "Separable verbs: einkaufen", "#FF9600",
        [{"de": "einkaufen", "en": "to shop / buy groceries"}, {"de": "kauft ein", "en": "shops (separable)"}, {"de": "Supermarkt", "en": "supermarket"}, {"de": "Einkaufswagen", "en": "shopping cart"}],
        [{"de": "Einkaufsliste", "en": "shopping list"}, {"de": "Lebensmittel", "en": "groceries / food"}, {"de": "Korb", "en": "basket"}, {"de": "Angebot", "en": "special offer"}],
        [{"de": "einpacken", "en": "to pack up"}, {"de": "mitbringen", "en": "to bring along"}, {"de": "Gemüse", "en": "vegetables"}, {"de": "Obst", "en": "fruit"}],
        [{"de": "frisch", "en": "fresh"}, {"de": "billig", "en": "cheap"}, {"de": "brauchen", "en": "to need"}, {"de": "Samstag", "en": "Saturday"}],
        {"de": "Ich kaufe heute im Supermarkt ein.", "en": "I am shopping at the supermarket today."},
        {"de": "Er kauft am Samstag frisches Obst ein.", "en": "He shops for fresh fruit on Saturday."},
        {"de": "Wir packen alle Lebensmittel in die Tasche ein.", "en": "We pack all the groceries into the bag."},
        {"de": "Kaufst du heute Abend für uns ein?", "en": "Are you shopping for groceries for us tonight?"},
        {"de": "Ich schreibe zuerst eine lange Einkaufsliste.", "en": "First I write a long shopping list."},
        {"de": "Bringst du bitte Milch und Brot vom Supermarkt mit?", "en": "Could you bring milk and bread from the store along?"},
        {"partner": "Mitbewohner", "prompt": "Kaufst du heute nach der Arbeit ein?", "translation": "Are you shopping after work today?", "options": ["Ja, ich kaufe Brot und Käse ein.", "Ich spiele Gitarre."]},
        {"partner": "Mitbewohner", "prompt": "Brauchen wir noch Butter und Eier?", "translation": "Do we still need butter and eggs?", "options": ["Ja, ich schreibe es auf die Liste.", "Danke auf Wiedersehen."]},
        {"prompt": "Type the German separable verb for 'to shop for groceries':", "target": "einkaufen", "hint": "Hint: prefix ein-"},
        {"prompt": "Type the German word for 'groceries / food':", "target": "Lebensmittel", "hint": "Hint: compound noun starting with L"},
        {"prompt": "Ich kaufe heute im Supermarkt _______.", "en": "I am shopping at the supermarket today.", "options": ["ein", "auf", "an"], "answer": "ein"},
        {"prompt": "Er _______ jeden Samstag für die Familie ein.", "en": "He shops for the family every Saturday.", "options": ["kauft", "macht", "geht"], "answer": "kauft"}
    ))

    # Unit 60: Trennverb: anrufen
    units.append(make_unit(
        60, 2, "Trennverb: anrufen", "Separable verbs: anrufen", "#CE82FF",
        [{"de": "anrufen", "en": "to call / phone"}, {"de": "ruft an", "en": "calls (separable)"}, {"de": "Telefon", "en": "telephone"}, {"de": "Telefonnummer", "en": "phone number"}],
        [{"de": "zurückrufen", "en": "to call back"}, {"de": "Gespräch", "en": "conversation / call"}, {"de": "klingeln", "en": "to ring"}, {"de": "Mailbox", "en": "voicemail"}],
        [{"de": "Nachricht", "en": "message"}, {"de": "hinterlassen", "en": "to leave (a message)"}, {"de": "besetzt", "en": "busy / occupied"}, {"de": "abheben", "en": "to pick up"}],
        [{"de": "auflegen", "en": "to hang up"}, {"de": "später", "en": "later"}, {"de": "gleich", "en": "right away"}, {"de": "hören", "en": "to hear"}],
        {"de": "Ich rufe dich heute Abend an.", "en": "I will call you tonight."},
        {"de": "Meine Mutter ruft mich jeden Sonntag an.", "en": "My mother calls me every Sunday."},
        {"de": "Die Leitung ist leider gerade besetzt.", "en": "The line is unfortunately busy right now."},
        {"de": "Rufst du morgen den Arzt wegen des Termins an?", "en": "Are you calling the doctor tomorrow about the appointment?"},
        {"de": "Bitte hinterlassen Sie eine kurze Nachricht auf der Mailbox.", "en": "Please leave a short message on the voicemail."},
        {"de": "Ich kann jetzt nicht sprechen, ich rufe dich gleich zurück.", "en": "I cannot speak now, I will call you back right away."},
        {"partner": "Freund", "prompt": "Wann rufst du mich heute an?", "translation": "When are you calling me today?", "options": ["Ich rufe dich nach dem Abendessen an.", "Heute ist Mittwoch."]},
        {"partner": "Freund", "prompt": "Hast du meine Nachricht abgehört?", "translation": "Did you listen to my message?", "options": ["Ja, ich habe alles verstanden.", "Fünfzehn Euro bitte."]},
        {"prompt": "Type the German separable verb for 'to call on phone':", "target": "anrufen", "hint": "Hint: prefix an-"},
        {"prompt": "Type the German word for 'message':", "target": "Nachricht", "hint": "Hint: text or voice info"},
        {"prompt": "Ich rufe dich heute Abend _______.", "en": "I will call you tonight.", "options": ["an", "auf", "ein"], "answer": "an"},
        {"prompt": "Er _______ seine Eltern jeden Sonntag an.", "en": "He calls his parents every Sunday.", "options": ["ruft", "sagt", "hört"], "answer": "ruft"}
    ))

    # Unit 61: Trennverb: mitkommen
    units.append(make_unit(
        61, 2, "Trennverb: mitkommen", "Separable verbs: mitkommen", "#FF4B4B",
        [{"de": "mitkommen", "en": "to come along"}, {"de": "kommt mit", "en": "comes along"}, {"de": "mitgehen", "en": "to go along"}, {"de": "mitbringen", "en": "to bring along"}],
        [{"de": "Kino", "en": "cinema"}, {"de": "Party", "en": "party"}, {"de": "Park", "en": "park"}, {"de": "Freizeit", "en": "free time"}],
        [{"de": "Lust haben", "en": "to feel like / want"}, {"de": "Zeit haben", "en": "to have time"}, {"de": "abholen", "en": "to pick up"}, {"de": "Treffpunkt", "en": "meeting point"}],
        [{"de": "zusammen", "en": "together"}, {"de": "einladen", "en": "to invite"}, {"de": "Freund", "en": "friend"}, {"de": "heute Abend", "en": "this evening"}],
        {"de": "Kommst du heute mit ins Kino?", "en": "Are you coming along to the cinema today?"},
        {"de": "Ich komme sehr gerne mit dir mit.", "en": "I am very gladly coming along with you."},
        {"de": "Wir bringen leckere Snacks zur Party mit.", "en": "We bring delicious snacks along to the party."},
        {"de": "Hast du Lust, morgen in den Park mitzukommen?", "en": "Do you feel like coming along to the park tomorrow?"},
        {"de": "Ich hole dich um sieben Uhr mit dem Auto ab.", "en": "I pick you up at seven o'clock by car."},
        {"de": "Alle Freunde kommen heute Abend zu unserer Feier mit.", "en": "All friends are coming along to our celebration tonight."},
        {"partner": "Alex", "prompt": "Kommst du heute mit zum Fußballspiel?", "translation": "Are you coming along to the soccer game today?", "options": ["Ja, ich habe Lust und komme gerne mit!", "Ich esse Suppe."]},
        {"partner": "Alex", "prompt": "Soll ich dich von zu Hause abholen?", "translation": "Shall I pick you up from home?", "options": ["Ja, um halb sechs wäre super.", "Auf Wiedersehen."]},
        {"prompt": "Type the German separable verb for 'to come along':", "target": "mitkommen", "hint": "Hint: prefix mit-"},
        {"prompt": "Type the German word for 'meeting point':", "target": "Treffpunkt", "hint": "Hint: compound noun"},
        {"prompt": "Kommst du heute mit ins Kino _______?", "en": "Are you coming along to the cinema today?", "options": ["mit", "ein", "ab"], "answer": "mit"},
        {"prompt": "Ich _______ dich um sieben Uhr vom Bahnhof ab.", "en": "I pick you up at seven from the station.", "options": ["hole", "komme", "bringe"], "answer": "hole"}
    ))

    # Unit 62: Akkusativ: bestimmter Artikel
    units.append(make_unit(
        62, 2, "Akkusativ: bestimmter Artikel", "Accusative definite articles", "#00CD9C",
        [{"de": "den", "en": "the (acc masc)"}, {"de": "die", "en": "the (acc fem/pl)"}, {"de": "das", "en": "the (acc neut)"}, {"de": "Mann", "en": "man"}],
        [{"de": "Tisch", "en": "table"}, {"de": "Apfel", "en": "apple"}, {"de": "Schlüssel", "en": "key"}, {"de": "Koffer", "en": "suitcase"}],
        [{"de": "sehen", "en": "to see"}, {"de": "suchen", "en": "to look for"}, {"de": "finden", "en": "to find"}, {"de": "kaufen", "en": "to buy"}],
        [{"de": "brauchen", "en": "to need"}, {"de": "kennen", "en": "to know (person/place)"}, {"de": "nehmen", "en": "to take"}, {"de": "haben", "en": "to have"}],
        {"de": "Ich sehe den großen Tisch.", "en": "I see the big table."},
        {"de": "Ich suche den Schlüssel für die Wohnung.", "en": "I look for the key for the apartment."},
        {"de": "Er kauft den roten Apfel auf dem Markt.", "en": "He buys the red apple at the market."},
        {"de": "Kennst du den netten Mann dort drüben?", "en": "Do you know the nice man over there?"},
        {"de": "Wir nehmen den schnellen Zug nach Frankfurt.", "en": "We take the fast train to Frankfurt."},
        {"de": "Ich brauche den großen Koffer für meine Reise.", "en": "I need the big suitcase for my trip."},
        {"partner": "Kollege", "prompt": "Hast du den neuen Computer gesehen?", "translation": "Have you seen the new computer?", "options": ["Ja, ich habe den Computer im Büro gesehen.", "Ich mag Musik."]},
        {"partner": "Kollege", "prompt": "Suchst du den Autoschlüssel?", "translation": "Are you looking for the car key?", "options": ["Ja, ich kann den Schlüssel nirgends finden.", "Danke auf Wiedersehen."]},
        {"prompt": "Type the German accusative masculine definite article:", "target": "den", "hint": "Hint: 3 letters starting with d"},
        {"prompt": "Type the German word for 'key':", "target": "Schlüssel", "hint": "Hint: opens locks, with Umlaut ü"},
        {"prompt": "Ich suche _______ Schlüssel für die Haustür.", "en": "I look for the key for the front door.", "options": ["den", "der", "das"], "answer": "den"},
        {"prompt": "Er kauft _______ roten Apfel.", "en": "He buys the red apple.", "options": ["den", "dem", "die"], "answer": "den"}
    ))

    # Unit 63: Akkusativ: unbestimmter Artikel
    units.append(make_unit(
        63, 2, "Akkusativ: unbestimmter Artikel", "Accusative indefinite articles", "#FFC800",
        [{"de": "einen", "en": "a / an (acc masc)"}, {"de": "eine", "en": "a / an (acc fem)"}, {"de": "ein", "en": "a / an (acc neut)"}, {"de": "Kaffee", "en": "coffee"}],
        [{"de": "Tee", "en": "tea"}, {"de": "Salat", "en": "salad"}, {"de": "Kuchen", "en": "cake"}, {"de": "Suppe", "en": "soup"}],
        [{"de": "Brötchen", "en": "bread roll"}, {"de": "Wasser", "en": "water"}, {"de": "Buch", "en": "book"}, {"de": "Stift", "en": "pen"}],
        [{"de": "bestellen", "en": "to order"}, {"de": "trinken", "en": "to drink"}, {"de": "essen", "en": "to eat"}, {"de": "möchten", "en": "would like"}],
        {"de": "Ich möchte einen heißen Kaffee.", "en": "I would like a hot coffee."},
        {"de": "Er isst einen frischen Salat zu Mittag.", "en": "He eats a fresh salad for lunch."},
        {"de": "Ich kaufe ein neues deutsches Buch.", "en": "I buy a new German book."},
        {"de": "Möchten Sie einen süßen Kuchen zum Kaffee?", "en": "Would you like a sweet cake with coffee?"},
        {"de": "Ich bestelle eine warme Suppe und ein Brötchen.", "en": "I order a warm soup and a bread roll."},
        {"de": "Hast du einen Stift für mich zum Schreiben?", "en": "Do you have a pen for me to write with?"},
        {"partner": "Kellnerin", "prompt": "Was möchten Sie trinken?", "translation": "What would you like to drink?", "options": ["Ich nehme einen Kaffee mit Milch, bitte.", "Ich habe zwei Schwestern."]},
        {"partner": "Kellnerin", "prompt": "Möchten Sie auch etwas zu essen?", "translation": "Would you also like something to eat?", "options": ["Ja, einen kleinen gemischten Salat bitte.", "Auf Wiedersehen."]},
        {"prompt": "Type the German accusative masculine indefinite article:", "target": "einen", "hint": "Hint: 5 letters ending with -en"},
        {"prompt": "Type the German word for 'cake':", "target": "Kuchen", "hint": "Hint: baked sweet treat"},
        {"prompt": "Ich trinke morgens _______ heißen Kaffee.", "en": "I drink a hot coffee in the morning.", "options": ["einen", "ein", "eine"], "answer": "einen"},
        {"prompt": "Hast du _______ Stift für mich?", "en": "Do you have a pen for me?", "options": ["einen", "ein", "eine"], "answer": "einen"}
    ))

    # Unit 64: Akkusativ: Negation keinen
    units.append(make_unit(
        64, 2, "Akkusativ: Negation keinen", "Accusative negation with keinen", "#1CB0F6",
        [{"de": "keinen", "en": "no / not any (acc masc)"}, {"de": "keine", "en": "no / not any (acc fem/pl)"}, {"de": "kein", "en": "no / not any (acc neut)"}, {"de": "Hunger", "en": "hunger"}],
        [{"de": "Durst", "en": "thirst"}, {"de": "Kaffee", "en": "coffee"}, {"de": "Zucker", "en": "sugar"}, {"de": "Fehler", "en": "mistake"}],
        [{"de": "Regenschirm", "en": "umbrella"}, {"de": "Plan", "en": "plan"}, {"de": "Koffer", "en": "suitcase"}, {"de": "Wagen", "en": "car / cart"}],
        [{"de": "haben", "en": "to have"}, {"de": "brauchen", "en": "to need"}, {"de": "sehen", "en": "to see"}, {"de": "finden", "en": "to find"}],
        {"de": "Ich habe heute keinen Hunger.", "en": "I have no hunger today."},
        {"de": "Ich trinke meinen Tee ohne Zucker.", "en": "I drink my tea without sugar."},
        {"de": "Er hat leider keinen Regenschirm dabei.", "en": "Unfortunately he has no umbrella with him."},
        {"de": "Hast du wirklich keinen Durst nach dem Sport?", "en": "Are you really not thirsty after sports?"},
        {"de": "Ich mache in diesem Satz keinen einzigen Fehler.", "en": "I make not a single mistake in this sentence."},
        {"de": "Wir haben heute keinen festen Plan für den Abend.", "en": "We have no fixed plan for tonight today."},
        {"partner": "Freund", "prompt": "Möchtest du ein Stück Pizza essen?", "translation": "Would you like to eat a slice of pizza?", "options": ["Nein danke, ich habe wirklich keinen Hunger.", "Heute ist Freitag."]},
        {"partner": "Freund", "prompt": "Trinkst du deinen Kaffee mit Milch?", "translation": "Do you drink your coffee with milk?", "options": ["Ja, aber bitte ohne Zucker.", "Danke schön!"]},
        {"prompt": "Type the German accusative masculine negative article:", "target": "keinen", "hint": "Hint: 6 letters ending with -en"},
        {"prompt": "Type the German word for 'mistake':", "target": "Fehler", "hint": "Hint: error noun"},
        {"prompt": "Ich habe heute wirklich _______ Hunger.", "en": "I really have no hunger today.", "options": ["keinen", "kein", "keine"], "answer": "keinen"},
        {"prompt": "Er hat leider _______ Regenschirm dabei.", "en": "Unfortunately he has no umbrella with him.", "options": ["keinen", "kein", "keine"], "answer": "keinen"}
    ))

    # Unit 65: Akkusativ-Pronomen
    units.append(make_unit(
        65, 2, "Akkusativ-Pronomen", "Accusative pronouns (mich, dich)", "#58CC02",
        [{"de": "mich", "en": "me (acc)"}, {"de": "dich", "en": "you (acc sing)"}, {"de": "ihn", "en": "him (acc)"}, {"de": "sie", "en": "her / them (acc)"}],
        [{"de": "uns", "en": "us (acc)"}, {"de": "euch", "en": "you all (acc pl)"}, {"de": "jemanden", "en": "someone (acc)"}, {"de": "es", "en": "it (acc)"}],
        [{"de": "sehen", "en": "to see"}, {"de": "hören", "en": "to hear"}, {"de": "verstehen", "en": "to understand"}, {"de": "anrufen", "en": "to call"}],
        [{"de": "lieben", "en": "to love"}, {"de": "besuchen", "en": "to visit"}, {"de": "fragen", "en": "to ask"}, {"de": "kennen", "en": "to know"}],
        {"de": "Ich liebe dich von ganzem Herzen.", "en": "I love you with all my heart."},
        {"de": "Hörst du mich gut am Telefon?", "en": "Do you hear me well on the phone?"},
        {"de": "Ich kenne ihn schon seit vielen Jahren.", "en": "I have known him for many years."},
        {"de": "Kannst du uns morgen im Büro besuchen?", "en": "Can you visit us tomorrow in the office?"},
        {"de": "Ich rufe Sie morgen früh pünktlich an.", "en": "I will call you promptly tomorrow morning."},
        {"de": "Der Lehrer versteht mich heute sehr gut.", "en": "The teacher understands me very well today."},
        {"partner": "Lisa", "prompt": "Siehst du mich dort an der Haltestelle?", "translation": "Do you see me there at the bus stop?", "options": ["Ja, ich sehe dich und winke dir!", "Ich habe keinen Durst."]},
        {"partner": "Lisa", "prompt": "Rufst du mich heute Abend an?", "translation": "Are you calling me tonight?", "options": ["Ja, ich rufe dich um acht Uhr an.", "Auf Wiedersehen."]},
        {"prompt": "Type the German accusative pronoun for 'me':", "target": "mich", "hint": "Hint: 4 letters starting with m"},
        {"prompt": "Type the German accusative pronoun for 'you' (informal):", "target": "dich", "hint": "Hint: 4 letters starting with d"},
        {"prompt": "Hörst du _______ gut am Telefon?", "en": "Do you hear me well on the phone?", "options": ["mich", "mir", "ich"], "answer": "mich"},
        {"prompt": "Ich liebe _______ von ganzem Herzen.", "en": "I love you with all my heart.", "options": ["dich", "dir", "du"], "answer": "dich"}
    ))

    # Unit 66: Gestern & Früher
    units.append(make_unit(
        66, 2, "Gestern & Früher", "Introduction to the past", "#FF9600",
        [{"de": "gestern", "en": "yesterday"}, {"de": "vorgestern", "en": "day before yesterday"}, {"de": "früher", "en": "earlier / in the past"}, {"de": "damals", "en": "back then"}],
        [{"de": "letzte Woche", "en": "last week"}, {"de": "letztes Jahr", "en": "last year"}, {"de": "letzten Monat", "en": "last month"}, {"de": "war", "en": "was"}],
        [{"de": "hatte", "en": "had"}, {"de": "gewesen", "en": "been"}, {"de": "Vergangenheit", "en": "past"}, {"de": "Erinnerung", "en": "memory"}],
        [{"de": "passieren", "en": "to happen"}, {"de": "erleben", "en": "to experience"}, {"de": "Zeit", "en": "time"}, {"de": "Tag", "en": "day"}],
        {"de": "Gestern war ein wunderschöner Tag.", "en": "Yesterday was a wonderful day."},
        {"de": "Ich hatte gestern leider keine Zeit.", "en": "Unfortunately I had no time yesterday."},
        {"de": "Früher habe ich in München gewohnt.", "en": "In the past I lived in Munich."},
        {"de": "Wo warst du eigentlich gestern Nachmittag?", "en": "Where were you actually yesterday afternoon?"},
        {"de": "Letzte Woche hatte ich viel Stress im Beruf.", "en": "Last week I had a lot of stress at work."},
        {"de": "Damals war alles ganz anders als heute.", "en": "Back then everything was completely different from today."},
        {"partner": "Freund", "prompt": "Wo warst du gestern Abend?", "translation": "Where were you yesterday evening?", "options": ["Ich war zu Hause und habe ein Buch gelesen.", "Ich nehme den Bus."]},
        {"partner": "Freund", "prompt": "Hattest du gestern viel zu tun?", "translation": "Did you have a lot to do yesterday?", "options": ["Ja, ich hatte den ganzen Tag Unterricht.", "Danke sehr."]},
        {"prompt": "Type the German word for 'yesterday':", "target": "gestern", "hint": "Hint: day before today"},
        {"prompt": "Type the German past form of 'was':", "target": "war", "hint": "Hint: 3 letters starting with w"},
        {"prompt": "_______ war das Wetter wirklich herrlich.", "en": "Yesterday the weather was really wonderful.", "options": ["Gestern", "Morgen", "Heute"], "answer": "Gestern"},
        {"prompt": "Ich _______ gestern leider keine Zeit.", "en": "Unfortunately I had no time yesterday.", "options": ["hatte", "habe", "bin"], "answer": "hatte"}
    ))

    # Unit 67: Perfekt mit haben
    units.append(make_unit(
        67, 2, "Perfekt mit haben", "Past tense with haben", "#CE82FF",
        [{"de": "gekauft", "en": "bought"}, {"de": "gegessen", "en": "eaten"}, {"de": "getrunken", "en": "drunk"}, {"de": "gehört", "en": "heard"}],
        [{"de": "gemacht", "en": "done / made"}, {"de": "gelesen", "en": "read"}, {"de": "geschrieben", "en": "written"}, {"de": "gesehen", "en": "seen"}],
        [{"de": "gesagt", "en": "said"}, {"de": "gelernt", "en": "learned"}, {"de": "haben", "en": "to have"}, {"de": "Perfekt", "en": "perfect past tense"}],
        [{"de": "schon", "en": "already"}, {"de": "noch nicht", "en": "not yet"}, {"de": "heute", "en": "today"}, {"de": "gestern", "en": "yesterday"}],
        {"de": "Ich habe heute einen Kaffee getrunken.", "en": "I drank a coffee today."},
        {"de": "Wir haben eine leckere Pizza gegessen.", "en": "We ate a delicious pizza."},
        {"de": "Hast du den neuen Film schon gesehen?", "en": "Have you seen the new movie already?"},
        {"de": "Was hast du gestern zum Abendessen gekocht?", "en": "What did you cook for dinner yesterday?"},
        {"de": "Ich habe fleißig viele deutsche Wörter gelernt.", "en": "I diligently learned many German words."},
        {"de": "Er hat gestern einen langen Brief geschrieben.", "en": "He wrote a long letter yesterday."},
        {"partner": "Julia", "prompt": "Hast du heute schon gefrühstückt?", "translation": "Have you already had breakfast today?", "options": ["Ja, ich habe ein Brötchen mit Käse gegessen.", "Ich bin 22 Jahre alt."]},
        {"partner": "Julia", "prompt": "Hast du meine Nachricht gelesen?", "translation": "Have you read my message?", "options": ["Ja, ich habe sie gerade gelesen.", "Gute Nacht."]},
        {"prompt": "Type the German past participle for 'drunk' (trinken):", "target": "getrunken", "hint": "Hint: starts with ge- and ends with -en"},
        {"prompt": "Type the German past participle for 'eaten' (essen):", "target": "gegessen", "hint": "Hint: double s, past of essen"},
        {"prompt": "Ich habe einen Kaffee _______.", "en": "I drank a coffee.", "options": ["getrunken", "trinken", "trank"], "answer": "getrunken"},
        {"prompt": "Wir haben eine Pizza _______.", "en": "We ate a pizza.", "options": ["gegessen", "essen", "isst"], "answer": "gegessen"}
    ))

    # Unit 68: Perfekt: regelmäßige Verben
    units.append(make_unit(
        68, 2, "Perfekt: regelmäßige Verben", "Regular Perfekt participles", "#FF4B4B",
        [{"de": "gearbeitet", "en": "worked"}, {"de": "gespielt", "en": "played"}, {"de": "gewohnt", "en": "lived / resided"}, {"de": "gefragt", "en": "asked"}],
        [{"de": "gelacht", "en": "laughed"}, {"de": "geduscht", "en": "showered"}, {"de": "geübt", "en": "practiced"}, {"de": "getanzt", "en": "danced"}],
        [{"de": "gepackt", "en": "packed"}, {"de": "gefeiert", "en": "celebrated"}, {"de": "gehofft", "en": "hoped"}, {"de": "gepasst", "en": "fit"}],
        [{"de": "Partizip", "en": "participle"}, {"de": "Endung", "en": "ending"}, {"de": "regelmäßig", "en": "regular"}, {"de": "zusammen", "en": "together"}],
        {"de": "Ich habe gestern acht Stunden gearbeitet.", "en": "I worked eight hours yesterday."},
        {"de": "Die Kinder haben im Garten Fußball gespielt.", "en": "The children played soccer in the garden."},
        {"de": "Wir haben die ganze Nacht gefeiert und getanzt.", "en": "We celebrated and danced all night long."},
        {"de": "Hast du heute schon deine Grammatik geübt?", "en": "Have you already practiced your grammar today?"},
        {"de": "Früher habe ich fünf Jahre in Berlin gewohnt.", "en": "Previously I lived in Berlin for five years."},
        {"de": "Ich habe den Koffer für den Urlaub gepackt.", "en": "I packed the suitcase for vacation."},
        {"partner": "Kollege", "prompt": "Wie lange hast du gestern gearbeitet?", "translation": "How long did you work yesterday?", "options": ["Ich habe bis neunzehn Uhr gearbeitet.", "Ich trinke Orangensaft."]},
        {"partner": "Kollege", "prompt": "Habt ihr am Wochenende gefeiert?", "translation": "Did you celebrate on the weekend?", "options": ["Ja, wir haben Geburtstag gefeiert.", "Auf Wiedersehen."]},
        {"prompt": "Type the German regular past participle for 'worked':", "target": "gearbeitet", "hint": "Hint: ends with -et"},
        {"prompt": "Type the German regular past participle for 'played':", "target": "gespielt", "hint": "Hint: ge- + spiel + -t"},
        {"prompt": "Ich habe gestern acht Stunden _______.", "en": "I worked eight hours yesterday.", "options": ["gearbeitet", "arbeiten", "arbeite"], "answer": "gearbeitet"},
        {"prompt": "Die Kinder haben im Garten _______.", "en": "The children played in the garden.", "options": ["gespielt", "spielen", "spielt"], "answer": "gespielt"}
    ))

    # Unit 69: Perfekt im Gespräch
    units.append(make_unit(
        69, 2, "Perfekt im Gespräch", "Talk about your weekend", "#00CD9C",
        [{"de": "Wochenende", "en": "weekend"}, {"de": "besucht", "en": "visited"}, {"de": "getroffen", "en": "met"}, {"de": "eingekauft", "en": "shopped"}],
        [{"de": "spazieren gegangen", "en": "gone for a walk"}, {"de": "gekocht", "en": "cooked"}, {"de": "erholt", "en": "rested / recovered"}, {"de": "erzählen", "en": "to tell"}],
        [{"de": "Ausflug", "en": "excursion / day trip"}, {"de": "Museum", "en": "museum"}, {"de": "Film", "en": "movie"}, {"de": "geschlafen", "en": "slept"}],
        [{"de": "Wie war", "en": "How was"}, {"de": "fantastisch", "en": "fantastic"}, {"de": "toll", "en": "great"}, {"de": "zusammen", "en": "together"}],
        {"de": "Am Wochenende habe ich Freunde getroffen.", "en": "On the weekend I met friends."},
        {"de": "Wir haben ein interessantes Museum besucht.", "en": "We visited an interesting museum."},
        {"de": "Ich habe mich wunderbar im Park erholt.", "en": "I rested wonderfully in the park."},
        {"de": "Wie war dein Wochenende eigentlich?", "en": "How was your weekend actually?"},
        {"de": "Wir haben zusammen gekocht und lange gesprochen.", "en": "We cooked together and talked for a long time."},
        {"de": "Mein Wochenende war wirklich ganz fantastisch!", "en": "My weekend was really quite fantastic!"},
        {"partner": "Freundin", "prompt": "Wie war dein Wochenende?", "translation": "How was your weekend?", "options": ["Es war toll, ich habe Freunde getroffen.", "Ich nehme die U-Bahn."]},
        {"partner": "Freundin", "prompt": "Was habt ihr zusammen gemacht?", "translation": "What did you do together?", "options": ["Wir haben gekocht und Filme geschaut.", "Danke sehr."]},
        {"prompt": "Type the German word for 'weekend':", "target": "Wochenende", "hint": "Hint: compound noun starting with W"},
        {"prompt": "Type the German past participle for 'met' (treffen):", "target": "getroffen", "hint": "Hint: irregular with double f"},
        {"prompt": "Ich habe am Samstag Freunde _______.", "en": "I met friends on Saturday.", "options": ["getroffen", "treffen", "trifft"], "answer": "getroffen"},
        {"prompt": "Wie _______ dein Wochenende?", "en": "How was your weekend?", "options": ["war", "ist", "hat"], "answer": "war"}
    ))

    # Unit 70: Sektion 2 Finale
    units.append(make_unit(
        70, 2, "Sektion 2 Finale", "Section 2 Grand Review", "#FFC800",
        [{"de": "Meister", "en": "master"}, {"de": "Abschluss", "en": "completion / graduation"}, {"de": "Fortschritt", "en": "progress"}, {"de": "Grammatik", "en": "grammar"}],
        [{"de": "Akkusativ", "en": "accusative case"}, {"de": "Perfekt", "en": "perfect past tense"}, {"de": "Modalverb", "en": "modal verb"}, {"de": "Prüfung", "en": "exam"}],
        [{"de": "Erfolg", "en": "success"}, {"de": "bestanden", "en": "passed (exam)"}, {"de": "sprechen", "en": "to speak"}, {"de": "verstehen", "en": "to understand"}],
        [{"de": "Stufe", "en": "level"}, {"de": "Niveau A2", "en": "level A2"}, {"de": "bereit", "en": "ready"}, {"de": "stolz", "en": "proud"}],
        {"de": "Ich habe Sektion zwei erfolgreich beendet!", "en": "I have successfully finished section two!"},
        {"de": "Ich verstehe die deutsche Grammatik viel besser.", "en": "I understand German grammar much better."},
        {"de": "Ich kann über meine Vergangenheit sprechen.", "en": "I can talk about my past."},
        {"de": "Bist du bereit für die große Abschlussprüfung?", "en": "Are you ready for the big final exam?"},
        {"de": "Ich habe alle Übungen und Tests fleißig bestanden.", "en": "I have passed all exercises and tests diligently."},
        {"de": "Herzlichen Glückwunsch zu diesem großartigen Erfolg!", "en": "Congratulations on this magnificent success!"},
        {"partner": "Prüfer", "prompt": "Herzlichen Glückwunsch zur abgeschlossenen Sektion!", "translation": "Congratulations on the completed section!", "options": ["Vielen Dank, ich habe sehr viel gelernt!", "Ich habe keinen Durst."]},
        {"partner": "Prüfer", "prompt": "Fühlen Sie sich sicher in der Grammatik?", "translation": "Do you feel confident in the grammar?", "options": ["Ja, Perfekt und Akkusativ klappen super.", "Auf Wiedersehen."]},
        {"prompt": "Type the German word for 'master':", "target": "Meister", "hint": "Hint: 7 letters starting with M"},
        {"prompt": "Type the German word for 'exam':", "target": "Prüfung", "hint": "Hint: evaluation with Umlaut ü"},
        {"prompt": "Ich habe die Prüfung erfolgreich _______.", "en": "I have passed the exam successfully.", "options": ["bestanden", "bestehen", "besteht"], "answer": "bestanden"},
        {"prompt": "Ich bin stolz auf meinen großen _______.", "en": "I am proud of my big progress.", "options": ["Fortschritt", "Grammatik", "Stufe"], "answer": "Fortschritt"}
    ))

    return units
