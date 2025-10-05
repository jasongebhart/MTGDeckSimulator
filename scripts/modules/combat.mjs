/**
 * Combat System Module
 * Handles combat phases, attackers, blockers, and damage
 */

export class CombatManager {
  constructor(gameState, cardMechanics, uiManager) {
    this.gameState = gameState;
    this.cardMechanics = cardMechanics;
    this.uiManager = uiManager;
  }

  // Initialize combat phase
  initializeCombat() {
    this.gameState.combatState = {
      step: 'beginning-combat',
      attackers: [],
      blockers: [],
      combatDamage: [],
      isSelectingAttackers: false,
      isSelectingBlockers: false
    };

    this.gameState.turnState.phase = 'combat';
    this.gameState.turnState.step = 'beginning-combat';

    this.gameState.addToGameLog('Entering combat phase', 'combat');
    this.uiManager.updateTurnDisplay();
    this.updateCombatUI();
  }

  // Combat step progression
  advanceCombatStep() {
    const steps = ['beginning-combat', 'declare-attackers', 'declare-blockers', 'combat-damage', 'end-combat'];
    const currentIndex = steps.indexOf(this.gameState.combatState.step);

    if (currentIndex < steps.length - 1) {
      this.gameState.combatState.step = steps[currentIndex + 1];
      this.gameState.turnState.step = steps[currentIndex + 1];

      switch (this.gameState.combatState.step) {
        case 'declare-attackers':
          this.startDeclareAttackersStep();
          break;
        case 'declare-blockers':
          this.startDeclareBlockersStep();
          break;
        case 'combat-damage':
          this.startCombatDamageStep();
          break;
        case 'end-combat':
          this.endCombatStep();
          break;
      }
    } else {
      this.endCombat();
    }

    this.uiManager.updateTurnDisplay();
  }

  // Declare Attackers Step
  startDeclareAttackersStep() {
    this.gameState.combatState.isSelectingAttackers = true;
    this.gameState.addToGameLog('Declare attackers', 'combat');
    this.highlightAttackableCreatures();
    this.updateCombatUI();
  }

  highlightAttackableCreatures() {
    const activePlayer = this.gameState.activePlayer;
    const playerState = this.gameState.getPlayerState(activePlayer);

    playerState.battlefield.creatures.forEach(creature => {
      if (!creature.tapped && !creature.summoningSickness) {
        // Add attackable highlight
        const element = document.querySelector(`[data-card-id="${creature.id}"]`);
        if (element) {
          element.classList.add('attackable');
          element.style.cursor = 'pointer';

          // Add click handler for selecting attackers
          const clickHandler = (e) => {
            e.stopPropagation();
            this.toggleAttacker(creature.id);
          };
          element.addEventListener('click', clickHandler);
          element._combatClickHandler = clickHandler; // Store for cleanup
        }
      }
    });
  }

  toggleAttacker(cardId) {
    const activePlayer = this.gameState.activePlayer;
    const playerState = this.gameState.getPlayerState(activePlayer);
    const creature = playerState.battlefield.creatures.find(c => c.id === cardId);

    if (!creature || creature.tapped || creature.summoningSickness) {
      return;
    }

    const attackerIndex = this.gameState.combatState.attackers.findIndex(a => a.cardId === cardId);

    if (attackerIndex >= 0) {
      // Remove from attackers
      this.gameState.combatState.attackers.splice(attackerIndex, 1);
    } else {
      // Add to attackers
      this.gameState.combatState.attackers.push({
        cardId,
        playerId: activePlayer,
        creature
      });
    }

    this.updateAttackerHighlights();
  }

  updateAttackerHighlights() {
    // Clear all attacker highlights
    document.querySelectorAll('.attacking').forEach(el => el.classList.remove('attacking'));

    // Add highlights to current attackers
    this.gameState.combatState.attackers.forEach(attacker => {
      const element = document.querySelector(`[data-card-id="${attacker.cardId}"]`);
      if (element) {
        element.classList.add('attacking');
      }
    });
  }

  finalizeDeclareAttackers() {
    if (this.gameState.combatState.attackers.length === 0) {
      this.uiManager.showToast('No attackers declared, skipping to end of combat', 'info');
      this.endCombat();
      return;
    }

    // Tap all attackers
    this.gameState.combatState.attackers.forEach(attacker => {
      this.cardMechanics.tap(attacker.creature);
    });

    this.gameState.combatState.isSelectingAttackers = false;
    this.clearCombatHighlights();

    const attackerNames = this.gameState.combatState.attackers
      .map(a => a.creature.name)
      .join(', ');

    this.gameState.addToGameLog(
      `Attacking with: ${attackerNames}`,
      'combat'
    );

    this.advanceCombatStep();
  }

  // Declare Blockers Step
  startDeclareBlockersStep() {
    this.gameState.combatState.isSelectingBlockers = true;
    this.gameState.addToGameLog('Declare blockers', 'combat');
    this.highlightBlockableCreatures();
    this.updateCombatUI();
  }

  highlightBlockableCreatures() {
    const defendingPlayer = this.gameState.activePlayer === 'player' ? 'opponent' : 'player';
    const playerState = this.gameState.getPlayerState(defendingPlayer);

    playerState.battlefield.creatures.forEach(creature => {
      if (!creature.tapped) {
        const element = document.querySelector(`[data-card-id="${creature.id}"]`);
        if (element) {
          element.classList.add('can-block');
        }
      }
    });
  }

