# Electronic Device Inventory Management System
## Tổng quan dự án

---

## 1. Tổng quan hệ thống

| Thuộc tính | Mô tả |
|------------|-------|
| **Tên hệ thống** | Electronic Device Inventory Management System |
| **Mục đích** | Quản lý vòng đời thiết bị điện tử trong tổ chức - từ mua sắm đến thanh lý |
| **Loại ứng dụng** | Web-based application với hỗ trợ mobile (PWA) |
| **Quy mô** | 100,000 thiết bị, 1,000 người dùng đồng thời |
| **Đối tượng sử dụng** | Doanh nghiệp, tổ chức có nhu cầu quản lý tài sản IT |

---

## 2. Các nhóm chức năng chính (8 Modules)

| # | Module | Mô tả | Số UC |
|---|--------|-------|-------|
| 1 | 🔐 **Authentication** | Đăng nhập, phân quyền, quản lý session | 4 |
| 2 | 📱 **Device Management** | CRUD thiết bị, barcode scanning, bulk import/export | 11 |
| 3 | 👤 **Assignment** | Gán thiết bị cho nhân viên/phòng ban | 6 |
| 4 | 🔧 **Maintenance** | Theo dõi bảo trì, sửa chữa, lịch bảo dưỡng | 5 |
| 5 | 📋 **Warranty** | Quản lý bảo hành, claims | 4 |
| 6 | 📉 **Depreciation** | Tính khấu hao tự động | 2 |
| 7 | 📊 **Reports** | Báo cáo tổng hợp, xuất PDF/Excel | 8 |
| 8 | ⚙️ **Administration** | Quản lý user, audit trail, cấu hình hệ thống | 10 |

---

## 3. Phân quyền người dùng (3 Roles)

| Role | Mô tả | Quyền hạn | Số UC |
|------|-------|-----------|-------|
| **Admin** | Quản trị viên hệ thống | Toàn quyền: quản lý user, cấu hình hệ thống, audit | 50 (100%) |
| **Inventory Manager** | Quản lý kho thiết bị | Quản lý thiết bị, gán/thu hồi, bảo trì, báo cáo | 42 (84%) |
| **Staff** | Nhân viên | Xem thiết bị được gán, yêu cầu bảo trì | 13 (26%) |

### Ma trận phân quyền theo Module

| Module | Admin | Inventory Manager | Staff |
|--------|:-----:|:-----------------:|:-----:|
| Authentication | ✓ | ✓ | ✓ |
| Device Management | Full | Full | View only* |
| Assignment | Full | Full | Acknowledge only |
| Maintenance | Full | Full | Request only |
| Warranty | Full | Full | View only* |
| Depreciation | Full | View only | ✗ |
| Reports | Full | Full | ✗ |
| Administration | Full | Limited** | ✗ |

*Chỉ thiết bị được gán | **Chỉ xem audit liên quan device

---

## 4. Công nghệ sử dụng

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| React 18+ | UI Framework |
| TypeScript | Type safety |
| Material-UI | Component library |
| React Query | Data fetching & caching |
| React Router | Navigation |

### Backend
| Công nghệ | Mục đích |
|-----------|----------|
| Node.js | Runtime |
| Express.js | Web framework |
| TypeScript | Type safety |
| JWT | Authentication |
| bcrypt | Password hashing |

### Database & Infrastructure
| Công nghệ | Mục đích |
|-----------|----------|
| PostgreSQL 14+ | Primary database |
| Redis | Session & cache |
| Local/S3 | File storage |
| Nginx | Reverse proxy |

---

## 5. Use Cases chính (50 UC)

### Authentication (4 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-01 | Sign In | All |
| UC-02 | Sign Out | All |
| UC-03 | Reset Password | All |
| UC-04 | Update Profile | All |

### Device Management (11 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-05 | Add Device | Admin, IM |
| UC-06 | Update Device | Admin, IM |
| UC-07 | Delete Device | Admin, IM |
| UC-08 | View Device Details | All* |
| UC-09 | Search Device | All* |
| UC-10 | Filter Devices | All* |
| UC-11 | Scan Barcode | All |
| UC-12 | Print Asset Label | Admin, IM |
| UC-13 | Bulk Import | Admin, IM |
| UC-14 | Bulk Export | Admin, IM |
| UC-50 | Dispose Device | Admin, IM |

### Assignment (6 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-15 | Assign to Employee | Admin, IM |
| UC-16 | Assign to Department | Admin, IM |
| UC-17 | Unassign Device | Admin, IM |
| UC-18 | Transfer Device | Admin, IM |
| UC-19 | Acknowledge Assignment | All |
| UC-20 | View Assignment History | All* |

### Maintenance (5 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-21 | Record Maintenance | Admin, IM |
| UC-22 | Request Maintenance | All |
| UC-23 | Schedule Maintenance | Admin, IM |
| UC-24 | Complete Maintenance | Admin, IM |
| UC-25 | View Maintenance History | All* |

