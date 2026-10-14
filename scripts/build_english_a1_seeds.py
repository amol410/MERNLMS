#!/usr/bin/env python3
import json
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, PROJECT_ROOT)

from scripts.data_english_section1 import get_english_section1_units

def build_english_lesson_stages(unit, lIdx, native_code):
    """
    Constructs lesson stages for English learning with native Hindi ('hi') or Marathi ('mr') instruction.
    Zero placeholder distractors, zero carbon-copy matching pairs,
    natural SOV Hindi/Marathi phrasing, and elevated courtesy vocabulary.
    """
    nat_label = "Hindi" if native_code == "hi" else "Marathi"

    if lIdx == 7:
        # Lesson 8: Chest 1
        return []
    elif lIdx == 14:
        # Lesson 15: Chest 2
        return []
    elif lIdx == 0:
        # Lesson 1: Core Foundations (Slice A + Sentence 1)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["en"], "native": v[native_code]} for v in unit["sliceA"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence1"]["en"],
                "tokens": unit["sentence1"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence1'][native_code]}",
                "targetSentence": unit["sentence1"]["en"],
                "tokens": unit["sentence1"]["tokens"]
            }
        ]
    elif lIdx == 1:
        # Lesson 2: Action & Subject (Slice B + Sentence 2)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["en"], "native": v[native_code]} for v in unit["sliceB"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence2"]["en"],
                "tokens": unit["sentence2"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence2'][native_code]}",
                "targetSentence": unit["sentence2"]["en"],
                "tokens": unit["sentence2"]["tokens"]
            }
        ]
    elif lIdx == 2:
        # Lesson 3: Social Polite Formulations (Slice C + Sentence 3)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["en"], "native": v[native_code]} for v in unit["sliceC"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence3"]["en"],
                "tokens": unit["sentence3"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence3'][native_code]}",
                "targetSentence": unit["sentence3"]["en"],
                "tokens": unit["sentence3"]["tokens"]
            }
        ]
    elif lIdx == 3:
        # Lesson 4: Chat Story 1
        chat = unit["chat1"]
        return [
            {
                "type": "dialogue_bubble",
                "title": "Complete the Chat",
                "partnerName": chat["partner"],
                "partnerAvatar": "dolphina",
                "prompt": chat["prompt"],
                "partnerMessage": chat["prompt"],
                "translation": chat[f"{native_code}_trans"],
                "options": [{"text": opt["en"], "isCorrect": (i == 0)} for i, opt in enumerate(chat["options"])],
                "correctOption": chat["options"][0]["en"],
                "correctAnswer": chat["options"][0]["en"],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Fill in the blank",
                "prompt": unit["cloze1"]["prompt"],
                "sentence": unit["cloze1"]["prompt"],
                "translation": unit["cloze1"].get(f"{native_code}_en", ""),
                "blank": unit["cloze1"]["answer"],
                "target": unit["cloze1"]["answer"],
                "correctOption": unit["cloze1"]["answer"],
                "correctAnswer": unit["cloze1"]["answer"],
                "options": unit["cloze1"]["options"],
                "audioUrl": ""
            }
        ]
    elif lIdx == 4:
        # Lesson 5: Grammar & Spelling 1
        tw = unit["typeWord1"]
        return [
            {
                "type": "type_word",
                "title": "Type in English",
                "prompt": tw["prompt"],
                "target": tw["target"],
                "targetWord": tw["target"],
                "word": tw["target"],
                "correctAnswer": tw["target"],
                "translation": tw.get(f"{native_code}_hint", ""),
                "nativeMeaning": tw.get(f"{native_code}_hint", ""),
                "hint": tw.get(f"{native_code}_hint", ""),
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Fill in the blank",
                "prompt": unit["cloze1"]["prompt"],
                "sentence": unit["cloze1"]["prompt"],
                "translation": unit["cloze1"].get(f"{native_code}_en", ""),
                "blank": unit["cloze1"]["answer"],
                "target": unit["cloze1"]["answer"],
                "correctOption": unit["cloze1"]["answer"],
                "correctAnswer": unit["cloze1"]["answer"],
                "options": unit["cloze1"]["options"],
                "audioUrl": ""
            }
        ]
    elif lIdx == 5:
        # Lesson 6: Listening Perception (Sentence 2 meaning with real unit distractors)
        return [
            {
                "type": "listen_select",
                "title": "Listen and choose the meaning",
                "spokenGerman": unit["sentence2"]["en"],
                "sentence": unit["sentence2"]["en"],
                "targetSentence": unit["sentence2"]["en"],
                "question": f"What does '{unit['sentence2']['en']}' mean in {nat_label}?",
                "prompt": f"What does '{unit['sentence2']['en']}' mean in {nat_label}?",
                "options": [
                    {"text": unit["sentence2"][native_code], "isCorrect": True},
                    {"text": unit["sentence1"][native_code], "isCorrect": False},
                    {"text": unit["sentence3"][native_code], "isCorrect": False}
                ],
                "correctOption": unit["sentence2"][native_code],
                "correctAnswer": unit["sentence2"][native_code],
                "audioUrl": ""
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence3"]["en"],
                "tokens": unit["sentence3"]["tokens"],
                "audioUrl": ""
            }
        ]
    elif lIdx == 6:
        # Lesson 7: Pronunciation Foundation
        return [
            {
                "type": "sprechen",
                "title": "Speak in English",
                "prompt": unit["sentence1"]["en"],
                "translation": unit["sentence1"][native_code],
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceA"][0]["en"], "native": unit["sliceA"][0][native_code]},
                    {"target": unit["sliceA"][1]["en"], "native": unit["sliceA"][1][native_code]},
                    {"target": unit["sliceB"][0]["en"], "native": unit["sliceB"][0][native_code]},
                    {"target": unit["sliceB"][1]["en"], "native": unit["sliceB"][1][native_code]}
                ]
            }
        ]
    elif lIdx == 8:
        # Lesson 9: Vocab Expansion (Slice D + Sentence 4)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["en"], "native": v[native_code]} for v in unit["sliceD"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence4"]["en"],
                "tokens": unit["sentence4"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence4'][native_code]}",
                "targetSentence": unit["sentence4"]["en"],
                "tokens": unit["sentence4"]["tokens"]
            }
        ]
    elif lIdx == 9:
        # Lesson 10: Grammar & Spelling 2
        tw = unit["typeWord2"]
        return [
            {
                "type": "type_word",
                "title": "Type in English",
                "prompt": tw["prompt"],
                "target": tw["target"],
                "targetWord": tw["target"],
                "word": tw["target"],
                "correctAnswer": tw["target"],
                "translation": tw.get(f"{native_code}_hint", ""),
                "nativeMeaning": tw.get(f"{native_code}_hint", ""),
                "hint": tw.get(f"{native_code}_hint", ""),
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Fill in the blank",
                "prompt": unit["cloze2"]["prompt"],
                "sentence": unit["cloze2"]["prompt"],
                "translation": unit["cloze2"].get(f"{native_code}_en", ""),
                "blank": unit["cloze2"]["answer"],
                "target": unit["cloze2"]["answer"],
                "correctOption": unit["cloze2"]["answer"],
                "correctAnswer": unit["cloze2"]["answer"],
                "options": unit["cloze2"]["options"],
                "audioUrl": ""
            }
        ]
    elif lIdx == 10:
        # Lesson 11: Sentence Synthesis (Sentence 5 + review pairs)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceB"][0]["en"], "native": unit["sliceB"][0][native_code]},
                    {"target": unit["sliceB"][2]["en"], "native": unit["sliceB"][2][native_code]},
                    {"target": unit["sliceD"][0]["en"], "native": unit["sliceD"][0][native_code]},
                    {"target": unit["sliceD"][2]["en"], "native": unit["sliceD"][2][native_code]}
                ]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence5"]["en"],
                "tokens": unit["sentence5"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence5'][native_code]}",
                "targetSentence": unit["sentence5"]["en"],
                "tokens": unit["sentence5"]["tokens"]
            }
        ]
    elif lIdx == 11:
        # Lesson 12: Chat Story 2
        chat = unit["chat2"]
        return [
            {
                "type": "dialogue_bubble",
                "title": "Messenger Roleplay",
                "partnerName": chat["partner"],
                "partnerAvatar": "dolphino",
                "prompt": chat["prompt"],
                "partnerMessage": chat["prompt"],
                "translation": chat[f"{native_code}_trans"],
                "options": [{"text": opt["en"], "isCorrect": (i == 0)} for i, opt in enumerate(chat["options"])],
                "correctOption": chat["options"][0]["en"],
                "correctAnswer": chat["options"][0]["en"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence6'][native_code]}",
                "targetSentence": unit["sentence6"]["en"],
                "tokens": unit["sentence6"]["tokens"]
            }
        ]
    elif lIdx == 12:
        # Lesson 13: Spaced Review & Retention
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceA"][0]["en"], "native": unit["sliceA"][0][native_code]},
                    {"target": unit["sliceB"][1]["en"], "native": unit["sliceB"][1][native_code]},
                    {"target": unit["sliceC"][0]["en"], "native": unit["sliceC"][0][native_code]},
                    {"target": unit["sliceD"][1]["en"], "native": unit["sliceD"][1][native_code]}
                ]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence6"]["en"],
                "tokens": unit["sentence6"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the English sentence",
                "prompt": f"Translate: {unit['sentence4'][native_code]}",
                "targetSentence": unit["sentence4"]["en"],
                "tokens": unit["sentence4"]["tokens"]
            }
        ]
    elif lIdx == 13:
        # Lesson 14: Pronunciation Sprint
        return [
            {
                "type": "sprechen",
                "title": "Speak in English",
                "prompt": unit["sentence5"]["en"],
                "translation": unit["sentence5"][native_code],
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceA"][1]["en"], "native": unit["sliceA"][1][native_code]},
                    {"target": unit["sliceB"][0]["en"], "native": unit["sliceB"][0][native_code]},
                    {"target": unit["sliceC"][1]["en"], "native": unit["sliceC"][1][native_code]},
                    {"target": unit["sliceD"][0]["en"], "native": unit["sliceD"][0][native_code]}
                ]
            }
        ]
    elif lIdx == 15:
        # Lesson 16: Unit Trophy Exam
        return [
            {
                "type": "sentence_builder",
                "title": "Boss Challenge: Sentence Assembly",
                "prompt": f"Translate: {unit['sentence5'][native_code]}",
                "targetSentence": unit["sentence5"]["en"],
                "tokens": unit["sentence5"]["tokens"]
            },
            {
                "type": "sprechen",
                "title": "Boss Challenge: Clear Speech",
                "prompt": unit["sentence6"]["en"],
                "translation": unit["sentence6"][native_code],
                "minAccuracy": 80,
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Boss Challenge: Syntax Mastery",
                "prompt": unit["cloze2"]["prompt"],
                "sentence": unit["cloze2"]["prompt"],
                "translation": unit["cloze2"].get(f"{native_code}_en", ""),
                "blank": unit["cloze2"]["answer"],
                "target": unit["cloze2"]["answer"],
                "correctOption": unit["cloze2"]["answer"],
                "correctAnswer": unit["cloze2"]["answer"],
                "options": unit["cloze2"]["options"],
                "audioUrl": ""
            },
            {
                "type": "listen_select",
                "title": "Boss Challenge: Audio Perception",
                "spokenGerman": unit["sentence5"]["en"],
                "sentence": unit["sentence5"]["en"],
                "targetSentence": unit["sentence5"]["en"],
                "question": f"What does '{unit['sentence5']['en']}' mean in {nat_label}?",
                "prompt": f"What does '{unit['sentence5']['en']}' mean in {nat_label}?",
                "options": [
                    {"text": unit["sentence5"][native_code], "isCorrect": True},
                    {"text": unit["sentence4"][native_code], "isCorrect": False},
                    {"text": unit["sentence6"][native_code], "isCorrect": False}
                ],
                "correctOption": unit["sentence5"][native_code],
                "correctAnswer": unit["sentence5"][native_code],
                "audioUrl": ""
            }
        ]
    return []

