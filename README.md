# 🚨 Crime Report Portal

A full-stack MERN application enabling citizens to **anonymously report crimes** with GPS location tagging, photo/video evidence, real-time status tracking, and a police admin dashboard.

Built for local communities like **Pudukkottai** and **Coimbatore** to improve safety and police accountability.

---

## ✨ Key Features

### Citizen
- 📍 **GPS auto-detect + interactive map pin-drop** (Leaflet)
- 📸 **Photo/video upload** (drag-drop, up to 5 files × 10MB)
- 🕵️ **Anonymous submission** — no account required, tracking ID provided
- 📊 **Real-time status tracking** (Submitted → Assigned → In Progress → Resolved)
- 🔴 **SOS Emergency button** — shares live GPS via SMS/email

### Admin / Police
- 🗺️ **Map dashboard** with color-coded report markers
- 📋 **Paginated reports table** with status/category/urgency filters
- ✏️ **Claim & update reports** with officer notes
- 📄 **Export PDF** of reports
- 📈 **Analytics** — monthly trends, category pie, urgency breakdown

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS v3, Redux Toolkit |
| Maps | React-Leaflet + OpenStreetMap |
| Charts | Recharts |
| Real-time | Socket.io |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (admin only) |
| File Upload | Multer + Cloudinary (or local disk fallback) |
| PDF | PDFKit |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install
```bash
cd crime-report-portal
npm run install-all
```

### 2. Configure Backend
```bash
# server/.env is pre-configured for local MongoDB
# Edit server/.env to add your MongoDB Atlas URI or Cloudinary keys
```

### 3. Seed Admin Account
```bash
# Either visit http://localhost:5173/admin/login and click "Seed admin/admin123"
# Or call the API directly:
curl -X POST http://localhost:5000/api/admin/seed
```

### 4. Run Development Servers
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## 🔐 Environment Variables (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | local |
| `JWT_SECRET` | JWT signing secret | change me |
| `CLOUDINARY_*` | Cloudinary keys (optional) | local disk |
| `SMTP_*` | Email (optional) | — |
| `TWILIO_*` | SMS (optional) | — |

---

## 📁 Project Structure

```
crime-report-portal/
├── client/                   # React 18 + Vite frontend
│   └── src/
│       ├── components/       # ReportForm, MapView, StatusTracker, SOSButton, Navbar
│       ├── pages/            # Home, TrackReport, Admin, Login
│       ├── store/            # Redux store, reportSlice, adminSlice
│       └── utils/            # api.js (Axios), socket.js (Socket.io)
├── server/                   # Node.js + Express backend
│   ├── config/               # db.js, cloudinary.js
│   ├── models/               # Report.js, Admin.js
│   ├── middleware/           # auth.js, upload.js, rateLimiter.js
│   ├── routes/               # reports.js (public), admin.js (protected)
│   ├── sockets/              # reportSocket.js
│   └── server.js             # Entry point
└── package.json              # Root: concurrently dev script
```

---

## 🛡️ Security Features

- **Rate limiting**: 5 reports/hour per IP (prevents spam)
- **JWT auth**: All admin routes protected
- **Helmet**: Security HTTP headers
- **IP hashing**: Never stored in plaintext
- **Anonymous mode**: PII completely excluded from DB

---

## 🚢 Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel / Netlify |
| Backend | Render / Railway |
| Database | MongoDB Atlas (free M0) |
| Media | Cloudinary (free tier) |

Set `VITE_API_URL` in client's `.env` to your deployed backend URL.
