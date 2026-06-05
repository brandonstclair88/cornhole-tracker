import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { supabase } from './supabase';
import { OneSignalManager } from './OneSignalManager';
import { calculateMVP } from './tournamentUtils';
import Tournament from './TournamentTab';
import MasterCornholerTab from './MasterCornholer';

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

function GameResultBanner({ result, onDismiss }) {
  if (!result) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '1rem', right: '1rem',
      background: 'var(--surface)', border: '1px solid var(--accent)',
      borderRadius: 'var(--radius)', padding: '14px 16px',
      zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.25s ease'
    }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 4, fontWeight: 500 }}>Game over</div>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{result}</div>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="loading"><div className="spinner" />Loading...</div>;
}

function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-logo">🎯 CORNHOLE</div>
      <div className="setup-sub">Work Break Tracker</div>
      <div className="setup-card">
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: '1rem', lineHeight: 1.6 }}>
          To use this app, you need a free Supabase database. Follow the README instructions to set it up.
        </p>
        <p className="setup-hint">
          See <strong style={{color:'var(--text)'}}>README.md</strong> in this project for full setup instructions.
        </p>
      </div>
    </div>
  );
}

// ---- LEADERBOARD ----
function Leaderboard({ players, games, onRefresh, toast, onGrudgeMatch }) {
  const stats = buildStats(players, games);
  const sorted = [...players].sort((a, b) => {
    const wa = stats[a.id] ? stats[a.id].wins / (stats[a.id].wins + stats[a.id].losses || 1) : 0;
    const wb = stats[b.id] ? stats[b.id].wins / (stats[b.id].wins + stats[b.id].losses || 1) : 0;
    if (wb !== wa) return wb - wa;
    return (stats[b.id]?.wins || 0) - (stats[a.id]?.wins || 0);
  });

  const totalGames = games.length;
  const totalPts = games.reduce((s, g) => s + g.t1_score + g.t2_score, 0);
  const totalHole = games.reduce((s, g) => s + (g.t1_p1_hole||0) + (g.t1_p2_hole||0) + (g.t2_p1_hole||0) + (g.t2_p2_hole||0), 0);

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const recent = [...games]
    .filter(g => new Date(g.played_at) >= weekStart)
    .sort((a, b) => new Date(b.played_at) - new Date(a.played_at))
    .slice(0, 20);

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
                  <th>#</th><th>Player</th><th>W</th><th>L</th><th>Win%</th><th>Pts</th><th>Hole</th><th>Board</th><th>MVP</th>
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
                      <td style={{ color: s.mvps > 0 ? 'var(--accent)' : 'var(--text3)' }}>{s.mvps > 0 ? `⭐${s.mvps}` : '—'}</td>
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
          <div className="card-title">This Week's Games</div>
          {recent.map(g => {
            const t1win = g.t1_score > g.t2_score;
            const t1p1 = players.find(p => p.id === g.t1_p1)?.name || '?';
            const t1p2 = players.find(p => p.id === g.t1_p2)?.name || '?';
            const t2p1 = players.find(p => p.id === g.t2_p1)?.name || '?';
            const t2p2 = players.find(p => p.id === g.t2_p2)?.name || '?';
            return (
              <div key={g.id} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <div className="game-row" style={{ borderBottom: 'none', marginBottom: 4, paddingBottom: 0 }}>
                  <div className={`game-team${t1win ? ' winner' : ''}`}>{t1p1} & {t1p2}</div>
                  <div className="game-score-block">
                    {g.is_tournament && <span style={{ fontSize: 10, background: 'rgba(232,197,71,0.15)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 3, marginRight: 4 }}>T</span>}
                    <span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`}>{g.t1_score}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 11 }}>–</span>
                    <span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`}>{g.t2_score}</span>
                  </div>
                  <div className={`game-team${!t1win ? ' winner' : ''}`} style={{ textAlign: 'right' }}>{t2p1} & {t2p2}</div>
                  <button className="btn btn-sm btn-danger" onClick={async () => {
                    if (!window.confirm('Delete this game?')) return;
                    const { error } = await supabase.from('games').delete({ count: 'exact' }).eq('id', g.id);
                    if (error) { alert('Delete failed: ' + error.message); return; }
                    toast('Game deleted.');
                    onRefresh();
                  }}>✕</button>
                </div>
                {g.mvp_player_ids?.length > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 3 }}>
                    ⭐ MVP: {g.mvp_player_ids.map(id => players.find(p => p.id === id)?.name || '?').join(' & ')}
                  </div>
                )}
                {g.trash_talk && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic', paddingLeft: 2, marginBottom: 4 }}>"{g.trash_talk}"</div>
                )}
                <button className="btn btn-sm" onClick={() => onGrudgeMatch && onGrudgeMatch(g)} style={{ fontSize: 11, marginTop: 2 }}>🔄 Rematch</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- BAG INPUT ROW ----
function BagInputRow({ label, name, hole, board, onHole, onBoard, playerIndex, players }) {
  const pIndex = players.findIndex(p => p.id === name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <Avatar name={label} index={pIndex >= 0 ? pIndex : playerIndex} size={26} />
      <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 70, flex: 1 }}>{label}</span>
      <div className="form-group" style={{ flex: 'unset', minWidth: 0 }}>
        <label>Hole</label>
        <input type="number" min="0" max="4" value={hole} onChange={e => onHole(e.target.value)} style={{ width: 60, textAlign: 'center' }} />
      </div>
      <div className="form-group" style={{ flex: 'unset', minWidth: 0 }}>
        <label>Board</label>
        <input type="number" min="0" max="4" value={board} onChange={e => onBoard(e.target.value)} style={{ width: 60, textAlign: 'center' }} />
      </div>
    </div>
  );
}

// ---- STEPPER ----
function Stepper({ value, onChange, max = 4 }) {
  const val = parseInt(value) || 0;
  const atMax = val >= max;
  const atMin = val <= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <button
        onClick={() => { if (!atMin) onChange(val - 1); }}
        disabled={atMin}
        style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: atMin ? 'var(--text3)' : 'var(--text2)', fontSize: 18, cursor: atMin ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}
      >−</button>
      <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: val > 0 ? 'var(--text)' : 'var(--text3)', userSelect: 'none' }}>{val}</span>
      <button
        onClick={() => { if (!atMax) onChange(val + 1); }}
        disabled={atMax}
        style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: atMax ? 'var(--text3)' : 'var(--text2)', fontSize: 18, cursor: atMax ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)' }}
      >+</button>
    </div>
  );
}
function emptyRound() {
  return { t1p1h: '', t1p1b: '', t1p2h: '', t1p2b: '', t2p1h: '', t2p1b: '', t2p2h: '', t2p2b: '' };
}

