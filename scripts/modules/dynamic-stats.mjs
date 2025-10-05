/**
 * Dynamic Stats Module
 * Handles cards with stats that change based on game state (Tarmogoyf, etc.)
 */

export const DynamicStats = {
  /**
   * Calculate Tarmogoyf's power and toughness based on card types in all graveyards
   */
  calculateTarmogoyf() {
    const cardTypes = new Set();

    // Check both player and opponent graveyards
    const graveyards = [
      this.gameState.player.graveyard,
      this.gameState.opponent.graveyard
    ];

    graveyards.forEach(graveyard => {
      graveyard.forEach(card => {
        if (!card.type) return;

        // Extract card types from the type line
        const typeString = card.type.toLowerCase();

        // Check for each card type
        if (typeString.includes('artifact')) cardTypes.add('Artifact');
        if (typeString.includes('creature')) cardTypes.add('Creature');
        if (typeString.includes('enchantment')) cardTypes.add('Enchantment');
        if (typeString.includes('instant')) cardTypes.add('Instant');
        if (typeString.includes('land')) cardTypes.add('Land');
        if (typeString.includes('planeswalker')) cardTypes.add('Planeswalker');
        if (typeString.includes('sorcery')) cardTypes.add('Sorcery');
        if (typeString.includes('tribal')) cardTypes.add('Tribal');
      });
    });

    const count = cardTypes.size;
    return {
      power: count,
      toughness: count + 1,
      types: Array.from(cardTypes)
    };
  },

  /**
   * Get display text for a card's power/toughness
   * Returns dynamic stats for cards like Tarmogoyf
   */
  getCardStats(card) {
    if (!card) return null;

    const cardName = card.name?.toLowerCase() || '';

    // Tarmogoyf has dynamic P/T
    if (cardName.includes('tarmogoyf')) {
      const stats = this.calculateTarmogoyf();
      return {
        power: stats.power,
        toughness: stats.toughness,
        text: `${stats.power}/${stats.toughness}`,
        isDynamic: true,
        tooltip: `Card types in graveyards: ${stats.types.join(', ')}`
      };
    }

    // Default: return static P/T if it exists
    if (card.power !== undefined && card.toughness !== undefined) {
      return {
        power: card.power,
        toughness: card.toughness,
        text: `${card.power}/${card.toughness}`,
        isDynamic: false
      };
    }

    return null;
  },

  /**
   * Update all Tarmogoyf cards on the battlefield with current stats
   */
  updateTarmogoyfs() {
    const stats = this.calculateTarmogoyf();

    // Update all Tarmogoyf elements in the DOM
    const goyfs = document.querySelectorAll('[data-card-name*="Tarmogoyf"]');

    goyfs.forEach(element => {
      const ptElement = element.querySelector('.card-pt, .power-toughness');
      if (ptElement) {
        ptElement.textContent = `${stats.power}/${stats.toughness}`;
        ptElement.title = `Card types: ${stats.types.join(', ')}`;

        // Add visual indicator that this is dynamic
        ptElement.style.color = '#10b981'; // Green color
        ptElement.style.fontWeight = 'bold';
      }
    });

    return stats;
  },

  /**
   * Hook into graveyard changes to update Tarmogoyf stats
   */
  onGraveyardChange() {
    // Check if any Tarmogoyf is on the battlefield
    const hasTarmogoyf = [
      ...this.gameState.player.battlefield.creatures,
      ...this.gameState.opponent.battlefield.creatures
    ].some(card => card.name?.toLowerCase().includes('tarmogoyf'));

    if (hasTarmogoyf) {
      this.updateTarmogoyfs();
    }
  }
};
