const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Đảm bảo thư mục upload tồn tại
const uploadDir = path.join(__dirname, 'public/test-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = uniqueSuffix + ext;
    console.log('Saving file with name:', filename);
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// Test route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Test Upload</title></head>
      <body>
        <h1>Test Upload</h1>
        <form action="/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="testImage" />
          <button type="submit">Upload</button>
        </form>
      </body>
    </html>
  `);
});

// Upload route
app.post('/upload', upload.single('testImage'), (req, res) => {
  console.log('File received:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    file: req.file
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
}); 