Tóm tắt API + Cách Test
Base URL

Tất cả API đều bắt đầu bằng:

http://localhost:3120/api
1. Device APIs (Quản lý thiết bị)
Lấy danh sách thiết bị
GET http://localhost:3120/api/devices?page=1&limit=20
Authorization: Bearer {token}

Test:

Method: GET

URL:

/devices

Query params:

page=1
limit=20
Tìm kiếm nâng cao
GET http://localhost:3120/api/devices/advanced-search?keyword=laptop&status=available
Authorization: Bearer {token}

Test:

Method: GET

Query params:

keyword
status
minPrice
maxPrice
Tạo barcode cho thiết bị
POST http://localhost:3120/api/devices/barcode/generate/{deviceId}
Authorization: Bearer {token}

Test:

Method: POST

Path param:

deviceId
Import nhiều thiết bị
POST http://localhost:3120/api/devices/bulk/import
Authorization: Bearer {token}

Body:

{
  "devices": [
    {
      "name": "Laptop",
      "serialNumber": "SN001"
    }
  ]
}
2. Warranty APIs (Bảo hành)
Tạo warranty
POST http://localhost:3120/api/warranties
Authorization: Bearer {token}

Body:

{
  "deviceId": "123",
  "type": "manufacturer",
  "provider": "Apple",
  "startDate": "2024-01-01",
  "endDate": "2025-01-01"
}
Xem warranty
GET http://localhost:3120/api/warranties
Authorization: Bearer {token}
Xem warranty sắp hết hạn
GET http://localhost:3120/api/warranties/expiring/30
Authorization: Bearer {token}

Ý nghĩa:
→ lấy các bảo hành hết trong 30 ngày

Tạo claim bảo hành
POST http://localhost:3120/api/warranties/claims
Authorization: Bearer {token}

Body:

{
  "warrantyId": "123",
  "deviceId": "456",
  "issue": "Screen broken"
}
3. Depreciation APIs (Khấu hao)
Tạo rule khấu hao
POST http://localhost:3120/api/depreciation
Authorization: Bearer {token}

Body:

{
  "categoryId": "123",
  "method": "straight_line",
  "usefulLifeYears": 5,
  "salvageValuePercent": 10
}
Tính khấu hao thiết bị
GET http://localhost:3120/api/depreciation/device/{deviceId}
Authorization: Bearer {token}

Response ví dụ:

annualDepreciation: 800
bookValue: 2400
depreciationPercent: 40%
4. System APIs (Quản lý hệ thống)
Health check
GET http://localhost:3120/api/system/health

Không cần token.

Xem thống kê database
GET http://localhost:3120/api/system/stats
Authorization: Bearer {token}
Tạo backup
POST http://localhost:3120/api/system/backup/create
Authorization: Bearer {token}
Download backup
GET http://localhost:3120/api/system/backup/download/{filename}
Authorization: Bearer {token}
5. Report APIs (Báo cáo)
Báo cáo bảo hành
GET http://localhost:3120/api/reports/warranty
Authorization: Bearer {token}
Cảnh báo bảo hành
GET http://localhost:3120/api/reports/warranty-alerts
Authorization: Bearer {token}
Báo cáo trạng thái thiết bị
GET http://localhost:3120/api/reports/device-status
Authorization: Bearer {token}
Báo cáo giá trị inventory
GET http://localhost:3120/api/reports/inventory-value
Authorization: Bearer {token}