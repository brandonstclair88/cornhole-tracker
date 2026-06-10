import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AvatarDisplay } from './Avatars';

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function PinModal({ onConfirm, onCancel }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleDigit(d) {
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        if (next === '4399') { onConfirm(); }
        else { setError('Wrong PIN'); setPin(''); }
      }
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', width: '100%', maxWidth: 300 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)', marginBottom: 12 }}>Enter PIN</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 40, height: 48, border: '1px solid var(--border2)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--accent)' }}>
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>
        {error && <div style={{ color: 'var(--red)', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} className="btn" onClick={() => handleDigit(String(d))} style={{ height: 48, fontSize: 20, fontFamily: 'var(--font-display)' }}>{d}</button>
          ))}
          <div/>
          <button className="btn" onClick={() => handleDigit('0')} style={{ height: 48, fontSize: 20, fontFamily: 'var(--font-display)' }}>0</button>
          <button className="btn" onClick={() => setPin(p => p.slice(0,-1))} style={{ height: 48, fontSize: 16 }}>⌫</button>
        </div>
        <button className="btn" onClick={onCancel} style={{ width: '100%' }}>Cancel</button>
      </div>
    </div>
  );
}

function GameCard({ game, players, onDelete }) {
  const [showPin, setShowPin] = useState(false);
  const t1win = game.t1_score > game.t2_score;
  const getName = id => players.find(p => p.id === id)?.name || '?';
  const getAvatar = id => { const p = players.find(pl => pl.id === id); return { avatarId: p?.avatar_id, index: players.indexOf(p) }; };

  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: 8, border: '1px solid var(--border)' }}>
      {showPin && <PinModal onConfirm={() => { setShowPin(false); onDelete(game.id); }} onCancel={() => setShowPin(false)} />}

      {/* Tournament badge */}
      {game.is_tournament && (
        <div style={{ fontSize: 10, background: 'rgba(232,197,71,0.15)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Tournament</div>
      )}

      {/* Teams and score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, opacity: t1win ? 1 : 0.6 }}>
            <AvatarDisplay avatarId={getAvatar(game.t1_p1).avatarId} playerName={getName(game.t1_p1)} playerIndex={getAvatar(game.t1_p1).index} size={22} />
            <AvatarDisplay avatarId={getAvatar(game.t1_p2).avatarId} playerName={getName(game.t1_p2)} playerIndex={getAvatar(game.t1_p2).index} size={22} />
            <span style={{ fontSize: 13, fontWeight: t1win ? 600 : 400 }}>{getName(game.t1_p1)} & {getName(game.t1_p2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: !t1win ? 1 : 0.6 }}>
            <AvatarDisplay avatarId={getAvatar(game.t2_p1).avatarId} playerName={getName(game.t2_p1)} playerIndex={getAvatar(game.t2_p1).index} size={22} />
            <AvatarDisplay avatarId={getAvatar(game.t2_p2).avatarId} playerName={getName(game.t2_p2)} playerIndex={getAvatar(game.t2_p2).index} size={22} />
            <span style={{ fontSize: 13, fontWeight: !t1win ? 600 : 400 }}>{getName(game.t2_p1)} & {getName(game.t2_p2)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className={`badge ${t1win ? 'badge-win' : 'badge-loss'}`} style={{ fontSize: 14, fontFamily: 'var(--font-display)' }}>{game.t1_score}</span>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>–</span>
          <span className={`badge ${!t1win ? 'badge-win' : 'badge-loss'}`} style={{ fontSize: 14, fontFamily: 'var(--font-display)' }}>{game.t2_score}</span>
        </div>
        <button className="btn btn-sm btn-danger" onClick={() => setShowPin(true)}>✕</button>
      </div>

      {/* MVP */}
      {game.mvp_player_ids?.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 4 }}>
          ⭐ MVP: {game.mvp_player_ids.map(id => getName(id)).join(' & ')}
        </div>
      )}

      {/* Trash talk */}
      {game.trash_talk && (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>"{game.trash_talk}"</div>
      )}
    </div>
  );
}