def escape_sql_str(val):
    if val is None:
        return "NULL"
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def generate_english_sql(units, title, native_code, delete_where):
    header = f"""-- ==============================================================
-- DolphinCoder LMS: {title}
-- Language: English (Target) | Native: {'Hindi' if native_code == 'hi' else 'Marathi'}
-- Compatible with Hostinger phpMyAdmin (MySQL / MariaDB)
-- Table: `CurriculumLessons`
-- ==============================================================

{delete_where}

"""
    batch_size = 50
    current_values = []
    insert_batches = []

    for unit in units:
        unit_desc = unit["unitDescription"]
        for l in unit["lessonsData"]:
            stages_json = json.dumps(l["stages"] or [], ensure_ascii=False)
            stages_sql = escape_sql_str(stages_json)
            node_type_val = "lesson" if l["nodeType"] == "boss" else (l["nodeType"] or "lesson")

            row = (
                f"(1, 'en', '{native_code}', 'A1', {unit['unitNumber']}, {escape_sql_str(unit['unitTitle'])}, "
                f"{escape_sql_str(unit_desc)}, {l['lessonIndex']}, {escape_sql_str(l['title'])}, "
                f"{escape_sql_str(l['subtitle'])}, '{node_type_val}', {l.get('xpReward', 15)}, "
                f"{l.get('pearlsReward', 5)}, 1, {stages_sql}, NULL, NULL, NOW(), NOW())"
            )
            current_values.append(row)

            if len(current_values) >= batch_size:
                sql_block = (
                    "INSERT INTO `CurriculumLessons` (`owner`, `learningLanguage`, `nativeLanguage`, `level`, "
                    "`unitNumber`, `unitTitle`, `unitDescription`, `lessonIndex`, `title`, `subtitle`, `nodeType`, "
                    "`xpReward`, `pearlsReward`, `isLive`, `stages`, `karaokeData`, `audioUrl`, `createdAt`, `updatedAt`) VALUES\n"
                    + ",\n".join(current_values)
                    + ";"
                )
                insert_batches.append(sql_block)
                current_values = []

    if current_values:
        sql_block = (
            "INSERT INTO `CurriculumLessons` (`owner`, `learningLanguage`, `nativeLanguage`, `level`, "
            "`unitNumber`, `unitTitle`, `unitDescription`, `lessonIndex`, `title`, `subtitle`, `nodeType`, "
            "`xpReward`, `pearlsReward`, `isLive`, `stages`, `karaokeData`, `audioUrl`, `createdAt`, `updatedAt`) VALUES\n"
            + ",\n".join(current_values)
            + ";"
        )
        insert_batches.append(sql_block)

    return header + "\n\n".join(insert_batches) + "\n"

