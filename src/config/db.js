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

      let tablesCreated = 0;
      const totalTables = 7;

      const checkComplete = () => {
        tablesCreated++;
        if (tablesCreated === totalTables) {
          console.log('All tables created successfully');
          resolve();
        }
      };

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
          return;
        }
        console.log('Users table ready');
        checkComplete();
      });

      db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating categories table:', err);
          reject(err);
          return;
        }
        console.log('Categories table ready');
        checkComplete();
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
        if (err) {
          console.error('Error creating sub_categories table:', err);
          reject(err);
          return;
        }
        console.log('Sub categories table ready');
        checkComplete();
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
        if (err) {
          console.error('Error creating services table:', err);
          reject(err);
          return;
        }
        console.log('Services table ready');
        checkComplete();
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
        if (err) {
          console.error('Error creating spare_parts table:', err);
          reject(err);
          return;
        }
        console.log('Spare parts table ready');
        checkComplete();
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
        if (err) {
          console.error('Error creating orders table:', err);
          reject(err);
          return;
        }
        console.log('Orders table ready');
        checkComplete();
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
        if (err) {
          console.error('Error creating settings table:', err);
          reject(err);
          return;
        }
        console.log('Settings table ready');
        checkComplete();
      });

      db.run(`CREATE TABLE IF NOT EXISTS static_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT,
        content TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating static_pages table:', err);
          reject(err);
          return;
        }
        console.log('Static pages table ready');
        checkComplete();
      });

      db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        auth TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, endpoint)
      )`, (err) => {
        if (err) {
          console.error('Error creating push_subscriptions table:', err);
          reject(err);
          return;
        }
        console.log('Push subscriptions table ready');
        checkComplete();
      });
    });
  });
}

