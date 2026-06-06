import React from 'react';
import { PRESET_SVGS } from '../data/presetSvgs';
import { NEW_PRESET_SVGS } from '../data/newPresetSvgs';

const ALL_SVGS = [...PRESET_SVGS, ...NEW_PRESET_SVGS];
import { PET_SVGS } from '../data/petSvgs';
import { AV_OL, SKIN_TONES, HAIR_COLORS, EYE_COLORS, CLOTHING_COLORS, PET_KEY_MAP, JPG_PRESET_START } from '../data/avatarData';

// ─── Background helpers ─────────────────────────────────────────────────────
function BhBg({ bgId }) {
  if (bgId === 'bg_sunset') return (
    <>
      <defs><linearGradient id="bhBgSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a1040"/><stop offset="45%" stopColor="#c0392b"/><stop offset="75%" stopColor="#e67e22"/><stop offset="100%" stopColor="#f5c842"/></linearGradient></defs>
      <rect width="280" height="340" fill="url(#bhBgSun)"/>
      <ellipse cx="140" cy="305" rx="70" ry="70" fill="#f5c842" opacity=".45"/>
      <ellipse cx="140" cy="305" rx="48" ry="48" fill="#e67e22" opacity=".4"/>
      <rect x="0" y="295" width="280" height="45" fill="#c0392b" opacity=".35"/>
    </>
  );
  if (bgId === 'bg_space') return (
    <>
      <rect width="280" height="340" fill="#060d1f"/>
      {[22,58,12,144,82,174,50,118,8,160,36,100,72,188,28,54,132,166,18,110,42,86,152,66,196,34,78,120,46,160,90,210].map((x,i)=>(
        <circle key={i} cx={x} cy={3+(i*11)%335} r={.4+(i%4)*.6} fill="white" opacity={.25+i%6*.12}/>
      ))}
      <ellipse cx="215" cy="58" rx="26" ry="26" fill="#3a1a6e" opacity=".55"/>
      <ellipse cx="215" cy="58" rx="20" ry="20" fill="#6a3aae" opacity=".4"/>
      <ellipse cx="215" cy="58" rx="14" ry="14" fill="#8a5adf" opacity=".35"/>
    </>
  );
  if (bgId === 'bg_confetti') return (
    <>
      <rect width="280" height="340" fill="#fff9f0"/>
      {[
        {x:30,y:40,c:'#FF6524',r:3,rot:20},{x:70,y:25,c:'#4F7EF7',r:2.5,rot:45},
        {x:200,y:55,c:'#28C96F',r:3,rot:70},{x:242,y:35,c:'#E53E3E',r:2.5,rot:15},
        {x:15,y:120,c:'#9B71F7',r:2.2,rot:55},{x:262,y:110,c:'#F5D76E',r:3,rot:80},
        {x:48,y:262,c:'#FF6B9D',r:2.5,rot:30},{x:232,y:252,c:'#4A90D9',r:3,rot:65},
        {x:140,y:18,c:'#FF6524',r:2.2,rot:10},{x:178,y:312,c:'#28C96F',r:3,rot:40},
        {x:83,y:302,c:'#9B71F7',r:2.5,rot:75},{x:248,y:292,c:'#E53E3E',r:2,rot:50},
        {x:18,y:200,c:'#F5D76E',r:3,rot:25},{x:266,y:195,c:'#4F7EF7',r:2.5,rot:60},
        {x:110,y:310,c:'#FF6B9D',r:2,rot:35},{x:170,y:22,c:'#E53E3E',r:2.5,rot:55},
      ].map((d,i)=>(
        <rect key={i} x={d.x-d.r} y={d.y-d.r*2} width={d.r*2} height={d.r*4} rx={d.r*.4} fill={d.c} opacity=".72" transform={`rotate(${d.rot},${d.x},${d.y})`}/>
      ))}
    </>
  );
  return <rect width="280" height="340" fill="#F0EBE3"/>;
}

