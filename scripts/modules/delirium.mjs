/**
 * Delirium and Delve Module
 * Handles checking and displaying delirium status (4+ card types in graveyard)
 * and delve mechanics (exile cards from graveyard to reduce spell costs)
 */

export class Delirium {
  constructor(gameState) {
    this.gameState = gameState;
    this.delveSelection = {
      active: false,
      card: null,
      selected: [],
      callback: null
    };
  }

  /**
   * Get the main card type from a card's type line
   * @param {string} type - The card's type line
   * @returns {string} The main card type
   */
  getCardMainType(type) {
    const typeStr = (type || '').toLowerCase();
    if (typeStr.includes('land')) return 'Land';
    if (typeStr.includes('creature')) return 'Creature';
    if (typeStr.includes('artifact')) return 'Artifact';
    if (typeStr.includes('enchantment')) return 'Enchantment';
    if (typeStr.includes('sorcery')) return 'Sorcery';
    if (typeStr.includes('instant')) return 'Instant';
    if (typeStr.includes('planeswalker')) return 'Planeswalker';
    if (typeStr.includes('battle')) return 'Battle';
    return 'Other';
  }

  /**
   * Get unique card types in graveyard
   * @param {Array} graveyard - The graveyard to check
   * @returns {Set} Set of unique card types
   */
  getGraveyardTypes(graveyard) {
    // Uses Set for O(n) time complexity with early exit
    const types = new Set();

    for (const card of graveyard) {
      const mainType = this.getCardMainType(card.type);
      if (mainType !== 'Other') {
        types.add(mainType);
        // Early exit optimization - can't have more than 8 types
        if (types.size >= 8) break;
      }
    }

    return types;
  }

  /**
   * Check if delirium is active (4+ card types in graveyard)
   * @param {Array} graveyard - The graveyard to check
   * @returns {boolean} True if delirium is active
   */
  checkDelirium(graveyard) {
    // Fast check: needs at least 4 cards for delirium
    if (graveyard.length < 4) return false;

    const types = this.getGraveyardTypes(graveyard);
    return types.size >= 4;
  }

  /**
   * Get count of unique card types in graveyard
   * @param {Array} graveyard - The graveyard to check
   * @returns {number} Count of unique card types
   */
  getDeliriumCount(graveyard) {
    const types = this.getGraveyardTypes(graveyard);
    return types.size;
  }

  /**
   * Update the delirium indicator UI
   */
  updateDeliriumIndicator() {
    // Fast early exit if no graveyard
    const graveyard = this.gameState.player?.graveyard || [];
    if (graveyard.length === 0) {
      const indicator = document.getElementById('deliriumIndicator2');
      if (indicator) indicator.style.display = 'none';
      return;
    }

    const typeCount = this.getDeliriumCount(graveyard);
    const hasDelirium = typeCount >= 4;

    const indicator = document.getElementById('deliriumIndicator2');
    const typesSpan = document.getElementById('deliriumTypes2');

    if (!indicator || !typesSpan) return;

    // Show indicator and update count
    indicator.style.display = 'inline-block';
    typesSpan.textContent = typeCount;

    // Visual styling based on delirium status
    if (hasDelirium) {
      indicator.classList.add('btn-success');
      indicator.classList.remove('btn-warning', 'btn-outline-secondary');
      indicator.title = 'Delirium active! (4+ card types in graveyard)';
    } else {
      indicator.classList.add('btn-outline-secondary');
      indicator.classList.remove('btn-success', 'btn-warning');
      indicator.title = `${typeCount}/4 card types for Delirium`;
    }
  }

  // ===== DELVE MECHANICS =====

  /**
   * Check if a card has delve
   * @param {Object} card - The card to check
   * @returns {boolean} True if the card has delve
   */
  hasDelve(card) {
    if (!card || !card.text) return false;
    return card.text.toLowerCase().includes('delve');
  }

  /**
   * Calculate the delve cost reduction based on cards exiled
   * @param {Array} exiledCards - Cards to exile for delve
   * @returns {number} The amount of generic mana reduced
   */
  calculateDelveReduction(exiledCards) {
    return exiledCards.length;
  }

