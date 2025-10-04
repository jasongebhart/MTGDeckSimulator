/**
 * Context Menus Module
 * Handles right-click context menus for cards in different zones
 */

export const ContextMenus = {
  /**
   * Show context menu for battlefield cards
   */
  showBattlefieldCardMenu(event, cardId) {
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
      overflow: visible;
    `;

    const cardType = this.uiManager.getCardMainType(card.type || '').toLowerCase();
    const isTapped = card.tapped;

    // Owner header (using textContent for safety)
    const ownerLabel = owner === 'opponent' ? '👤 Opponent' : '🎮 You';
    const headerDiv = this.createMenuHeader(`${ownerLabel}'s ${card.name}`);
    menu.appendChild(headerDiv);

    // Planeswalker loyalty abilities
    if (cardType === 'planeswalker') {
      const loyalty = card.counters?.loyalty || 0;
      const loyaltyHeader = this.createLoyaltyHeader(loyalty);
      menu.appendChild(loyaltyHeader);

      // Loyalty ability options
      menu.appendChild(this.createMenuItem('➕ +1 Loyalty Ability', () => {
        window.handSimulator.activateLoyaltyAbility(window.handSimulator.findBattlefieldCardAnyPlayer(cardId).card, 1);
      }));

      if (loyalty >= 1) {
        menu.appendChild(this.createMenuItem('➖ -1 Loyalty Ability', () => {
          window.handSimulator.activateLoyaltyAbility(window.handSimulator.findBattlefieldCardAnyPlayer(cardId).card, -1);
        }));
      }

      if (loyalty >= 2) {
        menu.appendChild(this.createMenuItem('➖➖ -2 Loyalty Ability', () => {
          window.handSimulator.activateLoyaltyAbility(window.handSimulator.findBattlefieldCardAnyPlayer(cardId).card, -2);
        }));
      }

      if (loyalty >= 3) {
        menu.appendChild(this.createMenuItem('➖➖➖ -3 Loyalty Ability', () => {
          window.handSimulator.activateLoyaltyAbility(window.handSimulator.findBattlefieldCardAnyPlayer(cardId).card, -3);
        }));
      }
    }

    // Check if DFC
    if (this.getDFCData && this.getDFCData(card.name)) {
      const dfcData = this.getDFCData(card.name);
      const currentFace = card.currentFace || card.name;
      const isOnFront = currentFace.toLowerCase() === dfcData.frontFace.toLowerCase();
      const transformTo = isOnFront ? dfcData.backFace : dfcData.frontFace;

      menu.appendChild(this.createMenuItem(`🔄 Transform → ${transformTo.split(' ')[0]}`, () => {
        window.handSimulator.transformCard(cardId);
      }));
    }

    // Tap/Untap
    menu.appendChild(this.createMenuItem(isTapped ? '↺ Untap' : '⤵️ Tap', () => {
      window.handSimulator.toggleTapByOwner(cardId, owner);
    }));

    // Counter management
    const counterTypes = [
      { type: '+1/+1', emoji: '💪', applicable: cardType === 'creature' },
      { type: '-1/-1', emoji: '💀', applicable: cardType === 'creature' },
      { type: 'charge', emoji: '⚡', applicable: true },
      { type: 'loyalty', emoji: '💎', applicable: cardType === 'planeswalker' || cardType === 'other' },
      { type: 'time', emoji: '⏱️', applicable: true },
      { type: 'ice', emoji: '❄️', applicable: true }
    ];

    // Add counter submenu
    const addCounterSubmenu = this.createSubmenu('➕ Add Counter',
      counterTypes.filter(ct => ct.applicable).map(ct => ({
        text: `${ct.emoji} ${ct.type}`,
        action: () => {
          window.handSimulator.addCounterByOwner(cardId, ct.type, owner);
        }
      }))
    );
    menu.appendChild(addCounterSubmenu);

    // Remove counter submenu (only if counters exist)
    if (card.counters && Object.keys(card.counters).length > 0) {
      const removeCounterItems = Object.entries(card.counters).map(([type, count]) => {
        const emoji = counterTypes.find(ct => ct.type === type)?.emoji || '🔵';
        return {
          text: `${emoji} ${type} (${count})`,
          action: () => {
            window.handSimulator.removeCounterByOwner(cardId, type, owner);
          }
        };
      });
      const removeCounterSubmenu = this.createSubmenu('➖ Remove Counter', removeCounterItems);
      menu.appendChild(removeCounterSubmenu);
    }

    // Zone movement
    menu.appendChild(this.createMenuItem('🪦 To Graveyard', () => {
      window.handSimulator.moveToGraveyardByOwner(cardId, owner);
    }));

    menu.appendChild(this.createMenuItem('🚫 Exile', () => {
      window.handSimulator.moveToExileByOwner(cardId, owner);
    }));

    menu.appendChild(this.createMenuItem('🃏 Return to Hand', () => {
      window.handSimulator.moveToHandByOwner(cardId, owner);
    }, false)); // No border bottom for last item

    document.body.appendChild(menu);

    // Adjust position if off-screen
    this.adjustMenuPosition(menu, event);

    // Add click outside listener
    this.addMenuClickOutsideListener(menu);

    // Add event listeners for menu items
    this.addMenuEventListeners(menu);
  },

  /**
   * Create menu header element (XSS-safe)
   */
  createMenuHeader(text) {
    const div = document.createElement('div');
    div.style.cssText = 'padding: 6px 12px; background: #f5f5f5; font-size: 11px; font-weight: bold; color: #666; border-bottom: 1px solid #ddd;';
    div.textContent = text;
    return div;
  },

  /**
   * Create loyalty header (XSS-safe)
   */
  createLoyaltyHeader(loyalty) {
    const div = document.createElement('div');
    div.style.cssText = 'padding: 6px 12px; background: #ebdef0; font-size: 12px; font-weight: bold; color: #9b59b6; border-bottom: 1px solid #ddd;';
    div.textContent = `💎 Loyalty: ${loyalty}`;
    return div;
  },

  /**
   * Create menu item element (XSS-safe)
   */
  createMenuItem(text, clickHandler, hasBorderBottom = true) {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.style.cssText = `padding: 8px 12px; cursor: pointer;${hasBorderBottom ? ' border-bottom: 1px solid #eee;' : ''}`;
    div.textContent = text;

    if (clickHandler) {
      div.addEventListener('click', (e) => {
        e.stopPropagation();
        clickHandler();
        this.removeExistingMenus();
      });
    }

    return div;
  },

  /**
   * Create submenu with items (XSS-safe)
   */
  createSubmenu(parentText, items) {
    const parentDiv = document.createElement('div');
    parentDiv.className = 'menu-item menu-item-submenu';
    parentDiv.style.cssText = 'padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; position: relative;';

    const textSpan = document.createElement('span');
    textSpan.textContent = parentText;
    parentDiv.appendChild(textSpan);

    const arrow = document.createElement('span');
    arrow.style.cssText = 'float: right;';
    arrow.textContent = '▶';
    parentDiv.appendChild(arrow);

    const submenu = document.createElement('div');
    submenu.className = 'submenu';
    submenu.style.cssText = `
      display: none;
      position: absolute;
      left: calc(100% - 1px);
      top: -1px;
      background: #ffffff;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 160px;
      z-index: 1000001;
    `;

    items.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'submenu-item';
      itemDiv.style.cssText = `padding: 8px 12px; cursor: pointer;${index < items.length - 1 ? ' border-bottom: 1px solid #eee;' : ''}`;
      itemDiv.textContent = item.text;

      itemDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action();
        this.removeExistingMenus();
      });

      submenu.appendChild(itemDiv);
    });

    parentDiv.appendChild(submenu);
    return parentDiv;
  },

  /**
   * Add event listeners to menu items
   */
  addMenuEventListeners(menu) {
    // Add hover styles
    // Add hover styles to regular menu items (not submenus)
    menu.querySelectorAll('.menu-item:not(.menu-item-submenu)').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f0f0';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });
    });

    // Add submenu hover functionality
    const submenuItems = menu.querySelectorAll('.menu-item-submenu');

    submenuItems.forEach(item => {
      const submenu = item.querySelector('.submenu');

      if (submenu) {
        let hideTimeout;

        // Show submenu on parent hover
        item.addEventListener('mouseenter', () => {
          clearTimeout(hideTimeout);
          item.style.background = '#f0f0f0';
          // Hide all other submenus first
          menu.querySelectorAll('.submenu').forEach(s => {
            if (s !== submenu) s.style.display = 'none';
          });
          submenu.style.display = 'block';
        });

        // Hide submenu when leaving the entire parent item (with delay)
        item.addEventListener('mouseleave', () => {
          item.style.background = '';
          hideTimeout = setTimeout(() => {
            submenu.style.display = 'none';
          }, 300);
        });

        // Keep submenu visible when hovering over it
        submenu.addEventListener('mouseenter', () => {
          clearTimeout(hideTimeout);
          submenu.style.display = 'block';
        });

        // Hide when leaving submenu
        submenu.addEventListener('mouseleave', () => {
          hideTimeout = setTimeout(() => {
            submenu.style.display = 'none';
          }, 100);
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
    this.uiManager.updateAll();
    this.uiManager.showToast(`${result.card.name} ${result.card.tapped ? 'tapped' : 'untapped'}`, 'info');
    this.removeExistingMenus();
  },

  moveToGraveyardByOwner(cardId, owner) {
    console.log('moveToGraveyardByOwner called:', cardId, owner);
    const result = this.findBattlefieldCardAnyPlayer(cardId);
    if (!result) {
      console.log('Card not found on battlefield');
      return;
    }

    // Remove from battlefield
    const playerState = this.gameState[owner];
    console.log('Player state:', playerState, 'Owner:', owner);

    if (!playerState) {
      console.error('Player state not found for owner:', owner);
      return;
    }

    for (const zone of ['lands', 'creatures', 'others']) {
      const index = playerState.battlefield[zone].findIndex(c => c.id === cardId);
      if (index !== -1) {
        const card = playerState.battlefield[zone].splice(index, 1)[0];
        playerState.graveyard.push(card);
        console.log('Card moved to graveyard:', card.name);
        this.uiManager.updateAll();
        this.uiManager.showToast(`${card.name} moved to graveyard`, 'info');
        this.removeExistingMenus();
        return;
      }
    }
    console.log('Card not found in any battlefield zone');
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
