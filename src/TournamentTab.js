import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { OneSignalManager } from './OneSignalManager';
import {
  getCurrentSession, minutesUntilLock, formatCountdown,
  getWeekStart, generateTeams, isWeekday, getWeeklyTeammates
} from './tournamentUtils';

const AVATAR_COLORS = [
  { bg: '#2a2318', fg: '#e8c547' }, { bg: '#1a2820', fg: '#4caf82' },
  { bg: '#251818', fg: '#e05c5c' }, { bg: '#1a2030', fg: '#6ba3e0' },
  { bg: '#221a28', fg: '#b07ee0' }, { bg: '#1f2018', fg: '#8ec44a' },
];

function Avatar({ name, index, size = 28 }) {
  const c = AVATAR_COLORS[(index || 0) % AVATAR_COLORS.length];
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: size * 0.38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
      {initials}
    </div>
  );
}

async function generateAIPreview(t1names, t2names, h2hCount) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        temperature: 1.0,
        messages: [{
          role: 'user',
          content: `You're a hype announcer for a work cornhole tournament. Write a short (1-2 sentence) pre-game trash talk for this matchup. Use their names. Be funny and savage. No quotes, no emojis.\n\nTeam 1: ${t1names}\nTeam 2: ${t2names}\nPrevious matchups: ${h2hCount}\n\nBe unpredictable and creative.`
        }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch (e) {
    return null;
  }
}

// Pick next 4 players for a game from the session pool
// Prioritizes players who have played least this session
function pickNextGame(allPlayers, sessionGames, sessionPlayerIds, allGames, weekStart) {
  // Count games played this session per player
  const sessionPlayCount = {};
  sessionPlayerIds.forEach(id => { sessionPlayCount[id] = 0; });
  sessionGames.forEach(g => {
    [g.t1_p1, g.t1_p2, g.t2_p1, g.t2_p2].forEach(id => {
      if (sessionPlayCount[id] !== undefined) sessionPlayCount[id]++;
    });
  });

  // Sort by least played this session, then by win %
  const stats = {};
  allPlayers.forEach(p => { stats[p.id] = { wins: 0, losses: 0 }; });
  allGames.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (ti === 0 ? t1win : !t1win) stats[pid].wins++;
        else stats[pid].losses++;
      });
    });
  });

  const pool = sessionPlayerIds
    .map(id => allPlayers.find(p => p.id === id))
    .filter(Boolean)
    .sort((a, b) => {
      const playDiff = sessionPlayCount[a.id] - sessionPlayCount[b.id];
      if (playDiff !== 0) return playDiff;
      const wa = stats[a.id].wins / (stats[a.id].wins + stats[a.id].losses || 1);
      const wb = stats[b.id].wins / (stats[b.id].wins + stats[b.id].losses || 1);
      return wb - wa;
    });

  if (pool.length < 4) return null;
  return pool.slice(0, 4);
}

// Balance 4 players into two teams, top 2 split, avoid repeat teammates
async function balanceTeams(fourPlayers, allGames, weekStart, allPlayers) {
  const stats = {};
  allPlayers.forEach(p => { stats[p.id] = { wins: 0, losses: 0 }; });
  allGames.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (ti === 0 ? t1win : !t1win) stats[pid].wins++;
        else stats[pid].losses++;
      });
    });
  });

  const winPct = p => {
    const s = stats[p.id] || { wins: 0, losses: 0 };
    return s.wins / (s.wins + s.losses || 1);
  };

  const sorted = [...fourPlayers].sort((a, b) => winPct(b) - winPct(a));
  const top2 = sorted.slice(0, 2);
  const rest = sorted.slice(2);

  const weeklyTeammates = await getWeeklyTeammates(weekStart);

  const combos = [
    [[top2[0], rest[0]], [top2[1], rest[1]]],
    [[top2[0], rest[1]], [top2[1], rest[0]]],
  ];

  let best = null;
  let bestScore = Infinity;
  combos.forEach(([t1, t2]) => {
    const skillDiff = Math.abs((winPct(t1[0]) + winPct(t1[1])) - (winPct(t2[0]) + winPct(t2[1])));
    const t1key = [t1[0].id, t1[1].id].sort().join('-');
    const t2key = [t2[0].id, t2[1].id].sort().join('-');
    const repeatPenalty = ((weeklyTeammates[t1key] || 0) + (weeklyTeammates[t2key] || 0)) * 0.5;
    const score = skillDiff + repeatPenalty;
    if (score < bestScore) { bestScore = score; best = { team1: t1, team2: t2 }; }
  });

  return best;
}

