#!/usr/bin/env python3
import json
import os
import sys

# Ensure scripts dir is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
sys.path.insert(0, PROJECT_ROOT)

from scripts.data_section1 import get_section1_units
from scripts.data_section2 import get_section2_units
from scripts.data_section3 import get_section3_units

def build_lesson_stages(unit, lIdx):
    """
    Construct stages according to planlesson.md:
    Zero placeholder distractors, zero carbon-copy matching pairs,
    beginner-friendly progression, and spaced review.
    """
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
                "pairs": [{"target": v["de"], "native": v["en"]} for v in unit["sliceA"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence1"]["de"],
                "tokens": unit["sentence1"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence1']['en']}",
                "targetSentence": unit["sentence1"]["de"],
                "tokens": unit["sentence1"]["tokens"]
            }
        ]
    elif lIdx == 1:
        # Lesson 2: Action & Subject (Slice B + Sentence 2)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["de"], "native": v["en"]} for v in unit["sliceB"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence2"]["de"],
                "tokens": unit["sentence2"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence2']['en']}",
                "targetSentence": unit["sentence2"]["de"],
                "tokens": unit["sentence2"]["tokens"]
            }
        ]
    elif lIdx == 2:
        # Lesson 3: Social Polite Formulations (Slice C + Sentence 3)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["de"], "native": v["en"]} for v in unit["sliceC"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence3"]["de"],
                "tokens": unit["sentence3"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence3']['en']}",
                "targetSentence": unit["sentence3"]["de"],
                "tokens": unit["sentence3"]["tokens"]
            }
        ]
    elif lIdx == 3:
        # Lesson 4: Chat Story 1 (Beginner Single-turn Exchange)
        return [
            {
                "type": "dialogue_bubble",
                "title": "Complete the Chat",
                "partnerName": unit["chat1"]["partner"],
                "partnerAvatar": "dolphina",
                "prompt": unit["chat1"]["prompt"],
                "partnerMessage": unit["chat1"]["prompt"],
                "translation": unit["chat1"]["translation"],
                "options": [{"text": opt, "isCorrect": (i == 0)} for i, opt in enumerate(unit["chat1"]["options"])],
                "correctOption": unit["chat1"]["options"][0],
                "correctAnswer": unit["chat1"]["options"][0],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Fill in the blank",
                "prompt": unit["cloze1"]["prompt"],
                "sentence": unit["cloze1"]["prompt"],
                "translation": unit["cloze1"]["en"],
                "blank": unit["cloze1"]["answer"],
                "target": unit["cloze1"]["answer"],
                "correctOption": unit["cloze1"]["answer"],
                "correctAnswer": unit["cloze1"]["answer"],
                "options": unit["cloze1"]["options"],
                "audioUrl": ""
            }
        ]
    elif lIdx == 4:
        # Lesson 5: Grammar & Spelling 1 (Umlaut entry + Cloze)
        return [
            {
                "type": "type_word",
                "title": "Type in German",
                "prompt": unit["typeWord1"]["prompt"],
                "target": unit["typeWord1"]["target"],
                "targetWord": unit["typeWord1"]["target"],
                "word": unit["typeWord1"]["target"],
                "correctAnswer": unit["typeWord1"]["target"],
                "translation": unit["typeWord1"]["hint"],
                "nativeMeaning": unit["typeWord1"]["hint"],
                "hint": unit["typeWord1"]["hint"],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Fill in the blank",
                "prompt": unit["cloze1"]["prompt"],
                "sentence": unit["cloze1"]["prompt"],
                "translation": unit["cloze1"]["en"],
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
                "spokenGerman": unit["sentence2"]["de"],
                "sentence": unit["sentence2"]["de"],
                "targetSentence": unit["sentence2"]["de"],
                "question": f"What does '{unit['sentence2']['de']}' mean in English?",
                "prompt": f"What does '{unit['sentence2']['de']}' mean in English?",
                "options": [
                    {"text": unit["sentence2"]["en"], "isCorrect": True},
                    {"text": unit["sentence1"]["en"], "isCorrect": False},
                    {"text": unit["sentence3"]["en"], "isCorrect": False}
                ],
                "correctOption": unit["sentence2"]["en"],
                "correctAnswer": unit["sentence2"]["en"],
                "audioUrl": ""
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence3"]["de"],
                "tokens": unit["sentence3"]["tokens"],
                "audioUrl": ""
            }
        ]
    elif lIdx == 6:
        # Lesson 7: Pronunciation Foundation (Sprechen Sentence 1 + Review A&B)
        return [
            {
                "type": "sprechen",
                "title": "Pronounce Auf Deutsch",
                "prompt": unit["sentence1"]["de"],
                "translation": unit["sentence1"]["en"],
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceA"][0]["de"], "native": unit["sliceA"][0]["en"]},
                    {"target": unit["sliceA"][1]["de"], "native": unit["sliceA"][1]["en"]},
                    {"target": unit["sliceB"][0]["de"], "native": unit["sliceB"][0]["en"]},
                    {"target": unit["sliceB"][1]["de"], "native": unit["sliceB"][1]["en"]}
                ]
            }
        ]
    elif lIdx == 8:
        # Lesson 9: Vocab Expansion (Slice D + Sentence 4)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [{"target": v["de"], "native": v["en"]} for v in unit["sliceD"]]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence4"]["de"],
                "tokens": unit["sentence4"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence4']['en']}",
                "targetSentence": unit["sentence4"]["de"],
                "tokens": unit["sentence4"]["tokens"]
            }
        ]
    elif lIdx == 9:
        # Lesson 10: Grammar & Spelling 2 (typeWord2 + cloze2)
        return [
            {
                "type": "type_word",
                "title": "Type in German",
                "prompt": unit["typeWord2"]["prompt"],
                "target": unit["typeWord2"]["target"],
                "targetWord": unit["typeWord2"]["target"],
                "word": unit["typeWord2"]["target"],
                "correctAnswer": unit["typeWord2"]["target"],
                "translation": unit["typeWord2"]["hint"],
                "nativeMeaning": unit["typeWord2"]["hint"],
                "hint": unit["typeWord2"]["hint"],
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Fill in the blank",
                "prompt": unit["cloze2"]["prompt"],
                "sentence": unit["cloze2"]["prompt"],
                "translation": unit["cloze2"]["en"],
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
                    {"target": unit["sliceB"][0]["de"], "native": unit["sliceB"][0]["en"]},
                    {"target": unit["sliceB"][2]["de"], "native": unit["sliceB"][2]["en"]},
                    {"target": unit["sliceD"][0]["de"], "native": unit["sliceD"][0]["en"]},
                    {"target": unit["sliceD"][2]["de"], "native": unit["sliceD"][2]["en"]}
                ]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence5"]["de"],
                "tokens": unit["sentence5"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence5']['en']}",
                "targetSentence": unit["sentence5"]["de"],
                "tokens": unit["sentence5"]["tokens"]
            }
        ]
    elif lIdx == 11:
        # Lesson 12: Chat Story 2 (Follow-up roleplay + Sentence 6)
        return [
            {
                "type": "dialogue_bubble",
                "title": "Messenger Roleplay",
                "partnerName": unit["chat2"]["partner"],
                "partnerAvatar": "dolphino",
                "prompt": unit["chat2"]["prompt"],
                "partnerMessage": unit["chat2"]["prompt"],
                "translation": unit["chat2"]["translation"],
                "options": [{"text": opt, "isCorrect": (i == 0)} for i, opt in enumerate(unit["chat2"]["options"])],
                "correctOption": unit["chat2"]["options"][0],
                "correctAnswer": unit["chat2"]["options"][0],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence6']['en']}",
                "targetSentence": unit["sentence6"]["de"],
                "tokens": unit["sentence6"]["tokens"]
            }
        ]
    elif lIdx == 12:
        # Lesson 13: Spaced Review & Retention (Cross-slice pairs + Sentence 6 tap + Sentence 4 builder)
        return [
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceA"][0]["de"], "native": unit["sliceA"][0]["en"]},
                    {"target": unit["sliceB"][1]["de"], "native": unit["sliceB"][1]["en"]},
                    {"target": unit["sliceC"][0]["de"], "native": unit["sliceC"][0]["en"]},
                    {"target": unit["sliceD"][1]["de"], "native": unit["sliceD"][1]["en"]}
                ]
            },
            {
                "type": "listen_tap",
                "title": "Listen and tap what you hear",
                "targetSentence": unit["sentence6"]["de"],
                "tokens": unit["sentence6"]["tokens"],
                "audioUrl": ""
            },
            {
                "type": "sentence_builder",
                "title": "Construct the German sentence",
                "prompt": f"Translate: {unit['sentence4']['en']}",
                "targetSentence": unit["sentence4"]["de"],
                "tokens": unit["sentence4"]["tokens"]
            }
        ]
    elif lIdx == 13:
        # Lesson 14: Pronunciation Sprint (Sprechen Sentence 5 + Review pairs)
        return [
            {
                "type": "sprechen",
                "title": "Pronounce Auf Deutsch",
                "prompt": unit["sentence5"]["de"],
                "translation": unit["sentence5"]["en"],
                "minAccuracy": 75,
                "audioUrl": ""
            },
            {
                "type": "word_match",
                "title": "Match the word pairs",
                "pairs": [
                    {"target": unit["sliceA"][1]["de"], "native": unit["sliceA"][1]["en"]},
                    {"target": unit["sliceB"][0]["de"], "native": unit["sliceB"][0]["en"]},
                    {"target": unit["sliceC"][1]["de"], "native": unit["sliceC"][1]["en"]},
                    {"target": unit["sliceD"][0]["de"], "native": unit["sliceD"][0]["en"]}
                ]
            }
        ]
    elif lIdx == 15:
        # Lesson 16: Unit Trophy Exam (Synthesis of unit mastery)
        return [
            {
                "type": "sentence_builder",
                "title": "Boss Challenge: Sentence Assembly",
                "prompt": f"Translate: {unit['sentence5']['en']}",
                "targetSentence": unit["sentence5"]["de"],
                "tokens": unit["sentence5"]["tokens"]
            },
            {
                "type": "sprechen",
                "title": "Boss Challenge: Clear Speech",
                "prompt": unit["sentence6"]["de"],
                "translation": unit["sentence6"]["en"],
                "minAccuracy": 80,
                "audioUrl": ""
            },
            {
                "type": "cloze_test",
                "title": "Boss Challenge: Syntax Mastery",
                "prompt": unit["cloze2"]["prompt"],
                "sentence": unit["cloze2"]["prompt"],
                "translation": unit["cloze2"]["en"],
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
                "spokenGerman": unit["sentence5"]["de"],
                "sentence": unit["sentence5"]["de"],
                "targetSentence": unit["sentence5"]["de"],
                "question": f"What does '{unit['sentence5']['de']}' mean in English?",
                "prompt": f"What does '{unit['sentence5']['de']}' mean in English?",
                "options": [
                    {"text": unit["sentence5"]["en"], "isCorrect": True},
                    {"text": unit["sentence4"]["en"], "isCorrect": False},
                    {"text": unit["sentence6"]["en"], "isCorrect": False}
                ],
                "correctOption": unit["sentence5"]["en"],
                "correctAnswer": unit["sentence5"]["en"],
                "audioUrl": ""
            }
        ]
    return []

