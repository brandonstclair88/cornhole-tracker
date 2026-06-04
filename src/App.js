import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { supabase } from './supabase';

const AVATAR_COLORS = [
  { bg: '#2a2318', fg: '#e8c547' },
  { bg: '#1a2820', fg: '#4caf82' },
  { bg: '#251818', fg: '#e05c5c' },
  { bg: '#1a2030', fg: '#6ba3e0' },
  { bg: '#221a28', fg: '#b07ee0' },
  { bg: '#1f2018', fg: '#8ec44a' },
];

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, index, size = 28 }) {
  const c = AVATAR_COLORS[(index || 0) % AVATAR_COLORS.length];
  return (
    <div className="avatar" style={{ width: size, height: size, minWidth: size, background: c.bg, color: c.fg, fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  );
}

function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`}>{message}</div>;
}

function Loading() {
  return <div className="loading"><div className="spinner" />Loading...</div>;
}

// ---- SETUP SCREEN (no env vars configured yet) ----
function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-logo">🎯 CORNHOLE</div>
      <div className="setup-sub">Work Break Tracker</div>
      <div className="setup-card">
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: '1rem', lineHeight: 1.6 }}>
          To use this app, you need a free Supabase database. Follow the README instructions to set it up — it takes about 5 minutes.
        </p>
        <p className="setup-hint">
          See <strong style={{color:'var(--text)'}}>README.md</strong> in this project for full setup instructions.
        </p>
      </div>
    </div>
  );
}

// ---- LEADERBOARD ----
function Leaderboard({ players, games }) {
  const stats = buildStats(players, games);
  const sorted = [...players].sort((a, b) => {
    const wa = stats[a.id] ? stats[a.id].wins / (stats[a.id].wins + stats[a.id].losses || 1) : 0;
    const wb = stats[b.id] ? stats[b.id].wins / (stats[b.id].wins + stats[b.id].losses || 1) : 0;
    if (wb !== wa) return wb - wa;
    return (stats[b.id]?.wins || 0) - (stats[a.id]?.wins || 0);
  });

  const totalGames = games.length;
  const totalPts = games.reduce((s, g) => s + g.t1_score + g.t2_score, 0);
  const totalHole = games.reduce((s, g) => s + g.t1_hole + g.t2_hole, 0);

  const recent = [...games].sort((a, b) => new Date(b.played_at) - new Date(a.played_at)).slice(0, 6);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-box"><div className="stat-box-label">Games</div><div className="stat-box-val">{totalGames}</div></div>
        <div className="stat-box"><div className="stat-box-label">Players</div><div className="stat-box-val">{players.length}</div></div>
        <div className="stat-box"><div className="stat-box-label">Total pts</div><div className="stat-box-val">{totalPts}</div></div>
        <div className="stat-box"><div className="stat-box-label">In hole</div><div className="stat-box-val">{totalHole}</div></div>
      </div>

      <div className="card">
        <div className="card-title">Standings</div>
        {players.length === 0 ? (
          <div className="empty">No players yet — add some in the Players tab.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Player</th><th>W</th><th>L</th><th>Win%</th><th>Pts</th><th>🕳</th><th>Board</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const s = stats[p.id] || { wins: 0, losses: 0, pts: 0, hole: 0, board: 0 };
                  const total = s.wins + s.losses;
                  const pct = total ? Math.round(s.wins / total * 100) : 0;
                  return (
                    <tr key={p.id}>
                      <td><span className={`rank-num${i === 0 && total > 0 ? ' gold' : ''}`}>{i === 0 && total > 0 ? '1' : i + 1}</span></td>
                      <td>
                        <div className="player-row">
                          <Avatar name={p.name} index={players.indexOf(p)} />
                          <span style={{ fontWeight: 500 }}>{p.name}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-win">{s.wins}</span></td>
                      <td><span className="badge badge-loss">{s.losses}</span></td>
                      <td style={{ color: 'var(--text2)' }}>{pct}%</td>
                      <td style={{ color: 'var(--text2)' }}>{s.pts}</td>
                      <td style={{ color: 'var(--text2)' }}>{s.hole}</td>
                      <td style={{ color: 'var(--text2)' }}>{s.board}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="card">
          <div className="card-title">Recent Games</div>
          {recent.map(g => {
            const t1win = g.t1_score > g.t2_score;
            const t1p1 = players.find(p => p.id === g.t1_p1)?.name || '?';
            const t1p2 = players.find(p => p.id === g.t1_p2)?.name || '?';
            const t2p1 = players.find(p => p.id === g.t2_p1)?.name || '?';
            const t2p2 = players.find(p => p.id === g.t2_p2)?.name || '?';
            return (
              <div key={g.id} className="game-row">
                <div className={`game-team${t1win ? ' winner' : ''}`}>{t1p1} & {t1p2}</div>
                <div className="game-score-block">
                  <span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`}>{g.t1_score}</span>
                  <span style={{ color: 'var(--text3)', fontSize: 11 }}>–</span>
                  <span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`}>{g.t2_score}</span>
                </div>
                <div className={`game-team${!t1win ? ' winner' : ''}`} style={{ textAlign: 'right' }}>{t2p1} & {t2p2}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- LOG GAME ----
function LogGame({ players, onGameLogged, toast }) {
  const [t1p1, setT1p1] = useState('');
  const [t1p2, setT1p2] = useState('');
  const [t2p1, setT2p1] = useState('');
  const [t2p2, setT2p2] = useState('');
  const [t1score, setT1score] = useState('21');
  const [t2score, setT2score] = useState('0');
  const [t1hole, setT1hole] = useState('0');
  const [t2hole, setT2hole] = useState('0');
  const [t1board, setT1board] = useState('0');
  const [t2board, setT2board] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (players.length >= 4) {
      setT1p1(players[0].id);
      setT1p2(players[1].id);
      setT2p1(players[2].id);
      setT2p2(players[3].id);
    } else if (players.length >= 2) {
      setT1p1(players[0].id);
      setT1p2(players[1].id);
    }
  }, [players]);

  const playerOptions = players.map(p => <option key={p.id} value={p.id}>{p.name}</option>);

  async function handleSubmit() {
    setError('');
    const selected = [t1p1, t1p2, t2p1, t2p2];
    if (selected.some(v => !v)) { setError('Please select all 4 players.'); return; }
    if (new Set(selected).size < 4) { setError('Each player must be unique across both teams.'); return; }

    setSaving(true);
    const { error: err } = await supabase.from('games').insert({
      t1_p1: t1p1, t1_p2: t1p2,
      t2_p1: t2p1, t2_p2: t2p2,
      t1_score: parseInt(t1score) || 0,
      t2_score: parseInt(t2score) || 0,
      t1_hole: parseInt(t1hole) || 0,
      t2_hole: parseInt(t2hole) || 0,
      t1_board: parseInt(t1board) || 0,
      t2_board: parseInt(t2board) || 0,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast('Game logged! 🎯');
    onGameLogged();
    setT1score('21'); setT2score('0');
    setT1hole('0'); setT2hole('0');
    setT1board('0'); setT2board('0');
  }

  if (players.length < 4) {
    return (
      <div className="card">
        <div className="empty">You need at least 4 players to log a 2v2 game.<br />Add more players in the Players tab.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-title">Log a Game</div>
      {error && <div className="error-banner">{error}</div>}

      <div className="team-grid">
        <div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label>Team 1 — Player A</label>
            <select value={t1p1} onChange={e => setT1p1(e.target.value)}>{playerOptions}</select>
          </div>
          <div className="form-group">
            <label>Player B</label>
            <select value={t1p2} onChange={e => setT1p2(e.target.value)}>{playerOptions}</select>
          </div>
        </div>
        <div className="vs-label">VS</div>
        <div>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <label>Team 2 — Player A</label>
            <select value={t2p1} onChange={e => setT2p1(e.target.value)}>{playerOptions}</select>
          </div>
          <div className="form-group">
            <label>Player B</label>
            <select value={t2p2} onChange={e => setT2p2(e.target.value)}>{playerOptions}</select>
          </div>
        </div>
      </div>

      <hr className="divider" />
      <div style={{ marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500 }}>Scores</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: '1rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 'unset' }}>
          <label>Team 1</label>
          <input type="number" className="score-input" min="0" max="21" value={t1score} onChange={e => setT1score(e.target.value)} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text3)', paddingBottom: 6 }}>–</div>
        <div className="form-group" style={{ flex: 'unset' }}>
          <label>Team 2</label>
          <input type="number" className="score-input" min="0" max="21" value={t2score} onChange={e => setT2score(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500 }}>Bag stats</div>
      <div className="score-inputs">
        <div className="form-group"><label>T1 in hole</label><input type="number" min="0" value={t1hole} onChange={e => setT1hole(e.target.value)} /></div>
        <div className="form-group"><label>T1 on board</label><input type="number" min="0" value={t1board} onChange={e => setT1board(e.target.value)} /></div>
        <div className="form-group"><label>T2 in hole</label><input type="number" min="0" value={t2hole} onChange={e => setT2hole(e.target.value)} /></div>
        <div className="form-group"><label>T2 on board</label><input type="number" min="0" value={t2board} onChange={e => setT2board(e.target.value)} /></div>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ marginTop: 8 }}>
        {saving ? 'Saving...' : 'Log Game →'}
      </button>
    </div>
  );
}

// ---- PLAYERS ----
function Players({ players, onRefresh, toast }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function addPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A player with that name already exists.'); return;
    }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('players').insert({ name: trimmed });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setName('');
    toast(`${trimmed} added!`);
    onRefresh();
  }

  async function removePlayer(id, playerName) {
    if (!window.confirm(`Remove ${playerName}? Their game history will be kept.`)) return;
    await supabase.from('players').delete().eq('id', id);
    toast('Player removed.');
    onRefresh();
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Add Player</div>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text" placeholder="e.g. Jordan"
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addPlayer()}
            />
          </div>
          <button className="btn btn-primary" onClick={addPlayer} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? '...' : 'Add'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Roster ({players.length})</div>
        {players.length === 0 ? (
          <div className="empty">No players yet.</div>
        ) : (
          players.map((p, i) => (
            <div key={p.id} className="player-chip">
              <Avatar name={p.name} index={i} size={32} />
              <span className="player-chip-name">{p.name}</span>
              <button className="btn btn-sm btn-danger" onClick={() => removePlayer(p.id, p.name)}>Remove</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---- HEAD TO HEAD ----
function HeadToHead({ players, games }) {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (players.length >= 2) {
      setP1(players[0].id);
      setP2(players[1].id);
    }
  }, [players]);

  function compute() {
    if (!p1 || !p2 || p1 === p2) return;
    const shared = games.filter(g => {
      const t1 = [g.t1_p1, g.t1_p2];
      const t2 = [g.t2_p1, g.t2_p2];
      return (t1.includes(p1) && t2.includes(p2)) || (t1.includes(p2) && t2.includes(p1));
    });
    let p1wins = 0, p2wins = 0;
    shared.forEach(g => {
      const p1onT1 = [g.t1_p1, g.t1_p2].includes(p1);
      const t1win = g.t1_score > g.t2_score;
      if (p1onT1 ? t1win : !t1win) p1wins++; else p2wins++;
    });
    setResult({ shared, p1wins, p2wins });
  }

  const p1name = players.find(p => p.id === p1)?.name || '';
  const p2name = players.find(p => p.id === p2)?.name || '';

  return (
    <div className="card">
      <div className="card-title">Head-to-Head</div>
      {players.length < 2 ? (
        <div className="empty">Need at least 2 players.</div>
      ) : (
        <>
          <div className="form-row" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Player 1</label>
              <select value={p1} onChange={e => setP1(e.target.value)}>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Player 2</label>
              <select value={p2} onChange={e => setP2(e.target.value)}>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button className="btn" onClick={compute} style={{ alignSelf: 'flex-end' }}>View →</button>
          </div>

          {result && (
            result.shared.length === 0 ? (
              <div className="empty">No games between {p1name} and {p2name} on opposing teams.</div>
            ) : (
              <>
                <div className="h2h-result-grid">
                  <div className="h2h-stat">
                    <div className="h2h-name">{p1name}</div>
                    <div className="h2h-wins">{result.p1wins}</div>
                  </div>
                  <div className="h2h-stat">
                    <div className="h2h-name">Games</div>
                    <div className="h2h-wins" style={{ color: 'var(--text2)' }}>{result.shared.length}</div>
                  </div>
                  <div className="h2h-stat">
                    <div className="h2h-name">{p2name}</div>
                    <div className="h2h-wins">{result.p2wins}</div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Team 1</th><th>Score</th><th>Score</th><th>Team 2</th></tr>
                    </thead>
                    <tbody>
                      {[...result.shared].sort((a,b)=>new Date(b.played_at)-new Date(a.played_at)).map(g => {
                        const t1win = g.t1_score > g.t2_score;
                        const getName = id => players.find(p => p.id === id)?.name || '?';
                        return (
                          <tr key={g.id}>
                            <td style={{ fontWeight: [g.t1_p1,g.t1_p2].includes(p1) && t1win ? 600 : 400 }}>
                              {getName(g.t1_p1)} & {getName(g.t1_p2)}
                            </td>
                            <td><span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`}>{g.t1_score}</span></td>
                            <td><span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`}>{g.t2_score}</span></td>
                            <td style={{ fontWeight: [g.t2_p1,g.t2_p2].includes(p1) && !t1win ? 600 : 400 }}>
                              {getName(g.t2_p1)} & {getName(g.t2_p2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}

// ---- HELPERS ----
function buildStats(players, games) {
  const stats = {};
  players.forEach(p => { stats[p.id] = { wins: 0, losses: 0, pts: 0, hole: 0, board: 0 }; });
  games.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      const isT1 = ti === 0;
      const won = isT1 ? t1win : !t1win;
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (won) stats[pid].wins++; else stats[pid].losses++;
        stats[pid].pts += isT1 ? g.t1_score : g.t2_score;
        stats[pid].hole += Math.round((isT1 ? g.t1_hole : g.t2_hole) / 2);
        stats[pid].board += Math.round((isT1 ? g.t1_board : g.t2_board) / 2);
      });
    });
  });
  return stats;
}

const TABS = ['Leaderboard', 'Log Game', 'Players', 'H2H'];

// ---- ROOT APP ----
export default function App() {
  const [tab, setTab] = useState('Leaderboard');
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');

  const isConfigured = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY
    && process.env.REACT_APP_SUPABASE_URL !== 'YOUR_SUPABASE_URL';

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  }, []);

  const fetchData = useCallback(async () => {
    if (!isConfigured) return;
    const [{ data: ps }, { data: gs }] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('games').select('*').order('played_at', { ascending: false }),
    ]);
    setPlayers(ps || []);
    setGames(gs || []);
    setLoading(false);
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    fetchData();

    const sub = supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [fetchData, isConfigured]);

  if (!isConfigured) return <SetupScreen />;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">🎯 <span>Cornhole</span></div>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-inner">
          {TABS.map(t => (
            <button key={t} className={`nav-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </nav>

      <main className="main">
        {loading ? <Loading /> : (
          <>
            {tab === 'Leaderboard' && <Leaderboard players={players} games={games} />}
            {tab === 'Log Game' && <LogGame players={players} onGameLogged={fetchData} toast={showToast} />}
            {tab === 'Players' && <Players players={players} onRefresh={fetchData} toast={showToast} />}
            {tab === 'H2H' && <HeadToHead players={players} games={games} />}
          </>
        )}
      </main>

      <Toast message={toastMsg} />
    </>
  );
}
