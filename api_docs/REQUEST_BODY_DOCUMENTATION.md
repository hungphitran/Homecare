# Tài Liệu API - Mô Tả Request Body cho POST/PUT Endpoints

## Mục Lục
1. [Authentication Endpoints](#authentication-endpoints)
2. [Account Management Endpoints](#account-management-endpoints)
3. [Request Management Endpoints](#request-management-endpoints)
4. [Review & Payment Endpoints](#review--payment-endpoints)

---

## Authentication Endpoints

### 1. Đăng Ký Customer
**Endpoint:** `POST /auth/register/customer`

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123",
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@email.com",
  "address": {
    "province": "Hồ Chí Minh",
    "district": "Quận 1", 
    "ward": "Phường Bến Nghé",
    "detailAddress": "123 Đường Lê Lợi"
  }
}
```

**Validation Rules:**
- `phone`: Bắt buộc, định dạng số điện thoại Việt Nam (10-11 số, bắt đầu bằng 0)
- `password`: Bắt buộc, tối thiểu 6 ký tự
- `fullName`: Bắt buộc, tên đầy đủ của khách hàng
- `email`: Tùy chọn, định dạng email hợp lệ
- `address`: Bắt buộc, đối tượng chứa thông tin địa chỉ đầy đủ
  - `province`: Tỉnh/Thành phố (bắt buộc)
  - `district`: Quận/Huyện (bắt buộc)
  - `ward`: Phường/Xã (bắt buộc)
  - `detailAddress`: Địa chỉ chi tiết (bắt buộc)

---

### 2. Đăng Nhập Customer
**Endpoint:** `POST /auth/login/customer`

**Request Body:**
```json
{
  "phone": "0123456789",
  "password": "password123"
}
```

**Validation Rules:**
- `phone`: Bắt buộc, số điện thoại đã đăng ký
- `password`: Bắt buộc, mật khẩu chính xác

---

### 3. Refresh Token
**Endpoint:** `POST /auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- `refreshToken`: Bắt buộc, refresh token hợp lệ và chưa hết hạn

---

## Account Management Endpoints

### 1. Cập Nhật Thông Tin Tài Khoản
**Endpoint:** `PATCH /customer/{phone}`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn B",
  "email": "nguyenvanb@email.com",
  "addresses": [
    {
      "province": "Hà Nội",
      "district": "Quận Ba Đình",
      "ward": "Phường Ngọc Hà",
      "detailAddress": "456 Đường Hoàng Hoa Thám"
    }
  ]
}
```

**Validation Rules:**
- `fullName`: Bắt buộc, không được để trống
- `email`: Tùy chọn, định dạng email hợp lệ nếu có
- `addresses`: Bắt buộc, mảng chứa ít nhất 1 địa chỉ
  - `province`: Bắt buộc
  - `district`: Bắt buộc
  - `ward`: Bắt buộc
  - `detailAddress`: Bắt buộc

---

### 2. Đổi Mật Khẩu
**Endpoint:** `POST /auth/change-password`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Validation Rules:**
- `currentPassword`: Bắt buộc, mật khẩu hiện tại chính xác
- `newPassword`: Bắt buộc, mật khẩu mới tối thiểu 6 ký tự

---

### 3. Gửi OTP
**Endpoint:** `POST /message`

**Request Body:**
```json
{
  "phone": "0123456789"
}
```

**Validation Rules:**
- `phone`: Bắt buộc, số điện thoại hợp lệ

---

## Request Management Endpoints

### 1. Tạo Yêu Cầu Dịch Vụ
**Endpoint:** `POST /request`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "service": {
    "title": "Chăm sóc người già",
    "coefficient_service": 1.5,
    "coefficient_other": 1.2,
    "cost": 200000
  },
  "startTime": "2025-08-20T08:00:00",
  "endTime": "2025-08-20T18:00:00",
  "startDate": "2025-08-20,2025-08-21,2025-08-22",
  "customerInfo": {
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "address": "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
    "usedPoint": 5000
  },
  "location": {
    "province": "Hồ Chí Minh",
    "district": "Quận 1",
    "ward": "Phường Bến Nghé"
  },
  "requestType": "Dài hạn",
  "totalCost": 1800000,
  "helperId": "507f1f77bcf86cd799439012"
}
```

**Validation Rules:**
- `service`: Bắt buộc, thông tin dịch vụ
  - `title`: Tên dịch vụ (bắt buộc)
  - `coefficient_service`: Hệ số dịch vụ (mặc định 1)
  - `coefficient_other`: Hệ số khác (mặc định 1)
  - `cost`: Chi phí cơ bản
- `startTime`: Bắt buộc, thời gian bắt đầu (ISO string hoặc HH:MM)
- `endTime`: Bắt buộc, thời gian kết thúc (ISO string hoặc HH:MM)
- `startDate`: Bắt buộc, chuỗi ngày phân cách bằng dấu phẩy (YYYY-MM-DD)
- `customerInfo`: Bắt buộc, thông tin khách hàng
  - `fullName`: Tên khách hàng (bắt buộc)
  - `phone`: Số điện thoại (bắt buộc)
  - `address`: Địa chỉ chi tiết (bắt buộc)
  - `usedPoint`: Điểm sử dụng (mặc định 0)
- `location`: Bắt buộc, thông tin vị trí
  - `province`: Tỉnh/Thành phố (bắt buộc)
  - `district`: Quận/Huyện (bắt buộc)
  - `ward`: Phường/Xã (bắt buộc)
- `requestType`: Loại yêu cầu ("Dài hạn" hoặc "Ngắn hạn")
- `totalCost`: Tổng chi phí
- `helperId`: ID của helper (tùy chọn)

**Lưu ý về định dạng thời gian:**
- API hỗ trợ nhiều định dạng thời gian:
  - ISO format: `"2025-08-20T08:00:00"`
  - Local format: `"2025-08-20T08:00:00"`
  - Time only: `"08:00"` hoặc `"8"`
  - Timestamp format

---

### 2. Hủy Yêu Cầu
**Endpoint:** `POST /request/cancel`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "id": "507f1f77bcf86cd799439011"
}
```

**Validation Rules:**
- `id`: Bắt buộc, ID của yêu cầu cần hủy

---

## Review & Payment Endpoints

### 1. Hoàn Thành Thanh Toán
**Endpoint:** `POST /request/finishpayment`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "detailId": "507f1f77bcf86cd799439013"
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của chi tiết yêu cầu cần thanh toán

---

### 2. Gửi Đánh Giá
**Endpoint:** `POST /requestDetail/review`

**Headers:**
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

**Request Body:**
```json
{
  "detailId": "507f1f77bcf86cd799439013",
  "comment": "Dịch vụ rất tốt, helper nhiệt tình và chu đáo."
}
```

**Validation Rules:**
- `detailId`: Bắt buộc, ID của chi tiết yêu cầu cần đánh giá
- `comment`: Bắt buộc, nội dung đánh giá

---

## Lưu Ý Chung

### Headers Bắt Buộc
Tất cả các endpoint yêu cầu authentication cần có header:
```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Định Dạng Thời Gian
- **Ngày**: YYYY-MM-DD (ví dụ: "2025-08-20")
- **Thời gian**: HH:MM (ví dụ: "08:30") hoặc H (ví dụ: "8")
- **DateTime**: ISO 8601 format (ví dụ: "2025-08-20T08:30:00")

### Validation Chung
- Tất cả các trường bắt buộc phải có giá trị
- Định dạng số điện thoại: 10-11 số, bắt đầu bằng 0
- Định dạng email: phải hợp lệ theo chuẩn RFC
- Định dạng thời gian: phải đúng format quy định

### Error Handling
- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ
- **401 Unauthorized**: Token không hợp lệ hoặc hết hạn
- **403 Forbidden**: Không có quyền truy cập
- **404 Not Found**: Tài nguyên không tồn tại
- **409 Conflict**: Dữ liệu bị trùng lặp
- **500 Internal Server Error**: Lỗi server

### Response Format
Tất cả response đều theo format:
```json
{
  "success": true|false,
  "message": "Thông báo",
  "data": {}, // Dữ liệu trả về (nếu có)
  "error": "Chi tiết lỗi" // Chỉ có khi success = false
}
```
