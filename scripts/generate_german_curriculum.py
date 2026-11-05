#!/usr/bin/env python3
"""
Generate Complete Section 1 Curriculum for German Learning for English Speakers (de_en_a1)
Total: 12 Units x 12 Lessons = 144 Lessons/Nodes.
Pedagogical Model: Scaffolded incremental micro-steps (based on Goethe-Institut A1 standard & Duolingo references).

Interactive Schema:
- 10 Interactive Lessons per unit (L1-L5, L7-L10) + 1 Milestone Trophy Exam (L12) = 11 lessons per unit.
- Each interactive lesson contains ALL 10 modular challenge formats:
  1. picture_select (enabled: False - unticked so admin can add images later)
  2. word_match (4 pairs)
  3. sentence_builder (word bank + distractors)
  4. cloze_test (fill in the blank + 3 options)
  5. listen_tap (audio echo bank)
  6. listen_select (audio comprehension MCQ)
  7. type_word (spelling input + first-letter hint)
  8. dialogue_bubble (conversational chat scenario)
  9. sprechen (oral pronunciation, minAccuracy: 75)
  10. karaoke (reading fluency rhythm)
- 2 Sunken Treasure Chests per unit (L6 & L11) = Milestone rewards (0 stages, +25 & +35 Pearls).
"""

import json
import os
import sys

def build_lesson(
    lesson_index,
    unit_lesson_num,
    unit_title,
    title,
    subtitle,
    node_type,
    xp_reward,
    pearls_reward,
    stages
):
    return {
        "lessonIndex": lesson_index,
        "unitLessonNum": unit_lesson_num,
        "title": f"{unit_title} • {title}",
        "subtitle": subtitle,
        "nodeType": node_type,
        "xpReward": xp_reward,
        "pearlsReward": pearls_reward,
        "isLive": True,
        "stages": stages
    }

def make_chest(lesson_index, unit_lesson_num, unit_title, chest_num, xp_reward, pearls_reward):
    return {
        "lessonIndex": lesson_index,
        "unitLessonNum": unit_lesson_num,
        "title": f"{unit_title} • Treasure Chest {chest_num}",
        "subtitle": f"Bonus {pearls_reward} Pearls 💎 & {xp_reward} XP 🔥",
        "nodeType": "chest",
        "xpReward": xp_reward,
        "pearlsReward": pearls_reward,
        "isLive": True,
        "stages": []
    }

def create_cloze_stage(sent_tuple, preferred_word, all_unit_words):
    raw_sent, trans, _ = sent_tuple
    clean_blank = preferred_word.strip(".,!?:;\"'()")
    
    tokens = raw_sent.split()
    new_tokens = []
    replaced = False
    
    for tok in tokens:
        stripped = tok.strip(".,!?:;\"'()")
        if not replaced and stripped.lower() == clean_blank.lower():
            leading = tok[:len(tok) - len(tok.lstrip(".,!?:;\"'()"))]
            trailing = tok[len(tok.rstrip(".,!?:;\"'()")):]
            new_tokens.append(f"{leading}_______{trailing}")
            clean_blank = stripped
            replaced = True
        else:
            new_tokens.append(tok)
            
    if not replaced:
        last_tok = tokens[-1]
        trailing = last_tok[len(last_tok.rstrip(".,!?:;\"'()")):]
        clean_blank = last_tok.strip(".,!?:;\"'()")
        tokens[-1] = f"_______{trailing}"
        cloze_sent = " ".join(tokens)
    else:
        cloze_sent = " ".join(new_tokens)
        
    options = [clean_blank]
    for w in all_unit_words:
        w_clean = w[0].strip(".,!?:;\"'()")
        if w_clean.lower() != clean_blank.lower() and w_clean not in options:
            options.append(w_clean)
        if len(options) == 3:
            break
            
    return (cloze_sent, clean_blank, trans, options)

def make_cloze_for_lesson(sent_tuple, preferred_candidate, unit_words):
    raw_sent = sent_tuple[0]
    tokens = raw_sent.split()
    clean_cand = preferred_candidate.strip(".,!?:;\"'()")
    
    found = None
    for tok in tokens:
        stripped = tok.strip(".,!?:;\"'()")
        if stripped.lower() == clean_cand.lower():
            found = stripped
            break
            
    if not found:
        candidates = [t.strip(".,!?:;\"'()") for t in tokens if len(t.strip(".,!?:;\"'()")) > 2]
        found = candidates[-1] if candidates else tokens[-1].strip(".,!?:;\"'()")
        
    return create_cloze_stage(sent_tuple, found, unit_words)

def clean_type_word(type_w_tuple, unit_words):
    target, trans = type_w_tuple
    if len(target.split()) > 1:
        for w in unit_words:
            if len(w[0].split()) == 1 and w[0].strip(".,!?:;\"'()") not in ["ein", "eine", "das", "der", "die", "und", "ist"]:
                return w
        return (target.split()[-1], trans.split()[-1] if len(trans.split()) > 1 else trans)
    return type_w_tuple