def compile_curriculum_for_native(raw_units, native_code):
    full_units_data = []
    global_lesson_index = 0

    section_titles = {
        1: "Section 1: Rookie (A1 Foundation)",
        2: "Section 2: Explorer (A1 Elementary)",
        3: "Section 3: Traveler (A1 Proficiency)"
    }

    for unit in raw_units:
        sec_title = section_titles.get(unit["sec"], f"Section {unit['sec']}")
        sec_unit_num = ((unit["num"] - 1) % 35) + 1

        lessons_data = []
        for lIdx in range(16):
            node_type = "lesson"
            xp_reward = 15
            pearls_reward = 5

            if lIdx == 7:
                node_type = "chest"
                title = f"{unit['en_title']} • Treasure Chest 1"
                subtitle = "Bonus 25 Pearls & 15 XP"
                xp_reward = 15
                pearls_reward = 25
            elif lIdx == 14:
                node_type = "chest"
                title = f"{unit['en_title']} • Treasure Chest 2"
                subtitle = "Bonus 35 Pearls & 20 XP"
                xp_reward = 20
                pearls_reward = 35
            elif lIdx == 3:
                title = f"Chat Story 1: {unit['chat1']['partner']}"
                subtitle = "Interactive conversation partner"
                xp_reward = 20
            elif lIdx == 4:
                title = "Grammar & Spelling (Part 1)"
                subtitle = "Spelling accuracy & syntax"
                xp_reward = 20
            elif lIdx == 5:
                title = "Listening: Audio Focus"
                subtitle = "Ear training & speech perception"
                xp_reward = 20
            elif lIdx == 6:
                title = "Pronunciation & Speech (Foundation)"
                subtitle = "Voice recording & pronunciation feedback"
                xp_reward = 25
            elif lIdx == 9:
                title = "Grammar & Spelling (Part 2)"
                subtitle = "Conjugation & grammar check"
                xp_reward = 20
            elif lIdx == 11:
                title = "Chat Story 2: Daily Conversation"
                subtitle = "Real-life conversational roleplay"
                xp_reward = 20
            elif lIdx == 13:
                title = "Pronunciation & Speech (Sprint)"
                subtitle = "Voice recording & speech fluency"
                xp_reward = 25
            elif lIdx == 15:
                title = f"🏆 Unit Trophy Exam: {unit['en_title']}"
                subtitle = f"Grand mastery challenge to clear Unit {unit['num']}"
                xp_reward = 35
                pearls_reward = 15
            else:
                title = f"{unit['en_title']} • Lesson {lIdx + 1}"
                subtitle = f"Stepping stone {lIdx + 1} of 16"

            stages = build_english_lesson_stages(unit, lIdx, native_code)

            lessons_data.append({
                "lessonIndex": global_lesson_index,
                "unitLessonNum": lIdx + 1,
                "title": title,
                "subtitle": subtitle,
                "nodeType": node_type,
                "xpReward": xp_reward,
                "pearlsReward": pearls_reward,
                "stages": stages
            })
            global_lesson_index += 1

        unit_desc = unit["hi_title"] if native_code == "hi" else unit["mr_title"]

        full_units_data.append({
            "sectionNumber": unit["sec"],
            "sectionTitle": sec_title,
            "sectionUnitNumber": sec_unit_num,
            "unitNumber": unit["num"],
            "unitTitle": unit["en_title"],
            "unitDescription": unit_desc,
            "accentColor": unit["color"],
            "lessonsCount": len(lessons_data),
            "lessonsData": lessons_data
        })

    return full_units_data

