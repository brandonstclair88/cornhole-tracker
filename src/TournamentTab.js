import { supabase } from './supabase';

// Get the current week's Monday
export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Check if today is a weekday (Mon-Thu)
export function isWeekday(date = new Date()) {
  const day = date.getDay();
  return day >= 1 && day <= 4;
}

// Get current session info
export function getCurrentSession(now = new Date()) {
  if (!isWeekday(now)) return null;

  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;

  const morningOpen = 6 * 60;       // 6:00am
  const morningLock = 10 * 60;      // 10:00am
  const afternoonOpen = 10 * 60 + 15; // 10:15am
  const afternoonLock = 15 * 60;    // 3:00pm

  if (totalMinutes >= morningOpen && totalMinutes < morningLock) {
    return { type: 'morning', opensAt: morningOpen, locksAt: morningLock, status: 'open' };
  }
  if (totalMinutes >= morningLock && totalMinutes < morningLock + 5) {
    return { type: 'morning', opensAt: morningOpen, locksAt: morningLock, status: 'locking' };
  }
  if (totalMinutes >= afternoonOpen && totalMinutes < afternoonLock) {
    return { type: 'afternoon', opensAt: afternoonOpen, locksAt: afternoonLock, status: 'open' };
  }
  if (totalMinutes >= afternoonLock && totalMinutes < afternoonLock + 5) {
    return { type: 'afternoon', opensAt: afternoonOpen, locksAt: afternoonLock, status: 'locking' };
  }

  // Find next session
  if (totalMinutes < morningOpen) {
    return { type: 'morning', locksAt: morningLock, status: 'upcoming', minutesUntilOpen: morningOpen - totalMinutes };
  }
  if (totalMinutes >= morningLock && totalMinutes < afternoonOpen) {
    return { type: 'afternoon', locksAt: afternoonLock, status: 'upcoming', minutesUntilOpen: afternoonOpen - totalMinutes };
  }
  return { status: 'done' }; // both sessions done for today
}

// Get minutes until lock
export function minutesUntilLock(session, now = new Date()) {
  if (!session) return null;
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  return session.locksAt - totalMinutes;
}

// Format countdown
export function formatCountdown(minutes) {
  if (minutes <= 0) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Build player stats for balancing
export function buildPlayerStats(players, games) {
  const stats = {};
  players.forEach(p => {
    stats[p.id] = { wins: 0, losses: 0, pts: 0, hole: 0, board: 0, mvps: 0 };
  });
  games.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      const isT1 = ti === 0;
      const won = isT1 ? t1win : !t1win;
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (won) stats[pid].wins++; else stats[pid].losses++;
        stats[pid].pts += isT1 ? g.t1_score : g.t2_score;
      });
    });
    if (g.mvp_player_ids) {
      g.mvp_player_ids.forEach(pid => {
        if (stats[pid]) stats[pid].mvps++;
      });
    }
  });
  return stats;
}

function winPct(s) {
  const total = s.wins + s.losses;
  return total > 0 ? s.wins / total : 0;
}

// Get sessions played this week per player
export async function getWeeklySessionCounts(weekStart) {
  const weekEnd = getWeekEnd(weekStart);
  const { data: sessions } = await supabase
    .from('tournament_sessions')
    .select('id, session_date, status')
    .gte('session_date', weekStart.toISOString().split('T')[0])
    .lte('session_date', weekEnd.toISOString().split('T')[0])
    .eq('status', 'completed');

  if (!sessions?.length) return {};

  const { data: checkins } = await supabase
    .from('tournament_checkins')
    .select('player_id, session_id')
    .in('session_id', sessions.map(s => s.id));

  const counts = {};
  (checkins || []).forEach(c => {
    counts[c.player_id] = (counts[c.player_id] || 0) + 1;
  });
  return counts;
}

// Get all-time session counts per player
export async function getAllTimeSessionCounts() {
  const { data: checkins } = await supabase
    .from('tournament_checkins')
    .select('player_id');

  const counts = {};
  (checkins || []).forEach(c => {
    counts[c.player_id] = (counts[c.player_id] || 0) + 1;
  });
  return counts;
}

// Get teammate history this week
export async function getWeeklyTeammates(weekStart) {
  const weekEnd = getWeekEnd(weekStart);
  const { data: sessions } = await supabase
    .from('tournament_sessions')
    .select('*')
    .gte('session_date', weekStart.toISOString().split('T')[0])
    .lte('session_date', weekEnd.toISOString().split('T')[0])
    .eq('status', 'completed');

  const pairs = {};
  (sessions || []).forEach(s => {
    const addPair = (a, b) => {
      if (!a || !b) return;
      const key = [a, b].sort().join('-');
      pairs[key] = (pairs[key] || 0) + 1;
    };
    addPair(s.team1_p1, s.team1_p2);
    addPair(s.team2_p1, s.team2_p2);
  });
  return pairs;
}

