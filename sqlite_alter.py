import os
import sqlite3

columns = [
    ('patient_explanation', 'TEXT'),
    ('doctor_explanation', 'TEXT'),
    ('reasoning_chain', 'JSON'),
    ('recommended_action', 'TEXT'),
    ('dos', 'JSON'),
    ('donts', 'JSON'),
    ('see_doctor', 'INTEGER'),
    ('see_doctor_urgency', 'TEXT'),
    ('home_remedies', 'JSON'),
    ('dietary_guidelines', 'JSON'),
    ('lifestyle_modifications', 'JSON'),
    ('warning_signs', 'JSON'),
]

for db_path in ['pulse.db', 'backend/pulse.db']:
    if not os.path.exists(db_path):
        continue
        
    print(f"Checking {db_path}...")
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Verify the table exists
    try:
        c.execute("SELECT 1 FROM sessions LIMIT 1")
    except Exception as e:
        print(f"Table sessions missing in {db_path}: {e}")
        conn.close()
        continue

    for col_name, col_type in columns:
        try:
            c.execute(f'ALTER TABLE sessions ADD COLUMN {col_name} {col_type}')
            print(f'Added column {col_name} to {db_path}')
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e).lower():
                print(f'Column {col_name} already exists in {db_path}')
            else:
                print(f'Error adding {col_name} in {db_path}: {e}')

    conn.commit()
    conn.close()
