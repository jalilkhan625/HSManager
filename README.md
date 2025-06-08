# HS2025 Settings Manager

Welcome to **HS2025 Settings Manager**, a secure, multilingual configuration management system designed to administrate the Hyperspace Application Platform. This system provides intuitive control over internal and external users, database structures, permissions, and more — all wrapped in a clean, responsive ASP.NET Core 9.0 web interface.

> **Author**: Jalil  
> **Initial Release**: 01/03/2025  
> **Version**: 1.0  
> © Copyright [DataLabor.com](https://datalabor.com) 2025  
> **Username**: `admin`  
> **Password**: `password`  

---

## 🚀 Overview

**HS2025 Settings Manager** is a web-based tool developed to manage:

- Database table structures (Areas, Tables, Field Groups, Fields)
- Internal and external users
- User roles and permissions
- Menu and dashboard layout based on user context
- Multilingual interface (English & Italian)
- Web services with token-based authentication
- Frontend-backend interaction using JSON

---

## 📦 Tech Stack

| Layer            | Technology                 |
|------------------|----------------------------|
| Frontend         | HTML, CSS, JavaScript      |
| Backend          | ASP.NET Core 9.0 (C#)      |
| Development IDE  | Visual Studio 2022         |
| Data Format      | JSON                       |
| Auth Support     | Token-based (JWT style)    |
| Simulated DB     | Cookie-based storage       |
| API Controllers  | RESTful ASP.NET Controllers|

---

## 🧑‍💼 User Roles

- **HSA (Hyperspace System Administrator)**: Full system access.
- Future plans include authentication using **Microsoft Authenticator** or other third-party tools.

---

## 📋 Main Features

### 🔐 Login

- **Endpoint**: `/api/login`
- **Request**:
```json
{
  "Username": "admin",
  "Password": "password"
}
```
- **Response**:
```json
{
  "UserID": 1,
  "UserToken": "abc123xyz",
  "UserLanguage": 1
}
```

---

### 🏠 Main Window

- Left vertical menu (dynamically loaded)
- Center dashboard with charts:
  - Storage usage
  - Internal user licenses
  - External user licenses
- Footer: Logout, Language switch, etc.

---

### 📊 Table Manager

A progressive UI to configure DB structure:
1. **Areas**
2. **Tables**
3. **Field Groups**
4. **Fields**

Each level features:
- Visibility, read-only & reserved flags
- Base64 image icon upload
- JSON-based configuration state
- Undo & Play actions for reverting or applying changes

#### Sample Web Services:
- `GetTableManagerListItems(ItemType, ItemID)`
- `GetTableManagerItem(ItemType, ItemID)`
- `SetTableManagerItem(ItemType, ItemID)`

---

### 👥 User Management

#### Internal Users
- Manage internal accounts
- Assign access to specific tables and fields

#### External Users
- Similar to internal users but with restricted roles

---

## 🌐 Multilingual Support

- Currently supports **English** and **Italian**
- Sample implementation approach:
```html
<input 
  data-hs-ui-lang-en="Table Name" 
  data-hs-ui-lang-it="Nome Tabella" 
/>
```

---

## ⚙️ Development Notes

1. **No direct DB access** – data is simulated using cookies
2. All UI strings handled client-side
3. All menu/data/dashboard calls use web services
4. Each configuration layer appears progressively as nested panels to the right
5. Lightening color tone with each nested panel

---

## ✅ Future Enhancements

- Integration with **Microsoft Authenticator**
- Live DB integration
- Drag-and-drop reordering
- Real-time user activity tracking

---

## 🔑 Default Credentials

| Username | Password |
|----------|----------|
| `admin`  | `password` |

---

## 📃 License

```
© Copyright DataLabor.com 2025
All rights reserved. Unauthorized copying or distribution is strictly prohibited.
```
