// Fails if two modules declare a function with the same name in the shared game scope
// (the later declaration silently replaces the earlier one).
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'dist', 'game_only.js'), 'utf8');
const seen = new Map(), dupes = [];
// top-level declarations in the IIFE are indented by exactly two spaces
for (const m of src.matchAll(/^ {2}(?:async )?function ([A-Za-z_$][\w$]*)\s*\(/gm)) {
  const n = m[1];
  if (seen.has(n)) dupes.push(n); else seen.set(n, 1);
}
if (dupes.length) { console.log('duplicate function declarations:', [...new Set(dupes)].join(', ')); process.exit(1); }
console.log('no duplicate function declarations (' + seen.size + ' functions)');
