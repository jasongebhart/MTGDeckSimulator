# Opponent Feature Parity Status

## Overview
This document tracks which features are available for the opponent vs. the player.

## ✅ Features Available for Opponent

### Basic Gameplay
- ✅ Deck loading (XML files)
- ✅ Default deck setting (⭐ marked in selector)
- ✅ Library shuffling
- ✅ Drawing cards (individual and hand of 7)
- ✅ Mulligan
- ✅ Hand display (face-up, can be hidden in future)
- ✅ Battlefield zones (lands, creatures, others)
- ✅ Graveyard
- ✅ Exile zone
- ✅ Life total management (+/- buttons)
- ✅ Game stats tracking (cards drawn, lands played, spells cast)
- ✅ Mana pool
- ✅ Turn management
- ✅ Hand count display
- ✅ Library count display
- ✅ Graveyard count display
- ✅ Exile count display

### Advanced Features
- ✅ Card movement (hand → battlefield, graveyard, exile, library)
- ✅ Playing cards to battlefield
- ✅ Recently drawn card highlighting
- ✅ Fetchland auto-activation (when playing lands)

## ⚠️ Features NOT Yet Available for Opponent

### Library Manipulation
- ❌ **Ponder modal** - Player can reorder top 3, opponent cannot
- ❌ **Brainstorm modal** - Player can put 2 back, opponent cannot
- ❌ **Scry modal** - Player can scry, opponent cannot
- ❌ **Surveil modal** - Player can surveil, opponent cannot
- ❌ **Library viewing modal** - Player can view full library, opponent cannot

### Triggered Abilities
- ❌ **Delver of Secrets** - Player gets reveal modal, opponent doesn't
- ❌ **Dragon's Rage Channeler** - Player gets surveil modal, opponent doesn't
- ❌ **Other triggered abilities** - Most special card abilities only work for player

### Advanced Card Mechanics
- ❌ **Manual fetchland activation** - Player can right-click to fetch, opponent cannot
- ❌ **Token creation** - Neither player has this yet, but UI only exists for player
- ❌ **Counter management** - Limited support for opponent
- ❌ **DFC transformation** - Works for player, needs testing for opponent

### UI Interactions
- ❌ **Card preview on hover** - Player cards show preview, opponent limited
- ❌ **Context menus** - Player cards have right-click menus, opponent limited
- ❌ **Hand sorting** - Player can sort hand, opponent cannot
- ❌ **Zone modal viewing** - Player can view graveyard/exile in modal, opponent cannot

## 🔧 Implementation Notes

### Why Some Features Are Player-Only

1. **Modal Interfaces** - Most library manipulation modals (Ponder, Brainstorm, etc.) are in `library-modals.mjs` and only reference `this.gameState.player`
   - Need to update to accept a `playerName` parameter
   - Need to call with either 'player' or 'opponent'

2. **Triggered Abilities** - `triggered-abilities.mjs` module only checks player battlefield
   - `checkDelverTriggers()` only looks at player's Delver
   - Need to extend to check opponent's battlefield too

3. **Fetchlands** - `fetchlands.mjs` module uses `getCurrentPlayer()` which respects turn state
   - ✅ Actually works for opponent if it's their turn
   - ❌ Manual activation (right-click) not wired up for opponent cards

4. **Hand Sorting** - `sortHand()` method only sorts player hand
   - Need `sortOpponentHand()` method
   - Need UI button for opponent

### How to Add Opponent Support to a Feature

**Example: Adding Ponder for Opponent**

```javascript
// Current implementation (player-only)
ponder() {
  this.showPonderInterface(3, 'Ponder', {
    canShuffle: true,
    drawAfter: 1,
    description: '...'
  });
}

// Updated implementation (both players)
ponder(playerName = 'player') {
  this.showPonderInterface(3, 'Ponder', {
    canShuffle: true,
    drawAfter: 1,
    description: '...',
    playerName: playerName  // Pass which player
  });
}

// Then in showPonderInterface
showPonderInterface(amount, source, options = {}) {
  const playerName = options.playerName || 'player';
  const library = this.gameState[playerName].library;
  const hand = this.gameState[playerName].hand;
  // ... rest of implementation
}
```

## 📋 Roadmap

### Phase 1: Core Opponent Features (Current)
- ✅ Deck loading
- ✅ Basic gameplay (draw, play, mulligan)
- ✅ Life management
- ✅ Zone displays

### Phase 2: Library Manipulation (Next Priority)
- [ ] Update all modal methods to accept `playerName` parameter
- [ ] Add opponent versions of Ponder, Brainstorm, Scry, Surveil
- [ ] Add library viewing modal for opponent
- [ ] Test with opponent's turn

### Phase 3: Triggered Abilities
- [ ] Extend Delver trigger to check opponent battlefield
- [ ] Add DRC trigger for opponent
- [ ] Test DFC transformation for opponent cards

### Phase 4: Advanced Interactions
- [ ] Add hand sorting for opponent
- [ ] Add fetchland manual activation for opponent
- [ ] Add token creation UI for opponent
- [ ] Add graveyard/exile viewing modals for opponent

### Phase 5: AI/Automation (Future)
- [ ] Basic AI for opponent actions
- [ ] Auto-play lands
- [ ] Auto-play spells based on simple rules
- [ ] Combat automation

## 🎯 Quick Reference

**To check if a feature works for opponent:**
1. Does the method check `this.gameState.turnState.activePlayer`? → Probably works for both
2. Does the method reference `this.gameState.player` directly? → Player-only
3. Does the method accept a `playerName` parameter? → Can work for both
4. Is there a UI button/menu for opponent? → Check HTML/event listeners

**To make a feature work for both players:**
1. Add `playerName` parameter (default to 'player' for backward compatibility)
2. Use `this.gameState[playerName]` instead of `this.gameState.player`
3. Add opponent UI buttons/menus if needed
4. Test with opponent as active player

---

**Last Updated:** Current session
**Status:** Opponent deck loading fully functional, library manipulation needs extension for opponent
