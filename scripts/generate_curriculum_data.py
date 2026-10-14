# scripts/generate_curriculum_data.py
import json
import os

def make_unit(
    num, sec, de, en, color,
    sliceA, sliceB, sliceC, sliceD,
    s1, s2, s3, s4, s5, s6,
    chat1, chat2,
    type1, type2,
    cloze1, cloze2
):
    def build_sent(item, distractors):
        de_text = item["de"]
        en_text = item["en"]
        words = de_text.split()
        tokens = words + [d for d in distractors if d not in words]
        return {"de": de_text, "en": en_text, "tokens": tokens}

    d1 = [sliceB[0]["de"], sliceC[0]["de"]]
    d2 = [sliceA[1]["de"], sliceC[1]["de"]]
    d3 = [sliceA[2]["de"], sliceB[2]["de"]]
    d4 = [sliceB[1]["de"], sliceD[0]["de"]]
    d5 = [sliceC[2]["de"], sliceD[1]["de"]]
    d6 = [sliceA[3]["de"], sliceD[2]["de"]]

    # Validation
    words_de = [w["de"].lower().strip() for w in sliceA + sliceB + sliceC + sliceD]
    if len(set(words_de)) != 16:
        duplicates = [w for w in words_de if words_de.count(w) > 1]
        print(f"Warning: Unit {num} has duplicate words in slices: {set(duplicates)}")

    return {
        "num": num,
        "sec": sec,
        "de": de,
        "en": en,
        "color": color,
        "sliceA": sliceA,
        "sliceB": sliceB,
        "sliceC": sliceC,
        "sliceD": sliceD,
        "sentence1": s1 if "tokens" in s1 else build_sent(s1, d1),
        "sentence2": s2 if "tokens" in s2 else build_sent(s2, d2),
        "sentence3": s3 if "tokens" in s3 else build_sent(s3, d3),
        "sentence4": s4 if "tokens" in s4 else build_sent(s4, d4),
        "sentence5": s5 if "tokens" in s5 else build_sent(s5, d5),
        "sentence6": s6 if "tokens" in s6 else build_sent(s6, d6),
        "chat1": chat1,
        "chat2": chat2,
        "typeWord1": type1,
        "typeWord2": type2,
        "cloze1": cloze1,
        "cloze2": cloze2,
    }
