/**
 * Enhanced Combat System Module
 * A complete overhaul with proper MTG rules, visual feedback, and intuitive UI
 */

export class EnhancedCombatManager {
  constructor(gameState, cardMechanics, uiManager, cardImageService = null) {
    this.gameState = gameState;
    this.cardMechanics = cardMechanics;
    this.uiManager = uiManager;
    this.cardImageService = cardImageService;
    this.combatState = {
      step: 'none',
      attackers: new Map(), // cardId => { creature, blocked: boolean, blockedBy: [] }
      blockers: new Map(), // cardId => { creature, blocking: cardId }
      damageAssignments: new Map(), // attackerId => [{ blockerId, damage }]
      selectedAttacker: null,
      selectedBlocker: null
    };
    this.creatureImages = new Map(); // Cache for creature images
  }

  // ==================== COMBAT INITIALIZATION ====================

  async initializeCombat() {
    this.combatState = {
      step: 'beginning',
      attackers: new Map(),
      blockers: new Map(),
      damageAssignments: new Map(),
      selectedAttacker: null,
      selectedBlocker: null
    };

    this.gameState.turnState.phase = 'combat';
    this.gameState.turnState.step = 'beginning-combat';
    this.gameState.addToGameLog('⚔️ Entering Combat Phase', 'combat');

    // Preload all creature images
    await this.preloadCreatureImages();

    this.showCombatOverlay();
    this.uiManager.updateTurnDisplay();
  }

