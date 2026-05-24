# Phase 1 Implementation - Session Summary

## Completed This Session ✅

### 1. Event Listener Module Created (600+ lines)
**File:** `scripts/modules/event-listeners.mjs`

**Features Implemented:**
- Centralized event handling system
- Event delegation for dynamic content
- Keyboard shortcuts (D, N, M, P, T, U, C, S, ?)
- ARIA live regions for screen readers
- Skip link for keyboard users
- Keyboard-accessible cards
- Keyboard help overlay (press `?`)

### 2. ARIA Landmarks Added
**File:** `views/playhand-modern.ejs`

**Changes:**
- Added `<header role="banner">` for top control bar
- Added `<nav role="navigation">` for game controls
- Added `<main id="main-content" role="main">` for game board
- Added `<aside role="complementary">` for game log
- Added skip link at top of body
- Added `role="log"` and `aria-live="polite"` to game log
- Added ARIA labels to all control groups

### 3. CSS Button Classes Created
**File:** `assets/components/buttons.css`

**New Classes:**
```css
/* Life counter buttons */
.btn-life-change          /* Base for large +1/-1 buttons */
.btn-life-decrease        /* Red background for -1 */
.btn-life-increase        /* Green background for +1 */
.btn-life-preset          /* Gray background for -3/-2 */
.btn-life-preset.btn-life-gain  /* Cyan background for +3 */
.life-total               /* Clickable life total display */
```

All with proper hover states (no inline handlers needed).

### 4. Inline onclick Handlers Replaced
**Count:** 19 of 145 (13% complete)

**Completed Replacements:**

#### Top Control Bar (9 buttons):
| Button | Old | New |
|--------|-----|-----|
| Decks | `onclick="openDeckSelectionModal(event)"` | `data-action="open-deck-modal"` |
| Setup | `onclick="window.handSimulator?.quickTwoPlayerSetup()"` | `data-action="quick-setup"` |
| End Turn | Already had ID | `data-action="end-turn"` |
| Combat | `onclick="window.handSimulator?.initializeCombat()"` | `data-action="combat"` |
| Board Wipes | `onclick="document.getElementById('boardWipesActionPanel').classList.add('show')"` | `data-action="toggle-board-wipes"` |
| Dropdown toggle | `onclick="this.nextElementSibling.classList.toggle('show')"` | `data-action="toggle-dropdown" data-target="moreActionsMenu"` |
| Start Game | Multiple onclick actions | `data-action="start-two-player"` |
| Test Counters | onclick | `data-action="test-counters"` |
| Toggle Sound | onclick | `data-action="toggle-sounds"` |

#### Life Counter Buttons (10 buttons):
**Opponent:**
- -1 life: `data-action="change-opponent-life" data-amount="-1"`
- +1 life: `data-action="change-opponent-life" data-amount="1"`
- -3 life: `data-action="change-opponent-life" data-amount="-3"`
- -2 life: `data-action="change-opponent-life" data-amount="-2"`
- +3 life: `data-action="change-opponent-life" data-amount="3"`

**Player:**
- -1 life: `data-action="change-life" data-amount="-1"`
- +1 life: `data-action="change-life" data-amount="1"`
- -3 life: `data-action="change-life" data-amount="-3"`
- -2 life: `data-action="change-life" data-amount="-2"`
- +3 life: `data-action="change-life" data-amount="3"`

---

## Remaining Work 📋

### Pattern Categories Still To Replace (~126 onclick handlers):

#### 1. Player Action Buttons (~20 instances)
**Pattern:**
```html
<!-- Current -->
<button onclick="window.handSimulator.resetAndDrawOpponent7()">🎲 New Game</button>
<button onclick="window.handSimulator.drawOpponentCard()">📥 Draw</button>
<button onclick="window.handSimulator.mulliganOpponent()">🔄 Mulligan</button>

<!-- Should be -->
<button data-action="new-game-opponent">🎲 New Game</button>
<button data-action="draw-opponent-card">📥 Draw</button>
<button data-action="mulligan-opponent">🔄 Mulligan</button>
```

**Event Listener Module Status:** ✅ Already has handlers for these

#### 2. Deck Selection Links (~2 instances)
**Pattern:**
```html
<!-- Current -->
<button class="btn btn-link" onclick="openDeckSelectionModal(event)">

<!-- Should be -->
<button class="btn btn-link" data-action="open-deck-modal">
```

**Event Listener Module Status:** ✅ Already has handler

#### 3. Zone Buttons (~30 instances)
Library, Graveyard, Exile, etc.

**Pattern:**
```html
<!-- Current -->
<button onclick="window.handSimulator.showLibraryModal('player')">📚 Library</button>
<button onclick="window.handSimulator.showGraveyardModal()">🪦 Graveyard</button>

<!-- Should be -->
<button data-action="show-library" data-player="player">📚 Library</button>
<button data-action="show-graveyard" data-player="player">🪦 Graveyard</button>
```

**Event Listener Module Status:** ❌ Need to add handlers

#### 4. Advanced Actions (~40 instances)
Scry, Cascade, Token creation, etc.

**Pattern:**
```html
<!-- Current -->
<button onclick="window.handSimulator.scry(1)">Scry 1</button>
<button onclick="window.handSimulator.createToken('1/1 Soldier', 'Creature - Soldier Token', 'player')">Create Soldier</button>

<!-- Should be -->
<button data-action="scry" data-amount="1">Scry 1</button>
<button data-action="create-token" data-token-type="soldier">Create Soldier</button>
```

**Event Listener Module Status:** ❌ Need to add handlers

