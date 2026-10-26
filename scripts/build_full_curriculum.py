#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Curriculum Builder: Generates units 2 through 30 from modular parts,
writes them to src/data/units/unit-XX.ts, and updates src/data/units/index.ts
"""

import os
import sys
import re
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)
from curriculum_data_part1 import UNITS_PART1
from curriculum_data_part2 import UNITS_PART2
from curriculum_data_part3 import UNITS_PART3

all_generated_units = UNITS_PART1 + UNITS_PART2 + UNITS_PART3
print(f"Total units to generate: {len(all_generated_units)}")
total_new_words = sum(len(u['words']) for u in all_generated_units)
print(f"Total new words: {total_new_words}")

out_dir = "src/data/units"
os.makedirs(out_dir, exist_ok=True)

unit_import_lines = ["import { unit01 } from './unit-01';"]
unit_array_items = ["  unit01,"]

for unit in all_generated_units:
    u_id = unit["id"]
    var_name = f"unit{u_id:02d}"
    filename = f"{out_dir}/unit-{u_id:02d}.ts"
    
    words_ts = []
    for idx, w in enumerate(unit["words"]):
        word_str, bangla, pron, pos, ex_en, ex_bn, syns, ants, tip, diff = w
        word_id = f"u{u_id}_{re.sub(r'[^a-zA-Z0-9]', '', word_str).lower()}_{idx+1}"
        
        clean_word = word_str.replace("'", "\\'")
        clean_bangla = bangla.replace("'", "\\'")
        clean_pron = pron.replace("'", "\\'")
        clean_ex_en = ex_en.replace("'", "\\'")
        clean_ex_bn = ex_bn.replace("'", "\\'")
        clean_tip = tip.replace("'", "\\'")
        clean_syns = json.dumps(syns, ensure_ascii=False)
        clean_ants = json.dumps(ants, ensure_ascii=False)
        
        word_block = f"""    {{
      id: '{word_id}',
      unitId: {u_id},
      word: '{clean_word}',
      banglaMeaning: '{clean_bangla}',
      pronunciation: '{clean_pron}',
      partOfSpeech: '{pos}',
      examples: [
        {{
          english: '{clean_ex_en}',
          bangla: '{clean_ex_bn}'
        }}
      ],
      synonyms: {clean_syns},
      antonyms: {clean_ants},
      memoryTip: '{clean_tip}',
      difficulty: '{diff}'
    }}"""
        words_ts.append(word_block)
        
    joined_words = ",\n".join(words_ts)
    clean_title = unit["title"].replace("'", "\\'")
    clean_subtitle = unit["subtitle"].replace("'", "\\'")
    clean_desc = unit["description"].replace("'", "\\'")
    color = unit.get("themeColor", "indigo")
    
    file_content = f"""import {{ UnitInfo }} from '../types';

export const {var_name}: UnitInfo = {{
  id: {u_id},
  number: {unit['number']},
  title: '{clean_title}',
  subtitle: '{clean_subtitle}',
  description: '{clean_desc}',
  themeColor: '{color}',
  words: [
{joined_words}
  ]
}};
"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(file_content)
        
    unit_import_lines.append(f"import {{ {var_name} }} from './unit-{u_id:02d}';")
    unit_array_items.append(f"  {var_name},")
    print(f"Generated {filename} with {len(unit['words'])} words.")

# Update index.ts
index_file = f"{out_dir}/index.ts"
imports_block = "\n".join(unit_import_lines)
array_block = "\n".join(unit_array_items)

index_content = f"""import {{ UnitInfo, VocabWord }} from '../types';
{imports_block}

export const allUnits: UnitInfo[] = [
{array_block}
];

export const getAllUnits = (): UnitInfo[] => {{
  return allUnits;
}};

export const getUnitById = (id: number): UnitInfo | undefined => {{
  return allUnits.find(u => u.id === id);
}};

export const getAllWords = (): VocabWord[] => {{
  return allUnits.flatMap(u => u.words);
}};

export const getWordById = (wordId: string): VocabWord | undefined => {{
  for (const u of allUnits) {{
    const found = u.words.find(w => w.id === wordId);
    if (found) return found;
  }}
  return undefined;
}};

export const getTotalWordCount = (): number => {{
  return allUnits.reduce((acc, u) => acc + u.words.length, 0);
}};
"""

with open(index_file, 'w', encoding='utf-8') as f:
    f.write(index_content)

print("Successfully written all unit files and updated index.ts!")
