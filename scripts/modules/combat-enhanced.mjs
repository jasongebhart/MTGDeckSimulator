/**
 * Enhanced Combat System Module
 * A complete overhaul with proper MTG rules, visual feedback, and intuitive UI
 */

export class EnhancedCombatManager {
  constructor(gameState, cardMechanics, uiManager) {
    this.gameState = gameState;
    this.cardMechanics = cardMechanics;
    this.uiManager = uiManager;
    this.combatState = {
      step: 'none',
      attackers: new Map(), // cardId => { creature, blocked: boolean, blockedBy: [] }
      blockers: new Map(), // cardId => { creature, blocking: cardId }
      damageAssignments: new Map(), // attackerId => [{ blockerId, damage }]
      selectedAttacker: null,
      selectedBlocker: null
    };
  }

  // ==================== COMBAT INITIALIZATION ====================

  initializeCombat() {
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

    this.showCombatOverlay();
    this.uiManager.updateTurnDisplay();
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
      <!-- Combat Header -->
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 16px 24px; border-radius: 12px 12px 0 0; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0; font-size: 24px; font-weight: bold;">⚔️ Combat Phase</h2>
            <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 14px;">${stepInfo.description}</p>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            ${this.renderStepIndicators()}
          </div>
        </div>
      </div>

      <!-- Combat Main Area -->
      <div style="flex: 1; display: grid; grid-template-columns: 1fr 400px; gap: 20px; overflow: hidden; background: var(--bg-secondary); padding: 20px; border-radius: 0 0 12px 12px;">

        <!-- Battlefield View -->
        <div style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto;">
          ${this.renderBattlefieldSection()}
        </div>

        <!-- Combat Control Panel -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${this.renderControlPanel()}
          ${this.renderActionButtons()}
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

  renderStepIndicators() {
    const steps = ['beginning', 'declare-attackers', 'declare-blockers', 'regular-damage', 'end-combat'];
    const currentIndex = steps.indexOf(this.combatState.step);

    return steps.map((step, index) => {
      const isActive = index === currentIndex;
      const isPast = index < currentIndex;
      const emoji = ['⚡', '⚔️', '🛡️', '💥', '✓'][index];

      return `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${isActive ? '#fff' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'};
          color: ${isActive ? '#dc2626' : '#fff'};
          font-size: 20px;
          border: 2px solid ${isActive ? '#fff' : 'transparent'};
          opacity: ${isPast ? '0.5' : '1'};
        ">
          ${emoji}
        </div>
      `;
    }).join('');
  }

  renderBattlefieldSection() {
    const activePlayer = this.gameState.turnState.activePlayer;
    const defendingPlayer = activePlayer === 'player' ? 'opponent' : 'player';
    const activeState = this.gameState.getPlayerState(activePlayer);
    const defendingState = this.gameState.getPlayerState(defendingPlayer);

    return `
      <!-- Defending Player's Creatures -->
      <div style="background: rgba(214, 51, 132, 0.1); border: 2px solid #d63384; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px 0; color: #d63384; font-size: 16px;">
          🛡️ ${defendingPlayer === 'player' ? 'Your' : "Opponent's"} Defenders
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 80px;">
          ${this.renderDefendingCreatures(defendingState, defendingPlayer)}
        </div>
      </div>

      <!-- Combat Zone (Attackers with Blockers) -->
      <div style="background: linear-gradient(to bottom, rgba(220, 38, 38, 0.1), rgba(153, 27, 27, 0.1)); border: 2px solid #dc2626; border-radius: 8px; padding: 16px; flex: 1;">
        <h3 style="margin: 0 0 12px 0; color: #dc2626; font-size: 16px;">
          ⚔️ Combat Zone
        </h3>
        <div style="display: flex; flex-direction: column; gap: 16px; min-height: 120px;">
          ${this.renderCombatZone()}
        </div>
      </div>

      <!-- Attacking Player's Creatures -->
      <div style="background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 8px; padding: 16px;">
        <h3 style="margin: 0 0 12px 0; color: #3b82f6; font-size: 16px;">
          ⚔️ ${activePlayer === 'player' ? 'Your' : "Opponent's"} Attackers
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 80px;">
          ${this.renderAttackingCreatures(activeState, activePlayer)}
        </div>
      </div>
    `;
  }

  renderAttackingCreatures(playerState, _owner) {
    if (!playerState.battlefield.creatures || playerState.battlefield.creatures.length === 0) {
      return '<p style="opacity: 0.5; margin: 0;">No creatures available</p>';
    }

    return playerState.battlefield.creatures.map(creature => {
      const isAttacker = this.combatState.attackers.has(creature.id);
      const canAttack = !creature.tapped && !creature.summoningSickness && this.combatState.step === 'declare-attackers';
      const pt = this.cardMechanics.getPowerToughness(creature);
      const isSelected = this.combatState.selectedAttacker === creature.id;

      return `
        <div
          data-card-id="${creature.id}"
          onclick="window.handSimulator.combatManager.toggleAttacker('${creature.id}')"
          style="
            position: relative;
            padding: 8px 12px;
            border-radius: 6px;
            background: ${isAttacker ? '#3b82f6' : canAttack ? '#10b981' : '#6b7280'};
            color: white;
            cursor: ${canAttack ? 'pointer' : 'not-allowed'};
            border: 3px solid ${isSelected ? '#fbbf24' : 'transparent'};
            opacity: ${canAttack || isAttacker ? '1' : '0.5'};
            transition: all 0.2s;
            ${canAttack ? 'box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);' : ''}
          "
        >
          <div style="font-weight: bold; font-size: 14px;">${creature.name}</div>
          <div style="font-size: 12px; opacity: 0.9;">${pt ? `${pt.power}/${pt.toughness}` : ''}</div>
          ${creature.tapped ? '<div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">↻</div>' : ''}
          ${creature.summoningSickness ? '<div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">💤</div>' : ''}
          ${isAttacker ? '<div style="position: absolute; top: 4px; left: 4px; font-size: 12px;">⚔️</div>' : ''}
        </div>
      `;
    }).join('');
  }

  renderDefendingCreatures(playerState, _owner) {
    if (!playerState.battlefield.creatures || playerState.battlefield.creatures.length === 0) {
      return '<p style="opacity: 0.5; margin: 0;">No creatures to block with</p>';
    }

    return playerState.battlefield.creatures.map(creature => {
      const blocker = this.combatState.blockers.get(creature.id);
      const canBlock = !creature.tapped && this.combatState.step === 'declare-blockers';
      const pt = this.cardMechanics.getPowerToughness(creature);
      const isSelected = this.combatState.selectedBlocker === creature.id;

      return `
        <div
          data-card-id="${creature.id}"
          onclick="window.handSimulator.combatManager.selectBlocker('${creature.id}')"
          style="
            position: relative;
            padding: 8px 12px;
            border-radius: 6px;
            background: ${blocker ? '#d63384' : canBlock ? '#10b981' : '#6b7280'};
            color: white;
            cursor: ${canBlock ? 'pointer' : 'not-allowed'};
            border: 3px solid ${isSelected ? '#fbbf24' : 'transparent'};
            opacity: ${canBlock || blocker ? '1' : '0.5'};
            transition: all 0.2s;
          "
        >
          <div style="font-weight: bold; font-size: 14px;">${creature.name}</div>
          <div style="font-size: 12px; opacity: 0.9;">${pt ? `${pt.power}/${pt.toughness}` : ''}</div>
          ${blocker ? '<div style="position: absolute; top: 4px; left: 4px; font-size: 12px;">🛡️</div>' : ''}
          ${creature.tapped ? '<div style="position: absolute; top: 4px; right: 4px; font-size: 10px;">↻</div>' : ''}
        </div>
      `;
    }).join('');
  }

  renderCombatZone() {
    if (this.combatState.attackers.size === 0) {
      return '<p style="opacity: 0.5; text-align: center; margin: 40px 0;">No attackers declared yet</p>';
    }

    const entries = Array.from(this.combatState.attackers.entries());
    const canAssignBlockers = this.combatState.step === 'declare-blockers' && this.combatState.selectedBlocker;

    return entries.map(([attackerId, attackerData]) => {
      const blockersList = attackerData.blockedBy || [];
      const pt = this.cardMechanics.getPowerToughness(attackerData.creature);

      return `
        <div style="background: rgba(255,255,255,0.05); border-radius: 6px; padding: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Attacker -->
            <div
              ${canAssignBlockers ? `onclick="window.handSimulator.combatManager.handleAttackerClick('${attackerId}')"` : ''}
              style="flex: 1; background: rgba(59, 130, 246, 0.2); padding: 8px; border-radius: 4px; border-left: 3px solid #3b82f6; ${canAssignBlockers ? 'cursor: pointer; transition: all 0.2s;' : ''}"
              ${canAssignBlockers ? 'onmouseenter="this.style.background=\'rgba(59, 130, 246, 0.4)\'" onmouseleave="this.style.background=\'rgba(59, 130, 246, 0.2)\'"' : ''}
            >
              <div style="font-weight: bold;">${attackerData.creature.name}</div>
              <div style="font-size: 12px; opacity: 0.8;">${pt ? `${pt.power}/${pt.toughness}` : ''}</div>
            </div>

            <!-- Arrow -->
            <div style="font-size: 24px; color: #dc2626;">→</div>

            <!-- Blockers or Direct Damage -->
            <div style="flex: 1;">
              ${blockersList.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  ${blockersList.map(blockerId => {
                    const blocker = this.findCreatureById(blockerId);
                    const blockerPt = blocker ? this.cardMechanics.getPowerToughness(blocker) : null;
                    return `
                      <div style="background: rgba(214, 51, 132, 0.2); padding: 6px; border-radius: 4px; border-left: 3px solid #d63384;">
                        <div style="font-weight: bold; font-size: 13px;">${blocker ? blocker.name : 'Unknown'}</div>
                        <div style="font-size: 11px; opacity: 0.8;">${blockerPt ? `${blockerPt.power}/${blockerPt.toughness}` : ''}</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              ` : `
                <div style="background: rgba(220, 38, 38, 0.2); padding: 8px; border-radius: 4px; text-align: center; border: 2px dashed #dc2626;">
                  <div style="font-weight: bold;">Unblocked!</div>
                  <div style="font-size: 12px; opacity: 0.8;">${pt ? pt.power : '?'} damage to player</div>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderControlPanel() {
    const attackerCount = this.combatState.attackers.size;
    const blockerCount = this.combatState.blockers.size;

    return `
      <div style="background: var(--bg-primary); border-radius: 8px; padding: 16px; border: 1px solid var(--border-color);">
        <h4 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; opacity: 0.7;">Combat Summary</h4>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 4px;">
            <span>⚔️ Attackers:</span>
            <span style="font-weight: bold;">${attackerCount}</span>
          </div>

          <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(214, 51, 132, 0.1); border-radius: 4px;">
            <span>🛡️ Blockers:</span>
            <span style="font-weight: bold;">${blockerCount}</span>
          </div>

          ${this.renderDamageSummary()}
        </div>

        ${this.combatState.step === 'declare-blockers' && this.combatState.selectedBlocker ? `
          <div style="margin-top: 16px; padding: 12px; background: rgba(251, 191, 36, 0.1); border-radius: 6px; border: 2px solid #fbbf24;">
            <div style="font-weight: bold; margin-bottom: 8px;">Selected Blocker: ${this.findCreatureById(this.combatState.selectedBlocker)?.name}</div>
            <div style="font-size: 13px; opacity: 0.8;">Click an attacker to assign this blocker</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderDamageSummary() {
    if (this.combatState.step !== 'regular-damage' && this.combatState.step !== 'end-combat') {
      return '';
    }

    const summary = this.calculateDamageSummary();

    return `
      <div style="margin-top: 12px; padding: 12px; background: rgba(220, 38, 38, 0.1); border-radius: 6px; border-left: 3px solid #dc2626;">
        <div style="font-weight: bold; margin-bottom: 8px;">💥 Damage Summary:</div>
        ${summary.playerDamage > 0 ? `<div>Player takes: ${summary.playerDamage} damage</div>` : ''}
        ${summary.opponentDamage > 0 ? `<div>Opponent takes: ${summary.opponentDamage} damage</div>` : ''}
        ${summary.creaturesDestroyed.length > 0 ? `
          <div style="margin-top: 8px;">
            <div style="font-size: 12px; opacity: 0.8;">Creatures destroyed:</div>
            ${summary.creaturesDestroyed.map(c => `<div style="font-size: 12px;">• ${c}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderActionButtons() {
    const stepInfo = this.getStepInfo();

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${this.combatState.step === 'declare-attackers' ? `
          <button
            onclick="window.handSimulator.combatManager.finalizeDeclareAttackers()"
            class="btn btn-lg"
            style="background: #dc2626; color: white; font-weight: bold; padding: 16px;"
          >
            ✓ Confirm Attackers (${this.combatState.attackers.size})
          </button>
        ` : ''}

        ${this.combatState.step === 'declare-blockers' ? `
          <button
            onclick="window.handSimulator.combatManager.finalizeDeclareBlockers()"
            class="btn btn-lg"
            style="background: #d63384; color: white; font-weight: bold; padding: 16px;"
          >
            ✓ Confirm Blockers (${this.combatState.blockers.size})
          </button>
        ` : ''}

        ${this.combatState.step !== 'declare-attackers' && this.combatState.step !== 'declare-blockers' ? `
          <button
            onclick="window.handSimulator.combatManager.advanceCombatStep()"
            class="btn btn-lg btn-primary"
            style="padding: 16px; font-weight: bold;"
          >
            Continue ➜
          </button>
        ` : ''}

        <button
          onclick="window.handSimulator.combatManager.cancelCombat()"
          class="btn btn-secondary"
          style="padding: 12px;"
        >
          Cancel Combat
        </button>

        <div style="margin-top: 8px; padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; font-size: 12px;">
          <div style="font-weight: bold; margin-bottom: 4px;">💡 Tips:</div>
          <div>${stepInfo.description}</div>
        </div>
      </div>
    `;
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

    // Tap all attackers
    this.combatState.attackers.forEach((data, _cardId) => {
      this.cardMechanics.tap(data.creature);
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

      if (attackerData.blockedBy.length === 0) {
        // Unblocked - damage to player
        defendingState.gameStats.life -= attackerPower;
        this.gameState.addToGameLog(`${attacker.name} deals ${attackerPower} damage to ${defendingPlayer}`, 'combat');
      } else {
        // Blocked - damage to blockers
        attackerData.blockedBy.forEach(blockerId => {
          const blockerData = this.combatState.blockers.get(blockerId);
          if (!blockerData) return;

          const blocker = blockerData.creature;
          const blockerPower = this.getCreaturePower(blocker);
          const blockerToughness = this.getCreatureToughness(blocker);

          // Deal damage
          this.gameState.addToGameLog(
            `${attacker.name} (${attackerPower}) and ${blocker.name} (${blockerPower}) deal combat damage`,
            'combat'
          );

          // Check for lethal damage
          if (blockerPower >= attackerToughness) {
            creaturesToDestroy.push({ creature: attacker, owner: this.gameState.turnState.activePlayer });
          }
          if (attackerPower >= blockerToughness) {
            creaturesToDestroy.push({ creature: blocker, owner: defendingPlayer });
          }
        });
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
    const pt = this.cardMechanics.getPowerToughness(creature);
    if (!pt) return 0;
    if (pt.power.includes('*')) return 0;
    if (pt.power.includes('+')) {
      const parts = pt.power.split('+');
      return parseInt(parts[0]) || 0;
    }
    return parseInt(pt.power) || 0;
  }

  getCreatureToughness(creature) {
    const pt = this.cardMechanics.getPowerToughness(creature);
    if (!pt) return 1;
    if (pt.toughness.includes('*')) return 1;
    if (pt.toughness.includes('+')) {
      const parts = pt.toughness.split('+');
      return parseInt(parts[0]) || 1;
    }
    return parseInt(pt.toughness) || 1;
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