// ─── Hair helpers ───────────────────────────────────────────────────────────
function BhHairBack({ style, col }) {
  const sw = 2.5;
  if (style === 1) return (
    <>
      <path d="M 57 124 Q 30 160 34 220 Q 46 280 58 320" fill="none" stroke={col} strokeWidth="38" strokeLinecap="round"/>
      <path d="M 223 124 Q 250 160 246 220 Q 234 280 222 320" fill="none" stroke={col} strokeWidth="38" strokeLinecap="round"/>
    </>
  );
  if (style === 2) return (
    <>
      <path d="M 57 124 Q 42 170 50 240 Q 56 280 70 320" fill="none" stroke={col} strokeWidth="28" strokeLinecap="round"/>
      <path d="M 223 124 Q 238 170 230 240 Q 224 280 210 320" fill="none" stroke={col} strokeWidth="28" strokeLinecap="round"/>
    </>
  );
  if (style === 4) return (
    <>
      <ellipse cx="140" cy="60" rx="92" ry="88" fill={col} stroke={AV_OL} strokeWidth={sw}/>
      <circle cx="80" cy="100" r="18" fill={col} stroke={AV_OL} strokeWidth={sw}/>
      <circle cx="200" cy="100" r="18" fill={col} stroke={AV_OL} strokeWidth={sw}/>
    </>
  );
  return null;
}

function BhHairFront({ style, col }) {
  const sw = 2.5;
  if (style === 5) return (
    <path d="M 76 120 Q 86 68 140 64 Q 194 68 204 120 Q 188 82 140 79 Q 92 82 76 120 Z" fill={col} stroke={AV_OL} strokeWidth={sw}/>
  );
  if (style === 6) return (
    <>
      <path d="M 64 118 Q 78 52 140 48 Q 202 52 216 118 Q 196 76 140 73 Q 84 76 64 118 Z" fill={col} stroke={AV_OL} strokeWidth={sw}/>
      <path d="M 66 110 Q 84 74 114 62 Q 94 82 100 102 Z" fill={col}/>
    </>
  );
  if (style === 3) return (
    <path d="M 46 114 Q 58 46 140 36 Q 222 46 234 114 Q 206 58 140 54 Q 74 58 46 114 Z" fill={col} stroke={AV_OL} strokeWidth={sw}/>
  );
  return (
    <path d="M 57 124 Q 73 44 140 40 Q 207 44 223 124 Q 200 76 140 72 Q 80 76 57 124 Z" fill={col} stroke={AV_OL} strokeWidth={sw}/>
  );
}

