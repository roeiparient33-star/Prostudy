import { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag, User, Smile } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AvatarSVG from '../components/AvatarSVG';
import { PRESET_SVGS } from '../data/presetSvgs';
import { NEW_PRESET_SVGS } from '../data/newPresetSvgs';

const ALL_PRESET_SVGS = [...PRESET_SVGS, ...NEW_PRESET_SVGS];
import {
  PRESET_NAMES, PRESET_COSTS, SHOP_ITEMS, SHOP_CATEGORIES,
  RARITY_LABELS, JPG_PRESET_START, JPG_SUPPORTED_CATEGORIES,
} from '../data/avatarData';

const isPremiumPreset = (idx) => idx != null && idx >= JPG_PRESET_START;

const EMPTY_CFG = { baseSelected: false, presetId: null, presetCfgs: {} };

const CATEGORY_EMOJI = {
  head:       { crown:'👑', halo:'😇', cat_ears:'🐱', party_hat:'🎉', grad_cap:'🎓', top_hat:'🎩' },
  face:       { blush:'🌸', freckles:'✨', face_stars:'⭐' },
  background: { bg_sunset:'🌅', bg_space:'🌌', bg_confetti:'🎊' },
  aura:       { float_hearts:'💕', aura_sparkles:'✨', aura_fire:'🔥', aura_rainbow:'🌈' },
  pet:        { pet_dog:'🐶', pet_robot:'🤖', pet_duck:'🦆', pet_bunny:'🐰', pet_cat:'🐱' },
};

