const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'pos.db');

console.log('🗑️  Resetting database...');

if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Database file deleted successfully!');
} else {
    console.log('ℹ️  No database file found (already clean)');
}

console.log('\n📝 Next steps:');
console.log('   1. Restart the server to create fresh empty tables');
console.log('   2. (Optional) Run "npm run demo" to populate with sample data\n');
