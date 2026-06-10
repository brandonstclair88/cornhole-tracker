import React from 'react';

export const AVATARS = {
  corn: {
    name: 'Cool Corn',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFD93D"/>
        <ellipse cx="50" cy="55" rx="22" ry="30" fill="#F4A261"/>
        <rect x="32" y="30" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="43" y="27" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="54" y="27" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="65" y="30" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="32" y="40" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="43" y="37" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="54" y="37" width="7" height="7" rx="2" fill="#FFD93D"/>
        <rect x="65" y="40" width="7" height="7" rx="2" fill="#FFD93D"/>
        {/* sunglasses */}
        <rect x="30" y="42" width="16" height="10" rx="5" fill="#1a1a2e"/>
        <rect x="54" y="42" width="16" height="10" rx="5" fill="#1a1a2e"/>
        <line x1="46" y1="47" x2="54" y2="47" stroke="#1a1a2e" strokeWidth="2"/>
        {/* smile */}
        <path d="M38 68 Q50 78 62 68" stroke="#7c3a00" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* leaves */}
        <path d="M28 40 Q15 25 20 15 Q30 30 28 40Z" fill="#4CAF50"/>
        <path d="M72 40 Q85 25 80 15 Q70 30 72 40Z" fill="#4CAF50"/>
      </svg>
    )
  },
  beanbag: {
    name: 'Bag Champ',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E76F51"/>
        <rect x="25" y="35" width="50" height="40" rx="10" fill="#F4A261"/>
        <line x1="50" y1="35" x2="50" y2="75" stroke="#E76F51" strokeWidth="2"/>
        <line x1="25" y1="55" x2="75" y2="55" stroke="#E76F51" strokeWidth="2"/>
        {/* arms */}
        <line x1="25" y1="50" x2="8" y2="35" stroke="#F4A261" strokeWidth="6" strokeLinecap="round"/>
        <line x1="75" y1="45" x2="92" y2="30" stroke="#F4A261" strokeWidth="6" strokeLinecap="round"/>
        {/* legs */}
        <line x1="38" y1="75" x2="30" y2="92" stroke="#F4A261" strokeWidth="6" strokeLinecap="round"/>
        <line x1="62" y1="75" x2="70" y2="92" stroke="#F4A261" strokeWidth="6" strokeLinecap="round"/>
        {/* face */}
        <circle cx="40" cy="50" r="4" fill="#fff"/>
        <circle cx="60" cy="50" r="4" fill="#fff"/>
        <circle cx="41" cy="51" r="2" fill="#1a1a2e"/>
        <circle cx="61" cy="51" r="2" fill="#1a1a2e"/>
        <path d="M40 62 Q50 70 60 62" stroke="#7c3a00" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  board: {
    name: 'Board Boss',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#8B5E2A"/>
        <rect x="15" y="30" width="70" height="45" rx="6" fill="#6B3F10"/>
        <circle cx="50" cy="52" r="12" fill="#1a0f00"/>
        <circle cx="50" cy="52" r="6" fill="#2a1500"/>
        {/* face on board */}
        <circle cx="30" cy="40" r="5" fill="#FFD93D"/>
        <circle cx="70" cy="40" r="5" fill="#FFD93D"/>
        <circle cx="30" cy="41" r="2.5" fill="#1a1a2e"/>
        <circle cx="70" cy="41" r="2.5" fill="#1a1a2e"/>
        <path d="M35 65 Q50 72 65 65" stroke="#FFD93D" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* legs */}
        <line x1="25" y1="75" x2="20" y2="90" stroke="#6B3F10" strokeWidth="5" strokeLinecap="round"/>
        <line x1="75" y1="75" x2="80" y2="90" stroke="#6B3F10" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    )
  },
  hotdog: {
    name: 'Hot Dog',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFD93D"/>
        <ellipse cx="50" cy="55" rx="30" ry="16" fill="#D4845A"/>
        <ellipse cx="50" cy="55" rx="22" ry="10" fill="#E05C5C"/>
        {/* bun */}
        <ellipse cx="50" cy="48" rx="30" ry="14" fill="#F4A261"/>
        <ellipse cx="50" cy="62" rx="30" ry="14" fill="#F4A261"/>
        {/* mustard zigzag */}
        <path d="M25 55 Q30 50 35 55 Q40 60 45 55 Q50 50 55 55 Q60 60 65 55 Q70 50 75 55" stroke="#FFD93D" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* face */}
        <circle cx="35" cy="44" r="4" fill="#fff"/>
        <circle cx="65" cy="44" r="4" fill="#fff"/>
        <circle cx="36" cy="45" r="2" fill="#1a1a2e"/>
        <circle cx="66" cy="45" r="2" fill="#1a1a2e"/>
        <path d="M40 38 Q50 34 60 38" stroke="#7c3a00" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* arm throwing bag */}
        <line x1="75" y1="50" x2="90" y2="35" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
        <rect x="87" y="28" width="10" height="10" rx="3" fill="#E76F51"/>
      </svg>
    )
  },
  eagle: {
    name: 'Eagle Eye',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#4FC3F7"/>
        {/* body */}
        <ellipse cx="50" cy="60" rx="20" ry="25" fill="#fff"/>
        {/* head */}
        <circle cx="50" cy="35" r="18" fill="#fff"/>
        {/* beak */}
        <path d="M50 38 L60 43 L50 46Z" fill="#FFD93D"/>
        {/* eyes */}
        <circle cx="42" cy="32" r="5" fill="#FFD93D"/>
        <circle cx="58" cy="32" r="5" fill="#FFD93D"/>
        <circle cx="42" cy="32" r="3" fill="#1a1a2e"/>
        <circle cx="58" cy="32" r="3" fill="#1a1a2e"/>
        <circle cx="43" cy="31" r="1" fill="#fff"/>
        <circle cx="59" cy="31" r="1" fill="#fff"/>
        {/* wings */}
        <path d="M30 55 Q10 40 15 25 Q25 45 35 50Z" fill="#8B5E2A"/>
        <path d="M70 55 Q90 40 85 25 Q75 45 65 50Z" fill="#8B5E2A"/>
        {/* bag in talon */}
        <rect x="60" y="75" width="12" height="12" rx="3" fill="#E76F51"/>
        <line x1="65" y1="75" x2="65" y2="87" stroke="#D4845A" strokeWidth="1"/>
        <line x1="60" y1="81" x2="72" y2="81" stroke="#D4845A" strokeWidth="1"/>
      </svg>
    )
  },
  frog: {
    name: 'Frog King',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#4CAF50"/>
        {/* body */}
        <ellipse cx="50" cy="62" rx="28" ry="22" fill="#66BB6A"/>
        {/* head */}
        <ellipse cx="50" cy="42" rx="26" ry="22" fill="#66BB6A"/>
        {/* eyes on top */}
        <circle cx="35" cy="28" r="10" fill="#66BB6A"/>
        <circle cx="65" cy="28" r="10" fill="#66BB6A"/>
        <circle cx="35" cy="28" r="7" fill="#fff"/>
        <circle cx="65" cy="28" r="7" fill="#fff"/>
        <circle cx="35" cy="28" r="4" fill="#1a1a2e"/>
        <circle cx="65" cy="28" r="4" fill="#1a1a2e"/>
        <circle cx="36" cy="27" r="1.5" fill="#fff"/>
        <circle cx="66" cy="27" r="1.5" fill="#fff"/>
        {/* mouth */}
        <path d="M35 52 Q50 62 65 52" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" fill="none"/>
        {/* crown */}
        <path d="M32 35 L35 22 L42 30 L50 18 L58 30 L65 22 L68 35Z" fill="#FFD93D" stroke="#F9A825" strokeWidth="1"/>
        {/* legs */}
        <path d="M22 72 Q10 80 15 90" stroke="#66BB6A" strokeWidth="8" strokeLinecap="round" fill="none"/>
        <path d="M78 72 Q90 80 85 90" stroke="#66BB6A" strokeWidth="8" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  robot: {
    name: 'Robo Toss',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#90A4AE"/>
        {/* body */}
        <rect x="28" y="52" width="44" height="32" rx="4" fill="#607D8B"/>
        {/* head */}
        <rect x="30" y="22" width="40" height="32" rx="6" fill="#607D8B"/>
        {/* antenna */}
        <line x1="50" y1="22" x2="50" y2="12" stroke="#90A4AE" strokeWidth="3"/>
        <circle cx="50" cy="10" r="4" fill="#E76F51"/>
        {/* eyes */}
        <rect x="35" y="30" width="12" height="8" rx="2" fill="#4FC3F7"/>
        <rect x="53" y="30" width="12" height="8" rx="2" fill="#4FC3F7"/>
        {/* mouth grille */}
        <rect x="35" y="44" width="30" height="6" rx="2" fill="#455A64"/>
        <line x1="40" y1="44" x2="40" y2="50" stroke="#607D8B" strokeWidth="1"/>
        <line x1="50" y1="44" x2="50" y2="50" stroke="#607D8B" strokeWidth="1"/>
        <line x1="60" y1="44" x2="60" y2="50" stroke="#607D8B" strokeWidth="1"/>
        {/* arm throwing */}
        <line x1="72" y1="58" x2="90" y2="40" stroke="#607D8B" strokeWidth="7" strokeLinecap="round"/>
        <rect x="87" y="33" width="10" height="10" rx="2" fill="#E76F51"/>
        {/* other arm */}
        <line x1="28" y1="58" x2="12" y2="65" stroke="#607D8B" strokeWidth="7" strokeLinecap="round"/>
        {/* legs */}
        <rect x="33" y="84" width="12" height="10" rx="3" fill="#455A64"/>
        <rect x="55" y="84" width="12" height="10" rx="3" fill="#455A64"/>
      </svg>
    )
  },
  cowboy: {
    name: 'Cowboy',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#F4A261"/>
        {/* hat brim */}
        <ellipse cx="50" cy="30" rx="35" ry="8" fill="#8B5E2A"/>
        {/* hat top */}
        <rect x="30" y="8" width="40" height="24" rx="4" fill="#6B3F10"/>
        {/* hat band */}
        <rect x="30" y="26" width="40" height="5" fill="#E76F51"/>
        {/* face */}
        <circle cx="50" cy="55" r="22" fill="#FDBCB4"/>
        {/* eyes */}
        <circle cx="42" cy="50" r="4" fill="#fff"/>
        <circle cx="58" cy="50" r="4" fill="#fff"/>
        <circle cx="43" cy="51" r="2.5" fill="#4a2800"/>
        <circle cx="59" cy="51" r="2.5" fill="#4a2800"/>
        {/* mustache */}
        <path d="M40 60 Q45 65 50 62 Q55 65 60 60" stroke="#8B5E2A" strokeWidth="3" strokeLinecap="round" fill="none"/>
        {/* bag flying */}
        <rect x="72" y="25" width="14" height="14" rx="4" fill="#E76F51" transform="rotate(15 79 32)"/>
        <line x1="72" y1="32" x2="79" y2="26" stroke="#D4845A" strokeWidth="1.5"/>
        {/* arms */}
        <line x1="72" y1="62" x2="85" y2="45" stroke="#FDBCB4" strokeWidth="6" strokeLinecap="round"/>
        <line x1="28" y1="62" x2="15" y2="68" stroke="#FDBCB4" strokeWidth="6" strokeLinecap="round"/>
      </svg>
    )
  },
  lion: {
    name: 'The Mane Event',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFD93D"/>
        {/* mane */}
        <circle cx="50" cy="50" r="35" fill="#F4A261"/>
        {/* face */}
        <circle cx="50" cy="52" r="26" fill="#FDBCB4"/>
        {/* ears */}
        <circle cx="24" cy="28" r="10" fill="#F4A261"/>
        <circle cx="76" cy="28" r="10" fill="#F4A261"/>
        <circle cx="24" cy="28" r="6" fill="#FDBCB4"/>
        <circle cx="76" cy="28" r="6" fill="#FDBCB4"/>
        {/* eyes */}
        <circle cx="41" cy="46" r="6" fill="#fff"/>
        <circle cx="59" cy="46" r="6" fill="#fff"/>
        <circle cx="42" cy="47" r="3.5" fill="#4a2800"/>
        <circle cx="60" cy="47" r="3.5" fill="#4a2800"/>
        <circle cx="43" cy="46" r="1.5" fill="#fff"/>
        <circle cx="61" cy="46" r="1.5" fill="#fff"/>
        {/* nose */}
        <ellipse cx="50" cy="57" rx="5" ry="4" fill="#E76F51"/>
        {/* mouth */}
        <path d="M45 61 Q50 66 55 61" stroke="#8B5E2A" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* jersey number */}
        <text x="50" y="78" textAnchor="middle" fill="#E76F51" fontSize="12" fontWeight="bold">1</text>
      </svg>
    )
  },
  fox: {
    name: 'Sly Fox',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E76F51"/>
        {/* ears */}
        <path d="M25 38 L18 12 L40 30Z" fill="#E76F51"/>
        <path d="M75 38 L82 12 L60 30Z" fill="#E76F51"/>
        <path d="M27 36 L22 18 L38 30Z" fill="#FDBCB4"/>
        <path d="M73 36 L78 18 L62 30Z" fill="#FDBCB4"/>
        {/* face */}
        <ellipse cx="50" cy="55" rx="28" ry="26" fill="#F4A261"/>
        {/* white muzzle */}
        <ellipse cx="50" cy="62" rx="16" ry="14" fill="#fff"/>
        {/* eyes */}
        <circle cx="38" cy="48" r="6" fill="#fff"/>
        <circle cx="62" cy="48" r="6" fill="#fff"/>
        <circle cx="39" cy="49" r="3.5" fill="#4a2800"/>
        <circle cx="63" cy="49" r="3.5" fill="#4a2800"/>
        <circle cx="40" cy="48" r="1.5" fill="#fff"/>
        <circle cx="64" cy="48" r="1.5" fill="#fff"/>
        {/* nose */}
        <ellipse cx="50" cy="58" rx="4" ry="3" fill="#1a1a2e"/>
        {/* cap backwards */}
        <path d="M28 42 Q50 28 72 42 Q65 35 50 33 Q35 35 28 42Z" fill="#E76F51"/>
        <rect x="68" y="38" width="10" height="5" rx="2" fill="#E76F51"/>
        {/* smile */}
        <path d="M40 68 Q50 74 60 68" stroke="#8B5E2A" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  flame: {
    name: 'On Fire',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#1a1a2e"/>
        {/* flame */}
        <path d="M50 85 Q25 70 30 50 Q35 35 25 20 Q40 35 42 25 Q45 40 50 30 Q55 40 58 25 Q60 35 75 20 Q65 35 70 50 Q75 70 50 85Z" fill="#E76F51"/>
        <path d="M50 80 Q32 67 36 52 Q40 40 33 28 Q44 40 46 32 Q48 43 50 35 Q52 43 54 32 Q56 40 67 28 Q60 40 64 52 Q68 67 50 80Z" fill="#FFD93D"/>
        <path d="M50 74 Q38 63 41 52 Q44 44 50 40 Q56 44 59 52 Q62 63 50 74Z" fill="#fff"/>
        {/* face in flame */}
        <circle cx="43" cy="56" r="4" fill="#1a1a2e"/>
        <circle cx="57" cy="56" r="4" fill="#1a1a2e"/>
        <circle cx="44" cy="57" r="2" fill="#FFD93D"/>
        <circle cx="58" cy="57" r="2" fill="#FFD93D"/>
        <path d="M41 65 Q50 71 59 65" stroke="#1a1a2e" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  },
  skull: {
    name: 'Dead Bag',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#1a1a2e"/>
        {/* skull */}
        <ellipse cx="50" cy="45" rx="28" ry="30" fill="#fff"/>
        {/* jaw */}
        <rect x="35" y="65" width="30" height="18" rx="4" fill="#fff"/>
        <line x1="43" y1="65" x2="43" y2="83" stroke="#1a1a2e" strokeWidth="3"/>
        <line x1="50" y1="65" x2="50" y2="83" stroke="#1a1a2e" strokeWidth="3"/>
        <line x1="57" y1="65" x2="57" y2="83" stroke="#1a1a2e" strokeWidth="3"/>
        {/* eye sockets */}
        <ellipse cx="38" cy="42" rx="10" ry="11" fill="#1a1a2e"/>
        <ellipse cx="62" cy="42" rx="10" ry="11" fill="#1a1a2e"/>
        {/* X eyes */}
        <line x1="33" y1="37" x2="43" y2="47" stroke="#E76F51" strokeWidth="3"/>
        <line x1="43" y1="37" x2="33" y2="47" stroke="#E76F51" strokeWidth="3"/>
        <line x1="57" y1="37" x2="67" y2="47" stroke="#E76F51" strokeWidth="3"/>
        <line x1="67" y1="37" x2="57" y2="47" stroke="#E76F51" strokeWidth="3"/>
        {/* nose */}
        <path d="M46 55 L50 62 L54 55Z" fill="#1a1a2e"/>
        {/* bag in mouth */}
        <rect x="40" y="70" width="20" height="10" rx="3" fill="#E76F51"/>
      </svg>
    )
  },
  taco: {
    name: 'Taco Tuesday',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFD93D"/>
        {/* taco shell */}
        <path d="M15 65 Q50 20 85 65Z" fill="#F4A261"/>
        <path d="M15 65 Q50 35 85 65" stroke="#D4845A" strokeWidth="3" fill="none"/>
        {/* fillings */}
        <ellipse cx="50" cy="58" rx="25" ry="10" fill="#4CAF50"/>
        <ellipse cx="42" cy="55" rx="8" ry="6" fill="#E76F51"/>
        <ellipse cx="58" cy="55" rx="8" ry="6" fill="#E76F51"/>
        <ellipse cx="50" cy="52" rx="12" ry="5" fill="#FDBCB4"/>
        {/* face on shell */}
        <circle cx="37" cy="45" r="5" fill="#fff"/>
        <circle cx="63" cy="45" r="5" fill="#fff"/>
        <circle cx="38" cy="46" r="3" fill="#4a2800"/>
        <circle cx="64" cy="46" r="3" fill="#4a2800"/>
        <circle cx="39" cy="45" r="1" fill="#fff"/>
        <circle cx="65" cy="45" r="1" fill="#fff"/>
        <path d="M40 56 Q50 62 60 56" stroke="#8B5E2A" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* arms */}
        <line x1="20" y1="62" x2="8" y2="50" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
        <line x1="80" y1="62" x2="92" y2="50" stroke="#F4A261" strokeWidth="5" strokeLinecap="round"/>
      </svg>
    )
  },
  lightning: {
    name: 'Lightning Arm',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#1a1a2e"/>
        {/* lightning bolt */}
        <path d="M60 10 L35 52 L52 52 L40 90 L65 48 L48 48Z" fill="#FFD93D" stroke="#F9A825" strokeWidth="1"/>
        {/* bag flying */}
        <rect x="15" y="30" width="18" height="18" rx="4" fill="#E76F51" transform="rotate(-20 24 39)"/>
        <line x1="20" y1="35" x2="24" y2="30" stroke="#D4845A" strokeWidth="1.5"/>
        <line x1="15" y1="39" x2="33" y2="39" stroke="#D4845A" strokeWidth="1.5"/>
        {/* sparkles */}
        <circle cx="20" cy="65" r="3" fill="#FFD93D"/>
        <circle cx="80" cy="25" r="3" fill="#FFD93D"/>
        <circle cx="75" cy="70" r="2" fill="#FFD93D"/>
        <circle cx="15" cy="20" r="2" fill="#FFD93D"/>
      </svg>
    )
  },
  chicken: {
    name: 'Scared Chicken',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFD93D"/>
        {/* body */}
        <ellipse cx="50" cy="65" rx="25" ry="22" fill="#fff"/>
        {/* head */}
        <circle cx="50" cy="38" r="20" fill="#fff"/>
        {/* comb */}
        <path d="M40 20 Q43 12 46 20 Q48 12 51 20 Q53 12 56 20" fill="#E76F51"/>
        {/* beak */}
        <path d="M50 42 L58 45 L50 48Z" fill="#FFD93D"/>
        {/* wattle */}
        <ellipse cx="56" cy="50" rx="4" ry="6" fill="#E76F51"/>
        {/* scared eyes */}
        <circle cx="40" cy="35" r="7" fill="#fff" stroke="#1a1a2e" strokeWidth="1"/>
        <circle cx="60" cy="35" r="7" fill="#fff" stroke="#1a1a2e" strokeWidth="1"/>
        <circle cx="40" cy="35" r="4" fill="#1a1a2e"/>
        <circle cx="60" cy="35" r="4" fill="#1a1a2e"/>
        <circle cx="41" cy="34" r="2" fill="#fff"/>
        <circle cx="61" cy="34" r="2" fill="#fff"/>
        {/* sweat drops */}
        <path d="M30 28 Q28 32 30 35 Q32 32 30 28Z" fill="#4FC3F7"/>
        <path d="M70 28 Q72 32 70 35 Q68 32 70 28Z" fill="#4FC3F7"/>
        {/* wings up scared */}
        <path d="M25 62 Q10 50 15 38 Q22 55 28 58Z" fill="#FFD93D"/>
        <path d="M75 62 Q90 50 85 38 Q78 55 72 58Z" fill="#FFD93D"/>
        {/* bag it's scared of */}
        <rect x="78" y="68" width="14" height="14" rx="4" fill="#E76F51"/>
      </svg>
    )
  },
  magician: {
    name: 'The Magician',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#4a0080"/>
        {/* top hat */}
        <rect x="30" y="15" width="40" height="30" rx="3" fill="#1a1a2e"/>
        <ellipse cx="50" cy="45" rx="26" ry="7" fill="#1a1a2e"/>
        <rect x="30" y="38" width="40" height="7" fill="#E76F51"/>
        {/* bags coming out of hat */}
        <rect x="40" y="5" width="10" height="10" rx="3" fill="#E76F51"/>
        <rect x="53" y="8" width="8" height="8" rx="2" fill="#F4A261"/>
        <rect x="33" y="8" width="8" height="8" rx="2" fill="#FFD93D"/>
        {/* face */}
        <circle cx="50" cy="62" r="20" fill="#FDBCB4"/>
        {/* eyes with monocle */}
        <circle cx="41" cy="58" r="5" fill="#fff"/>
        <circle cx="59" cy="58" r="7" fill="none" stroke="#1a1a2e" strokeWidth="2"/>
        <circle cx="59" cy="58" r="5" fill="#fff"/>
        <circle cx="42" cy="59" r="3" fill="#1a1a2e"/>
        <circle cx="60" cy="59" r="3" fill="#1a1a2e"/>
        {/* mustache */}
        <path d="M40 68 Q45 72 50 69 Q55 72 60 68" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" fill="none"/>
        {/* wand */}
        <line x1="65" y1="75" x2="85" y2="55" stroke="#1a1a2e" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="86" cy="54" r="4" fill="#fff"/>
        {/* stars */}
        <text x="12" y="35" fontSize="12" fill="#FFD93D">✦</text>
        <text x="78" y="80" fontSize="10" fill="#FFD93D">✦</text>
      </svg>
    )
  },
  pizza: {
    name: 'Pizza Pro',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#E76F51"/>
        {/* pizza slice */}
        <path d="M50 15 L85 80 L15 80Z" fill="#F4A261"/>
        <path d="M50 15 L85 80 L15 80Z" fill="none" stroke="#D4845A" strokeWidth="2"/>
        {/* crust */}
        <path d="M15 80 Q50 95 85 80" fill="#D4845A" stroke="#8B5E2A" strokeWidth="1"/>
        {/* cheese */}
        <path d="M50 22 L78 74 L22 74Z" fill="#FFD93D"/>
        {/* toppings */}
        <circle cx="50" cy="45" r="5" fill="#E76F51"/>
        <circle cx="38" cy="58" r="4" fill="#E76F51"/>
        <circle cx="62" cy="58" r="4" fill="#E76F51"/>
        <circle cx="50" cy="65" r="4" fill="#E76F51"/>
        {/* face */}
        <circle cx="40" cy="42" r="5" fill="#fff"/>
        <circle cx="60" cy="42" r="5" fill="#fff"/>
        <circle cx="41" cy="43" r="3" fill="#4a2800"/>
        <circle cx="61" cy="43" r="3" fill="#4a2800"/>
        <path d="M40 52 Q50 58 60 52" stroke="#8B5E2A" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* champion belt */}
        <rect x="30" y="76" width="40" height="8" rx="2" fill="#FFD93D"/>
        <rect x="44" y="74" width="12" height="10" rx="2" fill="#F9A825"/>
        <text x="50" y="82" textAnchor="middle" fill="#8B5E2A" fontSize="6" fontWeight="bold">CHAMP</text>
      </svg>
    )
  },
  shark: {
    name: 'Bag Shark',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#4FC3F7"/>
        {/* body */}
        <ellipse cx="50" cy="60" rx="32" ry="22" fill="#90A4AE"/>
        {/* head */}
        <ellipse cx="50" cy="45" rx="28" ry="24" fill="#90A4AE"/>
        {/* fin */}
        <path d="M50 22 L60 38 L40 38Z" fill="#78909C"/>
        {/* white belly */}
        <ellipse cx="50" cy="55" rx="20" ry="15" fill="#fff"/>
        {/* eyes */}
        <circle cx="38" cy="40" r="7" fill="#fff"/>
        <circle cx="62" cy="40" r="7" fill="#fff"/>
        <circle cx="38" cy="40" r="4" fill="#1a1a2e"/>
        <circle cx="62" cy="40" r="4" fill="#1a1a2e"/>
        <circle cx="39" cy="39" r="2" fill="#fff"/>
        <circle cx="63" cy="39" r="2" fill="#fff"/>
        {/* teeth smile */}
        <path d="M34 56 Q50 68 66 56" fill="#fff"/>
        <path d="M34 56 Q50 68 66 56" stroke="#78909C" strokeWidth="1" fill="none"/>
        <line x1="40" y1="56" x2="38" y2="63" stroke="#78909C" strokeWidth="1"/>
        <line x1="47" y1="59" x2="46" y2="67" stroke="#78909C" strokeWidth="1"/>
        <line x1="54" y1="59" x2="55" y2="67" stroke="#78909C" strokeWidth="1"/>
        <line x1="60" y1="56" x2="62" y2="63" stroke="#78909C" strokeWidth="1"/>
        {/* bag in mouth */}
        <rect x="43" y="60" width="14" height="10" rx="3" fill="#E76F51"/>
        {/* tail fin */}
        <path d="M82 65 Q95 55 92 75 Q85 65 82 65Z" fill="#78909C"/>
        <path d="M82 65 Q95 75 88 85 Q83 73 82 65Z" fill="#78909C"/>
      </svg>
    )
  },
  wizard: {
    name: 'Bag Wizard',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#1a1a2e"/>
        {/* robe */}
        <path d="M25 75 Q30 55 50 52 Q70 55 75 75 Q62 90 50 92 Q38 90 25 75Z" fill="#4a0080"/>
        {/* stars on robe */}
        <text x="38" y="75" fontSize="10" fill="#FFD93D">★</text>
        <text x="55" y="82" fontSize="8" fill="#FFD93D">★</text>
        <text x="45" y="88" fontSize="6" fill="#FFD93D">★</text>
        {/* head */}
        <circle cx="50" cy="50" r="20" fill="#FDBCB4"/>
        {/* wizard hat */}
        <path d="M30 38 Q50 5 70 38Z" fill="#4a0080"/>
        <ellipse cx="50" cy="38" rx="22" ry="6" fill="#4a0080"/>
        <ellipse cx="50" cy="38" rx="22" ry="6" fill="none" stroke="#FFD93D" strokeWidth="1"/>
        {/* hat stars */}
        <text x="46" y="28" fontSize="8" fill="#FFD93D">★</text>
        {/* long beard */}
        <path d="M38 58 Q36 70 40 82" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <path d="M50 60 Q48 72 50 85" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none"/>
        <path d="M62 58 Q64 70 60 82" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none"/>
        {/* eyes */}
        <circle cx="42" cy="48" r="4" fill="#fff"/>
        <circle cx="58" cy="48" r="4" fill="#fff"/>
        <circle cx="43" cy="49" r="2.5" fill="#4a0080"/>
        <circle cx="59" cy="49" r="2.5" fill="#4a0080"/>
        {/* staff with bag on top */}
        <line x1="72" y1="75" x2="88" y2="30" stroke="#8B5E2A" strokeWidth="4" strokeLinecap="round"/>
        <rect x="84" y="22" width="12" height="12" rx="3" fill="#E76F51"/>
        <circle cx="90" cy="28" r="6" fill="none" stroke="#FFD93D" strokeWidth="1.5"/>
      </svg>
    )
  },
  sunglasses: {
    name: 'Too Cool',
    svg: (size) => (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#FFD93D"/>
        {/* face */}
        <circle cx="50" cy="52" r="30" fill="#FDBCB4"/>
        {/* big sunglasses */}
        <rect x="18" y="40" width="26" height="20" rx="8" fill="#1a1a2e"/>
        <rect x="56" y="40" width="26" height="20" rx="8" fill="#1a1a2e"/>
        <line x1="44" y1="50" x2="56" y2="50" stroke="#1a1a2e" strokeWidth="3"/>
        <line x1="18" y1="50" x2="10" y2="48" stroke="#1a1a2e" strokeWidth="3"/>
        <line x1="82" y1="50" x2="90" y2="48" stroke="#1a1a2e" strokeWidth="3"/>
        {/* reflection */}
        <ellipse cx="26" cy="46" rx="5" ry="4" fill="#fff" opacity="0.2"/>
        <ellipse cx="64" cy="46" rx="5" ry="4" fill="#fff" opacity="0.2"/>
        {/* cool smile */}
        <path d="M36 66 Q50 76 64 66" stroke="#E76F51" strokeWidth="3" strokeLinecap="round" fill="none"/>
        {/* bag accessories */}
        <rect x="15" y="72" width="12" height="12" rx="3" fill="#E76F51" transform="rotate(-10 21 78)"/>
        <rect x="73" y="72" width="12" height="12" rx="3" fill="#4CAF50" transform="rotate(10 79 78)"/>
        {/* eyebrows */}
        <path d="M20 38 Q31 34 42 38" stroke="#8B5E2A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M58 38 Q69 34 80 38" stroke="#8B5E2A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
    )
  }
};

export const AVATAR_LIST = Object.entries(AVATARS).map(([id, data]) => ({ id, name: data.name }));

export function AvatarDisplay({ avatarId, playerName, playerIndex, size = 40 }) {
  const avatar = AVATARS[avatarId];
  if (avatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        {avatar.svg(size)}
      </div>
    );
  }
  // Fallback to initials
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
