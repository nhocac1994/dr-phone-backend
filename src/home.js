const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { initDb, createDefaultAdmin, createDefaultCategories } = require('./config/db');
const fs = require('fs');

// Debug logging
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('File location:', __filename);

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Debug middleware
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  });
  next();
});

// CORS config
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://dr-phone.netlify.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Cho phép xử lý form data
app.use(morgan('dev'));

// Phục vụ file tĩnh từ thư mục public
app.use('/img', (req, res, next) => {
  console.log('Image request:', req.url);
  const filePath = path.join(__dirname, '../public/img', req.url.split('?')[0]);
  console.log('Image file path:', filePath);
  console.log('File exists:', fs.existsSync(filePath));
  next();
}, express.static(path.join(__dirname, '../public/img')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Khởi tạo DB và admin mặc định
initDb();
createDefaultAdmin();
createDefaultCategories();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/static-pages', require('./routes/staticPages'));
app.use('/api/upload', require('./routes/upload'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Phone Repair Shop API Server',
    status: 'running',
    timestamp: new Date().toISOString(),
    directory: process.cwd(),
    dirname: __dirname
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 