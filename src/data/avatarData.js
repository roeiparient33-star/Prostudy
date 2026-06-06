export const AV_OL = '#1A1110';

export const SKIN_TONES = [
  { b: '#FDDBB4', s: '#F2AE72' },
  { b: '#F5C97A', s: '#E5A84A' },
  { b: '#C68642', s: '#A0522D' },
  { b: '#8D5524', s: '#6B3A1F' },
  { b: '#E8A87C', s: '#D4845A' },
  { b: '#4A2C1A', s: '#321A0E' },
];

export const HAIR_COLORS = ['#F5D76E','#E8873A','#1A1110','#EFEFEF','#6B3A2A','#4466CC','#E87CA0'];
export const EYE_COLORS  = ['#7C4A1E','#4A90D9','#4A8C4A','#7A8C9E'];
export const CLOTHING_COLORS = ['#FFFFFF','#4F7EF7','#2A2A2A','#28C96F','#E53E3E','#9B71F7','#FF6524'];

export const HAIR_STYLE_NAMES    = ['קצר','ארוך','גלים','אפרו','בוב','מגולח','פיקסי'];
export const EYE_STYLE_NAMES     = ['רגיל','שמח','עצבני','מסחרר','לבבות'];
export const EYEBROW_STYLE_NAMES = ['עקום','ישר','כועס'];
export const MOUTH_STYLE_NAMES   = ['חיוך גדול','חיוך','ניטרלי','לשון','פה פתוח'];
export const OUTFIT_STYLE_NAMES  = ['חולצה','הודי','פורמלי','V-neck'];

export const BASE_AVATARS = [
  { id: 0, name: 'קלאסי',    emoji: '🎓', skinTone: 0, hairStyle: 0, hairColor: 2, eyeStyle: 0, eyeColor: 0, eyebrow: 0, mouth: 1, outfitStyle: 2, outfitColor: 1 },
  { id: 1, name: 'ספורטיבי', emoji: '🏃', skinTone: 2, hairStyle: 5, hairColor: 2, eyeStyle: 0, eyeColor: 0, eyebrow: 1, mouth: 0, outfitStyle: 0, outfitColor: 3 },
  { id: 2, name: 'אמנותי',   emoji: '🎨', skinTone: 0, hairStyle: 1, hairColor: 6, eyeStyle: 1, eyeColor: 1, eyebrow: 0, mouth: 2, outfitStyle: 1, outfitColor: 5 },
  { id: 3, name: 'שאנן',     emoji: '😎', skinTone: 1, hairStyle: 4, hairColor: 1, eyeStyle: 0, eyeColor: 3, eyebrow: 1, mouth: 1, outfitStyle: 3, outfitColor: 4 },
  { id: 4, name: 'חכם',      emoji: '🤓', skinTone: 0, hairStyle: 6, hairColor: 0, eyeStyle: 0, eyeColor: 2, eyebrow: 2, mouth: 2, outfitStyle: 2, outfitColor: 6 },
  { id: 5, name: 'אנרגטי',   emoji: '⚡', skinTone: 3, hairStyle: 3, hairColor: 4, eyeStyle: 2, eyeColor: 1, eyebrow: 0, mouth: 0, outfitStyle: 0, outfitColor: 2 },
];

// Original 6 presets + 7 new premium JPG ones
export const PRESET_NAMES = [
  'אמיץ', 'נינג׳ה', 'אמן', 'חכמה', 'אנרגטי', 'קלאסית',
  'חייזר', 'גיימרית', 'צוללן', 'פיראט', 'ליצן', 'אביר', 'ראפר',
];
export const PRESET_COSTS = [
  80, 60, 90, 70, 100, 75,
  350, 400, 320, 370, 300, 420, 450,
];

// Indices 6-12 are JPG presets — support only aura, pet
export const JPG_PRESET_START = 6;
export const JPG_SUPPORTED_CATEGORIES = ['aura', 'pet'];

export const SHOP_ITEMS = [
  { id: 'crown',        name: 'כתר',           category: 'head',       cost: 80,  rarity: 'legendary' },
  { id: 'halo',         name: 'הילה',           category: 'head',       cost: 50,  rarity: 'rare'      },
  { id: 'cat_ears',     name: 'אוזני חתול',     category: 'head',       cost: 40,  rarity: 'common'    },
  { id: 'party_hat',    name: 'כובע מסיבה',     category: 'head',       cost: 35,  rarity: 'common'    },
  { id: 'grad_cap',     name: 'כובע סיום',      category: 'head',       cost: 60,  rarity: 'rare'      },
  { id: 'top_hat',      name: "כובע ג'נטלמן",  category: 'head',       cost: 65,  rarity: 'rare'      },
  { id: 'blush',        name: 'סומק',           category: 'face',       cost: 20,  rarity: 'common'    },
  { id: 'freckles',     name: 'נמשים',          category: 'face',       cost: 30,  rarity: 'common'    },
  { id: 'face_stars',   name: 'כוכבי פנים',     category: 'face',       cost: 45,  rarity: 'rare'      },
  { id: 'bg_sunset',    name: 'שקיעה',          category: 'background', cost: 40,  rarity: 'common'    },
  { id: 'bg_space',     name: 'חלל',            category: 'background', cost: 60,  rarity: 'rare'      },
  { id: 'bg_confetti',  name: 'קונפטי',         category: 'background', cost: 50,  rarity: 'rare'      },
  { id: 'float_hearts',   name: 'לבבות',          category: 'aura',       cost: 55,  rarity: 'rare'      },
  { id: 'aura_sparkles',  name: 'ניצוצות',        category: 'aura',       cost: 65,  rarity: 'rare'      },
  { id: 'aura_fire',      name: 'להבות',          category: 'aura',       cost: 80,  rarity: 'legendary' },
  { id: 'aura_rainbow',   name: 'קשת',            category: 'aura',       cost: 70,  rarity: 'rare'      },
  { id: 'pet_dog',      name: 'כלב',            category: 'pet',        cost: 100, rarity: 'legendary' },
  { id: 'pet_robot',    name: 'רובוט',          category: 'pet',        cost: 150, rarity: 'legendary' },
  { id: 'pet_duck',     name: 'ברווז',          category: 'pet',        cost: 80,  rarity: 'legendary' },
  { id: 'pet_bunny',    name: 'ארנב',           category: 'pet',        cost: 90,  rarity: 'legendary' },
  { id: 'pet_cat',      name: 'חתול',           category: 'pet',        cost: 120, rarity: 'legendary' },
];

export const PET_KEY_MAP = {
  pet_dog: 'dog', pet_robot: 'robot', pet_duck: 'duck', pet_bunny: 'bunny', pet_cat: 'cat',
};

export const SHOP_CATEGORIES = [
  { id: 'head',       label: 'כיסויי ראש' },
  { id: 'face',       label: 'פנים'        },
  { id: 'background', label: 'רקע'         },
  { id: 'aura',       label: 'אפקטים'      },
  { id: 'pet',        label: 'חיית מחמד'  },
];

export const RARITY_LABELS = {
  common:    'רגיל',
  uncommon:  'בינוני',
  rare:      'נדיר',
  legendary: 'אגדי',
};
