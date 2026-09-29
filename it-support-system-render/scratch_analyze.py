import os, re

BASE_DIR = r"C:\Users\oguzh\.gemini\antigravity-ide\scratch\it-support-system"
out_path = os.path.join(BASE_DIR, "emoji_report.txt")

with open(out_path, "w", encoding="utf-8") as out:
    for fn in ['index.html', 'support.html']:
        filepath = os.path.join(BASE_DIR, fn)
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        out.write(f"\n=================== {fn} ===================\n")
        for i, line in enumerate(lines):
            ems = re.findall(r'[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]', line)
            if ems:
                out.write(f"L{i+1}: {ems} | {line.strip()[:90]}\n")
