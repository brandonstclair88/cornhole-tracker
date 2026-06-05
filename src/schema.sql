-- Run this entire script in Supabase SQL Editor

-- Add new columns to games table
alter table games add column if not exists is_tournament boolean default false;
alter table games add column if not exists tournament_session_id uuid;
alter table games add column if not exists is_comeback boolean default false;
alter table games add column if not exists is_shutout boolean default false;
alter table games add column if not exists has_perfect_round boolean default false;
alter table games add column if not exists mvp_player_ids text[]; -- array of player ids (co-mvp support)

-- Tournament sessions
create table if not exists tournament_sessions (
  id uuid default gen_random_uuid() primary key,
  session_type text not null, -- 'morning' or 'afternoon'
  session_date date not null,
  opens_at timestamptz not null,
  locks_at timestamptz not null,
  status text default 'open', -- 'open', 'locked', 'cancelled', 'completed'
  team1_p1 uuid references players(id),
  team1_p2 uuid references players(id),
  team2_p1 uuid references players(id),
  team2_p2 uuid references players(id),
  bye_player uuid references players(id),
  ai_preview text,
  created_at timestamptz default now()
);

-- Tournament check-ins
create table if not exists tournament_checkins (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references tournament_sessions(id) on delete cascade,
  player_id uuid references players(id),
  checked_in_at timestamptz default now(),
  unique(session_id, player_id)
);

-- Weekly awards
create table if not exists weekly_awards (
  id uuid default gen_random_uuid() primary key,
  week_start date not null unique,
  week_end date not null,
  master_player_id uuid references players(id),
  master_description text,
  clown_player_id uuid references players(id),
  clown_description text,
  bag_whisperer_id uuid references players(id),
  board_hugger_id uuid references players(id),
  ghost_id uuid references players(id),
  on_fire_id uuid references players(id),
  ice_cold_id uuid references players(id),
  so_close_id uuid references players(id),
  created_at timestamptz default now()
);

-- Player monthly stats (for player of the month)
create table if not exists monthly_awards (
  id uuid default gen_random_uuid() primary key,
  month_start date not null unique,
  player_id uuid references players(id),
  description text,
  created_at timestamptz default now()
);

-- RLS policies for new tables
alter table tournament_sessions enable row level security;
alter table tournament_checkins enable row level security;
alter table weekly_awards enable row level security;
alter table monthly_awards enable row level security;

create policy "public read tournament_sessions" on tournament_sessions for select using (true);
create policy "public insert tournament_sessions" on tournament_sessions for insert with check (true);
create policy "public update tournament_sessions" on tournament_sessions for update using (true);

create policy "public read tournament_checkins" on tournament_checkins for select using (true);
create policy "public insert tournament_checkins" on tournament_checkins for insert with check (true);
create policy "public delete tournament_checkins" on tournament_checkins for delete using (true);

create policy "public read weekly_awards" on weekly_awards for select using (true);
create policy "public insert weekly_awards" on weekly_awards for insert with check (true);
create policy "public update weekly_awards" on weekly_awards for update using (true);

create policy "public read monthly_awards" on monthly_awards for select using (true);
create policy "public insert monthly_awards" on monthly_awards for insert with check (true);
create policy "public update monthly_awards" on monthly_awards for update using (true);

-- Enable realtime for new tables
alter publication supabase_realtime add table tournament_sessions;
alter publication supabase_realtime add table tournament_checkins;
alter publication supabase_realtime add table weekly_awards;
