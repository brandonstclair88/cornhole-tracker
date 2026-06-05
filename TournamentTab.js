import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { OneSignalManager } from './OneSignalManager';
import {
  getCurrentSession, minutesUntilLock, formatCountdown,
  getWeekStart, generateTeams, isWeekday
} from './tournament';

function Avatar({ name, index, size = 28 }) {
  const COLORS = [
    { bg: '#2a2318', fg: '#e8c547' }, { bg: '#1a2820', fg: '#4caf82' },
    { bg: '#251818', fg: '#e05c5c' }, { bg: '#1a2030', fg: '#6ba3e0' },
    { bg: '#221a28', fg: '#b07ee0' }, { bg: '#1f2018', fg: '#8ec44a' },
  ];
  const c = COLORS[(index || 0) % COLORS.length];
  const initials = (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: size * 0.38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
      {initials}
    </div>
  );
}

async function generateAIPreview(team1, team2, playerMap, games) {
  try {
    const t1names = `${playerMap[team1[0]?.id] || '?'} & ${playerMap[team1[1]?.id] || '?'}`;
    const t2names = `${playerMap[team2[0]?.id] || '?'} & ${playerMap[team2[1]?.id] || '?'}`;

    // Get head to head history
    const h2h = games.filter(g => {
      const all = [g.t1_p1, g.t1_p2, g.t2_p1, g.t2_p2];
      return team1.concat(team2).every(p => all.includes(p?.id));
    });

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
          content: `You're a hype announcer for a work cornhole tournament. Write a short (1-2 sentence) pre-game trash talk announcement for this matchup. Use their names. Be funny and savage. No quotes, no emojis.

Team 1: ${t1names}
Team 2: ${t2names}
Previous matchups between these players: ${h2h.length}

Be unpredictable and creative. Different style every time.`
        }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || `${t1names} vs ${t2names} — let's go!`;
  } catch (e) {
    return null;
  }
}

