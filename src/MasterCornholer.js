import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getWeekStart, getWeekEnd, getWeeklyStats, determineAwardWinners, buildPlayerStats } from './tournament';

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

function AwardCard({ emoji, title, player, description, color = 'var(--accent)', players, games, statLine }) {
  if (!player) return null;
  const index = players.findIndex(p => p.id === player.id);
  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${color}22`, borderRadius: 'var(--radius)', padding: '1rem 1.25rem', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: description ? 8 : 0 }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 2 }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color, lineHeight: 1 }}>{player.name}</div>
          {statLine && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{statLine}</div>}
        </div>
        <Avatar name={player.name} index={index} size={36} />
      </div>
      {description && (
        <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.5, borderTop: `1px solid var(--border)`, paddingTop: 8 }}>
          "{description}"
        </div>
      )}
    </div>
  );
}

async function generateAwardDescription(type, player, stats, allPlayers, games) {
  const s = stats[player.id];
  const total = s.wins + s.losses;
  const pct = total > 0 ? Math.round(s.wins / total * 100) : 0;

  const prompts = {
    master: `You're writing a mock sports awards show blurb for the weekly "Master Cornholer" award. The winner is ${player.name} with ${s.wins} wins, ${s.losses} losses (${pct}% win rate), ${s.hole} bags in the hole, and ${s.mvps} MVPs this week. Write 1-2 sentences that hype them up in the most ridiculous, over-the-top way possible using their real stats. No quotes, no emojis.`,
    clown: `You're writing a mock sports awards show blurb for the weekly "Cornhole Clown" award — given to the worst player. The "winner" is ${player.name} with ${s.wins} wins, ${s.losses} losses (${pct}% win rate), ${s.hole} bags in the hole this week. Roast them mercilessly using their actual stats. Be savage but funny. 1-2 sentences. No quotes, no emojis.`,
    bagWhisperer: `Write a 1 sentence hype blurb for ${player.name} who got the most holes in a single game this week (${s.bestHoleGame} holes). Make it sound legendary. No quotes, no emojis.`,
    boardHugger: `Write a 1 sentence roast for ${player.name} who had the most bags land on the board but barely any in the hole this week. Mock their inability to actually score. No quotes, no emojis.`,
    onFire: `Write a 1 sentence hype for ${player.name} who had the most wins this week (${s.wins}). Short and punchy. No quotes, no emojis.`,
    iceCold: `Write a 1 sentence roast for ${player.name} who had the most losses this week (${s.losses}). Be mean but funny. No quotes, no emojis.`,
    soClose: `Write a 1 sentence roast for ${player.name} who lost the most games by just 1-2 points this week (${s.closelosses} close losses). Mock their inability to close. No quotes, no emojis.`,
  };

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
        messages: [{ role: 'user', content: prompts[type] }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch (e) {
    return null;
  }
}

