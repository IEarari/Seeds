# Seeds Volunteers Management System

A modern full-stack web platform for managing volunteer applications and coordination for community and cultural organizations.

---

## 📌 Overview

The **Seeds Volunteers Management System** is a web-based platform designed to streamline the volunteer registration and review process.

It provides structured workflows for:
- Volunteer applicants
- Review administrators
- System administrators

The system focuses on usability, transparency, and scalability while supporting Arabic (RTL) interfaces.

---

## 🏗️ System Architecture

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API
- **Authentication**: Firebase Authentication
- **Styling**: Custom CSS with glassmorphism UI
- **Localization**: Arabic RTL support

---

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK
- **Architecture**: RESTful API
- **Security**: Role-Based Access Control (RBAC)

---

## 🚀 Key Features

### 📝 Volunteer Application
- Multi-step registration form
- Real-time input validation
- Smart date picker with month/year navigation
- WhatsApp number with country code selector
- Dynamic dropdown menus managed by administrators
- Tag-based inputs for skills and hobbies
- Previous volunteering experience tracking

---

### 👥 User Roles
- **Applicant** – submits volunteer application
- **Volunteer** – accesses volunteer dashboard
- **Review Admin** – reviews and processes applications
- **Admin** – manages users and volunteering settings
- **Super Admin** – manages system menus and configurations

---

### 🎛️ Administration Panel
- Application review queue
- Status filtering (submitted / approved / rejected)
- Role assignment with search
- Control volunteer application periods
- Manage dynamic menus (education, branches, institutions, etc.)

---

### 🔐 Security
- Firebase Authentication
- Secure API access using JWT
- Role-based permissions
- Administrative activity logging

---

## 📁 Project Structure


