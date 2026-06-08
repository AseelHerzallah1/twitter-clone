# 🐦 Twitter Clone

Classic Twitter, rebuilt from scratch — the bird, the timeline, the reposts, the bookmarks, the DMs. Built as a full-stack portfolio project on the MERN stack, with a modern React frontend and an AI assistant called **Nest** baked into the experience.

This isn't a static UI mockup. You can sign up, post, repost, quote-tweet, like, comment, follow people, get notifications, bookmark tweets, search users and hashtags, crop profile photos, and chat in real time.

🔗 **Live demo:** [twitter-clone-aqdu.onrender.com](https://twitter-clone-aqdu.onrender.com) *(monolith deploy — Vercel + Render setup below)*

---

## ✨ Highlights

| Area | What you get |
|------|----------------|
| **Feed** | For You / Following tabs, infinite scroll, repost wrappers, quote tweets |
| **Posts** | Create, edit, delete, pin, bookmark, image upload via Cloudinary |
| **Social** | Follow/unfollow, DMs, notifications, profile media grid |
| **Discovery** | Live search, trending hashtags, suggested users, empty-state onboarding |
| **Nest AI** | In-app assistant — search, trends, thread summaries (OpenAI) |
| **UX** | Mobile-first nav, light/dark/system theme, optimistic cache updates |
| **Auth** | JWT in `httpOnly` cookies, bcrypt passwords, protected routes |

---

## 🛠️ Tech Stack

**Backend** — Node.js, Express 5, MongoDB/Mongoose, JWT, Cloudinary, OpenAI

**Frontend** — React 19, Vite, TailwindCSS, daisyUI, TanStack Query, React Router 7

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

## 🌐 Deploy: Vercel (frontend) + Render (backend)

This is the recommended production setup — fast static frontend on Vercel, persistent Node API on Render.

### Step 1 — Deploy the backend on Render

1. Push this repo to GitHub (if you haven't already).
2. Go to [render.com](https://render.com) → **New → Web Service**.
3. Connect your `twitter-clone` repository.
4. Configure:
   - **Root directory:** *(leave blank — repo root)*
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Instance type:** Free tier works for demos (cold starts ~30s).

5. Add **Environment variables** on Render:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string |
| `NODE_ENV` | `production` |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |
| `OPENAI_API_KEY` | *(optional)* |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `CLIENT_URL` | Your Vercel URL — add after Step 2, e.g. `https://twitter-clone.vercel.app` |

6. Deploy. Note your Render URL, e.g. `https://twitter-clone-api.onrender.com`.

### Step 2 — Deploy the frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**.
2. Import the same GitHub repo.
3. Configure:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`

4. Before deploying, edit `frontend/vercel.json` — replace the placeholder with your **actual Render URL**:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR-RENDER-SERVICE.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

5. Deploy. Vercel gives you a URL like `https://twitter-clone.vercel.app`.

6. Go back to **Render → Environment** and set:
   ```
   CLIENT_URL=https://twitter-clone.vercel.app
   ```
   Redeploy the Render service so CORS and auth cookies pick up the new origin.

### Step 3 — Verify

- Visit your Vercel URL → sign up / log in
- Post a tweet, like something, open Nest
- If login fails after deploy: double-check `CLIENT_URL` matches Vercel exactly (no trailing slash) and that `vercel.json` points to the right Render URL

### Why split deploy?

| | Vercel | Render |
|---|--------|--------|
| React static build | ⚡ Excellent CDN | Slower for SPAs |
| Express + MongoDB | Awkward (serverless) | ✅ Natural fit |
| Long-lived connections / Nest | Limited | ✅ Fine |

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
│   │   ├── components/ # Post, Sidebar, MobileNav, Nest, etc.
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
| GET | `/api/posts/all` | For You feed (paginated) |
| GET | `/api/posts/following` | Following feed |
| POST | `/api/posts/create` | Create post |
| PUT | `/api/posts/:id` | Edit post |
| DELETE | `/api/posts/:id` | Delete post |
| POST | `/api/posts/retweet/:id` | Repost / undo repost |
| POST | `/api/posts/like/:id` | Like / unlike |
| POST | `/api/posts/comment/:id` | Comment |
| GET | `/api/search?q=` | Search users & posts |
| GET | `/api/search/trends` | Trending hashtags |
| GET | `/api/messages` | List conversations |
| DELETE | `/api/messages/:id` | Delete conversation |
| POST | `/api/nest/chat` | Nest AI chat |

---

## 📝 License

Educational / portfolio project. Not affiliated with X Corp.

Built with nostalgia for the old bird. 🐦
