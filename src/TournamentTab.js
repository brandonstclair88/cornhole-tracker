import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { AvatarDisplay } from './Avatars';

const AVATAR_COLORS = [
  { bg: '#2a2318', fg: '#e8c547' }, { bg: '#1a2820', fg: '#4caf82' },
  { bg: '#251818', fg: '#e05c5c' }, { bg: '#1a2030', fg: '#6ba3e0' },
  { bg: '#221a28', fg: '#b07ee0' }, { bg: '#1f2018', fg: '#8ec44a' },
];

function Avatar({ name, index, size = 28, avatarId }) {
  return <AvatarDisplay avatarId={avatarId} playerName={name} playerIndex={index} size={size} />;
}

function haptic() { if (navigator.vibrate) navigator.vibrate(10); }

function PinModal({ title = 'Enter PIN', onConfirm, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === '4399') { onConfirm(); }
      else { setError('Wrong PIN'); setTimeout(() => { setPin(''); setError(''); }, 600); }
    }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 300 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)', marginBottom: 12 }}>{title}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 44, height: 52, border: `1px solid ${error ? 'var(--red)' : 'var(--border2)'}`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: error ? 'var(--red)' : 'var(--accent)' }}>
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} className="btn" onClick={() => { haptic(); handleDigit(String(d)); }} style={{ height: 52, fontSize: 22, fontFamily: 'var(--font-display)' }}>{d}</button>
          ))}
          <div/>
          <button className="btn" onClick={() => { haptic(); handleDigit('0'); }} style={{ height: 52, fontSize: 22, fontFamily: 'var(--font-display)' }}>0</button>
          <button className="btn" onClick={() => setPin(p => p.slice(0,-1))} style={{ height: 52, fontSize: 16 }}>⌫</button>
        </div>
        <button className="btn" onClick={onCancel} style={{ width: '100%' }}>Cancel</button>
      </div>
    </div>
  );
}

