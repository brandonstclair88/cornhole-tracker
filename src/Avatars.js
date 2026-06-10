import React from 'react';

export const AVATARS = {
  corn: {
    name: 'Cool Corn',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FFD93D"/>
        <ellipse cx="32" cy="36" rx="14" ry="20" fill="#F4A261"/>
        <circle cx="26" cy="28" r="4" fill="#FFD93D" stroke="#e8a020" strokeWidth="1"/>
        <circle cx="32" cy="25" r="4" fill="#FFD93D" stroke="#e8a020" strokeWidth="1"/>
        <circle cx="38" cy="28" r="4" fill="#FFD93D" stroke="#e8a020" strokeWidth="1"/>
        <circle cx="26" cy="36" r="4" fill="#FFD93D" stroke="#e8a020" strokeWidth="1"/>
        <circle cx="32" cy="33" r="4" fill="#FFD93D" stroke="#e8a020" strokeWidth="1"/>
        <circle cx="38" cy="36" r="4" fill="#FFD93D" stroke="#e8a020" strokeWidth="1"/>
        <rect x="18" y="26" width="10" height="7" rx="3" fill="#1a1a2e"/>
        <rect x="36" y="26" width="10" height="7" rx="3" fill="#1a1a2e"/>
        <path d="M22 44 Q32 50 42 44" stroke="#c47a00" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M18 28 Q8 18 12 10 Q20 22 18 28Z" fill="#4CAF50"/>
        <path d="M46 28 Q56 18 52 10 Q44 22 46 28Z" fill="#4CAF50"/>
      </svg>
    )
  },
  flame: {
    name: 'On Fire',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#1a1a2e"/>
        <path d="M32 58 Q18 48 20 36 Q23 26 17 16 Q27 28 29 20 Q31 30 32 22 Q33 30 35 20 Q37 28 47 16 Q41 26 44 36 Q46 48 32 58Z" fill="#E76F51"/>
        <path d="M32 54 Q22 46 24 36 Q27 28 32 24 Q37 28 40 36 Q42 46 32 54Z" fill="#FFD93D"/>
        <circle cx="27" cy="38" r="3.5" fill="#1a1a2e"/>
        <circle cx="37" cy="38" r="3.5" fill="#1a1a2e"/>
        <path d="M26 46 Q32 51 38 46" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  frog: {
    name: 'Frog King',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#4CAF50"/>
        <circle cx="22" cy="18" r="8" fill="#66BB6A"/>
        <circle cx="42" cy="18" r="8" fill="#66BB6A"/>
        <circle cx="22" cy="18" r="5" fill="#fff"/>
        <circle cx="42" cy="18" r="5" fill="#fff"/>
        <circle cx="22" cy="18" r="3" fill="#1a1a2e"/>
        <circle cx="42" cy="18" r="3" fill="#1a1a2e"/>
        <ellipse cx="32" cy="38" rx="18" ry="16" fill="#66BB6A"/>
        <path d="M20 40 Q32 50 44 40" stroke="#2E7D32" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M30 20 L32 12 L34 20" fill="#FFD93D"/>
        <path d="M26 20 L28 14 L30 20" fill="#FFD93D"/>
        <path d="M34 20 L36 14 L38 20" fill="#FFD93D"/>
      </svg>
    )
  },
  robot: {
    name: 'Robo Toss',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#90A4AE"/>
        <rect x="16" y="18" width="32" height="26" rx="4" fill="#607D8B"/>
        <rect x="20" y="22" width="10" height="7" rx="2" fill="#4FC3F7"/>
        <rect x="34" y="22" width="10" height="7" rx="2" fill="#4FC3F7"/>
        <rect x="20" y="32" width="24" height="5" rx="2" fill="#455A64"/>
        <line x1="26" y1="32" x2="26" y2="37" stroke="#607D8B" strokeWidth="1"/>
        <line x1="32" y1="32" x2="32" y2="37" stroke="#607D8B" strokeWidth="1"/>
        <line x1="38" y1="32" x2="38" y2="37" stroke="#607D8B" strokeWidth="1"/>
        <line x1="32" y1="18" x2="32" y2="10" stroke="#90A4AE" strokeWidth="2.5"/>
        <circle cx="32" cy="8" r="3.5" fill="#E76F51"/>
        <rect x="16" y="44" width="32" height="16" rx="3" fill="#607D8B"/>
        <line x1="48" y1="28" x2="58" y2="20" stroke="#607D8B" strokeWidth="5" strokeLinecap="round"/>
        <rect x="55" y="15" width="9" height="9" rx="2" fill="#E76F51"/>
      </svg>
    )
  },
  shark: {
    name: 'Bag Shark',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#4FC3F7"/>
        <ellipse cx="32" cy="38" rx="20" ry="16" fill="#90A4AE"/>
        <ellipse cx="32" cy="34" rx="18" ry="16" fill="#90A4AE"/>
        <path d="M32 16 L38 28 L26 28Z" fill="#78909C"/>
        <ellipse cx="32" cy="40" rx="12" ry="10" fill="#fff"/>
        <circle cx="24" cy="30" r="5" fill="#fff"/>
        <circle cx="40" cy="30" r="5" fill="#fff"/>
        <circle cx="24" cy="30" r="3" fill="#1a1a2e"/>
        <circle cx="40" cy="30" r="3" fill="#1a1a2e"/>
        <path d="M22 42 Q32 50 42 42" fill="#fff"/>
        <line x1="26" y1="42" x2="25" y2="48" stroke="#78909C" strokeWidth="1"/>
        <line x1="32" y1="44" x2="32" y2="50" stroke="#78909C" strokeWidth="1"/>
        <line x1="38" y1="42" x2="39" y2="48" stroke="#78909C" strokeWidth="1"/>
        <rect x="26" y="44" width="12" height="7" rx="2" fill="#E76F51"/>
      </svg>
    )
  },
  cowboy: {
    name: 'Cowboy',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#F4A261"/>
        <ellipse cx="32" cy="20" rx="22" ry="6" fill="#8B5E2A"/>
        <rect x="18" y="8" width="28" height="14" rx="3" fill="#6B3F10"/>
        <rect x="18" y="18" width="28" height="4" fill="#E76F51"/>
        <circle cx="32" cy="36" r="16" fill="#FDBCB4"/>
        <circle cx="26" cy="33" r="3" fill="#fff"/>
        <circle cx="38" cy="33" r="3" fill="#fff"/>
        <circle cx="27" cy="34" r="2" fill="#4a2800"/>
        <circle cx="39" cy="34" r="2" fill="#4a2800"/>
        <path d="M26 42 Q32 47 38 42" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M24 40 Q26 44 28 40" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M36 40 Q38 44 40 40" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  lion: {
    name: 'The Lion',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FFD93D"/>
        <circle cx="32" cy="32" r="22" fill="#F4A261"/>
        <circle cx="14" cy="20" r="8" fill="#F4A261"/>
        <circle cx="50" cy="20" r="8" fill="#F4A261"/>
        <circle cx="14" cy="20" r="5" fill="#FDBCB4"/>
        <circle cx="50" cy="20" r="5" fill="#FDBCB4"/>
        <circle cx="32" cy="34" r="16" fill="#FDBCB4"/>
        <circle cx="25" cy="30" r="4.5" fill="#fff"/>
        <circle cx="39" cy="30" r="4.5" fill="#fff"/>
        <circle cx="26" cy="31" r="2.5" fill="#4a2800"/>
        <circle cx="40" cy="31" r="2.5" fill="#4a2800"/>
        <ellipse cx="32" cy="37" rx="4" ry="3" fill="#E76F51"/>
        <path d="M26 42 Q32 47 38 42" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  wizard: {
    name: 'Bag Wizard',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#4a0080"/>
        <circle cx="32" cy="36" r="18" fill="#FDBCB4"/>
        <path d="M14 30 Q32 4 50 30Z" fill="#6a00b0"/>
        <ellipse cx="32" cy="30" rx="18" ry="5" fill="#6a00b0"/>
        <circle cx="32" cy="12" r="3" fill="#FFD93D"/>
        <circle cx="25" cy="32" r="4" fill="#fff"/>
        <circle cx="39" cy="32" r="4" fill="#fff"/>
        <circle cx="26" cy="33" r="2.5" fill="#4a0080"/>
        <circle cx="40" cy="33" r="2.5" fill="#4a0080"/>
        <path d="M25 42 Q32 48 39 42" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M20 44 Q18 50 22 54" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M32 46 Q30 52 32 56" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M44 44 Q46 50 42 54" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  skull: {
    name: 'Dead Bag',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#1a1a2e"/>
        <ellipse cx="32" cy="28" rx="18" ry="20" fill="#fff"/>
        <rect x="22" y="42" width="20" height="12" rx="3" fill="#fff"/>
        <line x1="28" y1="42" x2="28" y2="54" stroke="#1a1a2e" strokeWidth="2"/>
        <line x1="32" y1="42" x2="32" y2="54" stroke="#1a1a2e" strokeWidth="2"/>
        <line x1="36" y1="42" x2="36" y2="54" stroke="#1a1a2e" strokeWidth="2"/>
        <ellipse cx="24" cy="26" rx="7" ry="8" fill="#1a1a2e"/>
        <ellipse cx="40" cy="26" rx="7" ry="8" fill="#1a1a2e"/>
        <line x1="20" y1="22" x2="28" y2="30" stroke="#E76F51" strokeWidth="2.5"/>
        <line x1="28" y1="22" x2="20" y2="30" stroke="#E76F51" strokeWidth="2.5"/>
        <line x1="36" y1="22" x2="44" y2="30" stroke="#E76F51" strokeWidth="2.5"/>
        <line x1="44" y1="22" x2="36" y2="30" stroke="#E76F51" strokeWidth="2.5"/>
        <path d="M30 36 L32 40 L34 36Z" fill="#1a1a2e"/>
      </svg>
    )
  },
  eagle: {
    name: 'Eagle Eye',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#4FC3F7"/>
        <circle cx="32" cy="26" r="14" fill="#fff"/>
        <path d="M32 30 L40 34 L32 37Z" fill="#FFD93D"/>
        <circle cx="24" cy="22" r="4" fill="#FFD93D"/>
        <circle cx="40" cy="22" r="4" fill="#FFD93D"/>
        <circle cx="24" cy="22" r="2.5" fill="#1a1a2e"/>
        <circle cx="40" cy="22" r="2.5" fill="#1a1a2e"/>
        <path d="M18 34 Q6 24 10 14 Q18 28 22 32Z" fill="#8B5E2A"/>
        <path d="M46 34 Q58 24 54 14 Q46 28 42 32Z" fill="#8B5E2A"/>
        <ellipse cx="32" cy="46" rx="14" ry="10" fill="#fff"/>
        <rect x="38" y="52" width="9" height="9" rx="2" fill="#E76F51"/>
      </svg>
    )
  },
  fox: {
    name: 'Sly Fox',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#E76F51"/>
        <path d="M16 26 L10 8 L26 20Z" fill="#E76F51"/>
        <path d="M48 26 L54 8 L38 20Z" fill="#E76F51"/>
        <path d="M18 24 L13 12 L25 20Z" fill="#FDBCB4"/>
        <path d="M46 24 L51 12 L39 20Z" fill="#FDBCB4"/>
        <ellipse cx="32" cy="36" rx="18" ry="17" fill="#F4A261"/>
        <ellipse cx="32" cy="42" rx="12" ry="10" fill="#fff"/>
        <circle cx="24" cy="30" r="4.5" fill="#fff"/>
        <circle cx="40" cy="30" r="4.5" fill="#fff"/>
        <circle cx="25" cy="31" r="3" fill="#1a1a2e"/>
        <circle cx="41" cy="31" r="3" fill="#1a1a2e"/>
        <ellipse cx="32" cy="38" rx="3" ry="2.5" fill="#1a1a2e"/>
        <path d="M24 46 Q32 52 40 46" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  lightning: {
    name: 'Lightning',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#1a1a2e"/>
        <path d="M38 8 L22 34 L32 34 L26 58 L46 30 L36 30Z" fill="#FFD93D"/>
        <rect x="6" y="18" width="12" height="12" rx="3" fill="#E76F51" transform="rotate(-15 12 24)"/>
        <circle cx="10" cy="48" r="2.5" fill="#FFD93D"/>
        <circle cx="54" cy="16" r="2.5" fill="#FFD93D"/>
        <circle cx="52" cy="52" r="2" fill="#FFD93D"/>
      </svg>
    )
  },
  pizza: {
    name: 'Pizza Pro',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#E76F51"/>
        <path d="M32 10 L56 54 L8 54Z" fill="#F4A261"/>
        <path d="M32 14 L52 50 L12 50Z" fill="#FFD93D"/>
        <circle cx="32" cy="32" r="4" fill="#E76F51"/>
        <circle cx="22" cy="40" r="3.5" fill="#E76F51"/>
        <circle cx="42" cy="40" r="3.5" fill="#E76F51"/>
        <circle cx="24" cy="28" r="3.5" fill="#fff"/>
        <circle cx="40" cy="28" r="3.5" fill="#fff"/>
        <circle cx="25" cy="29" r="2" fill="#4a2800"/>
        <circle cx="41" cy="29" r="2" fill="#4a2800"/>
        <path d="M24 36 Q32 41 40 36" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  hotdog: {
    name: 'Hot Dog',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FFD93D"/>
        <ellipse cx="32" cy="36" rx="20" ry="12" fill="#D4845A"/>
        <ellipse cx="32" cy="30" rx="20" ry="10" fill="#F4A261"/>
        <ellipse cx="32" cy="42" rx="20" ry="10" fill="#F4A261"/>
        <path d="M14 36 Q18 31 22 36 Q26 41 30 36 Q34 31 38 36 Q42 41 46 36 Q50 31 54 36" stroke="#FFD93D" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="22" cy="27" r="3.5" fill="#fff"/>
        <circle cx="42" cy="27" r="3.5" fill="#fff"/>
        <circle cx="23" cy="28" r="2" fill="#4a2800"/>
        <circle cx="43" cy="28" r="2" fill="#4a2800"/>
        <path d="M24 34 Q32 39 40 34" stroke="#8B5E2A" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <line x1="48" y1="32" x2="58" y2="22" stroke="#F4A261" strokeWidth="4" strokeLinecap="round"/>
        <rect x="55" y="16" width="9" height="9" rx="2" fill="#E76F51"/>
      </svg>
    )
  },
  chicken: {
    name: 'Scared Chicken',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FFD93D"/>
        <ellipse cx="32" cy="44" rx="18" ry="14" fill="#fff"/>
        <circle cx="32" cy="26" r="14" fill="#fff"/>
        <path d="M22 14 Q25 7 28 14 Q30 7 32 14 Q34 7 36 14" fill="#E76F51"/>
        <path d="M32 30 L40 33 L32 36Z" fill="#FFD93D"/>
        <ellipse cx="38" cy="36" rx="3" ry="5" fill="#E76F51"/>
        <circle cx="24" cy="23" r="5" fill="#fff" stroke="#1a1a2e" strokeWidth="1"/>
        <circle cx="40" cy="23" r="5" fill="#fff" stroke="#1a1a2e" strokeWidth="1"/>
        <circle cx="24" cy="23" r="3" fill="#1a1a2e"/>
        <circle cx="40" cy="23" r="3" fill="#1a1a2e"/>
        <path d="M18 20 Q15 25 18 28 Q21 25 18 20Z" fill="#4FC3F7"/>
        <path d="M46 20 Q49 25 46 28 Q43 25 46 20Z" fill="#4FC3F7"/>
      </svg>
    )
  },
  taco: {
    name: 'Taco Tuesday',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FFD93D"/>
        <path d="M8 48 Q32 12 56 48Z" fill="#F4A261"/>
        <path d="M8 48 Q32 24 56 48" stroke="#D4845A" strokeWidth="2" fill="none"/>
        <ellipse cx="32" cy="42" rx="18" ry="8" fill="#4CAF50"/>
        <ellipse cx="24" cy="40" rx="6" ry="5" fill="#E76F51"/>
        <ellipse cx="40" cy="40" rx="6" ry="5" fill="#E76F51"/>
        <ellipse cx="32" cy="38" rx="8" ry="4" fill="#FDBCB4"/>
        <circle cx="22" cy="30" r="3.5" fill="#fff"/>
        <circle cx="42" cy="30" r="3.5" fill="#fff"/>
        <circle cx="23" cy="31" r="2" fill="#4a2800"/>
        <circle cx="43" cy="31" r="2" fill="#4a2800"/>
        <path d="M24 38 Q32 43 40 38" stroke="#8B5E2A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  sunglasses: {
    name: 'Too Cool',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#FFD93D"/>
        <circle cx="32" cy="36" r="20" fill="#FDBCB4"/>
        <rect x="12" y="26" width="18" height="14" rx="6" fill="#1a1a2e"/>
        <rect x="34" y="26" width="18" height="14" rx="6" fill="#1a1a2e"/>
        <line x1="30" y1="33" x2="34" y2="33" stroke="#1a1a2e" strokeWidth="2.5"/>
        <line x1="12" y1="33" x2="6" y2="31" stroke="#1a1a2e" strokeWidth="2.5"/>
        <line x1="52" y1="33" x2="58" y2="31" stroke="#1a1a2e" strokeWidth="2.5"/>
        <path d="M22 48 Q32 55 42 48" stroke="#E76F51" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <rect x="6" y="50" width="10" height="10" rx="2.5" fill="#E76F51" transform="rotate(-10 11 55)"/>
        <rect x="48" y="50" width="10" height="10" rx="2.5" fill="#4CAF50" transform="rotate(10 53 55)"/>
      </svg>
    )
  },
  magician: {
    name: 'Magician',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#4a0080"/>
        <rect x="18" y="20" width="28" height="22" rx="3" fill="#1a1a2e"/>
        <ellipse cx="32" cy="20" rx="18" ry="5" fill="#1a1a2e"/>
        <rect x="18" y="17" width="28" height="5" fill="#E76F51"/>
        <rect x="27" y="6" width="10" height="10" rx="2.5" fill="#E76F51"/>
        <rect x="14" y="9" width="8" height="8" rx="2" fill="#F4A261"/>
        <rect x="42" y="9" width="8" height="8" rx="2" fill="#FFD93D"/>
        <circle cx="24" cy="28" r="4" fill="#fff"/>
        <circle cx="40" cy="28" r="5" fill="none" stroke="#1a1a2e" strokeWidth="1.5"/>
        <circle cx="40" cy="28" r="3.5" fill="#fff"/>
        <circle cx="25" cy="29" r="2.5" fill="#1a1a2e"/>
        <circle cx="41" cy="29" r="2.5" fill="#1a1a2e"/>
        <path d="M24 36 Q32 41 40 36" stroke="#1a1a2e" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <line x1="42" y1="50" x2="56" y2="36" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="57" cy="35" r="3" fill="#fff"/>
      </svg>
    )
  },
  bagchamp: {
    name: 'Bag Champ',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#E76F51"/>
        <rect x="16" y="20" width="32" height="28" rx="8" fill="#F4A261"/>
        <line x1="32" y1="20" x2="32" y2="48" stroke="#E76F51" strokeWidth="1.5"/>
        <line x1="16" y1="34" x2="48" y2="34" stroke="#E76F51" strokeWidth="1.5"/>
        <line x1="16" y1="32" x2="6" y2="22" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
        <line x1="48" y1="28" x2="58" y2="18" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
        <line x1="24" y1="48" x2="20" y2="60" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
        <line x1="40" y1="48" x2="44" y2="60" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="26" cy="32" r="3.5" fill="#fff"/>
        <circle cx="38" cy="32" r="3.5" fill="#fff"/>
        <circle cx="27" cy="33" r="2" fill="#1a1a2e"/>
        <circle cx="39" cy="33" r="2" fill="#1a1a2e"/>
        <path d="M26 42 Q32 47 38 42" stroke="#c03000" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  crown: {
    name: 'King',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#1a1a2e"/>
        <path d="M10 46 L16 22 L24 34 L32 16 L40 34 L48 22 L54 46Z" fill="#FFD93D" stroke="#F9A825" strokeWidth="1"/>
        <circle cx="16" cy="22" r="4" fill="#E76F51"/>
        <circle cx="32" cy="16" r="4" fill="#4FC3F7"/>
        <circle cx="48" cy="22" r="4" fill="#4CAF50"/>
        <rect x="10" y="44" width="44" height="8" rx="3" fill="#FFD93D"/>
        <circle cx="28" cy="36" r="3.5" fill="#fff"/>
        <circle cx="36" cy="36" r="3.5" fill="#fff"/>
        <circle cx="29" cy="37" r="2" fill="#1a1a2e"/>
        <circle cx="37" cy="37" r="2" fill="#1a1a2e"/>
        <path d="M26 43 Q32 47 38 43" stroke="#F9A825" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  cactus: {
    name: 'Cactus',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="30" fill="#4CAF50"/>
        <rect x="26" y="16" width="12" height="36" rx="6" fill="#2E7D32"/>
        <rect x="10" y="26" width="18" height="10" rx="5" fill="#2E7D32"/>
        <rect x="36" y="22" width="18" height="10" rx="5" fill="#2E7D32"/>
        <circle cx="14" cy="24" r="2" fill="#FFD93D"/>
        <circle cx="50" cy="20" r="2" fill="#FFD93D"/>
        <circle cx="32" cy="14" r="2" fill="#FFD93D"/>
        <circle cx="26" cy="30" r="4" fill="#fff"/>
        <circle cx="38" cy="30" r="4" fill="#fff"/>
        <circle cx="27" cy="31" r="2.5" fill="#1a1a2e"/>
        <circle cx="39" cy="31" r="2.5" fill="#1a1a2e"/>
        <path d="M26 38 Q32 43 38 38" stroke="#1a3000" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
};

export const AVATAR_LIST = Object.entries(AVATARS).map(([id, data]) => ({ id, name: data.name }));

export function AvatarDisplay({ avatarId, playerName, playerIndex, size = 40 }) {
  const avatar = AVATARS[avatarId];
  if (avatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, display: 'inline-block' }}>
        {avatar.svg(size)}
      </div>
    );
  }
  const COLORS = [
    { bg: '#2a2318', fg: '#e8c547' }, { bg: '#1a2820', fg: '#4caf82' },
    { bg: '#251818', fg: '#e05c5c' }, { bg: '#1a2030', fg: '#6ba3e0' },
    { bg: '#221a28', fg: '#b07ee0' }, { bg: '#1f2018', fg: '#8ec44a' },
  ];
  const c = COLORS[(playerIndex || 0) % COLORS.length];
  const initials = (playerName || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', background: c.bg, color: c.fg, fontSize: size * 0.38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function AvatarPicker({ currentAvatarId, onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text3)', marginBottom: 12 }}>Choose your avatar</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {Object.entries(AVATARS).map(([id, data]) => (
          <div
            key={id}
            onClick={() => onSelect(id)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 8,
              borderRadius: 'var(--radius)',
              border: `2px solid ${currentAvatarId === id ? 'var(--accent)' : 'var(--border)'}`,
              background: currentAvatarId === id ? 'rgba(232,197,71,0.1)' : 'var(--surface2)',
              transition: 'all 0.15s',
            }}
          >
            {data.svg(48)}
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.2 }}>{data.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
