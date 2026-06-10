# 🐦 Twitter Clone

Classic Twitter, rebuilt from scratch — the bird, the timeline, the reposts, the bookmarks, the DMs. Built as a full-stack portfolio project on the MERN stack, with a modern React frontend and an AI assistant called **Nest** baked into the experience.

This isn't a static UI mockup. You can sign up, tweet, repost, quote-tweet, like, comment, follow people, get notifications, bookmark tweets, search users and hashtags, crop profile photos, edit your profile (bio, website, birthday), and chat in real time.

🔗 **Live demo:** [twitter-clone-mu-gilt.vercel.app](https://twitter-clone-mu-gilt.vercel.app)

API backend: [twitter-clone-aqdu.onrender.com](https://twitter-clone-aqdu.onrender.com) *(proxied through Vercel as `/api`)*

---

## ✨ Highlights

| Area | What you get |
|------|----------------|
| **Feed** | For You / Following tabs, infinite scroll, repost wrappers, quote tweets |
| **Tweets** | Create, edit, delete, pin, bookmark, image upload via Cloudinary |
| **Profiles** | Cover & avatar crop, bio, website, birthday, followers/following, media grid |
| **Social** | Follow/unfollow, DMs, notifications, profile tabs (Tweets / Replies / Media / Likes) |
| **Discovery** | Live search, trending hashtags, suggested users, empty-state onboarding |
| **Nest AI** | In-app assistant — search, trends, thread summaries (OpenAI) |
| **UX** | Mobile-first nav, light/dark/system theme, optimistic cache updates |
| **Auth** | JWT in `httpOnly` cookies, bcrypt passwords, protected routes |

---

## 🛠️ Tech Stack

**Backend** — Node.js, Express 5, MongoDB/Mongoose, JWT, Cloudinary, OpenAI

**Frontend** — React 19, Vite, TailwindCSS, daisyUI, TanStack Query, React Router 7

**Deploy** — Vercel (frontend) + Render (API)

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas (or local MongoDB)
- Cloudinary account
- OpenAI API key *(optional — Nest AI)*

### Setup

```bash
git clone https://github.com/AseelHerzallah1/twitter-clone.git
cd twitter-clone
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Keep `NODE_ENV=development` in `.env` for local work.

```bash
# Install dependencies
npm install
npm install --prefix frontend

# Terminal 1 — API on :5000
npm run dev

# Terminal 2 — Vite on :3000 (proxies /api → backend)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---


---

## 📁 Project Structure

```
twitter-clone/
├── backend/
│   ├── controllers/    # Auth, posts, users, messages, search, nest
│   ├── models/         # User, Post, Notification, Conversation, Message
│   ├── routes/
│   ├── lib/nest/       # Nest AI tools + system prompt
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/ # Tweet, Sidebar, MobileNav, Nest, etc.
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── utils/
│   └── vercel.json     # API proxy for split deploy
└── .env.example
```
---

## 📡 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users/profile/:username` | User profile |
| POST | `/api/users/update` | Update profile (bio, link, birthday, images, password) |
| POST | `/api/users/follow/:id` | Follow / unfollow |
| GET | `/api/posts/all` | For You feed (paginated) |
| GET | `/api/posts/following` | Following feed |
| GET | `/api/posts/user/:username` | User tweets |
| POST | `/api/posts/create` | Create tweet |
| PUT | `/api/posts/:id` | Edit tweet |
| DELETE | `/api/posts/:id` | Delete tweet |
| POST | `/api/posts/retweet/:id` | Repost / undo repost |
| POST | `/api/posts/like/:id` | Like / unlike |
| POST | `/api/posts/bookmark/:id` | Bookmark / unbookmark |
| POST | `/api/posts/comment/:id` | Reply |
| POST | `/api/posts/pin/:id` | Pin tweet to profile |
| GET | `/api/search?q=` | Search users & tweets |
| GET | `/api/search/trends` | Trending hashtags |
| GET | `/api/messages` | List conversations |
| POST | `/api/messages/conversation` | Start or open a DM |
| POST | `/api/messages/:id` | Send message |
| DELETE | `/api/messages/:id` | Delete conversation |
| POST | `/api/nest/chat` | Nest AI chat |

---

## 📝 License

Educational / portfolio project. Not affiliated with X Corp.

Built with nostalgia for the old bird. 🐦
