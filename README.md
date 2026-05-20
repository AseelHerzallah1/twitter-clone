# 🐦 Twitter Clone
A full-stack Twitter clone built with the MERN stack, featuring authentication, social interactions, and cloud-based media handling.

I've always preferred the old Twitter — the bird, the tweets, the retweets, the simplicity. When X took over and changed everything, I figured the best way to keep that nostalgia alive was to build it myself.

This is a full-stack clone of classic Twitter, built as a learning project to practice the MERN stack end-to-end — from authentication and REST APIs to React state management and cloud image storage. It's not just a UI mockup; everything is fully functional including tweeting, retweeting, likes, comments, follow/unfollow, notifications, and profile management.

🔗 **Live Demo:** [https://twitter-clone-aqdu.onrender.com](https://twitter-clone-aqdu.onrender.com)

---

## Features

- 🔐 **Authentication** — JWT-based auth with secure `httpOnly` cookies (signup, login, logout)
- 🐦 **Tweets** — Create and delete tweets with image upload support via Cloudinary
- 🔁 **Retweets** — Retweet/un-retweet posts, appears in feeds sorted by retweet time
- ❤️ **Likes** — Like/unlike tweets with real-time cache updates
- 💬 **Comments** — Comment on tweets with instant UI updates
- 👥 **Follow System** — Follow/unfollow users, view followers/following in a modal
- 🔔 **Notifications** — Notifications for likes, retweets, and follows
- 👤 **Profile** — Edit profile info, upload profile/cover images
- 💡 **Suggested Users** — "Who to follow" sidebar panel
- 📰 **Feed** — "For You" and "Following" tabs
- 🌙 **Light/Dark Mode** — Toggle with preference saved in localStorage

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** for authentication
- **Cloudinary** for image storage
- **bcryptjs** for password hashing

### Frontend
- **React** + **Vite**
- **TailwindCSS** + **daisyUI**
- **React Query (@tanstack/react-query)** for data fetching and caching
- **React Router DOM** for client-side routing
- **React Hot Toast** for notifications

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AseelHerzallah1/twitter-clone.git
cd twitter-clone
```

2. **Set up environment variables**

Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=5000
NODE_ENV=development
```

3. **Install dependencies and run in development**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm install --prefix frontend

# Run backend
npm run dev

# Run frontend (in a separate terminal)
cd frontend && npm run dev
```

4. **Build and run in production**
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
twitter-clone/
├── backend/
│   ├── controllers/      # Route handlers
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routes
│   ├── middleware/        # Auth middleware
│   ├── lib/              # Utilities (JWT)
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Helper functions
│   └── index.html
└── package.json
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/posts/all` | Get all posts |
| GET | `/api/posts/following` | Get following feed |
| POST | `/api/posts/create` | Create a post |
| DELETE | `/api/posts/:id` | Delete a post |
| POST | `/api/posts/like/:id` | Like/unlike a post |
| POST | `/api/posts/retweet/:id` | Retweet/un-retweet |
| POST | `/api/posts/comment/:id` | Comment on a post |
| GET | `/api/users/profile/:username` | Get user profile |
| POST | `/api/users/follow/:id` | Follow/unfollow user |
| GET | `/api/users/suggested` | Get suggested users |
| POST | `/api/users/update` | Update profile |
| GET | `/api/notifications` | Get notifications |
| DELETE | `/api/notifications` | Delete all notifications |

---

## 📝 License

This project is for educational purposes only.