// Get bye history this week
export async function getWeeklyByes(weekStart) {
  const weekEnd = getWeekEnd(weekStart);
  const { data: sessions } = await supabase
    .from('tournament_sessions')
    .select('bye_player')
    .gte('session_date', weekStart.toISOString().split('T')[0])
    .lte('session_date', weekEnd.toISOString().split('T')[0])
    .not('bye_player', 'is', null);

  const byes = {};
  (sessions || []).forEach(s => {
    if (s.bye_player) byes[s.bye_player] = (byes[s.bye_player] || 0) + 1;
  });
  return byes;
}

// Main team balancing algorithm
export async function generateTeams(checkedInPlayers, allPlayers, allGames, weekStart) {
  if (checkedInPlayers.length < 4) return null;

  const stats = buildPlayerStats(allPlayers, allGames);
  const weeklyCounts = await getWeeklySessionCounts(weekStart);
  const allTimeCounts = await getAllTimeSessionCounts();
  const weeklyTeammates = await getWeeklyTeammates(weekStart);
  const weeklyByes = await getWeeklyByes(weekStart);

  // Sort by win %
  const sorted = [...checkedInPlayers].sort((a, b) => winPct(stats[b.id] || {}) - winPct(stats[a.id] || {}));

  let players4 = sorted.slice(0, 4);
  let byePlayer = null;

  if (checkedInPlayers.length === 5) {
    // Pick bye: most sessions this week, tiebreak all-time, slight nudge for historically less active
    const byeCandidate = sorted.reduce((worst, p) => {
      const weeklyW = weeklyCounts[p.id] || 0;
      const weeklyWorst = weeklyCounts[worst.id] || 0;
      if (weeklyW > weeklyWorst) return p;
      if (weeklyW === weeklyWorst) {
        const atW = allTimeCounts[p.id] || 0;
        const atWorst = allTimeCounts[worst.id] || 0;
        return atW > atWorst ? p : worst;
      }
      return worst;
    });

    // But protect historically less active players
    const hasGuaranteedBye = Object.entries(weeklyByes).find(([pid]) =>
      checkedInPlayers.find(p => p.id === pid) && weeklyByes[pid] === 0
    );

    byePlayer = hasGuaranteedBye
      ? checkedInPlayers.find(p => p.id === hasGuaranteedBye[0])
      : byeCandidate;

    players4 = sorted.filter(p => p.id !== byePlayer.id).slice(0, 4);
  }

  // Top 2 players always split
  const top2 = players4.slice(0, 2);
  const rest = players4.slice(2);

  // Try all combinations to minimize skill difference and avoid repeat teammates
  let bestTeams = null;
  let bestScore = Infinity;

  const combos = [
    [[top2[0], rest[0]], [top2[1], rest[1]]],
    [[top2[0], rest[1]], [top2[1], rest[0]]],
  ];

  combos.forEach(([t1, t2]) => {
    const t1skill = (winPct(stats[t1[0].id] || {}) + winPct(stats[t1[1].id] || {})) / 2;
    const t2skill = (winPct(stats[t2[0].id] || {}) + winPct(stats[t2[1].id] || {})) / 2;
    const skillDiff = Math.abs(t1skill - t2skill);

    // Penalize repeated teammates
    const t1key = [t1[0].id, t1[1].id].sort().join('-');
    const t2key = [t2[0].id, t2[1].id].sort().join('-');
    const repeatPenalty = ((weeklyTeammates[t1key] || 0) + (weeklyTeammates[t2key] || 0)) * 0.5;

    const score = skillDiff + repeatPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestTeams = { t1, t2 };
    }
  });

  return { team1: bestTeams.t1, team2: bestTeams.t2, byePlayer };
}

// Calculate MVP for a game
export function calculateMVP(game) {
  const players = [
    { id: game.t1_p1, score: (game.t1_p1_hole || 0) * 3 + (game.t1_p1_board || 0) },
    { id: game.t1_p2, score: (game.t1_p2_hole || 0) * 3 + (game.t1_p2_board || 0) },
    { id: game.t2_p1, score: (game.t2_p1_hole || 0) * 3 + (game.t2_p1_board || 0) },
    { id: game.t2_p2, score: (game.t2_p2_hole || 0) * 3 + (game.t2_p2_board || 0) },
  ].filter(p => p.id);

  if (players.every(p => p.score === 0)) return [];

  const max = Math.max(...players.map(p => p.score));
  return players.filter(p => p.score === max).map(p => p.id);
}

// Check for special game events
export function checkSpecialEvents(game) {
  const events = [];
  if (game.t2_score === 0 || game.t1_score === 0) events.push('shutout');

  const losingScore = Math.min(game.t1_score, game.t2_score);
  const winningScore = Math.max(game.t1_score, game.t2_score);
  // We'd need round-by-round data to detect comebacks properly
  // For now flag based on margin + score pattern

  return events;
}

