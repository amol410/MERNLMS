#!/usr/bin/env python3
"""
Generate Complete Section 1 Curriculum for English Learning for Marathi Speakers (en_mr_a1)
Total: 12 Units x 12 Lessons = 144 Lessons/Nodes.
Pedagogical Model: Scaffolded incremental micro-steps with authentic Marathi grammar (3 genders, respectful pronouns).

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
    clean_target = target.strip(".,!?:;\"'()")
    if len(clean_target.split()) > 1:
        stopwords = {'a', 'an', 'the', 'and', 'is', 'in', 'on', 'at', 'to', 'of', 'it', 'he', 'she'}
        try:
            curr_idx = [w[0] for w in unit_words].index(type_w_tuple[0])
        except ValueError:
            curr_idx = -1
        if curr_idx != -1:
            for offset in [-1, 1, -2, 2, -3, 3]:
                cand_idx = curr_idx + offset
                if 0 <= cand_idx < len(unit_words):
                    cw = unit_words[cand_idx]
                    cw_clean = cw[0].strip(".,!?:;\"'()")
                    if len(cw_clean.split()) == 1 and cw_clean.lower() not in stopwords:
                        return (cw_clean, cw[1])
        for w in unit_words:
            w_clean = w[0].strip(".,!?:;\"'()")
            if len(w_clean.split()) == 1 and w_clean.lower() not in stopwords:
                return (w_clean, w[1])
        return (clean_target.split()[-1], trans)
    return (clean_target, trans)

def build_10_stages(
    unit_num,
    lesson_num,
    # 1. Picture Select (unticked / disabled by default)
    pic_word, pic_trans_mr, pic_distractors,
    # 2. Word Match (4 pairs: target English, native Marathi)
    match_pairs,
    # 3. Sentence Builder
    sent_prompt_mr, sent_target_en, sent_tokens,
    # 4. Cloze
    cloze_sentence, cloze_blank, cloze_trans_mr, cloze_options,
    # 5. Listen Tap
    listen_target_en, listen_tokens,
    # 6. Listen Select
    listen_spoken_en, listen_correct_mr, listen_distractor_mr,
    # 7. Type Word
    type_target_en, type_trans_mr, type_hint="",
    # 8. Dialogue
    partner_name="Anna", partner_msg_en="Hello!", partner_msg_mr="नमस्कार!", reply_correct="Hello!", reply_wrong="Water, please.",
    # 9. Sprechen
    sprechen_en="Hello!", sprechen_mr="नमस्कार!",
    # 10. Karaoke
    karaoke_story_en="Hello! Welcome to English.", karaoke_story_mr="नमस्कार! इंग्रजीमध्ये आपले स्वागत आहे."
):
    return [
        # 1. Picture Vocabulary Card (Unticked / enabled: False so user can upload custom images)
        {
            "type": "picture_select",
            "enabled": False,
            "title": "चित्र निवडा",
            "prompt": f"'{pic_trans_mr}' साठी योग्य चित्र निवडा:",
            "targetWord": pic_word,
            "translation": pic_trans_mr,
            "options": [
                {
                    "id": f"u{unit_num}_l{lesson_num}_p1",
                    "text": f"{pic_word} ({pic_trans_mr})",
                    "imageUrl": f"/uploads/curriculum/{pic_word.lower().replace(' ', '_')}.webp",
                    "isCorrect": True
                },
                {
                    "id": f"u{unit_num}_l{lesson_num}_p2",
                    "text": f"{pic_distractors[0][0]} ({pic_distractors[0][1]})",
                    "imageUrl": f"/uploads/curriculum/{pic_distractors[0][0].lower().replace(' ', '_')}.webp",
                    "isCorrect": False
                },
                {
                    "id": f"u{unit_num}_l{lesson_num}_p3",
                    "text": f"{pic_distractors[1][0]} ({pic_distractors[1][1]})",
                    "imageUrl": f"/uploads/curriculum/{pic_distractors[1][0].lower().replace(' ', '_')}.webp",
                    "isCorrect": False
                }
            ]
        },
        # 2. Match Word Pairs (4 pairs)
        {
            "type": "word_match",
            "title": "योग्य शब्दांच्या जोड्या जुळवा",
            "pairs": [{"target": p[0], "native": p[1]} for p in match_pairs]
        },
        # 3. Sentence Builder
        {
            "type": "sentence_builder",
            "title": "इंग्रजी वाक्य तयार करा",
            "prompt": sent_prompt_mr,
            "targetSentence": sent_target_en,
            "tokens": sent_tokens
        },
        # 4. Fill-in-the-Blank (Cloze Test)
        {
            "type": "cloze_test",
            "title": "गाळलेली जागा भरा",
            "sentence": cloze_sentence,
            "blank": cloze_blank,
            "translation": cloze_trans_mr,
            "options": cloze_options
        },
        # 5. Listen & Tap (Echo)
        {
            "type": "listen_tap",
            "title": "ऐका आणि योग्य शब्दांवर टॅप करा",
            "targetSentence": listen_target_en,
            "tokens": listen_tokens,
            "audioUrl": ""
        },
        # 6. Listen & Select MCQ
        {
            "type": "listen_select",
            "title": "ऐका आणि योग्य अर्थ निवडा",
            "spokenGerman": listen_spoken_en,
            "question": "या वाक्याचा योग्य मराठी अर्थ काय आहे?",
            "prompt": "या वाक्याचा योग्य मराठी अर्थ काय आहे?",
            "options": [
                {"text": listen_correct_mr, "isCorrect": True},
                {"text": listen_distractor_mr, "isCorrect": False}
            ],
            "correctOption": listen_correct_mr,
            "audioUrl": ""
        },
        # 7. Type Word (Spelling Entry)
        {
            "type": "type_word",
            "title": "स्पेलिंग टाईप करा",
            "prompt": f"'{type_trans_mr}' साठी इंग्रजी शब्द टाईप करा:",
            "target": type_target_en,
            "translation": type_trans_mr,
            "hint": type_hint if type_hint else f"संकेत: {type_target_en[0].upper()} ने सुरू होते",
            "audioUrl": ""
        },
        # 8. Dialogue Messenger
        {
            "type": "dialogue_bubble",
            "title": "संभाषण पूर्ण करा",
            "partnerName": partner_name,
            "partnerAvatar": "dolphina",
            "partnerMessage": partner_msg_en,
            "translation": partner_msg_mr,
            "options": [
                {"text": reply_correct, "isCorrect": True},
                {"text": reply_wrong, "isCorrect": False}
            ],
            "correctOption": reply_correct,
            "audioUrl": ""
        },
        # 9. Sprechen (Oral Speech & Pronunciation)
        {
            "type": "sprechen",
            "title": "बोलून सराव करा",
            "prompt": sprechen_en,
            "translation": sprechen_mr,
            "minAccuracy": 75,
            "audioUrl": ""
        },
        # 10. Karaoke Synced Story / Fluency
        {
            "type": "karaoke",
            "title": "लयबद्ध वाचन (Karaoke Reading)",
            "storyText": karaoke_story_en,
            "translationText": karaoke_story_mr,
            "audioUrl": ""
        }
    ]

# =============================================================================
# CURRICULUM DATASET DEFINITIONS (ALL 12 UNITS OF SECTION 1)
# =============================================================================

unit_configs = [
    # Unit 1
    {
        "num": 1,
        "title": "Basic Objects & Possessives",
        "desc": "मूलभूत वस्तू आणि संबंध",
        "color": "#1CB0F6",
        "words": [
            ("house", "घर"), ("car", "गाडी"), ("my", "माझे / माझी"), ("your", "तुझे / तुझी"),
            ("big", "मोठे / मोठी"), ("small", "लहान"), ("is", "आहे"), ("clean", "स्वच्छ"),
            ("dirty", "घाणेरडे"), ("new", "नवीन"), ("old", "जुने"), ("name", "नाव"),
            ("this", "हे / ही"), ("that", "ते / ती"), ("here", "येथे"), ("there", "तेथे")
        ],
        "sentences": [
            ("my car", "माझी गाडी", ["my", "car", "house", "your", "is"]),
            ("my house is big", "माझे घर मोठे आहे.", ["my", "house", "is", "big", "small", "car"]),
            ("your car is small", "तुझी गाडी लहान आहे.", ["your", "car", "is", "small", "big", "house"]),
            ("his house is clean", "त्याचे घर स्वच्छ आहे.", ["his", "house", "is", "clean", "dirty", "my"]),
            ("my car is very clean", "माझी गाडी खूप स्वच्छ आहे.", ["my", "car", "is", "very", "clean", "house"]),
            ("this is my car", "ही माझी गाडी आहे.", ["this", "is", "my", "car", "that", "house"]),
            ("that is your house", "ते तुझे घर आहे.", ["that", "is", "your", "house", "this", "car"]),
            ("my car is new and clean", "माझी गाडी नवीन आणि स्वच्छ आहे.", ["my", "car", "is", "new", "and", "clean", "old"])
        ],
        "dialogue": {
            "name": "Anna",
            "prompt": "Is this your car?",
            "translation": "ही तुझी गाडी आहे का?",
            "options": [
                {"text": "Yes, this is my car.", "isCorrect": True},
                {"text": "Cold tea, please.", "isCorrect": False}
            ]
        },
        "speeches": ["My car is big", "This is my house", "My car is new and clean"],
        "karaoke_story": ("This is my car. My car is very clean and new.", "ही माझी गाडी आहे. माझी गाडी खूप स्वच्छ आणि नवीन आहे.")
    },
    # Unit 2
    {
        "num": 2,
        "title": "Food, Drinks & Temperatures",
        "desc": "अन्न, पेये आणि तापमान",
        "color": "#58CC02",
        "words": [
            ("water", "पाणी"), ("tea", "चहा"), ("coffee", "कॉफी"), ("milk", "दूध"),
            ("cold", "थंड"), ("hot", "गरम"), ("sweet", "गोड"), ("and", "आणि"),
            ("bread", "पाव"), ("sugar", "साखर"), ("food", "जेवण"), ("tasty", "चवदार"),
            ("spicy", "तिखट"), ("fresh", "ताजे"), ("please", "कृपया"), ("thank you", "धन्यवाद")
        ],
        "sentences": [
            ("cold water", "थंड पाणी", ["cold", "water", "hot", "tea"]),
            ("hot tea", "गरम चहा", ["hot", "tea", "cold", "water"]),
            ("tea and water", "चहा आणि पाणी", ["tea", "and", "water", "coffee", "milk"]),
            ("hot coffee and cold milk", "गरम कॉफी आणि थंड दूध", ["hot", "coffee", "and", "cold", "milk", "tea"]),
            ("This food is hot", "हे जेवण गरम आहे.", ["This", "food", "is", "hot", "cold", "tea"]),
            ("Tea is sweet and tasty", "चहा गोड आणि चवदार आहे.", ["Tea", "is", "sweet", "and", "tasty", "spicy"]),
            ("Water, please", "कृपया पाणी द्या.", ["Water,", "please", "Thank", "you", "tea"]),
            ("I want hot tea", "मला गरम चहा पाहिजे.", ["I", "want", "hot", "tea", "cold", "water"])
        ],
        "dialogue": {
            "name": "Waiter",
            "prompt": "Tea or coffee?",
            "translation": "चहा की कॉफी?",
            "options": [
                {"text": "Hot tea, please.", "isCorrect": True},
                {"text": "My house is big.", "isCorrect": False}
            ]
        },
        "speeches": ["Hot tea and cold water", "Water, please", "Tea is sweet"],
        "karaoke_story": ("I drink hot tea every morning. The food is fresh and tasty.", "मी दररोज सकाळी गरम चहा पितो. जेवण ताजे आणि चवदार आहे.")
    },
    # Unit 3
    {
        "num": 3,
        "title": "Family, People & Identity",
        "desc": "कुटुंब, लोक आणि ओळख",
        "color": "#CE82FF",
        "words": [
            ("father", "वडील"), ("mother", "आई"), ("brother", "भाऊ"), ("sister", "बहीण"),
            ("friend", "मित्र"), ("boy", "मुलगा"), ("girl", "मुलगी"), ("man", "पुरुष"),
            ("woman", "स्त्री / महिला"), ("teacher", "शिक्षक"), ("student", "विद्यार्थी"), ("family", "कुटुंब"),
            ("I", "मी"), ("you", "तू / तुम्ही"), ("he", "तो"), ("we", "आम्ही")
        ],
        "sentences": [
            ("He is my father", "ते माझे वडील आहेत.", ["He", "is", "my", "father", "She", "mother"]),
            ("She is my mother", "त्या माझी आई आहेत.", ["She", "is", "my", "mother", "He", "sister"]),
            ("I am a student", "मी एक विद्यार्थी आहे.", ["I", "am", "a", "student", "teacher", "You"]),
            ("You are my friend", "तू माझा मित्र आहेस.", ["You", "are", "my", "friend", "brother", "We"]),
            ("He is a good teacher", "ते एक चांगले शिक्षक आहेत.", ["He", "is", "a", "good", "teacher", "student"]),
            ("We are friends", "आम्ही मित्र आहोत.", ["We", "are", "friends", "They", "family", "I"]),
            ("She is my sister", "ती माझी बहीण आहे.", ["She", "is", "my", "sister", "brother", "mother"]),
            ("They are my family", "ते माझे कुटुंब आहेत.", ["They", "are", "my", "family", "friends", "We"])
        ],
        "dialogue": {
            "name": "Priya",
            "prompt": "Who is he?",
            "translation": "ते कोण आहेत?",
            "options": [
                {"text": "He is my brother.", "isCorrect": True},
                {"text": "Cold water, please.", "isCorrect": False}
            ]
        },
        "speeches": ["He is my father", "I am a student", "You are my friend"],
        "karaoke_story": ("This is my family. She is my mother and he is my brother.", "हे माझे कुटुंब आहे. त्या माझी आई आहेत आणि तो माझा भाऊ आहे.")
    },
    # Unit 4
    {
        "num": 4,
        "title": "Common Everyday Verbs & SVO",
        "desc": "दैनंदिन क्रिया आणि वाक्यरचना",
        "color": "#FF9600",
        "words": [
            ("eat", "खाणे"), ("drink", "पिणे"), ("read", "वाचणे"), ("write", "लिहिणे"),
            ("speak", "बोलणे"), ("learn", "शिकणे"), ("live", "राहणे"), ("go", "जाणे"),
            ("come", "येणे"), ("like", "आवडणे"), ("book", "पुस्तक"), ("newspaper", "वर्तमानपत्र"),
            ("English", "इंग्रजी"), ("Hindi", "हिंदी"), ("Marathi", "मराठी"), ("daily", "दररोज")
        ],
        "sentences": [
            ("I read a book", "मी पुस्तक वाचतो.", ["I", "read", "a", "book", "write", "newspaper"]),
            ("I drink hot water", "मी गरम पाणी पितो.", ["I", "drink", "hot", "water", "eat", "tea"]),
            ("You speak English", "तुम्ही इंग्रजी बोलता.", ["You", "speak", "English", "Hindi", "read"]),
            ("We learn English daily", "आम्ही दररोज इंग्रजी शिकतो.", ["We", "learn", "English", "daily", "speak", "Hindi"]),
            ("She eats an apple", "ती सफरचंद खाते.", ["She", "eats", "an", "apple", "drinks", "bread"]),
            ("He writes a letter", "तो पत्र लिहितो.", ["He", "writes", "a", "letter", "reads", "book"]),
            ("They live in Mumbai", "ते मुंबईत राहतात.", ["They", "live", "in", "Mumbai", "go", "Delhi"]),
            ("I like hot tea", "मला गरम चहा आवडतो.", ["I", "like", "hot", "tea", "want", "cold"])
        ],
        "dialogue": {
            "name": "Rohan",
            "prompt": "Do you speak English?",
            "translation": "तुम्ही इंग्रजी बोलता का?",
            "options": [
                {"text": "Yes, I speak English.", "isCorrect": True},
                {"text": "This is my dog.", "isCorrect": False}
            ]
        },
        "speeches": ["I read a book daily", "We learn English", "I drink hot water"],
        "karaoke_story": ("Every day I read a book and drink hot tea. I learn English with my friends.", "दररोज मी पुस्तक वाचतो आणि गरम चहा पितो. मी माझ्या मित्रांसोबत इंग्रजी शिकतो.")
    },
    # Unit 5
    {
        "num": 5,
        "title": "Numbers, Quantities & Shopping",
        "desc": "संख्या, प्रमाण आणि खरेदी",
        "color": "#22C55E",
        "words": [
            ("one", "एक"), ("two", "दोन"), ("three", "तीन"), ("four", "चार"),
            ("five", "पाच"), ("ten", "दहा"), ("hundred", "शंभर"), ("rupee", "रुपया"),
            ("cost", "किंमत"), ("expensive", "महाग"), ("cheap", "स्वस्त"), ("many", "अनेक"),
            ("how much", "किती"), ("total", "एकूण"), ("buy", "खरेदी करणे"), ("shop", "दुकान")
        ],
        "sentences": [
            ("How much does it cost?", "याची किंमत किती आहे?", ["How", "much", "does", "it", "cost?", "many"]),
            ("It costs ten rupees", "याची किंमत दहा रुपये आहे.", ["It", "costs", "ten", "rupees", "five", "hundred"]),
            ("Two cups of tea, please", "कृपया दोन कप चहा द्या.", ["Two", "cups", "of", "tea,", "please", "three"]),
            ("This book is expensive", "हे पुस्तक महाग आहे.", ["This", "book", "is", "expensive", "cheap", "car"]),
            ("That pen is very cheap", "ते पेन खूप स्वस्त आहे.", ["That", "pen", "is", "very", "cheap", "expensive"]),
            ("I want five apples", "मला पाच सफरचंद पाहिजेत.", ["I", "want", "five", "apples", "four", "rupees"]),
            ("The shop is open", "दुकान उघडे आहे.", ["The", "shop", "is", "open", "closed", "house"]),
            ("Total is fifty rupees", "एकूण पन्नास रुपये झाले.", ["Total", "is", "fifty", "rupees", "hundred", "costs"])
        ],
        "dialogue": {
            "name": "Shopkeeper",
            "prompt": "How much tea do you want?",
            "translation": "तुम्हाला किती चहा पाहिजे?",
            "options": [
                {"text": "One cup of hot tea, please.", "isCorrect": True},
                {"text": "She is my sister.", "isCorrect": False}
            ]
        },
        "speeches": ["Two cups of tea, please", "How much does it cost?", "It costs ten rupees"],
        "karaoke_story": ("I go to the shop and buy two books. The total is one hundred rupees.", "मी दुकानात जातो आणि दोन पुस्तके खरेदी करतो. एकूण शंभर रुपये झाले.")
    },
    # Unit 6
    {
        "num": 6,
        "title": "Home, Rooms & Prepositions",
        "desc": "घर, खोल्या आणि स्थलदर्शक शब्द",
        "color": "#EC4899",
        "words": [
            ("room", "खोली"), ("kitchen", "स्वयंपाकघर"), ("bedroom", "शयनकक्ष"), ("table", "टेबल"),
            ("chair", "खुर्ची"), ("bed", "पलंग"), ("door", "दरवाजा"), ("window", "खिडकी"),
            ("in", "आत / मध्ये"), ("on", "वर"), ("under", "खाली"), ("behind", "मागे"),
            ("where", "कुठे"), ("key", "चावी"), ("phone", "फोन"), ("bag", "बॅग / पिशवी")
        ],
        "sentences": [
            ("Where is my bag?", "माझी बॅग कुठे आहे?", ["Where", "is", "my", "bag?", "chair", "table"]),
            ("The phone is on the table", "फोन टेबलावर आहे.", ["The", "phone", "is", "on", "the", "table", "chair"]),
            ("The cat is under the chair", "मांजर खुर्चीखाली आहे.", ["The", "cat", "is", "under", "the", "chair", "table"]),
            ("My keys are in the bag", "माझ्या चाव्या बॅगेत आहेत.", ["My", "keys", "are", "in", "the", "bag", "room"]),
            ("The bedroom is very clean", "बेडरूम खूप स्वच्छ आहे.", ["The", "bedroom", "is", "very", "clean", "dirty"]),
            ("Open the door, please", "कृपया दरवाजा उघडा.", ["Open", "the", "door,", "please", "Close", "window"]),
            ("Close the window", "खिडकी बंद करा.", ["Close", "the", "window", "Open", "door", "table"]),
            ("He is in the kitchen", "तो स्वयंपाकघरात आहे.", ["He", "is", "in", "the", "kitchen", "bedroom", "She"])
        ],
        "dialogue": {
            "name": "Amit",
            "prompt": "Where are my keys?",
            "translation": "माझ्या चाव्या कुठे आहेत?",
            "options": [
                {"text": "Your keys are on the table.", "isCorrect": True},
                {"text": "I drink water.", "isCorrect": False}
            ]
        },
        "speeches": ["The phone is on the table", "Where is my key?", "Open the door, please"],
        "karaoke_story": ("Welcome to my house. The kitchen is clean and my books are on the table.", "माझ्या घरात आपले स्वागत आहे. स्वयंपाकघर स्वच्छ आहे आणि माझी पुस्तके टेबलावर आहेत.")
    },
    # Unit 7
    {
        "num": 7,
        "title": "Daily Routines & Clock Time",
        "desc": "दिनक्रम आणि घड्याळाची वेळ",
        "color": "#F59E0B",
        "words": [
            ("morning", "सकाळ"), ("afternoon", "दुपार"), ("evening", "संध्याकाळ"), ("night", "रात्र"),
            ("wake up", "उठणे"), ("sleep", "झोपणे"), ("breakfast", "नाश्ता"), ("lunch", "दुपारचे जेवण"),
            ("dinner", "रात्रीचे जेवण"), ("clock", "घड्याळ"), ("time", "वेळ"), ("o'clock", "वाजले"),
            ("early", "लवकर"), ("late", "उशीर"), ("always", "नेहमी"), ("never", "कधीच नाही")
        ],
        "sentences": [
            ("What time is it?", "किती वाजले आहेत?", ["What", "time", "is", "it?", "clock", "hour"]),
            ("It is seven o'clock", "सात वाजले आहेत.", ["It", "is", "seven", "o'clock", "eight", "nine"]),
            ("I wake up early", "मी लवकर उठतो.", ["I", "wake", "up", "early", "late", "sleep"]) ,
            ("I eat breakfast at eight", "मी आठ वाजता नाश्ता करतो.", ["I", "eat", "breakfast", "at", "eight", "dinner"]),
            ("Good morning, friends!", "शुभ प्रभात, मित्रांनो!", ["Good", "morning,", "friends!", "night", "afternoon"]),
            ("Good night, see you tomorrow", "शुभ रात्री, उद्या भेटू.", ["Good", "night,", "see", "you", "tomorrow", "today"]),
            ("We eat dinner together", "आम्ही एकत्र रात्रीचे जेवण करतो.", ["We", "eat", "dinner", "together", "lunch", "They"]),
            ("He is always on time", "तो नेहमी वेळेवर असतो.", ["He", "is", "always", "on", "time", "never", "late"])
        ],
        "dialogue": {
            "name": "Rahul",
            "prompt": "What time do you wake up?",
            "translation": "तू किती वाजता उठतोस?",
            "options": [
                {"text": "I wake up at six o'clock.", "isCorrect": True},
                {"text": "Hot tea is delicious.", "isCorrect": False}
            ]
        },
        "speeches": ["What time is it?", "Good morning, friends!", "I wake up early"],
        "karaoke_story": ("Every day I wake up at six. I eat breakfast and leave for work at eight.", "दररोज मी सहा वाजता उठतो. मी नाश्ता करतो आणि आठ वाजता कामासाठी निघतो.")
    },
    # Unit 8
    {
        "num": 8,
        "title": "Colors, Clothes & Appearance",
        "desc": "रंग, कपडे आणि व्यक्तिमत्त्व",
        "color": "#E11D48",
        "words": [
            ("red", "लाल"), ("blue", "निळा"), ("green", "हिरवा"), ("white", "पांढरा"),
            ("black", "काळा"), ("yellow", "पिवळा"), ("shirt", "शर्ट"), ("pants", "पॅन्ट"),
            ("shoes", "बूट"), ("dress", "ड्रेस"), ("hat", "टोपी"), ("wear", "घालणे"),
            ("look", "दिसणे"), ("beautiful", "सुंदर"), ("color", "रंग"), ("favorite", "आवडता")
        ],
        "sentences": [
            ("My shirt is blue", "माझा शर्ट निळा आहे.", ["My", "shirt", "is", "blue", "red", "pants"]),
            ("She wears a red dress", "ती लाल ड्रेस घालते.", ["She", "wears", "a", "red", "dress", "blue"]),
            ("These black shoes are new", "हे काळे बूट नवीन आहेत.", ["These", "black", "shoes", "are", "new", "old"]),
            ("I like the green color", "मला हिरवा रंग आवडतो.", ["I", "like", "the", "green", "color", "red"]),
            ("You look very beautiful today", "तू आज खूप सुंदर दिसत आहेस.", ["You", "look", "very", "beautiful", "today", "smart"]),
            ("His white hat is clean", "त्याची पांढरी टोपी स्वच्छ आहे.", ["His", "white", "hat", "is", "clean", "black"]),
            ("What is your favorite color?", "तुझा आवडता रंग कोणता आहे?", ["What", "is", "your", "favorite", "color?", "dress"]),
            ("Blue is my favorite color", "निळा हा माझा आवडता रंग आहे.", ["Blue", "is", "my", "favorite", "color", "Red"])
        ],
        "dialogue": {
            "name": "Neha",
            "prompt": "Do you like my new red shirt?",
            "translation": "तुला माझा नवीन लाल शर्ट आवडला का?",
            "options": [
                {"text": "Yes, it looks very beautiful!", "isCorrect": True},
                {"text": "Seven o'clock.", "isCorrect": False}
            ]
        },
        "speeches": ["My shirt is blue", "You look very beautiful", "Blue is my favorite color"],
        "karaoke_story": ("Today I wear my favorite blue shirt. My new black shoes are very comfortable.", "आज मी माझा आवडता निळा शर्ट घातला आहे. माझे नवीन काळे बूट खूप आरामदायक आहेत.")
    },
    # Unit 9
    {
        "num": 9,
        "title": "Expressing Needs, Likes & Courtesies",
        "desc": "गरजा, पसंती आणि शिष्टाचार",
        "color": "#10B981",
        "words": [
            ("need", "गरज असणे"), ("want", "पाहिजे असणे"), ("help", "मदत"), ("please", "कृपया"),
            ("thank you", "धन्यवाद"), ("welcome", "स्वागत"), ("sorry", "माफ करा"), ("excuse me", "क्षमस्व"),
            ("problem", "अडचण"), ("sure", "नक्कीच"), ("course", "अर्थात"), ("sir", "सर"),
            ("madam", "मॅडम"), ("pen", "पेन"), ("water", "पाणी"), ("bill", "बिल")
        ],
        "sentences": [
            ("Excuse me, can you help me?", "क्षमस्व, तुम्ही मला मदत करू शकता का?", ["Excuse", "me,", "can", "you", "help", "me?", "want"]),
            ("I need a pen, please", "मला कृपया पेन पाहिजे.", ["I", "need", "a", "pen,", "please", "book"]),
            ("Thank you very much", "खूप खूप धन्यवाद.", ["Thank", "you", "very", "much", "welcome", "please"]),
            ("You are welcome", "तुमचे स्वागत आहे.", ["You", "are", "welcome", "sorry", "sir", "madam"]),
            ("I am very sorry", "मला खूप वाईट वाटते.", ["I", "am", "very", "sorry", "welcome", "please"]),
            ("You are welcome, sir", "आपले स्वागत आहे, सर.", ["You", "are", "welcome,", "sir", "madam", "sorry"]),
            ("No problem at all", "काहीच हरकत नाही.", ["No", "problem", "at", "all", "yes", "need"]),
            ("Tea? Yes, please!", "चहा? हो, कृपया!", ["Tea?", "Yes,", "please!", "No,", "thanks!"])
        ],
        "dialogue": {
            "name": "Tourist",
            "prompt": "Can you help me, please?",
            "translation": "तुम्ही मला मदत करू शकता का, कृपया?",
            "options": [
                {"text": "Yes, of course!", "isCorrect": True},
                {"text": "My dress is red.", "isCorrect": False}
            ]
        },
        "speeches": ["Excuse me, can you help me?", "Thank you very much", "I need a pen"],
        "karaoke_story": ("Excuse me, can you help me? I need a pen, please. Thank you very much!", "क्षमस्व, तुम्ही मला मदत करू शकता का? मला कृपया पेन पाहिजे. खूप खूप धन्यवाद!")
    },
    # Unit 10
    {
        "num": 10,
        "title": "Asking Questions & Directions",
        "desc": "प्रश्न विचारणे आणि दिशानिर्देश",
        "color": "#3B82F6",
        "words": [
            ("what", "काय"), ("where", "कुठे"), ("who", "कोण"), ("when", "कधी"),
            ("why", "का"), ("how", "कसे"), ("left", "डावीकडे"), ("right", "उजवीकडे"),
            ("straight", "सरळ"), ("near", "जवळ"), ("far", "लांब"), ("stop", "थांबणे"),
            ("turn", "वळणे"), ("road", "रस्ता"), ("station", "स्टेशन"), ("map", "नकाशा")
        ],
        "sentences": [
            ("Where is the station?", "स्टेशन कुठे आहे?", ["Where", "is", "the", "station?", "airport", "market"]),
            ("Turn left at the road", "रस्त्यावर डावीकडे वळा.", ["Turn", "left", "at", "the", "road", "right"]),
            ("Turn right and go straight", "उजवीकडे वळा आणि सरळ जा.", ["Turn", "right", "and", "go", "straight", "left"]),
            ("Stop here, please", "कृपया येथे थांबा.", ["Stop", "here,", "please", "there", "go"]),
            ("Is it near or far?", "ते जवळ आहे की लांब?", ["Is", "it", "near", "or", "far?", "here"]),
            ("It is far from here", "ते येथून लांब आहे.", ["It", "is", "far", "from", "here", "near", "there"]),
            ("How are you today?", "आज तुम्ही कसे आहात?", ["How", "are", "you", "today?", "Who", "Where"]),
            ("Which way to the market?", "बाजाराचा रस्ता कोणता आहे?", ["Which", "way", "to", "the", "market?", "road"])
        ],
        "dialogue": {
            "name": "Pedestrian",
            "prompt": "Where is the train station?",
            "translation": "रेल्वे स्टेशन कुठे आहे?",
            "options": [
                {"text": "Go straight and turn left.", "isCorrect": True},
                {"text": "I eat breakfast at 8.", "isCorrect": False}
            ]
        },
        "speeches": ["Where is the station?", "Go straight and turn left", "Turn right, please"],
        "karaoke_story": ("Where is the train station? Go straight and turn left at the road.", "रेल्वे स्टेशन कुठे आहे? सरळ जा आणि रस्त्यावर डावीकडे वळा.")
    },
    # Unit 11
    {
        "num": 11,
        "title": "Places in the City & Transportation",
        "desc": "शहरातील ठिकाणे आणि प्रवास",
        "color": "#8B5CF6",
        "words": [
            ("bus", "बस"), ("train", "ट्रेन"), ("auto", "रिक्षा"), ("taxi", "टॅक्सी"),
            ("station", "स्टेशन"), ("airport", "विमानतळ"), ("market", "बाजार"), ("hospital", "रुग्णालय"),
            ("bank", "बँक"), ("hotel", "हॉटेल"), ("ticket", "तिकीट"), ("price", "किंमत"),
            ("seat", "सीट"), ("driver", "चालक"), ("city", "शहर"), ("how much", "किती")
        ],
        "sentences": [
            ("I go to work by bus", "मी बसने कामावर जातो.", ["I", "go", "to", "work", "by", "bus", "train"]),
            ("The train is at the station", "ट्रेन स्टेशनवर आहे.", ["The", "train", "is", "at", "the", "station", "bus"]),
            ("I am going to the market", "मी बाजारात जात आहे.", ["I", "am", "going", "to", "the", "market", "bank"]),
            ("The bank is near the hospital", "बँक हॉस्पिटलच्या जवळ आहे.", ["The", "bank", "is", "near", "the", "hospital", "hotel"]),
            ("One ticket to Pune, please", "कृपया पुण्याचे एक तिकीट द्या.", ["One", "ticket", "to", "Pune,", "please", "two"]),
            ("How much is the ticket?", "तिकीट कितीचे आहे?", ["How", "much", "is", "the", "ticket?", "price"]),
            ("This is my seat", "ही माझी सीट आहे.", ["This", "is", "my", "seat", "your", "bag"]),
            ("Stop at the hotel, please", "कृपया हॉटेलजवळ थांबा.", ["Stop", "at", "the", "hotel,", "please", "bank"])
        ],
        "dialogue": {
            "name": "Auto Driver",
            "prompt": "Where do you want to go?",
            "translation": "तुम्हाला कुठे जायचे आहे?",
            "options": [
                {"text": "To the market, please.", "isCorrect": True},
                {"text": "My father is tall.", "isCorrect": False}
            ]
        },
        "speeches": ["How much is the ticket?", "One ticket, please", "Stop at the station"],
        "karaoke_story": ("I go to the market by auto. One ticket to the city center, please.", "मी रिक्षाने बाजारात जातो. शहराच्या मध्यवर्ती भागासाठी एक तिकीट द्या, कृपया.")
    },
    # Unit 12
    {
        "num": 12,
        "title": "Feelings, Physical Health & Section 1 Graduation",
        "desc": "भावना, आरोग्य आणि पदवीदान 🏆",
        "color": "#06B6D4",
        "words": [
            ("happy", "आनंदी"), ("sad", "दुःखी"), ("tired", "थकलेला"), ("hungry", "भुकेलेला"),
            ("thirsty", "तहान लागलेला"), ("fine", "ठीक"), ("well", "छान"), ("sick", "आजारी"),
            ("headache", "डोकेदुखी"), ("fever", "ताप"), ("doctor", "डॉक्टर"), ("medicine", "औषध"),
            ("rest", "विश्रांती"), ("feel", "वाटणे"), ("ready", "तयार"), ("graduate", "पदवीधर")
        ],
        "sentences": [
            ("I am very happy today", "मी आज खूप आनंदी आहे.", ["I", "am", "very", "happy", "today", "sad"]),
            ("I am hungry and tired", "मला भूक लागली आहे आणि मी थकलो आहे.", ["I", "am", "hungry", "and", "tired", "fine"]),
            ("Are you thirsty?", "तुम्हाला तहान लागली आहे का?", ["Are", "you", "thirsty?", "hungry", "fine"]),
            ("I have a bad headache", "माझे डोके खूप दुखत आहे.", ["I", "have", "a", "bad", "headache", "fever"]),
            ("Drink water and take rest", "पाणी प्या आणि विश्रांती घ्या.", ["Drink", "water", "and", "take", "rest", "medicine"]),
            ("The doctor gives medicine", "डॉक्टर औषध देतात.", ["The", "doctor", "gives", "medicine", "water", "rest"]),
            ("I feel much better now", "मला आता बरे वाटत आहे.", ["I", "feel", "much", "better", "now", "sick"]),
            ("I am ready to graduate!", "मी पदवीसाठी तयार आहे!", ["I", "am", "ready", "to", "graduate!", "happy", "rest"])
        ],
        "dialogue": {
            "name": "Doctor",
            "prompt": "How do you feel today?",
            "translation": "आज तुम्हाला कसे वाटत आहे?",
            "options": [
                {"text": "I feel very well, thank you!", "isCorrect": True},
                {"text": "Train to Pune.", "isCorrect": False}
            ]
        },
        "speeches": ["I am very happy today", "I feel much better now", "I am ready to graduate!"],
        "karaoke_story": ("Congratulations! You have completed Section 1 Rookie in English. You speak with confidence and are ready for Section 2!", "हार्दिक अभिनंदन! तुम्ही इंग्रजीतील सेक्शन १ रूकी यशस्वीरीत्या पूर्ण केले आहे. तुम्ही आत्मविश्वासाने बोलता आणि सेक्शन २ साठी सज्ज आहात!")
    }
]

def generate_curriculum():
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
                pic_word=pic_w[0],
                pic_trans_mr=pic_w[1],
                pic_distractors=pic_dist,
                match_pairs=match_subset,
                sent_prompt_mr=core_sent[1],
                sent_target_en=core_sent[0],
                sent_tokens=core_sent[2],
                cloze_sentence=cloze_info[0],
                cloze_blank=cloze_info[1],
                cloze_trans_mr=cloze_info[2],
                cloze_options=cloze_info[3],
                listen_target_en=listen_info[0],
                listen_tokens=listen_info[1],
                listen_spoken_en=select_info[0],
                listen_correct_mr=select_info[1],
                listen_distractor_mr=select_info[2],
                type_target_en=type_w_clean[0],
                type_trans_mr=type_w_clean[1],
                type_hint=f"संकेत: {type_w_clean[0][0].upper()} ने सुरू होते",
                partner_name=dlg_info["name"],
                partner_msg_en=dlg_info["prompt"],
                partner_msg_mr=dlg_info["translation"],
                reply_correct=dlg_info["options"][0]["text"],
                reply_wrong=dlg_info["options"][1]["text"],
                sprechen_en=speech_info[0],
                sprechen_mr=speech_info[1],
                karaoke_story_en=karaoke_info[0],
                karaoke_story_mr=karaoke_info[1]
            )
            return build_lesson(l_idx, l_num, u_title, sub_title, sub_desc, node_type, xp, pearls, stages)

        # ---------------------------------------------------------------------
        # L1: Lesson 1 - Intro Nouns / Core Vocabulary (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            0, 1, "Lesson 1", f"{u_desc}: मुख्य शब्द",
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
            karaoke_info=(f"{sents[0][0]}. {words[0][0].capitalize()} is good.", f"{sents[0][1]} {words[0][1]} चांगले आहे.")
        ))

        # ---------------------------------------------------------------------
        # L2: Lesson 2 - Expansion & Sentence Syntax (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            1, 2, "Lesson 2", f"{u_desc}: वाक्य रचना",
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
            karaoke_info=(f"{sents[1][0]}. It is very good.", f"{sents[1][1]} हे खूप छान आहे.")
        ))

        # ---------------------------------------------------------------------
        # L3: Lesson 3 - Compounds & Conjunctions (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            2, 3, "Lesson 3", f"{u_desc}: संयुक्त वाक्ये",
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
            karaoke_info=(f"{sents[2][0]}. We like this.", f"{sents[2][1]} आम्हाला हे आवडते.")
        ))

        # ---------------------------------------------------------------------
        # L4: Lesson 4 - Ear Training & Listening Immersion (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            3, 4, "Lesson 4", f"{u_desc}: श्रवण सराव (Ear Training)",
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
            karaoke_info=(f"{sents[3][0]}. Listen and speak every day.", f"{sents[3][1]} दररोज ऐका आणि बोला.")
        ))

        # ---------------------------------------------------------------------
        # L5: Lesson 5 - Quality & Context Mastery (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            4, 5, "Lesson 5", f"{u_desc}: गुणविशेष आणि प्रकार",
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
            karaoke_info=(f"{sents[4][0]}. You are doing very well.", f"{sents[4][1]} तुम्ही खूप छान करत आहात.")
        ))

        # ---------------------------------------------------------------------
        # L6: Treasure Chest 1 (Milestone Reward Node - 0 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_chest(5, 6, u_title, 1, 15, 25))

        # ---------------------------------------------------------------------
        # L7: Lesson 7 - Post-Chest Compounds & Usage (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            6, 7, "Lesson 7", f"{u_desc}: संमिश्र सराव",
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
            karaoke_info=(f"{sents[5][0]}. Practice makes you perfect.", f"{sents[5][1]} सरावाने सर्व सोपे होते.")
        ))

        # ---------------------------------------------------------------------
        # L8: Lesson 8 - Advanced Sentences & Context (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            7, 8, "Lesson 8", f"{u_desc}: प्रगत वाक्यरचना",
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
            karaoke_info=(f"{sents[6][0]}. Everything is in order.", f"{sents[6][1]} सर्व काही व्यवस्थित आहे.")
        ))

        # ---------------------------------------------------------------------
        # L9: Lesson 9 - Oral Fluency & Speech Lab (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            8, 9, "Lesson 9", f"{u_desc}: संभाषण प्रयोगशाळा (Speech Lab)",
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
            karaoke_info=(f"{sents[7][0]}. Speak clearly and with confidence.", f"{sents[7][1]} स्पष्ट आणि आत्मविश्वासाने बोला.")
        ))

        # ---------------------------------------------------------------------
        # L10: Lesson 10 - Grand Conversational Synthesis (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            9, 10, "Lesson 10", f"{u_desc}: संवाद प्रभुत्व (Dialogue Mastery)",
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

        # ---------------------------------------------------------------------
        # L11: Treasure Chest 2 (Milestone Reward Node - 0 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_chest(10, 11, u_title, 2, 20, 35))

        # ---------------------------------------------------------------------
        # L12: Unit Milestone Exam (Boss Challenge - 10 Stages)
        # ---------------------------------------------------------------------
        exam_matches = [words[0], words[4], words[8], words[12]]
        lessons.append(make_interactive_lesson(
            11, 12, f"Unit {u_num} Milestone Exam", f"{u_desc}: संपूर्ण युनिट परीक्षा (Mastery Challenge)",
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
    output_dir = os.path.join(root_dir, "syllabus", "section_1_marathi")
    os.makedirs(output_dir, exist_ok=True)

    units = generate_curriculum()
    unit_slugs = [
        "unit_01_objects_possessives",
        "unit_02_food_temperatures",
        "unit_03_family_identity",
        "unit_04_daily_verbs",
        "unit_05_numbers_plurals",
        "unit_06_home_prepositions",
        "unit_07_routines_time",
        "unit_08_colors_clothes",
        "unit_09_needs_courtesies",
        "unit_10_questions_directions",
        "unit_11_city_transit",
        "unit_12_feelings_graduation"
    ]

    total_lessons = 0
    total_stages = 0
    total_interactive_lessons = 0

    print("🚀 Generating Section 1 English for Marathi Speakers (en_mr_a1)...")

    # Write each unit as an isolated file for bulk upload
    for idx, unit in enumerate(units):
        filename = f"{unit_slugs[idx]}.json"
        file_path = os.path.join(output_dir, filename)

        unit_wrapper = {
            "courseTitle": "English A1 Comprehensive Curriculum (For Marathi Speakers)",
            "learningLanguage": "en",
            "nativeLanguage": "mr",
            "level": "A1",
            "unitNumber": unit["unitNumber"],
            "unitTitle": unit["unitTitle"],
            "unitDescription": unit["unitDescription"],
            "accentColor": unit["accentColor"],
            "lessonsCount": len(unit["lessons"]),
            "lessons": unit["lessons"]
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(unit_wrapper, f, ensure_ascii=False, indent=2)

        total_lessons += len(unit["lessons"])
        for l in unit["lessons"]:
            st_len = len(l["stages"])
            total_stages += st_len
            if st_len > 0:
                total_interactive_lessons += 1

        print(f"  ✅ Created Unit {unit['unitNumber']:02d}: {filename} (12 lessons, {len(unit['lessons']) * 10 - 20} interactive stages)")

    # Write consolidated Section 1 file
    consolidated_path = os.path.join(root_dir, "syllabus", "section_1_english_marathi.json")
    consolidated_wrapper = {
        "courseTitle": "English A1 Comprehensive Curriculum (For Marathi Speakers)",
        "learningLanguage": "en",
        "nativeLanguage": "mr",
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
                "lessonsCount": len(u["lessons"]),
                "lessonsData": u["lessons"]
            }
            for u in units
        ]
    }

    with open(consolidated_path, "w", encoding="utf-8") as f:
        json.dump(consolidated_wrapper, f, ensure_ascii=False, indent=2)

    print(f"\n📦 Consolidated dataset created: {consolidated_path}")
    print(f"📊 Summary:")
    print(f"  • Total Units: {len(units)}")
    print(f"  • Total Lessons/Nodes: {total_lessons}")
    print(f"  • Total Interactive Lessons (10 per unit + 1 exam): {total_interactive_lessons}")
    print(f"  • Total Interactive Stages (10 per interactive lesson): {total_stages}")

if __name__ == "__main__":
    main()
