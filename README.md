<<<<<<< HEAD
# LinkVault

LinkVault is a secure text and file sharing app. Think of it like a private Pastebin — you upload something (a snippet of text, a PDF, an image, whatever), get a unique link, and only people with that exact link can see it. Links expire automatically, so nothing sticks around forever.

I built this as a full-stack project using React on the frontend and Express + MongoDB on the backend, with Supabase handling file storage.

---

## What it does

- Upload plain text or any file (up to 50 MB) and get a short, random link back
- Links expire after a set time (default 10 minutes, configurable)
- Optional password protection on links
- "Burn after reading" mode — content self-destructs after one view
- You can cap how many times a link can be viewed
- Logged-in users get a dashboard to see and manage all their uploads
- Only the person who uploaded something can delete it
- A background cron job cleans up expired files every minute so storage doesn't pile up
- Dangerous file types (.exe, .bat, .dll etc.) are blocked on both client and server

---

## Tech used

- **Frontend:** React 18, Vite, Tailwind CSS, Axios, React Router v6
- **Backend:** Node.js, Express, Mongoose, Multer, express-validator
- **Database:** MongoDB Atlas (with TTL index for auto-expiry)
- **File storage:** Supabase Storage (S3-compatible, free tier works fine)
- **Auth:** JWT tokens (7-day expiry), bcrypt for password hashing

---

## Setup instructions

### Prerequisites

You'll need these installed:
- Node.js (v18 or above)
- npm
- A MongoDB Atlas cluster (free tier is enough) — grab the connection string
- A Supabase project — you need the URL, service key, and a storage bucket called `uploads`

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd DesignLab
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/linkvault
JWT_SECRET=pick-something-random-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_BUCKET=uploads
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=52428800
```

Start the server:

```bash
npm start
```

You should see:
```
✅ MongoDB connected
⏰ Cleanup cron job started (every 1 min)
🚀 LinkVault backend running on http://localhost:5000
```

For development with auto-reload:
```bash
npm run dev
```

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend on port 5000 automatically, so no CORS issues during development.

### 4. Try it out

1. Open `http://localhost:5173`
2. Paste some text or pick a file
3. Tweak the options if you want (expiry, password, etc.)
4. Hit "Create Secure Link"
5. Copy the link and open it in a different tab or incognito window

---

## API overview

Base URL: `http://localhost:5000/api`

### Auth

| Method | Endpoint | What it does | Auth needed? |
|--------|----------|-------------|--------------|
| POST | `/auth/register` | Create a new account | No |
| POST | `/auth/login` | Log in, get a JWT back | No |
| GET | `/auth/me` | Get current user info | Yes |

**Register body:**
```json
{ "name": "Gopi", "email": "gopi@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "gopi@example.com", "password": "secret123" }
```

Both return `{ token, user }`. Store the token and send it as `Authorization: Bearer <token>` on subsequent requests.

### Uploads

| Method | Endpoint | What it does | Auth needed? |
|--------|----------|-------------|--------------|
| POST | `/upload` | Create a new upload (text or file) | Optional (links to account if logged in) |
| GET | `/:slug/meta` | Get metadata for a link (no password needed) | Optional |
| POST | `/:slug/view` | View/download the actual content | No (but may need password in body) |
| DELETE | `/:slug` | Delete an upload permanently | Yes (must be the uploader) |
| GET | `/my-uploads` | List all your uploads | Yes |

**Upload example (text):**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "textContent=hello world" \
  -F "expiresIn=30" \
  -F "password=optional-secret"
```

**Upload example (file):**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@./photo.png" \
  -F "oneTimeView=true"
```

**Response:**
```json
{
  "slug": "a1B2c3D4e5F6",
  "type": "text",
  "expiresAt": "2026-02-15T10:30:00.000Z",
  "oneTimeView": false,
  "maxViews": null,
  "hasPassword": false
}
```

**View content:**
```bash
curl -X POST http://localhost:5000/api/a1B2c3D4e5F6/view \
  -H "Content-Type: application/json" \
  -d '{"password": "optional-secret"}'
```

For files, the response includes a `downloadUrl` (a Supabase signed URL valid for 2 minutes).

### Error responses

The API uses standard HTTP codes:
- `400` — bad input (missing fields, blocked file type, validation errors)
- `401` — not authenticated, or wrong password on a protected link
- `403` — you're not the owner of this upload / link not found
- `410` — link has expired or hit its max view count
- `413` — file too large
- `500` — something broke on our end

---

## Project structure

