import React, { useState } from 'react';
import { supabase } from './supabase';
import { AVATARS, AvatarPicker } from './Avatars';

export default function Onboarding({ players, onComplete }) {
  const [step, setStep] = useState('welcome'); // welcome, pick-player, pick-avatar
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState('corn');
  const [saving, setSaving] = useState(false);

  async function finish() {
    if (!selectedPlayer) return;
    setSaving(true);
    await supabase.from('players').update({ avatar_id: selectedAvatar, onboarded: true }).eq('id', selectedPlayer.id);
    localStorage.setItem('myPlayerId', selectedPlayer.id);
    localStorage.setItem('onboarded', 'true');
    onComplete(selectedPlayer.id, selectedAvatar);
  }

  if (step === 'welcome') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <svg width="80" height="115" viewBox="0 0 90 145" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '1.5rem' }}>
          <rect x="0" y="0" width="90" height="145" rx="10" fill="#8B5E2A" stroke="#6B3F10" strokeWidth="3"/>
          <circle cx="45" cy="48" r="19" fill="#1a0f00" stroke="#3a2000" strokeWidth="2"/>
          <rect x="58" y="88" width="22" height="22" rx="4" fill="#e8c547" stroke="#c9a832" strokeWidth="1.5" transform="rotate(-15, 69, 99)"/>
          <rect x="20" y="105" width="22" height="22" rx="4" fill="#e05c5c" stroke="#b83c3c" strokeWidth="1.5" transform="rotate(10, 31, 116)"/>
        </svg>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--accent)', letterSpacing: 2, marginBottom: 8 }}>CORNHOLE</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: '2.5rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Work Break Tracker</div>
        <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 320 }}>
          Track games, tournament results, weekly awards, and trash talk — all in one place.
        </div>
        <button className="btn btn-primary" onClick={() => setStep('pick-player')} style={{ width: '100%', maxWidth: 280, height: 48, fontSize: 15 }}>
          Get Started →
        </button>
      </div>
    );
  }

  if (step === 'pick-player') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', marginBottom: 4 }}>Who are you?</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: '1.5rem' }}>Pick your name from the roster.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
            {players.map(p => (
              <button key={p.id} className="btn" onClick={() => setSelectedPlayer(p)}
                style={{ height: 52, fontSize: 15, borderColor: selectedPlayer?.id === p.id ? 'var(--accent)' : undefined, color: selectedPlayer?.id === p.id ? 'var(--accent)' : undefined, justifyContent: 'flex-start', paddingLeft: 16 }}>
                {p.name}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setStep('pick-avatar')} disabled={!selectedPlayer} style={{ width: '100%', height: 48 }}>
            Next → Pick Avatar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'pick-avatar') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--accent)', marginBottom: 4 }}>Pick your avatar</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: '1.5rem' }}>You can change this anytime in Players.</div>
          <AvatarPicker currentAvatarId={selectedAvatar} onSelect={setSelectedAvatar} />
          <button className="btn btn-primary" onClick={finish} disabled={saving} style={{ width: '100%', height: 48, marginTop: '1.5rem' }}>
            {saving ? 'Saving...' : "Let's Play! 🎯"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