def escape_sql_str(val):
    if val is None:
        return "NULL"
    # Escaping single quotes with two single quotes for MySQL/MariaDB
    escaped = str(val).replace("'", "''")
    return f"'{escaped}'"

def generate_sql_file(units, title, delete_where):
    header = f"""-- ==============================================================
-- DolphinCoder LMS: {title}
-- Compatible with Hostinger phpMyAdmin (MySQL / MariaDB)
-- Table: `CurriculumLessons`
-- ==============================================================

{delete_where}

"""
    batch_size = 50
    current_values = []
    insert_batches = []

    for unit in units:
        for l in unit["lessonsData"]:
            stages_json = json.dumps(l["stages"] or [], ensure_ascii=False)
            stages_sql = escape_sql_str(stages_json)
            node_type_val = "lesson" if l["nodeType"] == "boss" else (l["nodeType"] or "lesson")

            row = (
                f"(1, 'de', 'en', 'A1', {unit['unitNumber']}, {escape_sql_str(unit['unitTitle'])}, "
                f"{escape_sql_str(unit['unitDescription'])}, {l['lessonIndex']}, {escape_sql_str(l['title'])}, "
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

def main():
    print("🚀 Gathering curriculum data across all 3 sections...")
    sec1_raw = get_section1_units()
    sec2_raw = get_section2_units()
    sec3_raw = get_section3_units()

    all_raw_units = sec1_raw + sec2_raw + sec3_raw
    print(f"Total units loaded: {len(all_raw_units)}")
    assert len(all_raw_units) == 105, f"Expected 105 units, got {len(all_raw_units)}"

    section_titles = {
        1: "Section 1: Rookie (A1 Foundation)",
        2: "Section 2: Explorer (A1 Elementary)",
        3: "Section 3: Traveler (A1 Proficiency)"
    }

    full_units_data = []
    global_lesson_index = 0

    for unit in all_raw_units:
        sec_title = section_titles.get(unit["sec"], f"Section {unit['sec']}")
        sec_unit_num = ((unit["num"] - 1) % 35) + 1

        lessons_data = []
        for lIdx in range(16):
            node_type = "lesson"
            xp_reward = 15
            pearls_reward = 5

            if lIdx == 7:
                node_type = "chest"
                title = f"{unit['en']} • Treasure Chest 1"
                subtitle = "Bonus 25 Pearls & 15 XP"
                xp_reward = 15
                pearls_reward = 25
            elif lIdx == 14:
                node_type = "chest"
                title = f"{unit['en']} • Treasure Chest 2"
                subtitle = "Bonus 35 Pearls & 20 XP"
                xp_reward = 20
                pearls_reward = 35
            elif lIdx == 3:
                title = f"Chat Story 1: {unit['chat1']['partner']}"
                subtitle = "Interactive conversation partner"
                xp_reward = 20
            elif lIdx == 4:
                title = "Grammar & Spelling (Part 1)"
                subtitle = "Umlaut precision & spelling rules"
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
                title = f"🏆 Unit Trophy Exam: {unit['en']}"
                subtitle = f"Grand mastery challenge to clear Unit {unit['num']}"
                xp_reward = 35
                pearls_reward = 15
            else:
                title = f"{unit['en']} • Lesson {lIdx + 1}"
                subtitle = f"Stepping stone {lIdx + 1} of 16"

            stages = build_lesson_stages(unit, lIdx)

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

        full_units_data.append({
            "sectionNumber": unit["sec"],
            "sectionTitle": sec_title,
            "sectionUnitNumber": sec_unit_num,
            "unitNumber": unit["num"],
            "unitTitle": unit["en"],
            "unitDescription": unit["de"],
            "accentColor": unit["color"],
            "lessonsCount": len(lessons_data),
            "lessonsData": lessons_data
        })

    total_lessons = sum(u["lessonsCount"] for u in full_units_data)
    print(f"Total compiled lessons: {total_lessons}")
    assert total_lessons == 1680, f"Expected 1,680 lessons, got {total_lessons}"

    # 1. Output JSON
    json_path = os.path.join(PROJECT_ROOT, "german_a1.json")
    json_output = {
        "courseTitle": "German A1 Comprehensive Curriculum (Pedagogical Non-Redundant Edition)",
        "learningLanguage": "de",
        "nativeLanguage": "en",
        "level": "A1",
        "totalSections": 3,
        "totalUnits": len(full_units_data),
        "totalLessons": total_lessons,
        "generatedAt": "2026-10-14T00:00:00Z",
        "units": full_units_data
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_output, f, ensure_ascii=False, indent=2)
    print(f"✅ Written {json_path}")

    # 2. Section 1 SQL
    sec1_units = [u for u in full_units_data if 1 <= u["unitNumber"] <= 35]
    sec1_sql = generate_sql_file(
        sec1_units,
        "German A1 Section 1: Rookie Seed (Units 1 to 35, 560 Lessons)",
        "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1' AND `unitNumber` BETWEEN 1 AND 35;"
    )
    sec1_path = os.path.join(PROJECT_ROOT, "seed_section1.sql")
    with open(sec1_path, "w", encoding="utf-8") as f:
        f.write(sec1_sql)
    print(f"✅ Written {sec1_path} ({len(sec1_units)} units, {sum(u['lessonsCount'] for u in sec1_units)} lessons)")

    # 3. Section 2 SQL
    sec2_units = [u for u in full_units_data if 36 <= u["unitNumber"] <= 70]
    sec2_sql = generate_sql_file(
        sec2_units,
        "German A1 Section 2: Explorer Seed (Units 36 to 70, 560 Lessons)",
        "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1' AND `unitNumber` BETWEEN 36 AND 70;"
    )
    sec2_path = os.path.join(PROJECT_ROOT, "seed_section2.sql")
    with open(sec2_path, "w", encoding="utf-8") as f:
        f.write(sec2_sql)
    print(f"✅ Written {sec2_path} ({len(sec2_units)} units, {sum(u['lessonsCount'] for u in sec2_units)} lessons)")

    # 4. Section 3 SQL
    sec3_units = [u for u in full_units_data if 71 <= u["unitNumber"] <= 105]
    sec3_sql = generate_sql_file(
        sec3_units,
        "German A1 Section 3: Traveler Seed (Units 71 to 105, 560 Lessons)",
        "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1' AND `unitNumber` BETWEEN 71 AND 105;"
    )
    sec3_path = os.path.join(PROJECT_ROOT, "seed_section3.sql")
    with open(sec3_path, "w", encoding="utf-8") as f:
        f.write(sec3_sql)
    print(f"✅ Written {sec3_path} ({len(sec3_units)} units, {sum(u['lessonsCount'] for u in sec3_units)} lessons)")

    # 5. Master Seed SQL
    master_sql = generate_sql_file(
        full_units_data,
        "German A1 Master Curriculum Database Seed (Units 1 to 105, 1680 Lessons)",
        "DELETE FROM `CurriculumLessons` WHERE `learningLanguage` = 'de' AND `level` = 'A1';"
    )
    master_path = os.path.join(PROJECT_ROOT, "seed_german_a1.sql")
    with open(master_path, "w", encoding="utf-8") as f:
        f.write(master_sql)
    print(f"✅ Written {master_path} (105 units, {total_lessons} lessons)")

    print("\n🎉 Complete curriculum build succeeded with 0 errors!")

if __name__ == "__main__":
    main()
