/**
 * Planeswalker Module
 * Handles planeswalker-specific mechanics: loyalty counters, abilities, damage
 */

export const Planeswalker = {
  /**
   * Initialize planeswalker with starting loyalty when it enters the battlefield
   */
  async initializePlaneswalker(card) {
    if (!this.cardMechanics.isPlaneswalker(card)) return;

    // Check if card already has loyalty set
    if (card.counters && card.counters.loyalty) {
      return; // Already initialized
    }

    // Try to get loyalty from card's power/toughness field (some XMLs might have it)
    if (card.loyalty) {
      if (!card.counters) card.counters = {};
      card.counters.loyalty = parseInt(card.loyalty);
      this.gameState.addToGameLog(`${card.name} enters with ${card.counters.loyalty} loyalty`, 'info');
      return;
    }

    // Fetch starting loyalty from Scryfall
    try {
      const loyalty = await this.fetchPlaneswalkerLoyalty(card.name);
      if (loyalty) {
        if (!card.counters) card.counters = {};
        card.counters.loyalty = loyalty;
        this.gameState.addToGameLog(`${card.name} enters with ${loyalty} loyalty`, 'info');
      }
    } catch (error) {
      console.error('Failed to fetch planeswalker loyalty:', error);
      // Default to 3 loyalty if fetch fails
      if (!card.counters) card.counters = {};
      card.counters.loyalty = 3;
      this.gameState.addToGameLog(`${card.name} enters with 3 loyalty (default)`, 'warning');
    }
  },

  /**
   * Fetch planeswalker starting loyalty from Scryfall
   */
  async fetchPlaneswalkerLoyalty(cardName) {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.loyalty ? parseInt(data.loyalty) : null;
    } catch (error) {
      console.error('Error fetching planeswalker data:', error);
      return null;
    }
  },

  /**
   * Activate a planeswalker loyalty ability
   */
  activateLoyaltyAbility(card, cost) {
    if (!this.cardMechanics.isPlaneswalker(card)) return;

    const currentLoyalty = card.counters?.loyalty || 0;

    // Check if we can pay the cost
    if (cost < 0 && currentLoyalty < Math.abs(cost)) {
      this.uiManager.showToast(`Not enough loyalty (need ${Math.abs(cost)}, have ${currentLoyalty})`, 'error');
      return;
    }

    // Apply loyalty change
    if (!card.counters) card.counters = {};
    card.counters.loyalty = (card.counters.loyalty || 0) + cost;

    const action = cost > 0 ? 'gains' : 'loses';
    const amount = Math.abs(cost);
    this.gameState.addToGameLog(`${card.name} ${action} ${amount} loyalty (now ${card.counters.loyalty})`, 'planeswalker');

    // Check if planeswalker dies from 0 loyalty
    if (card.counters.loyalty <= 0) {
      this.uiManager.showToast(`${card.name} dies with 0 loyalty`, 'warning');
      this.moveCardToGraveyard(card);
    }

    this.uiManager.updateAll();
  },

  /**
   * Deal damage to a planeswalker
   */
  damagePlaneswalker(card, damage) {
    if (!this.cardMechanics.isPlaneswalker(card)) return;

    const currentLoyalty = card.counters?.loyalty || 0;
    if (!card.counters) card.counters = {};

    card.counters.loyalty = Math.max(0, currentLoyalty - damage);

    this.gameState.addToGameLog(`${card.name} takes ${damage} damage (${currentLoyalty} → ${card.counters.loyalty} loyalty)`, 'combat');

    // Check if planeswalker dies
    if (card.counters.loyalty <= 0) {
      this.uiManager.showToast(`${card.name} is destroyed`, 'warning');
      this.moveCardToGraveyard(card);
    }

    this.uiManager.updateAll();
  },

  /**
   * Move planeswalker card to graveyard (helper method)
   */
  moveCardToGraveyard(card) {
    const owner = this.gameState.turnState.activePlayer;
    const playerState = this.gameState.getPlayerState(owner);

    // Find and remove from battlefield
    const battlefield = playerState.battlefield;
    let removed = false;

    const othersIndex = battlefield.others.findIndex(c => c.id === card.id);
    if (othersIndex >= 0) {
      battlefield.others.splice(othersIndex, 1);
      removed = true;
    }

    if (removed) {
      playerState.graveyard.push(card);
      this.onGraveyardChange(); // Update Tarmogoyf stats
      this.uiManager.updateZoneDisplay('battlefield', owner);
      this.uiManager.updateZoneDisplay('graveyard', owner);
    }
  }
};