// ─── Clothing ───────────────────────────────────────────────────────────────
function BhClothing({ style, col }) {
  const sw = 2.5;
  const body = <path d="M 80 242 L 46 282 L 32 268 L 32 340 L 248 340 L 248 268 L 234 282 L 200 242 Q 170 256 140 256 Q 110 256 80 242 Z" fill={col} stroke={AV_OL} strokeWidth={sw}/>;
  if (style === 0) return (<>{body}<ellipse cx="140" cy="246" rx="35" ry="11" fill={col} stroke={AV_OL} strokeWidth="1.5" style={{filter:'brightness(.9)'}}/></>);
  if (style === 1) return (
    <>
      <path d="M 80 242 L 42 286 L 28 272 L 28 340 L 252 340 L 252 272 L 238 286 L 200 242 Q 170 256 140 256 Q 110 256 80 242 Z" fill={col} stroke={AV_OL} strokeWidth={sw}/>
      <rect x="108" y="292" width="64" height="38" rx="9" fill={col} stroke={AV_OL} strokeWidth="1.5" style={{filter:'brightness(.84)'}}/>
      <line x1="130" y1="256" x2="126" y2="312" stroke={AV_OL} strokeWidth="2" opacity=".3"/>
      <line x1="150" y1="256" x2="154" y2="312" stroke={AV_OL} strokeWidth="2" opacity=".3"/>
    </>
  );
  if (style === 2) return (
    <>
      {body}
      <path d="M 118 244 L 140 276 L 162 244" fill="none" stroke="white" strokeWidth="14" strokeLinecap="round"/>
      <path d="M 120 244 L 140 272 L 160 244" fill="none" stroke={AV_OL} strokeWidth="2.5"/>
      {[290,312,330].map(y=><circle key={y} cx="140" cy={y} r="4.5" fill="white" stroke={AV_OL} strokeWidth="1.5"/>)}
    </>
  );
  return (<>{body}<path d="M 112 244 L 140 278 L 168 244" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" opacity=".55"/></>);
}

// ─── Eyes ───────────────────────────────────────────────────────────────────
function BhEyes({ style, col, skin }) {
  const lx=107, rx=173, ey=132;
  const shine = (cx) => <><circle cx={cx+5} cy={ey-5} r="4" fill="white"/><circle cx={cx-3} cy={ey+4} r="2.5" fill="white" opacity=".6"/></>;
  const normalEye = (cx) => (
    <>
      <ellipse cx={cx} cy={ey} rx="16" ry="16" fill="white" stroke={AV_OL} strokeWidth="2"/>
      <circle cx={cx} cy={ey} r="10" fill={col}/>
      <circle cx={cx} cy={ey} r="5.5" fill="#111"/>
      {shine(cx)}
    </>
  );
  if (style === 0) return <>{normalEye(lx)}{normalEye(rx)}</>;
  if (style === 1) return (
    <>
      <path d={`M ${lx-16} ${ey+3} Q ${lx} ${ey-14} ${lx+16} ${ey+3}`} fill={skin.b} stroke={AV_OL} strokeWidth="3.5" strokeLinecap="round"/>
      <path d={`M ${rx-16} ${ey+3} Q ${rx} ${ey-14} ${rx+16} ${ey+3}`} fill={skin.b} stroke={AV_OL} strokeWidth="3.5" strokeLinecap="round"/>
    </>
  );
  if (style === 2) return (
    <>
      <path d={`M ${lx-14} ${ey} Q ${lx} ${ey-9} ${lx+14} ${ey}`} fill="none" stroke={AV_OL} strokeWidth="3.5" strokeLinecap="round"/>
      <path d={`M ${lx-12} ${ey+6} Q ${lx} ${ey+4} ${lx+12} ${ey+6}`} fill="none" stroke={AV_OL} strokeWidth="2" strokeLinecap="round" opacity=".35"/>
      <path d={`M ${rx-14} ${ey} Q ${rx} ${ey-9} ${rx+14} ${ey}`} fill="none" stroke={AV_OL} strokeWidth="3.5" strokeLinecap="round"/>
      <path d={`M ${rx-12} ${ey+6} Q ${rx} ${ey+4} ${rx+12} ${ey+6}`} fill="none" stroke={AV_OL} strokeWidth="2" strokeLinecap="round" opacity=".35"/>
    </>
  );
  if (style === 3) return (
    <>
      <line x1={lx-10} y1={ey-10} x2={lx+10} y2={ey+10} stroke={AV_OL} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1={lx+10} y1={ey-10} x2={lx-10} y2={ey+10} stroke={AV_OL} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1={rx-10} y1={ey-10} x2={rx+10} y2={ey+10} stroke={AV_OL} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1={rx+10} y1={ey-10} x2={rx-10} y2={ey+10} stroke={AV_OL} strokeWidth="4.5" strokeLinecap="round"/>
    </>
  );
  const heart = (cx) => <path d={`M ${cx} ${ey+8} C ${cx-16} ${ey-2} ${cx-16} ${ey-15} ${cx} ${ey-7} C ${cx+16} ${ey-15} ${cx+16} ${ey-2} ${cx} ${ey+8}`} fill="#E53E3E" stroke={AV_OL} strokeWidth="1.5"/>;
  return <>{heart(lx)}{heart(rx)}</>;
}

function BhEyebrows({ style, col }) {
  const lx=107, rx=173, by=112;
  if (style === 0) return (
    <>
      <path d={`M ${lx-16} ${by} Q ${lx} ${by-9} ${lx+16} ${by}`} fill="none" stroke={col} strokeWidth="4.5" strokeLinecap="round"/>
      <path d={`M ${rx-16} ${by} Q ${rx} ${by-9} ${rx+16} ${by}`} fill="none" stroke={col} strokeWidth="4.5" strokeLinecap="round"/>
    </>
  );
  if (style === 1) return (
    <>
      <line x1={lx-16} y1={by+2} x2={lx+16} y2={by+2} stroke={col} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1={rx-16} y1={by+2} x2={rx+16} y2={by+2} stroke={col} strokeWidth="4.5" strokeLinecap="round"/>
    </>
  );
  return (
    <>
      <line x1={lx-16} y1={by-4} x2={lx+16} y2={by+6} stroke={col} strokeWidth="4.5" strokeLinecap="round"/>
      <line x1={rx-16} y1={by+6} x2={rx+16} y2={by-4} stroke={col} strokeWidth="4.5" strokeLinecap="round"/>
    </>
  );
}

function BhMouth({ style }) {
  const mx=140, my=178;
  if (style === 0) return (
    <>
      <path d={`M 110 ${my} Q ${mx} ${my+24} 170 ${my}`} fill="#C03060" stroke={AV_OL} strokeWidth="3" strokeLinecap="round"/>
      <path d={`M 113 ${my} Q ${mx} ${my+18} 167 ${my}`} fill="white"/>
      <line x1="113" y1={my} x2="167" y2={my} stroke={AV_OL} strokeWidth="1.5" opacity=".35"/>
    </>
  );
  if (style === 1) return <path d={`M 118 ${my-2} Q ${mx} ${my+17} 162 ${my-2}`} fill="none" stroke={AV_OL} strokeWidth="3.5" strokeLinecap="round"/>;
  if (style === 2) return <line x1="120" y1={my} x2="160" y2={my} stroke={AV_OL} strokeWidth="3.5" strokeLinecap="round"/>;
  if (style === 3) return (
    <>
      <path d={`M 113 ${my} Q ${mx} ${my+19} 167 ${my}`} fill="#222" stroke={AV_OL} strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx={mx} cy={my+16} rx="13" ry="10" fill="#E878A0" stroke={AV_OL} strokeWidth="2"/>
    </>
  );
  return (
    <>
      <ellipse cx={mx} cy={my+5} rx="16" ry="14" fill="#222" stroke={AV_OL} strokeWidth="2.5"/>
      <ellipse cx={mx} cy={my} rx="13" ry="7" fill="white" opacity=".9"/>
    </>
  );
}

// ─── Head accessories ───────────────────────────────────────────────────────
function BhCrown() {
  return (
    <>
      <polygon points="105,74 105,55 122,67 140,47 158,67 175,55 175,74" fill="#F5D76E" stroke="#B8860B" strokeWidth="1.5"/>
      <rect x="105" y="74" width="70" height="14" rx="3" fill="#F5D76E" stroke="#B8860B" strokeWidth="1.5"/>
      <rect x="105" y="74" width="70" height="5" rx="2" fill="#B8860B" opacity=".25"/>
      <circle cx="140" cy="51" r="6" fill="#E53E3E"/><circle cx="140" cy="51" r="3" fill="#FF8080" opacity=".6"/>
      <circle cx="109" cy="67" r="4" fill="#4A90D9"/>
      <circle cx="171" cy="67" r="4" fill="#28C96F"/>
    </>
  );
}
function BhHalo() {
  return (
    <>
      <defs><filter id="hGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <ellipse cx="140" cy="36" rx="40" ry="11" fill="none" stroke="#F5D76E" strokeWidth="7" opacity=".85" filter="url(#hGlow)"/>
      <ellipse cx="140" cy="36" rx="40" ry="11" fill="none" stroke="white" strokeWidth="2.5" opacity=".45"/>
    </>
  );
}
function BhCatEars() {
  return (
    <>
      <path d="M87,84 L70,46 L112,72 Z" fill="#2A2A2A" stroke="#1A1110" strokeWidth="1.5"/>
      <path d="M89,82 L75,52 L109,71 Z" fill="#FF9BB3"/>
      <path d="M193,84 L210,46 L168,72 Z" fill="#2A2A2A" stroke="#1A1110" strokeWidth="1.5"/>
      <path d="M191,82 L205,52 L171,71 Z" fill="#FF9BB3"/>
    </>
  );
}
function BhPartyHat() {
  return (
    <>
      <path d="M140,16 L107,75 L173,75 Z" fill="#FF6524" stroke="#1A1110" strokeWidth="1.5"/>
      <path d="M140,16 L107,75 L173,75 Z" fill="url(#phStripe)" stroke="#1A1110" strokeWidth="1.5"/>
      <defs><pattern id="phStripe" patternUnits="userSpaceOnUse" patternTransform="rotate(35)" width="10" height="10"><rect width="5" height="10" fill="rgba(255,255,255,.25)"/></pattern></defs>
      <circle cx="140" cy="16" r="7" fill="#F5D76E" stroke="#1A1110" strokeWidth="1.5"/>
    </>
  );
}
function BhGradCap() {
  return (
    <>
      <polygon points="108,63 172,63 163,40 117,40" fill="#2A2A2A" stroke="#1A1110" strokeWidth="1.5"/>
      <ellipse cx="140" cy="63" rx="34" ry="8" fill="#1A1110" stroke="#1A1110" strokeWidth="1"/>
      <rect x="116" y="63" width="48" height="7" rx="2" fill="#1A1110"/>
      <line x1="172" y1="55" x2="194" y2="70" stroke="#F5D76E" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="194" y1="70" x2="194" y2="90" stroke="#F5D76E" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="194" cy="92" r="5.5" fill="#F5D76E"/>
    </>
  );
}
function BhTopHat() {
  return (
    <>
      <ellipse cx="140" cy="72" rx="46" ry="9" fill="#1A1110" stroke="#333" strokeWidth="1"/>
      <rect x="108" y="20" width="64" height="54" rx="5" fill="#1A1110" stroke="#333" strokeWidth="1"/>
      <rect x="108" y="60" width="64" height="9" rx="2" fill="#4466CC"/>
      <rect x="108" y="60" width="64" height="3" rx="1.5" fill="white" opacity=".12"/>
    </>
  );
}

// ─── Face decorations ───────────────────────────────────────────────────────
function BhBlush() {
  return (
    <>
      <ellipse cx="100" cy="153" rx="19" ry="12" fill="#FFB3C6" opacity=".65"/>
      <ellipse cx="180" cy="153" rx="19" ry="12" fill="#FFB3C6" opacity=".65"/>
    </>
  );
}
function BhFreckles() {
  return (
    <>
      {[[117,148],[128,155],[112,156],[163,148],[152,155],[168,156],[140,151]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={2.3} fill="#B8622A" opacity=".52"/>
      ))}
    </>
  );
}
function BhFaceStars() {
  return (
    <>
      {[[32,60],[248,56],[20,150],[260,146],[36,235],[244,230]].map(([x,y],i)=>(
        <text key={i} x={x} y={y} textAnchor="middle" fontSize={8+i%2*6} fill={['#F5D76E','#FF6524','#9B71F7','#4A90D9','#28C96F','#E53E3E'][i]} opacity=".88">✦</text>
      ))}
    </>
  );
}