function DaySection({ date, games, players, onDelete, autoExpand }) {
  const [open, setOpen] = useState(autoExpand);
  const dayName = DAY_NAMES[new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1];
  const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ marginBottom: 8 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer' }}>
        <div>
          <span style={{ fontWeight: 500, color: 'var(--text)' }}>{dayName}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{dateStr}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {games.length > 0 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{games.length} game{games.length !== 1 ? 's' : ''}</span>}
          <span style={{ color: 'var(--text3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ paddingTop: 8 }}>
          {games.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '1rem' }}>No games</div>
          ) : (
            games.map(g => <GameCard key={g.id} game={g} players={players} onDelete={onDelete} />)
          )}
        </div>
      )}
    </div>
  );
}

function WeekSection({ weekStart, weekEnd, games, players, onDelete, autoExpand }) {
  const [open, setOpen] = useState(autoExpand);
  const label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  // Group by day
  const byDay = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    byDay[d.toDateString()] = [];
  }
  games.forEach(g => {
    const d = new Date(g.played_at).toDateString();
    if (byDay[d]) byDay[d].push(g);
  });

  // Find most recent day with games for auto-expand
  const daysWithGames = Object.keys(byDay).filter(d => byDay[d].length > 0);
  const mostRecent = daysWithGames[daysWithGames.length - 1];

  return (
    <div style={{ marginBottom: 12 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', cursor: 'pointer', marginBottom: open ? 8 : 0 }}>
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--accent)' }}>{label}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{games.length} games</span>
        </div>
        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && Object.entries(byDay).map(([dateStr, dayGames]) => (
        <DaySection
          key={dateStr}
          date={dateStr}
          games={dayGames}
          players={players}
          onDelete={onDelete}
          autoExpand={autoExpand && dateStr === mostRecent}
        />
      ))}
    </div>
  );
}

export default function GamesTab({ players, games, onRefresh }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState('');

  async function handleDelete(gameId) {
    if (!window.confirm('Delete this game?')) return;
    await supabase.from('games').delete().eq('id', gameId);
    onRefresh();
  }

  // Filter games
  let filtered = [...games];
  if (filter === 'tournament') filtered = filtered.filter(g => g.is_tournament);
  if (filter === 'casual') filtered = filtered.filter(g => !g.is_tournament);
  if (selectedPlayer) {
    filtered = filtered.filter(g => [g.t1_p1, g.t1_p2, g.t2_p1, g.t2_p2].includes(selectedPlayer));
  }

  // Group by week
  const weeks = {};
  filtered.forEach(g => {
    const d = new Date(g.played_at);
    const ws = getWeekStart(d);
    const key = ws.toISOString();
    if (!weeks[key]) weeks[key] = { weekStart: ws, games: [] };
    weeks[key].games.push(g);
  });

  const weekKeys = Object.keys(weeks).sort((a, b) => new Date(b) - new Date(a));
  const thisWeekStart = getWeekStart();
  const thisWeekKey = thisWeekStart.toISOString();

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'tournament', 'casual'].map(f => (
          <button key={f} className="btn btn-sm" onClick={() => setFilter(f)}
            style={{ borderColor: filter === f ? 'var(--accent)' : undefined, color: filter === f ? 'var(--accent)' : undefined, textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Player search */}
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label>Filter by player</label>
        <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)}>
          <option value="">All players</option>
          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><div className="empty">No games found.</div></div>
      ) : (
        weekKeys.map(key => {
          const { weekStart, games: weekGames } = weeks[key];
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const isThisWeek = key === thisWeekKey;
          return (
            <WeekSection
              key={key}
              weekStart={weekStart}
              weekEnd={weekEnd}
              games={weekGames}
              players={players}
              onDelete={handleDelete}
              autoExpand={isThisWeek}
            />
          );
        })
      )}
    </div>
  );
}
