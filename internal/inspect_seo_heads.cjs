const fs = require('fs');

const testFiles = ['index.html', 'airports/index.html', 'airports/guangsu.html', 'about.html', '404.html'];

testFiles.forEach(file => {
  const filePath = `docs/.vitepress/dist/${file}`;
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}`);
    return;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  console.log(`\n=== SEO HEAD INSPECT: ${file} ===`);
  
  // Title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NONE');

  // Description
  const descMatch = html.match(/<meta name=["']description["'] content=["'](.*?)["']/);
  console.log('Description:', descMatch ? descMatch[1] : 'NONE');

  // Canonical
  const canonMatch = html.match(/<link rel=["']canonical["'] href=["'](.*?)["']/);
  console.log('Canonical:', canonMatch ? canonMatch[1] : 'NONE');

  // Robots
  const robotsMatch = html.match(/<meta name=["']robots["'] content=["'](.*?)["']/);
  console.log('Robots:', robotsMatch ? robotsMatch[1] : 'NONE');

  // OG
  const ogTitle = html.match(/<meta property=["']og:title["'] content=["'](.*?)["']/);
  const ogUrl = html.match(/<meta property=["']og:url["'] content=["'](.*?)["']/);
  const ogType = html.match(/<meta property=["']og:type["'] content=["'](.*?)["']/);
  const ogImage = html.match(/<meta property=["']og:image["'] content=["'](.*?)["']/);
  console.log('OG Title:', ogTitle ? ogTitle[1] : 'NONE');
  console.log('OG URL:', ogUrl ? ogUrl[1] : 'NONE');
  console.log('OG Type:', ogType ? ogType[1] : 'NONE');
  console.log('OG Image:', ogImage ? ogImage[1] : 'NONE');

  // Twitter
  const twCard = html.match(/<meta name=["']twitter:card["'] content=["'](.*?)["']/);
  const twTitle = html.match(/<meta name=["']twitter:title["'] content=["'](.*?)["']/);
  console.log('Twitter Card:', twCard ? twCard[1] : 'NONE');
  console.log('Twitter Title:', twTitle ? twTitle[1] : 'NONE');

  // Schema
  const schemaMatch = html.match(/<script type=["']application\/ld\+json["']>(.*?)<\/script>/);
  if (schemaMatch) {
    try {
      const parsed = JSON.parse(schemaMatch[1]);
      const types = parsed['@graph'] ? parsed['@graph'].map(g => g['@type']).join(', ') : parsed['@type'];
      console.log('Schema @type:', types);
    } catch (e) {
      console.log('Schema: Error parsing JSON', e.message);
    }
  } else {
    console.log('Schema: NONE');
  }
});
