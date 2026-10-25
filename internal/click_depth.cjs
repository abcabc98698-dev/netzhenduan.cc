const fs = require('fs');
const path = require('path');

const distDir = path.join('docs', '.vitepress', 'dist');

function getAllHtmlFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'assets') getAllHtmlFiles(filePath, fileList);
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const htmlFiles = getAllHtmlFiles(distDir);
const graph = new Map();

function pathToUrl(p) {
  let r = path.relative(distDir, p).replace(/\\/g, '/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.replace('/index.html', '/');
  return '/' + r.replace(/\.html$/, '');
}

for (const f of htmlFiles) {
  const u = pathToUrl(f);
  graph.set(u, new Set());
}

for (const f of htmlFiles) {
  const u = pathToUrl(f);
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/<a [^>]*href=["'](.*?)["'][^>]*>/gs);
  for (const m of matches) {
    let href = m[1].split('#')[0].split('?')[0];
    if (href.startsWith('/')) {
      // normalize
      let target = href;
      if (graph.has(target)) {
        graph.get(u).add(target);
      } else if (target.endsWith('/') && graph.has(target.slice(0, -1))) {
        graph.get(u).add(target.slice(0, -1));
      } else if (!target.endsWith('/') && graph.has(target + '/')) {
        graph.get(u).add(target + '/');
      }
    }
  }
}

// BFS from '/'
const depths = new Map();
const queue = ['/'];
depths.set('/', 0);

while (queue.length > 0) {
  const curr = queue.shift();
  const d = depths.get(curr);
  const neighbors = graph.get(curr) || new Set();
  for (const n of neighbors) {
    if (!depths.has(n)) {
      depths.set(n, d + 1);
      queue.push(n);
    }
  }
}

console.log('=== CLICK DEPTH FROM HOMEPAGE ===');
const depthCounts = {};
let unreached = [];
for (const [u, d] of graph.entries()) {
  if (u === '/404') continue;
  if (!depths.has(u)) {
    unreached.push(u);
  } else {
    const depth = depths.get(u);
    depthCounts[depth] = (depthCounts[depth] || 0) + 1;
  }
}

console.log('Depth distribution:', depthCounts);
console.log('Unreached (Orphan) pages:', unreached.length, unreached);
