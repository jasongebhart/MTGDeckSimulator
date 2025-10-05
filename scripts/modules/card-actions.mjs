/**
 * Card Actions Module
 * Handles card manipulation, tokens, life management, and card drawing
 */

export const CardActions = {
  /**
   * Draw a single card
   */
  drawCard() {
    if (this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty!', 'warning');
      this.gameState.addToGameLog('Attempted to draw from empty library', 'warning');
      return;
    }

    const card = this.gameState.player.library.pop();
    this.gameState.player.hand.push(card);
    this.gameState.player.gameStats.cardsDrawn++;

    this.autoSortHand();
    this.playSound('draw');
    this.uiManager.updateZoneDisplay('hand', 'player');
    this.uiManager.updateHandCountDisplay('player');
    this.uiManager.updateZoneCounts();
    this.gameState.addToGameLog(`Drew ${card.name}`, 'draw');
  },

  /**
   * Draw multiple cards
   */
  drawCards(count = 1) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.hand.push(card);
        this.gameState.player.gameStats.cardsDrawn++;
        drawn.push(card.name);
      }
    }
    if (drawn.length > 0) {
      this.autoSortHand();
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.updateHandCountDisplay('player');
      this.uiManager.showToast(`Drew ${drawn.length} card(s): ${drawn.join(', ')}`, 'success');
    } else {
      this.uiManager.showToast('Library is empty!', 'warning');
    }
  },

  /**
   * Mill cards from library to graveyard
   */
  millCards(count = 1) {
    const milled = [];
    for (let i = 0; i < count; i++) {
      if (this.gameState.player.library.length > 0) {
        const card = this.gameState.player.library.pop();
        this.gameState.player.graveyard.push(card);
        milled.push(card.name);
      }
    }
    if (milled.length > 0) {
      this.uiManager.updateZoneDisplay('graveyard', 'player');
      this.uiManager.updateZoneCounts();
      this.onGraveyardChange(); // Update Tarmogoyf stats
      this.uiManager.showToast(`Milled ${milled.length} card(s): ${milled.join(', ')}`, 'info');
    } else {
      this.uiManager.showToast('Library is empty!', 'warning');
    }
  },

  /**
   * Life management - change player life
   */
  changeLife(amount) {
    this.gameState.player.gameStats.life += amount;
    this.uiManager.updateLifeDisplay('player');
    this.gameState.addToGameLog(`Life changed by ${amount} (now ${this.gameState.player.gameStats.life})`, 'life');
  },

  /**
   * Set player life to specific amount
   */
  setLife(amount) {
    this.gameState.player.gameStats.life = amount;
    this.uiManager.updateLifeDisplay('player');
    this.gameState.addToGameLog(`Life set to ${amount}`, 'life');
  },

  /**
   * Change opponent life
   */
  changeOpponentLife(amount) {
    this.gameState.opponent.gameStats.life += amount;
    this.uiManager.updateLifeDisplay('opponent');
    this.gameState.addToGameLog(`Opponent life changed by ${amount} (now ${this.gameState.opponent.gameStats.life})`, 'life');
  },

  /**
   * Set opponent life
   */
  setOpponentLife(amount) {
    this.gameState.opponent.gameStats.life = amount;
    this.uiManager.updateLifeDisplay('opponent');
    this.gameState.addToGameLog(`Opponent life set to ${amount}`, 'life');
  },

  /**
   * Create a token
   */
  async createToken(name, type, owner = 'player', options = {}) {
    const token = {
      id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name,
      type: type,
      cost: '0',
      isToken: true,
      tapped: options.tapped || false,
      power: options.power,
      toughness: options.toughness
    };

    // Parse P/T from name if it's a creature token
    const ptMatch = name.match(/(\d+)\/(\d+)/);
    if (ptMatch) {
      token.power = ptMatch[1];
      token.toughness = ptMatch[2];
    }

    // Fetch token image from Scryfall
    try {
      const imageUrl = await this.fetchTokenImage(name);
      if (imageUrl) {
        token.imageUrl = imageUrl;
      }
    } catch (error) {
      console.warn(`Failed to fetch token image for ${name}:`, error);
    }

    // Add to battlefield
    const targetPlayer = this.gameState.getPlayerState(owner);

    if (type.toLowerCase().includes('creature')) {
      targetPlayer.battlefield.creatures.push(token);
    } else {
      targetPlayer.battlefield.others.push(token);
    }

    this.gameState.addToGameLog(`Created ${name} token for ${owner}`, 'action');
    this.uiManager.showToast(`Created ${name} token`, 'success');
    this.uiManager.updateZoneDisplay('battlefield', owner);
  },

  /**
   * Fetch token image from Scryfall
   */
  async fetchTokenImage(tokenName) {
    const staticTokens = {
      'Blood': 'https://cards.scryfall.io/normal/front/f/9/f9ed3uter-crimson-vow.jpg',
      'Clue': 'https://cards.scryfall.io/normal/front/3/9/39da4c95-167d-4536-bb16-70f8d2dabc80.jpg',
      'Treasure': 'https://cards.scryfall.io/normal/front/5/f/5f95c6e6-c6ac-4d85-aa4c-d4d60cdcc797.jpg',
      'Food': 'https://cards.scryfall.io/normal/front/b/0/b0a9b01f-21e8-4f89-a24b-ca5b6a85d87d.jpg',
      'Map': 'https://cards.scryfall.io/normal/front/f/4/f484e3f7-3846-4f96-8bdb-47c6c8b75e5d.jpg',
      'Powerstone': 'https://cards.scryfall.io/normal/front/0/4/04c8f2a9-0986-4e8a-9a57-c9548fefbf58.jpg'
    };

    if (staticTokens[tokenName]) {
      return staticTokens[tokenName];
    }

    try {
      let searchTerm = tokenName;
      let colors = '';
      const creatureMatch = tokenName.match(/\d+\/\d+\s+(.+)/);
      if (creatureMatch) {
        searchTerm = creatureMatch[1];

        // Add color context
        if (searchTerm.toLowerCase().includes('soldier') || searchTerm.toLowerCase().includes('angel')) {
          colors = 'c:white';
        } else if (searchTerm.toLowerCase().includes('zombie') || searchTerm.toLowerCase().includes('demon')) {
          colors = 'c:black';
        } else if (searchTerm.toLowerCase().includes('goblin') || searchTerm.toLowerCase().includes('dragon')) {
          colors = 'c:red';
        } else if (searchTerm.toLowerCase().includes('elf') || searchTerm.toLowerCase().includes('beast')) {
          colors = 'c:green';
        } else if (searchTerm.toLowerCase().includes('spirit')) {
          colors = '(c:blue OR c:white)';
        }
      }

      const searchQuery = encodeURIComponent(`${searchTerm} is:token ${colors}`.trim());
      const response = await fetch(`https://api.scryfall.com/cards/search?q=${searchQuery}&order=released&dir=desc`);

      if (!response.ok) {
        throw new Error(`Scryfall token search failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        if (creatureMatch) {
          const [fullPT] = tokenName.match(/(\d+)\/(\d+)/);
          const bestMatch = data.data.find(card => {
            const ptMatch = card.power && card.toughness &&
                           `${card.power}/${card.toughness}` === fullPT;
            return ptMatch;
          });

          if (bestMatch && bestMatch.image_uris?.normal) {
            return bestMatch.image_uris.normal;
          }
        }

        if (data.data[0].image_uris?.normal) {
          return data.data[0].image_uris.normal;
        }
      }

      return null;
    } catch (error) {
      console.warn(`Failed to fetch token image for ${tokenName}:`, error);
      return null;
    }
  },

  /**
   * Library manipulation - view top cards
   */
  viewTopCard() {
    if (!this.gameState?.player?.library || this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty!', 'warning');
      return;
    }
    const topCard = this.gameState.player.library[this.gameState.player.library.length - 1];
    this.uiManager.showToast(`Top card: ${topCard.name}`, 'info');
  },

  /**
   * View top N cards
   */
  viewTopCards(count = 3) {
    if (this.gameState.player.library.length === 0) {
      this.uiManager.showToast('Library is empty!', 'warning');
      return;
    }
    const topCards = this.gameState.player.library.slice(-Math.min(count, this.gameState.player.library.length)).reverse();
    const cardNames = topCards.map(c => c.name).join(', ');
    this.uiManager.showToast(`Top ${topCards.length} card(s): ${cardNames}`, 'info');
  },

  /**
   * Put card from hand on top of library
   */
  putOnTopOfLibrary(cardName) {
    const cardIndex = this.gameState.player.hand.findIndex(c => c.name === cardName);
    if (cardIndex !== -1) {
      const card = this.gameState.player.hand.splice(cardIndex, 1)[0];
      this.gameState.player.library.push(card);
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.showToast(`Put ${card.name} on top of library`, 'success');
    }
  },

  /**
   * Put card from hand on bottom of library
   */
  putOnBottomOfLibrary(cardName) {
    const cardIndex = this.gameState.player.hand.findIndex(c => c.name === cardName);
    if (cardIndex !== -1) {
      const card = this.gameState.player.hand.splice(cardIndex, 1)[0];
      this.gameState.player.library.unshift(card);
      this.uiManager.updateZoneDisplay('hand', 'player');
      this.uiManager.showToast(`Put ${card.name} on bottom of library`, 'success');
    }
  },

  /**
   * Exile top card from library
   */
  exile1FromTop() {
    if (this.gameState.player.library.length > 0) {
      const card = this.gameState.player.library.pop();
      this.gameState.player.exile.push(card);
      this.uiManager.updateZoneDisplay('exile', 'player');
      this.uiManager.showToast(`Exiled ${card.name} from top of library`, 'info');
    } else {
      this.uiManager.showToast('Library is empty!', 'warning');
    }
  },

  /**
   * Shuffle library
   */
  shuffleLibrary() {
    this.gameState.shuffleLibrary('player');
    this.playSound('shuffle');
    this.uiManager.showToast('Library shuffled', 'success');
  },

  /**
   * Execute discard for target player
   */
  executeDiscard(targetPlayer, amount = 1, mode = 'random') {
    console.log('executeDiscard called with:', { targetPlayer, amount, mode });

    const discardCount = parseInt(amount) || 1;
    const playerState = targetPlayer === 'player' ? this : this.opponent;
    const playerName = targetPlayer === 'player' ? 'You' : 'Opponent';

    if (!playerState.hand || playerState.hand.length === 0) {
      this.uiManager.showToast(`${playerName} has no cards to discard.`, 'warning');
      return;
    }

    const cardsToDiscard = [];
    if (mode === 'random') {
      for (let i = 0; i < discardCount && playerState.hand.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * playerState.hand.length);
        const discarded = playerState.hand.splice(randomIndex, 1)[0];
        cardsToDiscard.push(discarded);
        playerState.graveyard.push(discarded);
      }
    }

    this.onGraveyardChange(); // Update Tarmogoyf stats
    this.uiManager.updateZoneDisplay('hand', targetPlayer);
    this.uiManager.updateZoneDisplay('graveyard', targetPlayer);
    this.updateUI();

    if (cardsToDiscard.length > 0) {
      this.showDiscardedCardsModal(cardsToDiscard, playerName);
    }

    this.uiManager.showToast(`${playerName} discarded ${cardsToDiscard.length} card(s) at random.`, 'success');
  },

  /**
   * Show modal with discarded cards (XSS-safe)
   */
  showDiscardedCardsModal(cards, playerName) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = 'max-width: 500px; background: var(--bg-primary); color: var(--text-primary); padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';

    const title = document.createElement('h3');
    title.style.cssText = 'color: var(--error); margin-top: 0;';
    title.textContent = '💀 Cards Discarded';
    contentDiv.appendChild(title);

    const description = document.createElement('p');
    description.style.cssText = 'margin: 10px 0;';
    const playerStrong = document.createElement('strong');
    playerStrong.textContent = playerName;
    description.appendChild(playerStrong);
    description.appendChild(document.createTextNode(` discarded ${cards.length} card${cards.length > 1 ? 's' : ''} at random:`));
    contentDiv.appendChild(description);

    const cardListDiv = document.createElement('div');
    cardListDiv.style.cssText = 'margin: 15px 0;';

    cards.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.style.cssText = 'padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; margin: 4px; background: var(--bg-secondary);';

      const cardName = document.createElement('strong');
      cardName.textContent = card.name;
      cardDiv.appendChild(cardName);

      if (card.type) {
        const typeDiv = document.createElement('div');
        typeDiv.style.cssText = 'font-size: 0.9em; color: var(--text-secondary);';
        typeDiv.textContent = card.type;
        cardDiv.appendChild(typeDiv);
      }

      if (card.cost) {
        const costDiv = document.createElement('div');
        costDiv.style.cssText = 'font-size: 0.85em; color: var(--primary);';
        costDiv.textContent = card.cost;
        cardDiv.appendChild(costDiv);
      }

      cardListDiv.appendChild(cardDiv);
    });

    contentDiv.appendChild(cardListDiv);

    const okButton = document.createElement('button');
    okButton.className = 'btn btn-primary';
    okButton.style.cssText = 'width: 100%; margin-top: 10px;';
    okButton.textContent = 'OK';
    okButton.addEventListener('click', () => modal.remove());
    contentDiv.appendChild(okButton);

    modal.appendChild(contentDiv);
    document.body.appendChild(modal);

    setTimeout(() => {
      if (modal.parentElement) {
        modal.remove();
      }
    }, 4000);
  }
};
