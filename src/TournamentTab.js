import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

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

function isWeekday() {
  const d = new Date().getDay();
  return d >= 1 && d <= 4;
}

function getSessionWindow() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const total = h * 60 + m;
  if (total >= 390 && total < 600) return { type: 'morning', locksAt: '10:00 AM', minutesLeft: 600 - total };
  if (total >= 615 && total < 900) return { type: 'afternoon', locksAt: '3:00 PM', minutesLeft: 900 - total };
  return null;
}

function winPct(stats, id) {
  const s = stats[id] || { wins: 0, losses: 0 };
  const t = s.wins + s.losses;
  return t > 0 ? s.wins / t : 0;
}

function buildStats(players, games) {
  const stats = {};
  players.forEach(p => { stats[p.id] = { wins: 0, losses: 0 }; });
  games.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (ti === 0 ? t1win : !t1win) stats[pid].wins++;
        else stats[pid].losses++;
      });
    });
  });
  return stats;
}

function pickTeams(checkedIn, allPlayers, allGames, sessionGames) {
  const stats = buildStats(allPlayers, allGames);

  // Count how many session games each player has played
  const sessionCount = {};
  checkedIn.forEach(p => { sessionCount[p.id] = 0; });
  sessionGames.forEach(g => {
    [g.t1_p1, g.t1_p2, g.t2_p1, g.t2_p2].forEach(id => {
      if (sessionCount[id] !== undefined) sessionCount[id]++;
    });
  });

  // Pick 4 players with fewest session games
  const pool = [...checkedIn].sort((a, b) => {
    const diff = sessionCount[a.id] - sessionCount[b.id];
    if (diff !== 0) return diff;
    return winPct(stats, b.id) - winPct(stats, a.id);
  }).slice(0, 4);

  if (pool.length < 4) return null;

  // Sort by skill, top 2 split
  const sorted = [...pool].sort((a, b) => winPct(stats, b.id) - winPct(stats, a.id));
  const combos = [
    [[sorted[0], sorted[2]], [sorted[1], sorted[3]]],
    [[sorted[0], sorted[3]], [sorted[1], sorted[2]]],
  ];

  let best = combos[0];
  let bestDiff = Infinity;
  combos.forEach(([t1, t2]) => {
    const d = Math.abs((winPct(stats, t1[0].id) + winPct(stats, t1[1].id)) - (winPct(stats, t2[0].id) + winPct(stats, t2[1].id)));
    if (d < bestDiff) { bestDiff = d; best = [t1, t2]; }
  });

  return { team1: best[0], team2: best[1] };
}

