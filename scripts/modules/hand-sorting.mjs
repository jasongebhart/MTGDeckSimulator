/**
 * Hand Sorting Module
 * Handles all hand sorting operations for both player and opponent
 */

export const HandSorting = {
  /**
   * Sort player hand by specified mode
   */
  sortHand(mode = 'lands-first') {
    const hand = this.gameState.player.hand;

    if (hand.length === 0) {
      this.uiManager.showToast('No cards in hand to sort', 'warning');
      return;
    }

    // Save preference
    localStorage.setItem('mtg-hand-sort-mode', mode);

    // Update button text
    const sortButton = document.getElementById('sortHandButton');
    const modeLabels = {
      'hands-first': '🔄 Spells First',
      'lands-first': '🔄 Lands First',
      'cmc': '🔄 By Mana Value',
      'type': '🔄 By Type',
      'name': '🔄 Alphabetical'
    };
    if (sortButton) {
      sortButton.textContent = modeLabels[mode] || modeLabels['hands-first'];
    }

    this.applySortMode(hand, mode);
    this.uiManager.updateZoneDisplay('hand', 'player');

    const toastMessages = {
      'hands-first': 'Hand sorted: Spells first by mana value, then lands',
      'lands-first': 'Hand sorted: Lands first, then by type',
      'cmc': 'Hand sorted by mana value',
      'type': 'Hand sorted by card type',
      'name': 'Hand sorted alphabetically'
    };
    this.uiManager.showToast(toastMessages[mode] || toastMessages['hands-first'], 'info');
  },

  /**
   * Sort opponent hand by specified mode
   */
  sortOpponentHand(mode = 'lands-first') {
    const hand = this.gameState.opponent.hand;

    if (hand.length === 0) {
      this.uiManager.showToast('No cards in opponent hand to sort', 'warning');
      return;
    }

    // Save preference
    localStorage.setItem('mtg-opponent-hand-sort-mode', mode);

    // Update button text
    const sortButton = document.getElementById('sortOpponentHandButton');
    const modeLabels = {
      'hands-first': '🔄 Spells First',
      'lands-first': '🔄 Lands First',
      'cmc': '🔄 By Mana Value',
      'type': '🔄 By Type',
      'name': '🔄 Alphabetical'
    };
    if (sortButton) {
      sortButton.textContent = modeLabels[mode] || modeLabels['hands-first'];
    }

    this.applySortMode(hand, mode);
    this.uiManager.updateZoneDisplay('hand', 'opponent');

    const toastMessages = {
      'hands-first': 'Player 2 hand sorted: Spells first by mana value, then lands',
      'lands-first': 'Player 2 hand sorted: Lands first, then by type',
      'cmc': 'Player 2 hand sorted by mana value',
      'type': 'Player 2 hand sorted by card type',
      'name': 'Player 2 hand sorted alphabetically'
    };
    this.uiManager.showToast(toastMessages[mode] || toastMessages['hands-first'], 'info');
  },

  /**
   * Auto-sort player hand based on saved preference
   */
  autoSortHand() {
    const savedMode = localStorage.getItem('mtg-hand-sort-mode') || 'lands-first';
    const hand = this.gameState.player.hand;

    if (hand.length === 0) return;

    this.applySortMode(hand, savedMode);
  },

  /**
   * Auto-sort opponent hand based on saved preference
   */
  autoSortOpponentHand() {
    const savedMode = localStorage.getItem('mtg-opponent-hand-sort-mode') || 'lands-first';
    const hand = this.gameState.opponent.hand;

    if (hand.length === 0) return;

    this.applySortMode(hand, savedMode);
  },

  /**
   * Apply sort mode to a hand array
   */
  applySortMode(hand, mode) {
    hand.sort((a, b) => {
      const aType = this.getCardMainType(a.type);
      const bType = this.getCardMainType(b.type);
      const aCost = this.parseManaValue(a.cost);
      const bCost = this.parseManaValue(b.cost);

      switch(mode) {
        case 'hands-first': {
          // Non-lands first (sorted by CMC), then lands (sorted by name)
          const aIsLand = aType === 'Land';
          const bIsLand = bType === 'Land';

          if (aIsLand !== bIsLand) {
            return aIsLand ? 1 : -1; // Non-lands come first
          }

          if (!aIsLand && !bIsLand) {
            // Both are non-lands, sort by CMC then name
            if (aCost !== bCost) return aCost - bCost;
            return a.name.localeCompare(b.name);
          }

          // Both are lands, sort by name
          return a.name.localeCompare(b.name);
        }

        case 'lands-first': {
          // Lands first, then by card type, then by cost
          const typeOrder = { 'Land': 0, 'Creature': 1, 'Artifact': 2, 'Enchantment': 3, 'Sorcery': 4, 'Instant': 5 };
          const aOrder = typeOrder[aType] !== undefined ? typeOrder[aType] : 6;
          const bOrder = typeOrder[bType] !== undefined ? typeOrder[bType] : 6;

          if (aOrder !== bOrder) {
            return aOrder - bOrder;
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);
        }

        case 'cmc': {
          // Sort by mana cost (lands at end), then by name
          const aIsLandCMC = aType === 'Land';
          const bIsLandCMC = bType === 'Land';

          // Put lands at the end
          if (aIsLandCMC !== bIsLandCMC) {
            return aIsLandCMC ? 1 : -1;
          }

          // For non-lands, sort by CMC
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);
        }

        case 'type': {
          // Sort by card type, then by cost
          const typeOrderFull = { 'Creature': 0, 'Artifact': 1, 'Enchantment': 2, 'Planeswalker': 3, 'Sorcery': 4, 'Instant': 5, 'Land': 6 };
          if (typeOrderFull[aType] !== typeOrderFull[bType]) {
            return (typeOrderFull[aType] || 7) - (typeOrderFull[bType] || 7);
          }
          if (aCost !== bCost) return aCost - bCost;
          return a.name.localeCompare(b.name);
        }

        case 'name':
          // Sort alphabetically by name
          return a.name.localeCompare(b.name);

        default:
          return 0;
      }
    });
  },

  /**
   * Get the main card type from type string
   */
  getCardMainType(typeString) {
    if (!typeString) return 'Other';
    const type = typeString.toLowerCase();
    if (type.includes('creature')) return 'Creature';
    if (type.includes('land')) return 'Land';
    if (type.includes('instant')) return 'Instant';
    if (type.includes('sorcery')) return 'Sorcery';
    if (type.includes('artifact')) return 'Artifact';
    if (type.includes('enchantment')) return 'Enchantment';
    if (type.includes('planeswalker')) return 'Planeswalker';
    return 'Other';
  }
};
