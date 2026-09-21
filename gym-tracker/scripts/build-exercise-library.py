#!/usr/bin/env python3
"""
Regenerates src/data/exerciseLibrary.generated.ts from two public datasets:

- exercemus/exercises (MIT license) — itself curated from wger.de and
  wrkout/exercises.json — provides name, category, equipment, muscles,
  instructions and, for a subset of exercises, a real embeddable YouTube
  video url. See https://github.com/exercemus/exercises.
- yuhonas/free-exercise-db (unlicensed/public domain) — cross-matched by
  exercise name to fill in a demo image where exercemus has none.

MuscleWiki (musclewiki.com) and several other exercise sites (wger.de,
exrx.net, bodybuilding.com, strengthlevel.com, workoutlabs.com) are not
reachable from this project's environment (blocked by network egress
policy) — raw.githubusercontent.com is, so these GitHub-hosted datasets are
used instead. Most exercises still have no curated video id, so those link
to a YouTube search results page rather than an embedded video.

Usage: python3 scripts/build-exercise-library.py
Requires network access to raw.githubusercontent.com.
"""
import json
import re
import urllib.request
from pathlib import Path

EXERCEMUS_URL = "https://raw.githubusercontent.com/exercemus/exercises/main/exercises.json"
FREE_EXERCISE_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"
OUTPUT_PATH = Path(__file__).parent.parent / "src" / "data" / "exerciseLibrary.generated.ts"

GROUP_TO_CATEGORY_IT = {
    "arms": "Braccia", "back": "Schiena", "calves": "Gambe", "chest": "Petto",
    "core": "Core", "legs": "Gambe", "shoulders": "Spalle",
}
EQUIPMENT_TO_IT = {
    "none": "Corpo libero", "ez curl bar": "Bilanciere EZ", "barbell": "Bilanciere",
    "dumbbell": "Manubri", "gym mat": "Tappetino", "exercise ball": "Fitball",
    "medicine ball": "Palla medica", "pull-up bar": "Sbarra", "bench": "Panca",
    "incline bench": "Panca inclinata", "kettlebell": "Kettlebell", "machine": "Macchina",
    "cable": "Cavo", "bands": "Fascia elastica", "foam roll": "Foam roller", "other": "Altro",
}


def esc(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()


def fetch_json(url: str):
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.load(resp)


def main() -> None:
    exercemus = fetch_json(EXERCEMUS_URL)
    free_db = fetch_json(FREE_EXERCISE_DB_URL)

    image_by_name = {}
    for entry in free_db:
        images = entry.get("images") or []
        if images:
            image_by_name[normalize_name(entry["name"])] = f"{IMAGE_BASE}/{images[0]}"

    muscle_to_group = {}
    for group, muscles in exercemus["muscle_groups"].items():
        for muscle in muscles:
            muscle_to_group[muscle] = group

    seen_ids = set()
    lines = [
        "// AUTO-GENERATED from the exercemus/exercises public dataset (MIT license),",
        "// itself curated from wger.de and wrkout/exercises.json — see",
        "// https://github.com/exercemus/exercises. Demo images cross-matched by name from",
        "// yuhonas/free-exercise-db (unlicensed/public domain).",
        "// Do not hand-edit — regenerate via scripts/build-exercise-library.py.",
        "import type { ExerciseLibraryItem } from '../types'",
        "",
        "export const GENERATED_EXERCISE_LIBRARY: ExerciseLibraryItem[] = [",
    ]

    count = 0
    for entry in exercemus["exercises"]:
        name = entry.get("name") or ""
        if not name:
            continue
        exercise_id = re.sub(r"[^a-zA-Z0-9]+", "-", name).strip("-").lower()
        if exercise_id in seen_ids:
            exercise_id += "-2"
        seen_ids.add(exercise_id)

        category = "Altro"
        for muscle in entry.get("primary_muscles") or []:
            group = muscle_to_group.get(muscle)
            if group in GROUP_TO_CATEGORY_IT:
                category = GROUP_TO_CATEGORY_IT[group]
                break

        equipment_list = entry.get("equipment") or ["none"]
        equipment = EQUIPMENT_TO_IT.get(equipment_list[0], "Altro")

        description = entry.get("description") or ""
        if not description:
            instructions = entry.get("instructions") or []
            description = instructions[0] if instructions else ""
        if len(description) > 160:
            description = description[:157].rstrip() + "..."

        video_url = entry.get("video") or (
            f"https://www.youtube.com/results?search_query={name} exercise tutorial".replace(" ", "+")
        )
        image_url = image_by_name.get(normalize_name(name), "")

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
