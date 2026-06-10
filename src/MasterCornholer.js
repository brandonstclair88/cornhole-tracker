import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AvatarDisplay } from './Avatars';

function Avatar({ name, index, size = 28, avatarId }) {
  return <AvatarDisplay avatarId={avatarId} playerName={name} playerIndex={index} size={size} />;
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(ws) {
  const d = new Date(ws);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

// 60% win rate + 40% points per game composite score
function compositeScore(wins, losses, totalPts, gamesPlayed) {
  if (gamesPlayed === 0) return 0;
  const winPct = wins / (wins + losses);
  const ptsPerGame = totalPts / gamesPlayed;
  const maxPtsPerGame = 11; // normalize against max score
  return (winPct * 0.6) + ((ptsPerGame / maxPtsPerGame) * 0.4);
}

async function generateAwardDescription(type, player, stats) {
  const s = stats[player.id];
  const total = s.wins + s.losses;
  const pct = total > 0 ? Math.round(s.wins / total * 100) : 0;
  const ptsPerGame = total > 0 ? (s.pts / total).toFixed(1) : 0;

  const prompts = {
    master: `Write a 1-2 sentence mock sports awards blurb for the weekly "Master Cornholer" award. Winner: ${player.name}, ${s.wins}W-${s.losses}L (${pct}% win rate), ${ptsPerGame} pts/game, ${s.mvps || 0} MVPs. Hype them up outrageously using their real stats. No quotes, no emojis.`,
    clown: `Write a 1-2 sentence roast for the weekly "Cornhole Clown" award — given to the worst player. "Winner": ${player.name}, ${s.wins}W-${s.losses}L (${pct}% win rate), ${ptsPerGame} pts/game. Be savage but funny using their actual stats. No quotes, no emojis.`,
  };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.REACT_APP_ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 100, temperature: 1.0, messages: [{ role: 'user', content: prompts[type] }] })
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch { return null; }
}