// Get weekly stats for awards
export async function getWeeklyStats(weekStart, players, games) {
  const weekEnd = getWeekEnd(weekStart);
  const weekGames = games.filter(g => {
    const d = new Date(g.played_at);
    return d >= weekStart && d <= weekEnd;
  });

  const { data: sessions } = await supabase
    .from('tournament_sessions')
    .select('*, tournament_checkins(*)')
    .gte('session_date', weekStart.toISOString().split('T')[0])
    .lte('session_date', weekEnd.toISOString().split('T')[0]);

  // Count sessions each player was checked in for
  const checkinCounts = {};
  const playedCounts = {};
  (sessions || []).forEach(s => {
    (s.tournament_checkins || []).forEach(c => {
      checkinCounts[c.player_id] = (checkinCounts[c.player_id] || 0) + 1;
    });
    if (s.status === 'completed') {
      [s.team1_p1, s.team1_p2, s.team2_p1, s.team2_p2].forEach(pid => {
        if (pid) playedCounts[pid] = (playedCounts[pid] || 0) + 1;
      });
    }
  });

  const stats = {};
  players.forEach(p => {
    const checkedIn = checkinCounts[p.id] || 0;
    const played = playedCounts[p.id] || 0;
    const eligible = checkedIn > 0 && played >= checkedIn * 0.5;
    stats[p.id] = {
      wins: 0, losses: 0, pts: 0, hole: 0, board: 0, mvps: 0,
      checkedIn, played, eligible,
      maxLossMargin: 0, closelosses: 0,
      bestHoleGame: 0,
    };
  });

  weekGames.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      const isT1 = ti === 0;
      const won = isT1 ? t1win : !t1win;
      const score = isT1 ? g.t1_score : g.t2_score;
      const oppScore = isT1 ? g.t2_score : g.t1_score;
      const margin = Math.abs(g.t1_score - g.t2_score);
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (won) stats[pid].wins++; else {
          stats[pid].losses++;
          if (margin <= 2) stats[pid].closelosses++;
        }
        stats[pid].pts += score;
      });
    });

    const playerHoles = {
      [g.t1_p1]: (g.t1_p1_hole || 0),
      [g.t1_p2]: (g.t1_p2_hole || 0),
      [g.t2_p1]: (g.t2_p1_hole || 0),
      [g.t2_p2]: (g.t2_p2_hole || 0),
    };
    const playerBoards = {
      [g.t1_p1]: (g.t1_p1_board || 0),
      [g.t1_p2]: (g.t1_p2_board || 0),
      [g.t2_p1]: (g.t2_p1_board || 0),
      [g.t2_p2]: (g.t2_p2_board || 0),
    };

    Object.keys(playerHoles).forEach(pid => {
      if (!stats[pid]) return;
      stats[pid].hole += playerHoles[pid];
      stats[pid].board += playerBoards[pid];
      if (playerHoles[pid] > stats[pid].bestHoleGame) stats[pid].bestHoleGame = playerHoles[pid];
    });

    if (g.mvp_player_ids) {
      g.mvp_player_ids.forEach(pid => {
        if (stats[pid]) stats[pid].mvps++;
      });
    }
  });

  return stats;
}

// Determine weekly award winners
export function determineAwardWinners(weeklyStats, players) {
  const eligible = players.filter(p => weeklyStats[p.id]?.eligible);
  const anyone = players.filter(p => (weeklyStats[p.id]?.wins + weeklyStats[p.id]?.losses) > 0);

  function bestBy(pool, ...comparators) {
    if (!pool.length) return null;
    return pool.reduce((best, p) => {
      for (const fn of comparators) {
        const diff = fn(p) - fn(best);
        if (diff > 0) return p;
        if (diff < 0) return best;
      }
      return best;
    });
  }

  const winPctFn = p => {
    const s = weeklyStats[p.id];
    const t = s.wins + s.losses;
    return t > 0 ? s.wins / t : 0;
  };

  const master = bestBy(eligible, winPctFn, p => weeklyStats[p.id].pts, p => weeklyStats[p.id].mvps);
  const clown = eligible.length ? bestBy(eligible,
    p => -winPctFn(p), p => -weeklyStats[p.id].pts, p => -weeklyStats[p.id].mvps
  ) : null;

  const bagWhisperer = bestBy(anyone, p => weeklyStats[p.id].bestHoleGame);
  const boardHugger = bestBy(anyone,
    p => weeklyStats[p.id].board,
    p => -weeklyStats[p.id].hole
  );
  const onFire = bestBy(anyone, p => weeklyStats[p.id].wins);
  const iceCold = bestBy(anyone, p => weeklyStats[p.id].losses);
  const soClose = bestBy(anyone, p => weeklyStats[p.id].closelosses);

  return { master, clown, bagWhisperer, boardHugger, onFire, iceCold, soClose };
}

export default function TournamentTab({ players, games, toast }) {
  return <div style={{padding:'2rem',color:'var(--text2)',textAlign:'center'}}>Tournament tab loading... refresh if this persists.</div>;
}
