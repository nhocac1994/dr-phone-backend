require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { db, initDb, createDefaultAdmin, createDefaultCategories } = require('./src/config/db');

const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://dr-phone.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middleware
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

app.use(cors(corsOptions));
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/auth');
const serviceRoutes = require('./src/routes/services');
const userRoutes = require('./src/routes/users');
const orderRoutes = require('./src/routes/orders');
const categoryRoutes = require('./src/routes/categories');

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Phone Repair Shop API Server',
    status: 'running',
    timestamp: new Date().toISOString()
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
    await initDb();
    await createDefaultAdmin();
    await createDefaultCategories();
    
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error initializing application:', error);
    process.exit(1);
  }
}

initializeApp(); 