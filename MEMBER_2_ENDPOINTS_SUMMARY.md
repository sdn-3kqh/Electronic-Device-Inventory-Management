# Member 2 Backend - Complete Endpoint Summary

## Quick Reference Guide

### Device Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/devices` | Create device | Admin/Manager |
| GET | `/api/devices` | List devices with pagination | All |
| GET | `/api/devices/:id` | Get device details | All |
| PUT | `/api/devices/:id` | Update device | Admin/Manager |
| DELETE | `/api/devices/:id` | Delete device | Admin/Manager |
| PATCH | `/api/devices/:id/dispose` | Retire device | Admin/Manager |
| GET | `/api/devices/search` | Search devices | All |
| GET | `/api/devices/filter` | Filter devices | All |
| GET | `/api/devices/advanced-search` | Advanced search with filters | All |
| POST | `/api/devices/barcode/generate/:deviceId` | Generate barcode for device | Admin/Manager |
| POST | `/api/devices/barcode/generate-multiple` | Generate barcodes bulk | Admin/Manager |
| POST | `/api/devices/bulk/import` | Import devices from array | Admin/Manager |
| POST | `/api/devices/bulk/export` | Export devices to JSON | All |
| PUT | `/api/devices/bulk/update-status` | Update status for multiple devices | Admin/Manager |
| PUT | `/api/devices/bulk/update-location` | Update location for multiple devices | Admin/Manager |

### Warranty Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/warranties` | Create warranty | Admin/Manager |
| GET | `/api/warranties` | List warranties | All |
| GET | `/api/warranties/:id` | Get warranty details | All |
| PUT | `/api/warranties/:id` | Update warranty | Admin/Manager |
| DELETE | `/api/warranties/:id` | Delete warranty | Admin/Manager |
| GET | `/api/warranties/expiring/:days` | Get expiring warranties | All |
| GET | `/api/warranties/refresh-status` | Refresh warranty status | Admin/Manager |
| POST | `/api/warranties/claims` | Create warranty claim | All |
| GET | `/api/warranties/claims` | List warranty claims | All |
| GET | `/api/warranties/claims/:id` | Get claim details | All |
| PUT | `/api/warranties/claims/:id` | Update claim status | Admin/Manager |
| DELETE | `/api/warranties/claims/:id` | Delete claim | Admin/Manager |

### Depreciation Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/depreciation` | Create depreciation rule | Admin/Manager |
| GET | `/api/depreciation` | List depreciation rules | All |
| GET | `/api/depreciation/rule/:id` | Get rule details | All |
| GET | `/api/depreciation/category/:categoryId` | Get rule by category | All |
| PUT | `/api/depreciation/:id` | Update depreciation rule | Admin/Manager |
| DELETE | `/api/depreciation/:id` | Delete depreciation rule | Admin/Manager |
| GET | `/api/depreciation/device/:deviceId` | Calculate device depreciation | All |
| GET | `/api/depreciation/category-depreciation/:categoryId` | Get category depreciation | All |
| POST | `/api/depreciation/batch-update-values` | Update all device values | Admin/Manager |

### System Management
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/system/health` | Health check | Public |
| GET | `/api/system/settings` | Get system settings | Admin |
| POST | `/api/system/settings` | Create/update setting | Admin |
| DELETE | `/api/system/settings/:key` | Delete setting | Admin |
| GET | `/api/system/stats` | Database statistics | Admin |
| POST | `/api/system/backup/create` | Create backup | Admin |
| GET | `/api/system/backup/list` | List backups | Admin |
| GET | `/api/system/backup/download/:filename` | Download backup file | Admin |
| DELETE | `/api/system/backup/delete/:filename` | Delete backup file | Admin |
| GET | `/api/system/logs` | Get system logs | Admin |

### Reports
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/warranty` | Warranty report | All |
| GET | `/api/reports/warranty-alerts` | Warranty expiration alerts | All |
| GET | `/api/reports/depreciation` | Depreciation report by category | Admin/Manager |
| GET | `/api/reports/device-status` | Device status breakdown | All |
| GET | `/api/reports/inventory-value` | Inventory value report | Admin/Manager |
| GET | `/api/reports/assignments` | Assignment report | All |
