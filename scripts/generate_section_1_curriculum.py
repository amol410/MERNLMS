#!/usr/bin/env python3
"""
Generate Section 1 Curriculum for English Learning from Hindi (en_hi_a1)
Total: 12 Units x 12 Lessons = 144 Lessons/Nodes.
Pedagogical Model: Scaffolded incremental micro-steps (based on Duolingo reference lessons).
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

def generate_section_1():
    units_data = []

    # =========================================================================
    # UNIT 1: Basic Objects & Possessives (बुनियादी वस्तुएं और संबंध)
    # =========================================================================
    u1_title = "Basic Objects & Possessives"
    u1_desc = "बुनियादी वस्तुएं और संबंध"
    u1_color = "#1CB0F6"
    u1_lessons = []

    # L1: Objects & "My"
    u1_lessons.append(build_lesson(
        0, 1, u1_title, "Lesson 1", "बुनियादी वस्तुएं और संबंध: घर और गाड़ी", "lesson", 15, 5,
        [
            {
                "type": "picture_select",
                "title": "चित्र चुनिए",
                "prompt": "'गाड़ी' के लिए सही चित्र चुनें:",
                "targetWord": "car",
                "translation": "गाड़ी",
                "options": [
                    {"id": "u1_l1_o1", "text": "car (गाड़ी)", "imageUrl": "/uploads/curriculum/car.webp", "isCorrect": True},
                    {"id": "u1_l1_o2", "text": "house (घर)", "imageUrl": "/uploads/curriculum/house.webp", "isCorrect": False},
                    {"id": "u1_l1_o3", "text": "water (पानी)", "imageUrl": "/uploads/curriculum/water.webp", "isCorrect": False}
                ]
            },
            {
                "type": "picture_select",
                "title": "चित्र चुनिए",
                "prompt": "'घर' के लिए सही चित्र चुनें:",
                "targetWord": "house",
                "translation": "घर",
                "options": [
                    {"id": "u1_l1_o4", "text": "house (घर)", "imageUrl": "/uploads/curriculum/house.webp", "isCorrect": True},
                    {"id": "u1_l1_o5", "text": "car (गाड़ी)", "imageUrl": "/uploads/curriculum/car.webp", "isCorrect": False},
                    {"id": "u1_l1_o6", "text": "tea (चाय)", "imageUrl": "/uploads/curriculum/tea.webp", "isCorrect": False}
                ]
            },
            {
                "type": "word_match",
                "title": "सही शब्द जोड़ियों का मिलान करें",
                "pairs": [
                    {"target": "house", "native": "घर"},
                    {"target": "car", "native": "गाड़ी"},
                    {"target": "my", "native": "मेरा / मेरी"},
                    {"target": "is", "native": "है"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "मेरी गाड़ी",
                "targetSentence": "my car",
                "tokens": ["my", "car", "house", "is", "your"]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "मेरा घर",
                "targetSentence": "my house",
                "tokens": ["my", "house", "car", "is", "big"]
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और सही शब्दों पर टैप करें",
                "targetSentence": "my car",
                "tokens": ["my", "car", "house", "is"],
                "audioUrl": ""
            },
            {
                "type": "type_word",
                "title": "स्पेलिंग टाइप करें",
                "prompt": "'गाड़ी' के लिए अंग्रेज़ी शब्द टाइप करें:",
                "target": "car",
                "hint": "संकेत: 3 अक्षरों का शब्द जो c से शुरू होता है"
            }
        ]
    ))

    # L2: Opposites: Big & Small
    u1_lessons.append(build_lesson(
        1, 2, u1_title, "Lesson 2", "आकार और विशेषताएं: बड़ा और छोटा", "lesson", 15, 5,
        [
            {
                "type": "word_match",
                "title": "सही जोड़ियों का मिलान करें",
                "pairs": [
                    {"target": "big", "native": "बड़ा / बड़ी"},
                    {"target": "small", "native": "छोटा / छोटी"},
                    {"target": "car", "native": "गाड़ी"},
                    {"target": "house", "native": "घर"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "मेरी गाड़ी बड़ी है।",
                "targetSentence": "My car is big",
                "tokens": ["My", "car", "is", "big", "small", "house"]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "मेरा घर छोटा है।",
                "targetSentence": "My house is small",
                "tokens": ["My", "house", "is", "small", "big", "car"]
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "My car is big",
                "tokens": ["My", "car", "is", "big", "small", "house"],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "रिक्त स्थान भरें",
                "sentence": "My house is _______.",
                "blank": "small",
                "translation": "मेरा घर छोटा है।",
                "options": ["small", "car", "my"]
            },
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "My car is big",
                "translation": "मेरी गाड़ी बड़ी है",
                "minAccuracy": 75,
                "audioUrl": ""
            }
        ]
    ))

    # L3: Possessives: Your, His, Her
    u1_lessons.append(build_lesson(
        2, 3, u1_title, "Lesson 3", "संबंध सूचक शब्द: तुम्हारा, उसका", "lesson", 15, 5,
        [
            {
                "type": "word_match",
                "title": "संबंध सूचक शब्दों का मिलान करें",
                "pairs": [
                    {"target": "your", "native": "तुम्हारा / आपका"},
                    {"target": "his", "native": "उसका (पुरुष)"},
                    {"target": "her", "native": "उसकी (स्त्री)"},
                    {"target": "my", "native": "मेरा / मेरी"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "तुम्हारी गाड़ी बड़ी है।",
                "targetSentence": "Your car is big",
                "tokens": ["Your", "car", "is", "big", "My", "small"]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "उसका घर छोटा है।",
                "targetSentence": "His house is small",
                "tokens": ["His", "house", "is", "small", "Her", "big"]
            },
            {
                "type": "cloze_test",
                "title": "रिक्त स्थान भरें",
                "sentence": "_______ car is small.",
                "blank": "Your",
                "translation": "तुम्हारी गाड़ी छोटी है।",
                "options": ["Your", "House", "Is"]
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "Your house is big",
                "tokens": ["Your", "house", "is", "big", "His", "car"],
                "audioUrl": ""
            },
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "Your car is big",
                "translation": "आपकी गाड़ी बड़ी है",
                "minAccuracy": 75,
                "audioUrl": ""
            }
        ]
    ))

    # L4: Listening & Ear Training
    u1_lessons.append(build_lesson(
        3, 4, u1_title, "Lesson 4", "श्रवण अभ्यास: वाक्य पहचान", "lesson", 20, 5,
        [
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "My car is small",
                "tokens": ["My", "car", "is", "small", "big", "Your"],
                "audioUrl": ""
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "Your house is big",
                "tokens": ["Your", "house", "is", "big", "small", "His"],
                "audioUrl": ""
            },
            {
                "type": "word_match",
                "title": "तेज़ मिलान",
                "pairs": [
                    {"target": "small", "native": "छोटा"},
                    {"target": "big", "native": "बड़ा"},
                    {"target": "house", "native": "घर"},
                    {"target": "car", "native": "गाड़ी"},
                    {"target": "your", "native": "तुम्हारा"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "उसकी गाड़ी नई है।",
                "targetSentence": "Her car is new",
                "tokens": ["Her", "car", "is", "new", "old", "His"]
            },
            {
                "type": "cloze_test",
                "title": "रिक्त स्थान भरें",
                "sentence": "My _______ is big.",
                "blank": "car",
                "translation": "मेरी गाड़ी बड़ी है।",
                "options": ["car", "is", "my"]
            }
        ]
    ))

    # L5: Clean & Dirty
    u1_lessons.append(build_lesson(
        4, 5, u1_title, "Lesson 5", "गुणवत्ता और स्थिति: साफ़ और गंदा", "lesson", 15, 5,
        [
            {
                "type": "word_match",
                "title": "शब्दों का मिलान करें",
                "pairs": [
                    {"target": "clean", "native": "साफ़"},
                    {"target": "dirty", "native": "गंदा"},
                    {"target": "very", "native": "बहुत"},
                    {"target": "good", "native": "अच्छा"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "मेरी गाड़ी बहुत साफ़ है।",
                "targetSentence": "My car is very clean",
                "tokens": ["My", "car", "is", "very", "clean", "dirty", "house"]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "उसका घर गंदा है।",
                "targetSentence": "His house is dirty",
                "tokens": ["His", "house", "is", "dirty", "clean", "car"]
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "My house is clean",
                "tokens": ["My", "house", "is", "clean", "dirty", "very"],
                "audioUrl": ""
            },
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "My car is clean",
                "translation": "मेरी गाड़ी साफ़ है",
                "minAccuracy": 75,
                "audioUrl": ""
            }
        ]
    ))

    # L6: Treasure Chest 1
    u1_lessons.append(make_chest(5, 6, u1_title, 1, 15, 25))

    # L7: Age: New & Old
    u1_lessons.append(build_lesson(
        6, 7, u1_title, "Lesson 7", "आयु और स्थिति: नया और पुराना", "lesson", 15, 5,
        [
            {
                "type": "word_match",
                "title": "शब्दों का मिलान करें",
                "pairs": [
                    {"target": "new", "native": "नया / नई"},
                    {"target": "old", "native": "पुराना / पुरानी"},
                    {"target": "good", "native": "अच्छा"},
                    {"target": "bad", "native": "खराब"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "मेरी गाड़ी नई है।",
                "targetSentence": "My car is new",
                "tokens": ["My", "car", "is", "new", "old", "house"]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "तुम्हारा घर पुराना है।",
                "targetSentence": "Your house is old",
                "tokens": ["Your", "house", "is", "old", "new", "car"]
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "This car is new",
                "tokens": ["This", "car", "is", "new", "old", "house"],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "रिक्त स्थान भरें",
                "sentence": "His house is _______.",
                "blank": "old",
                "translation": "उसका घर पुराना है।",
                "options": ["old", "is", "his"]
            }
        ]
    ))

    # L8: Demonstratives: This & That
    u1_lessons.append(build_lesson(
        7, 8, u1_title, "Lesson 8", "संकेतवाचक शब्द: यह और वह", "lesson", 15, 5,
        [
            {
                "type": "word_match",
                "title": "शब्दों का मिलान करें",
                "pairs": [
                    {"target": "this", "native": "यह"},
                    {"target": "that", "native": "वह"},
                    {"target": "here", "native": "यहाँ"},
                    {"target": "there", "native": "वहाँ"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "यह मेरी गाड़ी है।",
                "targetSentence": "This is my car",
                "tokens": ["This", "is", "my", "car", "That", "house"]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "वह तुम्हारा घर है।",
                "targetSentence": "That is your house",
                "tokens": ["That", "is", "your", "house", "This", "car"]
            },
            {
                "type": "listen_tap",
                "title": "सुनिए और टैप करें",
                "targetSentence": "This is my house",
                "tokens": ["This", "is", "my", "house", "That", "car"],
                "audioUrl": ""
            },
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "This is my car",
                "translation": "यह मेरी गाड़ी है",
                "minAccuracy": 75,
                "audioUrl": ""
            }
        ]
    ))

    # L9: Speech & Pronunciation
    u1_lessons.append(build_lesson(
        8, 9, u1_title, "Lesson 9", "उच्चारण और मौखिक अभिव्यक्ति", "lesson", 25, 5,
        [
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "This is my house",
                "translation": "यह मेरा घर है",
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "Your car is new",
                "translation": "आपकी गाड़ी नई है",
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "sprechen",
                "title": "बोलकर अभ्यास करें",
                "prompt": "My house is clean",
                "translation": "मेरा घर साफ़ है",
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "word_match",
                "title": "तेज़ मिलान",
                "pairs": [
                    {"target": "this", "native": "यह"},
                    {"target": "clean", "native": "साफ़"},
                    {"target": "new", "native": "नया"},
                    {"target": "very", "native": "बहुत"}
                ]
            }
        ]
    ))

    # L10: Questions & Negation
    u1_lessons.append(build_lesson(
        9, 10, u1_title, "Lesson 10", "हाँ / नहीं और प्रश्न निर्माण", "lesson", 20, 5,
        [
            {
                "type": "word_match",
                "title": "शब्दों का मिलान करें",
                "pairs": [
                    {"target": "yes", "native": "हाँ"},
                    {"target": "no", "native": "नहीं"},
                    {"target": "not", "native": "नहीं"},
                    {"target": "what", "native": "क्या"}
                ]
            },
            {
                "type": "dialogue_bubble",
                "title": "संवाद पूरा करें",
                "partnerName": "Rohan",
                "partnerMessage": "Is your car big?",
                "translation": "क्या तुम्हारी गाड़ी बड़ी है?",
                "options": [
                    {"text": "Yes, my car is big.", "isCorrect": True},
                    {"text": "No, tea is cold.", "isCorrect": False}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "अंग्रेज़ी वाक्य बनाइए",
                "prompt": "नहीं, मेरी गाड़ी बड़ी नहीं है।",
                "targetSentence": "No, my car is not big",
                "tokens": ["No,", "my", "car", "is", "not", "big", "Yes,", "house"]
            },
            {
                "type": "cloze_test",
                "title": "रिक्त स्थान भरें",
                "sentence": "My house is _______ dirty.",
                "blank": "not",
                "translation": "मेरा घर गंदा नहीं है।",
                "options": ["not", "no", "is"]
            }
        ]
    ))

    # L11: Treasure Chest 2
    u1_lessons.append(make_chest(10, 11, u1_title, 2, 20, 35))

    # L12: Unit 1 Milestone Exam
    u1_lessons.append(build_lesson(
        11, 12, u1_title, "Unit 1 Coral Reef Exam", "इकाई 1 संपूर्ण परीक्षा", "quiz", 35, 10,
        [
            {
                "type": "word_match",
                "title": "संपूर्ण इकाई 1 मिलान",
                "pairs": [
                    {"target": "house", "native": "घर"},
                    {"target": "car", "native": "गाड़ी"},
                    {"target": "clean", "native": "साफ़"},
                    {"target": "new", "native": "नया"},
                    {"target": "big", "native": "बड़ा"}
                ]
            },
            {
                "type": "sentence_builder",
                "title": "परीक्षा प्रश्न 1",
                "prompt": "यह मेरा घर है और यह नया है।",
                "targetSentence": "This is my house and it is new",
                "tokens": ["This", "is", "my", "house", "and", "it", "new", "car"]
            },
            {
                "type": "listen_tap",
                "title": "परीक्षा प्रश्न 2",
                "targetSentence": "Your car is very clean",
                "tokens": ["Your", "car", "is", "very", "clean", "dirty", "house"],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "परीक्षा प्रश्न 3",
                "sentence": "That is _______ car.",
                "blank": "your",
                "translation": "वह तुम्हारी गाड़ी है।",
                "options": ["your", "is", "not"]
            },
            {
                "type": "sprechen",
                "title": "अंतिम मौखिक परीक्षा",
                "prompt": "My car is new and clean",
                "translation": "मेरी गाड़ी नई और साफ़ है",
                "minAccuracy": 80,
                "audioUrl": ""
            }
        ]
    ))

    units_data.append({
        "unitNumber": 1,
        "unitTitle": u1_title,
        "unitDescription": u1_desc,
        "accentColor": u1_color,
        "lessonsCount": 12,
        "lessons": u1_lessons
    })

    # =========================================================================
    # Helper to generate Units 2 through 12 systematically
    # =========================================================================
    unit_configs = [
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
                    {"text": "My car is big.", "isCorrect": False}
                ]
            },
            "speeches": ["Hot tea and cold water", "Water, please", "Tea is sweet"]
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
            "speeches": ["He is my father", "I am a student", "You are my friend"]
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
                ("I eat bread", "मैं ब्रेड खाता हूँ।", ["I", "eat", "bread", "drink", "water"]),
                ("I read a book", "मैं किताब पढ़ता हूँ।", ["I", "read", "a", "book", "write", "school"]),
                ("I speak Hindi and English", "मैं हिंदी और अंग्रेज़ी बोलता हूँ।", ["I", "speak", "Hindi", "and", "English", "read"]),
                ("I go to school", "मैं स्कूल जाता हूँ।", ["I", "go", "to", "school", "office", "come"]),
                ("She works in an office", "वह कार्यालय में काम करती है।", ["She", "works", "in", "an", "office", "school", "lives"]),
                ("I like tea very much", "मुझे चाय बहुत पसंद है।", ["I", "like", "tea", "very", "much", "coffee"]),
                ("Speak slowly, please", "कृपया धीरे बोलिए।", ["Speak", "slowly,", "please", "fast", "read"]),
                ("We eat food together", "हम साथ में खाना खाते हैं।", ["We", "eat", "food", "together", "drink", "water"])
            ],
            "dialogue": {
                "name": "Teacher",
                "prompt": "Do you speak English?",
                "translation": "क्या आप अंग्रेज़ी बोलते हैं?",
                "options": [
                    {"text": "Yes, I speak English.", "isCorrect": True},
                    {"text": "My house is small.", "isCorrect": False}
                ]
            },
            "speeches": ["I speak English every day", "I read a book", "I like tea"]
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
                ("nine", "नौ"), ("ten", "दस"), ("pen", "पेन"), ("pens", "पेन (बहुवचन)"),
                ("apples", "सेब"), ("many", "कई"), ("only", "केवल"), ("children", "बच्चे")
            ],
            "sentences": [
                ("one pen and two cars", "एक पेन और दो गाड़ियाँ", ["one", "pen", "and", "two", "cars", "three"]),
                ("three cups of tea", "तीन कप चाय", ["three", "cups", "of", "tea", "coffee", "four"]),
                ("five big houses", "पाँच बड़े घर", ["five", "big", "houses", "small", "six"]),
                ("I have seven apples", "मेरे पास सात सेब हैं।", ["I", "have", "seven", "apples", "books", "eight"]),
                ("ten students are here", "दस छात्र यहाँ हैं।", ["ten", "students", "are", "here", "teachers", "there"]),
                ("He has many friends", "उसके कई दोस्त हैं।", ["He", "has", "many", "friends", "only", "one"]),
                ("How many cars do you have?", "आपके पास कितनी गाड़ियाँ हैं?", ["How", "many", "cars", "do", "you", "have?"]),
                ("Only one book, please", "केवल एक किताब, कृपया।", ["Only", "one", "book,", "please", "two", "pens"])
            ],
            "dialogue": {
                "name": "Shopkeeper",
                "prompt": "How many apples do you want?",
                "translation": "आपको कितने सेब चाहिए?",
                "options": [
                    {"text": "Four apples, please.", "isCorrect": True},
                    {"text": "He is my teacher.", "isCorrect": False}
                ]
            },
            "speeches": ["I have two pens", "Five students are here", "Three cars"]
        },
        # Unit 6
        {
            "num": 6,
            "title": "Home, Rooms & Prepositions",
            "desc": "घर, कमरे और स्थान सूचक",
            "color": "#2B70C9",
            "words": [
                ("room", "कमरा"), ("kitchen", "रसोई"), ("table", "मेज़"), ("chair", "कुर्सी"),
                ("bed", "बिस्तर"), ("door", "दरवाज़ा"), ("window", "खिड़की"), ("wall", "दीवार"),
                ("phone", "फ़ोन"), ("key", "चाबी"), ("bag", "बैग"), ("in", "में"),
                ("on", "पर"), ("under", "के नीचे"), ("near", "के पास"), ("where", "कहाँ")
            ],
            "sentences": [
                ("The book is on the table", "किताब मेज़ पर है।", ["The", "book", "is", "on", "the", "table", "under"]),
                ("My mother is in the kitchen", "मेरी माँ रसोई में हैं।", ["My", "mother", "is", "in", "the", "kitchen", "room"]),
                ("The cat is under the chair", "बिल्ली कुर्सी के नीचे है।", ["The", "cat", "is", "under", "the", "chair", "table"]),
                ("Where is my phone?", "मेरा फ़ोन कहाँ है?", ["Where", "is", "my", "phone?", "key", "bag"]),
                ("The keys are in the bag", "चाबियाँ बैग में हैं।", ["The", "keys", "are", "in", "the", "bag", "table"]),
                ("The door is open", "दरवाज़ा खुला है।", ["The", "door", "is", "open", "closed", "window"]),
                ("The window is closed", "खिड़की बंद है।", ["The", "window", "is", "closed", "open", "door"]),
                ("My house is near the school", "मेरा घर स्कूल के पास है।", ["My", "house", "is", "near", "the", "school", "far"])
            ],
            "dialogue": {
                "name": "Sister",
                "prompt": "Where is my bag?",
                "translation": "मेरा बैग कहाँ है?",
                "options": [
                    {"text": "It is on the chair.", "isCorrect": True},
                    {"text": "I eat bread.", "isCorrect": False}
                ]
            },
            "speeches": ["The book is on the table", "Where is my phone?", "The door is open"]
        },
        # Unit 7
        {
            "num": 7,
            "title": "Daily Routines & Time",
            "desc": "दैनिक दिनचर्या और समय",
            "color": "#00CD9C",
            "words": [
                ("morning", "सुबह"), ("evening", "शाम"), ("night", "रात"), ("time", "समय"),
                ("clock", "घड़ी"), ("o'clock", "बजे"), ("wake up", "उठना"), ("sleep", "सोना"),
                ("breakfast", "नाश्ता"), ("lunch", "दोपहर का खाना"), ("dinner", "रात का खाना"), ("today", "आज"),
                ("tomorrow", "कल"), ("early", "जल्दी"), ("late", "देर से"), ("always", "हमेशा")
            ],
            "sentences": [
                ("Good morning, everyone!", "सबको शुभ प्रभात!", ["Good", "morning,", "everyone!", "night", "evening"]),
                ("I wake up early", "मैं जल्दी उठता हूँ।", ["I", "wake", "up", "early", "late", "sleep"]),
                ("I eat breakfast at eight o'clock", "मैं आठ बजे नाश्ता करता हूँ।", ["I", "eat", "breakfast", "at", "eight", "o'clock"]),
                ("What time is it?", "कितने बजे हैं?", ["What", "time", "is", "it?", "clock", "now"]),
                ("It is five o'clock", "पाँच बजे हैं।", ["It", "is", "five", "o'clock", "six", "time"]),
                ("I work today", "मैं आज काम करता हूँ।", ["I", "work", "today", "tomorrow", "yesterday"]),
                ("He is never late", "वह कभी देर से नहीं आता।", ["He", "is", "never", "late", "always", "early"]),
                ("We eat dinner together at night", "हम रात में साथ खाना खाते हैं।", ["We", "eat", "dinner", "together", "at", "night"])
            ],
            "dialogue": {
                "name": "Friend",
                "prompt": "What time is it now?",
                "translation": "अभी कितने बजे हैं?",
                "options": [
                    {"text": "It is five o'clock.", "isCorrect": True},
                    {"text": "The keys are in the bag.", "isCorrect": False}
                ]
            },
            "speeches": ["Good morning!", "What time is it?", "I wake up early"]
        },
        # Unit 8
        {
            "num": 8,
            "title": "Colors, Clothes & Appearance",
            "desc": "रंग, कपड़े और रूप-रंग",
            "color": "#E91E63",
            "words": [
                ("red", "लाल"), ("blue", "नीला"), ("green", "हरा"), ("yellow", "पीला"),
                ("black", "काला"), ("white", "सफ़ेद"), ("shirt", "कमीज़"), ("pants", "पतलून"),
                ("shoes", "जूते"), ("hat", "टोपी"), ("dress", "पोशाक"), ("coat", "कोट"),
                ("wear", "पहनना"), ("wearing", "पहने हुए"), ("color", "रंग"), ("favorite", "पसंदीदा")
            ],
            "sentences": [
                ("a red car and a blue house", "लाल गाड़ी और नीला घर", ["a", "red", "car", "and", "a", "blue", "house"]),
                ("My shirt is white", "मेरी कमीज़ सफ़ेद है।", ["My", "shirt", "is", "white", "black", "red"]),
                ("He wears black shoes", "वह काले जूते पहनता है।", ["He", "wears", "black", "shoes", "white", "pants"]),
                ("I am wearing a hat", "मैंने टोपी पहनी हुई है।", ["I", "am", "wearing", "a", "hat", "coat", "dress"]),
                ("Her dress is very beautiful", "उसकी पोशाक बहुत सुंदर है।", ["Her", "dress", "is", "very", "beautiful", "shirt"]),
                ("My favorite color is blue", "मेरा पसंदीदा रंग नीला है।", ["My", "favorite", "color", "is", "blue", "green", "red"]),
                ("What color is your car?", "आपकी गाड़ी का रंग क्या है?", ["What", "color", "is", "your", "car?", "house"]),
                ("My car is red", "मेरी गाड़ी लाल है।", ["My", "car", "is", "red", "blue", "white"])
            ],
            "dialogue": {
                "name": "Aman",
                "prompt": "What color is your shirt?",
                "translation": "आपकी कमीज़ का रंग क्या है?",
                "options": [
                    {"text": "My shirt is blue.", "isCorrect": True},
                    {"text": "It is eight o'clock.", "isCorrect": False}
                ]
            },
            "speeches": ["My favorite color is blue", "I wear black shoes", "My car is red"]
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
            "speeches": ["Excuse me, can you help me?", "Thank you very much", "I need a pen"]
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
            "speeches": ["Where is the station?", "Go straight and turn left", "Turn right, please"]
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
            "speeches": ["How much is the ticket?", "One ticket, please", "Stop at the station"]
        },
        # Unit 12
        {
            "num": 12,
            "title": "Feelings, Health & Section 1 Graduation",
            "desc": "भावनाएं, स्वास्थ्य और अनुभाग 1 दीक्षांत",
            "color": "#D97706",
            "words": [
                ("happy", "खुश"), ("sad", "उदास"), ("tired", "थका हुआ"), ("hungry", "भूखा"),
                ("thirsty", "प्यासा"), ("fine", "ठीक"), ("sick", "बीमार"), ("headache", "सिरदर्द"),
                ("fever", "बुखार"), ("doctor", "डॉक्टर"), ("medicine", "दवा"), ("rest", "आराम"),
                ("better", "बेहतर"), ("feel", "महसूस करना"), ("ready", "तैयार"), ("graduate", "सफल")
            ],
            "sentences": [
                ("I am very happy today", "मैं आज बहुत खुश हूँ।", ["I", "am", "very", "happy", "today", "sad"]),
                ("Why are you sad?", "आप उदास क्यों हैं?", ["Why", "are", "you", "sad?", "happy", "tired"]),
                ("I am hungry and thirsty", "मुझे भूख और प्यास लगी है।", ["I", "am", "hungry", "and", "thirsty", "fine"]),
                ("I am tired, I need rest", "मैं थका हुआ हूँ, मुझे आराम चाहिए।", ["I", "am", "tired,", "I", "need", "rest", "sleep"]),
                ("I have a headache", "मेरे सिर में दर्द है।", ["I", "have", "a", "headache", "fever", "cold"]),
                ("He has a fever, call a doctor", "उसे बुखार है, डॉक्टर को बुलाइए।", ["He", "has", "a", "fever,", "call", "a", "doctor"]),
                ("Take medicine and drink warm water", "दवा लीजिए और गुनगुना पानी पीजिए।", ["Take", "medicine", "and", "drink", "warm", "water"]),
                ("I feel much better now", "अब मुझे बहुत बेहतर लग रहा है।", ["I", "feel", "much", "better", "now", "sick"])
            ],
            "dialogue": {
                "name": "Doctor",
                "prompt": "How do you feel today?",
                "translation": "आज आप कैसा महसूस कर रहे हैं?",
                "options": [
                    {"text": "I have a headache and fever.", "isCorrect": True},
                    {"text": "Turn left at the road.", "isCorrect": False}
                ]
            },
            "speeches": ["I am very happy today", "I feel much better", "I need rest"]
        }
    ]

    for cfg in unit_configs:
        u_num = cfg["num"]
        u_title = cfg["title"]
        u_desc = cfg["desc"]
        u_color = cfg["color"]
        words = cfg["words"]
        sents = cfg["sentences"]
        dlg = cfg["dialogue"]
        speeches = cfg["speeches"]

        lessons = []

        # L1: Core Nouns / Vocabulary Intro
        pair_set_1 = [{"target": w[0], "native": w[1]} for w in words[:4]]
        lessons.append(build_lesson(
            0, 1, u_title, "Lesson 1", f"{u_desc}: मुख्य शब्द", "lesson", 15, 5,
            [
                {
                    "type": "word_match",
                    "title": "सही शब्द जोड़ियों का मिलान करें",
                    "pairs": pair_set_1
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[0][1],
                    "targetSentence": sents[0][0],
                    "tokens": sents[0][2]
                },
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[0][0],
                    "tokens": sents[0][2],
                    "audioUrl": ""
                },
                {
                    "type": "cloze_test",
                    "title": "रिक्त स्थान भरें",
                    "sentence": f"{sents[0][0].split()[0]} _______.",
                    "blank": sents[0][0].split()[-1],
                    "translation": sents[0][1],
                    "options": [sents[0][0].split()[-1], words[1][0], words[2][0]]
                },
                {
                    "type": "type_word",
                    "title": "स्पेलिंग लिखें",
                    "prompt": f"'{words[0][1]}' के लिए अंग्रेज़ी शब्द टाइप करें:",
                    "target": words[0][0],
                    "hint": f"संकेत: {words[0][0][0]} से शुरू होता है"
                }
            ]
        ))

        # L2: Expansion & SVO
        pair_set_2 = [{"target": w[0], "native": w[1]} for w in words[4:8]]
        lessons.append(build_lesson(
            1, 2, u_title, "Lesson 2", f"{u_desc}: वाक्य निर्माण", "lesson", 15, 5,
            [
                {
                    "type": "word_match",
                    "title": "शब्दों का मिलान करें",
                    "pairs": pair_set_2
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[1][1],
                    "targetSentence": sents[1][0],
                    "tokens": sents[1][2]
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[2][1],
                    "targetSentence": sents[2][0],
                    "tokens": sents[2][2]
                },
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[1][0],
                    "tokens": sents[1][2],
                    "audioUrl": ""
                },
                {
                    "type": "sprechen",
                    "title": "बोलकर अभ्यास करें",
                    "prompt": speeches[0],
                    "translation": sents[0][1],
                    "minAccuracy": 75,
                    "audioUrl": ""
                }
            ]
        ))

        # L3: Combinations & Compound sentences
        pair_set_3 = [{"target": w[0], "native": w[1]} for w in words[8:12]]
        lessons.append(build_lesson(
            2, 3, u_title, "Lesson 3", f"{u_desc}: संयुक्त वाक्य", "lesson", 15, 5,
            [
                {
                    "type": "word_match",
                    "title": "शब्दों का मिलान करें",
                    "pairs": pair_set_3
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[3][1],
                    "targetSentence": sents[3][0],
                    "tokens": sents[3][2]
                },
                {
                    "type": "cloze_test",
                    "title": "रिक्त स्थान भरें",
                    "sentence": f"{' '.join(sents[3][0].split()[:-1])} _______.",
                    "blank": sents[3][0].split()[-1],
                    "translation": sents[3][1],
                    "options": [sents[3][0].split()[-1], words[0][0], words[5][0]]
                },
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[2][0],
                    "tokens": sents[2][2],
                    "audioUrl": ""
                }
            ]
        ))

        # L4: Listening & Ear Training
        lessons.append(build_lesson(
            3, 4, u_title, "Lesson 4", f"{u_desc}: श्रवण और समझ", "lesson", 20, 5,
            [
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[3][0],
                    "tokens": sents[3][2],
                    "audioUrl": ""
                },
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[4][0],
                    "tokens": sents[4][2],
                    "audioUrl": ""
                },
                {
                    "type": "word_match",
                    "title": "रैपिड मिलान",
                    "pairs": [
                        {"target": words[0][0], "native": words[0][1]},
                        {"target": words[3][0], "native": words[3][1]},
                        {"target": words[6][0], "native": words[6][1]},
                        {"target": words[9][0], "native": words[9][1]}
                    ]
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[4][1],
                    "targetSentence": sents[4][0],
                    "tokens": sents[4][2]
                }
            ]
        ))

        # L5: Daily Context & Expressions
        pair_set_4 = [{"target": w[0], "native": w[1]} for w in words[12:16]]
        lessons.append(build_lesson(
            4, 5, u_title, "Lesson 5", f"{u_desc}: व्यावहारिक प्रयोग", "lesson", 15, 5,
            [
                {
                    "type": "word_match",
                    "title": "शब्दों का मिलान करें",
                    "pairs": pair_set_4
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[5][1],
                    "targetSentence": sents[5][0],
                    "tokens": sents[5][2]
                },
                {
                    "type": "cloze_test",
                    "title": "रिक्त स्थान भरें",
                    "sentence": f"{' '.join(sents[5][0].split()[:-1])} _______.",
                    "blank": sents[5][0].split()[-1],
                    "translation": sents[5][1],
                    "options": [sents[5][0].split()[-1], words[2][0], words[8][0]]
                },
                {
                    "type": "sprechen",
                    "title": "बोलकर अभ्यास करें",
                    "prompt": speeches[1],
                    "translation": sents[6][1] if len(sents) > 6 else sents[0][1],
                    "minAccuracy": 75,
                    "audioUrl": ""
                }
            ]
        ))

        # L6: Treasure Chest 1 (Index 5)
        lessons.append(make_chest(5, 6, u_title, 1, 15, 25))

        # L7: Advanced Sentences & Context
        lessons.append(build_lesson(
            6, 7, u_title, "Lesson 7", f"{u_desc}: विस्तृत वाक्य", "lesson", 15, 5,
            [
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[6][1],
                    "targetSentence": sents[6][0],
                    "tokens": sents[6][2]
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[7][1],
                    "targetSentence": sents[7][0],
                    "tokens": sents[7][2]
                },
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[6][0],
                    "tokens": sents[6][2],
                    "audioUrl": ""
                },
                {
                    "type": "word_match",
                    "title": "शब्दों का मिलान करें",
                    "pairs": [
                        {"target": words[1][0], "native": words[1][1]},
                        {"target": words[4][0], "native": words[4][1]},
                        {"target": words[7][0], "native": words[7][1]},
                        {"target": words[11][0], "native": words[11][1]}
                    ]
                }
            ]
        ))

        # L8: Dialogue & Communication
        lessons.append(build_lesson(
            7, 8, u_title, "Lesson 8", f"{u_desc}: बातचीत और संवाद", "lesson", 20, 5,
            [
                {
                    "type": "dialogue_bubble",
                    "title": "संवाद पूरा करें",
                    "partnerName": dlg["name"],
                    "partnerMessage": dlg["prompt"],
                    "translation": dlg["translation"],
                    "options": dlg["options"]
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[7][1],
                    "targetSentence": sents[7][0],
                    "tokens": sents[7][2]
                },
                {
                    "type": "cloze_test",
                    "title": "रिक्त स्थान भरें",
                    "sentence": f"{' '.join(sents[7][0].split()[:-1])} _______.",
                    "blank": sents[7][0].split()[-1],
                    "translation": sents[7][1],
                    "options": [sents[7][0].split()[-1], words[3][0], words[9][0]]
                }
            ]
        ))

        # L9: Speech & Pronunciation
        lessons.append(build_lesson(
            8, 9, u_title, "Lesson 9", f"{u_desc}: मौखिक उच्चारण अभ्यास", "lesson", 25, 5,
            [
                {
                    "type": "sprechen",
                    "title": "स्पष्ट बोलें",
                    "prompt": speeches[0],
                    "translation": sents[0][1],
                    "minAccuracy": 75,
                    "audioUrl": ""
                },
                {
                    "type": "sprechen",
                    "title": "स्पष्ट बोलें",
                    "prompt": speeches[1],
                    "translation": sents[1][1],
                    "minAccuracy": 75,
                    "audioUrl": ""
                },
                {
                    "type": "sprechen",
                    "title": "स्पष्ट बोलें",
                    "prompt": speeches[2],
                    "translation": sents[2][1],
                    "minAccuracy": 75,
                    "audioUrl": ""
                },
                {
                    "type": "word_match",
                    "title": "शब्द मिलान",
                    "pairs": [
                        {"target": words[2][0], "native": words[2][1]},
                        {"target": words[5][0], "native": words[5][1]},
                        {"target": words[8][0], "native": words[8][1]},
                        {"target": words[13][0], "native": words[13][1]}
                    ]
                }
            ]
        ))

        # L10: Comprehensive Review & Contrast
        lessons.append(build_lesson(
            9, 10, u_title, "Lesson 10", f"{u_desc}: समग्र पुनरावृत्ति", "lesson", 20, 5,
            [
                {
                    "type": "word_match",
                    "title": "5-जोड़ी मिलान",
                    "pairs": [
                        {"target": words[0][0], "native": words[0][1]},
                        {"target": words[3][0], "native": words[3][1]},
                        {"target": words[7][0], "native": words[7][1]},
                        {"target": words[10][0], "native": words[10][1]},
                        {"target": words[14][0], "native": words[14][1]}
                    ]
                },
                {
                    "type": "listen_tap",
                    "title": "सुनिए और टैप करें",
                    "targetSentence": sents[5][0],
                    "tokens": sents[5][2],
                    "audioUrl": ""
                },
                {
                    "type": "sentence_builder",
                    "title": "अंग्रेज़ी वाक्य बनाइए",
                    "prompt": sents[6][1],
                    "targetSentence": sents[6][0],
                    "tokens": sents[6][2]
                },
                {
                    "type": "type_word",
                    "title": "स्पेलिंग टाइप करें",
                    "prompt": f"'{words[1][1]}' के लिए सही शब्द टाइप करें:",
                    "target": words[1][0],
                    "hint": f"संकेत: {words[1][0][0]} से शुरू होता है"
                }
            ]
        ))

        # L11: Treasure Chest 2 (Index 10)
        lessons.append(make_chest(10, 11, u_title, 2, 20, 35))

        # L12: Unit Milestone Boss Exam (Index 11)
        exam_title = f"{u_title} • Milestone Exam" if u_num < 12 else "Section 1 Grand Graduation Boss Exam"
        exam_sub = f"इकाई {u_num} संपूर्ण परीक्षा" if u_num < 12 else "अनुभाग 1 भव्य दीक्षांत परीक्षा (Unlocks Section 2)"
        lessons.append(build_lesson(
            11, 12, u_title, exam_title, exam_sub, "quiz", 35, 10,
            [
                {
                    "type": "word_match",
                    "title": f"इकाई {u_num} मुख्य शब्द परीक्षा",
                    "pairs": [
                        {"target": words[0][0], "native": words[0][1]},
                        {"target": words[2][0], "native": words[2][1]},
                        {"target": words[4][0], "native": words[4][1]},
                        {"target": words[6][0], "native": words[6][1]},
                        {"target": words[8][0], "native": words[8][1]}
                    ]
                },
                {
                    "type": "sentence_builder",
                    "title": "परीक्षा प्रश्न 1: वाक्य अनुवाद",
                    "prompt": sents[3][1],
                    "targetSentence": sents[3][0],
                    "tokens": sents[3][2]
                },
                {
                    "type": "listen_tap",
                    "title": "परीक्षा प्रश्न 2: श्रवण परीक्षण",
                    "targetSentence": sents[7][0],
                    "tokens": sents[7][2],
                    "audioUrl": ""
                },
                {
                    "type": "cloze_test",
                    "title": "परीक्षा प्रश्न 3: रिक्त स्थान",
                    "sentence": f"{' '.join(sents[1][0].split()[:-1])} _______.",
                    "blank": sents[1][0].split()[-1],
                    "translation": sents[1][1],
                    "options": [sents[1][0].split()[-1], words[5][0], words[9][0]]
                },
                {
                    "type": "sprechen",
                    "title": "परीक्षा प्रश्न 4: मौखिक उच्चारण",
                    "prompt": speeches[0],
                    "translation": sents[0][1],
                    "minAccuracy": 80,
                    "audioUrl": ""
                }
            ]
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

    print(f"🚀 Generating Section 1 Curriculum datasets (12 Units x 12 Lessons = 144 Lessons)...")
    units = generate_section_1()
    assert len(units) == 12, f"Expected 12 units, got {len(units)}"

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
            "lessons": unit["lessons"]
        }

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(unit_wrapper, f, ensure_ascii=False, indent=2)

        total_lessons += len(unit["lessons"])
        for l in unit["lessons"]:
            total_stages += len(l["stages"])

        print(f"  ✅ Created Unit {unit['unitNumber']:02d}: {filename} ({len(unit['lessons'])} lessons)")

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
    print(f"  • Total Interactive Stages: {total_stages}")

if __name__ == "__main__":
    main()
