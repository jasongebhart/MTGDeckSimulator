/**
 * Adventure Cards Module
 * Handles adventure card mechanics - dual-mode cards that can be cast as either adventure or creature
 */

export const Adventure = {
  /**
   * Check if a card has adventure
   */
  hasAdventure(cardName) {
    const name = cardName.toLowerCase();
    return name.includes('brazen borrower') ||
           name.includes('bonecrusher giant') ||
           name.includes('murderous rider') ||
           name.includes('lovestruck beast') ||
           name.includes('foulmire knight') ||
           name.includes('fae of wishes') ||
           name.includes('beanstalk giant') ||
           name.includes('edgewall innkeeper') ||
           name.includes('embereth shieldbreaker') ||
           name.includes('flaxen intruder') ||
           name.includes('giant killer') ||
           name.includes('lonesome unicorn') ||
           name.includes('merfolk secretkeeper') ||
           name.includes('merchant of the vale') ||
           name.includes('mystical dispute') ||
           name.includes('oakhame ranger') ||
           name.includes('order of midnight') ||
           name.includes('realm-cloaked giant') ||
           name.includes('reaper of night') ||
           name.includes('rimrock knight') ||
           name.includes('shepherdess knight') ||
           name.includes('smitten swordmaster') ||
           name.includes('tuinvale treefolk') ||
           name.includes('curious pair');
  },

  /**
   * Get adventure details for a card
   */
  getAdventureDetails(cardName) {
    const name = cardName.toLowerCase();

    const adventures = {
      'brazen borrower': { name: 'Petty Theft', effect: 'Return target nonland permanent an opponent controls to its owner\'s hand' },
      'bonecrusher giant': { name: 'Stomp', effect: 'Deal 2 damage to any target. Damage can\'t be prevented this turn' },
      'murderous rider': { name: 'Swift End', effect: 'Destroy target creature or planeswalker. You lose 2 life' },
      'lovestruck beast': { name: 'Heart\'s Desire', effect: 'Create a 1/1 white Human creature token' },
      'foulmire knight': { name: 'Profane Insight', effect: 'You draw a card and you lose 1 life' },
      'fae of wishes': { name: 'Granted', effect: 'You may choose a noncreature card from outside the game, reveal it, and put it into your hand' },
      'beanstalk giant': { name: 'Fertile Footsteps', effect: 'Search your library for a basic land card, put it onto the battlefield, then shuffle' },
      'edgewall innkeeper': { name: 'Serve', effect: 'Create a 1/1 white Human creature token' },
      'embereth shieldbreaker': { name: 'Battle Display', effect: 'Destroy target artifact' },
      'flaxen intruder': { name: 'Welcome Home', effect: 'Create three 2/2 green Bear creature tokens' },
      'giant killer': { name: 'Chop Down', effect: 'Destroy target creature with power 4 or greater' },
      'lonesome unicorn': { name: 'Rider in Need', effect: 'Create a 2/2 white Knight creature token with vigilance' },
      'merfolk secretkeeper': { name: 'Venture Deeper', effect: 'Target player mills four cards' },
      'merchant of the vale': { name: 'Haggle', effect: 'You may discard a card. If you do, draw a card' },
      'oakhame ranger': { name: 'Bring Back', effect: 'Return target permanent card from your graveyard to your hand' },
      'order of midnight': { name: 'Alter Fate', effect: 'Return target creature card from your graveyard to your hand' },
      'realm-cloaked giant': { name: 'Cast Off', effect: 'Destroy all non-Giant creatures' },
      'reaper of night': { name: 'Harvest Fear', effect: 'Each opponent discards a card' },
      'rimrock knight': { name: 'Boulder Rush', effect: 'Target creature gets +2/+0 until end of turn' },
      'smitten swordmaster': { name: 'Curry Favor', effect: 'You gain X life and each opponent loses X life, where X is the number of Knights you control' },
      'tuinvale treefolk': { name: 'Oaken Boon', effect: 'Put two +1/+1 counters on target creature' },
      'curious pair': { name: 'Treats to Share', effect: 'Create a Food token' }
    };

    for (const [key, value] of Object.entries(adventures)) {
      if (name.includes(key)) {
        return value;
      }
    }

    return { name: 'Adventure', effect: 'Cast the adventure portion of this card' };
  },

  /**
   * Show adventure UI for choosing between adventure and creature
   */
  showAdventureUI(cardId, cardName) {
    // Remove any existing modal
    document.getElementById('adventureUI')?.remove();

    const adventureDetails = this.getAdventureDetails(cardName);

    const popup = document.createElement('div');
    popup.id = 'adventureUI';
    popup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-primary);
      border: 2px solid #f59e0b;
      border-radius: var(--border-radius);
      padding: var(--space-4);
      z-index: 3000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      min-width: 400px;
      max-width: 600px;
    `;

    popup.innerHTML = `
      <div style="margin-bottom: var(--space-3);">
        <h3 style="margin: 0 0 var(--space-2) 0; color: var(--text-primary);">
          🗺️ ${cardName} - Adventure
        </h3>
        <p style="margin: 0; color: var(--text-secondary); font-size: 14px;">
          Adventure cards can be cast as the creature or as the adventure spell (which exiles the card, allowing you to cast the creature later).
        </p>
      </div>

      <div style="margin-bottom: var(--space-3); padding: var(--space-3); background: rgba(245, 158, 11, 0.1); border-radius: 6px; border-left: 3px solid #f59e0b;">
        <div style="font-weight: bold; color: #f59e0b; margin-bottom: var(--space-2);">
          ${adventureDetails.name}
        </div>
        <div style="font-size: 13px; color: var(--text-secondary);">
          ${adventureDetails.effect}
        </div>
      </div>

      <div style="display: flex; gap: var(--space-2); justify-content: flex-end;">
        <button onclick="window.handSimulator.castAdventure('${this.escapeJs(cardId)}', '${this.escapeJs(cardName)}', '${this.escapeJs(adventureDetails.name)}')"
                class="btn btn-primary"
                style="background: #f59e0b; border-color: #f59e0b;">
          🗺️ Cast ${adventureDetails.name}
        </button>
        <button onclick="window.handSimulator.castCreatureFromHand('${this.escapeJs(cardId)}', '${this.escapeJs(cardName)}')"
                class="btn btn-secondary">
          Cast Creature
        </button>
        <button onclick="window.handSimulator.closeAdventureUI()" class="btn btn-secondary">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    // Add escape key handler
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeAdventureUI();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  },

  /**
   * Cast the adventure portion
   */
  castAdventure(cardId, cardName, adventureName) {
    const owner = this.gameState.turnState.activePlayer;
    const playerState = this.gameState.getPlayerState(owner);
    const cardIndex = playerState.hand.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
      this.uiManager.showToast('Card not found', 'error');
      return;
    }

    const card = playerState.hand[cardIndex];

    // Remove from hand and exile
    playerState.hand.splice(cardIndex, 1);
    playerState.exile.push(card);

    // Mark as cast from adventure
    card.adventureCast = true;

    this.uiManager.showToast(`Cast ${adventureName} (${cardName} exiled)`, 'success');
    this.gameState.addToGameLog(`Cast ${adventureName} (${cardName} exiled as adventure)`, 'adventure');

    this.uiManager.updateZoneDisplay('hand', owner);
    this.uiManager.updateZoneDisplay('exile', owner);
    this.closeAdventureUI();
  },

  /**
   * Cast the creature portion from hand
   */
  castCreatureFromHand(cardId, cardName) {
    const owner = this.gameState.turnState.activePlayer;
    const playerState = this.gameState.getPlayerState(owner);
    const cardIndex = playerState.hand.findIndex(c => c.id === cardId);

    if (cardIndex !== -1) {
      const card = playerState.hand.splice(cardIndex, 1)[0];

      // Play as creature
      const cardType = this.getCardMainType(card.type);
      if (cardType === 'Creature') {
        playerState.battlefield.creatures.push(card);
      } else {
        playerState.battlefield.others.push(card);
      }

      this.uiManager.showToast(`Cast ${cardName} as creature`, 'success');
      this.gameState.addToGameLog(`Cast ${cardName} as creature`, 'adventure');

      this.uiManager.updateZoneDisplay('hand', owner);
      this.uiManager.updateZoneDisplay('battlefield', owner);
    }

    this.closeAdventureUI();
  },

  /**
   * Cast creature from exile (after casting adventure)
   */
  castCreatureFromExile(cardId) {
    const owner = this.gameState.turnState.activePlayer;
    const playerState = this.gameState.getPlayerState(owner);
    const cardIndex = playerState.exile.findIndex(c => c.id === cardId && c.adventureCast);

    if (cardIndex === -1) {
      this.uiManager.showToast('Adventure card not found in exile', 'error');
      return;
    }

    const card = playerState.exile.splice(cardIndex, 1)[0];
    delete card.adventureCast;

    // Play as creature
    const cardType = this.getCardMainType(card.type);
    if (cardType === 'Creature') {
      playerState.battlefield.creatures.push(card);
    } else {
      playerState.battlefield.others.push(card);
    }

    this.uiManager.showToast(`Cast ${card.name} from adventure`, 'success');
    this.gameState.addToGameLog(`Cast ${card.name} from adventure exile`, 'adventure');

    this.uiManager.updateZoneDisplay('exile', owner);
    this.uiManager.updateZoneDisplay('battlefield', owner);
  },

  /**
   * Close adventure UI
   */
  closeAdventureUI() {
    document.getElementById('adventureUI')?.remove();
  }
};
