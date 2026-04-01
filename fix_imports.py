import os
import re

backend_dir = r"e:\ieee_internal_hack\backend"

for root, dirs, files in os.walk(backend_dir):
    for filename in files:
        if filename.endswith(".py"):
            filepath = os.path.join(root, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Replace "from ..module import" with "from module import"
            content = re.sub(r"^from \.\.([a-zA-Z0-9_]+) import", r"from \1 import", content, flags=re.MULTILINE)
            content = re.sub(r"^from \.([a-zA-Z0-9_]+) import", r"from \1 import", content, flags=re.MULTILINE)
            
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

print("Fixed relative imports in backend!")