def build_10_stages(
    unit_num,
    lesson_num,
    # 1. Picture Select (unticked / disabled by default)
    pic_word_de, pic_trans_en, pic_distractors,
    # 2. Word Match (4 pairs: target German, native English)
    match_pairs,
    # 3. Sentence Builder
    sent_prompt_en, sent_target_de, sent_tokens_de,
    # 4. Cloze Test
    cloze_sentence_de, cloze_blank_de, cloze_trans_en, cloze_options_de,
    # 5. Listen Tap
    listen_target_de, listen_tokens_de,
    # 6. Listen Select
    listen_spoken_de, listen_correct_en, listen_distractor_en,
    # 7. Type Word
    type_target_de, type_trans_en, type_hint_en="",
    # 8. Dialogue
    partner_name="Anna", partner_msg_de="Hallo!", partner_msg_en="Hello!", reply_correct_de="Hallo!", reply_wrong_de="Wasser, bitte.",
    # 9. Sprechen
    sprechen_de="Hallo!", sprechen_en="Hello!",
    # 10. Karaoke
    karaoke_story_de="Hallo! Willkommen beim Deutschlernen.", karaoke_story_en="Hello! Welcome to learning German."
):
    return [
        # 1. Picture Vocabulary Card (Unticked / enabled: False so admin can upload custom images)
        {
            "type": "picture_select",
            "enabled": False,
            "title": "Select the correct picture",
            "prompt": f"Choose the correct picture for '{pic_trans_en}':",
            "targetWord": pic_word_de,
            "translation": pic_trans_en,
            "options": [
                {
                    "id": f"de_u{unit_num}_l{lesson_num}_p1",
                    "text": f"{pic_word_de} ({pic_trans_en})",
                    "imageUrl": f"/uploads/curriculum/{pic_trans_en.lower().replace(' ', '_')}.webp",
                    "isCorrect": True
                },
                {
                    "id": f"de_u{unit_num}_l{lesson_num}_p2",
                    "text": f"{pic_distractors[0][0]} ({pic_distractors[0][1]})",
                    "imageUrl": f"/uploads/curriculum/{pic_distractors[0][1].lower().replace(' ', '_')}.webp",
                    "isCorrect": False
                },
                {
                    "id": f"de_u{unit_num}_l{lesson_num}_p3",
                    "text": f"{pic_distractors[1][0]} ({pic_distractors[1][1]})",
                    "imageUrl": f"/uploads/curriculum/{pic_distractors[1][1].lower().replace(' ', '_')}.webp",
                    "isCorrect": False
                }
            ]
        },
        # 2. Match Word Pairs (4 pairs)
        {
            "type": "word_match",
            "title": "Match the word pairs",
            "pairs": [{"target": p[0], "native": p[1]} for p in match_pairs]
        },
        # 3. Sentence Builder
        {
            "type": "sentence_builder",
            "title": "Build the German sentence",
            "prompt": sent_prompt_en,
            "targetSentence": sent_target_de,
            "tokens": sent_tokens_de
        },
        # 4. Fill-in-the-Blank (Cloze Test)
        {
            "type": "cloze_test",
            "title": "Fill in the blank",
            "sentence": cloze_sentence_de,
            "blank": cloze_blank_de,
            "translation": cloze_trans_en,
            "options": cloze_options_de
        },
        # 5. Listen & Tap (Echo)
        {
            "type": "listen_tap",
            "title": "Listen and tap the words you hear",
            "targetSentence": listen_target_de,
            "tokens": listen_tokens_de,
            "audioUrl": ""
        },
        # 6. Listen & Select MCQ
        {
            "type": "listen_select",
            "title": "Listen and choose the meaning",
            "spokenGerman": listen_spoken_de,
            "question": "What does this German sentence mean?",
            "prompt": "What does this German sentence mean?",
            "options": [
                {"text": listen_correct_en, "isCorrect": True},
                {"text": listen_distractor_en, "isCorrect": False}
            ],
            "correctOption": listen_correct_en,
            "audioUrl": ""
        },
        # 7. Type Word (Spelling Entry)
        {
            "type": "type_word",
            "title": "Type the German spelling",
            "prompt": f"Type the German word for '{type_trans_en}':",
            "target": type_target_de,
            "translation": type_trans_en,
            "hint": type_hint_en if type_hint_en else f"Hint: starts with '{type_target_de[0]}'",
            "audioUrl": ""
        },
        # 8. Dialogue Messenger
        {
            "type": "dialogue_bubble",
            "title": "Complete the conversation",
            "partnerName": partner_name,
            "partnerAvatar": "dolphina",
            "partnerMessage": partner_msg_de,
            "translation": partner_msg_en,
            "options": [
                {"text": reply_correct_de, "isCorrect": True},
                {"text": reply_wrong_de, "isCorrect": False}
            ],
            "correctOption": reply_correct_de,
            "audioUrl": ""
        },
        # 9. Sprechen (Oral Speech & Pronunciation)
        {
            "type": "sprechen",
            "title": "Speak the German sentence aloud",
            "prompt": sprechen_de,
            "translation": sprechen_en,
            "minAccuracy": 75,
            "audioUrl": ""
        },
        # 10. Karaoke Synced Story / Fluency
        {
            "type": "karaoke",
            "title": "Rhythmic Reading (Karaoke Fluency)",
            "storyText": karaoke_story_de,
            "translationText": karaoke_story_en,
            "audioUrl": ""
        }
    ]

# =============================================================================
# CURRICULUM DATASET DEFINITIONS (ALL 12 UNITS OF SECTION 1 GERMAN DE_EN_A1)
# =============================================================================

