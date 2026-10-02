# ⚡ PulseChat — Next-Gen Real-Time Messenger

A modern, high-performance real-time messaging web application inspired by **Telegram Web, WhatsApp Web, and Linear**. Built with **React, Tailwind CSS, Node.js, Express, WebSockets, and MySQL**.

![PulseChat Logo](frontend/public/logo.svg)

---

## ✨ Features

- **⚡ Real-Time Instant Messaging**: WebSocket-powered live delivery with zero polling for both 1-on-1 direct conversations and multi-user group spaces.
- **🎙️ HD Voice Notes**: In-browser audio recording via `MediaRecorder` with real-time stopwatch timer and animated keyframe playback waveforms.
- **📷 Media & Photo Attachments**: High-resolution image upload preview and in-chat viewer.
- **😊 Reactions & Emojis**: Floating message hover bar with 6 quick reactions (`👍`, `❤️`, `😂`, `😮`, `🔥`, `🎉`) and a 30-emoji picker drawer.
- **↩️ Quoted Replies**: Contextual message replies with click-to-scroll smooth navigation.
- **📌 Pin & ⭐ Star**: Pin important announcements to the top banner and filter starred messages with one click.
- **🎨 3 Hand-Crafted Themes**:
  - **Slate Dark**: Sleek cyber dark mode
  - **AMOLED**: Pure pitch black `#000000` for OLED displays
  - **Clean Light Mode**: High-contrast, modern daylight aesthetic
- **🔔 Sound Alert System**: Synthesized audio chimes for incoming messages and sent receipts, with a quick mute/unmute toggle in the sidebar.
- **🔒 Secure Authentication**: JWT token authentication with bcrypt password hashing.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Vite, Plus Jakarta Sans typography
- **Backend**: Node.js, Express 5, `ws` (WebSockets), `mysql2`
- **Database**: MySQL (compatible with local XAMPP/MySQL and cloud databases like Aiven, TiDB, Railway)

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/pulsechat.git
cd pulsechat
```

### 2. Install dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 3. Configure Environment Variables
In `backend/`, copy `.env.example` to `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=chat_app
JWT_SECRET=your_jwt_secret_key
```

### 4. Import MySQL Database Schema
Create a database named `chat_app` in MySQL and create the necessary tables for `users`, `conversations`, `messages`, `group_members`, and `reactions`.

### 5. Start Development Servers
```bash
# Run backend server (Port 5000)
npm run dev:backend

# Run frontend Vite server (Port 5173)
npm run dev:frontend
```

---

## ☁️ 1-Click Deployment to Render.com (Free Tier)

This repository is configured with a **unified single-service architecture** where Express directly serves the built React frontend and routes WebSockets on the same port:

1. **Push this repository to your GitHub account**.
2. Create a free managed MySQL database on [Aiven.io](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com) or [Railway.app](https://railway.app).
3. On [Render.com](https://render.com), click **New +** -> **Web Service** and connect your GitHub repo.
4. Set the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `JWT_SECRET`: (Any secure secret string)
   - `DATABASE_URL`: (Your cloud MySQL connection string)
   - `DB_SSL`: `true`
6. Click **Deploy Web Service** — Render will build the React app, start the Express server with WebSockets, and assign a permanent public HTTPS domain!

---

## 📄 License
ISC License
