const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Tạo kết nối database
const dbPath = path.resolve(__dirname, '../../database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Khởi tạo database
function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
        console.log('Users table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
        console.log('Categories table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS sub_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id) REFERENCES categories(id)
      )`, (err) => {
        if (err) return reject(err);
        console.log('Sub categories table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        sub_category_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT,
        price INTEGER NOT NULL,
        warranty TEXT,
        repair_time TEXT,
        promotion TEXT,
        vip_discount INTEGER,
        student_discount INTEGER,
        images TEXT,
        status TEXT DEFAULT 'active',
        featured BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(category_id) REFERENCES categories(id),
        FOREIGN KEY(sub_category_id) REFERENCES sub_categories(id)
      )`, (err) => {
        if (err) return reject(err);
        console.log('Services table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS spare_parts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_id INTEGER,
        name TEXT NOT NULL,
        original_price INTEGER NOT NULL,
        discount_percent INTEGER DEFAULT 0,
        final_price INTEGER,
        warranty TEXT,
        repair_time TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(service_id) REFERENCES services(id)
      )`, (err) => {
        if (err) return reject(err);
        console.log('Spare parts table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        service_id INTEGER,
        spare_part_id INTEGER,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        scheduled_time DATETIME,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(service_id) REFERENCES services(id),
        FOREIGN KEY(spare_part_id) REFERENCES spare_parts(id)
      )`, (err) => {
        if (err) return reject(err);
        console.log('Orders table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        company_name TEXT,
        phone TEXT,
        phone_feedback TEXT,
        address TEXT,
        email TEXT,
        facebook TEXT,
        youtube TEXT,
        zalo TEXT,
        tiktok TEXT,
        messenger TEXT,
        instagram TEXT,
        certificates TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) return reject(err);
        console.log('Settings table ready');
      });

      db.run(`CREATE TABLE IF NOT EXISTS static_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT,
        content TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating static_pages table:', err.message);
          reject(err);
          return;
        }
        console.log('Static pages table ready');
        // CHỈ resolve() ở callback cuối cùng này!
        resolve();
      });
    });
  });
}

// Tạo admin mặc định
async function createDefaultAdmin() {
  return new Promise((resolve, reject) => {
    const defaultAdmin = {
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    };

    db.get('SELECT id FROM users WHERE username = ?', [defaultAdmin.username], (err, user) => {
      if (err) {
        console.error('Error checking admin:', err.message);
        reject(err);
        return;
      }

      if (!user) {
        db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [defaultAdmin.username, defaultAdmin.password, defaultAdmin.role],
          (err) => {
            if (err) {
              console.error('Error creating admin:', err.message);
              reject(err);
            } else {
              console.log('Default admin created');
              resolve();
            }
          }
        );
      } else {
        console.log('Admin already exists');
        resolve();
      }
    });
  });
}

// Tạo danh mục mặc định
async function createDefaultCategories() {
  return new Promise((resolve, reject) => {
    console.log('Checking for default categories...');
    db.get('SELECT COUNT(*) as count FROM categories', [], (err, row) => {
      if (err) {
        console.error('Error checking categories:', err.message);
        reject(err);
        return;
      }
      if (row.count === 0) {
        const defaultCategories = [
          { 
            name: 'iPhone',
            description: 'Dịch vụ sửa chữa iPhone',
            subCategories: [
              'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
              'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
              'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
              'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
              'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
              'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
              'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
              'iPhone 6s Plus', 'iPhone 6s', 'iPhone 6 Plus', 'iPhone 6'
            ]
          },
          { 
            name: 'Samsung',
            description: 'Dịch vụ sửa chữa Samsung',
            subCategories: [
              'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23',
              'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
              'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21',
              'Galaxy S20 Ultra', 'Galaxy S20+', 'Galaxy S20',
              'Galaxy Note 20 Ultra', 'Galaxy Note 20',
              'Galaxy Note 10+', 'Galaxy Note 10',
              'Galaxy A73', 'Galaxy A53', 'Galaxy A33',
              'Galaxy A72', 'Galaxy A52', 'Galaxy A32'
            ]
          },
          { 
            name: 'Oppo',
            description: 'Dịch vụ sửa chữa Oppo',
            subCategories: [
              'Find X6 Pro', 'Find X6', 'Find X5 Pro', 'Find X5',
              'Reno 10 Pro+', 'Reno 10 Pro', 'Reno 10',
              'Reno 9 Pro+', 'Reno 9 Pro', 'Reno 9',
              'Reno 8 Pro', 'Reno 8', 'Reno 7 Pro', 'Reno 7'
            ]
          },
          { 
            name: 'Xiaomi',
            description: 'Dịch vụ sửa chữa Xiaomi',
            subCategories: [
              '13 Pro', '13', '12 Pro', '12',
              'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
              'Redmi Note 11 Pro+', 'Redmi Note 11 Pro', 'Redmi Note 11',
              'POCO F5 Pro', 'POCO F5', 'POCO X5 Pro', 'POCO X5'
            ]
          },
          { 
            name: 'Vivo',
            description: 'Dịch vụ sửa chữa Vivo',
            subCategories: [
              'X90 Pro+', 'X90 Pro', 'X90',
              'V27 Pro', 'V27', 'V25 Pro', 'V25',
              'Y35', 'Y22', 'Y21', 'Y15'
            ]
          },
          { 
            name: 'Realme',
            description: 'Dịch vụ sửa chữa Realme',
            subCategories: [
              'GT Neo 5', 'GT Neo 3',
              '11 Pro+', '11 Pro', '11',
              '10 Pro+', '10 Pro', '10',
              '9 Pro+', '9 Pro', '9'
            ]
          },
          { 
            name: 'Macbook',
            description: 'Dịch vụ sửa chữa Macbook',
            subCategories: [
              'MacBook Pro 16" M3', 'MacBook Pro 14" M3',
              'MacBook Pro 16" M2', 'MacBook Pro 14" M2',
              'MacBook Air 15" M2', 'MacBook Air 13" M2',
              'MacBook Pro 16" M1', 'MacBook Pro 14" M1',
              'MacBook Air M1'
            ]
          },
          { 
            name: 'iPad',
            description: 'Dịch vụ sửa chữa iPad',
            subCategories: [
              'iPad Pro 12.9" M2', 'iPad Pro 11" M2',
              'iPad Pro 12.9" M1', 'iPad Pro 11" M1',
              'iPad Air 5', 'iPad Air 4',
              'iPad mini 6', 'iPad mini 5',
              'iPad 10', 'iPad 9', 'iPad 8'
            ]
          },
          { 
            name: 'AirPods',
            description: 'Dịch vụ sửa chữa AirPods',
            subCategories: [
              'AirPods Pro 2', 'AirPods Pro',
              'AirPods 3', 'AirPods 2', 'AirPods',
              'AirPods Max'
            ]
          },
          { 
            name: 'Huawei',
            description: 'Dịch vụ sửa chữa Huawei',
            subCategories: [
              'P60 Pro', 'P60', 'P50 Pro', 'P50',
              'Mate 50 Pro', 'Mate 50',
              'Nova 11 Pro', 'Nova 11', 'Nova 10 Pro', 'Nova 10'
            ]
          }
        ];

        // Insert categories and sub-categories
        for (const category of defaultCategories) {
          db.run(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [category.name, category.description],
            function(err) {
              if (err) {
                console.error('Error inserting category:', err.message);
                return;
              }
              const categoryId = this.lastID;

              // Insert sub-categories
              const stmt = db.prepare('INSERT INTO sub_categories (category_id, name) VALUES (?, ?)');
              for (const subCatName of category.subCategories) {
                stmt.run([categoryId, subCatName], (err) => {
                  if (err) {
                    console.error('Error inserting sub-category:', err.message);
                  }
                });
              }
              stmt.finalize();
            }
          );
        }
        console.log('Default categories and sub-categories created successfully');
        resolve();
      } else {
        console.log('Categories already exist');
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  initDb,
  createDefaultAdmin,
  createDefaultCategories
}; 