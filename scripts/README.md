# Development Scripts

Các script hỗ trợ chạy và demo dự án Vimiss Study Abroad Management.

## Quick Start (Dành cho lần đầu)

```bash
scripts\quick-demo.bat
```

Script này sẽ tự động:
- Cài đặt tất cả dependencies
- Setup database với data demo
- Khởi động development servers

## Scripts Available

### `setup.bat` - Cài đặt ban đầu
Chạy lần đầu tiên hoặc khi pull code mới.

```bash
scripts\setup.bat
```

Các bước thực hiện:
1. `composer install` - Cài đặt PHP dependencies
2. `npm install` - Cài đặt frontend dependencies  
3. Copy `.env.example` → `.env`
4. `php artisan key:generate` - Tạo app key
5. Tạo database SQLite
6. `php artisan migrate` - Chạy migrations
7. `php artisan db:seed` - Seed data demo

### `dev.bat` - Chạy development server
Khởi động Laravel serve + Vite dev server.

```bash
scripts\dev.bat
```

- **Laravel**: http://localhost:8000
- **Vite HMR**: http://localhost:5173

Nhấn `Ctrl+C` để dừng.

### `fresh.bat` - Reset database
Xóa toàn bộ data và seed lại từ đầu.

```bash
scripts\fresh.bat
```

⚠️ **Cảnh báo**: Script này sẽ XÓA toàn bộ dữ liệu hiện tại!

### `test.bat` - Chạy PHPUnit tests

```bash
scripts\test.bat
```

### `build.bat` - Build production
Build frontend assets cho production.

```bash
scripts\build.bat
```

Các bước:
1. Clear caches
2. `npm run build` - Build Vite
3. Cache config/routes/views

### `clean.bat` - Xóa cache/logs

```bash
scripts\clean.bat
```

Xóa:
- Laravel caches (config, route, view, cache)
- Log files
- Compiled views

## Demo Accounts

Sau khi chạy `setup.bat` hoặc `fresh.bat`, dùng các tài khoản sau để login:

| Email                  | Password | Role     |
|------------------------|----------|----------|
| admin@vimiss.vn        | password | Admin    |
| director@vimiss.vn     | password | Director |
| mentor1@vimiss.vn      | password | Mentor   |
| mentor2@vimiss.vn      | password | Mentor   |
| student1@vimiss.vn     | password | Student  |
| student2@vimiss.vn     | password | Student  |
| student3@vimiss.vn     | password | Student  |

## Workflow thông thường

### Lần đầu setup
```bash
scripts\setup.bat
scripts\dev.bat
```

### Reset database (khi cần)
```bash
scripts\fresh.bat
```

### Hàng ngày phát triển
```bash
scripts\dev.bat
```

### Khi pull code mới
```bash
composer install
npm install
php artisan migrate
```

hoặc chạy lại `setup.bat` nếu cần reset hoàn toàn.