export default function MasterCornholer({ players, games }) {
  const [weeklyStats, setWeeklyStats] = useState({});
  const [awards, setAwards] = useState(null);
  const [descriptions, setDescriptions] = useState({});
  const [archivedWeeks, setArchivedWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loadingDesc, setLoadingDesc] = useState(false);

  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd(weekStart);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  useEffect(() => {
    async function load() {
      const stats = await getWeeklyStats(weekStart, players, games);
      setWeeklyStats(stats);
      const awardWinners = determineAwardWinners(stats, players);
      setAwards(awardWinners);

      // Load archived weeks
      const { data: archived } = await supabase
        .from('weekly_awards')
        .select('*, master:master_player_id(name), clown:clown_player_id(name)')
        .order('week_start', { ascending: false })
        .limit(12);
      setArchivedWeeks(archived || []);

      // Generate descriptions for main awards
      if (awardWinners.master || awardWinners.clown) {
        setLoadingDesc(true);
        const descs = {};
        const toGenerate = [
          ['master', awardWinners.master],
          ['clown', awardWinners.clown],
          ['bagWhisperer', awardWinners.bagWhisperer],
          ['boardHugger', awardWinners.boardHugger],
          ['onFire', awardWinners.onFire],
          ['iceCold', awardWinners.iceCold],
          ['soClose', awardWinners.soClose],
        ].filter(([, p]) => p);

        await Promise.all(toGenerate.map(async ([type, player]) => {
          const desc = await generateAwardDescription(type, player, stats, players, games);
          if (desc) descs[type] = desc;
        }));
        setDescriptions(descs);
        setLoadingDesc(false);
      }
    }
    if (players.length > 0) load();
  }, [players, games]);

  const getStatLine = (type, player) => {
    if (!player || !weeklyStats[player.id]) return '';
    const s = weeklyStats[player.id];
    const total = s.wins + s.losses;
    const pct = total > 0 ? Math.round(s.wins / total * 100) : 0;
    switch (type) {
      case 'master': return `${s.wins}W ${s.losses}L · ${pct}% · ${s.mvps} MVPs`;
      case 'clown': return `${s.wins}W ${s.losses}L · ${pct}% · ${s.hole} holes`;
      case 'bagWhisperer': return `${s.bestHoleGame} holes in best game`;
      case 'boardHugger': return `${s.board} on board · ${s.hole} holes`;
      case 'onFire': return `${s.wins} wins this week`;
      case 'iceCold': return `${s.losses} losses this week`;
      case 'soClose': return `${s.closelosses} losses by ≤2 pts`;
      default: return '';
    }
  };

  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 12 }}>
        Week of {weekLabel} · Resets Monday
      </div>

      {(!awards || Object.values(awards).every(v => !v)) ? (
        <div className="card"><div className="empty">No games played this week yet.</div></div>
      ) : (
        <>
          {loadingDesc && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>✍️ Generating award descriptions...</div>
          )}

          <AwardCard emoji="🏆" title="Master Cornholer" player={awards?.master}
            description={descriptions.master} color="var(--accent)"
            players={players} games={games} statLine={getStatLine('master', awards?.master)} />

          <AwardCard emoji="🤡" title="Cornhole Clown" player={awards?.clown}
            description={descriptions.clown} color="var(--red)"
            players={players} games={games} statLine={getStatLine('clown', awards?.clown)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { type: 'bagWhisperer', emoji: '🎯', title: 'Bag Whisperer', color: 'var(--green)' },
              { type: 'boardHugger', emoji: '🪵', title: 'Board Hugger', color: 'var(--text2)' },
              { type: 'onFire', emoji: '🔥', title: 'On Fire', color: '#ff7043' },
              { type: 'iceCold', emoji: '🧊', title: 'Ice Cold', color: '#4fc3f7' },
              { type: 'soClose', emoji: '😤', title: 'So Close', color: 'var(--red)' },
            ].map(({ type, emoji, title, color }) => {
              const player = awards?.[type];
              if (!player) return null;
              const index = players.findIndex(p => p.id === player.id);
              return (
                <div key={type} style={{ background: 'var(--surface)', border: `1px solid ${color}22`, borderRadius: 'var(--radius)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 2 }}>{title}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color, lineHeight: 1, marginBottom: 4 }}>{player.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{getStatLine(type, player)}</div>
                  {descriptions[type] && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.4 }}>"{descriptions[type]}"</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Archived weeks */}
      {archivedWeeks.length > 0 && (
        <div className="card">
          <div className="card-title">Past Weeks</div>
          {archivedWeeks.map(w => (
            <div key={w.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onClick={() => setSelectedWeek(selectedWeek?.id === w.id ? null : w)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {new Date(w.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(w.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  🏆 {w.master?.name} · 🤡 {w.clown?.name}
                </div>
              </div>
              {selectedWeek?.id === w.id && (
                <div style={{ marginTop: 10 }}>
                  {w.master_description && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                      <strong style={{ color: 'var(--accent)' }}>🏆 {w.master?.name}:</strong> "{w.master_description}"
                    </div>
                  )}
                  {w.clown_description && (
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      <strong style={{ color: 'var(--red)' }}>🤡 {w.clown?.name}:</strong> "{w.clown_description}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
