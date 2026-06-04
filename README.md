# 🎯 Cornhole Tracker

A shared scoreboard for your work break cornhole games. Built with React + Supabase. Everyone uses the same URL to log games and see standings live.

---

## Setup (takes ~10 minutes)

### Step 1 — Create a free Supabase database

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Click **New Project**, give it a name like `cornhole`, pick a region, set a password
3. Wait ~2 minutes for the project to spin up

### Step 2 — Create the database tables

In your Supabase project, click **SQL Editor** in the left sidebar, paste this SQL, and click **Run**:

```sql
-- Players table
create table players (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Games table
create table games (
  id uuid default gen_random_uuid() primary key,
  t1_p1 uuid references players(id),
  t1_p2 uuid references players(id),
  t2_p1 uuid references players(id),
  t2_p2 uuid references players(id),
  t1_score int default 0,
  t2_score int default 0,
  t1_hole int default 0,
  t2_hole int default 0,
  t1_board int default 0,
  t2_board int default 0,
  played_at timestamptz default now()
);

-- Allow public read/write (no login required for your crew)
alter table players enable row level security;
alter table games enable row level security;

create policy "public read players" on players for select using (true);
create policy "public insert players" on players for insert with check (true);
create policy "public delete players" on players for delete using (true);

create policy "public read games" on games for select using (true);
create policy "public insert games" on games for insert with check (true);

-- Enable realtime so the leaderboard updates live
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table games;
```

### Step 3 — Get your API keys

In your Supabase project, go to **Settings → API**. You need:
- **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
- **anon public** key (long string starting with `eyJ...`)

### Step 4 — Push to GitHub

1. Create a new repo on [github.com](https://github.com/new) — call it `cornhole-tracker`
2. In your terminal, inside this folder:

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cornhole-tracker.git
git push -u origin main
```

### Step 5 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**, import your `cornhole-tracker` repo
3. Before clicking Deploy, expand **Environment Variables** and add:

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | your Project URL from Step 3 |
| `REACT_APP_SUPABASE_ANON_KEY` | your anon key from Step 3 |

4. Click **Deploy** — done!

Vercel gives you a URL like `cornhole-tracker-xyz.vercel.app`. Share it with your crew.

---

## Local development

```bash
# Copy the env template
cp .env.example .env.local
# Fill in your Supabase URL and anon key in .env.local

npm install
npm start
```

---

## Features

- **Leaderboard** — ranked standings with win %, points, bags in hole, bags on board
- **Log Game** — pick 2v2 teams, enter score + bag stats
- **Players** — add/remove players from the roster
- **Head-to-Head** — see how any two players match up across all games
- **Live updates** — the leaderboard updates in real time when anyone logs a game
- **Mobile-friendly** — works great on phones

---

## Tech stack

- React (Create React App)
- Supabase (Postgres database + realtime subscriptions)
- Vercel (hosting)
