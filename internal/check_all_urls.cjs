const fs = require('fs');
const http = require('http');

const sitemap = fs.readFileSync('docs/.vitepress/dist/sitemap.xml', 'utf8');
const locMatches = [...sitemap.matchAll(/<loc>https:\/\/netzhenduan\.cc(.*?)<\/loc>/g)];
const urls = locMatches.map(m => m[1] || '/');

console.log(`Starting HTTP 200 check for all ${urls.length} sitemap URLs...`);

let done = 0;
let errors = 0;

function checkUrl(urlPath) {
  return new Promise((resolve) => {
    http.get('http://localhost:4173' + urlPath, (res) => {
      if (res.statusCode === 200) {
        done++;
      } else {
        console.error(`FAIL [${res.statusCode}]: ${urlPath}`);
        errors++;
      }
      res.resume();
      resolve();
    }).on('error', (e) => {
      console.error(`ERROR: ${urlPath} -> ${e.message}`);
      errors++;
      resolve();
    });
  });
}

async function run() {
  for (const u of urls) {
    await checkUrl(u);
  }
  console.log(`\n=== CHECK COMPLETE ===`);
  console.log(`Total checked: ${urls.length}`);
  console.log(`Success (200 OK): ${done}`);
  console.log(`Errors: ${errors}`);
  if (errors > 0) process.exit(1);
}

run();