def main():
    print("🚀 Gathering English A1 curriculum data for Section 1...")
    raw_units = get_english_section1_units()
    print(f"Loaded {len(raw_units)} raw units.")

    for native_code, native_name in [("hi", "Hindi"), ("mr", "Marathi")]:
        print(f"\n📦 Compiling English A1 with native instruction: {native_name} ({native_code})...")
        units_data = compile_curriculum_for_native(raw_units, native_code)
        total_lessons = sum(u["lessonsCount"] for u in units_data)
        print(f"  Total compiled lessons: {total_lessons}")

        # 1. Output JSON
        json_filename = f"english_a1_{'hindi' if native_code == 'hi' else 'marathi'}.json"
        json_path = os.path.join(PROJECT_ROOT, json_filename)
        json_output = {
            "courseTitle": f"English A1 Comprehensive Curriculum (For {native_name} Speakers)",
            "learningLanguage": "en",
            "nativeLanguage": native_code,
            "level": "A1",
            "totalSections": 1,
            "totalUnits": len(units_data),
            "totalLessons": total_lessons,
            "generatedAt": "2026-10-14T00:00:00Z",
            "units": units_data
        }
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(json_output, f, ensure_ascii=False, indent=2)
        print(f"  ✅ Written {json_path}")

        # 2. Section 1 SQL
        sec1_filename = f"seed_en_{native_code}_section1.sql"
        sec1_path = os.path.join(PROJECT_ROOT, sec1_filename)
        sec1_sql = generate_english_sql(
            units_data,
            f"English A1 Section 1: Rookie Seed (Units 1 to 35, {total_lessons} Lessons) - {native_name}",
            native_code,
            f"DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'en' AND `nativeLanguage` = '{native_code}' AND `level` = 'A1' AND `unitNumber` BETWEEN 1 AND 35;"
        )
        with open(sec1_path, "w", encoding="utf-8") as f:
            f.write(sec1_sql)
        print(f"  ✅ Written {sec1_path}")

        # 3. Master SQL
        master_filename = f"seed_english_a1_{'hindi' if native_code == 'hi' else 'marathi'}.sql"
        master_path = os.path.join(PROJECT_ROOT, master_filename)
        master_sql = generate_english_sql(
            units_data,
            f"English A1 Master Curriculum Database Seed ({native_name} Native)",
            native_code,
            f"DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'en' AND `nativeLanguage` = '{native_code}' AND `level` = 'A1';"
        )
        with open(master_path, "w", encoding="utf-8") as f:
            f.write(master_sql)
        print(f"  ✅ Written {master_path}")

    print("\n🎉 Complete English A1 (Hindi & Marathi) generation succeeded!")

if __name__ == "__main__":
    main()
