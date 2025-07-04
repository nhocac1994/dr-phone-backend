const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

// Sử dụng thư mục trong project
const DB_PATH = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_PATH, 'database.sqlite');

// Log thông tin database
console.log('Database configuration:');
console.log('- Current directory:', process.cwd());
console.log('- Database path:', DB_FILE);
console.log('- Data directory:', DB_PATH);

// Đảm bảo thư mục data tồn tại
try {
  if (!fs.existsSync(DB_PATH)) {
    console.log('Creating data directory:', DB_PATH);
    fs.mkdirSync(DB_PATH, { recursive: true });
  }
  console.log('Data directory is ready');
} catch (err) {
  console.error('Error with data directory:', err.message);
  // Thử tạo trong thư mục hiện tại
  const fallbackPath = path.join(process.cwd(), 'database.sqlite');
  console.log('Falling back to:', fallbackPath);
  DB_FILE = fallbackPath;
}

// Kết nối database
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.error('Error code:', err.code);
    console.error('Error number:', err.errno);
    return;
  }
  console.log('Successfully connected to database');
});

function initDb() {
  console.log('Initializing database tables...');
  db.serialize(() => {
    // Tạo bảng users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating users table:', err.message);
      else console.log('Users table ready');
    });

    // Tạo bảng services
    db.run(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating services table:', err.message);
      else console.log('Services table ready');
    });

    // Tạo bảng categories
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating categories table:', err.message);
      else console.log('Categories table ready');
    });

    // Tạo bảng orders
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      service_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(service_id) REFERENCES services(id)
    )`, (err) => {
      if (err) console.error('Error creating orders table:', err.message);
      else console.log('Orders table ready');
    });
  });
}

function createDefaultAdmin() {
  console.log('Checking for default admin account...');
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
    if (err) {
      console.error('Error checking admin account:', err.message);
      return;
    }
    if (!row) {
      try {
        const hash = await bcrypt.hash('admin123', 10);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
          ['admin', hash, 'admin'], 
          (err) => {
            if (err) console.error('Error creating admin account:', err.message);
            else console.log('Default admin account created successfully');
          }
        );
      } catch (err) {
        console.error('Error hashing password:', err.message);
      }
    } else {
      console.log('Default admin account already exists');
    }
  });
}

module.exports = { db, initDb, createDefaultAdmin }; 