### Warranty (4 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-26 | Add Warranty | Admin, IM |
| UC-27 | Update Warranty | Admin, IM |
| UC-28 | File Warranty Claim | Admin, IM |
| UC-29 | View Warranty Status | All* |

### Depreciation (2 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-30 | Configure Depreciation Rules | Admin |
| UC-31 | View Depreciation | Admin, IM |

### Reports (8 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-32 | Inventory Report | Admin, IM |
| UC-33 | Assignment Report | Admin, IM |
| UC-34 | Maintenance Report | Admin, IM |
| UC-35 | Depreciation Report | Admin, IM |
| UC-36 | Warranty Report | Admin, IM |
| UC-37 | Custom Report | Admin, IM |
| UC-38 | Schedule Report | Admin, IM |
| UC-39 | Export Report | Admin, IM |

### Administration (10 UC)
| UC | Tên | Actors |
|----|-----|--------|
| UC-40 | Create User | Admin |
| UC-41 | Update User | Admin |
| UC-42 | Deactivate User | Admin |
| UC-43 | Assign User Role | Admin |
| UC-44 | View Audit Trail | Admin, IM** |
| UC-45 | Export Audit Trail | Admin |
| UC-46 | Manage Device Categories | Admin |
| UC-47 | Manage Locations | Admin, IM |
| UC-48 | Manage Departments | Admin |
| UC-49 | Configure System Settings | Admin |

*Staff chỉ xem thiết bị được gán | **IM chỉ xem audit device

---

## 6. Business Rules quan trọng

### Device Management
| Rule | Mô tả |
|------|-------|
| BR-004 | Serial number phải unique trong hệ thống |
| BR-005 | Asset tag phải theo naming convention của tổ chức |
| BR-006 | Purchase date không được trong tương lai |
| BR-007 | Warranty expiration phải sau purchase date |

### Assignment
| Rule | Mô tả |
|------|-------|
| BR-011 | Không thể xóa thiết bị đang được gán |
| BR-024 | Mỗi thiết bị chỉ có 1 assignment active |
| BR-025 | Assignment yêu cầu acknowledgment từ người nhận |

### Maintenance & Warranty
| Rule | Mô tả |
|------|-------|
| BR-028 | Thiết bị đang bảo trì hiển thị status "In Maintenance" |
| BR-030 | Cảnh báo warranty hết hạn: 30, 14, 7 ngày trước |
| BR-032 | Extended warranty phải bắt đầu sau original warranty |

### Depreciation
| Rule | Mô tả |
|------|-------|
| BR-033 | Default method: Straight-line |
| BR-034 | Tính khấu hao hàng tháng |
| BR-035 | Thiết bị khấu hao hết vẫn giữ salvage value |

### Security & Audit
| Rule | Mô tả |
|------|-------|
| BR-001 | Khóa tài khoản sau 5 lần đăng nhập sai |
| BR-002 | Session timeout sau 30 phút không hoạt động |
| BR-037 | Audit log không thể sửa hoặc xóa |
| BR-038 | Lưu trữ audit log 7 năm |

---

