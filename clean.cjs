const fs = require('fs');
['src/data.ts', 'src/services/notifications.ts'].forEach(f => {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/'https:\/\/images\.unsplash\.com\/[^']*'/g, "''");
  fs.writeFileSync(f, s, 'utf8');
});
console.log('Done');
