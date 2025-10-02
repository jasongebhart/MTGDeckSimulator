/**
 * Triggered Abilities Module
 * Handles special card triggers like Delver of Secrets, Dragon's Rage Channeler, etc.
 */

export const TriggeredAbilities = {
  checkDelverTriggers() {
    const activePlayer = this.gameState.turnState.activePlayer === 'player'
      ? this.gameState.player
      : this.gameState.opponent;
    const battlefield = activePlayer.battlefield;

    // Find all Delver of Secrets on battlefield (not transformed)
    const delvers = battlefield.creatures.filter(card => {
      const cardName = (card.name || '').toLowerCase();
      const currentFace = (card.currentFace || card.name).toLowerCase();
      return cardName === 'delver of secrets' && currentFace === 'delver of secrets';
    });

    if (delvers.length === 0) {
      console.log('No Delver of Secrets found on battlefield');
      return;
    }

    console.log(`Found ${delvers.length} Delver(s) of Secrets`);

    // Process each Delver trigger
    delvers.forEach((delver, index) => {
      this.triggerDelverReveal(delver, index);
    });
  },

  triggerDelverReveal(delver, index = 0) {
    const activePlayer = this.gameState.turnState.activePlayer === 'player'
      ? this.gameState.player
      : this.gameState.opponent;
    const library = activePlayer.library;

    if (library.length === 0) {
      this.uiManager.showToast('Library is empty - cannot reveal for Delver', 'warning');
      this.gameState.addToGameLog('Delver of Secrets trigger - no cards in library', 'info');
      return;
    }

    // Get top card
    const topCard = library[library.length - 1];
    const cardType = this.uiManager.getCardMainType(topCard.type || '').toLowerCase();
    const isInstantOrSorcery = cardType === 'instant' || cardType === 'sorcery';

    console.log('Delver trigger:', topCard.name, 'Type:', cardType, 'Transform?', isInstantOrSorcery);

    // Show modal with reveal
    this.showDelverRevealModal(delver, topCard, isInstantOrSorcery);
  },

  showDelverRevealModal(delver, revealedCard, shouldTransform) {
    const modal = document.createElement('div');
    modal.id = 'delverRevealModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;

    const cardType = this.uiManager.getCardMainType(revealedCard.type || '');

    modal.innerHTML = `
      <div style="
        background: #ffffff;
        color: #000000;
        border: 3px solid ${shouldTransform ? '#10b981' : '#ef4444'};
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <h2 style="margin: 0 0 1rem 0; color: #000000; font-size: 1.5rem;">
          🔮 Delver of Secrets Trigger
        </h2>

        <div style="
          background: #f3f4f6;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 1rem 0;
        ">
          <div style="font-size: 1rem; color: #6b7280; margin-bottom: 0.5rem;">
            Revealed card:
          </div>
          <div style="font-size: 1.25rem; font-weight: bold; color: #000000; margin-bottom: 0.5rem;">
            ${this.uiManager.escapeHtml(revealedCard.name)}
          </div>
          <div style="
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background: ${shouldTransform ? '#10b98120' : '#ef444420'};
            color: ${shouldTransform ? '#10b981' : '#ef4444'};
            border-radius: 6px;
            font-weight: bold;
            font-size: 0.9rem;
          ">
            ${cardType}
          </div>
        </div>

        <div style="
          font-size: 1.1rem;
          font-weight: bold;
          color: ${shouldTransform ? '#10b981' : '#ef4444'};
          margin: 1rem 0;
        ">
          ${shouldTransform ?
            '✅ Transform into Insectile Aberration!' :
            '❌ Does not transform (not an instant or sorcery)'}
        </div>

        <button
          onclick="window.handSimulator.resolveDelverTrigger(${shouldTransform})"
          style="
            background: ${shouldTransform ? '#10b981' : '#3b82f6'};
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 1rem;
          "
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'">
          ${shouldTransform ? 'Transform Delver' : 'Continue'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Store the delver and decision for resolution
    this.pendingDelverTrigger = {
      delver: delver,
      shouldTransform: shouldTransform
    };
  },

  resolveDelverTrigger(shouldTransform) {
    // Close modal
    document.getElementById('delverRevealModal')?.remove();

    if (!this.pendingDelverTrigger) {
      console.error('No pending Delver trigger');
      return;
    }

    const delver = this.pendingDelverTrigger.delver;

    if (shouldTransform) {
      // Transform the Delver
      const cardId = delver.id || `${delver.name}_0`;
      this.transformCard(cardId);
      this.uiManager.showToast('Delver of Secrets transformed!', 'success');
      this.gameState.addToGameLog('Delver of Secrets transformed into Insectile Aberration', 'success');
    } else {
      this.uiManager.showToast('Delver of Secrets does not transform', 'info');
      this.gameState.addToGameLog('Delver of Secrets revealed a non-instant/sorcery', 'info');
    }

    // Clear pending trigger
    this.pendingDelverTrigger = null;
  }
};