  // Combat Damage Step
  startCombatDamageStep() {
    this.gameState.addToGameLog('Combat damage', 'combat');
    this.calculateAndApplyCombatDamage();
    this.updateCombatUI();
  }

  calculateAndApplyCombatDamage() {
    const defendingPlayer = this.gameState.activePlayer === 'player' ? 'opponent' : 'player';

    this.gameState.combatState.attackers.forEach(attacker => {
      const blockers = this.gameState.combatState.blockers.filter(
        b => b.attackerCardId === attacker.cardId
      );

      if (blockers.length === 0) {
        // Unblocked attacker deals damage to defending player
        const power = this.getCreaturePower(attacker.creature);
        const defendingState = this.gameState.getPlayerState(defendingPlayer);
        defendingState.gameStats.life -= power;

        this.gameState.addToGameLog(
          `${attacker.creature.name} deals ${power} damage to ${defendingPlayer}`,
          'combat'
        );
      } else {
        // Combat with blockers
        blockers.forEach(blocker => {
          const attackerPower = this.getCreaturePower(attacker.creature);
          const blockerPower = this.getCreaturePower(blocker.creature);
          const attackerToughness = this.getCreatureToughness(attacker.creature);
          const blockerToughness = this.getCreatureToughness(blocker.creature);

          // Assign damage
          attacker.creature.damage = (attacker.creature.damage || 0) + blockerPower;
          blocker.creature.damage = (blocker.creature.damage || 0) + attackerPower;

          this.gameState.addToGameLog(
            `${attacker.creature.name} and ${blocker.creature.name} deal combat damage`,
            'combat'
          );

          // Check for lethal damage
          if (attacker.creature.damage >= attackerToughness) {
            this.destroyCreature(attacker.creature, attacker.playerId);
          }
          if (blocker.creature.damage >= blockerToughness) {
            this.destroyCreature(blocker.creature, blocker.playerId);
          }
        });
      }
    });

    this.uiManager.updateLifeDisplay('player');
    this.uiManager.updateLifeDisplay('opponent');
  }

  getCreaturePower(creature) {
    const pt = this.cardMechanics.getPowerToughness(creature);
    if (!pt) return 0;

    // Handle variable power (like */* or 2+*)
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

      this.gameState.addToGameLog(
        `${creature.name} was destroyed`,
        'combat'
      );
    }
  }

  // End Combat Step
  endCombatStep() {
    this.gameState.addToGameLog('End of combat', 'combat');
    this.clearCombatHighlights();

    // Clear damage from creatures
    ['player', 'opponent'].forEach(playerName => {
      const playerState = this.gameState.getPlayerState(playerName);
      playerState.battlefield.creatures.forEach(creature => {
        creature.damage = 0;
      });
    });

    this.advanceCombatStep();
  }

  endCombat() {
    this.gameState.combatState = {
      step: 'none',
      attackers: [],
      blockers: [],
      combatDamage: [],
      isSelectingAttackers: false,
      isSelectingBlockers: false
    };

    this.gameState.turnState.phase = 'main2';
    this.gameState.turnState.step = 'main';

    this.gameState.addToGameLog('Combat phase ended, entering Main Phase 2', 'phase');
    this.uiManager.updateTurnDisplay();
  }

  // UI Updates
  updateCombatUI() {
    const combatPanel = document.getElementById('combatPanel');
    if (!combatPanel) return;

    if (this.gameState.combatState.step === 'none') {
      combatPanel.style.display = 'none';
      return;
    }

    combatPanel.style.display = 'block';

    const stepNames = {
      'beginning-combat': 'Beginning of Combat',
      'declare-attackers': 'Declare Attackers',
      'declare-blockers': 'Declare Blockers',
      'combat-damage': 'Combat Damage',
      'end-combat': 'End of Combat'
    };

    combatPanel.innerHTML = `
      <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0;">⚔️ ${stepNames[this.gameState.combatState.step]}</h4>
        ${this.renderCombatStepContent()}
        <button class="btn btn-primary mt-3" onclick="window.handSimulator.advanceCombatStep()">
          Continue
        </button>
      </div>
    `;
  }

  renderCombatStepContent() {
    const step = this.gameState.combatState.step;

    if (step === 'declare-attackers' && this.gameState.combatState.isSelectingAttackers) {
      return `
        <p>Click creatures to declare as attackers</p>
        <div class="attackers-list">
          ${this.gameState.combatState.attackers.map(a => `
            <div>${a.creature.name}</div>
          `).join('')}
        </div>
        <button class="btn btn-success" onclick="window.handSimulator.finalizeDeclareAttackers()">
          Confirm Attackers
        </button>
      `;
    }

    if (step === 'declare-blockers' && this.gameState.combatState.isSelectingBlockers) {
      return `
        <p>Click creatures to declare as blockers</p>
        <p>Attacking: ${this.gameState.combatState.attackers.map(a => a.creature.name).join(', ')}</p>
      `;
    }

    return '<p>Priority passes...</p>';
  }

  clearCombatHighlights() {
    document.querySelectorAll('.attackable, .attacking, .can-block, .blocking').forEach(el => {
      el.classList.remove('attackable', 'attacking', 'can-block', 'blocking');
      el.style.cursor = '';

      // Remove combat click handlers
      if (el._combatClickHandler) {
        el.removeEventListener('click', el._combatClickHandler);
        delete el._combatClickHandler;
      }
    });
  }
}
