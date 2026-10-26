"""Gemini の 音声合成で 文を 読み上げた 音声を 作る（会社の 有料枠のキー ~/.gemini/.env）。
使い方: python tools/tts_gemini.py 声の名前 出力.wav "文"
"""
import base64, json, os, pathlib, sys, urllib.request, wave

key = next(l.split('=', 1)[1].strip() for l in (pathlib.Path.home() / '.gemini' / '.env').read_text().splitlines() if l.startswith('GEMINI_API_KEY='))
voice, out, text = sys.argv[1], sys.argv[2], sys.argv[3]
MODEL = os.environ.get('TTS_MODEL', 'gemini-2.5-flash-preview-tts')
STYLE = 'やさしい保育士さんが、小さな子どもに、ゆっくり、おだやかに、あたたかく話しかけるように読んでください: '
body = {
    'contents': [{'parts': [{'text': STYLE + text}]}],
    'generationConfig': {'responseModalities': ['AUDIO'],
                         'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': voice}}}},
}
req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent',
                             data=json.dumps(body).encode(), headers={'Content-Type': 'application/json', 'x-goog-api-key': key})
try:
    res = json.load(urllib.request.urlopen(req, timeout=120))
except urllib.error.HTTPError as e:
    sys.exit(f'HTTP {e.code}: {e.read().decode()[:400]}')
pcm = base64.b64decode(res['candidates'][0]['content']['parts'][0]['inlineData']['data'])
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
u = res.get('usageMetadata', {})
print(out, f'{len(pcm) / 48000:.1f}秒', 'tokens', u.get('promptTokenCount'), u.get('candidatesTokenCount'))