// ─── Aura effects ───────────────────────────────────────────────────────────
function BhSparkles() {
  const pts = [[22,52],[258,70],[12,178],[268,195],[46,295],[234,295],[140,8],[76,33],[204,33],[26,130],[254,134]];
  const clrs = ['#FFD700','#FFF8DC','#FF9560','#C4A8FF','#7FFFD4'];
  return (
    <>
      {pts.map(([x,y],i) => {
        const s = 4 + i%4; const c = clrs[i%5];
        return (
          <g key={i} transform={`translate(${x},${y})`} opacity="0.85">
            <line x1={-s} y1="0" x2={s} y2="0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
            <line x1="0" y1={-s} x2="0" y2={s} stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
            <line x1={-(s*.6)} y1={-(s*.6)} x2={s*.6} y2={s*.6} stroke={c} strokeWidth="1.1" strokeLinecap="round" opacity="0.65"/>
            <line x1={s*.6} y1={-(s*.6)} x2={-(s*.6)} y2={s*.6} stroke={c} strokeWidth="1.1" strokeLinecap="round" opacity="0.65"/>
          </g>
        );
      })}
    </>
  );
}
function BhFire() {
  return (
    <>
      <defs>
        <radialGradient id="fg1" cx="50%" cy="100%" r="65%">
          <stop offset="0%" stopColor="#FF3000" stopOpacity="0.75"/>
          <stop offset="55%" stopColor="#FF6524" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="140" cy="338" rx="105" ry="30" fill="url(#fg1)"/>
      {[[68,304,9,22],[98,293,8,20],[128,286,10,21],[155,289,8,19],[184,295,9,20],[212,306,7,16]].map(([x,y,rx,ry],i)=>(
        <ellipse key={i} cx={x} cy={y+ry/2} rx={rx} ry={ry}
          fill={i%2?'#FF6524':'#FF4000'} opacity="0.55"
          transform={`rotate(${(i-2.5)*7},${x},${y+ry})`}/>
      ))}
    </>
  );
}
function BhRainbow() {
  const bands = [[135,'#FF6B6B'],[127,'#FFB347'],[119,'#FFE566'],[111,'#6BCB77'],[103,'#4D96FF'],[95,'#B784E0']];
  return (
    <>
      {bands.map(([r,color],i)=>(
        <path key={i}
          d={`M ${140-r},88 A ${r},${Math.round(r*0.7)} 0 0 1 ${140+r},88`}
          fill="none" stroke={color} strokeWidth="6" opacity="0.68"
          strokeLinecap="round"/>
      ))}
    </>
  );
}
function BhFloatHearts() {
  return (
    <>
      {[[58,28],[96,16],[140,22],[184,16],[222,28]].map(([x,y],i)=>(
        <text key={i} x={x} y={y} textAnchor="middle" fontSize={10+i%3*5} fill={['#FF6B9D','#E53E3E','#FF9BB3','#E53E3E','#FF6B9D'][i]} opacity={.65+i%3*.15}>♥</text>
      ))}
    </>
  );
}

