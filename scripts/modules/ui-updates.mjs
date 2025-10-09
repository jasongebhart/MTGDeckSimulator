/**
 * UI Updates Module
 * Handles all DOM manipulation and UI rendering
 */

import { CardImageService } from '/src/services/cardImageService.mjs';

export class UIManager {
  constructor(gameState, cardMechanics, delirium = null) {
    this.gameState = gameState;
    this.cardMechanics = cardMechanics;
    this.delirium = delirium;
  }

  // Toast notifications
  showToast(message, type = 'info') {
    console.log('showToast called:', message, type);
    const container = document.body;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-size: 14px;
      font-weight: 500;
      max-width: 350px;
      word-wrap: break-word;
      opacity: 1;
    `;
    toast.textContent = message;
    console.log('Toast element created, appending to:', container);

    container.appendChild(toast);
    console.log('Toast appended, element:', toast, 'visible:', toast.offsetHeight > 0);

    // Force a reflow to ensure the initial state is rendered
    toast.offsetHeight;

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.transition = 'opacity 0.3s ease-out';
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 3000);
  }

  // State displays
  showLoadingState() {
    this.hideAllStates();
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
      loadingState.style.display = 'block';
      loadingState.classList.add('fade-in');
    }
  }

  showEmptyState() {
    this.hideAllStates();
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.style.display = 'block';
    }
  }

  showGameContent() {
    this.hideAllStates();
    const gameContent = document.getElementById('gameContent');
    if (gameContent) {
      gameContent.style.display = 'block';
    }

    // Always show two-player layout, hide single-player layout
    const twoPlayerLayout = document.querySelector('.two-player-layout');
    const singlePlayerLayout = document.querySelector('.single-player-layout');

    if (twoPlayerLayout) twoPlayerLayout.style.display = 'grid';
    if (singlePlayerLayout) singlePlayerLayout.style.display = 'none';
  }

  showErrorState(message = 'Something went wrong') {
    this.hideAllStates();
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    if (errorState) {
      errorState.style.display = 'block';
      if (errorMessage) {
        errorMessage.textContent = message;
      }
    }
  }

  hideAllStates() {
    ['loadingState', 'errorState', 'emptyState', 'gameContent'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
        element.classList.remove('fade-in', 'slide-in-up', 'scale-in');
      }
    });
  }

  // Turn indicator
  updateTurnDisplay() {
    // Update individual elements for testing compatibility
    const currentTurnDisplay = document.getElementById('currentTurnDisplay');
    const currentPhaseDisplay = document.getElementById('currentPhaseDisplay');

    if (currentTurnDisplay) {
      currentTurnDisplay.textContent = this.gameState.turn;
    }

    if (currentPhaseDisplay) {
      currentPhaseDisplay.textContent = this.gameState.phase;
    }

    // Also update combined turn indicator if it exists
    const turnIndicator = document.getElementById('turnIndicator');
    if (!turnIndicator) return;

    const { activePlayer, phase, turnNumber } = this.gameState.turnState;
    const playerName = activePlayer === 'player' ? 'Player 1' : 'Player 2';

    const phaseNames = {
      beginning: 'Beginning Phase',
      main1: 'Main Phase 1',
      combat: 'Combat Phase',
      main2: 'Main Phase 2',
      end: 'End Phase'
    };

    // Create turn info (XSS-safe)
    turnIndicator.innerHTML = '';
    const turnInfoDiv = document.createElement('div');
    turnInfoDiv.className = 'turn-info';

    const playerSpan = document.createElement('span');
    playerSpan.className = 'turn-player';
    playerSpan.textContent = playerName;
    turnInfoDiv.appendChild(playerSpan);

    const turnNumSpan = document.createElement('span');
    turnNumSpan.className = 'turn-number';
    turnNumSpan.textContent = `Turn ${turnNumber}`;
    turnInfoDiv.appendChild(turnNumSpan);

    const phaseSpan = document.createElement('span');
    phaseSpan.className = 'turn-phase';
    phaseSpan.textContent = phaseNames[phase] || phase;
    turnInfoDiv.appendChild(phaseSpan);

    turnIndicator.appendChild(turnInfoDiv);

    // Update End Turn button state
    this.updateEndTurnButtonState();
  }

  updateEndTurnButtonState() {
    const endTurnButton = document.getElementById('endTurnButton');
    if (!endTurnButton) return;

    // Check if there are cards with upkeep triggers on the battlefield
    const hasUpkeepTriggers = this.checkForUpkeepTriggers();

    if (hasUpkeepTriggers) {
      endTurnButton.classList.add('has-triggers');
      endTurnButton.title = '⏭️ End Turn (Triggers Delver/Upkeep effects)';
    } else {
      endTurnButton.classList.remove('has-triggers');
      endTurnButton.title = '⏭️ End Turn';
    }
  }

  checkForUpkeepTriggers() {
    // Cards that have upkeep triggers
    const upkeepCards = [
      'delver of secrets',
      'huntmaster of the fells',
      'garruk relentless',
      'jace, vryn\'s prodigy',
      'thing in the ice',
      'pyromancer ascension',
      'dark depths'
    ];

    // Check both players' battlefields
    const players = [this.gameState.player, this.gameState.opponent];

    for (const player of players) {
      const allPermanents = [
        ...player.battlefield.creatures,
        ...player.battlefield.lands,
        ...player.battlefield.others
      ];

      for (const card of allPermanents) {
        const cardName = (card.name || '').toLowerCase();
        const currentFace = (card.currentFace || card.name || '').toLowerCase();

        // Check if this is a card with upkeep triggers in its untransformed state
        if (upkeepCards.some(trigger => cardName.includes(trigger) || currentFace.includes(trigger))) {
          // For Delver, only trigger if it's still untransformed
          if (cardName.includes('delver of secrets') && currentFace === 'delver of secrets') {
            return true;
          }
          // For Huntmaster, only if untransformed
          if (cardName.includes('huntmaster') && currentFace.includes('huntmaster')) {
            return true;
          }
          // For other transform cards
          if (!cardName.includes('delver') && !cardName.includes('huntmaster')) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Life total displays
  updateLifeDisplay(playerName = 'player') {
    const lifeId = playerName === 'player' ? 'lifeTotal2' : 'opponentLife2';
    const lifeElement = document.getElementById(lifeId);

    if (lifeElement) {
      const playerState = this.gameState.getPlayerState(playerName);
      lifeElement.textContent = playerState.gameStats.life;
    }
  }

  // Hand count displays
  updateHandCountDisplay(playerName = 'player') {
    const countId = playerName === 'player' ? 'playerHandCount' : 'opponentHandCount';
    const countElement = document.getElementById(countId);

    if (countElement) {
      const playerState = this.gameState.getPlayerState(playerName);
      countElement.textContent = playerState.hand.length;
    }
  }

  // Game log (XSS-safe)
  updateGameLog() {
    const logPanel = document.getElementById('gameLogPanel');
    if (!logPanel) return;

    logPanel.innerHTML = '';

    this.gameState.gameLog.forEach(entry => {
      const logEntry = document.createElement('div');
      logEntry.className = `log-entry log-${entry.type}`;
      logEntry.style.cssText = `
        padding: 8px 10px;
        margin-bottom: 6px;
        border-left: 3px solid var(--${entry.type === 'error' ? 'error' : 'primary'});
        background: var(--bg-secondary);
        border-radius: 4px;
        font-size: 14px;
      `;

      const metaDiv = document.createElement('div');
      metaDiv.style.cssText = 'color: var(--text-secondary); font-size: 12px; margin-bottom: 3px;';
      metaDiv.textContent = `Turn ${entry.turn} - ${entry.phase}`;
      logEntry.appendChild(metaDiv);

      const messageDiv = document.createElement('div');
      messageDiv.textContent = entry.message;
      logEntry.appendChild(messageDiv);

      logPanel.appendChild(logEntry);
    });
  }

  // Zone displays
  updateZoneDisplay(zoneName, playerName = 'player') {
    console.log('updateZoneDisplay called:', zoneName, playerName);

    // Container IDs - using actual container names from HTML
    const containerIds = {
      hand: playerName === 'player' ? 'handContainer2' : 'opponentHandContainer2',
      battlefield: {
        lands: playerName === 'player' ? 'battlefieldLands2' : 'opponentBattlefieldLands2',
        creatures: playerName === 'player' ? 'battlefieldCreatures2' : 'opponentBattlefieldCreatures2',
        others: playerName === 'player' ? 'battlefieldOthers2' : 'opponentBattlefieldOthers2'
      },
      graveyard: playerName === 'player' ? 'graveyardZone' : null, // Opponent graveyard not visible
      exile: playerName === 'player' ? 'exileZone' : null // Opponent exile not visible
    };

    const playerState = this.gameState.getPlayerState(playerName);
    console.log('Player state for', playerName, ':', playerState);

    if (zoneName === 'battlefield') {
      // Update each battlefield zone separately
      Object.keys(containerIds.battlefield).forEach(subZone => {
        const containerId = containerIds.battlefield[subZone];
        const container = document.getElementById(containerId);
        if (container) {
          this.renderCards(container, playerState.battlefield[subZone], `${playerName}-battlefield-${subZone}`);
        } else {
          console.warn(`Container not found: ${containerId}`);
        }
      });
    } else {
      const containerId = containerIds[zoneName];

      // Skip if container doesn't exist in layout (e.g., opponent graveyard/exile)
      if (!containerId) {
        console.log(`Skipping ${zoneName} for ${playerName} - no container in this layout`);
        return;
      }

      console.log('Looking for container:', containerId);
      const container = document.getElementById(containerId);
      console.log('Container found:', !!container);
      if (container && playerState[zoneName]) {
        console.log('Rendering', playerState[zoneName].length, 'cards to', containerId);
        this.renderCards(container, playerState[zoneName], `${playerName}-${zoneName}`);

        // Update delirium indicator when player graveyard changes
        if (zoneName === 'graveyard' && playerName === 'player' && this.delirium) {
          this.delirium.updateDeliriumIndicator();
        }
      } else {
        console.warn('Cannot render zone - container:', !!container, 'zone data:', !!playerState[zoneName]);
      }
    }
  }

  renderCards(container, cards, zoneId) {
    if (!container) {
      console.warn('renderCards: No container provided');
      return;
    }

    console.log(`renderCards: Rendering ${cards.length} cards to container`, container.id);

    // Determine if this is a hand zone or battlefield/other zone
    const isHandZone = zoneId.includes('hand') || container.id.includes('hand') || container.id.includes('Hand');
    const isBattlefieldZone = zoneId.includes('battlefield');
    const cardClass = isHandZone ? 'card-hand' : 'zone-card';

    container.innerHTML = cards.map((card, index) => {
      const isRecentlyDrawn = card.recentlyDrawn || false;
      const highlightStyle = isRecentlyDrawn ? 'box-shadow: 0 0 15px 3px #fbbf24; border: 2px solid #fbbf24;' : '';

      // Use currentFace if card is transformed, otherwise use name
      const displayName = card.currentFace || card.name;

      // Check for Dragon's Rage Channeler delirium indicator
      const isDRC = isBattlefieldZone && card.name.toLowerCase().includes("dragon's rage channeler");
      const hasDelirium = this.delirium && this.delirium.checkDelirium(this.gameState.player.graveyard);
      const deliriumBadge = isDRC && hasDelirium ?
        '<div class="delirium-indicator" style="position: absolute; top: 24px; left: 2px; background: rgba(34, 197, 94, 0.95); border-radius: 3px; padding: 2px 5px; font-size: 10px; font-weight: bold; color: white; z-index: 100; pointer-events: none;" title="Delirium active: +1/+0, Flying">🌀</div>' : '';

      return `
      <div class="${cardClass} ${isRecentlyDrawn ? 'recently-drawn' : ''}"
           data-card-id="${card.id || `${card.name}_${index}`}"
           data-card-name="${this.escapeHtml(card.name)}"
           ${card.tapped ? 'data-tapped="true"' : ''}
           draggable="true"
           style="animation-delay: ${index * 0.1}s; position: relative; cursor: grab; ${highlightStyle}">
        ${index < 9 && isHandZone ? `<div class="card-number" style="position: absolute; top: 5px; left: 5px; background: rgba(0,0,0,0.8); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; z-index: 10;">${index + 1}</div>` : ''}
        ${isRecentlyDrawn && isHandZone ? '<div class="recently-drawn-badge" style="position: absolute; top: 5px; right: 5px; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-weight: bold; z-index: 10;">NEW</div>' : ''}
        <div class="card-content">
          <div class="card-image-container" style="position: relative;">
            <img class="card-image-lazy"
                 data-card-name="${this.escapeHtml(displayName)}"
                 ${card.imageUrl ? `data-image-url="${this.escapeHtml(card.imageUrl)}"` : ''}
                 alt="${this.escapeHtml(displayName)}"
                 loading="lazy">
            <div class="loading-placeholder">🎴</div>
            ${deliriumBadge}
          </div>
          <div class="card-info">
            <div class="card-name">${this.escapeHtml(displayName)}</div>
            <div class="card-details">
              <div class="card-cost">${this.escapeHtml(card.cost || '0')}</div>
              <div class="card-type">${this.escapeHtml(this.getCardMainType(card.type || 'Unknown'))}</div>
              ${this.renderPowerToughness(card)}
              ${card.counters && Object.keys(card.counters).length > 0 ? this.renderCounters(card.counters) : ''}
            </div>
          </div>
        </div>
        <button class="card-action-trigger" aria-label="Card actions">⋯</button>
      </div>
    `;}).join('');

    console.log('renderCards: HTML set, innerHTML length:', container.innerHTML.length);

    // Attach event listeners to cards
    this.attachCardEventListeners(container);

    // Load card images asynchronously
    this.loadCardImages(container);
  }

  attachCardEventListeners(container) {
    const cardElements = container.querySelectorAll('.card-hand, .zone-card');

    cardElements.forEach(cardElement => {
      const cardName = cardElement.getAttribute('data-card-name');
      const cardId = cardElement.getAttribute('data-card-id');

      // Click on card to play it (only for hand cards)
      cardElement.addEventListener('click', (e) => {
        // Don't trigger if clicking on the image or action trigger
        if (e.target.closest('.card-image-container') || e.target.closest('.card-action-trigger')) {
          return;
        }

        // Only play cards from hand, not from other zones
        const container = cardElement.closest('.zone-content');
        const isHandCard = container && (
          container.id.includes('hand') ||
          container.id.includes('Hand')
        );

        if (isHandCard) {
          e.stopPropagation();
          this.playCardFromHand(cardId, cardName);
        }
      });

      // Click on card image to show preview
      const imageContainer = cardElement.querySelector('.card-image-container');
      if (imageContainer) {
        imageContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showCardPreview(cardName);
        });
        imageContainer.style.cursor = 'pointer';
      }

      // Click on action trigger button for context menu
      const actionTrigger = cardElement.querySelector('.card-action-trigger');
      if (actionTrigger) {
        actionTrigger.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent card click from playing card
          this.showCardMenu(e, cardId, cardName);
        });
      }

      // Drag and drop handlers
      cardElement.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', cardId);
        cardElement.classList.add('dragging');
      });

      cardElement.addEventListener('dragend', (_e) => {
        cardElement.classList.remove('dragging');
      });
    });
  }

  playCardFromHand(cardId, cardName) {
    console.log('playCardFromHand:', cardId, cardName);

    // Check if this is an adventure card
    if (window.handSimulator && window.handSimulator.hasAdventure && window.handSimulator.hasAdventure(cardName)) {
      window.handSimulator.showAdventureUI(cardId, cardName);
      return;
    }

    // Try to call the main simulator's method if available
    if (window.handSimulator && typeof window.handSimulator.playCardDirectly === 'function') {
      window.handSimulator.playCardDirectly(cardId);
    } else {
      console.warn('handSimulator.playCardDirectly not available');
    }
  }

  showCardPreview(cardName) {
    console.log('showCardPreview:', cardName);
    // Try to call the main simulator's method if available
    if (window.handSimulator && typeof window.handSimulator.showCardPreview === 'function') {
      window.handSimulator.showCardPreview(cardName);
    } else {
      console.warn('handSimulator.showCardPreview not available');
    }
  }

  showCardMenu(event, cardId, cardName) {
    console.log('showCardMenu:', cardId, cardName);

    if (!window.handSimulator) {
      console.warn('handSimulator not available');
      return;
    }

    // Determine which zone the card is in (check both zone-content and modal containers)
    const container = event.target.closest('.zone-content') || event.target.closest('[data-zone-type]');
    const zoneType = container?.getAttribute('data-zone-type');

    const isHandCard = container && (
      container.id.includes('hand') ||
      container.id.includes('Hand')
    );
    const isGraveyardCard = (container && container.id.includes('graveyard')) || zoneType === 'graveyard';
    const isExileCard = (container && container.id.includes('exile')) || zoneType === 'exile';

    if (isHandCard && typeof window.handSimulator.showHandCardMenu === 'function') {
      window.handSimulator.showHandCardMenu(event, cardId);
    } else if (isGraveyardCard && typeof window.handSimulator.showGraveyardCardMenu === 'function') {
      window.handSimulator.showGraveyardCardMenu(event, cardId);
    } else if (isExileCard && typeof window.handSimulator.showExileCardMenu === 'function') {
      window.handSimulator.showExileCardMenu(event, cardId);
    } else if (typeof window.handSimulator.showBattlefieldCardMenu === 'function') {
      window.handSimulator.showBattlefieldCardMenu(event, cardId);
    } else {
      console.warn('No appropriate card menu method available');
    }
  }

  async loadCardImages(container) {
    const images = container.querySelectorAll('.card-image-lazy');
    console.log(`Loading images for ${images.length} cards`);
    console.log('CardImageService available:', typeof CardImageService, CardImageService);

    for (const img of images) {
      const cardName = img.getAttribute('data-card-name');
      if (!cardName) continue;

      try {
        // Check if the card already has an imageUrl (e.g., tokens)
        const presetImageUrl = img.getAttribute('data-image-url');
        let imageUrl;

        if (presetImageUrl) {
          console.log(`Using preset image URL for ${cardName}:`, presetImageUrl);
          imageUrl = presetImageUrl;
        } else {
          console.log(`Fetching image for: ${cardName}`);
          imageUrl = await CardImageService.getCardImageUrl(cardName, 'normal');
          console.log(`Got image URL for ${cardName}:`, imageUrl);
        }

        if (imageUrl) {
          img.src = imageUrl;
          const loadingPlaceholder = img.parentElement.querySelector('.loading-placeholder');

          img.onerror = () => {
            console.error(`Failed to load image URL for ${cardName}:`, imageUrl);
            img.classList.add('error');
            // Keep loading placeholder visible on error
          };
          img.onload = () => {
            console.log(`Successfully loaded image for ${cardName}`);
            img.classList.add('loaded');
            // Hide loading placeholder when image loads
            if (loadingPlaceholder) {
              loadingPlaceholder.style.display = 'none';
            }
          };
        } else {
          console.warn(`No image URL returned for ${cardName}`);
          // Keep placeholder visible
        }
      } catch (error) {
        console.error(`Error fetching image for ${cardName}:`, error);
        // Keep placeholder with name overlay
      }
    }
  }

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

  renderPowerToughness(card) {
    // Only show P/T for creatures
    if (!card.type || !card.type.toLowerCase().includes('creature')) {
      return '';
    }

    const basePT = this.extractBasePowerToughness(card);
    if (!basePT) return '';

    const { power, toughness } = this.calculateModifiedPT(card, basePT);
    const isModified = power !== basePT.power || toughness !== basePT.toughness;

    return `
      <div class="card-pt" style="
        font-size: 12px;
        font-weight: bold;
        margin-top: 2px;
        ${isModified ? 'color: #27ae60;' : 'color: #555;'}
      ">
        ${isModified ? `${power}/${toughness} <span style="font-size: 10px; color: #7f8c8d;">(${basePT.power}/${basePT.toughness})</span>` : `${power}/${toughness}`}
      </div>
    `;
  }

  extractBasePowerToughness(card) {
    if (card.power !== undefined && card.toughness !== undefined) {
      return { power: parseInt(card.power), toughness: parseInt(card.toughness) };
    }

    const ptString = card.powerToughness || card.pt;
    if (!ptString) return null;

    const match = ptString.match(/^(\d+|\*)\/(\d+|\*)$/);
    if (match) {
      return {
        power: match[1] === '*' ? 0 : parseInt(match[1]),
        toughness: match[2] === '*' ? 0 : parseInt(match[2])
      };
    }

    return null;
  }

  calculateModifiedPT(card, basePT) {
    let power = basePT.power;
    let toughness = basePT.toughness;

    if (card.counters) {
      // Apply +1/+1 counters
      if (card.counters['+1/+1']) {
        power += card.counters['+1/+1'];
        toughness += card.counters['+1/+1'];
      }

      // Apply -1/-1 counters
      if (card.counters['-1/-1']) {
        power -= card.counters['-1/-1'];
        toughness -= card.counters['-1/-1'];
      }
    }

    return { power: Math.max(0, power), toughness: Math.max(0, toughness) };
  }

  renderCounters(counters) {
    const counterStyles = {
      '+1/+1': { color: '#27ae60', emoji: '💪', bg: '#e8f8f5' },
      '-1/-1': { color: '#e74c3c', emoji: '💀', bg: '#fadbd8' },
      'charge': { color: '#3498db', emoji: '⚡', bg: '#d6eaf8' },
      'loyalty': { color: '#9b59b6', emoji: '💎', bg: '#ebdef0' },
      'time': { color: '#f39c12', emoji: '⏱️', bg: '#fef5e7' },
      'ice': { color: '#5dade2', emoji: '❄️', bg: '#d4e6f1' }
    };

    return `
      <div class="card-counters" style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px;">
        ${Object.entries(counters).map(([type, count]) => {
          const style = counterStyles[type] || { color: '#7f8c8d', emoji: '🔵', bg: '#ecf0f1' };
          return `
            <span class="counter-badge" data-type="${type}" style="
              background: ${style.bg};
              color: ${style.color};
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              display: inline-flex;
              align-items: center;
              gap: 2px;
              border: 1px solid ${style.color}40;
            ">
              ${style.emoji} ${count}
            </span>
          `;
        }).join('')}
      </div>
    `;
  }

  // Deck selector updates
  updateDeckSelector(deckPath, deckName) {
    // Update both the old selector (if exists) and modal selector
    const quickDeckSelect = document.getElementById('quickDeckSelect');
    const deckSelectModal = document.getElementById('deckSelectModal');

    if (quickDeckSelect) {
      const option = Array.from(quickDeckSelect.options).find(opt => opt.value === deckPath);
      if (option) {
        quickDeckSelect.value = deckPath;
      }
    }

    if (deckSelectModal) {
      const option = Array.from(deckSelectModal.options).find(opt => opt.value === deckPath);
      if (option) {
        deckSelectModal.value = deckPath;
      }
    }

    // Update deck name displays
    const deckNameElements = document.querySelectorAll('[id*="DeckName"]');
    deckNameElements.forEach(el => {
      if (el.id.includes('player') && !el.id.includes('opponent')) {
        el.textContent = deckName;
      }
    });
  }

  updateOpponentDeckSelector(deckPath, deckName) {
    // Update both the old selector (if exists) and modal selector
    const opponentDeckSelect = document.getElementById('opponentDeckSelectTop');
    const opponentDeckSelectModal = document.getElementById('opponentDeckSelectModal');

    if (opponentDeckSelect) {
      if (opponentDeckSelect.tagName === 'SELECT') {
        const option = Array.from(opponentDeckSelect.options).find(opt => opt.value === deckPath);
        if (option) {
          opponentDeckSelect.value = deckPath;
        }
      }
    }

    if (opponentDeckSelectModal) {
        if (opponentDeckSelectModal.tagName === 'SELECT') {
            const option = Array.from(opponentDeckSelectModal.options).find(opt => opt.value === deckPath);
            if (option) {
                opponentDeckSelectModal.value = deckPath;
            }
        } else {
            // Handle the div case
            const deckItems = opponentDeckSelectModal.querySelectorAll('[data-path]');
            deckItems.forEach(item => {
                if (item.dataset.path === deckPath) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
    }

    // Update opponent deck name displays
    const opponentDeckNameElements = document.querySelectorAll('[id*="opponentDeckName"]');
    opponentDeckNameElements.forEach(el => {
      el.textContent = deckName;
    });
  }

  // Utility
  escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Active player highlights
  updateActivePlayerHighlight() {
    const playerArea = document.getElementById('playerArea');
    const opponentArea = document.getElementById('opponentArea');

    if (playerArea) {
      playerArea.classList.toggle('active-player', this.gameState.activePlayer === 'player');
    }
    if (opponentArea) {
      opponentArea.classList.toggle('active-player', this.gameState.activePlayer === 'opponent');
    }
  }

  // Update all displays
  updateAll() {
    this.updateTurnDisplay();
    this.updateLifeDisplay('player');
    this.updateLifeDisplay('opponent');
    this.updateHandCountDisplay('player');
    this.updateHandCountDisplay('opponent');
    this.updateZoneDisplay('hand', 'player');
    this.updateZoneDisplay('hand', 'opponent');
    this.updateZoneDisplay('battlefield', 'player');
    this.updateZoneDisplay('battlefield', 'opponent');
    this.updateZoneDisplay('graveyard', 'player');
    this.updateZoneDisplay('graveyard', 'opponent');
    this.updateZoneDisplay('exile', 'player');
    this.updateZoneDisplay('exile', 'opponent');
    this.updateZoneCounts();
    this.updateGameLog();
    this.updateActivePlayerHighlight();
  }

  updateZoneCounts() {
    const playerState = this.gameState.getPlayerState('player');
    const opponentState = this.gameState.getPlayerState('opponent');

    // Update library counts
    const playerLibraryCount2 = document.getElementById('playerLibraryCount2');
    const opponentLibraryCount2 = document.getElementById('opponentLibraryCount2');
    const libraryCountDisplay = document.getElementById('libraryCountDisplay');
    const playerLibraryButtonCount = document.getElementById('playerLibraryButtonCount');
    const opponentLibraryButtonCount = document.getElementById('opponentLibraryButtonCount');

    if (playerLibraryCount2) playerLibraryCount2.textContent = playerState.library.length;
    if (opponentLibraryCount2) opponentLibraryCount2.textContent = opponentState.library.length;
    if (libraryCountDisplay) libraryCountDisplay.textContent = playerState.library.length;
    if (playerLibraryButtonCount) playerLibraryButtonCount.textContent = playerState.library.length;
    if (opponentLibraryButtonCount) opponentLibraryButtonCount.textContent = opponentState.library.length;

    // Update graveyard counts
    const graveyardCount = document.getElementById('graveyardCount');
    const graveyardCount2 = document.getElementById('graveyardCount2');
    const opponentGraveyardCount2 = document.getElementById('opponentGraveyardCount2');

    if (graveyardCount) graveyardCount.textContent = playerState.graveyard.length;
    if (graveyardCount2) graveyardCount2.textContent = playerState.graveyard.length;
    if (opponentGraveyardCount2) opponentGraveyardCount2.textContent = opponentState.graveyard.length;

    // Update exile counts
    const exileCount = document.getElementById('exileCount');
    const exileCount2 = document.getElementById('exileCount2');
    const opponentExileCount2 = document.getElementById('opponentExileCount2');

    if (exileCount) exileCount.textContent = playerState.exile.length;
    if (exileCount2) exileCount2.textContent = playerState.exile.length;
    if (opponentExileCount2) opponentExileCount2.textContent = opponentState.exile.length;
  }
}
