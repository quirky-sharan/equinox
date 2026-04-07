import os
import re

target_dir = r"c:\Users\Maan\Desktop\pulse\equinox"

exclude_dirs = {".git", ".venv", "venv", "node_modules", "__pycache__", "dist", "build", ".gemini"}

replacements = [
    (r"Meowmeow", "Pulse"),
    (r"meowmeow", "pulse"),
    (r"MEOWMEOW", "PULSE"),
    (r"ClinicalMind", "Pulse"),
    (r"Clinicalmind", "Pulse"),
    (r"clinicalmind", "pulse")
]

for root, dirs, files in os.walk(target_dir):
    dirs[:] = [d for d in dirs if d not in exclude_dirs]
    for file in files:
        if file.endswith((".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".pdf", ".db", ".db-journal")):
            continue
            
        file_path = os.path.join(root, file)
        if "replace_script.py" in file_path:
            continue
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            # Skip binary or unreadable files
            continue
            
        original_content = content
        
        for pattern, replacement in replacements:
            content = re.sub(pattern, replacement, content)
            
        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated: {file_path}")

print("Done replacing text.")

# Rename the database file if it exists so we don't lose data
db_path = os.path.join(target_dir, "backend", "meowmeow.db")
new_db_path = os.path.join(target_dir, "backend", "pulse.db")
if os.path.exists(db_path):
    try:
        os.rename(db_path, new_db_path)
        print("Database renamed to pulse.db")
    except Exception as e:
        print(f"Failed to rename database: {e}")
