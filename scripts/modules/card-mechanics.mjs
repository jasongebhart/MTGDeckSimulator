/**
 * Card Mechanics Module
 * Handles card abilities, transformations, and special mechanics
 */

// Double-Faced Card (DFC) Database
export const DFC_DATABASE = {
  // Delver and similar upkeep triggers
  'delver of secrets': {
    frontFace: 'Delver Of Secrets',
    backFace: 'Insectile Aberration',
    transformTrigger: 'upkeep_reveal_instant_sorcery',
    canTransformBack: false
  },

  // Werewolves (Innistrad)
  'huntmaster of the fells': {
    frontFace: 'Huntmaster of the Fells',
    backFace: 'Ravager of the Fells',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'mayor of avabruck': {
    frontFace: 'Mayor of Avabruck',
    backFace: 'Howlpack Alpha',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'daybreak ranger': {
    frontFace: 'Daybreak Ranger',
    backFace: 'Nightfall Predator',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'village ironsmith': {
    frontFace: 'Village Ironsmith',
    backFace: 'Ironfang',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'kruin outlaw': {
    frontFace: 'Kruin Outlaw',
    backFace: 'Terror of Kruin Pass',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'tormented pariah': {
    frontFace: 'Tormented Pariah',
    backFace: 'Rampaging Werewolf',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'garruk relentless': {
    frontFace: 'Garruk Relentless',
    backFace: 'Garruk, the Veil-Cursed',
    transformTrigger: 'loyalty_2_or_less',
    canTransformBack: false
  },

  // Innistrad Horror/Transforms
  'civilized scholar': {
    frontFace: 'Civilized Scholar',
    backFace: 'Homicidal Brute',
    transformTrigger: 'discard_creature',
    canTransformBack: true
  },
  'ludevic\'s test subject': {
    frontFace: 'Ludevic\'s Test Subject',
    backFace: 'Ludevic\'s Abomination',
    transformTrigger: 'counter_based',
    canTransformBack: false
  },
  'chalice of life': {
    frontFace: 'Chalice of Life',
    backFace: 'Chalice of Death',
    transformTrigger: 'life_30_or_more',
    canTransformBack: false
  },

  // Eldritch Moon DFCs
  'thing in the ice': {
    frontFace: 'Thing in the Ice',
    backFace: 'Awoken Horror',
    transformTrigger: 'counter_removal',
    canTransformBack: false
  },
  'ulvenwald observer': {
    frontFace: 'Ulvenwald Observer',
    backFace: 'Ulvenwald Abomination',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },

  // Shadows over Innistrad DFCs
  'westvale abbey': {
    frontFace: 'Westvale Abbey',
    backFace: 'Ormendahl, Profane Prince',
    transformTrigger: 'sacrifice_five_creatures',
    canTransformBack: false
  },
  'hanweir battlements': {
    frontFace: 'Hanweir Battlements',
    backFace: 'Hanweir, the Writhing Township',
    transformTrigger: 'meld',
    canTransformBack: false
  },

  // Midnight Hunt/Crimson Vow DFCs
  'suspicious stowaway': {
    frontFace: 'Suspicious Stowaway',
    backFace: 'Seafaring Werewolf',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'village watch': {
    frontFace: 'Village Watch',
    backFace: 'Village Reavers',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'tovolar, dire overlord': {
    frontFace: 'Tovolar, Dire Overlord',
    backFace: 'Tovolar, the Midnight Scourge',
    transformTrigger: 'werewolf',
    canTransformBack: true
  },
  'arlinn, the pack\'s hope': {
    frontFace: 'Arlinn, the Pack\'s Hope',
    backFace: 'Arlinn, the Moon\'s Fury',
    transformTrigger: 'daybound_nightbound',
    canTransformBack: true
  },

  // Zendikar Rising MDFCs (Modal Double-Faced Cards)
  'valakut awakening': {
    frontFace: 'Valakut Awakening',
    backFace: 'Valakut Stoneforge',
    transformTrigger: 'mdfc',
    canTransformBack: false
  },
  'agadeem\'s awakening': {
    frontFace: 'Agadeem\'s Awakening',
    backFace: 'Agadeem, the Undercrypt',
    transformTrigger: 'mdfc',
    canTransformBack: false
  },
  'glasspool mimic': {
    frontFace: 'Glasspool Mimic',
    backFace: 'Glasspool Shore',
    transformTrigger: 'mdfc',
    canTransformBack: false
  }
};

export class CardMechanics {
  constructor(gameState) {
    this.gameState = gameState;
  }

  // DFC Helper Methods
  isDFC(cardName) {
    return DFC_DATABASE[cardName.toLowerCase()] !== undefined;
  }

  getDFCInfo(cardName) {
    return DFC_DATABASE[cardName.toLowerCase()];
  }

  canTransform(cardName) {
    const dfcInfo = this.getDFCInfo(cardName);
    return dfcInfo !== undefined;
  }

  getOtherFace(cardName) {
    const dfcInfo = this.getDFCInfo(cardName);
    if (!dfcInfo) return null;

    const lowerName = cardName.toLowerCase();
    if (lowerName === dfcInfo.frontFace.toLowerCase()) {
      return dfcInfo.backFace;
    }
    if (lowerName === dfcInfo.backFace.toLowerCase()) {
      return dfcInfo.frontFace;
    }
    return null;
  }

  transformCard(card) {
    const otherFace = this.getOtherFace(card.name);
    if (otherFace) {
      card.name = otherFace;
      card.isTransformed = !card.isTransformed;
      return true;
    }
    return false;
  }

  // Mana value parsing
  parseManaValue(cost) {
    if (!cost) return 0;

    // Handle simple numeric costs first
    const simpleNumber = parseInt(cost);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }

    let totalCost = 0;

    // Handle MTG format with curly braces like {2}{U}
    const numbers = cost.match(/\{(\d+)\}/g);
    if (numbers) {
      numbers.forEach(num => {
        const value = parseInt(num.replace(/[{}]/g, ''));
        if (!isNaN(value)) totalCost += value;
      });
    }

    const coloredMana = cost.match(/\{[WUBRG]\}/g);
    if (coloredMana) totalCost += coloredMana.length;

    // Handle simple letter format (like "B", "U", "RR", "2U", etc.)
    if (totalCost === 0) {
      const numericPart = cost.match(/\d+/);
      if (numericPart) {
        totalCost += parseInt(numericPart[0]);
      }

      const colorMatches = cost.match(/[WUBRG]/g);
      if (colorMatches) {
        totalCost += colorMatches.length;
      }
    }

    return totalCost;
  }

  // Get generic mana cost (for delve)
  getGenericManaCost(cost) {
    if (!cost) return 0;

    // Handle simple numeric costs first
    const simpleNumber = parseInt(cost);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }

    let genericCost = 0;

    // Handle MTG format with curly braces like {2}{U} - only count the {2} part
    const numbers = cost.match(/\{(\d+)\}/g);
    if (numbers) {
      numbers.forEach(num => {
        const value = parseInt(num.replace(/[{}]/g, ''));
        if (!isNaN(value)) genericCost += value;
      });
    }

    // Handle simple letter format with numeric prefix (like "2U")
    if (genericCost === 0) {
      const numericPart = cost.match(/^(\d+)/);
      if (numericPart) {
        genericCost += parseInt(numericPart[1]);
      }
    }

    return genericCost;
  }

  // Card type checking
  isCreature(card) {
    return card.type && card.type.toLowerCase().includes('creature');
  }

  isLand(card) {
    return card.type && card.type.toLowerCase().includes('land');
  }

  isInstant(card) {
    return card.type && card.type.toLowerCase().includes('instant');
  }

  isSorcery(card) {
    return card.type && card.type.toLowerCase().includes('sorcery');
  }

  isArtifact(card) {
    return card.type && card.type.toLowerCase().includes('artifact');
  }

  isEnchantment(card) {
    return card.type && card.type.toLowerCase().includes('enchantment');
  }

  isPlaneswalker(card) {
    return card.type && card.type.toLowerCase().includes('planeswalker');
  }

  // Creature stats parsing
  getPowerToughness(card) {
    if (!card.powerToughness && !card.pt) return null;

    const pt = card.powerToughness || card.pt;
    const match = pt.match(/(\d+|[\*\+\-\d]+)\s*\/\s*(\d+|[\*\+\-\d]+)/);

    if (match) {
      return {
        power: match[1],
        toughness: match[2]
      };
    }

    return null;
  }

  // Counter management
  addCounter(card, counterType, amount = 1) {
    if (!card.counters) {
      card.counters = {};
    }
    card.counters[counterType] = (card.counters[counterType] || 0) + amount;
  }

  removeCounter(card, counterType, amount = 1) {
    if (!card.counters || !card.counters[counterType]) return 0;

    const removed = Math.min(card.counters[counterType], amount);
    card.counters[counterType] -= removed;

    if (card.counters[counterType] === 0) {
      delete card.counters[counterType];
    }

    return removed;
  }

  getCounters(card, counterType) {
    return card.counters?.[counterType] || 0;
  }

  // Tap/Untap
  tap(card) {
    card.tapped = true;
  }

  untap(card) {
    card.tapped = false;
  }

  isTapped(card) {
    return card.tapped === true;
  }

  // Card abilities detection
  hasAbility(card, abilityName) {
    if (!card.text) return false;
    return card.text.toLowerCase().includes(abilityName.toLowerCase());
  }

  hasKeyword(card, keyword) {
    if (!card.text) return false;
    const text = card.text.toLowerCase();
    const keywordLower = keyword.toLowerCase();

    // Check for standalone keyword or keyword with colon (like "Flying" or "Delve:")
    const pattern = new RegExp(`\\b${keywordLower}\\b|${keywordLower}:`);
    return pattern.test(text);
  }

  // Get DFC data from the database
  getDFCData(cardName) {
    return DFC_DATABASE[cardName.toLowerCase()];
  }

  // Cascade detection
  hasCascade(card) {
    if (!card.text) return false;
    return card.text.toLowerCase().includes('cascade');
  }
}