#### 5. Board Wipe Spells (~10 instances)
**Pattern:**
```html
<!-- Current -->
<button onclick="window.handSimulator.castBoardWipe('Wrath of God')">Wrath of God</button>

<!-- Should be -->
<button data-action="cast-board-wipe" data-spell="Wrath of God">Wrath of God</button>
```

**Event Listener Module Status:** ✅ Already has handler

#### 6. Modal Close Buttons (~5 instances)
**Pattern:**
```html
<!-- Current -->
<button onclick="this.closest('.modal').style.display='none'">✕</button>

<!-- Should be -->
<button data-action="close-modal" data-modal-id="deckSelectionModal">✕</button>
```

**Event Listener Module Status:** ✅ Already has handler

#### 7. Miscellaneous (~19 instances)
Sort hand, untap, shuffle, etc.

---

## Next Session Action Plan

### Step 1: Find & Replace Patterns (3-4 hours)

Use these exact search/replace patterns in VS Code:

#### Pattern 1: Player Draw Card
**Find:** `onclick="window.handSimulator\.drawCard\(\)"`
**Replace:** `data-action="draw-card"`

#### Pattern 2: Mulligan
**Find:** `onclick="window.handSimulator\.mulligan\(\)"`
**Replace:** `data-action="mulligan"`

#### Pattern 3: New Game
**Find:** `onclick="window.handSimulator\.resetAndDraw7\(\)"`
**Replace:** `data-action="new-game"`

#### Pattern 4: Opponent Draw
**Find:** `onclick="window.handSimulator\.drawOpponentCard\(\)"`
**Replace:** `data-action="draw-opponent-card"`

Continue with similar patterns for remaining 120+ handlers...

### Step 2: Update Event Listener Module (2 hours)

Add handlers in `scripts/modules/event-listeners.mjs`:

```javascript
// Zone buttons
document.addEventListener('click', (e) => {
  const zoneBtn = e.target.closest('[data-action="show-library"]');
  if (zoneBtn) {
    const player = zoneBtn.dataset.player || 'player';
    this.handSimulator?.showLibraryModal(player);
  }
});

// Similar patterns for other actions...
```

### Step 3: Remove All Inline Handlers (1 hour)

Once event listeners are working:
1. Search for `onclick=` in template
2. Verify each has a data-action attribute
3. Delete the onclick attribute
4. Search for `onmouseenter=` and `onmouseleave=` - delete all (CSS hover handles this now)

### Step 4: Update CSP (1 hour)

**File:** `startapp.mjs`

```javascript
// Current
"script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"

// Change to
"script-src 'self'; style-src 'self';"
```

### Step 5: Testing (3 hours)

1. **Functional Testing** (1.5 hours)
   - Test all buttons work
   - Test all dropdowns work
   - Test life counters work
   - Test modal interactions

2. **Accessibility Testing** (1 hour)
   - Run Lighthouse audit (target: 90+ score)
   - Test keyboard navigation (Tab, Enter, Escape)
   - Test screen reader (NVDA or VoiceOver)

3. **Cross-Browser Testing** (0.5 hours)
   - Chrome
   - Firefox
   - Safari/Edge

---

## Files Modified This Session

1. ✅ `scripts/modules/event-listeners.mjs` - Created (600 lines)
2. ✅ `scripts/playhand-modern-refactored.mjs` - Updated (added import and init)
3. ✅ `assets/components/buttons.css` - Updated (added 85 lines of life counter styles)
4. ✅ `views/playhand-modern.ejs` - Partially updated:
   - Added ARIA landmarks
   - Added skip link
   - Replaced 19 of 145 onclick handlers
   - Removed ~38 inline style event handlers (onmouseenter/onmouseleave)

---

## Estimated Time to Complete

| Task | Est. Time | Status |
|------|-----------|--------|
| Event Listener Module | 8h | ✅ Done |
| ARIA Landmarks | 2h | ✅ Done |
| CSS Button Classes | 1h | ✅ Done |
| Replace onclick (19/145) | 2h | ✅ Done |
| Replace onclick (remaining 126) | 4h | 📋 Next |
| Update Event Listeners | 2h | 📋 Next |
| Remove inline handlers | 1h | 📋 Next |
| Update CSP | 1h | 📋 Next |
| Testing | 3h | 📋 Next |
| **TOTAL** | **24h** | **50% Done** |

---

## Progress Metrics

- **Completion:** 50% of Phase 1
- **onclick Handlers:** 19/145 replaced (13%)
- **Inline Style Handlers:** ~38/60 removed (63% - from life buttons)
- **ARIA Landmarks:** 100% complete
- **Focus Indicators:** 100% complete (already existed)
- **Color Contrast:** 100% complete (already existed)
- **Event System:** 100% complete (infrastructure done, needs full integration)

---

## Quick Start for Next Session

1. Open `PHASE1-PROGRESS.md` - reference for all patterns
2. Open `views/playhand-modern.ejs` in VS Code
3. Use Find & Replace (Ctrl+H) with regex enabled
4. Work through patterns systematically
5. Test after each 20-30 replacements
6. Update `scripts/modules/event-listeners.mjs` as needed

---

## Success Indicators

You'll know Phase 1 is complete when:

- ✅ Focus indicators visible on all elements
- ✅ All colors meet WCAG AA standards
- ✅ ARIA landmarks present
- ⬜ Search template for `onclick=` returns 0 results
- ⬜ Search template for `onmouseenter=` returns 0 results
- ⬜ CSP has no `unsafe-inline`
- ⬜ Console shows 0 CSP violations
- ⬜ All functionality works
- ⬜ Lighthouse Accessibility score >90%
- ⬜ Keyboard navigation 100% functional

---

**Great progress today! The hardest architectural work is done. Remaining work is mostly mechanical find-and-replace.**
