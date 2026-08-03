#!/usr/bin/env node
// Validates the marketplace, every plugin, and every skill in this repo.
// Runs in CI on every push. Exit 1 on any error.
// Usage: node scripts/validate.mjs [repoRoot]

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.argv[2] || '.';
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const readJson = (p) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); }
  catch (e) { err(`${relative(root, p)}: invalid JSON, ${e.message}`); return null; }
};

// ---------- marketplace ----------

const mpPath = join(root, '.claude-plugin/marketplace.json');
if (!existsSync(mpPath)) {
  err('.claude-plugin/marketplace.json is missing, nothing can install');
  report();
}
const mp = readJson(mpPath);
if (!mp) report();

if (!mp.name) err('marketplace.json: missing "name"');
if (!mp.owner?.name) err('marketplace.json: missing owner.name');
if (!Array.isArray(mp.plugins) || !mp.plugins.length) err('marketplace.json: no plugins listed');

const seenPluginNames = new Set();
let skillCount = 0;
let remoteCount = 0;

for (const entry of mp.plugins || []) {
  const where = `marketplace.json plugin "${entry.name}"`;
  if (!entry.name) { err(`${where}: missing name`); continue; }
  if (!entry.source) { err(`${where}: missing source`); continue; }
  if (seenPluginNames.has(entry.name)) err(`${where}: duplicate plugin name`);
  seenPluginNames.add(entry.name);

  // A remote source (github, url, git-subdir, npm) lives in another repo, so
  // there is nothing local to check beyond the shape of the declaration.
  if (typeof entry.source === 'object') {
    const kind = entry.source.source;
    if (!kind) err(`${where}: object source is missing its "source" discriminator`);
    else if (!['github', 'url', 'git-subdir', 'npm'].includes(kind)) {
      err(`${where}: unknown source type "${kind}"`);
    }
    if (kind === 'git-subdir' && (!entry.source.url || !entry.source.path)) {
      err(`${where}: git-subdir needs both "url" and "path"`);
    }
    if (kind === 'npm' && !entry.source.package) err(`${where}: npm source needs "package"`);
    remoteCount++;
    continue;
  }

  const dir = join(root, entry.source);
  if (!existsSync(dir)) { err(`${where}: source path does not exist: ${entry.source}`); continue; }

  // ---------- plugin manifest ----------
  const pjPath = join(dir, '.claude-plugin/plugin.json');
  if (!existsSync(pjPath)) { err(`${where}: missing .claude-plugin/plugin.json`); continue; }
  const pj = readJson(pjPath);
  if (!pj) continue;

  if (pj.name !== entry.name) {
    err(`${where}: plugin.json name "${pj.name}" does not match marketplace name "${entry.name}"`);
  }
  if (!pj.version) warn(`${where}: no version, users will not receive updates predictably`);
  if (!pj.description) err(`${where}: plugin.json missing description`);
  if (!pj.license) warn(`${where}: no license field`);

  // ---------- skills ----------
  const skillsDir = join(dir, 'skills');
  if (!existsSync(skillsDir)) { err(`${where}: no skills/ directory`); continue; }

  const skills = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory());
  if (!skills.length) err(`${where}: skills/ is empty`);

  for (const s of skills) {
    const sDir = join(skillsDir, s);
    const smPath = join(sDir, 'SKILL.md');
    const label = `${entry.name}/${s}`;

    if (!existsSync(smPath)) { err(`${label}: missing SKILL.md`); continue; }
    skillCount++;
    const text = readFileSync(smPath, 'utf8');

    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) { err(`${label}: SKILL.md has no YAML frontmatter`); continue; }
    const front = fm[1];

    const nameM = front.match(/^name:\s*(.+)$/m);
    const descM = front.match(/^description:\s*([\s\S]+?)(?=\n[a-z_]+:|$)/m);

    if (!nameM) err(`${label}: frontmatter missing "name"`);
    else if (nameM[1].trim() !== s) {
      err(`${label}: frontmatter name "${nameM[1].trim()}" does not match directory "${s}"`);
    }

    if (!descM) {
      err(`${label}: frontmatter missing "description" (this is the trigger surface, the skill will never fire)`);
    } else {
      const d = descM[1].replace(/\s+/g, ' ').trim();
      if (d.length < 40) err(`${label}: description is only ${d.length} chars, too thin to trigger reliably`);
      if (d.length > 1024) warn(`${label}: description is ${d.length} chars, unusually long`);
    }

    // Only an explicit references/ or scripts/ path counts as a pointer.
    // A bare `AGENTS.md` in prose is a filename the skill talks about, not a
    // file it loads, and flagging those produced false errors.
    const refs = new Set();
    for (const m of text.matchAll(/\b(references|scripts)\/([A-Za-z0-9_\-]+\.[a-z]+)/g)) {
      refs.add([m[1], m[2]]);
    }

    for (const [dirName, r] of refs) {
      if (!existsSync(join(sDir, dirName, r))) {
        err(`${label}: SKILL.md points at "${dirName}/${r}" which does not exist`);
      }
    }

    // every reference file should be reachable from SKILL.md
    const refDir = join(sDir, 'references');
    if (existsSync(refDir)) {
      for (const f of readdirSync(refDir)) {
        if (!text.includes(f.replace(/\.md$/, '')) && !text.includes(f)) {
          warn(`${label}: references/${f} is never mentioned in SKILL.md, so it will not be read`);
        }
      }
    }

    // scripts must parse
    const scriptDir = join(sDir, 'scripts');
    if (existsSync(scriptDir)) {
      for (const f of readdirSync(scriptDir)) {
        if (!/\.(mjs|js)$/.test(f)) continue;
        try {
          execCheck(join(scriptDir, f));
        } catch (e) {
          err(`${label}: scripts/${f} fails to parse, ${String(e.message).split('\n')[0]}`);
        }
      }
    }
  }
}

// ---------- house style: no AI-tell dashes in prose ----------
// The language reference files legitimately discuss dash characters as subject
// matter, so they are exempt.
const DASH_EXEMPT = /references[\/\\](russian|chinese|japanese|french|german|spanish|portuguese|italian|hebrew|arabic|method)\.md$|tests[\/\\]/;
const mdFiles = [];
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.md')) mdFiles.push(p);
  }
})(root);

for (const f of mdFiles) {
  if (DASH_EXEMPT.test(f)) continue;
  const t = readFileSync(f, 'utf8');
  const lines = t.split(/\r?\n/);
  lines.forEach((l, i) => {
    if (/[—–]/.test(l)) {
      err(`${relative(root, f)}:${i + 1}: em or en dash in published prose (house rule: it reads as AI-written)`);
    }
  });
}

function execCheck(file) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
}

report();

function report() {
  console.log(`validated: ${seenPluginNames.size} plugin(s) (${remoteCount} remote), ${skillCount} local skill(s), ${mdFiles.length} markdown file(s)`);
  if (warnings.length) {
    console.log(`\nWARNINGS (${warnings.length})`);
    for (const w of warnings) console.log('  ' + w);
  }
  if (errors.length) {
    console.log(`\nERRORS (${errors.length})`);
    for (const e of errors) console.log('  ' + e);
    console.log('\nFAILED');
    process.exit(1);
  }
  console.log('\nOK');
  process.exit(0);
}
