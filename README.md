# CollabDoc 
*A real-time, collaborative document editor built with the MERN stack.*

![CollabDoc Preview](https://img.shields.io/badge/Status-Live-brightgreen)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

CollabDoc is a powerful, real-time rich text editor that allows multiple users to edit the same document simultaneously. It features live cursors, presence indicators, document version history, and a modern, beautiful UI inspired by Google Docs.

### 🌐 Live Demo
- **Frontend (Web App):** [https://docs-clone-l1xx.onrender.com](https://docs-clone-l1xx.onrender.com)
- **Backend (API):** [https://docs-clone1.onrender.com](https://docs-clone1.onrender.com)

---

##  Features

- **Real-Time Collaboration:** Powered by WebSockets (Socket.io) and Yjs for conflict-free, synchronized typing across multiple clients.
- **Live Cursors & Presence:** See who is currently viewing the document and watch their cursors move in real-time as they type.
- **Rich Text Editor:** Built with Quill.js, supporting text formatting, headers, links, and more.
- **Secure Authentication:** JWT-based login and registration system with secure HTTP-only cookies.
- **Document Management:** Create, rename, duplicate, delete, and search documents from a beautiful dashboard.
- **Collaboration Invites:** Securely share documents via email or generate secure invite links for others to join your workspace.
- **Version History:** Manually save "Snapshots" of your document and seamlessly restore them at any time.
- **Interactive UI:** A highly polished, responsive interface built with React, Tailwind CSS, and Lucide Icons.

---

## Technology Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- React Router DOM
- Zustand (State Management)
- Quill.js & Y-Quill (Rich Text Editing)
- Axios (API Requests)

**Backend:**
- Node.js & Express.js
- MongoDB (Atlas) & Mongoose
- Socket.io (WebSockets)
- Yjs (CRDT for conflict resolution)
- JSON Web Tokens (JWT) & bcryptjs

**Deployment:**
- Hosted on **Render** (Frontend as a Static Site, Backend as a Web Service)

---

## Getting Started (Local Development)

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed and a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster set up.

### 1. Clone the repository
```bash
git clone https://github.com/ricky-col/docs_clone.git
cd docs_clone
```

### 2. Setup the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder with the following variables:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_super_secret_access_token
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```
Start the backend server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal and navigate to the frontend folder:
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5001/api
VITE_WS_URL=http://localhost:5001
```
Start the frontend development server:
```bash
npm run dev
```

Your app will now be running on `http://localhost:5173`!

---

##  Architecture Notes

- **CRDTs (Conflict-free Replicated Data Types):** We utilize `Yjs` to manage the complex state of text editing across multiple clients simultaneously. Unlike operational transformation (OT), CRDTs guarantee mathematical convergence without requiring a central server to resolve conflicts, making the real-time syncing incredibly fast and robust.
- **Security:** Access and Refresh tokens are handled via secure `HttpOnly` cookies to prevent XSS attacks. Document access is strictly guarded by Ownership and Collaborator arrays in MongoDB.

---
*Designed & Built for seamless collaboration.*