function Stepper({ value, onChange, max = 4 }) {
  const val = parseInt(value) || 0;
  const atMax = val >= max;
  const atMin = val <= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <button onClick={() => { if (!atMin) { haptic(); onChange(val - 1); } }} disabled={atMin}
        style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: atMin ? 'var(--text3)' : 'var(--text2)', fontSize: 18, cursor: atMin ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
      <span style={{ width: 28, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: val > 0 ? 'var(--text)' : 'var(--text3)', userSelect: 'none' }}>{val}</span>
      <button onClick={() => { if (!atMax) { haptic(); onChange(val + 1); } }} disabled={atMax}
        style={{ width: 36, height: 36, border: 'none', background: 'transparent', color: atMax ? 'var(--text3)' : 'var(--text2)', fontSize: 18, cursor: atMax ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
    </div>
  );
}

function calcScores(rounds) {
  let t1 = 0, t2 = 0;
  rounds.forEach(r => {
    const t1pts = (parseInt(r.t1p1h)||0)*3 + (parseInt(r.t1p1b)||0) + (parseInt(r.t1p2h)||0)*3 + (parseInt(r.t1p2b)||0);
    const t2pts = (parseInt(r.t2p1h)||0)*3 + (parseInt(r.t2p1b)||0) + (parseInt(r.t2p2h)||0)*3 + (parseInt(r.t2p2b)||0);
    const net = t1pts - t2pts;
    if (net > 0) t1 += net; else if (net < 0) t2 += Math.abs(net);
  });
  return { t1, t2 };
}

function emptyRound() {
  return { t1p1h: 0, t1p1b: 0, t1p2h: 0, t1p2b: 0, t2p1h: 0, t2p1b: 0, t2p2h: 0, t2p2b: 0 };
}

function TournamentLogForm({ dbSession, players, games, onSubmit, onCancel }) {
  const [rounds, setRounds] = useState([emptyRound()]);
  const [saving, setSaving] = useState(false);
  const [t1First, setT1First] = useState(true);
  const [t2First, setT2First] = useState(true);

  const getName = id => players.find(p => p.id === id)?.name || '?';
  const getIndex = id => players.findIndex(p => p.id === id);
  const getAvatar = id => players.find(p => p.id === id)?.avatar_id;

  const t1p1 = dbSession.team1_p1, t1p2 = dbSession.team1_p2;
  const t2p1 = dbSession.team2_p1, t2p2 = dbSession.team2_p2;

  function setRoundVal(ri, key, val) {
    setRounds(rs => rs.map((r, i) => {
      if (i !== ri) return r;
      const newVal = Math.max(0, Math.min(4, parseInt(val) || 0));
      const paired = key.endsWith('h') ? key.slice(0,-1)+'b' : key.slice(0,-1)+'h';
      const pairedVal = parseInt(r[paired]) || 0;
      if (newVal + pairedVal > 4) return { ...r, [key]: newVal, [paired]: 4 - newVal };
      return { ...r, [key]: newVal };
    }));
  }

  function addRound() { if (rounds.length < 20) setRounds(rs => [...rs, emptyRound()]); }
  function removeRound(ri) { if (rounds.length > 1) setRounds(rs => rs.filter((_, i) => i !== ri)); }
  function sumKey(key) { return rounds.reduce((s, r) => s + (parseInt(r[key]) || 0), 0); }

  const { t1: t1score, t2: t2score } = calcScores(rounds);

  async function handleSubmit() {
    const t1p1h = sumKey('t1p1h'), t1p1b = sumKey('t1p1b');
    const t1p2h = sumKey('t1p2h'), t1p2b = sumKey('t1p2b');
    const t2p1h = sumKey('t2p1h'), t2p1b = sumKey('t2p1b');
    const t2p2h = sumKey('t2p2h'), t2p2b = sumKey('t2p2b');

    const msg = `Log this tournament game?\n\nTeam 1: ${getName(t1p1)} & ${getName(t1p2)}\nTeam 2: ${getName(t2p1)} & ${getName(t2p2)}\nScore: ${t1score} – ${t2score}`;
    if (!window.confirm(msg)) return;

    setSaving(true);
    const { data, error } = await supabase.from('games').insert({
      t1_p1: t1p1, t1_p2: t1p2, t2_p1: t2p1, t2_p2: t2p2,
      t1_score: t1score, t2_score: t2score,
      t1_hole: t1p1h + t1p2h, t2_hole: t2p1h + t2p2h,
      t1_board: t1p1b + t1p2b, t2_board: t2p1b + t2p2b,
      t1_p1_hole: t1p1h, t1_p1_board: t1p1b,
      t1_p2_hole: t1p2h, t1_p2_board: t1p2b,
      t2_p1_hole: t2p1h, t2_p1_board: t2p1b,
      t2_p2_hole: t2p2h, t2_p2_board: t2p2b,
      is_tournament: true,
      tournament_session_id: dbSession.id,
    }).select().single();
    setSaving(false);
    if (!error && data) onSubmit(data);
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>📝 Log Result</div>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>

      {/* Teams display (locked) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px', border: '1px solid rgba(232,197,71,0.3)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', marginBottom: 6 }}>Team 1</div>
          {[t1p1, t1p2].map(id => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Avatar name={getName(id)} index={getIndex(id)} size={20} avatarId={getAvatar(id)} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{getName(id)}</span>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text3)', textAlign: 'center' }}>VS</div>
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px', border: '1px solid rgba(76,175,130,0.3)' }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 6 }}>Team 2</div>
          {[t2p1, t2p2].map(id => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Avatar name={getName(id)} index={getIndex(id)} size={20} avatarId={getAvatar(id)} />
              <span style={{ fontSize: 12, fontWeight: 500 }}>{getName(id)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Score display */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Team 1</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: t1score > t2score ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>{t1score}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--text3)' }}>–</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Team 2</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: t2score > t1score ? 'var(--green)' : 'var(--text)', lineHeight: 1 }}>{t2score}</div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>Hole=3<br/>Board=1<br/>Cancel</div>
      </div>

      {/* Throws first */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>T1 throws first</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm" onClick={() => setT1First(true)} style={{ flex: 1, borderColor: t1First ? 'var(--accent)' : undefined, color: t1First ? 'var(--accent)' : undefined, fontSize: 11 }}>{getName(t1p1)}</button>
            <button className="btn btn-sm" onClick={() => setT1First(false)} style={{ flex: 1, borderColor: !t1First ? 'var(--accent)' : undefined, color: !t1First ? 'var(--accent)' : undefined, fontSize: 11 }}>{getName(t1p2)}</button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: 'var(--green)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.6px' }}>T2 throws first</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-sm" onClick={() => setT2First(true)} style={{ flex: 1, borderColor: t2First ? 'var(--green)' : undefined, color: t2First ? 'var(--green)' : undefined, fontSize: 11 }}>{getName(t2p1)}</button>
            <button className="btn btn-sm" onClick={() => setT2First(false)} style={{ flex: 1, borderColor: !t2First ? 'var(--green)' : undefined, color: !t2First ? 'var(--green)' : undefined, fontSize: 11 }}>{getName(t2p2)}</button>
          </div>
        </div>
      </div>

      {/* Rounds */}
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8, fontWeight: 500 }}>Rounds ({rounds.length})</div>
      {rounds.map((r, ri) => {
        const isOdd = ri % 2 === 0;
        const t1thrower = isOdd ? (t1First ? 't1p1' : 't1p2') : (t1First ? 't1p2' : 't1p1');
        const t2thrower = isOdd ? (t2First ? 't2p1' : 't2p2') : (t2First ? 't2p2' : 't2p1');
        const throwers = [
          { id: dbSession[t1thrower === 't1p1' ? 'team1_p1' : 'team1_p2'], hk: `${t1thrower}h`, bk: `${t1thrower}b`, team: 1 },
          { id: dbSession[t2thrower === 't2p1' ? 'team2_p1' : 'team2_p2'], hk: `${t2thrower}h`, bk: `${t2thrower}b`, team: 2 },
        ];
        return (
          <div key={ri} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 10, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--accent)', fontWeight: 500 }}>Round {ri + 1}</span>
              {rounds.length > 1 && <button className="btn btn-sm btn-danger" onClick={() => removeRound(ri)}>✕</button>}
            </div>
            {throwers.map(({ id, hk, bk, team }) => (
              <div key={hk} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '8px 10px', border: '1px solid var(--border)' }}>
                <Avatar name={getName(id)} index={getIndex(id)} size={22} avatarId={getAvatar(id)} />
                <span style={{ fontSize: 12, color: team === 1 ? 'var(--accent)' : 'var(--green)', fontWeight: 500, flex: 1 }}>{getName(id)}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Stepper value={r[hk]} onChange={v => setRoundVal(ri, hk, v)} max={4 - (parseInt(r[bk]) || 0)} />
                  <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Hole</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Stepper value={r[bk]} onChange={v => setRoundVal(ri, bk, v)} max={4 - (parseInt(r[hk]) || 0)} />
                  <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Board</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {rounds.length < 20 && (
        <button className="btn" onClick={addRound} style={{ width: '100%', marginBottom: 12 }}>+ Add Round</button>
      )}

      {/* Running score */}
      <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8, fontWeight: 500 }}>Running Score</div>
        {rounds.map((r, ri) => {
          const t1pts = (parseInt(r.t1p1h)||0)*3 + (parseInt(r.t1p1b)||0) + (parseInt(r.t1p2h)||0)*3 + (parseInt(r.t1p2b)||0);
          const t2pts = (parseInt(r.t2p1h)||0)*3 + (parseInt(r.t2p1b)||0) + (parseInt(r.t2p2h)||0)*3 + (parseInt(r.t2p2b)||0);
          const net = t1pts - t2pts;
          const { t1: runT1, t2: runT2 } = calcScores(rounds.slice(0, ri + 1));
          return (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: ri < rounds.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 50 }}>Rd {ri + 1}</span>
              <span style={{ fontSize: 12, color: net > 0 ? 'var(--accent)' : net < 0 ? 'var(--green)' : 'var(--text3)', flex: 1 }}>
                {net > 0 ? `T1 +${net}` : net < 0 ? `T2 +${Math.abs(net)}` : 'Cancelled'}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text)' }}>{runT1} – {runT2}</span>
            </div>
          );
        })}
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ width: '100%' }}>
        {saving ? 'Saving...' : 'Submit Result →'}
      </button>
    </div>
  );
}

