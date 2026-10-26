"""Deterministic screenplay parser - Feature A1."""
import re
from collections import defaultdict

SCENE = re.compile(
    r"^(INT|EXT|EST)\.?\s+(.+?)\s*[-\u2013]\s*"
    r"(DAY|NIGHT|DAWN|DUSK|CONTINUOUS|LATER|MORNING|EVENING)",
    re.IGNORECASE,
)
CUE = re.compile(r"^([A-Z][A-Z\s\.'\-]{1,30})(\s*\(.*\))?\s*$")
SKIP = {"INT", "EXT", "EST", "CUT TO", "FADE IN", "FADE OUT",
        "DISSOLVE TO", "SMASH CUT", "MATCH CUT"}


class ScriptAnalyzer:
    def __init__(self, text):
        self.lines = [l.rstrip() for l in text.splitlines()]

    def scenes(self):
        out = []
        for i, line in enumerate(self.lines):
            m = SCENE.match(line.strip())
            if m:
                out.append({
                    "index": len(out) + 1,
                    "type": m.group(1).upper(),
                    "location": m.group(2).strip(),
                    "time": m.group(3).upper(),
                    "line_no": i,
                })
        return out

    def characters(self):
        counts = defaultdict(int)
        for line in self.lines:
            s = line.strip()
            m = CUE.match(s)
            if m and not SCENE.match(s):
                name = m.group(1).strip()
                if name not in SKIP:
                    counts[name] += 1
        return dict(sorted(counts.items(), key=lambda x: -x[1]))

    def dialogues(self):
        out, cur, buf = [], None, []
        for line in self.lines:
            s = line.strip()
            m = CUE.match(s)
            if m and not SCENE.match(s):
                if cur and buf:
                    out.append({"character": cur, "text": " ".join(buf)})
                cur, buf = m.group(1).strip(), []
            elif cur and s and not SCENE.match(s):
                buf.append(s)
            elif not s and cur and buf:
                out.append({"character": cur, "text": " ".join(buf)})
                cur, buf = None, []
        if cur and buf:
            out.append({"character": cur, "text": " ".join(buf)})
        return out

    def analyze(self):
        scenes = self.scenes()
        chars = self.characters()
        dlg = self.dialogues()
        words = defaultdict(int)
        for d in dlg:
            words[d["character"]] += len(d["text"].split())
        total = sum(words.values()) or 1
        return {
            "total_scenes": len(scenes),
            "scenes": scenes,
            "characters": chars,
            "main_characters": list(chars)[:5],
            "locations": sorted({s["location"] for s in scenes if s["location"]}),
            "speaking_percentage": {
                k: round((float(v) / float(total)) * 100, 1) for k, v in words.items()
            },
            "dialogue_count": len(dlg),
        }
