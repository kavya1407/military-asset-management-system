# Tactical Military Asset Management System (MAMS)
## Production Deployment Guide & Live Demo Links

---

### 1. Live Working Demo (Active Now)

| Component | Platform / URL | Instructions / Access |
| :--- | :--- | :--- |
| **Live Full-Stack App** | **[https://vanguard-defense-mams.loca.lt](https://vanguard-defense-mams.loca.lt)** | **Live Active Tunnel**: If prompted for a "Tunnel Password", enter: **`49.37.158.134`** and click Submit. |
| **Live API Health Check** | **[https://vanguard-defense-mams.loca.lt/api/health](https://vanguard-defense-mams.loca.lt/api/health)** | Returns `{ status: 'ONLINE', system: 'Military Asset Management System API' }`. |
| **Local Full-Stack Host** | **`http://localhost:5001`** | Unified production build serving both React UI and REST APIs. |

---

### 2. Deploying to Your Personal Vercel Account (2 Minutes)

`https://vanguard-mams.vercel.app` was a placeholder domain in the project submission template. To deploy your own permanent instance to Vercel:

#### Method A: Via Vercel Web Dashboard (Easiest)
1. Push this project folder to your GitHub or GitLab account (`git init`, `git add .`, `git commit -m "initial commit"`, `git push`).
2. Go to **[vercel.com/new](https://vercel.com/new)** and import the repository.
3. In the configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Vercel will assign you a live production URL (e.g. `https://your-mams.vercel.app`).

#### Method B: Via Vercel CLI
```bash
cd frontend
npx vercel
# Follow the interactive prompts to deploy directly from your terminal!
```

---

### 3. Deploying the Backend to Render (2 Minutes)

#### Step 1: Create Web Service on Render
1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your repository.
4. Set the configuration:
   - **Name**: `military-asset-management-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && node src/db/seed.js`
   - **Start Command**: `node src/server.js`
   - **Plan**: `Free`

#### Step 2: Add Environment Variables
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `JWT_SECRET`: `vanguard-military-defense-jwt-secret-key-2026`
- `DB_PATH`: `./data/military_assets.db`

#### Step 3: Deploy
Click **Deploy Web Service**. Render will deploy the API and output your permanent live URL (e.g. `https://military-asset-management-api.onrender.com`).

---

### 4. Working Demo Credentials

| Callsign / Username | Password | Role | Command Jurisdiction |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@1234` | **`ADMIN`** | Global Strategic HQ (All 4 Bases) |
| **`commander_liberty`** | `Commander@1234` | **`BASE_COMMANDER`** | Fort Liberty, NC |
| **`commander_pendleton`** | `Commander@1234` | **`BASE_COMMANDER`** | Camp Pendleton, CA |
| **`logistics_liberty`** | `Logistics@1234` | **`LOGISTICS_OFFICER`** | Fort Liberty Logistics |
| **`logistics_ramstein`** | `Logistics@1234` | **`LOGISTICS_OFFICER`** | Ramstein Air Base (Germany) |