// Tạo tài khoản mặc định
async function createDefaultUsers() {
  return new Promise((resolve, reject) => {
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@drphone.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        is_active: true
      },
      {
        username: 'user1',
        email: 'user1@drphone.com',
        password: bcrypt.hashSync('user123', 10),
        role: 'user',
        is_active: true
      },
      {
        username: 'staff1',
        email: 'staff1@drphone.com',
        password: bcrypt.hashSync('staff123', 10),
        role: 'user',
        is_active: true
      }
    ];

    let completed = 0;
    const totalUsers = defaultUsers.length;

    const checkComplete = () => {
      completed++;
      if (completed === totalUsers) {
        console.log('All default users created/checked');
        resolve();
      }
    };

    for (const user of defaultUsers) {
      db.get('SELECT id FROM users WHERE username = ?', [user.username], (err, existingUser) => {
        if (err) {
          console.error(`Error checking user ${user.username}:`, err.message);
          checkComplete();
          return;
        }

        if (!existingUser) {
          db.run(
            'INSERT INTO users (username, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [user.username, user.email, user.password, user.role, user.is_active],
            (err) => {
              if (err) {
                console.error(`Error creating user ${user.username}:`, err.message);
              } else {
                console.log(`Default user ${user.username} created`);
              }
              checkComplete();
            }
          );
        } else {
          console.log(`User ${user.username} already exists`);
          checkComplete();
        }
      });
    }
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

// Tạo dữ liệu mẫu cho static pages
async function createDefaultStaticPages() {
  return new Promise((resolve, reject) => {
    const defaultPages = [
      { slug: 'payment', title: 'Hình thức thanh toán', content: '<h2>Hình thức thanh toán</h2><p>Chúng tôi chấp nhận các hình thức thanh toán sau:</p><ul><li>Tiền mặt</li><li>Chuyển khoản ngân hàng</li><li>Ví điện tử</li></ul>' },
      { slug: 'warranty', title: 'Chính sách bảo hành', content: '<h2>Chính sách bảo hành</h2><p>Chúng tôi cam kết bảo hành:</p><ul><li>Linh kiện chính hãng: 12 tháng</li><li>Dịch vụ sửa chữa: 3 tháng</li><li>Bảo hành theo tiêu chuẩn nhà sản xuất</li></ul>' },
      { slug: 'privacy', title: 'Chính sách bảo mật', content: '<h2>Chính sách bảo mật</h2><p>Thông tin của bạn được bảo mật tuyệt đối:</p><ul><li>Không chia sẻ thông tin cá nhân</li><li>Mã hóa dữ liệu</li><li>Tuân thủ quy định GDPR</li></ul>' },
      { slug: 'return', title: 'Chính sách đổi trả', content: '<h2>Chính sách đổi trả</h2><p>Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày:</p><ul><li>Sản phẩm còn nguyên vẹn</li><li>Có hóa đơn mua hàng</li><li>Không sử dụng dịch vụ</li></ul>' },
      { slug: 'recruitment', title: 'Tuyển dụng', content: '<h2>Tuyển dụng</h2><p>Chúng tôi đang tuyển dụng các vị trí:</p><ul><li>Kỹ thuật viên sửa chữa</li><li>Nhân viên bán hàng</li><li>Quản lý cửa hàng</li></ul>' },
      { slug: 'about', title: 'Giới thiệu', content: '<h2>Giới thiệu</h2><p>Chúng tôi là đơn vị chuyên sửa chữa điện thoại uy tín:</p><ul><li>Kinh nghiệm 10+ năm</li><li>Đội ngũ kỹ thuật viên chuyên nghiệp</li><li>Linh kiện chính hãng</li></ul>' },
      { slug: 'news', title: 'Tin tức', content: '<h2>Tin tức</h2><p>Cập nhật những tin tức mới nhất về công nghệ và sửa chữa điện thoại.</p>' },
      { slug: 'partners', title: 'Đối tác thương hiệu', content: '<h2>Đối tác thương hiệu</h2><p>Chúng tôi là đối tác chính thức của các thương hiệu:</p><ul><li>Apple</li><li>Samsung</li><li>Xiaomi</li><li>OPPO</li></ul>' },
      { slug: 'owner', title: 'Thông tin chủ sở hữu Website', content: '<h2>Thông tin chủ sở hữu Website</h2><p>Thông tin về chủ sở hữu và quản lý website.</p>' },
      { slug: 'license', title: 'Giấy phép ủy quyền', content: '<h2>Giấy phép ủy quyền</h2><p>Chúng tôi có đầy đủ giấy phép và chứng chỉ:</p><ul><li>Giấy phép kinh doanh</li><li>Chứng chỉ kỹ thuật viên</li><li>Giấy phép sửa chữa</li></ul>' }
    ];

    let completed = 0;
    const total = defaultPages.length;

    defaultPages.forEach(page => {
      db.get('SELECT id FROM static_pages WHERE slug = ?', [page.slug], (err, row) => {
        if (err) {
          console.error('Error checking static page:', err.message);
          completed++;
          if (completed === total) resolve();
          return;
        }

        if (!row) {
          db.run('INSERT INTO static_pages (slug, title, content) VALUES (?, ?, ?)',
            [page.slug, page.title, page.content],
            (err) => {
              if (err) {
                console.error('Error creating static page:', err.message);
              } else {
                console.log(`Created static page: ${page.slug}`);
              }
              completed++;
              if (completed === total) resolve();
            }
          );
        } else {
          console.log(`Static page already exists: ${page.slug}`);
          completed++;
          if (completed === total) resolve();
        }
      });
    });
  });
}

// Tạo dữ liệu mẫu cho orders
async function createDefaultOrders() {
  return new Promise((resolve, reject) => {
    console.log('Checking for default orders...');
    db.get('SELECT COUNT(*) as count FROM orders', [], (err, row) => {
      if (err) {
        console.error('Error checking orders:', err.message);
        reject(err);
        return;
      }
      if (row.count === 0) {
        const defaultOrders = [
          {
            user_id: 1,
            service_id: 1,
            customer_name: 'Nguyễn Văn A',
            customer_phone: '0123456789',
            customer_email: 'nguyenvana@email.com',
            scheduled_time: '2024-01-20 14:00:00',
            notes: 'Màn hình bị vỡ, cần thay màn hình mới',
            status: 'pending'
          },
          {
            user_id: 1,
            service_id: 2,
            customer_name: 'Trần Thị B',
            customer_phone: '0987654321',
            customer_email: 'tranthib@email.com',
            scheduled_time: '2024-01-21 10:00:00',
            notes: 'Pin chai nhanh, cần thay pin',
            status: 'confirmed'
          },
          {
            user_id: 1,
            service_id: 3,
            customer_name: 'Lê Văn C',
            customer_phone: '0369852147',
            customer_email: 'levanc@email.com',
            scheduled_time: '2024-01-22 16:00:00',
            notes: 'Không sạc được, có thể do cổng sạc bị hỏng',
            status: 'processing'
          }
        ];

        let completed = 0;
        const total = defaultOrders.length;

        defaultOrders.forEach(order => {
          db.run(
            'INSERT INTO orders (user_id, service_id, customer_name, customer_phone, customer_email, scheduled_time, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [order.user_id, order.service_id, order.customer_name, order.customer_phone, order.customer_email, order.scheduled_time, order.notes, order.status],
            (err) => {
              if (err) {
                console.error('Error creating order:', err.message);
              } else {
                console.log(`Created order: ${order.customer_name}`);
              }
              completed++;
              if (completed === total) {
                console.log('Default orders created successfully');
                resolve();
              }
            }
          );
        });
      } else {
        console.log('Orders already exist');
        resolve();
      }
    });
  });
}

module.exports = {
  db,
  initDb,
  createDefaultUsers,
  createDefaultCategories,
  createDefaultStaticPages,
  createDefaultOrders
}; 