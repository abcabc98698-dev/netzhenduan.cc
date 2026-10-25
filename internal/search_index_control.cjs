const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern, extFilter) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'assets') {
        results = results.concat(searchDir(full, pattern, extFilter));
      }
    } else if (!extFilter || extFilter.some(ext => f.endsWith(ext))) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        results.push(path.relative('.', full).replace(/\\/g, '/'));
      }
    }
  }
  return results;
}

console.log('=== SEARCHING FOR NOINDEX IN DIST HTML ===');
const noindexHtml = searchDir('docs/.vitepress/dist', /noindex/i, ['.html']);
console.log('noindex HTML pages:', noindexHtml);

console.log('\n=== SEARCHING FOR DISALLOW IN ROBOTS.TXT ===');
const robotsContent = fs.readFileSync('docs/public/robots.txt', 'utf8');
console.log(robotsContent.trim());

console.log('\n=== SEARCHING FOR X-ROBOTS-TAG IN HTACCESS ===');
const htaccessContent = fs.readFileSync('docs/public/.htaccess', 'utf8');
const xRobotsLines = htaccessContent.split('\n').filter(l => l.includes('X-Robots-Tag'));
console.log(xRobotsLines);