```
DesignLab/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection setup
│   │   │   └── supabase.js        # Supabase client init
│   │   ├── controllers/
│   │   │   └── uploadController.js # All the CRUD logic lives here
│   │   ├── jobs/
│   │   │   └── cleanup.js         # Cron job — deletes expired stuff
│   │   ├── middleware/
│   │   │   └── auth.js            # requireAuth & optionalAuth
│   │   ├── models/
│   │   │   ├── Upload.js          # Upload schema (slug, type, expiry, etc.)
│   │   │   └── User.js            # User schema (name, email, passwordHash)
│   │   ├── routes/
│   │   │   ├── authRoutes.js      # /auth/register, /auth/login, /auth/me
│   │   │   └── uploadRoutes.js    # /upload, /:slug/meta, /:slug/view, etc.
│   │   ├── utils/
│   │   │   ├── jwt.js             # sign and verify JWT tokens
│   │   │   └── storage.js         # Supabase upload / getSignedUrl / delete
│   │   └── server.js              # Express entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # JWT stored in localStorage
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Upload form
│   │   │   ├── ResultPage.jsx      # Shows the shareable link
│   │   │   ├── ViewPage.jsx        # Content viewer / downloader
│   │   │   ├── DashboardPage.jsx   # User's uploads list
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── api.js                  # Axios instance + all API calls
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js              # Vite config + /api proxy
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## Design decisions

I want to be upfront about why I picked certain things, because some of these were trade-offs.

**Why Supabase for file storage instead of just stuffing files into MongoDB?**

MongoDB can technically store files via GridFS, but it gets messy fast — your database size balloons, backups become huge, and you lose out on CDN-style signed URLs. Supabase gives me an S3-compatible bucket for free, signed URLs with expiry baked in, and it keeps the MongoDB documents small (just metadata). The downside is an extra external dependency, but for this use case it was worth it.

**Why nanoid for slugs?**

I needed something short enough to share but random enough that people can't guess other links. nanoid with 12 characters gives roughly 3.5 × 10²¹ possible combinations, which is way more than enough. I considered UUIDs but they're long and ugly in URLs.

**Why POST for the view endpoint instead of GET?**

Some uploads are password-protected. If I used GET, the password would have to go in a query parameter, which shows up in server logs, browser history, referrer headers — all bad. POST lets me send it in the request body.

**Why two expiry mechanisms (TTL index + cron)?**

MongoDB's TTL index handles document deletion automatically, which is great. But TTL can't trigger side effects — it just silently drops the document. The files on Supabase would be left orphaned. So I added a cron job that runs every minute: it finds expired uploads, deletes the Supabase file first, then removes the MongoDB doc. Belt and suspenders.

**Why Multer with memory storage?**

Files go straight from the upload request into a memory buffer, then get pushed to Supabase. No temp files on disk. This is fine for the 50 MB limit, but if I needed to support gigabyte-sized uploads I'd switch to streaming or disk storage.

**Why only the uploader can delete?**

Earlier, anyone with the link could delete an upload. That felt wrong — if you share a link with 5 people, any one of them could nuke it for everyone else. Now deletion requires authentication and the server checks that `req.user._id` matches the upload's `userId`. Anonymous uploads (created without logging in) can't be manually deleted at all — they just expire naturally.

**Why Vite proxy in development?**

The frontend runs on :5173 and the backend on :5000. Without the proxy, every API call would be a cross-origin request and I'd have to mess around with CORS headers during development. Vite's built-in proxy forwards `/api` requests to the backend seamlessly. In production you'd put everything behind a reverse proxy like Nginx anyway.

---

## Assumptions and limitations

Here's what I'm aware of and would want to fix if this were going to production:

1. **No rate limiting.** Someone could hammer the upload endpoint and fill up storage. In production I'd add express-rate-limit or put it behind Cloudflare.

2. **50 MB file limit.** This is a conscious choice for a demo — Multer loads the whole file into memory, so going higher would risk OOM on a small server. For larger files I'd switch to multipart streaming directly to Supabase.

3. **Cron cleanup has a ~60 second window.** An upload that just expired might still be viewable for up to a minute until the next cron run. The TTL index also isn't instant (MongoDB checks every 60 seconds by default). For most use cases this is fine, but if you needed exact-to-the-second expiry you'd need to check `expiresAt` on every view request too — which I actually do, so the window only matters for the Supabase file still existing briefly after expiry.

4. **No email verification.** Users can register with any email. I'm not sending verification emails because that would need an email service (SendGrid, SES, etc.) which felt out of scope.

5. **JWT stored in localStorage.** I know this is debatable — httpOnly cookies would be more secure against XSS. I went with localStorage because it's simpler to implement with a React SPA and Axios interceptors. If this were handling sensitive data I'd switch to cookies.

6. **No file encryption at rest.** Files sit in Supabase Storage as-is. The bucket is private (no public URL), and access requires a signed URL generated by the backend, but the files themselves aren't encrypted. Adding client-side encryption before upload would fix this.

7. **Single server, no horizontal scaling.** The cron job runs inside the Node process. If you ran multiple instances, you'd get duplicate cleanup runs. In production I'd move the cron to a separate worker or use a distributed job queue like BullMQ.

8. **No tests.** I focused on getting the features working end-to-end. In a real project I'd have Jest tests for the controller logic and Cypress/Playwright for the frontend flows.

9. **Supabase free tier limits.** The free tier gives 1 GB storage and 2 GB bandwidth. Fine for a demo, not for production traffic.

10. **Frontend is dev-only right now.** There's no production build/deploy pipeline set up. You'd run `npm run build` in the frontend folder and serve the `dist/` folder with Nginx or deploy to Vercel/Netlify.
=======
# DesignLab-Project
>>>>>>> 61a1f04e53c99d3144cc9f23e48867bf9069e07c
