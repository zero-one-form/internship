#!/usr/bin/env python3
"""Generate one image with the Gemini API.

Usage: python3 tools/art/gemini_gen.py <out.png> "<prompt>" [--ref img ...] [--model name] [--aspect 3:4]
  The API key comes from $GEMINI_API_KEY (or a file named by $GEMINI_API_KEY_FILE). It is never written to the repo.
  --ref attaches reference images (for "same character" follow-ups), so faces stay consistent.
"""
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request

API = 'https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent'


def key():
    k = os.environ.get('GEMINI_API_KEY', '').strip()
    if not k and os.environ.get('GEMINI_API_KEY_FILE'):
        with open(os.environ['GEMINI_API_KEY_FILE']) as f:
            k = f.read().strip()
    if not k:
        sys.exit('GEMINI_API_KEY is not set')
    return k


def generate(out, prompt, refs=(), model='gemini-3.1-flash-image', aspect=None):
    parts = []
    for r in refs:
        with open(r, 'rb') as f:
            parts.append({'inline_data': {'mime_type': mimetypes.guess_type(r)[0] or 'image/png', 'data': base64.b64encode(f.read()).decode()}})
    parts.append({'text': prompt})
    body = {'contents': [{'parts': parts}], 'generationConfig': {'responseModalities': ['IMAGE', 'TEXT']}}
    if aspect:
        body['generationConfig']['imageConfig'] = {'aspectRatio': aspect}
    req = urllib.request.Request(API.format(model), json.dumps(body).encode(), {'Content-Type': 'application/json', 'x-goog-api-key': key()})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                d = json.load(r)
            break
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:500]
            if e.code in (429, 500, 503) and attempt < 3:
                time.sleep(10 * (attempt + 1))
                continue
            sys.exit('HTTP %d: %s' % (e.code, msg))
    for c in d.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            data = p.get('inline_data') or p.get('inlineData')
            if data:
                os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
                with open(out, 'wb') as f:
                    f.write(base64.b64decode(data['data']))
                print('saved', out)
                return out
    sys.exit('no image in response: ' + json.dumps(d)[:600])


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    out, prompt, rest = argv[0], argv[1], argv[2:]
    refs, model, aspect = [], 'gemini-3.1-flash-image', None
    i = 0
    while i < len(rest):
        if rest[i] == '--ref':
            i += 1
            while i < len(rest) and not rest[i].startswith('--'):
                refs.append(rest[i]); i += 1
            continue
        if rest[i] == '--model':
            model = rest[i + 1]; i += 2; continue
        if rest[i] == '--aspect':
            aspect = rest[i + 1]; i += 2; continue
        i += 1
    generate(out, prompt, refs, model, aspect)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
