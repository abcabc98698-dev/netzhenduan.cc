const fs = require('fs');
['about.html', 'methodology.html', 'disclosure.html', 'privacy.html', 'terms.html', 'index.html', 'airports/guangsu.html'].forEach(f => {
  const c = fs.readFileSync('docs/.vitepress/dist/' + f, 'utf8');
  const m = c.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
  if (m) {
    try {
      const parsed = JSON.parse(m[1]);
      console.log(f, 'VALID JSON-LD -> @type:', parsed['@type'] || (parsed['@graph'] && parsed['@graph'].map(g => g['@type']).join(', ')));
    } catch (e) {
      console.error(f, 'INVALID JSON:', e.message);
    }
  } else {
    console.error(f, 'SCHEMA MISSING');
  }
});
