#!/usr/bin/env python3
"""
Regenerates src/data/exerciseLibrary.generated.ts from the free-exercise-db
public dataset (github.com/yuhonas/free-exercise-db, unlicensed/public domain).

MuscleWiki (musclewiki.com) is not reachable from this project's environment
(blocked by network egress policy), so this open dataset is used instead as
the exercise database source. It ships instructions + demo images per
exercise but no curated video id, so each generated entry links to a YouTube
search results page instead of an embedded video; a small hand-picked set in
exerciseLibrary.ts keeps real embedded tutorials.

Usage: python3 scripts/build-exercise-library.py
Requires network access to raw.githubusercontent.com.
"""
import json
import re
import urllib.request
from pathlib import Path

SOURCE_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"
OUTPUT_PATH = Path(__file__).parent.parent / "src" / "data" / "exerciseLibrary.generated.ts"

MUSCLE_TO_CATEGORY_IT = {
    "abdominals": "Core", "abductors": "Gambe", "adductors": "Gambe",
    "biceps": "Braccia", "calves": "Gambe", "chest": "Petto",
    "forearms": "Braccia", "glutes": "Gambe", "hamstrings": "Gambe",
    "lats": "Schiena", "lower back": "Schiena", "middle back": "Schiena",
    "neck": "Collo", "quadriceps": "Gambe", "shoulders": "Spalle",
    "traps": "Schiena", "triceps": "Braccia",
}
EQUIPMENT_TO_IT = {
    "body only": "Corpo libero", "machine": "Macchina", "other": "Altro",
    "foam roll": "Foam roller", None: "Nessuno", "kettlebells": "Kettlebell",
    "dumbbell": "Manubri", "cable": "Cavo", "barbell": "Bilanciere",
    "bands": "Fascia elastica", "medicine ball": "Palla medica",
    "exercise ball": "Fitball", "e-z curl bar": "Bilanciere EZ",
}


def esc(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


def main() -> None:
    with urllib.request.urlopen(SOURCE_URL, timeout=30) as resp:
        data = json.load(resp)

    seen_ids = set()
    lines = [
        "// AUTO-GENERATED from the free-exercise-db public dataset (yuhonas/free-exercise-db, unlicensed/public domain).",
        "// Do not hand-edit — regenerate via scripts/build-exercise-library.py if the source dataset changes.",
        "import type { ExerciseLibraryItem } from '../types'",
        "",
        "export const GENERATED_EXERCISE_LIBRARY: ExerciseLibraryItem[] = [",
    ]

    count = 0
    for entry in data:
        name = entry.get("name") or ""
        if not name:
            continue
        exercise_id = (entry.get("id") or re.sub(r"[^a-zA-Z0-9]+", "-", name)).strip("-").lower()
        if exercise_id in seen_ids:
            exercise_id += "-2"
        seen_ids.add(exercise_id)

        category = "Altro"
        for muscle in entry.get("primaryMuscles") or []:
            if muscle in MUSCLE_TO_CATEGORY_IT:
                category = MUSCLE_TO_CATEGORY_IT[muscle]
                break

        equipment = EQUIPMENT_TO_IT.get(entry.get("equipment"), "Altro")

        instructions = entry.get("instructions") or []
        description = instructions[0] if instructions else ""
        if len(description) > 160:
            description = description[:157].rstrip() + "..."

        images = entry.get("images") or []
        image_url = f"{IMAGE_BASE}/{images[0]}" if images else ""

        video_url = f"https://www.youtube.com/results?search_query={name} exercise tutorial".replace(" ", "+")

        lines.append(
            '  { id: "%s", name: "%s", category: "%s", equipment: "%s", videoUrl: "%s", imageUrl: "%s", description: "%s" },'
            % (esc(exercise_id), esc(name), esc(category), esc(equipment), esc(video_url), esc(image_url), esc(description))
        )
        count += 1

    lines.append("]")
    OUTPUT_PATH.write_text("\n".join(lines) + "\n")
    print(f"Wrote {count} exercises to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
