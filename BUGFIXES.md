# Bug Fixes for Refactored Version

## Issue #1: "Draw 7 Cards" Button Not Working ✅ FIXED

**Error**: Button called `drawHand(7)` but method didn't accept parameters

**Fix**: Updated `scripts/modules/core-methods.mjs`
- Changed `drawHand()` to `drawHand(handSize = 7)`
- Now accepts optional parameter
- Defaults to 7 if not provided

**Status**: ✅ Working

---

## Issue #2: `Cannot read properties of null (reading 'setAttribute')` ✅ FIXED

**Error**: JavaScript trying to access `targetingControls` element that doesn't exist

**Root Cause**: Inline script in `views/playhand-modern.ejs` assumed elements exist

**Fixes Applied**:

1. **Line 47-50**: Added null check for `targetingControls`
   ```javascript
   const targetingControls = document.getElementById('targetingControls');
   if (targetingControls) {
       targetingControls.setAttribute('data-expertise', level);
   }
   ```

2. **Line 82-87**: Added null check in `toggleTargetingControls()`
   ```javascript
   function toggleTargetingControls() {
       const targetingControls = document.getElementById('targetingControls');
       if (targetingControls) {
           targetingControls.classList.toggle('expanded');
       }
   }
   ```

3. **Line 67-83**: Added null checks in `toggleSection()`
   ```javascript
   function toggleSection(sectionId) {
       const section = document.getElementById(sectionId);
       if (!section) return;

       const header = section.previousElementSibling;
       if (!header) return;
       // ... rest of function
   }
   ```

**Status**: ✅ Fixed

---

## Issue #3: Missing Methods ✅ FIXED

**Error**: Buttons calling methods that didn't exist in refactored version

**Methods Added** (as stubs in `playhand-modern-refactored.mjs`):

### Life Management (Fully Functional) ✅
- `changeLife(amount)` - Adjust player life
- `setLife(amount)` - Set player life to exact value
- `changeOpponentLife(amount)` - Adjust opponent life
- `setOpponentLife(amount)` - Set opponent life to exact value

### Game Actions (Fully Functional) ✅
- `passTurn()` - Delegates to `endTurn()`

### Stubs (Show "Needs Implementation" Message) ⚠️
- `createToken(name, type, owner)` - Token creation
- `loadOpponentDeck(deckPath)` - Load opponent deck
- `setOpponentDeckAsDefault()` - Save opponent deck preference
- `clearDefaultOpponentDeck()` - Clear opponent deck preference
- `showLibraryModal(player)` - View library
- `shuffleOpponentLibrary()` - Shuffle opponent deck (works!)
- `showScryInterface(amount, source, options)` - Scry mechanic
- `showOpponentGraveyardModal()` - View opponent graveyard
- `showOpponentExileModal()` - View opponent exile
- `quickTwoPlayerSetup()` - Quick game setup
- `undo()` - Undo last action
- `showKeyboardHelp()` - Shows help toast
- `testCountersFeature()` - Test counters

**Status**: ✅ No more crashes, stubs inform user

---

## Testing Checklist

Test these features to verify fixes:

### Core Functionality ✅
- [x] Load a deck from dropdown
- [x] Click "🎲 Draw 7 Cards" button
- [x] Click "📥 Draw Card" button
- [x] Click "🔄 Mulligan" button
- [x] Click "⏭️ End Turn" button
- [x] Click life +/- buttons (player)
- [x] Click life +/- buttons (opponent)
- [x] Click opponent "Draw 7 Cards"
- [x] Click opponent "Draw Card"
- [x] Click opponent "Mulligan"

### Expected Stub Behaviors ⚠️
- [ ] Click "Create Token" - Shows "stub" toast
- [ ] Click "Quick Setup" - Shows "needs implementation" toast
- [ ] Click "Scry" - Shows "needs implementation" toast
- [ ] Right-click library - Shuffle works, other options show stubs

### No Errors ✅
- [x] No console errors on page load
- [x] No errors when clicking working buttons
- [x] Stub buttons show friendly messages (not errors)

---

## Current State

### Working ✅
1. Deck loading
2. Drawing cards (player & opponent)
3. Mulligan (player & opponent)
4. Turn management
5. Life totals (+/- for both players)
6. Theme toggle
7. Keyboard shortcuts (D, M, T)
8. Pass turn
9. Shuffle opponent library

### Stub (User-Friendly Messages) ⚠️
1. Token creation
2. Opponent deck loading
3. Library/scry modals
4. Graveyard/exile viewing
5. Quick two-player setup
6. Undo
7. Counter testing

### Not Yet Migrated 📋
1. Spell effects (Lightning Bolt, etc.)
2. Board wipes
3. Targeting system
4. Advanced modals (explore, ponder, etc.)
5. Fetch lands
6. Discard effects
7. Deck analytics
8. Full two-player setup

---

## Next Steps

To make stub features functional, migrate from `playhand-modern.mjs`:

1. **Opponent Deck Loading** (High Priority)
   - Copy `loadOpponentDeck()` method
   - Add to `core-methods.mjs` or create `opponent-methods.mjs`

2. **Token Creation** (High Priority)
   - Copy token creation logic
   - Add to new `token-manager.mjs` module

3. **Quick Two-Player Setup** (Medium Priority)
   - Copy `quickTwoPlayerSetup()` method
   - Requires opponent deck loading first

4. **Modals** (Medium Priority)
   - Library viewing
   - Scry/surveil
   - Graveyard/exile

---

## How to Test

1. Visit: `http://localhost:3001/playhand-modern`
2. Load a deck (e.g., "Affinity")
3. Click "🎲 Draw 7 Cards"
4. Click life +/- buttons
5. Click "⏭️ End Turn"
6. Try stub features - should show friendly toast messages

**No crashes expected!** ✅

---

**Last Updated**: Current session
**Status**: Core functionality stable, stubs in place
**Priority**: Migrate opponent deck loading next
