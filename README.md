# PingIt 🌐

**PingIt** is a full-stack website uptime monitoring application that allows users to register, log in, and monitor their websites. If any monitored website goes offline, PingIt automatically sends email alerts to the user. It's like a personal website watchdog 🐶.

## 🚀 Features

- 👤 User Registration & Login (with secure password hashing)
- 🔗 Add multiple websites to monitor
- ⏱️ Custom ping intervals (5 / 10 / 15 / 30 minutes)
- 📬 Email alerts when sites go offline (with 6-hour cooldown per site)
- 🔄 Periodic pinging using background jobs
- 📊 Live status dashboard (React-powered)
- 💡 Beautiful animated header with intro animation
- 🛡️ Fully responsive frontend design

---

## 🌐 Live Demo

Backend deployed on **Render**:  
👉 [https://pingit-backend.onrender.com](https://pingit-backend.onrender.com)

---

## 🛠 Tech Stack

### 🧩 Frontend
- HTML, CSS, JavaScript
- Animated gradient header + intro animation
- Responsive design
- Dynamic status cards (React-based UI optional)

### 🖥 Backend
- **Node.js + Express.js**
- **MongoDB + Mongoose** (URL & user storage)
- **Nodemailer** for email alerts
- REST API for frontend communication
- Hosted on Render

---

## ⚙ How It Works

1. Users sign up and log in securely.
2. They can add one or more URLs to monitor.
3. Each URL is pinged periodically based on the user’s selected interval.
4. If a website is down:
   - An **email alert** is sent (but only once every 6 hours per site to avoid spamming).
5. User dashboard updates with site status (up/down) in real-time.

---