  /**
   * Start delve card selection
   * @param {Object} card - The card being cast with delve
   * @param {number} maxDelve - Maximum cards that can be delved (usually equals generic mana cost)
   * @param {Function} callback - Callback function when delve is complete
   */
  startDelveSelection(card, maxDelve, callback) {
    this.delveSelection.active = true;
    this.delveSelection.card = card;
    this.delveSelection.selected = [];
    this.delveSelection.maxDelve = maxDelve;
    this.delveSelection.callback = callback;

    this.showDelveUI();
  }

  /**
   * Show the delve selection UI
   */
  showDelveUI() {
    const graveyard = this.gameState.player.graveyard;

    if (graveyard.length === 0) {
      this.completeDelve();
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'delveModal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #1f2937;
      color: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    const title = document.createElement('h3');
    title.textContent = `Delve - Exile cards from graveyard (Max: ${this.delveSelection.maxDelve})`;
    title.style.marginBottom = '16px';

    const cardGrid = document.createElement('div');
    cardGrid.id = 'delveCardGrid';
    cardGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    `;

    graveyard.forEach((card, index) => {
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = `
        background: #374151;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;
      `;
      cardDiv.dataset.cardIndex = index;

      cardDiv.innerHTML = `
        <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">${this.escapeHtml(card.name)}</div>
        <div style="font-size: 10px; color: #9ca3af;">${this.escapeHtml(card.cost || '0')}</div>
      `;

      cardDiv.addEventListener('click', () => {
        this.toggleDelveCard(index, cardDiv);
      });

      cardGrid.appendChild(cardDiv);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = `Confirm (${this.delveSelection.selected.length} exiled)`;
    confirmBtn.className = 'btn btn-success';
    confirmBtn.id = 'delveConfirmBtn';
    confirmBtn.addEventListener('click', () => {
      this.completeDelve();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel (Exile 0)';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.addEventListener('click', () => {
      this.delveSelection.selected = [];
      this.completeDelve();
    });

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);

    content.appendChild(title);
    content.appendChild(cardGrid);
    content.appendChild(buttonContainer);
    modal.appendChild(content);
    document.body.appendChild(modal);
  }

  /**
   * Toggle a card in the delve selection
   * @param {number} index - Index of the card in graveyard
   * @param {HTMLElement} cardDiv - The card div element
   */
  toggleDelveCard(index, cardDiv) {
    const selectedIndex = this.delveSelection.selected.indexOf(index);

    if (selectedIndex > -1) {
      // Deselect
      this.delveSelection.selected.splice(selectedIndex, 1);
      cardDiv.style.border = '2px solid transparent';
      cardDiv.style.background = '#374151';
    } else {
      // Select if under max
      if (this.delveSelection.selected.length < this.delveSelection.maxDelve) {
        this.delveSelection.selected.push(index);
        cardDiv.style.border = '2px solid #10b981';
        cardDiv.style.background = '#065f46';
      }
    }

    // Update confirm button text
    const confirmBtn = document.getElementById('delveConfirmBtn');
    if (confirmBtn) {
      confirmBtn.textContent = `Confirm (${this.delveSelection.selected.length} exiled)`;
    }
  }

  /**
   * Complete the delve selection and exile chosen cards
   */
  completeDelve() {
    const modal = document.getElementById('delveModal');
    if (modal) modal.remove();

    const exiledCards = [];

    // Sort indices in reverse to remove from end first
    this.delveSelection.selected.sort((a, b) => b - a);

    this.delveSelection.selected.forEach(index => {
      const card = this.gameState.player.graveyard[index];
      if (card) {
        exiledCards.push(card);
        this.gameState.player.graveyard.splice(index, 1);
        this.gameState.player.exile.push(card);
      }
    });

    const reduction = this.calculateDelveReduction(exiledCards);

    // Call the callback with the reduction amount
    if (this.delveSelection.callback) {
      this.delveSelection.callback(reduction, exiledCards);
    }

    // Reset delve selection
    this.delveSelection.active = false;
    this.delveSelection.card = null;
    this.delveSelection.selected = [];
    this.delveSelection.callback = null;
  }

  /**
   * Escape HTML for safe rendering
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