async function getAIPreview(t1names, t2names) {
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
        max_tokens: 80,
        temperature: 1.0,
        messages: [{ role: 'user', content: `1-2 sentence trash talk hype for a cornhole matchup. No quotes, no emojis. Teams: ${t1names} vs ${t2names}. Be savage and funny.` }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

export default function TournamentTab({ players, games, toast }) {
  const [myPlayerId, setMyPlayerId] = useState(localStorage.getItem('myPlayerId') || '');
  const [checkins, setCheckins] = useState([]);
  const [dbSession, setDbSession] = useState(null);
  const [sessionGames, setSessionGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [bagForecast, setBagForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [weeklyStandings, setWeeklyStandings] = useState({});
  const initialized = useRef(false);

  const getName = id => players.find(p => p.id === id)?.name || '?';
  const getIndex = id => players.findIndex(p => p.id === id);
  const today = new Date().toISOString().split('T')[0];
  const sessionWindow = getSessionWindow();
  const sessionType = testMode ? 'morning' : sessionWindow?.type;
  const showSession = testMode || (isWeekday() && sessionWindow);

  async function loadData() {
    if (!sessionType) { setLoading(false); return; }

    const { data: sessions } = await supabase
      .from('tournament_sessions')
      .select('*')
      .eq('session_date', today)
      .eq('session_type', sessionType)
      .limit(1);

    const s = sessions?.[0] || null;
    setDbSession(s);

    if (s) {
      const { data: ci } = await supabase
        .from('tournament_checkins')
        .select('*, players(*)')
        .eq('session_id', s.id);
      setCheckins(ci || []);

      const { data: sg } = await supabase
        .from('games')
        .select('*')
        .eq('tournament_session_id', s.id)
        .order('played_at');
      setSessionGames(sg || []);
    } else {
      setCheckins([]);
      setSessionGames([]);
    }

    // Weekly standings
    const weekStart = new Date();
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
    weekStart.setHours(0, 0, 0, 0);
    const standings = {};
    players.forEach(p => { standings[p.id] = { wins: 0, losses: 0 }; });
    games.filter(g => g.is_tournament && new Date(g.played_at) >= weekStart).forEach(g => {
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
  }

  useEffect(() => {
    loadData();
  }, [testMode, players.length]);

  // Realtime
  useEffect(() => {
    if (!dbSession) return;
    const sub = supabase.channel('t-session-' + dbSession.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_checkins' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_sessions' }, loadData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [dbSession?.id]);

  async function ensureSession() {
    if (dbSession) return dbSession;
    const type = testMode ? 'morning' : sessionWindow?.type;
    if (!type) return null;
    const { data, error } = await supabase.from('tournament_sessions').insert({
      session_type: type,
      session_date: today,
      opens_at: new Date().toISOString(),
      locks_at: new Date().toISOString(),
      status: 'open',
    }).select().single();
    if (error) { console.error(error); return null; }
    setDbSession(data);
    return data;
  }

  async function handleCheckin() {
    if (!myPlayerId) { toast('Select your player first'); return; }
    const s = await ensureSession();
    if (!s) { toast('No active session'); return; }
    const alreadyIn = checkins.find(c => c.player_id === myPlayerId);
    if (alreadyIn) {
      await supabase.from('tournament_checkins').delete().eq('id', alreadyIn.id);
      toast("You're out!");
    } else {
      await supabase.from('tournament_checkins').insert({ session_id: s.id, player_id: myPlayerId });
      toast("You're in! 🎯");
    }
    loadData();
  }

  async function lockSession() {
    if (!dbSession) return;
    const checkedInPlayers = checkins.map(c => c.players).filter(Boolean);
    if (checkedInPlayers.length < 4) { toast('Need at least 4 players'); return; }
    setLocking(true);

    const result = pickTeams(checkedInPlayers, players, games, sessionGames);
    if (!result) { setLocking(false); toast('Could not generate teams'); return; }

    const { team1, team2 } = result;
    const t1names = `${team1[0].name} & ${team1[1].name}`;
    const t2names = `${team2[0].name} & ${team2[1].name}`;
    const aiPreview = await getAIPreview(t1names, t2names);

    await supabase.from('tournament_sessions').update({
      status: 'in_progress',
      team1_p1: team1[0].id, team1_p2: team1[1].id,
      team2_p1: team2[0].id, team2_p2: team2[1].id,
      ai_preview: aiPreview,
    }).eq('id', dbSession.id);

    setLocking(false);
    loadData();
  }

  async function nextGame() {
    if (!dbSession) return;
    const checkedInPlayers = checkins.map(c => c.players).filter(Boolean);
    const { data: sg } = await supabase.from('games').select('*').eq('tournament_session_id', dbSession.id);
    const result = pickTeams(checkedInPlayers, players, games, sg || []);

    if (!result) {
      await supabase.from('tournament_sessions').update({ status: 'completed' }).eq('id', dbSession.id);
      toast('Session complete! 🎯');
      loadData();
      return;
    }

    const { team1, team2 } = result;
    const t1names = `${team1[0].name} & ${team1[1].name}`;
    const t2names = `${team2[0].name} & ${team2[1].name}`;
    const aiPreview = await getAIPreview(t1names, t2names);

    await supabase.from('tournament_sessions').update({
      team1_p1: team1[0].id, team1_p2: team1[1].id,
      team2_p1: team2[0].id, team2_p2: team2[1].id,
      ai_preview: aiPreview,
    }).eq('id', dbSession.id);

    toast(`Next: ${t1names} vs ${t2names}`);
    loadData();
  }

  async function getBagForecast() {
    if (!dbSession?.team1_p1) return;
    setForecastLoading(true);
    const t1 = `${getName(dbSession.team1_p1)} & ${getName(dbSession.team1_p2)}`;
    const t2 = `${getName(dbSession.team2_p1)} & ${getName(dbSession.team2_p2)}`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 100, temperature: 1.0, messages: [{ role: 'user', content: `Ridiculous fake cornhole prediction, 2 sentences, no emojis, no quotes. Teams: ${t1} vs ${t2}. Absurd fake stats.` }] })
      });
      const data = await res.json();
      setBagForecast(data.content?.[0]?.text || 'The bags will fly. One team will win.');
    } catch { setBagForecast('The oracle is offline. Just play.'); }
    setForecastLoading(false);
  }

  const myCheckin = checkins.find(c => c.player_id === myPlayerId);
  const isInProgress = dbSession?.status === 'in_progress';
  const isOpen = !dbSession || dbSession?.status === 'open';

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>;

  return (
    <div>
      {/* Test mode */}
      <div style={{ textAlign: 'right', marginBottom: 8 }}>
        <button className="btn btn-sm" onClick={() => { setTestMode(t => !t); setLoading(true); }} style={{ fontSize: 11, opacity: 0.5 }}>
          {testMode ? '🧪 Test ON' : '🧪 Test'}
        </button>
      </div>

      {/* Who are you */}
      {!myPlayerId && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div className="card-title">Who are you?</div>
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
          <Avatar name={getName(myPlayerId)} index={getIndex(myPlayerId)} size={24} />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Playing as <strong style={{ color: 'var(--text)' }}>{getName(myPlayerId)}</strong></span>
          <button className="btn btn-sm" onClick={() => { setMyPlayerId(''); localStorage.removeItem('myPlayerId'); }} style={{ marginLeft: 'auto' }}>Change</button>
        </div>
      )}

      {!showSession ? (
        <div className="card">
          <div className="empty">
            {!isWeekday() ? 'No tournament today — see you Monday! 🎯' : 'No active session right now. Check back at 6am or 10:15am.'}
          </div>
        </div>
      ) : (
        <>
          {/* Check-in card */}
          {isOpen && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="card-title" style={{ marginBottom: 2 }}>
                    {sessionType === 'morning' ? '☀️ Morning' : '🌆 Afternoon'} Session
                    {testMode && <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>(test)</span>}
                  </div>
                  {sessionWindow && <div style={{ fontSize: 12, color: 'var(--text3)' }}>Locks at {sessionWindow.locksAt}</div>}
                </div>
                {myPlayerId && (
                  <button className={`btn ${myCheckin ? '' : 'btn-primary'}`} onClick={handleCheckin}
                    style={myCheckin ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}>
                    {myCheckin ? "✓ In — Check Out" : "I'm In 🎯"}
                  </button>
                )}
              </div>

              {checkins.length > 0 && (
                <>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8 }}>
                    Checked in ({checkins.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {checkins.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 99, fontSize: 13 }}>
                        <Avatar name={c.players?.name} index={getIndex(c.player_id)} size={18} />
                        {c.players?.name}
                      </div>
                    ))}
                  </div>
                  {checkins.length >= 4 ? (
                    <button className="btn btn-primary" onClick={lockSession} disabled={locking} style={{ width: '100%' }}>
                      {locking ? 'Generating...' : '🔒 Lock & Start'}
                    </button>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>Need {4 - checkins.length} more player{4 - checkins.length !== 1 ? 's' : ''}</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Current game */}
          {isInProgress && dbSession?.team1_p1 && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="card-title" style={{ marginBottom: 0 }}>🎯 Now Playing</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>Game {sessionGames.length + 1}</div>
              </div>

              {dbSession.ai_preview && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12, padding: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
                  "{dbSession.ai_preview}"
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid rgba(232,197,71,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 }}>Team 1</div>
                  {[dbSession.team1_p1, dbSession.team1_p2].map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{getName(id)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text3)', textAlign: 'center' }}>VS</div>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid rgba(76,175,130,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 }}>Team 2</div>
                  {[dbSession.team2_p1, dbSession.team2_p2].map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{getName(id)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={getBagForecast} disabled={forecastLoading} style={{ flex: 1 }}>
                  {forecastLoading ? 'Consulting...' : '🔮 Forecast'}
                </button>
                <button className="btn btn-primary" onClick={nextGame} style={{ flex: 1 }}>
                  Game Done → Next ▶
                </button>
              </div>

              {bagForecast && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginTop: 10, padding: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
                  🔮 {bagForecast}
                </div>
              )}
            </div>
          )}

          {/* Session game log */}
          {sessionGames.length > 0 && (
            <div className="card">
              <div className="card-title">Session Results</div>
              {sessionGames.map((g, i) => {
                const t1win = g.t1_score > g.t2_score;
                return (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < sessionGames.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13 }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 24 }}>G{i + 1}</span>
                    <span style={{ flex: 1, fontWeight: t1win ? 600 : 400 }}>{getName(g.t1_p1)} & {getName(g.t1_p2)}</span>
                    <span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`}>{g.t1_score}</span>
                    <span style={{ color: 'var(--text3)' }}>–</span>
                    <span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`}>{g.t2_score}</span>
                    <span style={{ flex: 1, textAlign: 'right', fontWeight: !t1win ? 600 : 400 }}>{getName(g.t2_p1)} & {getName(g.t2_p2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Weekly tournament standings */}
      {Object.keys(weeklyStandings).some(id => weeklyStandings[id].wins + weeklyStandings[id].losses > 0) && (
        <div className="card">
          <div className="card-title">This Week's Tournament</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>{['Player', 'W', 'L', 'Win%'].map(h => (
                <th key={h} style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {players
                .filter(p => weeklyStandings[p.id]?.wins + weeklyStandings[p.id]?.losses > 0)
                .sort((a, b) => {
                  const sa = weeklyStandings[a.id], sb = weeklyStandings[b.id];
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
