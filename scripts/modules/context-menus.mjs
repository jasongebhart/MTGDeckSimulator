/**
 * Context Menus Module
 * Handles right-click context menus for cards in different zones
 */

export const ContextMenus = {
  /**
   * Show context menu for battlefield cards
   */
  showBattlefieldCardMenu(event, cardId) {
    console.log('showBattlefieldCardMenu:', cardId);
    event.preventDefault();

    // Find the card in any player's battlefield
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) {
      console.error('Card not found in any battlefield');
      return;
    }

    const { card, owner } = result;
    this.createSmartContextMenu(event, card, cardId, owner, 'battlefield');
  },

  /**
   * Find card in any player's battlefield
   */
  findBattlefieldCardAnyPlayer(cardId) {
    // Search player battlefield
    for (const zone of ['lands', 'creatures', 'others']) {
      const playerCard = this.gameState.player.battlefield[zone].find(c => c.id === cardId);
      if (playerCard) return { card: playerCard, owner: 'player' };
    }

    // Search opponent battlefield
    for (const zone of ['lands', 'creatures', 'others']) {
      const opponentCard = this.gameState.opponent.battlefield[zone].find(c => c.id === cardId);
      if (opponentCard) return { card: opponentCard, owner: 'opponent' };
    }

    return null;
  },

  /**
   * Create smart context menu with owner awareness
   */
  createSmartContextMenu(event, card, cardId, owner, zone) {
    // Remove existing menus
    this.removeExistingMenus();

    const menu = document.createElement('div');
    menu.className = 'smart-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: #ffffff;
      color: #000000;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000000;
      min-width: 180px;
      overflow: hidden;
    `;

    const cardType = this.uiManager.getCardMainType(card.type || '').toLowerCase();
    const isTapped = card.tapped;

    // Create menu HTML
    let menuHTML = '';

    // Owner header
    const ownerLabel = owner === 'opponent' ? '👤 Opponent' : '🎮 You';
    menuHTML += `<div style="padding: 6px 12px; background: #f5f5f5; font-size: 11px; font-weight: bold; color: #666; border-bottom: 1px solid #ddd;">${ownerLabel}'s ${card.name}</div>`;

    // Check if DFC
    if (this.getDFCData && this.getDFCData(card.name)) {
      const dfcData = this.getDFCData(card.name);
      const currentFace = card.currentFace || card.name;
      const isOnFront = currentFace.toLowerCase() === dfcData.frontFace.toLowerCase();
      const transformTo = isOnFront ? dfcData.backFace : dfcData.frontFace;

      menuHTML += `<div class="menu-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="window.handSimulator.transformCard('${this.escapeJs(cardId)}')">
        🔄 Transform → ${transformTo.split(' ')[0]}
      </div>`;
    }

    // Tap/Untap
    menuHTML += `<div class="menu-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="window.handSimulator.toggleTapByOwner('${this.escapeJs(cardId)}', '${owner}')">
      ${isTapped ? '↺ Untap' : '⤵️ Tap'}
    </div>`;

    // Counter management
    const counterTypes = [
      { type: '+1/+1', emoji: '💪', applicable: cardType === 'creature' },
      { type: '-1/-1', emoji: '💀', applicable: cardType === 'creature' },
      { type: 'charge', emoji: '⚡', applicable: true },
      { type: 'loyalty', emoji: '💎', applicable: cardType === 'planeswalker' || cardType === 'other' },
      { type: 'time', emoji: '⏱️', applicable: true },
      { type: 'ice', emoji: '❄️', applicable: true }
    ];

    // Show add counter submenu
    menuHTML += `<div class="menu-item menu-item-submenu" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; position: relative;">
      ➕ Add Counter
      <span style="float: right;">▶</span>
      <div class="submenu" style="
        display: none;
        position: absolute;
        left: 100%;
        top: 0;
        background: #ffffff;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        min-width: 160px;
        z-index: 1000001;
      ">
        ${counterTypes.filter(ct => ct.applicable).map(ct => `
          <div class="submenu-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
               onclick="window.handSimulator.addCounterByOwner('${this.escapeJs(cardId)}', '${ct.type}', '${owner}'); event.stopPropagation();">
            ${ct.emoji} ${ct.type}
          </div>
        `).join('')}
      </div>
    </div>`;

    // Show remove counter options for existing counters
    if (card.counters && Object.keys(card.counters).length > 0) {
      menuHTML += `<div class="menu-item menu-item-submenu" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; position: relative;">
        ➖ Remove Counter
        <span style="float: right;">▶</span>
        <div class="submenu" style="
          display: none;
          position: absolute;
          left: 100%;
          top: 0;
          background: #ffffff;
          border: 1px solid #ddd;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 160px;
          z-index: 1000001;
        ">
          ${Object.entries(card.counters).map(([type, count]) => {
            const emoji = counterTypes.find(ct => ct.type === type)?.emoji || '🔵';
            return `
              <div class="submenu-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;"
                   onclick="window.handSimulator.removeCounterByOwner('${this.escapeJs(cardId)}', '${type}', '${owner}'); event.stopPropagation();">
                ${emoji} ${type} (${count})
              </div>
            `;
          }).join('')}
        </div>
      </div>`;
    }

    // Zone movement
    menuHTML += `<div class="menu-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="window.handSimulator.moveToGraveyardByOwner('${this.escapeJs(cardId)}', '${owner}')">
      🪦 To Graveyard
    </div>`;
    menuHTML += `<div class="menu-item" style="padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee;" onclick="window.handSimulator.moveToExileByOwner('${this.escapeJs(cardId)}', '${owner}')">
      🚫 Exile
    </div>`;
    menuHTML += `<div class="menu-item" style="padding: 8px 12px; cursor: pointer;" onclick="window.handSimulator.moveToHandByOwner('${this.escapeJs(cardId)}', '${owner}')">
      🃏 Return to Hand
    </div>`;

    menu.innerHTML = menuHTML;
    document.body.appendChild(menu);

    // Adjust position if off-screen
    this.adjustMenuPosition(menu, event);

    // Add click outside listener
    this.addMenuClickOutsideListener(menu);

    // Add hover styles
    menu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f0f0';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });
    });

    // Add submenu hover functionality
    menu.querySelectorAll('.menu-item-submenu').forEach(item => {
      const submenu = item.querySelector('.submenu');
      if (submenu) {
        item.addEventListener('mouseenter', () => {
          submenu.style.display = 'block';
        });
        item.addEventListener('mouseleave', () => {
          submenu.style.display = 'none';
        });

        // Add hover styles to submenu items
        submenu.querySelectorAll('.submenu-item').forEach(subItem => {
          subItem.addEventListener('mouseenter', () => {
            subItem.style.background = '#f0f0f0';
          });
          subItem.addEventListener('mouseleave', () => {
            subItem.style.background = '';
          });
        });
      }
    });
  },

  /**
   * Remove all existing context menus
   */
  removeExistingMenus() {
    const menus = document.querySelectorAll('.smart-context-menu, .battlefield-context-menu, .hand-context-menu');
    menus.forEach(menu => menu.remove());
  },

  /**
   * Adjust menu position if off-screen
   */
  adjustMenuPosition(menu, event) {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (rect.right > viewportWidth) {
      menu.style.left = `${viewportWidth - rect.width - 10}px`;
    }

    // Adjust vertical position
    if (rect.bottom > viewportHeight) {
      menu.style.top = `${viewportHeight - rect.height - 10}px`;
    }
  },

  /**
   * Add click outside listener to close menu
   */
  addMenuClickOutsideListener(menu) {
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  },

  /**
   * Escape JavaScript strings for HTML attributes
   */
  escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
  },

  // === Owner-aware card movement methods ===

  toggleTapByOwner(cardId, owner) {
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) return;

    result.card.tapped = !result.card.tapped;
    this.uiManager.updateZoneDisplay('battlefield', owner);
    this.uiManager.showToast(`${result.card.name} ${result.card.tapped ? 'tapped' : 'untapped'}`, 'info');
    this.removeExistingMenus();
  },

  moveToGraveyardByOwner(cardId, owner) {
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) return;

    // Remove from battlefield
    const playerState = this.gameState[owner];
    for (const zone of ['lands', 'creatures', 'others']) {
      const index = playerState.battlefield[zone].findIndex(c => c.id === cardId);
      if (index !== -1) {
        const card = playerState.battlefield[zone].splice(index, 1)[0];
        playerState.graveyard.push(card);
        this.uiManager.updateAll();
        this.uiManager.showToast(`${card.name} moved to graveyard`, 'info');
        this.removeExistingMenus();
        return;
      }
    }
  },

  moveToExileByOwner(cardId, owner) {
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) return;

    // Remove from battlefield
    const playerState = this.gameState[owner];
    for (const zone of ['lands', 'creatures', 'others']) {
      const index = playerState.battlefield[zone].findIndex(c => c.id === cardId);
      if (index !== -1) {
        const card = playerState.battlefield[zone].splice(index, 1)[0];
        playerState.exile.push(card);
        this.uiManager.updateAll();
        this.uiManager.showToast(`${card.name} exiled`, 'info');
        this.removeExistingMenus();
        return;
      }
    }
  },

  moveToHandByOwner(cardId, owner) {
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) return;

    // Remove from battlefield
    const playerState = this.gameState[owner];
    for (const zone of ['lands', 'creatures', 'others']) {
      const index = playerState.battlefield[zone].findIndex(c => c.id === cardId);
      if (index !== -1) {
        const card = playerState.battlefield[zone].splice(index, 1)[0];
        playerState.hand.push(card);
        this.uiManager.updateAll();
        this.uiManager.showToast(`${card.name} returned to hand`, 'info');
        this.removeExistingMenus();
        return;
      }
    }
  },

  addCounterByOwner(cardId, counterType, owner) {
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) return;

    if (!result.card.counters) result.card.counters = {};
    result.card.counters[counterType] = (result.card.counters[counterType] || 0) + 1;

    this.uiManager.updateZoneDisplay('battlefield', owner);
    this.uiManager.showToast(`Added ${counterType} counter to ${result.card.name}`, 'info');
    this.removeExistingMenus();
  },

  removeCounterByOwner(cardId, counterType, owner) {
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result || !result.card.counters || !result.card.counters[counterType]) return;

    result.card.counters[counterType]--;
    if (result.card.counters[counterType] === 0) {
      delete result.card.counters[counterType];
    }

    this.uiManager.updateZoneDisplay('battlefield', owner);
    this.uiManager.showToast(`Removed ${counterType} counter from ${result.card.name}`, 'info');
    this.removeExistingMenus();
  }
};
