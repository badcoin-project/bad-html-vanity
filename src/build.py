#!/usr/bin/env python3
"""
Assemble BAD_Vanity_Generator.html from template + app code + libs + assets.

Run from anywhere:
    python3 ~/Desktop/Bad_HTML_Vanity/src/build.py

Outputs: ~/Desktop/Bad_HTML_Vanity/BAD_Vanity_Generator.html
"""
import os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(os.path.dirname(ROOT), 'BAD_Vanity_Generator.html')

def read(rel_path):
    with open(os.path.join(ROOT, rel_path)) as f:
        return f.read()

tpl = read('template.html')
parts = {
    '{{COIN_B64}}':     read('coin.b64').strip(),
    '{{SHA256_JS}}':    read('sha256.min.js'),
    '{{ELLIPTIC_JS}}':  read('elliptic.min.js'),
    '{{QRCODE_JS}}':    read('qrcode.min.js'),
    '{{JSPDF_JS}}':     read('jspdf.umd.min.js'),
    '{{APP_JS}}':       read('app.js'),
}
for placeholder, content in parts.items():
    if placeholder not in tpl:
        print(f'WARN: placeholder {placeholder} not in template', file=sys.stderr)
    tpl = tpl.replace(placeholder, content)

import re
remaining = re.findall(r'\{\{[A-Z_]+\}\}', tpl)
if remaining:
    print(f'WARN: unsubstituted placeholders: {remaining}', file=sys.stderr)

with open(OUT, 'w') as f:
    f.write(tpl)

size = os.path.getsize(OUT)
print(f'Wrote {OUT}')
print(f'Size: {size:,} bytes ({size/1024:.1f} KB)')
