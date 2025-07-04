const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { initDb, createDefaultAdmin, createDefaultCategories } = require('./config/db');

// Debug logging
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('File location:', __filename);

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// CORS config
app.use(cors());

app.use(express.json());
app.use(morgan('dev'));

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