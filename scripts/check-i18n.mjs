#!/usr/bin/env node
/**
 * Verifies the i18n catalogs:
 *   1. every locale file has exactly the same key set
 *   2. every t("…") call resolves to a key that exists
 *
 * Namespaces are resolved per-variable, e.g.
 *   const t       = useTranslations("home");   → t("x")       ⇒ home.x
 *   const tCommon = useTranslations("common"); → tCommon("y")  ⇒ common.y
 *
 * Run: node scripts/check-i18n.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const MESSAGES = join(ROOT, "messages");

const flat = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" ? flat(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const locales = readdirSync(MESSAGES)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""));

const keysets = Object.fromEntries(
  locales.map((l) => [
    l,
    new Set(
      flat(JSON.parse(readFileSync(join(MESSAGES, `${l}.json`), "utf8"))),
    ),
  ]),
);

const errors = [];

// ---- 1. locale parity -------------------------------------------------
const [base, ...rest] = locales;
for (const other of rest) {
  for (const k of keysets[base])
    if (!keysets[other].has(k)) errors.push(`${other}.json is missing "${k}"`);
  for (const k of keysets[other])
    if (!keysets[base].has(k)) errors.push(`${base}.json is missing "${k}"`);
}

// ---- 2. every t("…") resolves ----------------------------------------
const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    if (entry === "node_modules" || entry.startsWith(".")) return [];
    return statSync(p).isDirectory()
      ? walk(p)
      : /\.(tsx?|jsx?)$/.test(entry)
        ? [p]
        : [];
  });

// const <var> = useTranslations("ns")  /  await getTranslations({..., namespace: "ns"})
const DECL =
  /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?["']([^"']+)["']/g;
// tX("key") — skips template literals containing ${…}, which are dynamic
const CALL = /\b(t[A-Za-z]*)\(\s*["'`]([^"'`$]+)["'`]/g;

for (const file of walk(SRC)) {
  const text = readFileSync(file, "utf8");

  const nsByVar = new Map();
  for (const m of text.matchAll(DECL)) nsByVar.set(m[1], m[2]);
  if (nsByVar.size === 0) continue;

  for (const m of text.matchAll(CALL)) {
    const ns = nsByVar.get(m[1]);
    if (!ns) continue; // not a translator we know about

    const full = `${ns}.${m[2]}`;
    if (!keysets[base].has(full)) {
      const line = text.slice(0, m.index).split("\n").length;
      errors.push(
        `${file.replace(ROOT + "/", "")}:${line} → "${full}" not in catalog`,
      );
    }
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} i18n problem(s):\n`);
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
console.log(
  `✓ i18n OK — ${keysets[base].size} keys × ${locales.length} locales (${locales.join(", ")})`,
);
