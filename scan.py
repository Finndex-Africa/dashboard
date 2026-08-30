import re, pathlib, json, sys
root = pathlib.Path(".")
files = [p for p in list(root.rglob("*.tsx")) if "node_modules" not in str(p)]
# bare JSX text nodes + common attributes with English-looking literals
pat_text = re.compile(r'^\s{2,}([A-Z][A-Za-z0-9][A-Za-z0-9 ,.:;!?&/\'’()%-]{3,80})\s*$')
pat_attr = re.compile(r'(?:placeholder|title|aria-label|alt)="([A-Z][^"]{3,80})"')
pat_str  = re.compile(r'''(?:toast|showToast)\.[a-z]+\(\s*['"]([A-Z][^'"]{4,90})['"]''')
rows = []
for f in sorted(files):
    s = f.read_text()
    n = 0
    for line in s.split("\n"):
        st = line.strip()
        if st.startswith(("//","*","import","export","const","let","return","}")): continue
        if pat_text.match(line) and "{" not in line and "<" not in line: n += 1
    n += len(pat_attr.findall(s)) + len(pat_str.findall(s))
    if n: rows.append((n, str(f)))
rows.sort(reverse=True)
tot = sum(r[0] for r in rows)
print(f"TOTAL candidate strings: {tot} across {len(rows)} files\n")
for n, f in rows[:45]:
    print(f"{n:4d}  {f}")
