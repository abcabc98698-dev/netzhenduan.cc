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

let canonicalStats = { total: 0, missing: 0, nonDomain: 0, pointsToHome: 0, selfReferencing: 0 };
let noindexPages = [];
let titles = new Map();
let descs = new Map();
let h1s = new Map();
let titleLengths = [];
let descLengths = [];
let schemaCount = 0;
let externalLinks = [];
let unflaggedAffiliateLinks = [];
let emptyHrefs = 0;
let hashOnlyHrefs = 0;
let mixedContent = [];
let internalBrokenLinks = [];

const validHtmlSet = new Set(htmlFiles.map(f => {
  let r = path.relative(distDir, f).replace(/\\/g, '/');
  return '/' + r.replace(/index\.html$/, '').replace(/\.html$/, '');
}));
validHtmlSet.add('/');

for (const f of htmlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(distDir, f).replace(/\\/g, '/');

  // Canonical
  const canonMatch = content.match(/<link rel=["']canonical["'] href=["'](.*?)["']/);
  if (canonMatch) {
    canonicalStats.total++;
    const href = canonMatch[1];
    if (!href.startsWith('https://netzhenduan.cc')) {
      canonicalStats.nonDomain++;
    } else if (href === 'https://netzhenduan.cc/' && relPath !== 'index.html') {
      canonicalStats.pointsToHome++;
    } else {
      canonicalStats.selfReferencing++;
    }
  } else {
    canonicalStats.missing++;
  }

  // Noindex
  if (content.includes('noindex')) {
    noindexPages.push(relPath);
  }

  // Title
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  if (titleMatch) {
    const t = titleMatch[1];
    titles.set(t, (titles.get(t) || 0) + 1);
    titleLengths.push(t.length);
  }

  // Description
  const descMatch = content.match(/<meta name=["']description["'] content=["'](.*?)["']/);
  if (descMatch) {
    const d = descMatch[1];
    descs.set(d, (descs.get(d) || 0) + 1);
    descLengths.push(d.length);
    if (d.length < 40) {
      console.log('Short description (<40 chars):', relPath, d.length, `"${d}"`);
    }
  }

  // H1
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/);
  if (h1Match) {
    const h = h1Match[1].replace(/<[^>]+>/g, '').trim();
    h1s.set(h, (h1s.get(h) || 0) + 1);
  }

  // Schema
  if (content.includes('application/ld+json')) {
    schemaCount++;
  }

  // Mixed content
  const httpMatches = content.match(/(src|href)=["']http:\/\/(.*?)["']/g) || [];
  for (const m of httpMatches) {
    if (!m.includes('http://www.w3.org') && !m.includes('http://localhost')) {
      mixedContent.push({ page: relPath, match: m });
    }
  }

  // Links
  const linkMatches = content.matchAll(/<a [^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gs);
  for (const m of linkMatches) {
    const href = m[1];
    const fullTag = m[0];
    if (href === '') emptyHrefs++;
    if (href === '#') hashOnlyHrefs++;

    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!href.includes('netzhenduan.cc') && !href.includes('localhost')) {
        externalLinks.push({ page: relPath, href, fullTag });
        const isCommercial = href.includes('aff') || href.includes('code=') || href.includes('flycataff') || href.includes('gsyvipaff') || href.includes('breezenetaff') || href.includes('dalaoyunaff') || href.includes('shandianshuaff');
        if (isCommercial) {
          const hasRel = (fullTag.includes('nofollow') && fullTag.includes('sponsored'));
          if (!hasRel) {
            unflaggedAffiliateLinks.push({ page: relPath, href, fullTag });
          }
        }
      }
    } else if (href.startsWith('/')) {
      // Internal link
      let cleanHref = href.split('#')[0].split('?')[0];
      if (cleanHref.endsWith('/')) cleanHref = cleanHref.slice(0, -1);
      if (cleanHref === '') cleanHref = '/';
      if (!validHtmlSet.has(cleanHref) && !validHtmlSet.has(cleanHref + '/')) {
        // Check if it's an asset or /go/ redirect
        if (!cleanHref.startsWith('/go/') && !cleanHref.match(/\.(jpg|png|svg|ico|css|js|json)$/)) {
          internalBrokenLinks.push({ page: relPath, href, cleanHref });
        }
      }
    }
  }
}

console.log('=== 1. CANONICAL STATS ===', canonicalStats);
console.log('=== 2. NOINDEX PAGES ===', noindexPages.length, noindexPages);
console.log('=== 3. SCHEMA COUNT ===', schemaCount);
console.log('=== 4. MIXED CONTENT (HTTP) ===', mixedContent.length, mixedContent.slice(0, 5));
console.log('=== 5. EMPTY / HASH HREF COUNT ===', { emptyHrefs, hashOnlyHrefs });
console.log('=== 6. INTERNAL BROKEN LINKS ===', internalBrokenLinks.length, internalBrokenLinks.slice(0, 5));
console.log('=== 7. EXTERNAL LINKS TOTAL ===', externalLinks.length);
console.log('=== 8. UNFLAGGED AFFILIATE LINKS ===', unflaggedAffiliateLinks.length);

let dupTitles = [...titles.entries()].filter(([k, v]) => v > 1);
let dupDescs = [...descs.entries()].filter(([k, v]) => v > 1);
let dupH1s = [...h1s.entries()].filter(([k, v]) => v > 1);
console.log('=== 9. DUPLICATE METADATA ===');
console.log('Duplicate Titles:', dupTitles.length);
console.log('Duplicate Descriptions:', dupDescs.length);
console.log('Duplicate H1s:', dupH1s.length);

titleLengths.sort((a,b) => a - b);
descLengths.sort((a,b) => a - b);
console.log('=== 10. METADATA LENGTH RANGE ===');
console.log('Title length min/median/max:', titleLengths[0], titleLengths[Math.floor(titleLengths.length/2)], titleLengths[titleLengths.length-1]);
console.log('Desc length min/median/max:', descLengths[0], descLengths[Math.floor(descLengths.length/2)], descLengths[descLengths.length-1]);

// Anchor text check
let genericAnchors = [];
for (const f of htmlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/<a [^>]*href=["'](\/[^"']*)["'][^>]*>(.*?)<\/a>/gs);
  for (const m of matches) {
    const txt = m[2].replace(/<[^>]+>/g, '').trim();
    if (['点击这里', '查看详情', '阅读更多', '更多', '详情', '这里', 'link'].includes(txt)) {
      genericAnchors.push({ file: path.relative(distDir, f), href: m[1], text: txt });
    }
  }
}
console.log('=== 11. GENERIC ANCHOR TEXTS ===', genericAnchors.length);
if (genericAnchors.length > 0) {
  console.log('Sample generic anchors:', genericAnchors.slice(0, 10));
}

// Image check
let images = [];
let imgMissingLazy = 0;
let imgMissingAlt = 0;
let imgMissingDims = 0;

for (const f of htmlFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/<img [^>]*>/gs);
  for (const m of matches) {
    const tag = m[0];
    images.push(tag);
    if (!tag.includes('loading="lazy"')) imgMissingLazy++;
    if (!tag.includes('alt=')) imgMissingAlt++;
    if (!tag.includes('width=') || !tag.includes('height=')) imgMissingDims++;
  }
}
console.log('=== 12. IMAGE STATS ===', {
  totalImages: images.length,
  imgMissingLazy,
  imgMissingAlt,
  imgMissingDims
});