  async preloadCreatureImages() {
    if (!this.cardImageService) return;

    const allCreatures = [
      ...this.gameState.player.battlefield.creatures,
      ...this.gameState.opponent.battlefield.creatures
    ];

    // Fetch all images and card data in parallel
    await Promise.all(
      allCreatures.map(async (creature) => {
        try {
          // Fetch image URL (which also caches card data)
          const imageUrl = await this.cardImageService.getCardImageUrl(creature.name, 'normal');

          if (imageUrl) {
            this.creatureImages.set(creature.id, imageUrl);
            creature.imageUrl = imageUrl;
          }

          // Fetch full card data from Scryfall to get P/T
          const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(creature.name)}`);
          if (response.ok) {
            const cardData = await response.json();

            // Store P/T data if it's a creature
            if (cardData.power && cardData.toughness) {
              creature.power = cardData.power;
              creature.toughness = cardData.toughness;
              creature.powerToughness = `${cardData.power}/${cardData.toughness}`;
            }

            // Store card text for abilities (only if not already present)
            if (cardData.oracle_text && !creature.text) {
              creature.text = cardData.oracle_text;
            }
          }
        } catch (error) {
          console.warn(`Failed to load data for ${creature.name}:`, error);
        }
      })
    );
  }

  getCreatureImage(creature) {
    return this.creatureImages.get(creature.id) || creature.imageUrl || '';
  }

  // Unified card rendering function for consistent visuals
  renderCreatureCard(creature, options = {}) {
    const {
      role = 'neutral', // 'attacker', 'blocker', 'neutral'
      isAttacker = false,
      isBlocker = false,
      canAttack = false,
      canBlock = false,
      isSelected = false,
      isTapped = false,
      hasSummoningSickness = false,
      isDraggable = false,
      dataAction = '',
      dataCardId = creature.id
    } = options;

    const power = this.getCreaturePower(creature);
    const toughness = this.getCreatureToughness(creature);
    const cardImageUrl = this.getCreatureImage(creature);
    const abilities = this.getAbilityIcons(creature);

    // Determine background gradient based on state
    let bgGradient = '';
    if (!cardImageUrl) {
      if (isAttacker) {
        bgGradient = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
      } else if (isBlocker) {
        bgGradient = 'linear-gradient(135deg, #d63384 0%, #be185d 100%)';
      } else if (canAttack) {
        bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      } else if (canBlock) {
        bgGradient = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      } else {
        bgGradient = 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      }
    }

    // Determine border color
    let borderColor = 'transparent';
    if (isSelected) {
      borderColor = '#fbbf24';
    } else if (isAttacker) {
      borderColor = '#1e40af';
    } else if (isBlocker) {
      borderColor = '#9f1239';
    } else if (role === 'attacker') {
      borderColor = '#3b82f6';
    } else if (role === 'blocker') {
      borderColor = '#d63384';
    }

    // Determine cursor
    let cursor = 'default';
    if (canAttack || canBlock) {
      cursor = 'pointer';
    } else if (isDraggable) {
      cursor = 'grab';
    } else if (!canAttack && !canBlock && (isAttacker || isBlocker || canAttack === false)) {
      cursor = 'not-allowed';
    }

    // Determine opacity
    const opacity = (canAttack || canBlock || isAttacker || isBlocker) ? '1' : '0.6';

    // Determine box shadow
    let boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
    if (canAttack || canBlock) {
      boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
    }

    return `
      <div
        ${dataCardId ? `data-card-id="${dataCardId}"` : ''}
        ${dataAction ? `data-action="${dataAction}"` : ''}
        ${isDraggable ? `draggable="true"` : ''}
        class="combat-creature-card"
        style="
          position: relative;
          background: ${cardImageUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('${cardImageUrl}')` : bgGradient};
          background-size: cover;
          background-position: center 25%;
          color: white;
          border-radius: 8px;
          padding: 12px;
          cursor: ${cursor};
          border: 3px solid ${borderColor};
          opacity: ${opacity};
          transition: all 0.2s;
          box-shadow: ${boxShadow};
          min-height: 160px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
        "
      >
        <!-- Status Icons -->
        <div style="position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; font-size: 18px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
          ${isAttacker ? '⚔️' : ''}
          ${isBlocker ? '🛡️' : ''}
          ${isTapped ? '↻' : ''}
          ${hasSummoningSickness ? '💤' : ''}
        </div>

        <!-- Card Name -->
        <div style="
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 8px;
          padding: 4px 8px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 4px;
          padding-right: 40px;
          line-height: 1.2;
        ">
          ${creature.name}
        </div>

        <!-- Abilities -->
        ${abilities ? `
          <div style="
            font-size: 18px;
            margin: 4px 0;
            min-height: 24px;
            padding: 4px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 4px;
            text-align: center;
          ">
            ${abilities}
          </div>
        ` : '<div style="flex: 1;"></div>'}

        <!-- Power/Toughness Box -->
        <div style="
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.85);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 4px;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 18px;
          min-width: 50px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        ">
          ${power}/${toughness}
        </div>
      </div>
    `;
  }

  // ==================== COMBAT OVERLAY UI ====================

  showCombatOverlay() {
    this.removeCombatOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'combatOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      padding: 20px;
      backdrop-filter: blur(2px);
    `;

    overlay.innerHTML = this.renderCombatUI();
    document.body.appendChild(overlay);

    // Add keyboard shortcuts
    this.setupCombatKeyboardShortcuts();
  }

  renderCombatUI() {
    const stepInfo = this.getStepInfo();

    return `
      <!-- Compact Combat Header -->
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold;">⚔️ Combat</h2>
          <div style="font-size: 13px; opacity: 0.9;">${stepInfo.name}</div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${this.renderCompactStepIndicators()}
          ${this.renderQuickActions()}
        </div>
      </div>

      <!-- Horizontal Combat Layout (Split Screen) -->
      <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; overflow: hidden; background: var(--bg-secondary); padding: 16px;">

        <!-- Left: Active Player's Creatures -->
        <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
          ${this.renderActivePlayerSection()}
        </div>

        <!-- Right: Defending Player's Creatures & Combat Zone -->
        <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
          ${this.renderDefendingPlayerSection()}
          ${this.renderCompactCombatZone()}
        </div>
      </div>
    `;
  }

  getStepInfo() {
    const steps = {
      'beginning': {
        name: 'Beginning of Combat',
        description: 'Priority before attackers are declared. Cast instant-speed spells now.',
        icon: '⚡'
      },
      'declare-attackers': {
        name: 'Declare Attackers',
        description: 'Click your untapped creatures to attack. Tapped/sick creatures cannot attack.',
        icon: '⚔️'
      },
      'attackers-declared': {
        name: 'Priority After Attackers',
        description: 'Priority to cast spells before blockers are declared.',
        icon: '⏸️'
      },
      'declare-blockers': {
        name: 'Declare Blockers',
        description: 'Defender: Click your creatures to block attackers. Multiple blockers allowed.',
        icon: '🛡️'
      },
      'blockers-declared': {
        name: 'Priority After Blockers',
        description: 'Last chance to cast combat tricks before damage.',
        icon: '⏸️'
      },
      'first-strike': {
        name: 'First Strike Damage',
        description: 'First strike and double strike creatures deal damage first.',
        icon: '⚡'
      },
      'regular-damage': {
        name: 'Combat Damage',
        description: 'Regular combat damage is dealt simultaneously.',
        icon: '💥'
      },
      'end-combat': {
        name: 'End of Combat',
        description: 'Combat is ending. Priority for end-of-combat effects.',
        icon: '✓'
      }
    };

    return steps[this.combatState.step] || steps['beginning'];
  }

  renderCompactStepIndicators() {
    const steps = ['beginning', 'declare-attackers', 'declare-blockers', 'regular-damage', 'end-combat'];
    const currentIndex = steps.indexOf(this.combatState.step);
    const emoji = ['⚡', '⚔️', '🛡️', '💥', '✓'][currentIndex];

    return `
      <div style="display: flex; align-items: center; gap: 6px; font-size: 14px;">
        <span style="font-size: 18px;">${emoji}</span>
        <span>${currentIndex + 1}/5</span>
      </div>
    `;
  }

  renderQuickActions() {
    return `
      <div style="display: flex; gap: 8px;">
        ${this.combatState.step === 'declare-attackers' ? `
          <button
            data-action="combat-confirm-attackers"
            class="btn btn-sm"
            style="background: white; color: #dc2626; font-weight: bold; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Confirm (${this.combatState.attackers.size})
          </button>
        ` : ''}
        ${this.combatState.step === 'declare-blockers' ? `
          <button
            data-action="combat-confirm-blockers"
            class="btn btn-sm"
            style="background: white; color: #dc2626; font-weight: bold; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Confirm (${this.combatState.blockers.size})
          </button>
        ` : ''}
        ${this.combatState.step !== 'declare-attackers' && this.combatState.step !== 'declare-blockers' ? `
          <button
            data-action="combat-advance-step"
            class="btn btn-sm"
            style="background: white; color: #dc2626; font-weight: bold; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer;"
          >
            Continue →
          </button>
        ` : ''}
        <button
          data-action="combat-cancel"
          class="btn btn-sm"
          style="background: rgba(255,255,255,0.2); color: white; padding: 6px 12px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; cursor: pointer;"
        >
          Cancel
        </button>
      </div>
    `;
  }

  renderActivePlayerSection() {
    const activePlayer = this.gameState.turnState.activePlayer;
    const activeState = this.gameState.getPlayerState(activePlayer);
    const playerLabel = activePlayer === 'player' ? 'Player 1' : 'Player 2';

    return `
      <div style="background: var(--bg-primary); border: 2px solid #3b82f6; border-radius: 8px; padding: 12px; height: fit-content;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #3b82f6; font-size: 14px; font-weight: bold;">
            ⚔️ ${playerLabel} (Attacking)
          </h3>
          <span style="font-size: 12px; opacity: 0.7;">${this.combatState.attackers.size} attacking</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
          ${this.renderAttackingCreatures(activeState, activePlayer)}
        </div>
      </div>
    `;
  }

  renderDefendingPlayerSection() {
    const activePlayer = this.gameState.turnState.activePlayer;
    const defendingPlayer = activePlayer === 'player' ? 'opponent' : 'player';
    const defendingState = this.gameState.getPlayerState(defendingPlayer);
    const playerLabel = defendingPlayer === 'player' ? 'Player 1' : 'Player 2';

    return `
      <div style="background: var(--bg-primary); border: 2px solid #d63384; border-radius: 8px; padding: 12px; height: fit-content;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #d63384; font-size: 14px; font-weight: bold;">
            🛡️ ${playerLabel} (Defending)
          </h3>
          <span style="font-size: 12px; opacity: 0.7;">${this.combatState.blockers.size} blocking</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
          ${this.renderDefendingCreatures(defendingState, defendingPlayer)}
        </div>
      </div>
    `;
  }

  renderAttackingCreatures(playerState, _owner) {
    if (!playerState.battlefield.creatures || playerState.battlefield.creatures.length === 0) {
      return '<div style="padding: 20px; text-align: center; opacity: 0.5; grid-column: 1/-1;">No creatures available</div>';
    }

    return playerState.battlefield.creatures.map(creature => {
      const isAttacker = this.combatState.attackers.has(creature.id);
      const canAttack = !creature.tapped && !creature.summoningSickness && this.combatState.step === 'declare-attackers';
      const isSelected = this.combatState.selectedAttacker === creature.id;

      return this.renderCreatureCard(creature, {
        isAttacker,
        canAttack,
        isSelected,
        isTapped: creature.tapped,
        hasSummoningSickness: creature.summoningSickness,
        dataAction: 'combat-toggle-attacker',
        dataCardId: creature.id
      });
    }).join('');
  }

  renderDefendingCreatures(playerState, _owner) {
    if (!playerState.battlefield.creatures || playerState.battlefield.creatures.length === 0) {
      return '<div style="padding: 20px; text-align: center; opacity: 0.5; grid-column: 1/-1;">No creatures to block with</div>';
    }

    return playerState.battlefield.creatures.map(creature => {
      const blocker = this.combatState.blockers.get(creature.id);
      const canBlock = !creature.tapped && this.combatState.step === 'declare-blockers';
      const isSelected = this.combatState.selectedBlocker === creature.id;

      return this.renderCreatureCard(creature, {
        isBlocker: !!blocker,
        canBlock,
        isSelected,
        isTapped: creature.tapped,
        isDraggable: canBlock,
        dataAction: 'combat-select-blocker',
        dataCardId: creature.id
      });
    }).join('');
  }

  renderCompactCombatZone() {
    if (this.combatState.attackers.size === 0) {
      return `
        <div style="background: var(--bg-primary); border: 2px dashed var(--border-color); border-radius: 8px; padding: 20px; text-align: center;">
          <div style="opacity: 0.5; font-size: 14px;">⚔️ No attackers declared yet</div>
          ${this.combatState.step === 'declare-attackers' ? '<div style="opacity: 0.5; font-size: 12px; margin-top: 8px;">Click creatures on the left to attack</div>' : ''}
        </div>
      `;
    }

    const entries = Array.from(this.combatState.attackers.entries());
    const canAssignBlockers = this.combatState.step === 'declare-blockers';
    const summary = this.calculateDamageSummary();

    return `
      <div style="background: var(--bg-primary); border: 2px solid #dc2626; border-radius: 8px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; color: #dc2626; font-size: 14px; font-weight: bold;">
            💥 Combat Matchups
          </h3>
          ${this.combatState.step === 'regular-damage' || this.combatState.step === 'end-combat' ? `
            <div style="font-size: 12px; padding: 4px 8px; background: rgba(220, 38, 38, 0.2); border-radius: 4px;">
              ${summary.playerDamage > 0 ? `P1: ${summary.playerDamage} dmg` : ''}
              ${summary.opponentDamage > 0 ? `P2: ${summary.opponentDamage} dmg` : ''}
            </div>
          ` : ''}
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
          ${entries.map(([attackerId, attackerData]) => {
            const blockersList = attackerData.blockedBy || [];

            return `
              <div
                ${canAssignBlockers ? `data-attacker-drop-zone="${attackerId}" data-action="combat-assign-blocker" data-attacker-id="${attackerId}"` : ''}
                class="${canAssignBlockers ? 'combat-drop-zone' : ''}"
                style="
                  background: rgba(255,255,255,0.03);
                  border-radius: 6px;
                  padding: 10px;
                  display: grid;
                  grid-template-columns: 140px auto 140px;
                  align-items: center;
                  gap: 12px;
                  ${canAssignBlockers ? 'cursor: pointer; transition: all 0.2s;' : ''}
                  min-height: 180px;
                "
              >
                <!-- Attacker Card -->
                ${this.renderCombatZoneCard(attackerData.creature, 'attacker')}

                <!-- Arrow -->
                <div style="font-size: 28px; color: #dc2626; text-align: center; font-weight: bold;">→</div>

                <!-- Blockers or Direct Damage -->
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${blockersList.length > 0 ? blockersList.map(blockerId => {
                    const blocker = this.findCreatureById(blockerId);
                    return blocker ? this.renderCombatZoneCard(blocker, 'blocker') : '';
                  }).join('') : `
                    <div style="
                      background: rgba(220, 38, 38, 0.2);
                      padding: 16px;
                      border-radius: 8px;
                      border: 2px dashed #dc2626;
                      text-align: center;
                      min-height: 160px;
                      display: flex;
                      flex-direction: column;
                      justify-content: center;
                      align-items: center;
                    ">
                      <div style="font-weight: 700; font-size: 16px; margin-bottom: 8px;">💥 Direct Damage</div>
                      <div style="font-size: 32px; font-weight: bold; color: #fca5a5;">${this.getCreaturePower(attackerData.creature)}</div>
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${canAssignBlockers ? `
          <div style="margin-top: 10px; padding: 8px; background: rgba(251, 191, 36, 0.1); border-radius: 4px; font-size: 11px; text-align: center; opacity: 0.8;">
            💡 Drag defenders onto attackers or click to assign
          </div>
        ` : ''}
      </div>
    `;
  }

  renderCombatZoneCard(creature, role) {
    return this.renderCreatureCard(creature, {
      role,
      isAttacker: role === 'attacker',
      isBlocker: role === 'blocker'
    });
  }


  // ==================== COMBAT LOGIC ====================

  toggleAttacker(cardId) {
    if (this.combatState.step !== 'declare-attackers') return;

    const activePlayer = this.gameState.turnState.activePlayer;
    const playerState = this.gameState.getPlayerState(activePlayer);
    const creature = playerState.battlefield.creatures.find(c => c.id === cardId);

    if (!creature || creature.tapped || creature.summoningSickness) {
      this.uiManager.showToast('This creature cannot attack', 'warning');
      return;
    }

    if (this.combatState.attackers.has(cardId)) {
      // Remove from attackers
      this.combatState.attackers.delete(cardId);
      this.gameState.addToGameLog(`${creature.name} removed from combat`, 'combat');
    } else {
      // Add to attackers
      this.combatState.attackers.set(cardId, {
        creature,
        blocked: false,
        blockedBy: []
      });
      this.gameState.addToGameLog(`${creature.name} declared as attacker`, 'combat');
    }

    this.showCombatOverlay();
  }

  // Handle attacker click during blocking phase
  handleAttackerClick(attackerId) {
    if (this.combatState.step === 'declare-blockers' && this.combatState.selectedBlocker) {
      this.assignBlocker(attackerId);
    }
  }

  selectBlocker(blockerId) {
    if (this.combatState.step !== 'declare-blockers') return;

    const defendingPlayer = this.gameState.turnState.activePlayer === 'player' ? 'opponent' : 'player';
    const playerState = this.gameState.getPlayerState(defendingPlayer);
    const creature = playerState.battlefield.creatures.find(c => c.id === blockerId);

    if (!creature || creature.tapped) {
      this.uiManager.showToast('This creature cannot block', 'warning');
      return;
    }

    // If already selected, deselect
    if (this.combatState.selectedBlocker === blockerId) {
      this.combatState.selectedBlocker = null;
    } else {
      // Select this blocker - waiting for attacker to be clicked
      this.combatState.selectedBlocker = blockerId;
    }

    this.showCombatOverlay();
  }

  assignBlocker(attackerId) {
    if (!this.combatState.selectedBlocker) return;

    const blockerId = this.combatState.selectedBlocker;
    const defendingPlayer = this.gameState.turnState.activePlayer === 'player' ? 'opponent' : 'player';
    const blocker = this.gameState.getPlayerState(defendingPlayer).battlefield.creatures.find(c => c.id === blockerId);
    const attackerData = this.combatState.attackers.get(attackerId);

    if (!blocker || !attackerData) return;

    // Check if this blocker is already blocking this attacker
    const alreadyBlocking = attackerData.blockedBy.includes(blockerId);

    if (alreadyBlocking) {
      // Remove the block
      attackerData.blockedBy = attackerData.blockedBy.filter(id => id !== blockerId);
      this.combatState.blockers.delete(blockerId);
      this.gameState.addToGameLog(`${blocker.name} no longer blocking ${attackerData.creature.name}`, 'combat');
    } else {
      // Check if blocker can block this attacker (flying/reach rules)
      if (!this.canBlock(blocker, attackerData.creature)) {
        this.uiManager.showToast(`${blocker.name} cannot block ${attackerData.creature.name} (flying)`, 'warning');
        return;
      }

      // Add the block
      attackerData.blockedBy.push(blockerId);
      this.combatState.blockers.set(blockerId, {
        creature: blocker,
        blocking: attackerId
      });
      this.gameState.addToGameLog(`${blocker.name} blocks ${attackerData.creature.name}`, 'combat');
    }

    // Update attacker's blocked status
    attackerData.blocked = attackerData.blockedBy.length > 0;

    // Clear selection
    this.combatState.selectedBlocker = null;
    this.showCombatOverlay();
  }

  finalizeDeclareAttackers() {
    if (this.combatState.attackers.size === 0) {
      this.uiManager.showToast('No attackers declared, ending combat', 'info');
      this.cancelCombat();
      return;
    }

    // Tap all attackers (except those with vigilance)
    this.combatState.attackers.forEach((data, _cardId) => {
      if (!this.hasVigilance(data.creature)) {
        this.cardMechanics.tap(data.creature);
      }
    });

    const attackerNames = Array.from(this.combatState.attackers.values())
      .map(a => a.creature.name)
      .join(', ');

    this.gameState.addToGameLog(`⚔️ Attacking with: ${attackerNames}`, 'combat');

    this.combatState.step = 'declare-blockers';
    this.showCombatOverlay();
    this.uiManager.updateAll();
  }

  finalizeDeclareBlockers() {
    const blockerNames = Array.from(this.combatState.blockers.values())
      .map(b => `${b.creature.name} blocks ${this.combatState.attackers.get(b.blocking)?.creature.name}`)
      .join(', ');

    if (blockerNames) {
      this.gameState.addToGameLog(`🛡️ Blockers: ${blockerNames}`, 'combat');
    } else {
      this.gameState.addToGameLog('No blockers declared', 'combat');
    }

    this.combatState.step = 'regular-damage';
    this.showCombatOverlay();
  }

  advanceCombatStep() {
    if (this.combatState.step === 'beginning') {
      this.combatState.step = 'declare-attackers';
    } else if (this.combatState.step === 'regular-damage') {
      this.resolveCombatDamage();
      this.combatState.step = 'end-combat';
    } else if (this.combatState.step === 'end-combat') {
      this.endCombat();
      return;
    }

    this.showCombatOverlay();
  }

  resolveCombatDamage() {
    const defendingPlayer = this.gameState.turnState.activePlayer === 'player' ? 'opponent' : 'player';
    const defendingState = this.gameState.getPlayerState(defendingPlayer);
    const creaturesToDestroy = [];

    this.combatState.attackers.forEach((attackerData, _attackerId) => {
      const attacker = attackerData.creature;
      const attackerPower = this.getCreaturePower(attacker);
      const attackerToughness = this.getCreatureToughness(attacker);
      const attackerHasDeathtouch = this.hasDeathtouch(attacker);
      const attackerHasTrample = this.hasTrample(attacker);

      if (attackerData.blockedBy.length === 0) {
        // Unblocked - damage to player
        defendingState.gameStats.life -= attackerPower;
        this.gameState.addToGameLog(`${attacker.name} deals ${attackerPower} damage to ${defendingPlayer}`, 'combat');
      } else {
        // Blocked - damage to blockers
        let totalBlockerToughness = 0;
        const blockers = [];

        // Calculate total blocker toughness for trample
        attackerData.blockedBy.forEach(blockerId => {
          const blockerData = this.combatState.blockers.get(blockerId);
          if (!blockerData) return;
          const blocker = blockerData.creature;
          const blockerToughness = this.getCreatureToughness(blocker);
          totalBlockerToughness += blockerToughness;
          blockers.push({ blocker, blockerData });
        });

        // Deal damage to blockers
        blockers.forEach(({ blocker, blockerData }) => {
          const blockerPower = this.getCreaturePower(blocker);
          const blockerToughness = this.getCreatureToughness(blocker);
          const blockerHasDeathtouch = this.hasDeathtouch(blocker);

          // Deal damage
          this.gameState.addToGameLog(
            `${attacker.name} (${attackerPower}) and ${blocker.name} (${blockerPower}) deal combat damage`,
            'combat'
          );

          // Check for lethal damage
          // Deathtouch: any amount of damage is lethal
          if (blockerHasDeathtouch || blockerPower >= attackerToughness) {
            creaturesToDestroy.push({ creature: attacker, owner: this.gameState.turnState.activePlayer });
          }
          if (attackerHasDeathtouch || attackerPower >= blockerToughness) {
            creaturesToDestroy.push({ creature: blocker, owner: defendingPlayer });
          }
        });

        // Trample: excess damage tramples over to defending player
        if (attackerHasTrample && attackerPower > totalBlockerToughness) {
          const trampleDamage = attackerPower - totalBlockerToughness;
          defendingState.gameStats.life -= trampleDamage;
          this.gameState.addToGameLog(
            `${attacker.name} tramples for ${trampleDamage} damage to ${defendingPlayer}`,
            'combat'
          );
        }
      }
    });

    // Destroy creatures with lethal damage
    creaturesToDestroy.forEach(({ creature, owner }) => {
      this.destroyCreature(creature, owner);
    });

    this.uiManager.updateLifeDisplay('player');
    this.uiManager.updateLifeDisplay('opponent');
    this.uiManager.updateAll();
  }

  calculateDamageSummary() {
    const defendingPlayer = this.gameState.turnState.activePlayer === 'player' ? 'opponent' : 'player';
    const summary = {
      playerDamage: 0,
      opponentDamage: 0,
      creaturesDestroyed: []
    };

    this.combatState.attackers.forEach((attackerData, _attackerId) => {
      const attacker = attackerData.creature;
      const attackerPower = this.getCreaturePower(attacker);
      const attackerToughness = this.getCreatureToughness(attacker);

      if (attackerData.blockedBy.length === 0) {
        // Unblocked damage
        if (defendingPlayer === 'player') {
          summary.playerDamage += attackerPower;
        } else {
          summary.opponentDamage += attackerPower;
        }
      } else {
        // Check for creature deaths
        attackerData.blockedBy.forEach(blockerId => {
          const blockerData = this.combatState.blockers.get(blockerId);
          if (!blockerData) return;

          const blocker = blockerData.creature;
          const blockerPower = this.getCreaturePower(blocker);
          const blockerToughness = this.getCreatureToughness(blocker);

          if (blockerPower >= attackerToughness) {
            summary.creaturesDestroyed.push(attacker.name);
          }
          if (attackerPower >= blockerToughness) {
            summary.creaturesDestroyed.push(blocker.name);
          }
        });
      }
    });

    return summary;
  }

  getCreaturePower(creature) {
    // Try card mechanics method first
    const pt = this.cardMechanics.getPowerToughness(creature);
    if (pt && pt.power) {
      if (pt.power.includes('*')) return 0;
      if (pt.power.includes('+')) {
        const parts = pt.power.split('+');
        return parseInt(parts[0]) || 0;
      }
      return parseInt(pt.power) || 0;
    }

    // Fallback: check for power property directly
    if (creature.power !== undefined) {
      return parseInt(creature.power) || 0;
    }

    // Default for unknown creatures
    return 2;
  }

  getCreatureToughness(creature) {
    // Try card mechanics method first
    const pt = this.cardMechanics.getPowerToughness(creature);
    if (pt && pt.toughness) {
      if (pt.toughness.includes('*')) return 1;
      if (pt.toughness.includes('+')) {
        const parts = pt.toughness.split('+');
        return parseInt(parts[0]) || 1;
      }
      return parseInt(pt.toughness) || 1;
    }

    // Fallback: check for toughness property directly
    if (creature.toughness !== undefined) {
      return parseInt(creature.toughness) || 1;
    }

    // Default for unknown creatures
    return 2;
  }

  destroyCreature(creature, owner) {
    const playerState = this.gameState.getPlayerState(owner);
    const index = playerState.battlefield.creatures.findIndex(c => c.id === creature.id);

    if (index >= 0) {
      const destroyed = playerState.battlefield.creatures.splice(index, 1)[0];
      playerState.graveyard.push(destroyed);
      this.onGraveyardChange(); // Update Tarmogoyf stats
      this.gameState.addToGameLog(`${creature.name} was destroyed`, 'combat');
    }
  }

  findCreatureById(cardId) {
    for (const player of ['player', 'opponent']) {
      const state = this.gameState.getPlayerState(player);
      const creature = state.battlefield.creatures.find(c => c.id === cardId);
      if (creature) return creature;
    }
    return null;
  }

  // ==================== COMBAT ABILITIES ====================

  hasFlying(creature) {
    return this.cardMechanics.hasAbility(creature, 'flying');
  }

  hasReach(creature) {
    return this.cardMechanics.hasAbility(creature, 'reach');
  }

  hasTrample(creature) {
    return this.cardMechanics.hasAbility(creature, 'trample');
  }

  hasFirstStrike(creature) {
    return this.cardMechanics.hasAbility(creature, 'first strike');
  }

  hasDoubleStrike(creature) {
    return this.cardMechanics.hasAbility(creature, 'double strike');
  }

  hasDeathtouch(creature) {
    return this.cardMechanics.hasAbility(creature, 'deathtouch');
  }

  hasVigilance(creature) {
    return this.cardMechanics.hasAbility(creature, 'vigilance');
  }

  canBlock(blocker, attacker) {
    // Flying can only be blocked by flying or reach
    if (this.hasFlying(attacker)) {
      return this.hasFlying(blocker) || this.hasReach(blocker);
    }
    return true;
  }

  getAbilityIcons(creature) {
    const icons = [];
    if (this.hasFlying(creature)) icons.push('🪽');
    if (this.hasReach(creature)) icons.push('🎯');
    if (this.hasTrample(creature)) icons.push('🦏');
    if (this.hasFirstStrike(creature)) icons.push('⚡');
    if (this.hasDoubleStrike(creature)) icons.push('⚡⚡');
    if (this.hasDeathtouch(creature)) icons.push('💀');
    if (this.hasVigilance(creature)) icons.push('👁️');
    return icons.join(' ');
  }

  cancelCombat() {
    this.removeCombatOverlay();
    this.endCombat();
  }

  endCombat() {
    // Untap all creatures (they'll untap during untap step anyway)
    this.combatState = {
      step: 'none',
      attackers: new Map(),
      blockers: new Map(),
      damageAssignments: new Map(),
      selectedAttacker: null,
      selectedBlocker: null
    };

    this.gameState.turnState.phase = 'main2';
    this.gameState.turnState.step = 'main';
    this.gameState.addToGameLog('Combat ended, entering Main Phase 2', 'phase');

    this.removeCombatOverlay();
    this.uiManager.updateTurnDisplay();
    this.uiManager.updateAll();
  }

  removeCombatOverlay() {
    document.getElementById('combatOverlay')?.remove();
  }

  setupCombatKeyboardShortcuts() {
    const handler = (e) => {
      if (e.key === 'Escape') {
        this.cancelCombat();
        document.removeEventListener('keydown', handler);
      } else if (e.key === 'Enter') {
        if (this.combatState.step === 'declare-attackers') {
          this.finalizeDeclareAttackers();
        } else if (this.combatState.step === 'declare-blockers') {
          this.finalizeDeclareBlockers();
        } else {
          this.advanceCombatStep();
        }
      }
    };
    document.addEventListener('keydown', handler);
  }
}
