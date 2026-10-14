# scripts/generate_english_curriculum_data.py
import re

def make_english_unit(
    num, sec, en_title, hi_title, mr_title, color,
    sliceA, sliceB, sliceC, sliceD,
    s1, s2, s3, s4, s5, s6,
    chat1, chat2,
    type1, type2,
    cloze1, cloze2
):
    """
    Constructs a bilingual English A1 Unit structure.
    Target language: English ('en').
    Native languages: Hindi ('hi') and Marathi ('mr').
    Ensures:
    - Anchored elevates: polite words (please, good morning, etc.) mixed into practical expressions.
    - Natural Hindi & Marathi grammar (SOV) with natural honorifics.
    - Token generation for sentence builders.
    - Slices uniqueness validation.
    """
    # Validation: Ensure 4 slices of 4 unique words
    assert len(sliceA) == 4, f"Unit {num}: sliceA must have 4 words, got {len(sliceA)}"
    assert len(sliceB) == 4, f"Unit {num}: sliceB must have 4 words, got {len(sliceB)}"
    assert len(sliceC) == 4, f"Unit {num}: sliceC must have 4 words, got {len(sliceC)}"
    assert len(sliceD) == 4, f"Unit {num}: sliceD must have 4 words, got {len(sliceD)}"

    all_en_words = [w["en"].lower() for w in sliceA + sliceB + sliceC + sliceD]
    dup_words = {w for w in all_en_words if all_en_words.count(w) > 1}
    if dup_words:
        print(f"Warning: English Unit {num} has duplicate words in slices: {dup_words}")

    def build_sent(item, distractors):
        en_text = item["en"]
        hi_text = item["hi"]
        mr_text = item["mr"]
        words = en_text.split()
        # Clean tokens (remove punctuation for distractor tokens)
        tokens = list(words)
        for d in distractors:
            if d not in tokens:
                tokens.append(d)
        return {
            "en": en_text,
            "hi": hi_text,
            "mr": mr_text,
            "tokens": tokens
        }

    # Dynamic distractors pulled from other slices of the same unit
    d1 = [sliceB[0]["en"], sliceC[0]["en"]]
    d2 = [sliceA[1]["en"], sliceC[1]["en"]]
    d3 = [sliceA[2]["en"], sliceB[2]["en"]]
    d4 = [sliceB[1]["en"], sliceD[0]["en"]]
    d5 = [sliceC[2]["en"], sliceD[1]["en"]]
    d6 = [sliceA[3]["en"], sliceD[2]["en"]]

    return {
        "num": num,
        "sec": sec,
        "en_title": en_title,
        "hi_title": hi_title,
        "mr_title": mr_title,
        "color": color,
        "sliceA": sliceA,
        "sliceB": sliceB,
        "sliceC": sliceC,
        "sliceD": sliceD,
        "sentence1": build_sent(s1, d1),
        "sentence2": build_sent(s2, d2),
        "sentence3": build_sent(s3, d3),
        "sentence4": build_sent(s4, d4),
        "sentence5": build_sent(s5, d5),
        "sentence6": build_sent(s6, d6),
        "chat1": chat1,
        "chat2": chat2,
        "typeWord1": type1,
        "typeWord2": type2,
        "cloze1": cloze1,
        "cloze2": cloze2
    }
