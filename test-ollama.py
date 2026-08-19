import urllib.request, json, time

start = time.time()
body = {
    'model': 'llama3.2',
    'messages': [
        {'role': 'system', 'content': 'You are RentHub AI Assistant. Always return structured JSON matching the schema. Return ONLY the JSON object. No other text.'},
        {'role': 'user', 'content': 'User request: "I want a camera"\nReturn ONLY the JSON object matching the schema. No other text.'}
    ],
    'stream': False,
    'options': {'temperature': 0.2, 'num_predict': 1024}
}
req = urllib.request.Request('http://127.0.0.1:11434/api/chat', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
resp = urllib.request.urlopen(req, timeout=120)
elapsed = time.time() - start
print(f'Elapsed: {elapsed:.1f}s')
print(resp.read().decode()[:500])