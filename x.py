import re, sys, pathlib
f = pathlib.Path(sys.argv[1]); s = f.read_text()
pat_text = re.compile(r'^\s{2,}([A-Z][A-Za-z0-9][A-Za-z0-9 ,.:;!?&/\'’()%-]{3,90})\s*$')
pat_attr = re.compile(r'(?:placeholder|title|aria-label|alt)="([A-Z][^"]{3,90})"')
pat_str  = re.compile(r'''(?:toast|showToast)\.[a-z]+\(\s*['"]([A-Z][^'"]{4,110})['"]''')
out=[]
for i, line in enumerate(s.split("\n"), 1):
    st = line.strip()
    if st.startswith(("//","*","import","export","const","let","return","}")): continue
    m = pat_text.match(line)
    if m and "{" not in line and "<" not in line: out.append((i, m.group(1)))
for m in pat_attr.finditer(s): out.append((s[:m.start()].count("\n")+1, "[attr] "+m.group(1)))
for m in pat_str.finditer(s):  out.append((s[:m.start()].count("\n")+1, "[toast] "+m.group(1)))
for i, t in sorted(out): print(f"{i:5d}  {t}")
