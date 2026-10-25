const fs = require('fs');
const path = require('path');

function getMdFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getMdFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getMdFiles(path.join(__dirname, '../docs'));
console.log('--- 页面汉字数统计报告 (按指令第五条口径) ---');
let totalChars = 0;
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const clean = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[\s\S]*?>/g, '')
    .replace(/https?:\/\/[^\s]+/g, '');
  const hanMatches = clean.match(/[\u4e00-\u9fa5]/g) || [];
  const relPath = path.relative(path.join(__dirname, '..'), f).replace(/\\/g, '/');
  console.log(`${relPath} : ${hanMatches.length} 汉字`);
  totalChars += hanMatches.length;
});
console.log(`全站已落盘 Markdown 页面总汉字数: ${totalChars} 汉字`);
