# -*- coding: utf-8 -*-
"""Empacota a app (multi-ficheiro, ES modules) num único HTML autossuficiente
para publicar como Artifact partilhável. Não altera os ficheiros fonte."""
import json
import re
import base64
from pathlib import Path

ROOT = Path(__file__).parent.parent

def strip_module_syntax(src: str) -> str:
    # Remove "import { ... } from '...';" (mono ou multi-linha)
    src = re.sub(r'import\s*\{.*?\}\s*from\s*"[^"]*";?', '', src, flags=re.DOTALL)
    # "export const/function/async function/class X" -> "const/function/... X"
    src = re.sub(r'^export\s+(?=(const|let|var|function|async function|class)\b)', '', src, flags=re.MULTILINE)
    return src

def main():
    css = (ROOT / "css" / "style.css").read_text(encoding="utf-8")
    css = re.sub(r"@import url\('https://fonts\.googleapis\.com[^']*'\);\s*\n?", "", css)

    js_files = ["utils.js", "config.js", "seed-data.js", "db.js", "auth.js", "app.js"]
    js_parts = []
    for name in js_files:
        content = (ROOT / "js" / name).read_text(encoding="utf-8")
        js_parts.append(f"// ---- {name} ----\n" + strip_module_syntax(content))
    combined_js = "\n\n".join(js_parts)

    # Snapshot do PHC embutido (em vez de fetch a ficheiro local)
    snapshot_path = ROOT / "js" / "phc-snapshot.json"
    phc_json = snapshot_path.read_text(encoding="utf-8") if snapshot_path.exists() else "null"
    combined_js = combined_js.replace(
        'async function loadPhcSnapshot() {\n  try {\n    const res = await fetch(new URL("./phc-snapshot.json", import.meta.url), { cache: "no-store" });\n    if (!res.ok) return null;\n    return await res.json();\n  } catch {\n    return null;\n  }\n}',
        f'async function loadPhcSnapshot() {{ return PHC_SNAPSHOT_DATA; }}'
    )
    combined_js = f"const PHC_SNAPSHOT_DATA = {phc_json};\n\n" + combined_js

    # Logo embutido em base64
    logo_path = ROOT / "assets" / "logo.png"
    logo_b64 = base64.b64encode(logo_path.read_bytes()).decode()
    combined_js = combined_js.replace(
        'src="./assets/logo.png"',
        f'src="data:image/png;base64,{logo_b64}"'
    )

    html = f'''<title>Sanimaia · Planeamento Natal 2026</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap">
<style>
{css}
</style>

<div id="app"></div>

<script>
{combined_js}
</script>
'''

    out_path = ROOT / "dist-artifact.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"Escrito: {out_path} ({len(html)} chars)")

if __name__ == "__main__":
    main()
