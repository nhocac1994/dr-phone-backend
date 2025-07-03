const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { initDb, createDefaultAdmin } = require('./config/db');

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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/services', require('./routes/services'));
app.use('/api/orders', require('./routes/orders'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Phone Repair Shop API Server',
    status: 'running',
    timestamp: new Date().toISOString()
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