export default function Tournament({ players, games, toast }) {
  const [session, setSession] = useState(null);
  const [dbSession, setDbSession] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [myPlayerId, setMyPlayerId] = useState(localStorage.getItem('myPlayerId') || '');
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [weeklyStandings, setWeeklyStandings] = useState([]);
  const [archivedWeeks, setArchivedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [bagForecast, setBagForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [countdown, setCountdown] = useState('');

  const weekStart = getWeekStart();

  const fetchSessionData = useCallback(async () => {
    const now = new Date();
    const currentSession = getCurrentSession(now);
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
    } else {
      setCheckins([]);
    }

    // Weekly standings
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const { data: weekSessions } = await supabase
      .from('tournament_sessions')
      .select('*')
      .gte('session_date', weekStart.toISOString().split('T')[0])
      .lte('session_date', weekEnd.toISOString().split('T')[0])
      .eq('status', 'completed');

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
    const now = new Date();
    const minsLeft = minutesUntilLock(session, now);
    if (minsLeft !== null) setCountdown(formatCountdown(minsLeft));
  }, [session]);

  // Realtime for checkins
  useEffect(() => {
    if (!dbSession) return;
    const sub = supabase.channel('checkins-' + dbSession.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_checkins', filter: `session_id=eq.${dbSession.id}` }, fetchSessionData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [dbSession, fetchSessionData]);

  async function ensureSession() {
    if (dbSession) return dbSession;
    const now = new Date();
    const cur = getCurrentSession(now);
    if (!cur) return null;

    const locksAt = new Date();
    locksAt.setHours(Math.floor(cur.locksAt / 60), cur.locksAt % 60, 0, 0);
    const opensAt = new Date();
    opensAt.setHours(Math.floor(cur.opensAt / 60), cur.opensAt % 60, 0, 0);

    const { data, error } = await supabase.from('tournament_sessions').insert({
      session_type: cur.type,
      session_date: now.toISOString().split('T')[0],
      opens_at: opensAt.toISOString(),
      locks_at: locksAt.toISOString(),
      status: 'open',
    }).select().single();

    if (!error) {
      setDbSession(data);
      return data;
    }
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
      // Start 5 min cancel timer
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
    const result = await generateTeams(checkedInPlayers, players, games, weekStart);

    if (!result) { setLocking(false); toast('Not enough players to generate teams'); return; }

    const playerMap = {};
    players.forEach(p => { playerMap[p.id] = p.name; });

    const t1 = result.team1;
    const t2 = result.team2;
    const t1names = `${playerMap[t1[0]?.id]} & ${playerMap[t1[1]?.id]}`;
    const t2names = `${playerMap[t2[0]?.id]} & ${playerMap[t2[1]?.id]}`;

    const aiPreview = await generateAIPreview(t1, t2, playerMap, games);

    await supabase.from('tournament_sessions').update({
      status: 'locked',
      team1_p1: t1[0]?.id, team1_p2: t1[1]?.id,
      team2_p1: t2[0]?.id, team2_p2: t2[1]?.id,
      bye_player: result.byePlayer?.id || null,
      ai_preview: aiPreview,
    }).eq('id', dbSession.id);

    await OneSignalManager.notifyTeamsAnnounced(t1names, t2names, aiPreview);
    setLocking(false);
    fetchSessionData();
  }

  async function getBagForecast() {
    if (!dbSession?.team1_p1) { toast('Teams not set yet'); return; }
    setForecastLoading(true);
    const playerMap = {};
    players.forEach(p => { playerMap[p.id] = p.name; });

    try {
      const t1names = `${playerMap[dbSession.team1_p1]} & ${playerMap[dbSession.team1_p2]}`;
      const t2names = `${playerMap[dbSession.team2_p1]} & ${playerMap[dbSession.team2_p2]}`;

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
            content: `You're a ridiculous fake sports analyst predicting a cornhole game outcome. Be completely absurd and funny. No emojis, no quotes. 2-3 sentences max.

Team 1: ${t1names}
Team 2: ${t2names}

Make up a completely silly prediction with fake statistics, ridiculous analysis, or absurd reasoning. Be different every time.`
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
  const isLocked = dbSession?.status === 'locked' || dbSession?.status === 'completed';
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
              <button key={p.id} className="btn" onClick={() => {
                setMyPlayerId(p.id);
                localStorage.setItem('myPlayerId', p.id);
              }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={p.name} index={i} size={20} />
                {p.name}
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

      {/* Session card */}
      {!isWeekday() ? (
        <div className="card"><div className="empty">No tournament today — see you Monday! 🎯</div></div>
      ) : !session || session.status === 'done' ? (
        <div className="card"><div className="empty">Both sessions done for today. Good hustle! 💪</div></div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div className="card-title" style={{ marginBottom: 2 }}>
                {session.type === 'morning' ? '☀️ Morning' : '🌆 Afternoon'} Session
              </div>
              {session.status === 'open' && (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Locks in <strong style={{ color: countdown <= '15m' ? 'var(--red)' : 'var(--accent)' }}>{countdown}</strong>
                </div>
              )}
              {session.status === 'upcoming' && (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Opens in {formatCountdown(session.minutesUntilOpen)}</div>
              )}
            </div>
            {session.status === 'open' && !isLocked && myPlayerId && (
              <button
                className={`btn ${myCheckin ? '' : 'btn-primary'}`}
                onClick={handleCheckin}
                style={myCheckin ? { borderColor: 'var(--green)', color: 'var(--green)' } : {}}
              >
                {myCheckin ? "✓ I'm In — Check Out" : "I'm In 🎯"}
              </button>
            )}
          </div>

          {/* Checked in players */}
          {checkins.length > 0 && !isLocked && (
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8 }}>
                Checked in ({checkins.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {checkins.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 99, fontSize: 13 }}>
                    <Avatar name={c.players?.name} index={getIndex(c.player_id)} size={18} />
                    {c.players?.name}
                  </div>
                ))}
              </div>
              {checkins.length >= 4 && (
                <button className="btn btn-primary" onClick={lockSession} disabled={locking} style={{ marginTop: 12, width: '100%' }}>
                  {locking ? 'Generating teams...' : '🔒 Lock & Generate Teams'}
                </button>
              )}
              {checkins.length < 4 && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Need {4 - checkins.length} more player{4 - checkins.length !== 1 ? 's' : ''} to play</div>
              )}
            </div>
          )}

          {/* Teams announced */}
          {isLocked && dbSession && (
            <div>
              {dbSession.ai_preview && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12, padding: '10px', background: 'var(--surface2)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--accent)' }}>
                  "{dbSession.ai_preview}"
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px', border: '1px solid rgba(232,197,71,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 8 }}>Team 1</div>
                  {[dbSession.team1_p1, dbSession.team1_p2].map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{getName(id)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text3)', textAlign: 'center' }}>VS</div>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px', border: '1px solid rgba(76,175,130,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 }}>Team 2</div>
                  {[dbSession.team2_p1, dbSession.team2_p2].map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{getName(id)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {dbSession.bye_player && (
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                  👋 {getName(dbSession.bye_player)} has a bye — guaranteed spot next session
                </div>
              )}
              <button className="btn" onClick={getBagForecast} disabled={forecastLoading} style={{ width: '100%' }}>
                {forecastLoading ? 'Consulting the oracle...' : '🔮 Bag Forecast'}
              </button>
              {bagForecast && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginTop: 10, padding: '10px', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
                  🔮 {bagForecast}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Weekly standings */}
      {Object.keys(weeklyStandings).some(id => weeklyStandings[id].wins + weeklyStandings[id].losses > 0) && (
        <div className="card">
          <div className="card-title">This Week's Tournament</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>Player</th>
                <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>W</th>
                <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>L</th>
                <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>Win%</th>
              </tr>
            </thead>
            <tbody>
              {players
                .filter(p => weeklyStandings[p.id]?.wins + weeklyStandings[p.id]?.losses > 0)
                .sort((a, b) => {
                  const sa = weeklyStandings[a.id]; const sb = weeklyStandings[b.id];
                  const wa = sa.wins / (sa.wins + sa.losses || 1);
                  const wb = sb.wins / (sb.wins + sb.losses || 1);
                  return wb - wa;
                })
                .map((p, i) => {
                  const s = weeklyStandings[p.id];
                  const pct = Math.round(s.wins / (s.wins + s.losses) * 100);
                  return (
                    <tr key={p.id}>
                      <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={p.name} index={players.indexOf(p)} size={22} />
                          {p.name}
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
