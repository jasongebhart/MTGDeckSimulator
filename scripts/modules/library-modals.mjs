/**
 * Library Manipulation Modals Module
 * Contains Scry, Ponder, Surveil, and Put-Back interfaces
 */

export const LibraryModals = {

  // ===== SCRY INTERFACE =====

  showScryInterface(amount, source = 'Scry', options = {}) {
    // Support playerName in options for opponent
    const playerName = options.player || 'player';
    const library = this.gameState[playerName].library;

    if (library.length === 0) {
      this.uiManager.showToast('Library is empty', 'warning');
      return;
    }

    const cardsToScry = library.slice(-Math.min(amount, library.length));
    this.createScryModal(cardsToScry, amount, source, { ...options, playerName });
  },

  createScryModal(cards, amount, source, options = {}) {
    let modal = document.getElementById('scryModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'scryModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Store playerName for confirmScry
    const playerName = options.playerName || 'player';
    this.scryPlayerName = playerName;

    const modalContent = `
      <div style="background: #ffffff; color: #000000; border-radius: 8px; padding: 24px; max-width: 800px; width: 90%;">
        <h3 style="color: #000000; margin-top: 0;">${source} ${amount}</h3>
        <p style="color: #333333; margin-bottom: 16px;">
          ${options.description || `Look at the top ${amount} card${amount > 1 ? 's' : ''} of ${playerName === 'opponent' ? "opponent's" : 'your'} library. Put any number on the bottom and the rest on top in any order.`}
        </p>

        <div id="scryCards" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          ${cards.map((card, index) => `
            <div class="scry-card" data-card-index="${index}" style="
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 8px;
              background: #f3f4f6;
              cursor: pointer;
              min-width: 120px;
              text-align: center;
            ">
              <div style="font-weight: 500; color: #000000;">${card.name}</div>
              <div id="scry-position-${index}" style="margin-top: 4px; font-size: 12px; color: #6b7280;">Top</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="window.handSimulator.confirmScry(${amount}, ${options.drawAfter || 0})"
                  style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Confirm
          </button>
          <button onclick="document.getElementById('scryModal').remove()"
                  style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Cancel
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Add click handlers to toggle top/bottom
    this.scryPositions = cards.map(() => 'top');
    cards.forEach((card, index) => {
      const cardEl = modal.querySelector(`.scry-card[data-card-index="${index}"]`);
      cardEl.onclick = () => this.toggleScryPosition(index);
    });
  },

  toggleScryPosition(index) {
    this.scryPositions[index] = this.scryPositions[index] === 'top' ? 'bottom' : 'top';
    const posEl = document.getElementById(`scry-position-${index}`);
    const cardEl = document.querySelector(`.scry-card[data-card-index="${index}"]`);

    if (this.scryPositions[index] === 'bottom') {
      posEl.textContent = 'Bottom';
      posEl.style.color = '#dc2626';
      cardEl.style.background = '#fee2e2';
      cardEl.style.borderColor = '#dc2626';
    } else {
      posEl.textContent = 'Top';
      posEl.style.color = '#6b7280';
      cardEl.style.background = '#f3f4f6';
      cardEl.style.borderColor = '#e5e7eb';
    }
  },

  confirmScry(amount, drawAfter = 0) {
    const playerName = this.scryPlayerName || 'player';
    const library = this.gameState[playerName].library;
    const cards = library.splice(-amount);

    const topCards = [];
    const bottomCards = [];

    cards.forEach((card, index) => {
      if (this.scryPositions[index] === 'bottom') {
        bottomCards.push(card);
      } else {
        topCards.push(card);
      }
    });

    // Put bottom cards at bottom of library
    bottomCards.reverse().forEach(card => {
      library.unshift(card);
    });

    // Put top cards back on top
    topCards.reverse().forEach(card => {
      library.push(card);
    });

    document.getElementById('scryModal').remove();

    if (drawAfter > 0) {
      if (playerName === 'opponent') {
        this.drawOpponentCard();
      } else {
        this.drawCards(drawAfter);
      }
      this.uiManager.showToast(`Scry ${amount} complete. Drew ${drawAfter} card(s).`, 'success');
    } else {
      this.uiManager.showToast(`Scry ${amount} complete.`, 'success');
    }

    this.uiManager.updateAll();
  },

  // ===== PONDER INTERFACE =====

  showPonderInterface(amount, source, options = {}) {
    const playerName = options.playerName || 'player';
    const library = this.gameState[playerName].library;

    if (library.length === 0) {
      this.uiManager.showToast('Library is empty', 'warning');
      return;
    }

    const cardsToPonder = library.slice(-Math.min(amount, library.length));
    this.createPonderModal(cardsToPonder, amount, source, { ...options, playerName });
  },

  createPonderModal(cards, amount, source, options = {}) {
    let modal = document.getElementById('ponderModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'ponderModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = `
      <div style="background: #ffffff; color: #000000; border-radius: 8px; padding: 24px; max-width: 900px; width: 95%;">
        <h3 style="color: #000000; margin-top: 0;">${source}</h3>
        <p style="color: #333333; margin-bottom: 16px;">
          ${options.description}
        </p>

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px; color: #000000;">Top ${amount} cards (drag to reorder):</h4>
          <div id="ponderCards" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            ${cards.map((card, index) => `
              <div class="ponder-card" data-card-index="${index}" draggable="true" style="
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px;
                background: #f3f4f6;
                cursor: move;
                min-width: 140px;
                text-align: center;
              ">
                <div style="font-weight: 500; color: #000000;">${card.name}</div>
                <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">Position: ${index + 1}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: space-between; align-items: center;">
          <div>
            ${options.canShuffle ? `
              <button onclick="window.handSimulator.confirmPonderShuffle(${options.drawAfter || 0})"
                      style="background: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                Shuffle Library
              </button>
            ` : ''}
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.handSimulator.confirmPonder(${amount}, ${options.drawAfter || 0})"
                    style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
              Keep Order & Draw
            </button>
            <button onclick="document.getElementById('ponderModal').remove()"
                    style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Store original order
    this.ponderOrder = cards.map((c, i) => i);

    // Add drag and drop handlers
    const cardElements = modal.querySelectorAll('.ponder-card');
    cardElements.forEach((el, index) => {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        el.style.opacity = '0.5';
      });

      el.addEventListener('dragend', (e) => {
        el.style.opacity = '1';
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;

        if (fromIndex !== toIndex) {
          // Swap in order array
          const temp = this.ponderOrder[fromIndex];
          this.ponderOrder[fromIndex] = this.ponderOrder[toIndex];
          this.ponderOrder[toIndex] = temp;

          // Update visual display
          this.updatePonderDisplay(cards);
        }
      });
    });
  },

  updatePonderDisplay(cards) {
    const container = document.getElementById('ponderCards');
    const orderedCards = this.ponderOrder.map(i => cards[i]);

    container.innerHTML = orderedCards.map((card, displayIndex) => `
      <div class="ponder-card" data-card-index="${displayIndex}" draggable="true" style="
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 8px;
        background: #f3f4f6;
        cursor: move;
        min-width: 140px;
        text-align: center;
      ">
        <div style="font-weight: 500; color: #000000;">${card.name}</div>
        <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">Position: ${displayIndex + 1}</div>
      </div>
    `).join('');

    // Re-attach handlers
    const cardElements = container.querySelectorAll('.ponder-card');
    cardElements.forEach((el, index) => {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        el.style.opacity = '0.5';
      });

      el.addEventListener('dragend', (e) => {
        el.style.opacity = '1';
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });

      el.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = index;

        if (fromIndex !== toIndex) {
          const temp = this.ponderOrder[fromIndex];
          this.ponderOrder[fromIndex] = this.ponderOrder[toIndex];
          this.ponderOrder[toIndex] = temp;
          this.updatePonderDisplay(cards);
        }
      });
    });
  },

  confirmPonder(amount, drawAfter = 0) {
    const library = this.gameState.player.library;
    const cards = library.splice(-amount);
    const orderedCards = this.ponderOrder.map(i => cards[i]);

    // Put cards back in chosen order (reverse because we push to top)
    orderedCards.reverse().forEach(card => {
      library.push(card);
    });

    document.getElementById('ponderModal').remove();

    if (drawAfter > 0) {
      this.drawCards(drawAfter);
      this.uiManager.showToast(`Ponder complete. Drew ${drawAfter} card(s).`, 'success');
    } else {
      this.uiManager.showToast('Ponder complete.', 'success');
    }

    this.uiManager.updateAll();
  },

  confirmPonderShuffle(drawAfter = 0) {
    document.getElementById('ponderModal').remove();
    this.shuffleLibrary();

    if (drawAfter > 0) {
      this.drawCards(drawAfter);
      this.uiManager.showToast(`Shuffled library and drew ${drawAfter} card(s).`, 'success');
    } else {
      this.uiManager.showToast('Shuffled library.', 'success');
    }

    this.uiManager.updateAll();
  },

  // ===== SURVEIL INTERFACE =====

  showSurveilInterface(amount, source = 'Surveil') {
    const library = this.gameState.player.library;

    if (library.length === 0) {
      this.uiManager.showToast('Library is empty', 'warning');
      return;
    }

    const cardsToSurveil = library.slice(-Math.min(amount, library.length));
    this.createSurveilModal(cardsToSurveil, amount, source);
  },

  createSurveilModal(cards, amount, source) {
    let modal = document.getElementById('surveilModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'surveilModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = `
      <div style="background: #ffffff; color: #000000; border-radius: 8px; padding: 24px; max-width: 800px; width: 90%;">
        <h3 style="color: #000000; margin-top: 0;">Surveil ${amount}</h3>
        <p style="color: #333333; margin-bottom: 16px;">
          Look at the top ${amount} card${amount > 1 ? 's' : ''} of your library. Put any number into your graveyard and the rest on top in any order.
        </p>

        <div id="surveilCards" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          ${cards.map((card, index) => `
            <div class="surveil-card" data-card-index="${index}" style="
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              padding: 8px;
              background: #f3f4f6;
              cursor: pointer;
              min-width: 120px;
              text-align: center;
            ">
              <div style="font-weight: 500; color: #000000;">${card.name}</div>
              <div id="surveil-dest-${index}" style="margin-top: 4px; font-size: 12px; color: #6b7280;">Keep on top</div>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="window.handSimulator.confirmSurveil(${amount})"
                  style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Confirm
          </button>
          <button onclick="document.getElementById('surveilModal').remove()"
                  style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Cancel
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Add click handlers to toggle graveyard/top
    this.surveilDestinations = cards.map(() => 'top');
    cards.forEach((card, index) => {
      const cardEl = modal.querySelector(`.surveil-card[data-card-index="${index}"]`);
      cardEl.onclick = () => this.toggleSurveilDestination(index);
    });
  },

  toggleSurveilDestination(index) {
    this.surveilDestinations[index] = this.surveilDestinations[index] === 'top' ? 'graveyard' : 'top';
    const destEl = document.getElementById(`surveil-dest-${index}`);
    const cardEl = document.querySelector(`.surveil-card[data-card-index="${index}"]`);

    if (this.surveilDestinations[index] === 'graveyard') {
      destEl.textContent = 'To Graveyard';
      destEl.style.color = '#dc2626';
      cardEl.style.background = '#fee2e2';
      cardEl.style.borderColor = '#dc2626';
    } else {
      destEl.textContent = 'Keep on top';
      destEl.style.color = '#6b7280';
      cardEl.style.background = '#f3f4f6';
      cardEl.style.borderColor = '#e5e7eb';
    }
  },

  confirmSurveil(amount) {
    const library = this.gameState.player.library;
    const cards = library.splice(-amount);

    const topCards = [];
    const graveyardCards = [];

    cards.forEach((card, index) => {
      if (this.surveilDestinations[index] === 'graveyard') {
        graveyardCards.push(card);
      } else {
        topCards.push(card);
      }
    });

    // Put graveyard cards in graveyard
    graveyardCards.forEach(card => {
      this.gameState.player.graveyard.push(card);
    });

    // Put top cards back on top
    topCards.reverse().forEach(card => {
      library.push(card);
    });

    document.getElementById('surveilModal').remove();
    this.uiManager.showToast(`Surveil ${amount} complete. ${graveyardCards.length} card(s) to graveyard.`, 'success');
    this.uiManager.updateAll();
  },

  // ===== PUT BACK INTERFACE (for Brainstorm) =====

  showPutBackInterface(amount, source, options = {}) {
    const hand = this.gameState.player.hand;

    if (hand.length < amount) {
      this.uiManager.showToast(`Not enough cards in hand (need ${amount}, have ${hand.length})`, 'warning');
      return;
    }

    this.createPutBackModal(hand, amount, source, options);
  },

  createPutBackModal(hand, amount, source, options = {}) {
    let modal = document.getElementById('putBackModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'putBackModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = `
      <div style="background: #ffffff; color: #000000; border-radius: 8px; padding: 24px; max-width: 900px; width: 95%;">
        <h3 style="color: #000000; margin-top: 0;">${source}</h3>
        <p style="color: #333333; margin-bottom: 16px;">
          ${options.description || `Choose ${amount} card${amount > 1 ? 's' : ''} to put back on top of your library.`}
        </p>

        <div style="margin-bottom: 16px;">
          <h4 style="margin-bottom: 8px; color: #000000;">Your hand (click to select ${amount}):</h4>
          <div id="putBackCards" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            ${hand.map((card, index) => `
              <div class="putback-card" data-card-index="${index}" style="
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px;
                background: #f3f4f6;
                cursor: pointer;
                min-width: 120px;
                text-align: center;
              ">
                <div style="font-weight: 500; color: #000000;">${card.name}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button id="confirmPutBack" disabled
                  style="background: #9ca3af; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: not-allowed; font-weight: 500;">
            Confirm (0/${amount})
          </button>
          <button onclick="document.getElementById('putBackModal').remove()"
                  style="background: #6b7280; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Cancel
          </button>
        </div>
      </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);

    // Add click handlers
    this.putBackSelected = [];
    hand.forEach((card, index) => {
      const cardEl = modal.querySelector(`.putback-card[data-card-index="${index}"]`);
      cardEl.onclick = () => this.togglePutBackCard(index, amount);
    });
  },

  togglePutBackCard(index, amount) {
    const selectedIndex = this.putBackSelected.indexOf(index);
    const cardEl = document.querySelector(`.putback-card[data-card-index="${index}"]`);

    if (selectedIndex > -1) {
      // Deselect
      this.putBackSelected.splice(selectedIndex, 1);
      cardEl.style.background = '#f3f4f6';
      cardEl.style.borderColor = '#e5e7eb';
    } else if (this.putBackSelected.length < amount) {
      // Select
      this.putBackSelected.push(index);
      cardEl.style.background = '#dbeafe';
      cardEl.style.borderColor = '#3b82f6';
    }

    // Update button
    const btn = document.getElementById('confirmPutBack');
    if (this.putBackSelected.length === amount) {
      btn.disabled = false;
      btn.style.background = '#3b82f6';
      btn.style.cursor = 'pointer';
      btn.textContent = `Confirm (${amount}/${amount})`;
      btn.onclick = () => this.confirmPutBack(amount);
    } else {
      btn.disabled = true;
      btn.style.background = '#9ca3af';
      btn.style.cursor = 'not-allowed';
      btn.textContent = `Confirm (${this.putBackSelected.length}/${amount})`;
      btn.onclick = null;
    }
  },

  confirmPutBack(amount) {
    const hand = this.gameState.player.hand;
    const library = this.gameState.player.library;

    // Sort selected indices in reverse to maintain correct indexing when removing
    const sortedIndices = [...this.putBackSelected].sort((a, b) => b - a);
    const cardsToReturn = [];

    sortedIndices.forEach(index => {
      const card = hand.splice(index, 1)[0];
      cardsToReturn.unshift(card); // Add to beginning to maintain order
    });

    // Put cards back on top of library
    cardsToReturn.forEach(card => {
      library.push(card);
    });

    document.getElementById('putBackModal').remove();
    this.uiManager.showToast(`Put ${amount} card(s) back on top of library.`, 'success');
    this.uiManager.updateAll();
  },

  // ===== CASCADE INTERFACE =====

  triggerManualCascade(playerName = 'player') {
    // Create a dummy cascade card with CMC 4 (typical Bloodbraid Elf)
    const cascadeCard = {
      name: 'Manual Cascade',
      cost: '{2}{R}{G}', // CMC 4
      type: 'Cascade Trigger'
    };
    this.showCascadeInterface(cascadeCard, playerName);
  },

  showCascadeInterface(cascadeCard, playerName = 'player') {
    const library = this.gameState[playerName].library;

    if (library.length === 0) {
      this.uiManager.showToast('Library is empty, cascade fizzles', 'warning');
      return;
    }

    // Get mana value of cascade card
    const cascadeManaValue = this.cardMechanics.parseManaValue(cascadeCard.cost);

    // Exile cards from top of library until we find a nonland card with lesser mana value
    const exiledCards = [];
    let foundCard = null;

    for (let i = library.length - 1; i >= 0; i--) {
      const card = library[i];
      const cardManaValue = this.cardMechanics.parseManaValue(card.cost);
      const isLand = this.cardMechanics.isLand(card);

      exiledCards.push(card);

      // Check if this is a nonland card with lesser mana value
      if (!isLand && cardManaValue < cascadeManaValue) {
        foundCard = card;
        break;
      }
    }

    // Remove exiled cards from library
    library.splice(library.length - exiledCards.length, exiledCards.length);

    // Show cascade modal
    this.createCascadeModal(cascadeCard, exiledCards, foundCard, playerName);
  },

  createCascadeModal(cascadeCard, exiledCards, foundCard, playerName) {
    let modal = document.getElementById('cascadeModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'cascadeModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const cascadeManaValue = this.cardMechanics.parseManaValue(cascadeCard.cost);

    // Create modal content (XSS-safe)
    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'background: #ffffff; color: #000000; border-radius: 8px; padding: 24px; max-width: 900px; width: 90%;';

    const title = document.createElement('h3');
    title.style.cssText = 'color: #000000; margin-top: 0;';
    title.textContent = `⚡ Cascade from ${cascadeCard.name}`;
    contentDiv.appendChild(title);

    const description = document.createElement('p');
    description.style.cssText = 'color: #333333; margin-bottom: 16px;';
    if (foundCard) {
      const foundStrong = document.createElement('strong');
      foundStrong.textContent = foundCard.name;
      description.appendChild(document.createTextNode('Found '));
      description.appendChild(foundStrong);
      description.appendChild(document.createTextNode(` (CMC ${this.cardMechanics.parseManaValue(foundCard.cost)} < ${cascadeManaValue}). You may cast it without paying its mana cost.`));
    } else {
      description.textContent = `No nonland card with mana value less than ${cascadeManaValue} found. All exiled cards will be placed on the bottom of your library.`;
    }
    contentDiv.appendChild(description);

    const exiledSection = document.createElement('div');
    exiledSection.style.cssText = 'margin-bottom: 16px;';

    const exiledTitle = document.createElement('h4');
    exiledTitle.style.cssText = 'color: #666; font-size: 14px; margin-bottom: 8px;';
    exiledTitle.textContent = `Exiled Cards (${exiledCards.length}):`;
    exiledSection.appendChild(exiledTitle);

    const cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

    exiledCards.forEach(card => {
      const isFound = card === foundCard;
      const manaValue = this.cardMechanics.parseManaValue(card.cost);

      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = `
        border: 2px solid ${isFound ? '#10b981' : '#e5e7eb'};
        border-radius: 8px;
        padding: 8px;
        background: ${isFound ? '#d1fae5' : '#f3f4f6'};
        min-width: 120px;
        text-align: center;
      `;

      const cardName = document.createElement('div');
      cardName.style.cssText = 'font-weight: 500; color: #000000;';
      cardName.textContent = card.name;
      cardDiv.appendChild(cardName);

      const cardType = document.createElement('div');
      cardType.style.cssText = 'margin-top: 4px; font-size: 12px; color: #6b7280;';
      cardType.textContent = card.type;
      cardDiv.appendChild(cardType);

      const cardCmc = document.createElement('div');
      cardCmc.style.cssText = 'margin-top: 2px; font-size: 11px; color: #6b7280;';
      cardCmc.textContent = `CMC: ${manaValue}`;
      cardDiv.appendChild(cardCmc);

      cardsContainer.appendChild(cardDiv);
    });

    exiledSection.appendChild(cardsContainer);
    contentDiv.appendChild(exiledSection);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';

    if (foundCard) {
      const castButton = document.createElement('button');
      castButton.style.cssText = 'background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;';
      castButton.textContent = `Cast ${foundCard.name}`;
      castButton.addEventListener('click', () => this.castCascadeCard(foundCard.name, playerName));
      buttonContainer.appendChild(castButton);

      const declineButton = document.createElement('button');
      declineButton.style.cssText = 'background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;';
      declineButton.textContent = "Don't Cast";
      declineButton.addEventListener('click', () => this.declineCascadeCard(playerName));
      buttonContainer.appendChild(declineButton);
    } else {
      const continueButton = document.createElement('button');
      continueButton.style.cssText = 'background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500;';
      continueButton.textContent = 'Continue';
      continueButton.addEventListener('click', () => this.finalizeCascade(playerName));
      buttonContainer.appendChild(continueButton);
    }

    contentDiv.appendChild(buttonContainer);
    modal.appendChild(contentDiv);
    document.body.appendChild(modal);

    // Store cascade state
    this.cascadeState = {
      exiledCards,
      foundCard,
      playerName
    };
  },

  escapeJs(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
  },

  castCascadeCard(cardName, playerName) {
    if (!this.cascadeState) return;

    const { exiledCards, foundCard } = this.cascadeState;

    if (!foundCard || foundCard.name !== cardName) {
      console.error('Cascade card mismatch');
      return;
    }

    // Play the cascade card
    this.playCard(foundCard);

    // Remove the found card from exiled cards
    const remainingExiled = exiledCards.filter(c => c !== foundCard);

    // Put remaining exiled cards on bottom of library in random order
    this.putCardsOnBottomOfLibrary(remainingExiled, playerName);

    // Close modal and update UI
    document.getElementById('cascadeModal')?.remove();
    this.uiManager.showToast(`Cast ${foundCard.name} via Cascade!`, 'success');
    this.uiManager.updateAll();
    this.cascadeState = null;
  },

  declineCascadeCard(playerName) {
    if (!this.cascadeState) return;

    const { exiledCards } = this.cascadeState;

    // Put all exiled cards on bottom of library in random order
    this.putCardsOnBottomOfLibrary(exiledCards, playerName);

    // Close modal and update UI
    document.getElementById('cascadeModal')?.remove();
    this.uiManager.showToast('Cascade declined, exiled cards placed on bottom of library', 'info');
    this.uiManager.updateAll();
    this.cascadeState = null;
  },

  finalizeCascade(playerName) {
    if (!this.cascadeState) return;

    const { exiledCards } = this.cascadeState;

    // Put all exiled cards on bottom of library in random order
    this.putCardsOnBottomOfLibrary(exiledCards, playerName);

    // Close modal and update UI
    document.getElementById('cascadeModal')?.remove();
    this.uiManager.showToast('Cascade complete, exiled cards placed on bottom of library', 'info');
    this.uiManager.updateAll();
    this.cascadeState = null;
  },

  putCardsOnBottomOfLibrary(cards, playerName) {
    const library = this.gameState[playerName].library;

    // Shuffle the cards (random order on bottom)
    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    // Add to bottom of library (beginning of array)
    library.unshift(...shuffled);
  }
};