unit_configs = [
    # Unit 1
    {
        "num": 1,
        "title": "Basic Objects & Possessives",
        "desc": "Essential German objects, articles and possessive pronouns",
        "color": "#1CB0F6",
        "words": [
            ("Haus", "house"), ("Auto", "car"), ("Buch", "book"), ("mein", "my"),
            ("dein", "your"), ("groß", "big"), ("klein", "small"), ("ist", "is"),
            ("sauber", "clean"), ("schmutzig", "dirty"), ("neu", "new"), ("alt", "old"),
            ("Name", "name"), ("das", "this / that"), ("hier", "here"), ("dort", "there")
        ],
        "sentences": [
            ("mein Auto", "my car", ["mein", "Auto", "Haus", "dein", "ist"]),
            ("mein Haus ist groß", "my house is big", ["mein", "Haus", "ist", "groß", "klein", "Auto"]),
            ("dein Auto ist klein", "your car is small", ["dein", "Auto", "ist", "klein", "groß", "Haus"]),
            ("sein Haus ist sauber", "his house is clean", ["sein", "Haus", "ist", "sauber", "schmutzig", "mein"]),
            ("mein Auto ist sehr sauber", "my car is very clean", ["mein", "Auto", "ist", "sehr", "sauber", "Haus"]),
            ("das ist mein Auto", "this is my car", ["das", "ist", "mein", "Auto", "hier", "Haus"]),
            ("dort ist dein Haus", "there is your house", ["dort", "ist", "dein", "Haus", "das", "Auto"]),
            ("mein Auto ist neu und sauber", "my car is new and clean", ["mein", "Auto", "ist", "neu", "und", "sauber", "alt"])
        ],
        "dialogue": {
            "name": "Anna",
            "prompt": "Ist das dein Auto?",
            "translation": "Is that your car?",
            "options": [
                {"text": "Ja, das ist mein Auto.", "isCorrect": True},
                {"text": "Kalter Tee, bitte.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Mein Auto ist groß", "My car is big"),
            ("Das ist mein Haus", "That is my house"),
            ("Mein Auto ist neu und sauber", "My car is new and clean")
        ],
        "karaoke_story": (
            "Das ist mein Auto. Mein Auto ist sehr sauber und neu.",
            "This is my car. My car is very clean and new."
        )
    },
    # Unit 2
    {
        "num": 2,
        "title": "Food, Bakery & Drinks",
        "desc": "German bread, café culture, cold cuts and daily beverages",
        "color": "#58CC02",
        "words": [
            ("Brot", "bread"), ("Brötchen", "bread roll"), ("Kaffee", "coffee"), ("Tee", "tea"),
            ("Wasser", "water"), ("Milch", "milk"), ("Käse", "cheese"), ("Wurst", "sausage"),
            ("heiß", "hot"), ("kalt", "cold"), ("lecker", "delicious"), ("bitte", "please"),
            ("danke", "thank you"), ("Apfel", "apple"), ("Zucker", "sugar"), ("Butter", "butter")
        ],
        "sentences": [
            ("Kaffee, bitte", "coffee, please", ["Kaffee,", "bitte", "Tee", "danke", "heiß"]),
            ("Brot und Wasser", "bread and water", ["Brot", "und", "Wasser", "Käse", "Milch"]),
            ("der Kaffee ist heiß", "the coffee is hot", ["der", "Kaffee", "ist", "heiß", "kalt", "Tee"]),
            ("das Wasser ist kalt", "the water is cold", ["das", "Wasser", "ist", "kalt", "heiß", "Brot"]),
            ("das Brot ist sehr lecker", "the bread is very delicious", ["das", "Brot", "ist", "sehr", "lecker", "Käse"]),
            ("ein Brötchen mit Käse, bitte", "a bread roll with cheese, please", ["ein", "Brötchen", "mit", "Käse,", "bitte", "Wurst"]),
            ("Tee mit Milch und Zucker", "tea with milk and sugar", ["Tee", "mit", "Milch", "und", "Zucker", "Kaffee"]),
            ("Kaffee und frisches Brot", "coffee and fresh bread", ["Kaffee", "und", "frisches", "Brot", "Wasser", "kalt"])
        ],
        "dialogue": {
            "name": "Lukas",
            "prompt": "Möchtest du Kaffee oder Tee?",
            "translation": "Would you like coffee or tea?",
            "options": [
                {"text": "Kaffee mit Milch, bitte.", "isCorrect": True},
                {"text": "Das Haus ist klein.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Kaffee und Brot, bitte", "Coffee and bread, please"),
            ("Das Brot ist sehr lecker", "The bread is very delicious"),
            ("Ein Brötchen mit Käse", "A bread roll with cheese")
        ],
        "karaoke_story": (
            "Guten Morgen! Hier ist heißer Kaffee und frisches Brot.",
            "Good morning! Here is hot coffee and fresh bread."
        )
    },
    # Unit 3
    {
        "num": 3,
        "title": "Family, People & Address",
        "desc": "Family members, formal vs informal address, greetings and introductions",
        "color": "#CE82FF",
        "words": [
            ("Vater", "father"), ("Mutter", "mother"), ("Bruder", "brother"), ("Schwester", "sister"),
            ("Sohn", "son"), ("Tochter", "daughter"), ("Freund", "friend"), ("Kind", "child"),
            ("Mann", "man / husband"), ("Frau", "woman / Mrs."), ("Herr", "Mr."), ("Hallo", "hello"),
            ("Guten Tag", "good day"), ("Tschüss", "bye"), ("Auf Wiedersehen", "goodbye"), ("wer", "who")
        ],
        "sentences": [
            ("das ist mein Vater", "this is my father", ["das", "ist", "mein", "Vater", "Mutter", "Freund"]),
            ("meine Mutter ist nett", "my mother is nice", ["meine", "Mutter", "ist", "nett", "Vater", "gut"]),
            ("mein Bruder und meine Schwester", "my brother and my sister", ["mein", "Bruder", "und", "meine", "Schwester", "Freund"]),
            ("wer ist diese Frau?", "who is this woman?", ["wer", "ist", "diese", "Frau?", "Mann", "das"]),
            ("das ist mein Freund Lukas", "this is my friend Lukas", ["das", "ist", "mein", "Freund", "Lukas", "Vater"]),
            ("Guten Tag, Herr Müller", "good day, Mr. Mueller", ["Guten", "Tag,", "Herr", "Müller", "Hallo", "Frau"]),
            ("Hallo, wie heißt du?", "hello, what is your name?", ["Hallo,", "wie", "heißt", "du?", "wer", "ist"]),
            ("Auf Wiedersehen, Frau Schmidt", "goodbye, Mrs. Schmidt", ["Auf", "Wiedersehen,", "Frau", "Schmidt", "Tschüss", "Herr"])
        ],
        "dialogue": {
            "name": "Julia",
            "prompt": "Hallo! Wer ist das?",
            "translation": "Hello! Who is that?",
            "options": [
                {"text": "Das ist mein Bruder Max.", "isCorrect": True},
                {"text": "Ich trinke Wasser.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Das ist meine Mutter", "This is my mother"),
            ("Guten Tag, wie geht es Ihnen?", "Good day, how are you? (formal)"),
            ("Mein Freund heißt Lukas", "My friend is named Lukas")
        ],
        "karaoke_story": (
            "Das ist meine Familie. Mein Vater, meine Mutter und mein Bruder.",
            "This is my family. My father, my mother and my brother."
        )
    },
    # Unit 4
    {
        "num": 4,
        "title": "Everyday Verbs & Sentence Structure",
        "desc": "Core daily verbs, present tense conjugation and SVO sentence structure",
        "color": "#FF9600",
        "words": [
            ("trinken", "to drink"), ("essen", "to eat"), ("wohnen", "to live / reside"), ("lernen", "to learn"),
            ("arbeiten", "to work"), ("gehen", "to go"), ("kommen", "to come"), ("sprechen", "to speak"),
            ("Deutsch", "German"), ("Englisch", "English"), ("ich", "I"), ("du", "you"),
            ("er", "he"), ("sie", "she / they"), ("wir", "we"), ("gerne", "gladly")
        ],
        "sentences": [
            ("ich lerne Deutsch", "I learn German", ["ich", "lerne", "Deutsch", "Englisch", "trinke"]),
            ("du sprichst Englisch", "you speak English", ["du", "sprichst", "Englisch", "Deutsch", "kommst"]),
            ("wir trinken Wasser", "we drink water", ["wir", "trinken", "Wasser", "Kaffee", "essen"]),
            ("er wohnt in Berlin", "he lives in Berlin", ["er", "wohnt", "in", "Berlin", "München", "arbeitet"]),
            ("sie arbeitet viel", "she works a lot", ["sie", "arbeitet", "viel", "wohnt", "lernt", "gut"]),
            ("ich esse Brot und trinke Tee", "I eat bread and drink tea", ["ich", "esse", "Brot", "und", "trinke", "Tee", "Kaffee"]),
            ("wir kommen aus Deutschland", "we come from Germany", ["wir", "kommen", "aus", "Deutschland", "Berlin", "wohnen"]),
            ("du lernst sehr schnell Deutsch", "you learn German very fast", ["du", "lernst", "sehr", "schnell", "Deutsch", "Englisch"])
        ],
        "dialogue": {
            "name": "Max",
            "prompt": "Sprichst du Deutsch?",
            "translation": "Do you speak German?",
            "options": [
                {"text": "Ja, ich lerne Deutsch.", "isCorrect": True},
                {"text": "Das Auto ist schmutzig.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Ich lerne Deutsch jeden Tag", "I learn German every day"),
            ("Wir trinken Kaffee und essen Brot", "We drink coffee and eat bread"),
            ("Ich wohne in Berlin", "I live in Berlin")
        ],
        "karaoke_story": (
            "Ich lerne Deutsch und du sprichst Englisch. Wir lernen zusammen.",
            "I learn German and you speak English. We learn together."
        )
    },
    # Unit 5
    {
        "num": 5,
        "title": "Numbers, Prices & Plurals",
        "desc": "Counting 1 to 10, Euro currency prices, and plural noun endings",
        "color": "#FF4B4B",
        "words": [
            ("eins", "one"), ("zwei", "two"), ("drei", "three"), ("vier", "four"),
            ("fünf", "five"), ("sechs", "six"), ("sieben", "seven"), ("acht", "eight"),
            ("neun", "nine"), ("zehn", "ten"), ("Euro", "euro"), ("Cent", "cent"),
            ("kostet", "costs"), ("wie viel", "how much"), ("teuer", "expensive"), ("billig", "cheap")
        ],
        "sentences": [
            ("zwei Euro, bitte", "two euros, please", ["zwei", "Euro,", "bitte", "drei", "Cent"]),
            ("drei Brötchen und ein Brot", "three bread rolls and one bread", ["drei", "Brötchen", "und", "ein", "Brot", "zwei"]),
            ("wie viel kostet das?", "how much does that cost?", ["wie", "viel", "kostet", "das?", "ist", "teuer"]),
            ("das kostet fünf Euro", "that costs five euros", ["das", "kostet", "fünf", "Euro", "zehn", "billig"]),
            ("vier Äpfel, bitte", "four apples, please", ["vier", "Äpfel,", "bitte", "fünf", "Brote"]),
            ("der Kaffee ist nicht teuer", "the coffee is not expensive", ["der", "Kaffee", "ist", "nicht", "teuer", "billig"]),
            ("das Buch kostet zehn Euro", "the book costs ten euros", ["das", "Buch", "kostet", "zehn", "Euro", "drei"]),
            ("zwei Kaffee und zwei Brötchen", "two coffees and two bread rolls", ["zwei", "Kaffee", "und", "zwei", "Brötchen", "Euro"])
        ],
        "dialogue": {
            "name": "Kassierer",
            "prompt": "Das macht vier Euro, bitte.",
            "translation": "That comes to four euros, please.",
            "options": [
                {"text": "Hier sind fünf Euro. Danke!", "isCorrect": True},
                {"text": "Ich heiße Anna.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Wie viel kostet das Brot?", "How much does the bread cost?"),
            ("Drei Euro und fünfzig Cent", "Three euros and fifty cents"),
            ("Zwei Brötchen und ein Kaffee", "Two bread rolls and one coffee")
        ],
        "karaoke_story": (
            "Eins, zwei, drei, vier, fünf. Wie viel kostet das? Das kostet fünf Euro.",
            "One, two, three, four, five. How much does that cost? That costs five euros."
        )
    },
    # Unit 6
    {
        "num": 6,
        "title": "Home, Rooms & Prepositions",
        "desc": "Apartment spaces, household furniture and spatial prepositions in dative",
        "color": "#2B70C9",
        "words": [
            ("Zimmer", "room"), ("Küche", "kitchen"), ("Bad", "bathroom"), ("Wohnzimmer", "living room"),
            ("Tisch", "table"), ("Stuhl", "chair"), ("Bett", "bed"), ("Schrank", "closet"),
            ("in", "in"), ("auf", "on"), ("unter", "under"), ("neben", "next to"),
            ("wo", "where"), ("Schlüssel", "key"), ("Tür", "door"), ("Fenster", "window")
        ],
        "sentences": [
            ("wo ist der Schlüssel?", "where is the key?", ["wo", "ist", "der", "Schlüssel?", "Tisch", "auf"]),
            ("der Schlüssel ist auf dem Tisch", "the key is on the table", ["der", "Schlüssel", "ist", "auf", "dem", "Tisch", "unter"]),
            ("meine Mutter ist in der Küche", "my mother is in the kitchen", ["meine", "Mutter", "ist", "in", "der", "Küche", "Bad"]),
            ("der Stuhl steht neben dem Bett", "the chair stands next to the bed", ["der", "Stuhl", "steht", "neben", "dem", "Bett", "Tisch"]),
            ("das Zimmer ist groß und hell", "the room is big and bright", ["das", "Zimmer", "ist", "groß", "und", "hell", "klein"]),
            ("das Buch liegt auf dem Stuhl", "the book lies on the chair", ["das", "Buch", "liegt", "auf", "dem", "Stuhl", "Tisch"]),
            ("das Bad ist sehr sauber", "the bathroom is very clean", ["das", "Bad", "ist", "sehr", "sauber", "Küche", "alt"]),
            ("die Küche ist modern und schön", "the kitchen is modern and nice", ["die", "Küche", "ist", "modern", "und", "schön", "Bad"])
        ],
        "dialogue": {
            "name": "Felix",
            "prompt": "Wo ist mein Buch?",
            "translation": "Where is my book?",
            "options": [
                {"text": "Dein Buch liegt auf dem Tisch.", "isCorrect": True},
                {"text": "Zehn Euro, bitte.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Der Schlüssel ist auf dem Tisch", "The key is on the table"),
            ("Ich bin in der Küche", "I am in the kitchen"),
            ("Das Zimmer ist sehr gemütlich", "The room is very cozy")
        ],
        "karaoke_story": (
            "Mein Haus hat eine schöne Küche und ein großes Zimmer. Der Tisch steht am Fenster.",
            "My house has a nice kitchen and a big room. The table stands by the window."
        )
    },
    # Unit 7
    {
        "num": 7,
        "title": "Daily Routines & Time",
        "desc": "Times of day, clock time, morning routines and V2 word order",
        "color": "#1CB0F6",
        "words": [
            ("Morgen", "morning"), ("Mittag", "noon / midday"), ("Abend", "evening"), ("Nacht", "night"),
            ("Uhr", "o'clock / clock"), ("spät", "late"), ("früh", "early"), ("heute", "today"),
            ("jetzt", "now"), ("morgen", "tomorrow"), ("Frühstück", "breakfast"), ("Abendessen", "dinner"),
            ("wann", "when"), ("immer", "always"), ("oft", "often"), ("Zeit", "time")
        ],
        "sentences": [
            ("es ist acht Uhr", "it is eight o'clock", ["es", "ist", "acht", "Uhr", "neun", "spät"]),
            ("Guten Morgen! Zeit fürs Frühstück", "good morning! time for breakfast", ["Guten", "Morgen!", "Zeit", "fürs", "Frühstück", "Abend"]),
            ("heute lerne ich Deutsch", "today I learn German", ["heute", "lerne", "ich", "Deutsch", "Englisch", "jetzt"]),
            ("wir essen um sieben Uhr", "we eat at seven o'clock", ["wir", "essen", "um", "sieben", "Uhr", "acht"]),
            ("es ist schon sehr spät", "it is already very late", ["es", "ist", "schon", "sehr", "spät", "früh", "jetzt"]),
            ("am Abend trinke ich Tee", "in the evening I drink tea", ["am", "Abend", "trinke", "ich", "Tee", "Kaffee", "Morgen"]),
            ("wann frühstückst du?", "when do you have breakfast?", ["wann", "frühstückst", "du?", "heute", "isst", "Uhr"]),
            ("jetzt habe ich Zeit", "now I have time", ["jetzt", "habe", "ich", "Zeit", "Geld", "heute"])
        ],
        "dialogue": {
            "name": "Sophie",
            "prompt": "Wie spät ist es jetzt?",
            "translation": "What time is it now?",
            "options": [
                {"text": "Es ist genau neun Uhr.", "isCorrect": True},
                {"text": "Mein Vater ist nett.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Es ist acht Uhr morgens", "It is eight o'clock in the morning"),
            ("Heute habe ich viel Zeit", "Today I have a lot of time"),
            ("Am Abend lerne ich Deutsch", "In the evening I learn German")
        ],
        "karaoke_story": (
            "Guten Morgen! Es ist acht Uhr. Zeit für Kaffee und ein leckeres Frühstück.",
            "Good morning! It is eight o'clock. Time for coffee and a delicious breakfast."
        )
    },
    # Unit 8
    {
        "num": 8,
        "title": "Colors, Clothes & Weather",
        "desc": "Describing clothes, seasonal weather in Germany and vibrant colors",
        "color": "#78C800",
        "words": [
            ("blau", "blue"), ("rot", "red"), ("grün", "green"), ("gelb", "yellow"),
            ("schwarz", "black"), ("weiß", "white"), ("Hemd", "shirt"), ("Hose", "pants"),
            ("Jacke", "jacket"), ("Schuhe", "shoes"), ("Kleid", "dress"), ("warm", "warm"),
            ("kalt", "cold"), ("schön", "beautiful"), ("tragen", "to wear"), ("Wetter", "weather")
        ],
        "sentences": [
            ("die Jacke ist warm", "the jacket is warm", ["die", "Jacke", "ist", "warm", "kalt", "Hose"]),
            ("mein Hemd ist blau", "my shirt is blue", ["mein", "Hemd", "ist", "blau", "rot", "grün"]),
            ("die Hose ist schwarz", "the pants are black", ["die", "Hose", "ist", "schwarz", "weiß", "Hemd"]),
            ("ich trage rote Schuhe", "I wear red shoes", ["ich", "trage", "rote", "Schuhe", "blaue", "Jacke"]),
            ("das Wetter ist heute schön", "the weather is nice today", ["das", "Wetter", "ist", "heute", "schön", "kalt"]),
            ("das Kleid ist grün und neu", "the dress is green and new", ["das", "Kleid", "ist", "grün", "und", "neu", "alt"]),
            ("im Winter ist es sehr kalt", "in winter it is very cold", ["im", "Winter", "ist", "es", "sehr", "kalt", "warm"]),
            ("seine Schuhe sind sauber und schwarz", "his shoes are clean and black", ["seine", "Schuhe", "sind", "sauber", "und", "schwarz", "weiß"])
        ],
        "dialogue": {
            "name": "Leon",
            "prompt": "Wie findest du meine neue Jacke?",
            "translation": "How do you like my new jacket?",
            "options": [
                {"text": "Die Jacke ist sehr schön und warm!", "isCorrect": True},
                {"text": "Um sieben Uhr morgens.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Meine Jacke ist blau und warm", "My jacket is blue and warm"),
            ("Das Wetter ist heute sonnig und schön", "The weather is sunny and nice today"),
            ("Ich trage ein weißes Hemd", "I wear a white shirt")
        ],
        "karaoke_story": (
            "Heute ist das Wetter schön. Ich trage meine blaue Jacke und neue Schuhe.",
            "Today the weather is nice. I wear my blue jacket and new shoes."
        )
    },
    # Unit 9
    {
        "num": 9,
        "title": "Expressing Needs, Likes & Courtesies",
        "desc": "Polite German requests with 'ich möchte', preferences with 'gern', and courteous manners",
        "color": "#CE82FF",
        "words": [
            ("ich möchte", "I would like"), ("ich brauche", "I need"), ("gern", "gladly / like to"), ("nicht", "not"),
            ("kein", "no / none"), ("Entschuldigung", "excuse me / sorry"), ("bitte schön", "here you go"), ("gern geschehen", "you are welcome"),
            ("kein Problem", "no problem"), ("Hilfe", "help"), ("helfen", "to help"), ("Rechnung", "bill / check"),
            ("zahlen", "to pay"), ("mögen", "to like"), ("vielleicht", "maybe"), ("sehr", "very")
        ],
        "sentences": [
            ("ich möchte zahlen, bitte", "I would like to pay, please", ["ich", "möchte", "zahlen,", "bitte", "brauche", "Rechnung"]),
            ("die Rechnung, bitte", "the check, please", ["die", "Rechnung,", "bitte", "Hilfe", "zahlen"]),
            ("ich trinke gern Kaffee", "I like to drink coffee", ["ich", "trinke", "gern", "Kaffee", "Tee", "nicht"]),
            ("ich brauche deine Hilfe", "I need your help", ["ich", "brauche", "deine", "Hilfe", "möchte", "Geld"]),
            ("Entschuldigung, sprechen Sie Englisch?", "excuse me, do you speak English?", ["Entschuldigung,", "sprechen", "Sie", "Englisch?", "Deutsch", "bitte"]),
            ("vielen Dank! - Gern geschehen!", "thank you very much! - You're welcome!", ["vielen", "Dank!", "-", "Gern", "geschehen!", "bitte"]),
            ("ich esse nicht gern Fleisch", "I do not like to eat meat", ["ich", "esse", "nicht", "gern", "Fleisch", "Brot"]),
            ("können Sie mir bitte helfen?", "could you please help me?", ["können", "Sie", "mir", "bitte", "helfen?", "brauche"])
        ],
        "dialogue": {
            "name": "Kellner",
            "prompt": "Möchten Sie noch etwas bestellen?",
            "translation": "Would you like to order anything else?",
            "options": [
                {"text": "Nein danke, ich möchte zahlen, bitte.", "isCorrect": True},
                {"text": "Die Hose ist schwarz.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Ich möchte bezahlen, bitte", "I would like to pay, please"),
            ("Entschuldigung, können Sie mir helfen?", "Excuse me, can you help me?"),
            ("Vielen Dank! Gern geschehen!", "Thank you very much! You're welcome!")
        ],
        "karaoke_story": (
            "Entschuldigung! Ich brauche Hilfe. Können Sie mir bitte helfen? Vielen Dank!",
            "Excuse me! I need help. Could you please help me? Thank you very much!"
        )
    },
    # Unit 10
    {
        "num": 10,
        "title": "Asking Questions & Directions",
        "desc": "City navigation, asking 'Wo ist...', directional phrases and German W-questions",
        "color": "#FF9600",
        "words": [
            ("wo ist", "where is"), ("wie", "how"), ("wer", "who"), ("was", "what"),
            ("wann", "when"), ("warum", "why"), ("links", "left"), ("rechts", "right"),
            ("geradeaus", "straight ahead"), ("nah", "near"), ("weit", "far"), ("Ecke", "corner"),
            ("Ampel", "traffic light"), ("Straße", "street"), ("hier", "here"), ("dort", "there")
        ],
        "sentences": [
            ("wo ist die Straße?", "where is the street?", ["wo", "ist", "die", "Straße?", "hier", "links"]),
            ("bitte gehen Sie geradeaus", "please go straight ahead", ["bitte", "gehen", "Sie", "geradeaus", "links", "rechts"]),
            ("biegen Sie links ab", "turn left", ["biegen", "Sie", "links", "ab", "rechts", "geradeaus"]),
            ("an der Ampel nach rechts", "at the traffic light to the right", ["an", "der", "Ampel", "nach", "rechts", "links"]),
            ("ist es weit von hier?", "is it far from here?", ["ist", "es", "weit", "von", "hier?", "nah", "dort"]),
            ("nein, es ist ganz nah", "no, it is very close", ["nein,", "es", "ist", "ganz", "nah", "weit", "hier"]),
            ("wohin gehen Sie jetzt?", "where are you going now?", ["wohin", "gehen", "Sie", "jetzt?", "wann", "kommen"]),
            ("die Apotheke ist an der Ecke", "the pharmacy is on the corner", ["die", "Apotheke", "ist", "an", "der", "Ecke", "Straße"])
        ],
        "dialogue": {
            "name": "Passant",
            "prompt": "Entschuldigung, wo ist der Bahnhof?",
            "translation": "Excuse me, where is the train station?",
            "options": [
                {"text": "Gehen Sie geradeaus und dann links.", "isCorrect": True},
                {"text": "Ein Brot mit Käse.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Wo ist die nächste Haltestelle?", "Where is the next stop?"),
            ("Gehen Sie bitte geradeaus", "Please go straight ahead"),
            ("An der Ampel biegen Sie rechts ab", "At the traffic light turn right")
        ],
        "karaoke_story": (
            "Entschuldigung, wo ist die Post? Gehen Sie geradeaus bis zur Ampel und dann nach rechts.",
            "Excuse me, where is the post office? Go straight ahead to the traffic light and then to the right."
        )
    },
    # Unit 11
    {
        "num": 11,
        "title": "City Transit & Public Places",
        "desc": "German public transportation: trains, subway, stations, tickets and city landmarks",
        "color": "#2B70C9",
        "words": [
            ("Bahnhof", "train station"), ("Zug", "train"), ("Bus", "bus"), ("U-Bahn", "subway"),
            ("Flughafen", "airport"), ("Fahrkarte", "ticket"), ("Gleis", "platform / track"), ("Apotheke", "pharmacy"),
            ("Supermarkt", "supermarket"), ("Hotel", "hotel"), ("Park", "park"), ("Stadt", "city"),
            ("Zentrum", "center"), ("Haltestelle", "stop"), ("fahren", "to travel / ride"), ("abfahren", "to depart")
        ],
        "sentences": [
            ("eine Fahrkarte nach Berlin, bitte", "a ticket to Berlin, please", ["eine", "Fahrkarte", "nach", "Berlin,", "bitte", "Zug"]),
            ("der Zug fährt um zehn Uhr ab", "the train departs at ten o'clock", ["der", "Zug", "fährt", "um", "zehn", "Uhr", "ab", "Gleis"]),
            ("von welchem Gleis fährt der Zug?", "from which platform does the train depart?", ["von", "welchem", "Gleis", "fährt", "der", "Zug?", "Bus"]),
            ("der Zug steht auf Gleis vier", "the train is on platform four", ["der", "Zug", "steht", "auf", "Gleis", "vier", "drei"]),
            ("ich fahre mit der U-Bahn", "I travel by subway", ["ich", "fahre", "mit", "der", "U-Bahn", "Bus", "Zug"]),
            ("wo ist der nächste Supermarkt?", "where is the nearest supermarket?", ["wo", "ist", "der", "nächste", "Supermarkt?", "Bahnhof"]),
            ("das Hotel liegt im Stadtzentrum", "the hotel is located in the city center", ["das", "Hotel", "liegt", "im", "Stadtzentrum", "Park"]),
            ("der Bus kommt in fünf Minuten", "the bus arrives in five minutes", ["der", "Bus", "kommt", "in", "fünf", "Minuten", "Zug"])
        ],
        "dialogue": {
            "name": "Schaffner",
            "prompt": "Ihre Fahrkarten, bitte!",
            "translation": "Your tickets, please!",
            "options": [
                {"text": "Hier ist meine Fahrkarte. Bitte sehr!", "isCorrect": True},
                {"text": "Mein Zimmer ist sauber.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Eine Fahrkarte nach München, bitte", "A ticket to Munich, please"),
            ("Der Zug nach Frankfurt fährt auf Gleis zwei", "The train to Frankfurt departs on platform two"),
            ("Ich fahre mit dem Bus ins Zentrum", "I take the bus to the city center")
        ],
        "karaoke_story": (
            "Wir sind am Hauptbahnhof. Unser Zug nach München steht auf Gleis vier. Gute Reise!",
            "We are at the main station. Our train to Munich is on platform four. Have a good trip!"
        )
    },
    # Unit 12
    {
        "num": 12,
        "title": "Feelings, Well-Being & Section 1 Graduation",
        "desc": "Expressing health, how you feel, doctor visit basics, and celebrating A1 milestone graduation",
        "color": "#FFD700",
        "words": [
            ("gut", "good"), ("sehr gut", "very good"), ("schlecht", "bad"), ("müde", "tired"),
            ("krank", "sick"), ("gesund", "healthy"), ("Arzt", "doctor"), ("Kopf", "head"),
            ("Kopfschmerzen", "headache"), ("Medizin", "medicine"), ("Wasser", "water"), ("schlafen", "to sleep"),
            ("fühlen", "to feel"), ("Glückwunsch", "congratulations"), ("fertig", "finished"), ("Erfolg", "success")
        ],
        "sentences": [
            ("wie geht es dir?", "how are you?", ["wie", "geht", "es", "dir?", "Ihnen?", "gut"]),
            ("danke, mir geht es sehr gut", "thank you, I am doing very well", ["danke,", "mir", "geht", "es", "sehr", "gut", "schlecht"]),
            ("ich fühle mich heute müde", "I feel tired today", ["ich", "fühle", "mich", "heute", "müde", "krank", "gut"]),
            ("er ist krank und braucht einen Arzt", "he is sick and needs a doctor", ["er", "ist", "krank", "und", "braucht", "einen", "Arzt", "Medizin"]),
            ("trinken Sie viel Wasser und schlafen Sie", "drink plenty of water and sleep", ["trinken", "Sie", "viel", "Wasser", "und", "schlafen", "Sie"]),
            ("ich habe Kopfschmerzen", "I have a headache", ["ich", "habe", "Kopfschmerzen", "Medizin", "Arzt", "Wasser"]),
            ("herzlichen Glückwunsch zum Erfolg!", "congratulations on your success!", ["herzlichen", "Glückwunsch", "zum", "Erfolg!", "fertig", "gut"]),
            ("ich habe Section 1 geschafft und spreche Deutsch!", "I completed Section 1 and speak German!", ["ich", "habe", "Section", "1", "geschafft", "und", "spreche", "Deutsch!"])
        ],
        "dialogue": {
            "name": "Trainer Dolphy",
            "prompt": "Herzlichen Glückwunsch! Du hast Section 1 abgeschlossen. Wie fühlst du dich?",
            "translation": "Congratulations! You completed Section 1. How do you feel?",
            "options": [
                {"text": "Super! Ich kann jetzt Deutsch verstehen und sprechen!", "isCorrect": True},
                {"text": "Nein danke, ich möchte kein Brot.", "isCorrect": False}
            ]
        },
        "speeches": [
            ("Mir geht es heute sehr gut, danke", "I am doing very well today, thank you"),
            ("Ich spreche Deutsch und lerne jeden Tag", "I speak German and learn every day"),
            ("Herzlichen Glückwunsch zum Abschluss von Section 1!", "Congratulations on graduating from Section 1!")
        ],
        "karaoke_story": (
            "Hurra! Ich habe alle zwölf Einheiten geschafft. Ich kann Deutsch sprechen, verstehen und schreiben. Glückwunsch!",
            "Hooray! I completed all twelve units. I can speak, understand and write German. Congratulations!"
        )
    }
]

def generate_german_section_1():
    units_data = []

    for cfg in unit_configs:
        u_num = cfg["num"]
        u_title = cfg["title"]
        u_desc = cfg["desc"]
        u_color = cfg["color"]
        words = cfg["words"]
        sents = cfg["sentences"]
        dlg = cfg["dialogue"]
        speeches = cfg["speeches"]
        karaoke_story = cfg["karaoke_story"]

        lessons = []

        def make_interactive_lesson(
            l_idx,
            l_num,
            sub_title,
            sub_desc,
            pic_w,
            pic_dist,
            match_subset,
            core_sent,
            cloze_info,
            listen_info,
            select_info,
            type_w,
            dlg_info,
            speech_info,
            karaoke_info,
            node_type="lesson",
            xp=15,
            pearls=5
        ):
            type_w_clean = clean_type_word(type_w, words)
            stages = build_10_stages(
                unit_num=u_num,
                lesson_num=l_num,
                pic_word_de=pic_w[0],
                pic_trans_en=pic_w[1],
                pic_distractors=pic_dist,
                match_pairs=match_subset,
                sent_prompt_en=core_sent[1],
                sent_target_de=core_sent[0],
                sent_tokens_de=core_sent[2],
                cloze_sentence_de=cloze_info[0],
                cloze_blank_de=cloze_info[1],
                cloze_trans_en=cloze_info[2],
                cloze_options_de=cloze_info[3],
                listen_target_de=listen_info[0],
                listen_tokens_de=listen_info[1],
                listen_spoken_de=select_info[0],
                listen_correct_en=select_info[1],
                listen_distractor_en=select_info[2],
                type_target_de=type_w_clean[0],
                type_trans_en=type_w_clean[1],
                type_hint_en=f"Hint: starts with '{type_w_clean[0][0]}'",
                partner_name=dlg_info["name"],
                partner_msg_de=dlg_info["prompt"],
                partner_msg_en=dlg_info["translation"],
                reply_correct_de=dlg_info["options"][0]["text"],
                reply_wrong_de=dlg_info["options"][1]["text"],
                sprechen_de=speech_info[0],
                sprechen_en=speech_info[1],
                karaoke_story_de=karaoke_info[0],
                karaoke_story_en=karaoke_info[1]
            )
            return build_lesson(l_idx, l_num, u_title, sub_title, sub_desc, node_type, xp, pearls, stages)

        # L1: Lesson 1 - Intro Nouns & Core Vocabulary
        lessons.append(make_interactive_lesson(
            0, 1, "Lesson 1", f"{u_desc}: Core Words",
            pic_w=words[0],
            pic_dist=[words[1], words[2]],
            match_subset=words[0:4],
            core_sent=sents[0],
            cloze_info=make_cloze_for_lesson(sents[0], words[0][0], words),
            listen_info=(sents[0][0], sents[0][2]),
            select_info=(sents[0][0], sents[0][1], sents[1][1]),
            type_w=words[0],
            dlg_info=dlg,
            speech_info=(sents[0][0], sents[0][1]),
            karaoke_info=(f"{sents[0][0]}. {words[0][0]} ist gut.", f"{sents[0][1]}. {words[0][1].capitalize()} is good.")
        ))

        # L2: Lesson 2 - Expansion & Sentence Syntax
        lessons.append(make_interactive_lesson(
            1, 2, "Lesson 2", f"{u_desc}: Sentence Syntax",
            pic_w=words[4],
            pic_dist=[words[5], words[6]],
            match_subset=words[4:8],
            core_sent=sents[1],
            cloze_info=make_cloze_for_lesson(sents[1], words[4][0], words),
            listen_info=(sents[1][0], sents[1][2]),
            select_info=(sents[1][0], sents[1][1], sents[2][1]),
            type_w=words[4],
            dlg_info=dlg,
            speech_info=(speeches[0], sents[0][1]),
            karaoke_info=(f"{sents[1][0]}. Es ist sehr schön.", f"{sents[1][1]}. It is very nice.")
        ))

        # L3: Lesson 3 - Compounds & Conjunctions
        lessons.append(make_interactive_lesson(
            2, 3, "Lesson 3", f"{u_desc}: Compounds & Conjunctions",
            pic_w=words[8],
            pic_dist=[words[9], words[10]],
            match_subset=words[8:12],
            core_sent=sents[2],
            cloze_info=make_cloze_for_lesson(sents[2], words[8][0], words),
            listen_info=(sents[2][0], sents[2][2]),
            select_info=(sents[2][0], sents[2][1], sents[3][1]),
            type_w=words[8],
            dlg_info=dlg,
            speech_info=(sents[2][0], sents[2][1]),
            karaoke_info=(f"{sents[2][0]}. Wir mögen das.", f"{sents[2][1]}. We like this.")
        ))

        # L4: Lesson 4 - Ear Training & Listening Immersion
        lessons.append(make_interactive_lesson(
            3, 4, "Lesson 4", f"{u_desc}: Ear Training",
            pic_w=words[1],
            pic_dist=[words[4], words[8]],
            match_subset=[words[1], words[5], words[9], words[2]],
            core_sent=sents[3],
            cloze_info=make_cloze_for_lesson(sents[3], words[1][0], words),
            listen_info=(sents[3][0], sents[3][2]),
            select_info=(sents[3][0], sents[3][1], sents[0][1]),
            type_w=words[1],
            dlg_info=dlg,
            speech_info=(speeches[1] if len(speeches) > 1 else speeches[0], sents[1][1]),
            karaoke_info=(f"{sents[3][0]}. Höre und sprich jeden Tag.", f"{sents[3][1]}. Listen and speak every day.")
        ))

        # L5: Lesson 5 - Quality & Context Mastery
        lessons.append(make_interactive_lesson(
            4, 5, "Lesson 5", f"{u_desc}: Context Mastery",
            pic_w=words[12],
            pic_dist=[words[13], words[14]],
            match_subset=words[12:16],
            core_sent=sents[4],
            cloze_info=make_cloze_for_lesson(sents[4], words[12][0], words),
            listen_info=(sents[4][0], sents[4][2]),
            select_info=(sents[4][0], sents[4][1], sents[1][1]),
            type_w=words[12],
            dlg_info=dlg,
            speech_info=(sents[4][0], sents[4][1]),
            karaoke_info=(f"{sents[4][0]}. Du machst das sehr gut.", f"{sents[4][1]}. You are doing very well.")
        ))

        # L6: Treasure Chest 1 (Milestone Reward - 0 Stages)
        lessons.append(make_chest(5, 6, u_title, 1, 15, 25))

        # L7: Lesson 7 - Post-Chest Compounds & Usage
        lessons.append(make_interactive_lesson(
            6, 7, "Lesson 7", f"{u_desc}: Compound Usage",
            pic_w=words[5],
            pic_dist=[words[6], words[7]],
            match_subset=[words[3], words[7], words[11], words[15]],
            core_sent=sents[5],
            cloze_info=make_cloze_for_lesson(sents[5], words[5][0], words),
            listen_info=(sents[5][0], sents[5][2]),
            select_info=(sents[5][0], sents[5][1], sents[2][1]),
            type_w=words[5],
            dlg_info=dlg,
            speech_info=(sents[5][0], sents[5][1]),
            karaoke_info=(f"{sents[5][0]}. Übung macht den Meister.", f"{sents[5][1]}. Practice makes perfect.")
        ))

        # L8: Lesson 8 - Advanced Sentences & Context
        lessons.append(make_interactive_lesson(
            7, 8, "Lesson 8", f"{u_desc}: Sentence Patterns",
            pic_w=words[9],
            pic_dist=[words[10], words[11]],
            match_subset=[words[0], words[4], words[8], words[12]],
            core_sent=sents[6],
            cloze_info=make_cloze_for_lesson(sents[6], words[9][0], words),
            listen_info=(sents[6][0], sents[6][2]),
            select_info=(sents[6][0], sents[6][1], sents[3][1]),
            type_w=words[9],
            dlg_info=dlg,
            speech_info=(sents[6][0], sents[6][1]),
            karaoke_info=(f"{sents[6][0]}. Alles ist in bester Ordnung.", f"{sents[6][1]}. Everything is in good order.")
        ))

        # L9: Lesson 9 - Oral Fluency & Speech Lab
        lessons.append(make_interactive_lesson(
            8, 9, "Lesson 9", f"{u_desc}: Speech Lab",
            pic_w=words[13],
            pic_dist=[words[14], words[15]],
            match_subset=[words[2], words[6], words[10], words[14]],
            core_sent=sents[7],
            cloze_info=make_cloze_for_lesson(sents[7], words[13][0], words),
            listen_info=(sents[7][0], sents[7][2]),
            select_info=(sents[7][0], sents[7][1], sents[4][1]),
            type_w=words[13],
            dlg_info=dlg,
            speech_info=(speeches[2] if len(speeches) > 2 else speeches[0], sents[2][1]),
            karaoke_info=(f"{sents[7][0]}. Sprich deutlich und mit Freude.", f"{sents[7][1]}. Speak clearly and with joy.")
        ))

        # L10: Lesson 10 - Grand Conversational Synthesis
        lessons.append(make_interactive_lesson(
            9, 10, "Lesson 10", f"{u_desc}: Dialogue Mastery",
            pic_w=words[3],
            pic_dist=[words[7], words[11]],
            match_subset=[words[1], words[4], words[9], words[13]],
            core_sent=sents[0],
            cloze_info=make_cloze_for_lesson(sents[0], words[3][0], words),
            listen_info=(sents[6][0], sents[6][2]),
            select_info=(sents[7][0], sents[7][1], sents[5][1]),
            type_w=words[3],
            dlg_info=dlg,
            speech_info=(speeches[0], sents[0][1]),
            karaoke_info=(karaoke_story[0], karaoke_story[1])
        ))

        # L11: Treasure Chest 2 (Milestone Reward - 0 Stages)
        lessons.append(make_chest(10, 11, u_title, 2, 20, 35))

        # L12: Unit Milestone Exam (Trophy Challenge - 10 Stages)
        exam_matches = [words[0], words[4], words[8], words[12]]
        lessons.append(make_interactive_lesson(
            11, 12, f"Unit {u_num} Milestone Exam", f"{u_desc}: Comprehensive Unit Exam (Trophy Challenge)",
            pic_w=words[0],
            pic_dist=[words[4], words[8]],
            match_subset=exam_matches,
            core_sent=sents[5],
            cloze_info=make_cloze_for_lesson(sents[5], words[0][0], words),
            listen_info=(sents[7][0], sents[7][2]),
            select_info=(sents[4][0], sents[4][1], sents[0][1]),
            type_w=words[15],
            dlg_info=dlg,
            speech_info=(speeches[0], sents[0][1]),
            karaoke_info=(karaoke_story[0], karaoke_story[1]),
            node_type="quiz",
            xp=35,
            pearls=10
        ))

        units_data.append({
            "unitNumber": u_num,
            "unitTitle": u_title,
            "unitDescription": u_desc,
            "accentColor": u_color,
            "lessonsCount": 12,
            "lessons": lessons
        })

    return units_data

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(root_dir, "syllabus", "section_1_german")
    os.makedirs(output_dir, exist_ok=True)

    print("🚀 Generating Complete Section 1 German Curriculum (12 Units x 12 Lessons = 144 Lessons)...")
    print("   • Target Language: German (de) | Native/Instruction: English (en)")
    print("   • All 10 challenge formats populated in each interactive lesson")
    print("   • picture_select generated with enabled: false (unticked for custom images)")
    print("   • German cultural vocabulary (Brot, Brötchen, Kaffee, Käse, Bahnhof, etc.)")
    print("   • Sunken Treasure Chests at L6 (+25💎) & L11 (+35💎)")

    units = generate_german_section_1()

    unit_filenames = [
        "unit_01_objects_possessives.json",
        "unit_02_food_temperatures.json",
        "unit_03_family_identity.json",
        "unit_04_daily_verbs.json",
        "unit_05_numbers_plurals.json",
        "unit_06_home_prepositions.json",
        "unit_07_routines_time.json",
        "unit_08_colors_clothes.json",
        "unit_09_needs_courtesies.json",
        "unit_10_questions_directions.json",
        "unit_11_city_transit.json",
        "unit_12_feelings_graduation.json"
    ]

    total_lessons = 0
    total_stages = 0
    total_interactive_lessons = 0

    # Write each individual unit file
    for idx, u in enumerate(units):
        filename = unit_filenames[idx]
        filepath = os.path.join(output_dir, filename)

        unit_obj = {
            "courseTitle": "German A1 Comprehensive Curriculum (For English Speakers)",
            "learningLanguage": "de",
            "nativeLanguage": "en",
            "level": "A1",
            "sectionNumber": 1,
            "sectionTitle": "Section 1: Rookie (A1 Foundation)",
            "unitNumber": u["unitNumber"],
            "unitTitle": u["unitTitle"],
            "unitDescription": u["unitDescription"],
            "accentColor": u["accentColor"],
            "lessonsCount": u["lessonsCount"],
            "lessons": u["lessons"]
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(unit_obj, f, indent=2, ensure_ascii=False)

        l_count = len(u["lessons"])
        s_count = sum(len(l.get("stages", [])) for l in u["lessons"])
        inter_count = sum(1 for l in u["lessons"] if l.get("stages") and len(l["stages"]) > 0)

        total_lessons += l_count
        total_stages += s_count
        total_interactive_lessons += inter_count

        print(f"   ✅ Unit {u['unitNumber']:02d}: {u['unitTitle']} -> {filename} ({l_count} lessons, {s_count} stages across {inter_count} interactive lessons)")

    # Build and write consolidated Section 1 JSON file
    consolidated_path = os.path.join(root_dir, "syllabus", "section_1_german_english.json")
    consolidated = {
        "courseTitle": "German A1 Comprehensive Curriculum (For English Speakers)",
        "learningLanguage": "de",
        "nativeLanguage": "en",
        "level": "A1",
        "totalSections": 1,
        "sectionNumber": 1,
        "sectionTitle": "Section 1: Rookie (A1 Foundation)",
        "totalUnits": len(units),
        "totalLessons": total_lessons,
        "generatedAt": "2026-11-05T00:00:00Z",
        "units": [
            {
                "sectionNumber": 1,
                "sectionTitle": "Section 1: Rookie (A1 Foundation)",
                "sectionUnitNumber": u["unitNumber"],
                "unitNumber": u["unitNumber"],
                "unitTitle": u["unitTitle"],
                "unitDescription": u["unitDescription"],
                "accentColor": u["accentColor"],
                "lessonsCount": u["lessonsCount"],
                "lessonsData": u["lessons"]
            }
            for u in units
        ]
    }

    with open(consolidated_path, "w", encoding="utf-8") as f:
        json.dump(consolidated, f, indent=2, ensure_ascii=False)

    print(f"\n🎉 Successfully compiled consolidated Section 1 German curriculum:")
    print(f"   📁 File: {consolidated_path}")
    print(f"   📊 Total Units: {len(units)}")
    print(f"   📚 Total Lessons: {total_lessons} ({total_interactive_lessons} interactive + {total_lessons - total_interactive_lessons} chests)")
    print(f"   🧩 Total Modular Interactive Stages: {total_stages}")
    print(f"   📷 picture_select status: Pre-populated with enabled: false (unticked)")

if __name__ == "__main__":
    main()