function isWeekday() {
  const d = new Date().getDay();
  return d >= 1 && d <= 4;
}

function getSessionWindow() {
  const now = new Date();
  const total = now.getHours() * 60 + now.getMinutes();
  if (total >= 390 && total < 600) return { type: 'morning', locksAt: '10:00 AM', minutesLeft: 600 - total };
  if (total >= 615 && total < 900) return { type: 'afternoon', locksAt: '3:00 PM', minutesLeft: 900 - total };
  return null;
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

function pickTeams(checkedIn, allPlayers, allGames, sessionGames, lastMatchup) {
  const stats = buildStats(allPlayers, allGames);
  const winPct = id => { const s = stats[id] || { wins: 0, losses: 0 }; return s.wins / (s.wins + s.losses || 1); };

  const sessionCount = {};
  checkedIn.forEach(p => { sessionCount[p.id] = 0; });
  sessionGames.forEach(g => {
    [g.t1_p1, g.t1_p2, g.t2_p1, g.t2_p2].forEach(id => {
      if (sessionCount[id] !== undefined) sessionCount[id]++;
    });
  });

  const pool = [...checkedIn].sort((a, b) => {
    const diff = sessionCount[a.id] - sessionCount[b.id];
    return diff !== 0 ? diff : winPct(b.id) - winPct(a.id);
  }).slice(0, 4);

  if (pool.length < 4) return null;

  const sorted = [...pool].sort((a, b) => winPct(b.id) - winPct(a.id));
  const combos = [
    [[sorted[0], sorted[2]], [sorted[1], sorted[3]]],
    [[sorted[0], sorted[3]], [sorted[1], sorted[2]]],
    [[sorted[1], sorted[2]], [sorted[0], sorted[3]]],
  ];

  let best = null;
  let bestScore = Infinity;

  combos.forEach(([t1, t2]) => {
    const skillDiff = Math.abs((winPct(t1[0].id) + winPct(t1[1].id)) - (winPct(t2[0].id) + winPct(t2[1].id)));

    // Penalize if same as last matchup
    let repeatPenalty = 0;
    if (lastMatchup) {
      const lastT1 = new Set([lastMatchup.team1_p1, lastMatchup.team1_p2]);
      const lastT2 = new Set([lastMatchup.team2_p1, lastMatchup.team2_p2]);
      const newT1 = new Set([t1[0].id, t1[1].id]);
      const newT2 = new Set([t2[0].id, t2[1].id]);
      const sameAsLast = ([...newT1].every(id => lastT1.has(id)) && [...newT2].every(id => lastT2.has(id))) ||
                         ([...newT1].every(id => lastT2.has(id)) && [...newT2].every(id => lastT1.has(id)));
      if (sameAsLast) repeatPenalty = 10;
    }

    const score = skillDiff + repeatPenalty;
    if (score < bestScore) { bestScore = score; best = [t1, t2]; }
  });

  return best ? { team1: best[0], team2: best[1] } : null;
}

async function getAIPreview(t1names, t2names) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', max_tokens: 80, temperature: 1.0,
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
  const [showLogForm, setShowLogForm] = useState(false);
  const [showUnlockPin, setShowUnlockPin] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(null);
  const timerRef = useRef(null);

  const getName = id => players.find(p => p.id === id)?.name || '?';
  const getIndex = id => players.findIndex(p => p.id === id);
  const getAvatar = id => players.find(p => p.id === id)?.avatar_id;
  const today = new Date().toISOString().split('T')[0];
  const sessionWindow = getSessionWindow();
  const sessionType = testMode ? 'morning' : sessionWindow?.type;
  const showSession = testMode || (isWeekday() && sessionWindow);

  async function loadData() {
    if (!sessionType) { setLoading(false); return; }
    const { data: sessions } = await supabase.from('tournament_sessions').select('*').eq('session_date', today).eq('session_type', sessionType).limit(1);
    const s = sessions?.[0] || null;
    setDbSession(s);

    if (s) {
      const { data: ci } = await supabase.from('tournament_checkins').select('*, players(*)').eq('session_id', s.id);
      setCheckins(ci || []);
      const { data: sg } = await supabase.from('games').select('*').eq('tournament_session_id', s.id).order('played_at');
      setSessionGames(sg || []);

      // Session timer
      if (s.started_at && !timerRef.current) {
        timerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000);
          const mins = Math.floor(elapsed / 60);
          const secs = elapsed % 60;
          setSessionTimer(`${mins}:${secs.toString().padStart(2, '0')}`);
        }, 1000);
      }
    } else {
      setCheckins([]); setSessionGames([]);
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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [testMode, players.length]);

  useEffect(() => {
    if (!dbSession) return;
    const sub = supabase.channel('t-' + dbSession.id)
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
      session_type: type, session_date: today,
      opens_at: new Date().toISOString(), locks_at: new Date().toISOString(), status: 'open',
    }).select().single();
    if (error) return null;
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

    const lastMatchup = sessionGames.length > 0 ? sessionGames[sessionGames.length - 1] : null;
    const result = pickTeams(checkedInPlayers, players, games, sessionGames, lastMatchup);
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
      started_at: dbSession.started_at || new Date().toISOString(),
    }).eq('id', dbSession.id);

    setLocking(false);
    setShowLogForm(false);
    loadData();
  }

  async function unlockSession() {
    if (!dbSession) return;
    await supabase.from('tournament_sessions').update({
      status: 'open',
      team1_p1: null, team1_p2: null, team2_p1: null, team2_p2: null,
      ai_preview: null,
    }).eq('id', dbSession.id);
    setShowLogForm(false);
    toast('Session unlocked');
    loadData();
  }

  async function handleGameLogged(game) {
    setShowLogForm(false);
    toast('Game logged! 🎯');

    // Generate next matchup
    const checkedInPlayers = checkins.map(c => c.players).filter(Boolean);
    const { data: sg } = await supabase.from('games').select('*').eq('tournament_session_id', dbSession.id);
    const allSessionGames = [...(sg || []), game];
    const result = pickTeams(checkedInPlayers, players, games, allSessionGames, game);

    if (!result) {
      await supabase.from('tournament_sessions').update({ status: 'completed' }).eq('id', dbSession.id);
      toast('Session complete! Great games 🎯');
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

    loadData();
  }

  async function markPlayerOut(playerId) {
    if (!dbSession) return;
    // Remove from checkins
    const checkin = checkins.find(c => c.player_id === playerId);
    if (checkin) {
      await supabase.from('tournament_checkins').delete().eq('id', checkin.id);
    }
    // Reset current game (forfeit) and regenerate with remaining players
    const { data: freshCheckins } = await supabase.from('tournament_checkins').select('*, players(*)').eq('session_id', dbSession.id);
    const remaining = (freshCheckins || []).map(c => c.players).filter(Boolean);

    if (remaining.length < 4) {
      await supabase.from('tournament_sessions').update({
        status: 'completed',
        team1_p1: null, team1_p2: null, team2_p1: null, team2_p2: null,
      }).eq('id', dbSession.id);
      toast(`${getName(playerId)} is out. Not enough players to continue.`);
      loadData();
      return;
    }

    const { data: sg } = await supabase.from('games').select('*').eq('tournament_session_id', dbSession.id);
    const lastMatchup = (sg || []).length > 0 ? sg[sg.length - 1] : null;
    const result = pickTeams(remaining, players, games, sg || [], lastMatchup);

    if (!result) {
      toast(`${getName(playerId)} is out.`);
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

    toast(`${getName(playerId)} is out. New game generated!`);
    loadData();
  }

  async function addPlayerMidSession(playerId) {
    if (!dbSession) return;
    await supabase.from('tournament_checkins').insert({ session_id: dbSession.id, player_id: playerId });
    toast(`${getName(playerId)} added to the session!`);
    loadData();
  }
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
      setBagForecast(data.content?.[0]?.text || 'The oracle is offline. Just play.');
    } catch { setBagForecast('The oracle is offline. Just play.'); }
    setForecastLoading(false);
  }

  const myCheckin = checkins.find(c => c.player_id === myPlayerId);
  const isInProgress = dbSession?.status === 'in_progress';
  const isOpen = !dbSession || dbSession?.status === 'open';
  const isCompleted = dbSession?.status === 'completed';

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>Loading...</div>;

  return (
    <div>
      {showUnlockPin && (
        <PinModal title="Unlock session?" onConfirm={() => { setShowUnlockPin(false); unlockSession(); }} onCancel={() => setShowUnlockPin(false)} />
      )}

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
                <Avatar name={p.name} index={i} size={20} avatarId={p.avatar_id} />{p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {myPlayerId && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Avatar name={getName(myPlayerId)} index={getIndex(myPlayerId)} size={24} avatarId={getAvatar(myPlayerId)} />
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Playing as <strong style={{ color: 'var(--text)' }}>{getName(myPlayerId)}</strong></span>
          <button className="btn btn-sm" onClick={() => { setMyPlayerId(''); localStorage.removeItem('myPlayerId'); }} style={{ marginLeft: 'auto' }}>Change</button>
        </div>
      )}

      {!showSession ? (
        <div className="card"><div className="empty">{!isWeekday() ? 'No tournament today — see you Monday! 🎯' : 'No active session right now.'}</div></div>
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

              {/* Test mode simulate button */}
              {testMode && players.length >= 4 && (
                <button className="btn btn-primary" onClick={async () => {
                  const s = await ensureSession();
                  if (!s) return;
                  // Check in first 4+ players
                  const toCheckin = players.slice(0, Math.min(6, players.length));
                  for (const p of toCheckin) {
                    const already = checkins.find(c => c.player_id === p.id);
                    if (!already) {
                      await supabase.from('tournament_checkins').insert({ session_id: s.id, player_id: p.id });
                    }
                  }
                  await loadData();
                  toast('Players checked in — now lock the session!');
                }} style={{ width: '100%', marginBottom: 8 }}>
                  🧪 Simulate Check-in ({Math.min(6, players.length)} players)
                </button>
              )}

              {checkins.length > 0 && (
                <>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 8 }}>Checked in ({checkins.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {checkins.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 99, fontSize: 13 }}>
                        <Avatar name={c.players?.name} index={getIndex(c.player_id)} size={18} avatarId={c.players?.avatar_id} />{c.players?.name}
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
          {(isInProgress || isCompleted) && dbSession?.team1_p1 && !showLogForm && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    {isCompleted ? '✅ Session Complete' : '🎯 Now Playing'}
                  </div>
                  {sessionTimer && <div style={{ fontSize: 12, color: sessionWindow && sessionWindow.minutesLeft < 5 ? 'var(--red)' : 'var(--text3)' }}>⏱ {sessionTimer}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {isInProgress && <button className="btn btn-sm" onClick={() => setShowUnlockPin(true)} style={{ fontSize: 11 }}>🔓 Unlock</button>}
                  <div style={{ fontSize: 11, color: 'var(--text3)', alignSelf: 'center' }}>Game {sessionGames.length + (isInProgress ? 1 : 0)}</div>
                </div>
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
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} avatarId={getAvatar(id)} />
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{getName(id)}</span>
                      {isInProgress && (
                        <button className="btn btn-sm btn-danger" style={{ fontSize: 10, padding: '0 6px', height: 22 }}
                          onClick={() => {
                            if (window.confirm(`Mark ${getName(id)} as out? The current game will be forfeited.`)) {
                              markPlayerOut(id);
                            }
                          }}>Out</button>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text3)', textAlign: 'center' }}>VS</div>
                <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid rgba(76,175,130,0.3)' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--green)', marginBottom: 8 }}>Team 2</div>
                  {[dbSession.team2_p1, dbSession.team2_p2].map(id => (
                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Avatar name={getName(id)} index={getIndex(id)} size={22} avatarId={getAvatar(id)} />
                      <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{getName(id)}</span>
                      {isInProgress && (
                        <button className="btn btn-sm btn-danger" style={{ fontSize: 10, padding: '0 6px', height: 22 }}
                          onClick={() => {
                            if (window.confirm(`Mark ${getName(id)} as out? The current game will be forfeited.`)) {
                              markPlayerOut(id);
                            }
                          }}>Out</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add player mid-session */}
              {isInProgress && (() => {
                const activePlayers = new Set(checkins.map(c => c.player_id));
                const available = players.filter(p => !activePlayers.has(p.id));
                if (available.length === 0) return null;
                return (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 6 }}>Add player</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {available.map(p => (
                        <button key={p.id} className="btn btn-sm" onClick={() => addPlayerMidSession(p.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Avatar name={p.name} index={players.indexOf(p)} size={16} avatarId={p.avatar_id} />
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {isInProgress && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={getBagForecast} disabled={forecastLoading} style={{ flex: 1 }}>
                    {forecastLoading ? 'Consulting...' : '🔮 Forecast'}
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowLogForm(true)} style={{ flex: 1 }}>
                    📝 Log Result
                  </button>
                </div>
              )}

              {bagForecast && (
                <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginTop: 10, padding: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
                  🔮 {bagForecast}
                </div>
              )}
            </div>
          )}

          {/* Log form */}
          {showLogForm && dbSession && (
            <TournamentLogForm
              dbSession={dbSession}
              players={players}
              games={games}
              onSubmit={handleGameLogged}
              onCancel={() => setShowLogForm(false)}
            />
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
              {players.filter(p => weeklyStandings[p.id]?.wins + weeklyStandings[p.id]?.losses > 0)
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
                          <Avatar name={p.name} index={players.indexOf(p)} size={22} avatarId={p.avatar_id} />{p.name}
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
