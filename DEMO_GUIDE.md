# Hướng dẫn chạy thử Demo — Vimiss Study Abroad

> Dành cho người **không cần biết lập trình**. Bạn chỉ cần cài một phần mềm duy nhất rồi chạy 1 lệnh.

---

## Yêu cầu

| Thứ cần cài | Link tải |
|-------------|----------|
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ |

> **Docker Desktop** là phần mềm giúp chạy ứng dụng trong "hộp ảo" (container) mà không cần cài PHP, Node.js hay bất kỳ thứ gì khác.

---

## Các bước thực hiện

### Bước 1 — Cài Docker Desktop

1. Vào link: https://www.docker.com/products/docker-desktop/
2. Tải về và cài đặt bình thường (Next → Next → Finish).
3. Sau khi cài xong, **mở Docker Desktop** và đợi cho đến khi thấy chữ **"Engine running"** ở góc dưới bên trái (có thể mất 1–2 phút).

> Nếu máy hỏi "Enable WSL 2?" → Chọn **Yes** và làm theo hướng dẫn.

---

### Bước 2 — Lấy mã nguồn về máy

Chọn một trong hai cách:

**Cách A — Tải file ZIP** *(khuyên dùng nếu bạn không dùng Git)*

1. Nhấn nút **Code → Download ZIP** trên trang GitHub.
2. Giải nén vào một thư mục bạn muốn, ví dụ: `C:\Demo\vimiss`.

**Cách B — Dùng Git**

```
git clone <đường-link-repo> vimiss
```

---

### Bước 3 — Mở terminal trong thư mục dự án

- **Windows:** Mở thư mục vừa giải nén → nhấn chuột phải vào vùng trắng → chọn **"Open in Terminal"** (hoặc **"Open PowerShell window here"**).
- **macOS:** Mở thư mục → nhấp chuột phải → **"New Terminal at Folder"**.

---

### Bước 4 — Chạy ứng dụng

Dán lệnh sau vào terminal rồi nhấn **Enter**:

```
docker compose up --build
```

> Lần đầu chạy sẽ mất **5–10 phút** để tải về các thành phần cần thiết. Từ lần thứ 2 trở đi chỉ mất khoảng 30 giây.

Khi bạn thấy dòng tương tự như:

```
vimiss_web  | ... ready
```

thì ứng dụng đã sẵn sàng.

---

### Bước 5 — Mở trình duyệt

Truy cập: **http://localhost:8080**

---

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin | `admin@vimiss.vn` | `password` |
| Giám đốc | `director@vimiss.vn` | `password` |
| Cố vấn 1 | `mentor1@vimiss.vn` | `password` |
| Cố vấn 2 | `mentor2@vimiss.vn` | `password` |
| Học sinh 1 | `student1@vimiss.vn` | `password` |
| Học sinh 2 | `student2@vimiss.vn` | `password` |
| Học sinh 3 | `student3@vimiss.vn` | `password` |

---

## Dừng ứng dụng

Quay lại terminal đang chạy và nhấn **Ctrl + C**, hoặc chạy lệnh:

```
docker compose down
```

---

## Xử lý sự cố thường gặp

| Vấn đề | Giải pháp |
|--------|-----------|
| Trang không mở được | Đợi thêm 1–2 phút rồi thử lại; kiểm tra Docker Desktop đã "running" chưa |
| Lỗi "port 8080 already in use" | Tắt ứng dụng khác đang dùng cổng 8080, hoặc báo team dev để đổi cổng |
| Lỗi "Docker daemon not running" | Mở Docker Desktop và đợi nó khởi động xong |
| Màn hình trắng sau khi đăng nhập | Thử xóa cache trình duyệt (Ctrl + Shift + Delete) |

---

> Nếu gặp vấn đề không có trong danh sách trên, chụp màn hình lỗi và gửi cho team kỹ thuật.
