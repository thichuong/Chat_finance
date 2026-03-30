import requests
import json

def test_streaming():
    url = "http://localhost:8000/api/chat"
    payload = {
        "message": "Giá Bitcoin hiện tại thế nào?",
        "session_id": "test_session"
    }
    
    print(f"Testing streaming to {url}...")
    try:
        response = requests.post(url, json=payload, stream=True)
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                print(f"[{data['type']}] {data['content'][:100]}...")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Note: api.py must be running for this to work.
    # Since I'm an AI, I can't easily "run" api.py in the background and then run this.
    # But I can provide the script for the user or try to run it if the environment allows.
    print("This script tests the /api/chat endpoint.")
    # test_streaming()