export default function Avatar() {
  const { user, profile, updateProfile } = useAuth();

  const [cfg, setCfg]                     = useState(profile?.avatar_config     || EMPTY_CFG);
  const [purchased, setPurchased]         = useState(profile?.avatar_purchased  || {});
  const [presetsPurchased, setPresetsP]   = useState(profile?.presets_purchased || []);
  const [credits, setCredits]             = useState(profile?.credits           || 0);

  const [tab, setTab]           = useState('base');
  const [shopCat, setShopCat]   = useState('head');
  const [hoverPreview, setHoverPreview] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);

  const PRESETS_INITIAL = 6;

  useEffect(() => {
    if (profile) {
      setCfg(profile.avatar_config     || EMPTY_CFG);
      setPurchased(profile.avatar_purchased  || {});
      setPresetsP(profile.presets_purchased  || []);
      setCredits(profile.credits             || 0);
    }
  }, [profile]);

  const pid = cfg.presetId;
  const ownedItems = (pid != null && purchased?.[pid]) ? purchased[pid] : [];

  async function save(newCfg, newPurchased, newPresets, newCredits) {
    setSaving(true);
    await updateProfile({
      avatar_config:    newCfg      ?? cfg,
      avatar_purchased: newPurchased ?? purchased,
      presets_purchased: newPresets  ?? presetsPurchased,
      credits:          newCredits   ?? credits,
    });
    setSaving(false);
  }

  function selectPreset(idx) {
    const next = { ...cfg, baseSelected: true, presetId: idx };
    setCfg(next);
    if (isPremiumPreset(idx) && !JPG_SUPPORTED_CATEGORIES.includes(shopCat)) {
      setShopCat('aura');
    }
    save(next, null, null, null);
  }

  function buyPreset(idx) {
    const cost = PRESET_COSTS[idx];
    if (credits < cost) return;
    const newCredits = credits - cost;
    const newPresets = [...presetsPurchased, idx];
    const next       = { ...cfg, baseSelected: true, presetId: idx };
    setCredits(newCredits);
    setPresetsP(newPresets);
    setCfg(next);
    if (isPremiumPreset(idx) && !JPG_SUPPORTED_CATEGORIES.includes(shopCat)) {
      setShopCat('aura');
    }
    save(next, null, newPresets, newCredits);
  }

  function buyItem(item) {
    if (pid == null || ownedItems.includes(item.id) || credits < item.cost) return;
    const newCredits  = credits - item.cost;
    const pc          = cfg.presetCfgs?.[pid] || {};
    const newPc       = { ...pc, [item.category]: item.id };
    const newCfg      = { ...cfg, presetCfgs: { ...(cfg.presetCfgs || {}), [pid]: newPc } };
    const newPurchased= { ...purchased, [pid]: [...ownedItems, item.id] };
    setCredits(newCredits);
    setCfg(newCfg);
    setPurchased(newPurchased);
    save(newCfg, newPurchased, null, newCredits);
  }

  function equipItem(item) {
    if (pid == null || !ownedItems.includes(item.id)) return;
    const pc   = cfg.presetCfgs?.[pid] || {};
    const isOn = pc[item.category] === item.id;
    const newPc  = { ...pc, [item.category]: isOn ? null : item.id };
    const newCfg = { ...cfg, presetCfgs: { ...(cfg.presetCfgs || {}), [pid]: newPc } };
    setCfg(newCfg);
    save(newCfg, null, null, null);
  }

  function makePreview(item) {
    if (pid == null) return null;
    const pc    = cfg.presetCfgs?.[pid] || {};
    const newPc = { ...pc, [item.category]: item.id };
    return {
      cfg:       { ...cfg, presetCfgs: { ...(cfg.presetCfgs || {}), [pid]: newPc } },
      purchased: ownedItems.includes(item.id) ? ownedItems : [...ownedItems, item.id],
    };
  }

  const currentPc = (pid != null && cfg.presetCfgs?.[pid]) || {};

  return (
    <div className="page-enter">
      <div className="av-header">
        <h2 className="av-title">סוכן הלימודים שלי</h2>
        <div className="av-credits-pill">
          <Sparkles size={14}/>
          <span>{credits} קרדיטים</span>
        </div>
      </div>

      <div className="av-layout">
        {/* ── Preview panel ── */}
        <div className="av-preview-col" data-tour="avatar-preview">
          <div className="card av-preview-card">
            <div className="av-preview-frame">
              {cfg.baseSelected
                ? <AvatarSVG
                    config={hoverPreview?.cfg ?? cfg}
                    purchased={hoverPreview?.purchased ?? ownedItems}
                  />
                : <div className="av-preview-empty"><Smile size={52} strokeWidth={1}/></div>
              }
            </div>
            {saving && <div className="av-saving">שומר...</div>}
          </div>

          <div className="card av-credits-card">
            <div className="av-credits-label">הקרדיטים שלך</div>
            <div className="av-credits-value">{credits}</div>
            <div className="av-credits-sub">1 דקת לימוד = קרדיט אחד</div>
          </div>
        </div>

        {/* ── Tabs panel ── */}
        <div className="av-tabs-col">
          <div className="av-tabs">
            <button className={`av-tab${tab==='base'?' active':''}`} onClick={()=>setTab('base')}>
              <User size={15}/> בחר בסיס
            </button>
            <button className={`av-tab${tab==='shop'?' active':''}`} onClick={()=>setTab('shop')}>
              <ShoppingBag size={15}/> חנות
            </button>
          </div>

          {/* Base presets */}
          {tab === 'base' && (() => {
            const visiblePresets = showAllPresets
              ? ALL_PRESET_SVGS
              : ALL_PRESET_SVGS.slice(0, PRESETS_INITIAL);
            const hasMore = ALL_PRESET_SVGS.length > PRESETS_INITIAL;
            return (
              <>
                <div className="av-presets-grid">
                  {visiblePresets.map((src, i) => {
                    const owned     = presetsPurchased.includes(i);
                    const active    = cfg.presetId === i && cfg.baseSelected;
                    const cost      = PRESET_COSTS[i];
                    const canAfford = credits >= cost;
                    return (
                      <div key={i} className={`av-preset-card${active?' active':''}`}>
                        <div className="av-preset-img-wrap">
                          <img src={src} alt={PRESET_NAMES[i]} className="av-preset-img"/>
                          {!owned && <div className="av-preset-lock">🔒</div>}
                        </div>
                        {owned
                          ? <>
                              {presetsPurchased[0] === i && (
                                <div style={{fontSize:10,color:'var(--green)',fontWeight:700,marginBottom:4}}>חינם</div>
                              )}
                              <button className={`av-preset-btn${active?' av-preset-btn-active':''}`} onClick={()=>selectPreset(i)}>
                                {active ? '✓ נבחר' : 'בחר'}
                              </button>
                            </>
                          : <button className="av-preset-btn av-preset-btn-buy" onClick={()=>buyPreset(i)} disabled={!canAfford}>
                              {cost} קרדיטים
                            </button>
                        }
                      </div>
                    );
                  })}
                </div>
                {hasMore && (
                  <button
                    className="av-show-more-btn"
                    onClick={() => setShowAllPresets(p => !p)}
                  >
                    {showAllPresets
                      ? '▲ הסתר'
                      : `ראה עוד (${ALL_PRESET_SVGS.length - PRESETS_INITIAL} נוספות)`}
                  </button>
                )}
              </>
            );
          })()}

          {/* Shop */}
          {tab === 'shop' && (
            <>
              {!cfg.baseSelected && (
                <div className="av-shop-notice">בחר סוכן לימודים תחילה כדי לקנות פריטים</div>
              )}
              <div className="av-cat-tabs">
                {SHOP_CATEGORIES
                  .filter(cat => !isPremiumPreset(pid) || JPG_SUPPORTED_CATEGORIES.includes(cat.id))
                  .map(cat => (
                    <button key={cat.id} className={`av-cat-tab${shopCat===cat.id?' active':''}`} onClick={()=>setShopCat(cat.id)}>
                      {cat.label}
                    </button>
                  ))}
              </div>
              <div className="av-shop-grid">
                {SHOP_ITEMS.filter(i => i.category === shopCat).map(item => {
                  const owned    = ownedItems.includes(item.id);
                  const equipped = currentPc[item.category] === item.id;
                  const canAfford= credits >= item.cost;
                  const pv       = cfg.baseSelected ? makePreview(item) : null;
                  return (
                    <div
                      key={item.id}
                      className={`av-shop-card rarity-${item.rarity}${!owned&&!canAfford?' av-shop-cant':''}${equipped?' av-shop-equipped':''}`}
                      onMouseEnter={() => pv && setHoverPreview(pv)}
                      onMouseLeave={() => setHoverPreview(null)}
                    >
                      <div className="av-shop-art">
                        {pv
                          ? <AvatarSVG config={pv.cfg} purchased={pv.purchased} style={{width:'100%',height:'100%'}}/>
                          : <span style={{fontSize:36}}>{CATEGORY_EMOJI[item.category]?.[item.id] ?? '✨'}</span>
                        }
                      </div>
                      <div className="av-shop-name">{item.name}</div>
                      {owned
                        ? <button className={`av-shop-btn${equipped?' av-shop-btn-equipped':' av-shop-btn-equip'}`} onClick={()=>equipItem(item)}>
                            {equipped ? '✓ מצויד' : 'צייד'}
                          </button>
                        : <button className="av-shop-btn av-shop-btn-buy" onClick={()=>buyItem(item)} disabled={!cfg.baseSelected||!canAfford}>
                            💰 {item.cost}
                          </button>
                      }
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
