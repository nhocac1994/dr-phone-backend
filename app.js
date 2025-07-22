require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { db, initDb, createDefaultUsers, createDefaultCategories, createDefaultStaticPages, createDefaultOrders } = require('./src/config/db');

const app = express();

// CORS middleware phải đặt đầu tiên
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://dr-phone.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Thêm CORS headers cho mọi response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Cho phép tất cả các origin
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', true);
  
  // Handle OPTIONS method
  if ('OPTIONS' === req.method) {
    res.status(204).send();
  } else {
    next();
  }
});

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/img');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use('/img', express.static(path.join(__dirname, 'public/img'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Log static file directories
console.log('Static file directories:');
console.log('- Public dir:', path.join(__dirname, 'public'));
console.log('- Image dir:', path.join(__dirname, 'public/img'));

// Debug logging
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  req.app.set('db', db);
  next();
});

// Routes
const authRoutes = require('./src/routes/auth');
const serviceRoutes = require('./src/routes/services');
const userRoutes = require('./src/routes/users');
const orderRoutes = require('./src/routes/orders');
const categoryRoutes = require('./src/routes/categories');
const bannerRoutes = require('./src/routes/banners');
const settingsRoutes = require('./src/routes/settings');
const staticPagesRoutes = require('./src/routes/staticPages');
const uploadRoutes = require('./src/routes/upload');
const notificationRoutes = require('./src/routes/notifications');
const flashsaleRoutes = require('./src/routes/flashsale');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/static-pages', staticPagesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flashsale', flashsaleRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Phone Repair Shop API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Test image route
app.get('/check-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'public/img', filename);
  
  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`Image not found: ${imagePath}`);
      return res.status(404).json({ 
        error: 'Image not found',
        path: imagePath,
        exists: false
      });
    }
    
    console.log(`Image exists: ${imagePath}`);
    res.json({ 
      message: 'Image exists',
      path: imagePath,
      url: `${req.protocol}://${req.get('host')}/img/${filename}`,
      exists: true
    });
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Khởi tạo database và tạo tài khoản admin
async function initializeApp() {
  try {
    console.log('--- Bắt đầu initDb ---');
    await initDb();
    console.log('--- xong initDb ---');
    await createDefaultUsers();
    console.log('--- xong createDefaultUsers ---');
    await createDefaultCategories();
    console.log('--- xong createDefaultCategories ---');
    await createDefaultStaticPages();
    console.log('--- xong createDefaultStaticPages ---');
    await createDefaultOrders();
    console.log('--- xong createDefaultOrders ---');
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Image URL example: http://localhost:${PORT}/img/test.jpg`);
    });
  } catch (error) {
    console.error('Error initializing application:', error);
    console.error(error.stack);
    process.exit(1);
  }
}
initializeApp(); 