## 7. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                           │
│         Web App (React) │ Mobile PWA │ Barcode Scanner      │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┴───────────────────────────────┐
│                      API GATEWAY                            │
│              Load Balancer / Nginx / AWS ALB                │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                   APPLICATION LAYER                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │ Device  │ │ Assign  │ │ Report  │           │
│  │ Service │ │ Service │ │ Service │ │ Service │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Maint  │ │Warranty │ │  User   │ │  Audit  │           │
│  │ Service │ │ Service │ │ Service │ │ Service │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────┐
│                      DATA LAYER                             │
│    PostgreSQL │ Redis Cache │ File Storage │ Email Service  │
└─────────────────────────────────────────────────────────────┘
```

### Layered Architecture

| Layer | Components |
|-------|------------|
| Presentation | React Components, Pages, Hooks, Context |
| API | Controllers, Middleware, Validators, DTOs |
| Service | Business Logic, Domain Services, Event Handlers |
| Repository | Repositories, Query Builders, Data Mappers |
| Infrastructure | Database, Cache, File Storage, Email |

---

## 8. Database - Các bảng chính

| # | Table | Mô tả | Quan hệ chính |
|---|-------|-------|---------------|
| 1 | `users` | Thông tin người dùng, role, status | → departments |
| 2 | `departments` | Phòng ban | → users (manager) |
| 3 | `locations` | Vị trí (building, floor, room) | → locations (parent) |
| 4 | `device_categories` | Danh mục thiết bị + custom fields | → depreciation_rules |
| 5 | `devices` | Thiết bị: serial, model, status, giá | → categories, locations |
| 6 | `assignments` | Lịch sử gán thiết bị | → devices, users |
| 7 | `maintenance_records` | Lịch sử bảo trì | → devices, users |
| 8 | `warranties` | Thông tin bảo hành | → devices |
| 9 | `warranty_claims` | Yêu cầu bảo hành | → warranties, devices |
| 10 | `depreciation_rules` | Quy tắc khấu hao theo category | → device_categories |
| 11 | `audit_logs` | Nhật ký thao tác (immutable) | → users |
| 12 | `documents` | File đính kèm | → any entity |
| 13 | `report_configs` | Cấu hình báo cáo định kỳ | → users |
| 14 | `system_settings` | Cài đặt hệ thống | - |

---

## 9. Kế hoạch triển khai (8 Phases)

| Phase | Nội dung | Tasks | Ưu tiên |
|-------|----------|-------|---------|
| **1** | Core Infrastructure | Project setup, DB schema, Testing framework | 🔴 High |
| **2** | Authentication | User entity, JWT, Middleware, RBAC | 🔴 High |
| **3** | Device Management | Device CRUD, Search, Barcode, Bulk ops | 🔴 High |
| **4** | Assignment & Maintenance | Assign/Unassign, Maintenance tracking | 🟡 Medium |
| **5** | Warranty & Depreciation | Warranty management, Auto depreciation | 🟡 Medium |
| **6** | Reports & Audit | Report generation, Audit trail | 🟡 Medium |
| **7** | Frontend | React screens (11 screens) | 🟡 Medium |
| **8** | Integration & Polish | E2E testing, Accessibility, Responsive | 🟢 Low |

**Tổng: 30 tasks chính, ~100 subtasks**

---

## 10. Tính năng nổi bật

| Tính năng | Mô tả |
|-----------|-------|
| ✅ **Barcode/QR Scanning** | Quét mã để tra cứu nhanh thiết bị |
| ✅ **Auto Depreciation** | Tự động tính khấu hao theo quy tắc (straight-line, declining) |
| ✅ **Warranty Alerts** | Cảnh báo hết hạn bảo hành 30, 14, 7 ngày trước |
| ✅ **Bulk Operations** | Import/Export hàng loạt CSV/Excel (max 10MB) |
| ✅ **Comprehensive Audit** | Lưu vết mọi thao tác, retention 7 năm |
| ✅ **Role-based Access** | Phân quyền chi tiết theo vai trò (3 levels) |
| ✅ **Scheduled Reports** | Báo cáo tự động theo lịch (daily/weekly/monthly) |
| ✅ **Full-text Search** | Tìm kiếm nhanh với PostgreSQL trigram indexing |
| ✅ **Real-time Notifications** | Email + In-app alerts |
| ✅ **PWA Support** | Mobile-friendly, offline capable |

---

## 11. Yêu cầu phi chức năng

### Performance
| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds |
| Search response | < 1 second |
| Report generation | < 30 seconds (standard), async for large |
| Concurrent users | 1,000 |

### Security
| Requirement | Implementation |
|-------------|----------------|
| Authentication | JWT + Refresh token rotation |
| Password | bcrypt hashing, complexity rules |
| Authorization | Role-based access control (RBAC) |
| Data protection | HTTPS, input validation, SQL injection prevention |
| Audit | Immutable audit logs, 7-year retention |

### Availability & Scalability
| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Data capacity | 100,000 devices |
| Backup | Daily automated backup |
| Recovery | RPO: 24h, RTO: 4h |

### Usability
| Requirement | Implementation |
|-------------|----------------|
| Accessibility | WCAG 2.1 AA compliance |
| Responsive | Desktop, tablet, mobile support |
| Browser support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Language | English (default), extensible i18n |

---

## 12. Màn hình chính (11 Screens)

| # | Screen | Mô tả | Actors |
|---|--------|-------|--------|
| SCR-01 | **Login** | Đăng nhập hệ thống | All |
| SCR-02 | **Dashboard** | Tổng quan, thống kê, cảnh báo | All |
| SCR-03 | **Device List** | Danh sách thiết bị với filter, search | All |
| SCR-04 | **Device Details** | Chi tiết thiết bị (tabs: info, specs, history) | All |
| SCR-05 | **Add/Edit Device** | Form thêm/sửa thiết bị | Admin, IM |
| SCR-06 | **Assignment** | Gán thiết bị cho nhân viên/phòng ban | Admin, IM |
| SCR-07 | **Reports** | Tạo và xuất báo cáo | Admin, IM |
| SCR-08 | **Maintenance** | Quản lý bảo trì, lịch sử | Admin, IM |
| SCR-09 | **Admin Panel** | Tổng quan quản trị | Admin |
| SCR-10 | **User Management** | Quản lý người dùng, roles | Admin |
| SCR-11 | **System Settings** | Cấu hình hệ thống, categories | Admin |

### Screen Flow

```
Login (SCR-01)
    │
    ▼
Dashboard (SCR-02) ──────────────────────────────────────┐
    │                                                    │
    ├── Device List (SCR-03) ── Device Details (SCR-04)  │
    │         │                        │                 │
    │         └── Add/Edit (SCR-05)    └── Assignment    │
    │                                       (SCR-06)     │
    │                                                    │
    ├── Reports (SCR-07)                                 │
    │                                                    │
    ├── Maintenance (SCR-08)                             │
    │                                                    │
    └── Admin Panel (SCR-09) ────┬── User Mgmt (SCR-10)  │
                                 └── Settings (SCR-11)   │
                                                         │
    ◄────────────────────────────────────────────────────┘
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