export default function MasterCornholer({ players, games }) {
  const [weeklyStats, setWeeklyStats] = useState({});
  const [rankedPlayers, setRankedPlayers] = useState([]);
  const [descriptions, setDescriptions] = useState({});
  const [archivedWeeks, setArchivedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [streaks, setStreaks] = useState({});

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  useEffect(() => {
    if (!players.length) return;

    // Build weekly stats from tournament games only
    const weekGames = games.filter(g => g.is_tournament && new Date(g.played_at) >= weekStart && new Date(g.played_at) <= weekEnd);
    const stats = {};
    players.forEach(p => { stats[p.id] = { wins: 0, losses: 0, pts: 0, hole: 0, board: 0, mvps: 0, gamesPlayed: 0 }; });

    weekGames.forEach(g => {
      const t1win = g.t1_score > g.t2_score;
      [[g.t1_p1, g.t1_p2], [g.t2_p1, g.t2_p2]].forEach((team, ti) => {
        const isT1 = ti === 0;
        const won = isT1 ? t1win : !t1win;
        team.forEach(pid => {
          if (!stats[pid]) return;
          stats[pid].gamesPlayed++;
          if (won) stats[pid].wins++; else stats[pid].losses++;
          stats[pid].pts += isT1 ? g.t1_score : g.t2_score;
        });
      });
      const playerBags = { [g.t1_p1]: { h: g.t1_p1_hole||0, b: g.t1_p1_board||0 }, [g.t1_p2]: { h: g.t1_p2_hole||0, b: g.t1_p2_board||0 }, [g.t2_p1]: { h: g.t2_p1_hole||0, b: g.t2_p1_board||0 }, [g.t2_p2]: { h: g.t2_p2_hole||0, b: g.t2_p2_board||0 } };
      Object.entries(playerBags).forEach(([pid, bags]) => { if (stats[pid]) { stats[pid].hole += bags.h; stats[pid].board += bags.b; } });
      if (g.mvp_player_ids) g.mvp_player_ids.forEach(pid => { if (stats[pid]) stats[pid].mvps++; });
    });

    setWeeklyStats(stats);

    // Rank players — min 2 games, composite score
    const eligible = players.filter(p => stats[p.id]?.gamesPlayed >= 2);
    const ranked = [...eligible].sort((a, b) => {
      const sa = stats[a.id], sb = stats[b.id];
      const ca = compositeScore(sa.wins, sa.losses, sa.pts, sa.gamesPlayed);
      const cb = compositeScore(sb.wins, sb.losses, sb.pts, sb.gamesPlayed);
      if (Math.abs(cb - ca) > 0.001) return cb - ca;
      return (sb.mvps || 0) - (sa.mvps || 0);
    });
    setRankedPlayers(ranked);

    // Load archived weeks and calculate streaks
    async function loadArchived() {
      const { data } = await supabase.from('weekly_awards').select('*, master:master_player_id(name, id), clown:clown_player_id(name, id)').order('week_start', { ascending: false }).limit(12);
      setArchivedWeeks(data || []);

      // Calculate win streaks
      const streakMap = {};
      if (data) {
        const sorted = [...data].sort((a, b) => new Date(b.week_start) - new Date(a.week_start));
        players.forEach(p => {
          let streak = 0;
          for (const w of sorted) {
            if (w.master?.id === p.id) streak++;
            else break;
          }
          if (streak > 0) streakMap[p.id] = streak;
        });
      }
      setStreaks(streakMap);

      // Generate AI descriptions for top and bottom
      if (ranked.length >= 1) {
        setLoadingDesc(true);
        const descs = {};
        const master = ranked[0];
        const clown = ranked[ranked.length - 1];
        if (master && clown && master.id !== clown.id) {
          const [md, cd] = await Promise.all([
            generateAwardDescription('master', master, stats),
            generateAwardDescription('clown', clown, stats),
          ]);
          if (md) descs['master'] = md;
          if (cd) descs['clown'] = cd;
        }
        setDescriptions(descs);
        setLoadingDesc(false);
      }
    }
    loadArchived();
  }, [players.length, games.length]);

  const PLACE_CONFIG = [
    { label: '🏆 Master Cornholer', color: 'var(--accent)', key: 'master' },
    { label: '🥈 2nd Place', color: '#aaa', key: null },
    { label: '🥉 3rd Place', color: '#cd7f32', key: null },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 12 }}>
        Week of {weekLabel} · Tournament games only · Min 2 games
      </div>

      {rankedPlayers.length === 0 ? (
        <div className="card"><div className="empty">No eligible players yet — need at least 2 tournament games each.</div></div>
      ) : (
        <>
          {loadingDesc && <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>✍️ Writing award descriptions...</div>}

          {/* Top 3 */}
          {PLACE_CONFIG.map(({ label, color, key }, i) => {
            const player = rankedPlayers[i];
            if (!player) return null;
            const s = weeklyStats[player.id];
            const total = s.wins + s.losses;
            const pct = total ? Math.round(s.wins / total * 100) : 0;
            const ptsPerGame = total ? (s.pts / total).toFixed(1) : 0;
            const streak = streaks[player.id];
            return (
              <div key={i} className="card" style={{ border: `1px solid ${color}33` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: descriptions[key] ? 10 : 0 }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{label.split(' ')[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 2 }}>{label.slice(3)}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color, lineHeight: 1 }}>
                      {player.name}
                      {streak > 1 && <span style={{ fontSize: 14, color: 'var(--accent)', marginLeft: 8 }}>🔥 {streak}wk</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.wins}W {s.losses}L · {pct}% · {ptsPerGame} pts/game · {s.mvps} MVPs</div>
                  </div>
                  <Avatar name={player.name} index={players.indexOf(player)} size={40} avatarId={player.avatar_id} />
                </div>
                {descriptions[key] && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>"{descriptions[key]}"</div>
                )}
              </div>
            );
          })}

          {/* Cornhole Clown */}
          {rankedPlayers.length >= 2 && (() => {
            const clown = rankedPlayers[rankedPlayers.length - 1];
            const s = weeklyStats[clown.id];
            const total = s.wins + s.losses;
            const pct = total ? Math.round(s.wins / total * 100) : 0;
            const ptsPerGame = total ? (s.pts / total).toFixed(1) : 0;
            return (
              <div className="card" style={{ border: '1px solid rgba(224,92,92,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: descriptions['clown'] ? 10 : 0 }}>
                  <div style={{ fontSize: 28, lineHeight: 1 }}>🤡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 2 }}>Cornhole Clown</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--red)', lineHeight: 1 }}>{clown.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{s.wins}W {s.losses}L · {pct}% · {ptsPerGame} pts/game</div>
                  </div>
                  <Avatar name={clown.name} index={players.indexOf(clown)} size={40} avatarId={clown.avatar_id} />
                </div>
                {descriptions['clown'] && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: 8 }}>"{descriptions['clown']}"</div>
                )}
              </div>
            );
          })()}

          {/* Full rankings */}
          {rankedPlayers.length > 1 && (
            <div className="card">
              <div className="card-title">Weekly Rankings</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>{['#','Player','W','L','Win%','Pts/G','MVP'].map(h => (
                    <th key={h} style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {rankedPlayers.map((p, i) => {
                    const s = weeklyStats[p.id];
                    const total = s.wins + s.losses;
                    const pct = total ? Math.round(s.wins / total * 100) : 0;
                    const ppg = total ? (s.pts / total).toFixed(1) : 0;
                    return (
                      <tr key={p.id}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 16, color: i === 0 ? 'var(--accent)' : 'var(--text3)' }}>{i + 1}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar name={p.name} index={players.indexOf(p)} size={22} avatarId={p.avatar_id} />{p.name}
                          </div>
                        </td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}><span style={{ background: 'rgba(76,175,130,0.15)', color: 'var(--green)', padding: '2px 7px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{s.wins}</span></td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}><span style={{ background: 'rgba(224,92,92,0.12)', color: 'var(--red)', padding: '2px 7px', borderRadius: 3, fontSize: 12, fontWeight: 600 }}>{s.losses}</span></td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>{pct}%</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>{ppg}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', color: s.mvps > 0 ? 'var(--accent)' : 'var(--text3)' }}>{s.mvps > 0 ? `⭐${s.mvps}` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Archived weeks */}
      {archivedWeeks.length > 0 && (
        <div className="card">
          <div className="card-title">Past Weeks</div>
          {archivedWeeks.map(w => (
            <div key={w.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedWeek(selectedWeek?.id === w.id ? null : w)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(w.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  🏆 {w.master?.name} · 🤡 {w.clown?.name}
                </div>
              </div>
              {selectedWeek?.id === w.id && (
                <div style={{ marginTop: 8 }}>
                  {w.master_description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}><strong style={{ color: 'var(--accent)' }}>🏆 {w.master?.name}:</strong> "{w.master_description}"</div>}
                  {w.clown_description && <div style={{ fontSize: 12, color: 'var(--text2)' }}><strong style={{ color: 'var(--red)' }}>🤡 {w.clown?.name}:</strong> "{w.clown_description}"</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
