const fs = require('fs');
const path = require('path');

function countHan(file) {
  const content = fs.readFileSync(file, 'utf8');
  const clean = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[\s\S]*?>/g, '')
    .replace(/https?:\/\/[^\s]+/g, '');
  const matches = clean.match(/[\u4e00-\u9fa5]/g) || [];
  return matches.length;
}

const csvPath = path.join(__dirname, 'CONTENT_INVENTORY.csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n');
const header = lines[0];
const updated = [header];

let updatedCount = 0;
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const m = line.match(/(docs\/[^\s,]+\.md)/);
  if (!m) {
    updated.push(line);
    continue;
  }
  
  const sf = m[1];
  const fullPath = path.join(__dirname, '..', sf);
  if (fs.existsSync(fullPath)) {
    const realHan = countHan(fullPath);
    // Find where actual_han_chars is located in the row.
    // In standard rows: ...,url,source_file,target_han_chars,actual_han_chars,...
    // Or in short rows: ...,sf,target_han_chars,actual_han_chars,...
    const parts = line.split(',');
    const sfIdx = parts.indexOf(sf);
    if (sfIdx !== -1 && sfIdx + 2 < parts.length) {
      const oldHan = parts[sfIdx + 2];
      if (oldHan !== String(realHan)) {
        console.log(`Updating ${sf}: ${oldHan} -> ${realHan}`);
        parts[sfIdx + 2] = String(realHan);
        updatedCount++;
      }
      updated.push(parts.join(','));
    } else {
      updated.push(line);
    }
  } else {
    updated.push(line);
  }
}

fs.writeFileSync(csvPath, updated.join('\n') + '\n', 'utf8');
console.log(`CONTENT_INVENTORY.csv synchronized cleanly. Updated rows: ${updatedCount}`);
