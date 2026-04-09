import httpx
import json
import time

try:
    r = httpx.post('http://localhost:8000/api/appointments/call', json={
        'doctor_name': 'Dr. Aarav Sharma',
        'doctor_specialty': 'General Physician',
        'doctor_phone': '+919511928019',
        'doctor_hospital': 'Apollo Hospitals',
        'doctor_available': 'Mon-Sat, 9AM-5PM',
        'patient_name': 'the patient'
    }, timeout=40)
    print("STATUS CODE:", r.status_code)
    try:
        j = r.json()
        print("JSON:", json.dumps(j, indent=2))
        call_id = j.get('call_id')
        if call_id:
            print("Polling call...")
            time.sleep(3)
            p = httpx.get(f'http://localhost:8000/api/appointments/call/{call_id}')
            print("POLL STATUS:", p.status_code)
            print("POLL JSON:", json.dumps(p.json(), indent=2))
    except Exception as e:
        print("Not json:", r.text)
except Exception as e:
    print("Error:", str(e))
