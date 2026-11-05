#!/usr/bin/env python3
"""
Generate Complete Section 1 Curriculum for English Learning from Hindi (en_hi_a1)
Total: 12 Units x 12 Lessons = 144 Lessons/Nodes.
Pedagogical Model: Scaffolded incremental micro-steps (based on Duolingo reference lessons).

Interactive Schema:
- 10 Interactive Lessons per unit (L1-L5, L7-L10) + 1 Milestone Exam (L12) = 11 lessons per unit.
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
    pic_word, pic_trans, pic_distractors,
    # 2. Word Match (4 pairs)
    match_pairs,
    # 3. Sentence Builder
    sent_prompt_hi, sent_target_en, sent_tokens,
    # 4. Cloze
    cloze_sentence, cloze_blank, cloze_trans_hi, cloze_options,
    # 5. Listen Tap
    listen_target_en, listen_tokens,
    # 6. Listen Select
    listen_spoken_en, listen_correct_hi, listen_distractor_hi,
    # 7. Type Word
    type_target_en, type_trans_hi, type_hint="",
    # 8. Dialogue
    partner_name="Anna", partner_msg_en="Hello!", partner_msg_hi="नमस्ते!", reply_correct="Hello!", reply_wrong="Water, please.",
    # 9. Sprechen
    sprechen_en="Hello!", sprechen_hi="नमस्ते!",
    # 10. Karaoke
    karaoke_story_en="Hello! Welcome to English.", karaoke_story_hi="नमस्ते! अंग्रेज़ी में आपका स्वागत है।"
):
    return [
        # 1. Picture Vocabulary Card (Unticked / enabled: False so user can upload custom images)
        {
            "type": "picture_select",
            "enabled": False,
            "title": "चित्र चुनिए",
            "prompt": f"'{pic_trans}' के लिए सही चित्र चुनें:",
            "targetWord": pic_word,
            "translation": pic_trans,
            "options": [
                {
                    "id": f"u{unit_num}_l{lesson_num}_p1",
                    "text": f"{pic_word} ({pic_trans})",
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
            "title": "सही शब्द जोड़ियों का मिलान करें",
            "pairs": [{"target": p[0], "native": p[1]} for p in match_pairs]
        },
        # 3. Sentence Builder
        {
            "type": "sentence_builder",
            "title": "अंग्रेज़ी वाक्य बनाइए",
            "prompt": sent_prompt_hi,
            "targetSentence": sent_target_en,
            "tokens": sent_tokens
        },
        # 4. Fill-in-the-Blank (Cloze Test)
        {
            "type": "cloze_test",
            "title": "रिक्त स्थान भरें",
            "sentence": cloze_sentence,
            "blank": cloze_blank,
            "translation": cloze_trans_hi,
            "options": cloze_options
        },
        # 5. Listen & Tap (Echo)
        {
            "type": "listen_tap",
            "title": "सुनिए और सही शब्दों पर टैप करें",
            "targetSentence": listen_target_en,
            "tokens": listen_tokens,
            "audioUrl": ""
        },
        # 6. Listen & Select MCQ
        {
            "type": "listen_select",
            "title": "सुनिए और सही अर्थ चुनिए",
            "spokenGerman": listen_spoken_en,
            "question": "इस वाक्य का सही हिंदी अर्थ क्या है?",
            "prompt": "इस वाक्य का सही हिंदी अर्थ क्या है?",
            "options": [
                {"text": listen_correct_hi, "isCorrect": True},
                {"text": listen_distractor_hi, "isCorrect": False}
            ],
            "correctOption": listen_correct_hi,
            "audioUrl": ""
        },
        # 7. Type Word (Spelling Entry)
        {
            "type": "type_word",
            "title": "स्पेलिंग टाइप करें",
            "prompt": f"'{type_trans_hi}' के लिए अंग्रेज़ी शब्द टाइप करें:",
            "target": type_target_en,
            "translation": type_trans_hi,
            "hint": type_hint if type_hint else f"संकेत: {type_target_en[0].upper()} से शुरू होता है",
            "audioUrl": ""
        },
        # 8. Dialogue Messenger
        {
            "type": "dialogue_bubble",
            "title": "बातचीत पूरी करें",
            "partnerName": partner_name,
            "partnerAvatar": "dolphina",
            "partnerMessage": partner_msg_en,
            "translation": partner_msg_hi,
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
            "title": "बोलकर अभ्यास करें",
            "prompt": sprechen_en,
            "translation": sprechen_hi,
            "minAccuracy": 75,
            "audioUrl": ""
        },
        # 10. Karaoke Synced Story / Fluency
        {
            "type": "karaoke",
            "title": "लयबद्ध पाठन (Karaoke Reading)",
            "storyText": karaoke_story_en,
            "translationText": karaoke_story_hi,
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
        "desc": "बुनियादी वस्तुएं और संबंध",
        "color": "#1CB0F6",
        "words": [
            ("house", "घर"), ("car", "गाड़ी"), ("my", "मेरा / मेरी"), ("your", "तुम्हारा / तुम्हारी"),
            ("big", "बड़ा / बड़ी"), ("small", "छोटा / छोटी"), ("is", "है"), ("clean", "साफ़"),
            ("dirty", "गंदा / गंदी"), ("new", "नया / नई"), ("old", "पुराना / पुरानी"), ("name", "नाम"),
            ("this", "यह"), ("that", "वह"), ("here", "यहाँ"), ("there", "वहाँ")
        ],
        "sentences": [
            ("my car", "मेरी गाड़ी", ["my", "car", "house", "your", "is"]),
            ("my house is big", "मेरा घर बड़ा है।", ["my", "house", "is", "big", "small", "car"]),
            ("your car is small", "तुम्हारी गाड़ी छोटी है।", ["your", "car", "is", "small", "big", "house"]),
            ("his house is clean", "उसका घर साफ़ है।", ["his", "house", "is", "clean", "dirty", "my"]),
            ("my car is very clean", "मेरी गाड़ी बहुत साफ़ है।", ["my", "car", "is", "very", "clean", "house"]),
            ("this is my car", "यह मेरी गाड़ी है।", ["this", "is", "my", "car", "that", "house"]),
            ("that is your house", "वह तुम्हारा घर है।", ["that", "is", "your", "house", "this", "car"]),
            ("my car is new and clean", "मेरी गाड़ी नई और साफ़ है।", ["my", "car", "is", "new", "and", "clean", "old"])
        ],
        "dialogue": {
            "name": "Anna",
            "prompt": "Is this your car?",
            "translation": "क्या यह तुम्हारी गाड़ी है?",
            "options": [
                {"text": "Yes, this is my car.", "isCorrect": True},
                {"text": "Cold tea, please.", "isCorrect": False}
            ]
        },
        "speeches": ["My car is big", "This is my house", "My car is new and clean"],
        "karaoke_story": ("This is my car. My car is very clean and new.", "यह मेरी गाड़ी है। मेरी गाड़ी बहुत साफ़ और नई है।")
    },
    # Unit 2
    {
        "num": 2,
        "title": "Food, Drinks & Temperatures",
        "desc": "खान-पान और तापमान",
        "color": "#58CC02",
        "words": [
            ("water", "पानी"), ("tea", "चाय"), ("coffee", "कॉफ़ी"), ("milk", "दूध"),
            ("cold", "ठंडा"), ("hot", "गरम"), ("sweet", "मीठा"), ("and", "और"),
            ("bread", "ब्रेड"), ("sugar", "चीनी"), ("food", "खाना"), ("tasty", "स्वादिष्ट"),
            ("spicy", "तीखा"), ("fresh", "ताज़ा"), ("please", "कृपया"), ("thank you", "धन्यवाद")
        ],
        "sentences": [
            ("cold water", "ठंडा पानी", ["cold", "water", "hot", "tea"]),
            ("hot tea", "गरम चाय", ["hot", "tea", "cold", "water"]),
            ("tea and water", "चाय और पानी", ["tea", "and", "water", "coffee", "milk"]),
            ("hot coffee and cold milk", "गरम कॉफ़ी और ठंडा दूध", ["hot", "coffee", "and", "cold", "milk", "tea"]),
            ("This food is hot", "यह खाना गरम है।", ["This", "food", "is", "hot", "cold", "tea"]),
            ("Tea is sweet and tasty", "चाय मीठी और स्वादिष्ट है।", ["Tea", "is", "sweet", "and", "tasty", "spicy"]),
            ("Water, please", "कृपया पानी दीजिए।", ["Water,", "please", "Thank", "you", "tea"]),
            ("I want hot tea", "मुझे गरम चाय चाहिए।", ["I", "want", "hot", "tea", "cold", "water"])
        ],
        "dialogue": {
            "name": "Waiter",
            "prompt": "Tea or coffee?",
            "translation": "चाय या कॉफ़ी?",
            "options": [
                {"text": "Hot tea, please.", "isCorrect": True},
                {"text": "My house is big.", "isCorrect": False}
            ]
        },
        "speeches": ["Hot tea and cold water", "Water, please", "Tea is sweet"],
        "karaoke_story": ("I drink hot tea every morning. The food is fresh and tasty.", "मैं हर सुबह गरम चाय पीता हूँ। खाना ताज़ा और स्वादिष्ट है।")
    },
    # Unit 3
    {
        "num": 3,
        "title": "Family, People & Identity",
        "desc": "परिवार, लोग और पहचान",
        "color": "#CE82FF",
        "words": [
            ("father", "पिता"), ("mother", "माँ"), ("brother", "भाई"), ("sister", "बहन"),
            ("friend", "दोस्त"), ("boy", "लड़का"), ("girl", "लड़की"), ("man", "पुरुष"),
            ("woman", "महिला"), ("teacher", "शिक्षक"), ("student", "छात्र"), ("family", "परिवार"),
            ("I", "मैं"), ("you", "तुम / आप"), ("he", "वह"), ("we", "हम")
        ],
        "sentences": [
            ("He is my father", "वह मेरे पिता हैं।", ["He", "is", "my", "father", "She", "mother"]),
            ("She is my mother", "वह मेरी माँ हैं।", ["She", "is", "my", "mother", "He", "sister"]),
            ("I am a student", "मैं एक छात्र हूँ।", ["I", "am", "a", "student", "teacher", "You"]),
            ("You are my friend", "तुम मेरे दोस्त हो।", ["You", "are", "my", "friend", "brother", "We"]),
            ("He is a good teacher", "वह एक अच्छे शिक्षक हैं।", ["He", "is", "a", "good", "teacher", "student"]),
            ("We are friends", "हम दोस्त हैं।", ["We", "are", "friends", "They", "family", "I"]),
            ("She is my sister", "वह मेरी बहन है।", ["She", "is", "my", "sister", "brother", "mother"]),
            ("They are my family", "वे मेरा परिवार हैं।", ["They", "are", "my", "family", "friends", "We"])
        ],
        "dialogue": {
            "name": "Priya",
            "prompt": "Who is he?",
            "translation": "वह कौन है?",
            "options": [
                {"text": "He is my brother.", "isCorrect": True},
                {"text": "Cold water, please.", "isCorrect": False}
            ]
        },
        "speeches": ["He is my father", "I am a student", "You are my friend"],
        "karaoke_story": ("This is my family. She is my mother and he is my brother.", "यह मेरा परिवार है। वह मेरी माँ हैं और वह मेरा भाई है।")
    },
    # Unit 4
    {
        "num": 4,
        "title": "Common Everyday Verbs & SVO",
        "desc": "रोज़मर्रा की क्रियाएं और वाक्य संरचना",
        "color": "#FF9600",
        "words": [
            ("eat", "खाना"), ("drink", "पीना"), ("read", "पढ़ना"), ("write", "लिखना"),
            ("speak", "बोलना"), ("go", "जाना"), ("come", "आना"), ("see", "देखना"),
            ("like", "पसंद करना"), ("work", "काम करना"), ("live", "रहना"), ("book", "किताब"),
            ("apple", "सेब"), ("school", "स्कूल"), ("English", "अंग्रेज़ी"), ("Hindi", "हिंदी")
        ],
        "sentences": [
            ("I eat an apple", "मैं सेब खाता हूँ।", ["I", "eat", "an", "apple", "bread", "drink"]),
            ("I read a book", "मैं किताब पढ़ता हूँ।", ["I", "read", "a", "book", "write", "school"]),
            ("I speak English", "मैं अंग्रेज़ी बोलता हूँ।", ["I", "speak", "English", "Hindi", "read"]),
            ("I go to school", "मैं स्कूल जाता हूँ।", ["I", "go", "to", "school", "home", "work"]),
            ("I like books", "मुझे किताबें पसंद हैं।", ["I", "like", "books", "apples", "tea"]),
            ("She reads English", "वह अंग्रेज़ी पढ़ती है।", ["She", "reads", "English", "speaks", "Hindi"]),
            ("We eat together", "हम साथ में खाते हैं।", ["We", "eat", "together", "drink", "go"]),
            ("I live here", "मैं यहाँ रहता हूँ।", ["I", "live", "here", "work", "there"])
        ],
        "dialogue": {
            "name": "Rahul",
            "prompt": "Do you speak English?",
            "translation": "क्या आप अंग्रेज़ी बोलते हैं?",
            "options": [
                {"text": "Yes, I speak English.", "isCorrect": True},
                {"text": "I am eating bread.", "isCorrect": False}
            ]
        },
        "speeches": ["I speak English", "I read a book every day", "I like apples"],
        "karaoke_story": ("I go to school and read books. I like English very much.", "मैं स्कूल जाता हूँ और किताबें पढ़ता हूँ। मुझे अंग्रेज़ी बहुत पसंद है।")
    },
    # Unit 5
    {
        "num": 5,
        "title": "Numbers, Quantities & Plurals",
        "desc": "संख्याएं, मात्रा और बहुवचन",
        "color": "#FF4B4B",
        "words": [
            ("one", "एक"), ("two", "दो"), ("three", "तीन"), ("four", "चार"),
            ("five", "पाँच"), ("six", "छह"), ("seven", "सात"), ("eight", "आठ"),
            ("nine", "नौ"), ("ten", "दस"), ("pen", "पेन"), ("cup", "कप"),
            ("apples", "सेब"), ("cars", "गाड़ियाँ"), ("houses", "घर"), ("many", "कई")
        ],
        "sentences": [
            ("one pen and two books", "एक पेन और दो किताबें", ["one", "pen", "and", "two", "books", "three"]),
            ("three cars", "तीन गाड़ियाँ", ["three", "cars", "two", "houses", "one"]),
            ("four cups of tea", "चार कप चाय", ["four", "cups", "of", "tea", "coffee"]),
            ("I have five apples", "मेरे पास पाँच सेब हैं।", ["I", "have", "five", "apples", "four", "pens"]),
            ("six big houses", "छह बड़े घर", ["six", "big", "houses", "cars", "small"]),
            ("seven days", "सात दिन", ["seven", "days", "eight", "hours", "ten"]),
            ("ten students", "दस छात्र", ["ten", "students", "nine", "teachers"]),
            ("I have many friends", "मेरे कई दोस्त हैं।", ["I", "have", "many", "friends", "pens", "books"])
        ],
        "dialogue": {
            "name": "Shopkeeper",
            "prompt": "How many pens do you want?",
            "translation": "आपको कितने पेन चाहिए?",
            "options": [
                {"text": "Two pens, please.", "isCorrect": True},
                {"text": "My father is tall.", "isCorrect": False}
            ]
        },
        "speeches": ["I have two pens", "Three cars and five apples", "Ten students are here"],
        "karaoke_story": ("I have one car and two pens. There are ten students in my class.", "मेरे पास एक गाड़ी और दो पेन हैं। मेरी कक्षा में दस छात्र हैं।")
    },
    # Unit 6
    {
        "num": 6,
        "title": "Home, Rooms & Prepositions",
        "desc": "घर, कमरे और स्थान सूचक",
        "color": "#2B70C9",
        "words": [
            ("room", "कमरा"), ("kitchen", "रसोई"), ("table", "मेज़"), ("chair", "कुर्सी"),
            ("bed", "बिस्तर"), ("door", "दरवाज़ा"), ("window", "खिड़की"), ("in", "में"),
            ("on", "पर"), ("under", "नीचे"), ("near", "पास"), ("behind", "पीछे"),
            ("key", "चाबी"), ("phone", "फोन"), ("bag", "बैग"), ("where", "कहाँ")
        ],
        "sentences": [
            ("The book is on the table", "किताब मेज़ पर है।", ["The", "book", "is", "on", "the", "table", "chair"]),
            ("My mother is in the kitchen", "मेरी माँ रसोई में हैं।", ["My", "mother", "is", "in", "the", "kitchen", "room"]),
            ("The cat is under the chair", "बिल्ली कुर्सी के नीचे है।", ["The", "cat", "is", "under", "the", "chair", "table"]),
            ("My phone is on the bed", "मेरा फोन बिस्तर पर है।", ["My", "phone", "is", "on", "the", "bed", "bag"]),
            ("The keys are in the bag", "चाबियाँ बैग में हैं।", ["The", "keys", "are", "in", "the", "bag", "room"]),
            ("The door is open", "दरवाज़ा खुला है।", ["The", "door", "is", "open", "closed", "window"]),
            ("The window is closed", "खिड़की बंद है।", ["The", "window", "is", "closed", "open", "door"]),
            ("The car is near the house", "गाड़ी घर के पास है।", ["The", "car", "is", "near", "the", "house", "behind"])
        ],
        "dialogue": {
            "name": "Sister",
            "prompt": "Where is my phone?",
            "translation": "मेरा फोन कहाँ है?",
            "options": [
                {"text": "It is on the table.", "isCorrect": True},
                {"text": "I drink hot milk.", "isCorrect": False}
            ]
        },
        "speeches": ["The book is on the table", "Where is my phone?", "The door is open"],
        "karaoke_story": ("My phone is on the table. The keys are in my bag near the door.", "मेरा फोन मेज़ पर है। चाबियाँ दरवाजे के पास मेरे बैग में हैं।")
    },
    # Unit 7
    {
        "num": 7,
        "title": "Daily Routines & Time",
        "desc": "दैनिक दिनचर्या और समय",
        "color": "#10B981",
        "words": [
            ("morning", "सुबह"), ("evening", "शाम"), ("night", "रात"), ("time", "समय"),
            ("clock", "घड़ी"), ("hour", "घंटा"), ("wake up", "उठना"), ("sleep", "सोना"),
            ("breakfast", "नाश्ता"), ("lunch", "दोपहर का खाना"), ("dinner", "रात का खाना"), ("today", "आज"),
            ("tomorrow", "कल"), ("early", "जल्दी"), ("late", "देर से"), ("always", "हमेशा")
        ],
        "sentences": [
            ("Good morning", "शुभ प्रभात", ["Good", "morning", "evening", "night"]),
            ("I wake up early", "मैं जल्दी उठता हूँ।", ["I", "wake", "up", "early", "late", "sleep"]),
            ("I eat breakfast at 8", "मैं 8 बजे नाश्ता करता हूँ।", ["I", "eat", "breakfast", "at", "8", "lunch"]),
            ("He sleeps late at night", "वह रात में देर से सोता है।", ["He", "sleeps", "late", "at", "night", "early"]),
            ("What time is it?", "कितने बजे हैं?", ["What", "time", "is", "it?", "clock", "hour"]),
            ("I eat lunch in the afternoon", "मैं दोपहर में खाना खाता हूँ।", ["I", "eat", "lunch", "in", "the", "afternoon"]),
            ("I work today", "मैं आज काम करता हूँ।", ["I", "work", "today", "tomorrow", "always"]),
            ("School is closed tomorrow", "कल स्कूल बंद है।", ["School", "is", "closed", "tomorrow", "today", "open"])
        ],
        "dialogue": {
            "name": "Mother",
            "prompt": "Did you eat breakfast?",
            "translation": "क्या तुमने नाश्ता किया?",
            "options": [
                {"text": "Yes, I ate breakfast.", "isCorrect": True},
                {"text": "The table is blue.", "isCorrect": False}
            ]
        },
        "speeches": ["Good morning, how are you?", "What time is it?", "I wake up early"],
        "karaoke_story": ("I wake up early in the morning and eat breakfast at eight o'clock.", "मैं सुबह जल्दी उठता हूँ और आठ बजे नाश्ता करता हूँ।")
    },
    # Unit 8
    {
        "num": 8,
        "title": "Colors, Clothes & Appearance",
        "desc": "रंग, कपड़े और रूप-रंग",
        "color": "#EC4899",
        "words": [
            ("red", "लाल"), ("blue", "नीला"), ("green", "हरा"), ("yellow", "पीला"),
            ("black", "काला"), ("white", "सफ़ेद"), ("shirt", "कमीज़"), ("pants", "पैंट"),
            ("shoes", "जूते"), ("hat", "टोपी"), ("dress", "ड्रेस"), ("wear", "पहनना"),
            ("color", "रंग"), ("favorite", "पसंदीदा"), ("bright", "चमकीला"), ("dark", "गहरा")
        ],
        "sentences": [
            ("a red car", "लाल गाड़ी", ["a", "red", "car", "blue", "shirt"]),
            ("a white shirt and black shoes", "सफ़ेद कमीज़ और काले जूते", ["a", "white", "shirt", "and", "black", "shoes"]),
            ("My shirt is blue", "मेरी कमीज़ नीली है।", ["My", "shirt", "is", "blue", "red", "green"]),
            ("She wears a red dress", "वह लाल ड्रेस पहनती है।", ["She", "wears", "a", "red", "dress", "hat"]),
            ("My shoes are black and clean", "मेरे जूते काले और साफ़ हैं।", ["My", "shoes", "are", "black", "and", "clean"]),
            ("My favorite color is green", "मेरा पसंदीदा रंग हरा है।", ["My", "favorite", "color", "is", "green", "blue"]),
            ("He is wearing a hat", "उसने टोपी पहनी है।", ["He", "is", "wearing", "a", "hat", "shirt"]),
            ("This yellow shirt is new", "यह पीली कमीज़ नई है।", ["This", "yellow", "shirt", "is", "new", "old"])
        ],
        "dialogue": {
            "name": "Friend",
            "prompt": "What is your favorite color?",
            "translation": "तुम्हारा पसंदीदा रंग कौन सा है?",
            "options": [
                {"text": "My favorite color is blue.", "isCorrect": True},
                {"text": "It is five o'clock.", "isCorrect": False}
            ]
        },
        "speeches": ["My favorite color is blue", "I wear black shoes", "My car is red"],
        "karaoke_story": ("I am wearing a white shirt and black shoes. My favorite color is blue.", "मैंने सफ़ेद कमीज़ और काले जूते पहने हैं। मेरा पसंदीदा रंग नीला है।")
    },
    # Unit 9
    {
        "num": 9,
        "title": "Expressing Needs, Likes & Courtesies",
        "desc": "ज़रूरतें, पसंद और शिष्टाचार",
        "color": "#F59E0B",
        "words": [
            ("want", "चाहना"), ("need", "ज़रूरत होना"), ("like", "पसंद करना"), ("help", "मदद"),
            ("please", "कृपया"), ("thank you", "धन्यवाद"), ("sorry", "माफ़ करें"), ("welcome", "स्वागत"),
            ("excuse me", "माफ़ कीजिए"), ("money", "पैसे"), ("can", "सकना"), ("sir", "सर"),
            ("madam", "मैडम"), ("problem", "समस्या"), ("okay", "ठीक है"), ("water", "पानी")
        ],
        "sentences": [
            ("I need help, please", "मुझे मदद चाहिए, कृपया।", ["I", "need", "help,", "please", "want", "money"]),
            ("I need a pen", "मुझे एक पेन चाहिए।", ["I", "need", "a", "pen", "book", "car"]),
            ("I want cold water", "मुझे ठंडा पानी चाहिए।", ["I", "want", "cold", "water", "hot", "tea"]),
            ("Excuse me, can you help me?", "सुनिए, क्या आप मेरी मदद कर सकते हैं?", ["Excuse", "me,", "can", "you", "help", "me?"]),
            ("I am very sorry", "मुझे बहुत खेद है।", ["I", "am", "very", "sorry", "welcome", "please"]),
            ("You are welcome, sir", "आपका स्वागत है, सर।", ["You", "are", "welcome,", "sir", "madam", "sorry"]),
            ("No problem at all", "कोई बात नहीं।", ["No", "problem", "at", "all", "yes", "need"]),
            ("Tea? Yes, please!", "चाय? हाँ, कृपया!", ["Tea?", "Yes,", "please!", "No,", "thanks!"])
        ],
        "dialogue": {
            "name": "Tourist",
            "prompt": "Can you help me, please?",
            "translation": "क्या आप मेरी मदद कर सकते हैं, कृपया?",
            "options": [
                {"text": "Yes, of course!", "isCorrect": True},
                {"text": "My dress is red.", "isCorrect": False}
            ]
        },
        "speeches": ["Excuse me, can you help me?", "Thank you very much", "I need a pen"],
        "karaoke_story": ("Excuse me, can you help me? I need a pen, please. Thank you very much!", "माफ़ कीजिए, क्या आप मेरी मदद कर सकते हैं? मुझे एक पेन चाहिए, कृपया। बहुत-बहुत धन्यवाद!")
    },
    # Unit 10
    {
        "num": 10,
        "title": "Asking Questions & Directions",
        "desc": "प्रश्न पूछना और दिशा निर्देश",
        "color": "#3B82F6",
        "words": [
            ("what", "क्या"), ("where", "कहाँ"), ("who", "कौन"), ("when", "कब"),
            ("why", "क्यों"), ("how", "कैसे"), ("left", "बाएँ"), ("right", "दाएँ"),
            ("straight", "सीधे"), ("near", "पास"), ("far", "दूर"), ("stop", "रुकना"),
            ("turn", "मुड़ना"), ("road", "सड़क"), ("station", "स्टेशन"), ("map", "नक्शा")
        ],
        "sentences": [
            ("Where is the station?", "स्टेशन कहाँ है?", ["Where", "is", "the", "station?", "airport", "market"]),
            ("Turn left at the road", "सड़क पर बाएँ मुड़िए।", ["Turn", "left", "at", "the", "road", "right"]),
            ("Turn right and go straight", "दाएँ मुड़िए और सीधे जाइए।", ["Turn", "right", "and", "go", "straight", "left"]),
            ("Stop here, please", "कृपया यहाँ रोकिए।", ["Stop", "here,", "please", "there", "go"]),
            ("Is it near or far?", "क्या यह पास है या दूर?", ["Is", "it", "near", "or", "far?", "here"]),
            ("It is far from here", "यह यहाँ से दूर है।", ["It", "is", "far", "from", "here", "near", "there"]),
            ("How are you today?", "आप आज कैसे हैं?", ["How", "are", "you", "today?", "Who", "Where"]),
            ("Which way to the market?", "बाज़ार का रास्ता कौन सा है?", ["Which", "way", "to", "the", "market?", "road"])
        ],
        "dialogue": {
            "name": "Pedestrian",
            "prompt": "Where is the train station?",
            "translation": "रेलवे स्टेशन कहाँ है?",
            "options": [
                {"text": "Go straight and turn left.", "isCorrect": True},
                {"text": "I eat breakfast at 8.", "isCorrect": False}
            ]
        },
        "speeches": ["Where is the station?", "Go straight and turn left", "Turn right, please"],
        "karaoke_story": ("Where is the train station? Go straight and turn left at the road.", "रेलवे स्टेशन कहाँ है? सीधे जाइए और सड़क पर बाएँ मुड़िए।")
    },
    # Unit 11
    {
        "num": 11,
        "title": "Places in the City & Transportation",
        "desc": "शहर के स्थान और यात्रा",
        "color": "#8B5CF6",
        "words": [
            ("bus", "बस"), ("train", "ट्रेन"), ("auto", "ऑटो"), ("taxi", "टैक्सी"),
            ("station", "स्टेशन"), ("airport", "हवाई अड्डा"), ("market", "बाज़ार"), ("hospital", "अस्पताल"),
            ("bank", "बैंक"), ("hotel", "होटल"), ("ticket", "टिकट"), ("price", "कीमत"),
            ("seat", "सीट"), ("driver", "ड्राइवर"), ("city", "शहर"), ("how much", "कितना")
        ],
        "sentences": [
            ("I go to work by bus", "मैं बस से काम पर जाता हूँ।", ["I", "go", "to", "work", "by", "bus", "train"]),
            ("The train is at the station", "ट्रेन स्टेशन पर है।", ["The", "train", "is", "at", "the", "station", "bus"]),
            ("I am going to the market", "मैं बाज़ार जा रहा हूँ।", ["I", "am", "going", "to", "the", "market", "bank"]),
            ("The bank is near the hospital", "बैंक अस्पताल के पास है।", ["The", "bank", "is", "near", "the", "hospital", "hotel"]),
            ("One ticket to Delhi, please", "दिल्ली के लिए एक टिकट, कृपया।", ["One", "ticket", "to", "Delhi,", "please", "two"]),
            ("How much is the ticket?", "टिकट कितने का है?", ["How", "much", "is", "the", "ticket?", "price"]),
            ("This is my seat", "यह मेरी सीट है।", ["This", "is", "my", "seat", "your", "bag"]),
            ("Stop at the hotel, please", "कृपया होटल पर रोकिए।", ["Stop", "at", "the", "hotel,", "please", "bank"])
        ],
        "dialogue": {
            "name": "Auto Driver",
            "prompt": "Where do you want to go?",
            "translation": "आप कहाँ जाना चाहते हैं?",
            "options": [
                {"text": "To the market, please.", "isCorrect": True},
                {"text": "My father is tall.", "isCorrect": False}
            ]
        },
        "speeches": ["How much is the ticket?", "One ticket, please", "Stop at the station"],
        "karaoke_story": ("I go to the market by auto. One ticket to the city center, please.", "मैं ऑटो से बाज़ार जाता हूँ। शहर के केंद्र के लिए एक टिकट दीजिए, कृपया।")
    },
    # Unit 12
    {
        "num": 12,
        "title": "Feelings, Physical Health & Section 1 Graduation",
        "desc": "भावनाएं, स्वास्थ्य और अनुभाग 1 दीक्षांत",
        "color": "#06B6D4",
        "words": [
            ("happy", "खुश"), ("sad", "उदास"), ("tired", "थका हुआ"), ("hungry", "भूखा"),
            ("thirsty", "प्यासा"), ("fine", "ठीक"), ("well", "अच्छा"), ("sick", "बीमार"),
            ("headache", "सिरदर्द"), ("fever", "बुखार"), ("doctor", "डॉक्टर"), ("medicine", "दवा"),
            ("rest", "आराम"), ("feel", "महसूस करना"), ("ready", "तैयार"), ("graduate", "दीक्षांत")
        ],
        "sentences": [
            ("I am very happy today", "मैं आज बहुत खुश हूँ।", ["I", "am", "very", "happy", "today", "sad"]),
            ("I am hungry and tired", "मुझे भूख लगी है और मैं थका हूँ।", ["I", "am", "hungry", "and", "tired", "fine"]),
            ("Are you thirsty?", "क्या आपको प्यास लगी है?", ["Are", "you", "thirsty?", "hungry", "fine"]),
            ("I have a headache", "मेरे सिर में दर्द है।", ["I", "have", "a", "headache", "fever", "cold"]),
            ("He has a fever", "उसे बुखार है।", ["He", "has", "a", "fever", "headache", "sick"]),
            ("Please see a doctor", "कृपया डॉक्टर से मिलिए।", ["Please", "see", "a", "doctor", "medicine", "rest"]),
            ("Take rest and drink water", "आराम कीजिए और पानी पीजिए।", ["Take", "rest", "and", "drink", "water", "tea"]),
            ("I am ready to graduate", "मैं स्नातक होने के लिए तैयार हूँ।", ["I", "am", "ready", "to", "graduate", "happy", "now"])
        ],
        "dialogue": {
            "name": "Doctor",
            "prompt": "How do you feel today?",
            "translation": "आज आप कैसा महसूस कर रहे हैं?",
            "options": [
                {"text": "I feel much better now.", "isCorrect": True},
                {"text": "Turn right at the road.", "isCorrect": False}
            ]
        },
        "speeches": ["I am very happy", "I have a headache", "I am ready to graduate Section 1"],
        "karaoke_story": ("I am very happy today. I learned English and I am ready to graduate Section 1!", "मैं आज बहुत खुश हूँ। मैंने अंग्रेज़ी सीखी और मैं अनुभाग 1 पूरा करने के लिए तैयार हूँ!")
    }
]

def generate_section_1():
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

        # ---------------------------------------------------------------------
        # Helper to generate an interactive 10-stage lesson
        # ---------------------------------------------------------------------
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
                pic_trans=pic_w[1],
                pic_distractors=pic_dist,
                match_pairs=match_subset,
                sent_prompt_hi=core_sent[1],
                sent_target_en=core_sent[0],
                sent_tokens=core_sent[2],
                cloze_sentence=cloze_info[0],
                cloze_blank=cloze_info[1],
                cloze_trans_hi=cloze_info[2],
                cloze_options=cloze_info[3],
                listen_target_en=listen_info[0],
                listen_tokens=listen_info[1],
                listen_spoken_en=select_info[0],
                listen_correct_hi=select_info[1],
                listen_distractor_hi=select_info[2],
                type_target_en=type_w_clean[0],
                type_trans_hi=type_w_clean[1],
                type_hint=f"संकेत: {type_w_clean[0][0].upper()} से शुरू होता है",
                partner_name=dlg_info["name"],
                partner_msg_en=dlg_info["prompt"],
                partner_msg_hi=dlg_info["translation"],
                reply_correct=dlg_info["options"][0]["text"],
                reply_wrong=dlg_info["options"][1]["text"],
                sprechen_en=speech_info[0],
                sprechen_hi=speech_info[1],
                karaoke_story_en=karaoke_info[0],
                karaoke_story_hi=karaoke_info[1]
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
            karaoke_info=(f"{sents[0][0]}. {words[0][0].capitalize()} is good.", f"{sents[0][1]}। {words[0][1]} अच्छा है।")
        ))

        # ---------------------------------------------------------------------
        # L2: Lesson 2 - Expansion & Sentence Syntax (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            1, 2, "Lesson 2", f"{u_desc}: वाक्य निर्माण",
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
            karaoke_info=(f"{sents[1][0]}. It is very good.", f"{sents[1][1]} यह बहुत अच्छा है।")
        ))

        # ---------------------------------------------------------------------
        # L3: Lesson 3 - Compounds & Conjunctions (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            2, 3, "Lesson 3", f"{u_desc}: संयुक्त वाक्य",
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
            karaoke_info=(f"{sents[2][0]}. We like this.", f"{sents[2][1]} हमें यह पसंद है।")
        ))

        # ---------------------------------------------------------------------
        # L4: Lesson 4 - Ear Training & Listening Immersion (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            3, 4, "Lesson 4", f"{u_desc}: श्रवण अभ्यास (Ear Training)",
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
            karaoke_info=(f"{sents[3][0]}. Listen and speak every day.", f"{sents[3][1]} हर दिन सुनिए और बोलिए।")
        ))

        # ---------------------------------------------------------------------
        # L5: Lesson 5 - Quality & Context Mastery (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            4, 5, "Lesson 5", f"{u_desc}: गुण और विशेषताएं",
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
            karaoke_info=(f"{sents[4][0]}. You are doing very well.", f"{sents[4][1]} आप बहुत अच्छा कर रहे हैं।")
        ))

        # ---------------------------------------------------------------------
        # L6: Treasure Chest 1 (Milestone Reward Node - 0 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_chest(5, 6, u_title, 1, 15, 25))

        # ---------------------------------------------------------------------
        # L7: Lesson 7 - Post-Chest Compounds & Usage (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            6, 7, "Lesson 7", f"{u_desc}: संयुक्त प्रयोग",
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
            karaoke_info=(f"{sents[5][0]}. Practice makes you perfect.", f"{sents[5][1]} अभ्यास से सब आसान हो जाता है।")
        ))

        # ---------------------------------------------------------------------
        # L8: Lesson 8 - Advanced Sentences & Context (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            7, 8, "Lesson 8", f"{u_desc}: जटिल वाक्य संरचना",
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
            karaoke_info=(f"{sents[6][0]}. Everything is in order.", f"{sents[6][1]} सब कुछ सही क्रम में है।")
        ))

        # ---------------------------------------------------------------------
        # L9: Lesson 9 - Oral Fluency & Speech Lab (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            8, 9, "Lesson 9", f"{u_desc}: मौखिक अभ्यास (Speech Lab)",
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
            karaoke_info=(f"{sents[7][0]}. Speak clearly and with confidence.", f"{sents[7][1]} स्पष्टता और आत्मविश्वास से बोलिए।")
        ))

        # ---------------------------------------------------------------------
        # L10: Lesson 10 - Grand Conversational Synthesis (10 Stages)
        # ---------------------------------------------------------------------
        lessons.append(make_interactive_lesson(
            9, 10, "Lesson 10", f"{u_desc}: संवाद अभ्यास (Dialogue Mastery)",
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
            11, 12, f"Unit {u_num} Milestone Exam", f"{u_desc}: संपूर्ण इकाई परीक्षा (Mastery Challenge)",
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
    output_dir = os.path.join(root_dir, "syllabus", "section_1")
    os.makedirs(output_dir, exist_ok=True)

    print("🚀 Generating Complete Section 1 Curriculum (12 Units x 12 Lessons = 144 Lessons)...")
    print("   • All 10 challenge formats populated in each interactive lesson")
    print("   • picture_select generated with enabled: false (unticked for custom images)")
    print("   • Sunken Treasure Chests at L6 (+25💎) & L11 (+35💎)")

    units = generate_section_1()

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

    # Write each unit file
    for idx, unit in enumerate(units):
        filename = unit_filenames[idx]
        file_path = os.path.join(output_dir, filename)

        unit_wrapper = {
            "courseTitle": "English A1 Comprehensive Curriculum (For Hindi Speakers)",
            "learningLanguage": "en",
            "nativeLanguage": "hi",
            "level": "A1",
            "sectionNumber": 1,
            "sectionTitle": "Section 1: Rookie (A1 Foundation)",
            "unitNumber": unit["unitNumber"],
            "unitTitle": unit["unitTitle"],
            "unitDescription": unit["unitDescription"],
            "accentColor": unit["accentColor"],
            "lessonsCount": len(unit["lessons"]),
            "lessons": unit["lessons"],
            "lessonsData": unit["lessons"]
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
    consolidated_path = os.path.join(root_dir, "syllabus", "section_1_english_hindi.json")
    consolidated_wrapper = {
        "courseTitle": "English A1 Comprehensive Curriculum (For Hindi Speakers)",
        "learningLanguage": "en",
        "nativeLanguage": "hi",
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