export default function TournamentTab({ players, games, toast }) {
  const [session, setSession] = useState(null);
  const [dbSession, setDbSession] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [sessionGames, setSessionGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [upNext, setUpNext] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(localStorage.getItem('myPlayerId') || '');
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [weeklyStandings, setWeeklyStandings] = useState({});
  const [bagForecast, setBagForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [testMode, setTestMode] = useState(false);

  const weekStart = getWeekStart();

  const fetchSessionData = useCallback(async () => {
    const now = new Date();
    const currentSession = testMode ? { type: 'morning', opensAt: 6*60, locksAt: 10*60, status: 'open' } : getCurrentSession(now);
    setSession(currentSession);

    if (!currentSession || currentSession.status === 'done') {
      setLoading(false);
      return;
    }

    const today = now.toISOString().split('T')[0];
    const { data: sessions } = await supabase
      .from('tournament_sessions')
      .select('*')
      .eq('session_date', today)
      .eq('session_type', currentSession.type)
      .limit(1);

    const existing = sessions?.[0];
    setDbSession(existing || null);

    if (existing) {
      const { data: ci } = await supabase
        .from('tournament_checkins')
        .select('*, players(*)')
        .eq('session_id', existing.id);
      setCheckins(ci || []);

      // Load session games
      const { data: sg } = await supabase
        .from('games')
        .select('*')
        .eq('tournament_session_id', existing.id)
        .order('played_at', { ascending: false });
      setSessionGames(sg || []);

      // Determine current game (most recent unfinished) and up next
      if (existing.status === 'locked' || existing.status === 'in_progress') {
        const playerIds = (ci || []).map(c => c.player_id);

        // Current game = team1/team2 on the session record
        if (existing.team1_p1) {
          setCurrentGame({
            team1: [existing.team1_p1, existing.team1_p2],
            team2: [existing.team2_p1, existing.team2_p2],
            aiPreview: existing.ai_preview,
          });
        }

        // Compute up next
        if (playerIds.length > 4 && sg) {
          const nextFour = pickNextGame(players, sg, playerIds, games, weekStart);
          if (nextFour) {
            const balanced = await balanceTeams(nextFour, games, weekStart, players);
            if (balanced) setUpNext(balanced);
          }
        }
      }
    } else {
      setCheckins([]);
      setSessionGames([]);
      setCurrentGame(null);
      setUpNext(null);
    }

    // Weekly standings
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const standings = {};
    players.forEach(p => { standings[p.id] = { wins: 0, losses: 0 }; });
    const weekTourneyGames = games.filter(g => g.is_tournament &&
      new Date(g.played_at) >= weekStart && new Date(g.played_at) <= weekEnd
    );
    weekTourneyGames.forEach(g => {
      const t1win = g.t1_score > g.t2_score;
      [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
        team.forEach(pid => {
          if (!standings[pid]) return;
          if (ti === 0 ? t1win : !t1win) standings[pid].wins++;
          else standings[pid].losses++;
        });
      });
    });
    setWeeklyStandings(standings);
    setLoading(false);
  }, [players, games, weekStart]);

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(() => {
      const now = new Date();
      const cur = getCurrentSession(now);
      setSession(cur);
      const minsLeft = cur ? minutesUntilLock(cur, now) : null;
      if (minsLeft !== null) setCountdown(formatCountdown(minsLeft));
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchSessionData]);

  useEffect(() => {
    if (!session) return;
    const minsLeft = minutesUntilLock(session, new Date());
    if (minsLeft !== null) setCountdown(formatCountdown(minsLeft));
  }, [session]);

  useEffect(() => {
    if (!dbSession) return;
    const sub = supabase.channel('checkins-' + dbSession.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_checkins', filter: `session_id=eq.${dbSession.id}` }, fetchSessionData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'games', filter: `tournament_session_id=eq.${dbSession.id}` }, fetchSessionData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [dbSession, fetchSessionData]);

  async function ensureSession() {
    if (dbSession) return dbSession;
    const now = new Date();
    const cur = getCurrentSession(now);
    if (!cur) return null;
    const locksAt = new Date(); locksAt.setHours(Math.floor(cur.locksAt / 60), cur.locksAt % 60, 0, 0);
    const opensAt = new Date(); opensAt.setHours(Math.floor(cur.opensAt / 60), cur.opensAt % 60, 0, 0);
    const { data, error } = await supabase.from('tournament_sessions').insert({
      session_type: cur.type,
      session_date: now.toISOString().split('T')[0],
      opens_at: opensAt.toISOString(),
      locks_at: locksAt.toISOString(),
      status: 'open',
    }).select().single();
    if (!error) { setDbSession(data); return data; }
    return null;
  }

  async function handleCheckin() {
    if (!myPlayerId) { toast('Select your player first'); return; }
    const s = await ensureSession();
    if (!s) return;
    const alreadyIn = checkins.find(c => c.player_id === myPlayerId);
    if (alreadyIn) {
      await supabase.from('tournament_checkins').delete().eq('id', alreadyIn.id);
      toast("You're out!");
    } else {
      await supabase.from('tournament_checkins').insert({ session_id: s.id, player_id: myPlayerId });
      toast("You're in! 🎯");
    }
    fetchSessionData();
  }

  async function lockSession() {
    if (!dbSession) return;
    if (checkins.length < 4) {
      toast('Not enough players — session will cancel in 5 minutes');
      setTimeout(async () => {
        const { data: fresh } = await supabase.from('tournament_checkins').select('*').eq('session_id', dbSession.id);
        if ((fresh || []).length < 4) {
          await supabase.from('tournament_sessions').update({ status: 'cancelled' }).eq('id', dbSession.id);
          await OneSignalManager.notifySessionCancelled(session?.type || 'current');
          toast('Session cancelled — not enough players');
          fetchSessionData();
        }
      }, 5 * 60 * 1000);
      return;
    }

    setLocking(true);
    const checkedInPlayers = checkins.map(c => c.players).filter(Boolean);
    const playerIds = checkedInPlayers.map(p => p.id);

    // Pick first 4 for the first game
    const firstFour = pickNextGame(checkedInPlayers, [], playerIds, games, weekStart);
    if (!firstFour) { setLocking(false); toast('Not enough players'); return; }

    const balanced = await balanceTeams(firstFour, games, weekStart, players);
    if (!balanced) { setLocking(false); toast('Could not balance teams'); return; }

    const playerMap = {};
    players.forEach(p => { playerMap[p.id] = p.name; });
    const t1 = balanced.team1;
    const t2 = balanced.team2;
    const t1names = `${playerMap[t1[0].id]} & ${playerMap[t1[1].id]}`;
    const t2names = `${playerMap[t2[0].id]} & ${playerMap[t2[1].id]}`;
    const aiPreview = await generateAIPreview(t1names, t2names, 0);

    await supabase.from('tournament_sessions').update({
      status: 'in_progress',
      team1_p1: t1[0].id, team1_p2: t1[1].id,
      team2_p1: t2[0].id, team2_p2: t2[1].id,
      bye_player: checkedInPlayers.length === 5 ? checkedInPlayers.find(p => !firstFour.find(f => f.id === p.id))?.id : null,
      ai_preview: aiPreview,
      current_queue: playerIds,
    }).eq('id', dbSession.id);

    await OneSignalManager.notifyTeamsAnnounced(t1names, t2names, aiPreview);
    setLocking(false);
    fetchSessionData();
  }

  // Called when a game is logged — advance to next matchup
  async function advanceToNextGame() {
    if (!dbSession) return;
    const playerIds = checkins.map(c => c.player_id);
    const { data: sg } = await supabase.from('games').select('*').eq('tournament_session_id', dbSession.id);
    const nextFour = pickNextGame(players, sg || [], playerIds, games, weekStart);

    if (!nextFour || nextFour.length < 4) {
      await supabase.from('tournament_sessions').update({ status: 'completed' }).eq('id', dbSession.id);
      toast('Session complete! Great games everyone 🎯');
      fetchSessionData();
      return;
    }

    const balanced = await balanceTeams(nextFour, games, weekStart, players);
    if (!balanced) return;

    const playerMap = {};
    players.forEach(p => { playerMap[p.id] = p.name; });
    const t1 = balanced.team1;
    const t2 = balanced.team2;
    const t1names = `${playerMap[t1[0].id]} & ${playerMap[t1[1].id]}`;
    const t2names = `${playerMap[t2[0].id]} & ${playerMap[t2[1].id]}`;
    const aiPreview = await generateAIPreview(t1names, t2names, 0);

    await supabase.from('tournament_sessions').update({
      team1_p1: t1[0].id, team1_p2: t1[1].id,
      team2_p1: t2[0].id, team2_p2: t2[1].id,
      ai_preview: aiPreview,
    }).eq('id', dbSession.id);

    await OneSignalManager.notifyTeamsAnnounced(t1names, t2names, aiPreview);
    toast(`Next up: ${t1names} vs ${t2names}`);
    fetchSessionData();
  }

  async function getBagForecast() {
    if (!currentGame) { toast('No active game yet'); return; }
    setForecastLoading(true);
    const playerMap = {};
    players.forEach(p => { playerMap[p.id] = p.name; });
    try {
      const t1names = `${playerMap[currentGame.team1[0]]} & ${playerMap[currentGame.team1[1]]}`;
      const t2names = `${playerMap[currentGame.team2[0]]} & ${playerMap[currentGame.team2[1]]}`;
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 120,
          temperature: 1.0,
          messages: [{
            role: 'user',
            content: `You're a ridiculous fake sports analyst predicting a cornhole game. Be completely absurd and funny. No emojis, no quotes. 2-3 sentences max.\n\nTeam 1: ${t1names}\nTeam 2: ${t2names}\n\nMake up silly fake statistics and ridiculous reasoning. Be different every time.`
          }]
        })
      });
      const data = await res.json();
      setBagForecast(data.content?.[0]?.text || 'The bags will fly. Some will land. One team will win.');
    } catch (e) {
      setBagForecast('The crystal ball is broken. Just go play.');
    }
    setForecastLoading(false);
  }

  const myCheckin = checkins.find(c => c.player_id === myPlayerId);
  const isLocked = dbSession?.status === 'locked' || dbSession?.status === 'in_progress' || dbSession?.status === 'completed';
  const isInProgress = dbSession?.status === 'in_progress';
  const getName = id => players.find(p => p.id === id)?.name || '?';
  const getIndex = id => players.findIndex(p => p.id === id);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text3)', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      {/* Player selector */}
      {!myPlayerId && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div className="card-title">Who are you?</div>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>Select your name to check into sessions.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {players.map((p, i) => (
              <button key={p.id} className="btn" onClick={() => { setMyPlayerId(p.id); localStorage.setItem('myPlayerId', p.id); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={p.name} index={i} size={20} />{p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {myPlayerId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Avatar name={players.find(p => p.id === myPlayerId)?.name} index={getIndex(myPlayerId)} size={24} />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Playing as <strong style={{ color: 'var(--text)' }}>{players.find(p => p.id === myPlayerId)?.name}</strong></span>
          <button className="btn btn-sm" onClick={() => { setMyPlayerId(''); localStorage.removeItem('myPlayerId'); }} style={{ marginLeft: 'auto' }}>Change</button>
        </div>
      )}

      {/* Test mode toggle */}
      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <button className="btn btn-sm" onClick={() => setTestMode(t => !t)} style={{ fontSize: 11, opacity: 0.5 }}>
          {testMode ? '🧪 Test mode ON' : '🧪 Test'}
        </button>
      </div>

      {!testMode && !isWeekday() ? (
        <div className="card"><div className="empty">No tournament today — see you Monday! 🎯</div></div>
      ) : !testMode && (!session || session.status === 'done') ? (
        <div className="card"><div className="empty">Both sessions done for today. Good hustle! 💪</div></div>
      ) : (
        <>
          {/* Session check-in card */}
          {!isLocked && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="card-title" style={{ marginBottom: 2 }}>
                    {session.type === 'morning' ? '☀️ Morning' : '🌆 Afternoon'} Session
                  </div>
                  {session.status === 'open' && countdown && (
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Locks in <strong style={{ color: 'var(--accent)' }}>{countdown}</strong>
                    </div>
                  )}
                </div>
                {session.status === 'open' && myPlayerId && (
                  <button className={`btn ${myCheckin ? '' : 'btn-primary'}`} onClick={handleCheckin}
                    style={myCheckin ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}>
                    {myCheckin ? "✓ I'm In — Check Out" : "I'm In 🎯"}
                  </button>
                )}
              </div>

              {checkins.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8 }}>Checked in ({checkins.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {checkins.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 99, fontSize: 13 }}>
                        <Avatar name={c.players?.name} index={getIndex(c.player_id)} size={18} />{c.players?.name}
                      </div>
                    ))}
                  </div>
                  {checkins.length >= 4 ? (
                    <button className="btn btn-primary" onClick={lockSession} disabled={locking} style={{ width: '100%' }}>
                      {locking ? 'Generating teams...' : '🔒 Lock & Start Session'}
                    </button>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Need {4 - checkins.length} more player{4 - checkins.length !== 1 ? 's' : ''} to start</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Current game card */}
          {isInProgress && currentGame && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="card-title" style={{ marginBottom: 0 }}>🎯 Now Playing</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Game {sessionGames.length + 1}</div>
              </div>

              {currentGame.aiPreview && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12, padding: '10px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
                  "{currentGame.aiPreview}"
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px', border: '1px solid rgba(232,197,71,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 }}>Team 1</div>
                  {currentGame.team1.map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{getName(id)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text3)', textAlign: 'center' }}>VS</div>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px', border: '1px solid rgba(76,175,130,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 }}>Team 2</div>
                  {currentGame.team2.map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{getName(id)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {dbSession?.bye_player && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                  👋 {getName(dbSession.bye_player)} has a bye this round
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={getBagForecast} disabled={forecastLoading} style={{ flex: 1 }}>
                  {forecastLoading ? 'Consulting oracle...' : '🔮 Bag Forecast'}
                </button>
                <button className="btn btn-primary" onClick={advanceToNextGame} style={{ flex: 1 }}>
                  Game done → Next ▶
                </button>
              </div>

              {bagForecast && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginTop: 10, padding: '10px', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
                  🔮 {bagForecast}
                </div>
              )}
            </div>
          )}

          {/* Up next preview */}
          {upNext && isInProgress && (
            <div className="card" style={{ opacity: 0.7 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 10 }}>⏭ Up Next</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {upNext.team1.map(p => <span key={p.id} style={{ fontWeight: 500 }}>{p.name}</span>).reduce((a, b) => [a, ' & ', b])}
                </div>
                <span style={{ color: 'var(--text3)' }}>vs</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {upNext.team2.map(p => <span key={p.id} style={{ fontWeight: 500 }}>{p.name}</span>).reduce((a, b) => [a, ' & ', b])}
                </div>
              </div>
            </div>
          )}

          {/* Session game log */}
          {sessionGames.length > 0 && (
            <div className="card">
              <div className="card-title">Session Results ({sessionGames.length} games)</div>
              {sessionGames.map((g, i) => {
                const t1win = g.t1_score > g.t2_score;
                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < sessionGames.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 20 }}>G{i + 1}</span>
                    <span style={{ flex: 1, fontWeight: t1win ? 600 : 400, color: t1win ? 'var(--text)' : 'var(--text2)' }}>{getName(g.t1_p1)} & {getName(g.t1_p2)}</span>
                    <span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`}>{g.t1_score}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>–</span>
                    <span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`}>{g.t2_score}</span>
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: !t1win ? 600 : 400, color: !t1win ? 'var(--text)' : 'var(--text2)' }}>{getName(g.t2_p1)} & {getName(g.t2_p2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Weekly standings */}
      {Object.keys(weeklyStandings).some(id => weeklyStandings[id].wins + weeklyStandings[id].losses > 0) && (
        <div className="card">
          <div className="card-title">This Week's Tournament</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Player','W','L','Win%'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {players
                .filter(p => weeklyStandings[p.id]?.wins + weeklyStandings[p.id]?.losses > 0)
                .sort((a, b) => {
                  const sa = weeklyStandings[a.id]; const sb = weeklyStandings[b.id];
                  return (sb.wins / (sb.wins + sb.losses || 1)) - (sa.wins / (sa.wins + sa.losses || 1));
                })
                .map(p => {
                  const s = weeklyStandings[p.id];
                  const pct = Math.round(s.wins / (s.wins + s.losses) * 100);
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={p.name} index={players.indexOf(p)} size={22} />{p.name}
                        </div>
                      </td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ background: 'rgba(76,175,130,0.15)', color: 'var(--green)', padding: '2px 7px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{s.wins}</span>
                      </td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ background: 'rgba(224,92,92,0.12)', color: 'var(--red)', padding: '2px 7px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{s.losses}</span>
                      </td>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>{pct}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
