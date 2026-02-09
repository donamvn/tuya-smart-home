# Nhà Thông Minh - Tuya Smart Home Dashboard

Dashboard web điều khiển thiết bị thông minh trong gia đình, kết nối qua Tuya Cloud API.

## Tính năng

- Hiển thị tất cả thiết bị Tuya trong gia đình
- Bật/tắt thiết bị trực tiếp từ dashboard
- Xem trạng thái chi tiết (nhiệt độ, độ ẩm, công suất, v.v.)
- Điều khiển nâng cao (độ sáng, chế độ, v.v.)
- Tìm kiếm và lọc thiết bị theo loại, trạng thái
- Tự động cập nhật trạng thái mỗi 30 giây
- Giao diện tiếng Việt, responsive

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **@tuya/tuya-connector-nodejs** - Tuya Cloud SDK
- **Tailwind CSS** - UI styling
- **Lucide React** - Icons

## Cài đặt

### Yêu cầu

- Node.js 18+
- Tài khoản [Tuya IoT Platform](https://iot.tuya.com)
- Cloud Project với thiết bị đã liên kết

### Bước 1: Clone và cài đặt

```bash
git clone https://github.com/user/tuya-smart-home.git
cd tuya-smart-home
npm install
```

### Bước 2: Cấu hình

Copy file `.env.example` thành `.env.local` và điền thông tin:

```bash
cp .env.example .env.local
```

Chỉnh sửa `.env.local`:

```
TUYA_ACCESS_ID=your_access_id
TUYA_ACCESS_SECRET=your_access_secret
TUYA_BASE_URL=https://openapi.tuyaus.com
```

**Base URL theo vùng:**
- Trung Quốc: `https://openapi.tuyacn.com`
- Tây Mỹ: `https://openapi.tuyaus.com`
- Trung Âu: `https://openapi.tuyaeu.com`
- Ấn Độ: `https://openapi.tuyain.com`

### Bước 3: Chạy

```bash
npm run dev
```

Mở http://localhost:3000

## Thiết lập Tuya IoT Platform

1. Đăng ký tại [iot.tuya.com](https://iot.tuya.com)
2. Tạo Cloud Project (chọn Smart Home)
3. Subscribe các API: IoT Core, Smart Home Basic Service
4. Liên kết tài khoản Tuya Smart App (Devices → Link Tuya App Account)
5. Lấy Access ID và Access Secret từ Project Overview