// ─── Pet ────────────────────────────────────────────────────────────────────
function BhPet({ petId, purchased }) {
  if (!petId || !purchased.includes(petId)) return null;
  const key = PET_KEY_MAP[petId];
  if (!key || !PET_SVGS[key]) return null;
  return <image href={PET_SVGS[key]} x="190" y="238" width="80" height="80"/>;
}

// ─── Head item dispatcher ────────────────────────────────────────────────────
function BhHead({ headId }) {
  if (headId === 'crown')     return <BhCrown/>;
  if (headId === 'halo')      return <BhHalo/>;
  if (headId === 'cat_ears')  return <BhCatEars/>;
  if (headId === 'party_hat') return <BhPartyHat/>;
  if (headId === 'grad_cap')  return <BhGradCap/>;
  if (headId === 'top_hat')   return <BhTopHat/>;
  return null;
}

// ─── Main AvatarSVG component ────────────────────────────────────────────────
export default function AvatarSVG({ config, purchased = [], previewHead = null, style = {} }) {
  const c = config || {};

  if (c.presetId != null) {
    const src      = ALL_SVGS[c.presetId] || ALL_SVGS[0];
    const isPremium = c.presetId >= JPG_PRESET_START;
    const pc       = c.presetCfgs?.[c.presetId] || {};
    const hasBg    = purchased.includes(pc.background);
    const hasHead  = !isPremium && purchased.includes(pc.head);
    const hasFace  = !isPremium && purchased.includes(pc.face);
    const hasAura  = purchased.includes(pc.aura);
    const displayHead = !isPremium && (previewHead || (hasHead ? pc.head : null));

    return (
      <svg viewBox="0 0 280 340" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%', height:'100%', ...style }}>
        {isPremium
          ? <rect width="280" height="340" fill="#C5DFF0"/>
          : <BhBg bgId={hasBg ? pc.background : null}/>
        }
        <image href={src} x="0" y="0" width="280" height="340" preserveAspectRatio={isPremium ? "xMidYMid slice" : "xMidYMid meet"}/>
        {hasFace && pc.face === 'blush'      && <BhBlush/>}
        {hasFace && pc.face === 'freckles'   && <BhFreckles/>}
        {hasFace && pc.face === 'face_stars' && <BhFaceStars/>}
        {displayHead && <BhHead headId={displayHead}/>}
        {hasAura && pc.aura === 'float_hearts'  && <BhFloatHearts/>}
        {hasAura && pc.aura === 'aura_sparkles' && <BhSparkles/>}
        {hasAura && pc.aura === 'aura_fire'     && <BhFire/>}
        {hasAura && pc.aura === 'aura_rainbow'  && <BhRainbow/>}
        <BhPet petId={pc.pet} purchased={purchased}/>
      </svg>
    );
  }

  const skin  = SKIN_TONES[c.skinTone]       || SKIN_TONES[0];
  const hairC = HAIR_COLORS[c.hairColor]      || HAIR_COLORS[2];
  const eyeC  = EYE_COLORS[c.eyeColor]        || EYE_COLORS[0];
  const clothC= CLOTHING_COLORS[c.outfitColor]|| CLOTHING_COLORS[1];
  const hasBg = purchased.includes(c.background);

  return (
    <svg viewBox="0 0 280 340" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%', height:'100%', ...style }}>
      <BhBg bgId={hasBg ? c.background : null}/>
      <BhHairBack style={c.hairStyle} col={hairC}/>
      <BhClothing style={c.outfitStyle} col={clothC}/>
      <rect x="120" y="212" width="40" height="32" rx="5" fill={skin.b} stroke={AV_OL} strokeWidth="2.5"/>
      <ellipse cx="57"  cy="140" rx="11" ry="17" fill={skin.b} stroke={AV_OL} strokeWidth="2.5"/>
      <ellipse cx="223" cy="140" rx="11" ry="17" fill={skin.b} stroke={AV_OL} strokeWidth="2.5"/>
      <ellipse cx="57"  cy="140" rx="5"  ry="9"  fill={skin.s} opacity=".35"/>
      <ellipse cx="223" cy="140" rx="5"  ry="9"  fill={skin.s} opacity=".35"/>
      <ellipse cx="140" cy="132" rx="82" ry="82" fill={skin.b} stroke={AV_OL} strokeWidth="2.5"/>
      <ellipse cx="140" cy="184" rx="54" ry="18" fill={skin.s} opacity=".2"/>
      <BhEyes style={c.eyeStyle} col={eyeC} skin={skin}/>
      <ellipse cx="136" cy="160" rx="4" ry="3" fill={skin.s} opacity=".45"/>
      <ellipse cx="144" cy="160" rx="4" ry="3" fill={skin.s} opacity=".45"/>
      <BhMouth style={c.mouth ?? 0}/>
      <BhEyebrows style={c.eyebrow ?? 0} col={hairC}/>
      <BhHairFront style={c.hairStyle} col={hairC}/>
    </svg>
  );
}
