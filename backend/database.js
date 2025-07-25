const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./assets.db');

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      owner TEXT NOT NULL,
      status TEXT NOT NULL
    )
  `);
});

module.exports = db;