function calcScores(rounds) {
  let t1 = 0, t2 = 0;
  rounds.forEach(r => {
    const t1pts = (parseInt(r.t1p1h)||0)*3 + (parseInt(r.t1p1b)||0) + (parseInt(r.t1p2h)||0)*3 + (parseInt(r.t1p2b)||0);
    const t2pts = (parseInt(r.t2p1h)||0)*3 + (parseInt(r.t2p1b)||0) + (parseInt(r.t2p2h)||0)*3 + (parseInt(r.t2p2b)||0);
    const net = t1pts - t2pts;
    if (net > 0) t1 += net;
    else if (net < 0) t2 += Math.abs(net);
  });
  return { t1, t2 };
}

function LogGame({ players, onGameLogged, toast, grudgeMatch, onGrudgeMatchUsed }) {
  const [t1p1, setT1p1] = useState('');
  const [t1p2, setT1p2] = useState('');
  const [t2p1, setT2p1] = useState('');
  const [t2p2, setT2p2] = useState('');
  const [t1First, setT1First] = useState(true);
  const [t2First, setT2First] = useState(true);
  const [rounds, setRounds] = useState([emptyRound()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (grudgeMatch) {
      setT1p1(grudgeMatch.t1_p1 || '');
      setT1p2(grudgeMatch.t1_p2 || '');
      setT2p1(grudgeMatch.t2_p1 || '');
      setT2p2(grudgeMatch.t2_p2 || '');
      onGrudgeMatchUsed && onGrudgeMatchUsed();
    } else if (players.length >= 4) {
      setT1p1(players[0].id); setT1p2(players[1].id);
      setT2p1(players[2].id); setT2p2(players[3].id);
    } else if (players.length >= 2) {
      setT1p1(players[0].id); setT1p2(players[1].id);
    }
  }, [players, grudgeMatch]);

  const playerOptions = players.map(p => <option key={p.id} value={p.id}>{p.name}</option>);
  const getName = id => players.find(p => p.id === id)?.name || '?';

function setRoundVal(ri, key, val) {
    setRounds(rs => rs.map((r, i) => {
      if (i !== ri) return r;
      const newVal = Math.max(0, Math.min(4, parseInt(val) || 0));
      // find the paired key (hole <-> board for same player)
      const paired = key.endsWith('h') ? key.slice(0, -1) + 'b' : key.slice(0, -1) + 'h';
      const pairedVal = parseInt(r[paired]) || 0;
      const total = newVal + pairedVal;
      if (total > 4) {
        return { ...r, [key]: newVal, [paired]: 4 - newVal };
      }
      return { ...r, [key]: newVal };
    }));
  }
  function addRound() {
    if (rounds.length < 20) setRounds(rs => [...rs, emptyRound()]);
  }
  function removeRound(ri) {
    if (rounds.length > 1) setRounds(rs => rs.filter((_, i) => i !== ri));
  }

  function sumKey(key) { return rounds.reduce((s, r) => s + (parseInt(r[key]) || 0), 0); }

  const { t1: t1score, t2: t2score } = calcScores(rounds);

  async function handleSubmit() {
    setError('');
    const selected = [t1p1, t1p2, t2p1, t2p2];
    if (selected.some(v => !v)) { setError('Please select all 4 players.'); return; }
    if (new Set(selected).size < 4) { setError('Each player must be unique across both teams.'); return; }

    const t1name = `${names.t1p1} & ${names.t1p2}`;
    const t2name = `${names.t2p1} & ${names.t2p2}`;
    if (!window.confirm(`Log this game?\n\n${t1name}  ${t1score} – ${t2score}  ${t2name}`)) return;

    const t1p1h = sumKey('t1p1h'), t1p1b = sumKey('t1p1b');
    const t1p2h = sumKey('t1p2h'), t1p2b = sumKey('t1p2b');
    const t2p1h = sumKey('t2p1h'), t2p1b = sumKey('t2p1b');
    const t2p2h = sumKey('t2p2h'), t2p2b = sumKey('t2p2b');

    setSaving(true);
    const { error: err } = await supabase.from('games').insert({
      t1_p1: t1p1, t1_p2: t1p2, t2_p1: t2p1, t2_p2: t2p2,
      t1_score: t1score,
      t2_score: t2score,
      t1_hole: t1p1h + t1p2h, t2_hole: t2p1h + t2p2h,
      t1_board: t1p1b + t1p2b, t2_board: t2p1b + t2p2b,
      t1_p1_hole: t1p1h, t1_p1_board: t1p1b,
      t1_p2_hole: t1p2h, t1_p2_board: t1p2b,
      t2_p1_hole: t2p1h, t2_p1_board: t2p1b,
      t2_p2_hole: t2p2h, t2_p2_board: t2p2b,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    toast('Game logged!');
    onGameLogged();
    setRounds([emptyRound()]);
  }

  if (players.length < 4) {
    return <div className="card"><div className="empty">You need at least 4 players to log a 2v2 game.<br />Add more in the Players tab.</div></div>;
  }

  const names = { t1p1: getName(t1p1), t1p2: getName(t1p2), t2p1: getName(t2p1), t2p2: getName(t2p2) };

  return (
    <div className="card">
      <div className="card-title">Log a Game</div>
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 500, marginBottom: 6 }}>Team 1</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div className="form-group">
              <label>Player A</label>
              <select value={t1p1} onChange={e => setT1p1(e.target.value)}>{playerOptions}</select>
            </div>
            <div className="form-group">
              <label>Player B</label>
              <select value={t1p2} onChange={e => setT1p2(e.target.value)}>{playerOptions}</select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>Throws first:</span>
            <button className="btn btn-sm" style={{ borderColor: t1First ? 'var(--accent)' : undefined, color: t1First ? 'var(--accent)' : undefined }} onClick={() => setT1First(true)}>{names.t1p1 || 'Player A'}</button>
            <button className="btn btn-sm" style={{ borderColor: !t1First ? 'var(--accent)' : undefined, color: !t1First ? 'var(--accent)' : undefined }} onClick={() => setT1First(false)}>{names.t1p2 || 'Player B'}</button>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text3)', padding: '2px 0' }}>VS</div>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', fontWeight: 500, marginBottom: 6 }}>Team 2</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <div className="form-group">
              <label>Player A</label>
              <select value={t2p1} onChange={e => setT2p1(e.target.value)}>{playerOptions}</select>
            </div>
            <div className="form-group">
              <label>Player B</label>
              <select value={t2p2} onChange={e => setT2p2(e.target.value)}>{playerOptions}</select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', alignSelf: 'center' }}>Throws first:</span>
            <button className="btn btn-sm" style={{ borderColor: t2First ? 'var(--green)' : undefined, color: t2First ? 'var(--green)' : undefined }} onClick={() => setT2First(true)}>{names.t2p1 || 'Player A'}</button>
            <button className="btn btn-sm" style={{ borderColor: !t2First ? 'var(--green)' : undefined, color: !t2First ? 'var(--green)' : undefined }} onClick={() => setT2First(false)}>{names.t2p2 || 'Player B'}</button>
          </div>
        </div>
      </div>

      <hr className="divider" />
      <div style={{ marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500 }}>Score (auto-calculated)</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Team 1</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: t1score > t2score ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>{t1score}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text3)' }}>–</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Team 2</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: t2score > t1score ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>{t2score}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8, lineHeight: 1.5 }}>Hole = 3 pts<br/>Board = 1 pt<br/>Cancellation</div>
      </div>

      <hr className="divider" />
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', fontWeight: 500, marginBottom: 12 }}>Rounds ({rounds.length})</div>

      {rounds.map((r, ri) => (
        <div key={ri} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 500 }}>Round {ri + 1}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>
                {(() => {
                  const isOdd = ri % 2 === 0;
                  const t1n = isOdd ? (t1First ? names.t1p1 : names.t1p2) : (t1First ? names.t1p2 : names.t1p1);
                  const t2n = isOdd ? (t2First ? names.t2p1 : names.t2p2) : (t2First ? names.t2p2 : names.t2p1);
                  return `${t1n} vs ${t2n}`;
                })()}
              </span>
            </div>
            {rounds.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => removeRound(ri)}>✕</button>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(() => {
              const isOdd = ri % 2 === 0;
              const t1thrower = isOdd ? (t1First ? 't1p1' : 't1p2') : (t1First ? 't1p2' : 't1p1');
              const t2thrower = isOdd ? (t2First ? 't2p1' : 't2p2') : (t2First ? 't2p2' : 't2p1');
              const throwers = [
                { label: names[t1thrower], hk: `${t1thrower}h`, bk: `${t1thrower}b`, team: 1 },
                { label: names[t2thrower], hk: `${t2thrower}h`, bk: `${t2thrower}b`, team: 2 },
              ];
              return throwers.map(({ label, hk, bk, team }) => (
                <div key={hk} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '8px 10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: team === 1 ? 'var(--accent)' : 'var(--green)', fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <Stepper value={r[hk]} onChange={v => setRoundVal(ri, hk, v)} max={4 - (parseInt(r[bk]) || 0)} />
                      <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Hole</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <Stepper value={r[bk]} onChange={v => setRoundVal(ri, bk, v)} max={4 - (parseInt(r[hk]) || 0)} />
                      <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Board</span>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      ))}

      {rounds.length < 20 && (
        <button className="btn" onClick={addRound} style={{ width: '100%', marginBottom: 12 }}>+ Add round</button>
      )}

      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8, fontWeight: 500 }}>Running score</div>
        {rounds.map((r, ri) => {
          const t1pts = (parseInt(r.t1p1h)||0)*3 + (parseInt(r.t1p1b)||0) + (parseInt(r.t1p2h)||0)*3 + (parseInt(r.t1p2b)||0);
          const t2pts = (parseInt(r.t2p1h)||0)*3 + (parseInt(r.t2p1b)||0) + (parseInt(r.t2p2h)||0)*3 + (parseInt(r.t2p2b)||0);
          const net = t1pts - t2pts;
          const { t1: runT1, t2: runT2 } = calcScores(rounds.slice(0, ri + 1));
          return (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: ri < rounds.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 54, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rd {ri + 1}</span>
              <span style={{ fontSize: 12, color: net > 0 ? 'var(--accent)' : net < 0 ? 'var(--green)' : 'var(--text3)', flex: 1 }}>
                {net > 0 ? `T1 +${net}` : net < 0 ? `T2 +${Math.abs(net)}` : 'Cancelled'}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text)' }}>{runT1} – {runT2}</span>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary" onClick={() => {
        if (window.confirm(`Log this game?\n\nTeam 1: ${names.t1p1} & ${names.t1p2}\nTeam 2: ${names.t2p1} & ${names.t2p2}\nScore: ${t1score} – ${t2score}`)) {
          handleSubmit();
        }
      }} disabled={saving}>
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
    setSaving(true); setError('');
    const { error: err } = await supabase.from('players').insert({ name: trimmed });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setName(''); toast(`${trimmed} added!`); onRefresh();
  }

  async function removePlayer(id, playerName) {
    if (!window.confirm(`Remove ${playerName}? Their game history will be kept.`)) return;
    await supabase.from('players').delete().eq('id', id);
    toast('Player removed.'); onRefresh();
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Add Player</div>
        {error && <div className="error-banner">{error}</div>}
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="e.g. Jordan" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlayer()} />
          </div>
          <button className="btn btn-primary" onClick={addPlayer} disabled={saving} style={{ alignSelf: 'flex-end' }}>
            {saving ? '...' : 'Add'}
          </button>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Roster ({players.length})</div>
        {players.length === 0 ? <div className="empty">No players yet.</div> : (
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
    if (players.length >= 2) { setP1(players[0].id); setP2(players[1].id); }
  }, [players]);

  function compute() {
    if (!p1 || !p2 || p1 === p2) return;
    const shared = games.filter(g => {
      const t1 = [g.t1_p1, g.t1_p2]; const t2 = [g.t2_p1, g.t2_p2];
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
      {players.length < 2 ? <div className="empty">Need at least 2 players.</div> : (
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
            result.shared.length === 0 ? <div className="empty">No games between {p1name} and {p2name} on opposing teams.</div> : (
              <>
                <div className="h2h-result-grid">
                  <div className="h2h-stat"><div className="h2h-name">{p1name}</div><div className="h2h-wins">{result.p1wins}</div></div>
                  <div className="h2h-stat"><div className="h2h-name">Games</div><div className="h2h-wins" style={{ color: 'var(--text2)' }}>{result.shared.length}</div></div>
                  <div className="h2h-stat"><div className="h2h-name">{p2name}</div><div className="h2h-wins">{result.p2wins}</div></div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Team 1</th><th>Score</th><th>Score</th><th>Team 2</th></tr></thead>
                    <tbody>
                      {[...result.shared].sort((a,b)=>new Date(b.played_at)-new Date(a.played_at)).map(g => {
                        const t1win = g.t1_score > g.t2_score;
                        const getName = id => players.find(p => p.id === id)?.name || '?';
                        return (
                          <tr key={g.id}>
                            <td style={{ fontWeight: [g.t1_p1,g.t1_p2].includes(p1) && t1win ? 600 : 400 }}>{getName(g.t1_p1)} & {getName(g.t1_p2)}</td>
                            <td><span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`}>{g.t1_score}</span></td>
                            <td><span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`}>{g.t2_score}</span></td>
                            <td style={{ fontWeight: [g.t2_p1,g.t2_p2].includes(p1) && !t1win ? 600 : 400 }}>{getName(g.t2_p1)} & {getName(g.t2_p2)}</td>
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
  players.forEach(p => { stats[p.id] = { wins: 0, losses: 0, pts: 0, hole: 0, board: 0, mvps: 0 }; });
  games.forEach(g => {
    const t1win = g.t1_score > g.t2_score;
    const playerBags = {
      [g.t1_p1]: { hole: g.t1_p1_hole || 0, board: g.t1_p1_board || 0 },
      [g.t1_p2]: { hole: g.t1_p2_hole || 0, board: g.t1_p2_board || 0 },
      [g.t2_p1]: { hole: g.t2_p1_hole || 0, board: g.t2_p1_board || 0 },
      [g.t2_p2]: { hole: g.t2_p2_hole || 0, board: g.t2_p2_board || 0 },
    };
    [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
      const isT1 = ti === 0;
      const won = isT1 ? t1win : !t1win;
      team.forEach(pid => {
        if (!stats[pid]) return;
        if (won) stats[pid].wins++; else stats[pid].losses++;
        stats[pid].pts += isT1 ? g.t1_score : g.t2_score;
        stats[pid].hole += playerBags[pid]?.hole || 0;
        stats[pid].board += playerBags[pid]?.board || 0;
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


const TABS = ['Leaderboard', 'Log Game', 'Players', 'H2H', 'Tournament', 'Master'];

export default function App() {
  const [tab, setTab] = useState('Leaderboard');
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [gameResult, setGameResult] = useState(null);
  const [specialBanner, setSpecialBanner] = useState(null);
  const [grudgeMatch, setGrudgeMatch] = useState(null);
  const latestGameId = useRef(null);

  const isConfigured = process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY
    && process.env.REACT_APP_SUPABASE_URL !== 'YOUR_SUPABASE_URL';

  // Initialize OneSignal
  useEffect(() => {
    OneSignalManager.initialize();
  }, []);

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

  const handleGameChange = useCallback(async (payload) => {
    await fetchData();
    if (payload.eventType === 'INSERT' && payload.new) {
      const game = payload.new;
      if (game.id === latestGameId.current) return;
      latestGameId.current = game.id;

      const { data: ps } = await supabase.from('players').select('*');
      const playerMap = {};
      (ps || []).forEach(p => { playerMap[p.id] = p.name; });
      const getName = id => playerMap[id] || '?';

      // Calculate and save MVP
      const mvpIds = calculateMVP(game);
      if (mvpIds.length > 0) {
        await supabase.from('games').update({ mvp_player_ids: mvpIds }).eq('id', game.id);
      }

      const t1wins = game.t1_score > game.t2_score;
      const winners = t1wins ? `${getName(game.t1_p1)} & ${getName(game.t1_p2)}` : `${getName(game.t2_p1)} & ${getName(game.t2_p2)}`;
      const losers = t1wins ? `${getName(game.t2_p1)} & ${getName(game.t2_p2)}` : `${getName(game.t1_p1)} & ${getName(game.t1_p2)}`;
      const winScore = t1wins ? game.t1_score : game.t2_score;
      const loseScore = t1wins ? game.t2_score : game.t1_score;
      const margin = winScore - loseScore;

      // Check special events
      const isShutout = loseScore === 0;
      const t1hole = (game.t1_p1_hole||0) + (game.t1_p2_hole||0);
      const t1board = (game.t1_p1_board||0) + (game.t1_p2_board||0);
      const t2hole = (game.t2_p1_hole||0) + (game.t2_p2_hole||0);
      const t2board = (game.t2_p1_board||0) + (game.t2_p2_board||0);
      const totalBags = t1hole + t1board + t2hole + t2board;
      const totalHole = t1hole + t2hole;
      const winHole = t1wins ? t1hole : t2hole;
      const loseHole = t1wins ? t2hole : t1hole;
      const winBoard = t1wins ? t1board : t2board;
      const loseBoard = t1wins ? t2board : t1board;

      // Special event banners
      if (isShutout) {
        setSpecialBanner({ emoji: '💀', title: 'SHUTOUT', message: `${losers} got absolutely zero points. Someone check on them.` });
        await OneSignalManager.notifyShutout(losers);
      }

      const isBlowout = margin >= 9;
      const isClose = margin <= 2;
      const lowScoring = winScore <= 5;
      const bothBad = totalHole <= 2 && totalBags > 8;
      const winnersAllHoles = winHole >= 4 && winBoard <= 1;
      const losersDrought = loseHole === 0;

      let context = '';
      if (lowScoring && isClose) context = 'Both teams were absolutely terrible — nobody could score. Make fun of both teams equally for putting on a pathetic display.';
      else if (lowScoring && isBlowout) context = `${winners} dominated but scored almost nothing. Make fun of everyone for being bad at cornhole.`;
      else if (bothBad) context = 'Tons of bags were thrown but almost none went in the hole. Both teams were awful. Roast everyone for their terrible aim.';
      else if (losersDrought && isBlowout) context = `${losers} got absolutely zero holes the whole game. They were humiliated. Be savage.`;
      else if (winnersAllHoles) context = `${winners} were surgical — almost all their bags went in the hole. Hype them up as legends.`;
      else if (isBlowout) context = `Total blowout. ${losers} got destroyed. Be absolutely savage about the losers.`;
      else if (isClose) context = 'Extremely close game, came down to the wire. Make it sound like the most dramatic moment in sports history.';
      else context = `Solid win for ${winners}. Be cocky about the winners and throw mild shade at the losers.`;

      // Random style for variety
      const styles = ['sports commentator', 'disappointed coach', 'deadpan reporter', 'soap opera narrator', 'shocked witness', 'hype man', 'reality TV host', 'retired athlete analyst', 'movie trailer voice', 'tabloid journalist'];
      const style = styles[Math.floor(Math.random() * styles.length)];

      setGameResult(`${winners} beat ${losers} ${winScore}–${loseScore}...`);

      try {
        const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            temperature: 1.0,
            messages: [{
              role: 'user',
              content: `You are the meanest, funniest trash-talking sports announcer in history. You work for a cornhole league at someone's job. Write ONE brutal notification (1-2 sentences, no quotes, no emojis) about this game. Use their actual names. Write in the style of a ${style}. Be creative, unpredictable, and savage — never generic. Never use these words: dominated, crushed, obliterated, destroyed, demolished, stellar, impressive, came out on top, secured the win, battle it out, faced off, at the end of the day.

Winners: ${winners} (score: ${winScore}, holes: ${winHole}, on board: ${winBoard})
Losers: ${losers} (score: ${loseScore}, holes: ${loseHole}, on board: ${loseBoard})
Total bags thrown: ${totalBags}, total holes: ${totalHole}

Tone: ${context}

Be unpredictable. Make it feel like a different person wrote it every time.`
            }]
          })
        });
        const data = await res.json();
        const msg = data.content?.[0]?.text;
        if (msg) {
          setGameResult(msg);
          await supabase.from('games').update({ trash_talk: msg }).eq('id', game.id);
          await OneSignalManager.notifyGameResult(winners, losers, winScore, loseScore, msg);
          await fetchData();
        }
      } catch(e) {
        console.error('API error:', e);
      }
    }
  }, [fetchData]);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    fetchData();
    const sub = supabase.channel('realtime-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'games' }, handleGameChange)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'games' }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [fetchData, handleGameChange, isConfigured]);

  if (!isConfigured) return <SetupScreen />;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="20" height="32" viewBox="0 0 90 145" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="90" height="145" rx="10" fill="#8B5E2A" stroke="#6B3F10" strokeWidth="3"/>
              <circle cx="45" cy="48" r="19" fill="#1a0f00" stroke="#3a2000" strokeWidth="2"/>
              <rect x="58" y="88" width="22" height="22" rx="4" fill="#e8c547" stroke="#c9a832" strokeWidth="1.5" transform="rotate(-15, 69, 99)"/>
              <rect x="20" y="105" width="22" height="22" rx="4" fill="#e05c5c" stroke="#b83c3c" strokeWidth="1.5" transform="rotate(10, 31, 116)"/>
            </svg>
            <span>Cornhole</span>
          </div>
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
            {tab === 'Leaderboard' && <Leaderboard players={players} games={games} onRefresh={fetchData} toast={showToast} onGrudgeMatch={(g) => { setGrudgeMatch(g); setTab('Log Game'); }} />}
            {tab === 'Log Game' && <LogGame players={players} onGameLogged={fetchData} toast={showToast} grudgeMatch={grudgeMatch} onGrudgeMatchUsed={() => setGrudgeMatch(null)} />}
            {tab === 'Players' && <Players players={players} onRefresh={fetchData} toast={showToast} />}
            {tab === 'H2H' && <HeadToHead players={players} games={games} />}
            {tab === 'Tournament' && <Tournament players={players} games={games} toast={showToast} />}
            {tab === 'Master' && <MasterCornholerTab players={players} games={games} />}
          </>
        )}
      </main>
      <Toast message={toastMsg} />
      {specialBanner && (
        <div style={{
          position: 'fixed', top: '1rem', left: '1rem', right: '1rem',
          background: 'var(--surface)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)', padding: '12px 16px',
          zIndex: 9998, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 24 }}>{specialBanner.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 500 }}>{specialBanner.title}</div>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{specialBanner.message}</div>
          </div>
          <button onClick={() => setSpecialBanner(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <GameResultBanner result={gameResult} onDismiss={() => setGameResult(null)} />
    </>
  );
}
