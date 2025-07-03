# Phone Repair Backend (Express + SQLite)

## Cài đặt

```bash
cd backend
npm install
```

## Chạy server

```bash
npm run dev   # Chạy dev (hot reload)
npm start     # Chạy production
```

## Cấu trúc thư mục

- src/app.js           // Entrypoint
- src/routes/          // Định nghĩa route
- src/controllers/     // Xử lý logic
- src/models/          // Truy vấn DB
- src/middlewares/     // Middleware (auth, error, ...)
- src/config/          // Cấu hình (DB, JWT, ...)

## Tài khoản admin mặc định
- user: `admin`
- pass: `admin123`

## Môi trường
- Tạo file `.env` (xem file `.env.example`)

## API mẫu
- Đăng nhập: `POST /api/auth/login`
- CRUD user: `GET/POST/PUT/DELETE /api/users`
- CRUD service: `GET/POST/PUT/DELETE /api/services`
- CRUD order: `GET/POST/PUT/DELETE /api/orders`

## Liên hệ hỗ trợ
- Zalo: 0969.123.456 