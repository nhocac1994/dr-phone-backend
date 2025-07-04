const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Sử dụng /data directory trên Render hoặc local path
const DB_PATH = process.env.NODE_ENV === 'production' ? '/data' : path.join(__dirname, '../..');
const DB_FILE = path.join(DB_PATH, 'database.sqlite');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(DB_PATH)) {
  console.log(`Creating database directory: ${DB_PATH}`);
  fs.mkdirSync(DB_PATH, { recursive: true });
}

console.log('Database path:', DB_FILE);
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.error('Current directory:', process.cwd());
    console.error('Database path:', DB_FILE);
    console.error('Directory exists:', fs.existsSync(DB_PATH));
    console.error('Directory permissions:', fs.statSync(DB_PATH).mode.toString(8));
  } else {
    console.log('Connected to database');
  }
});

function initDb() {
  console.log('Initializing database...');
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    )`);
    console.log('Database tables created');
  });
}

function createDefaultAdmin() {
  console.log('Checking for default admin...');
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
    if (err) {
      console.error('Error checking admin:', err.message);
      return;
    }
    if (!row) {
      const hash = await bcrypt.hash('admin123', 10);
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hash, 'admin'], (err) => {
        if (err) {
          console.error('Error creating admin:', err.message);
        } else {
          console.log('Created default admin account: admin/admin123');
        }
      });
    } else {
      console.log('Default admin already exists');
    }
  });
}

module.exports = { db, initDb, createDefaultAdmin }; 