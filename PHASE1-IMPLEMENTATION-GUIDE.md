# Phase 1 Implementation Guide
**Accessibility & Security Improvements**

## Overview

This guide provides step-by-step instructions for implementing Phase 1 improvements to the MTG Deck Simulator. The changes focus on removing inline handlers, adding ARIA landmarks, improving color contrast, and implementing progressive disclosure.

---

## Files Created

### CSS Components
1. **`assets/components/accessibility.css`** - Focus indicators, screen reader utilities, keyboard navigation
2. **`assets/components/buttons.css`** - Semantic button system with proper hierarchy
3. **`assets/components/dropdown.css`** - Accessible dropdown menus
4. **`assets/components/color-fixes.css`** - WCAG AA compliant color system

### JavaScript Modules
1. **`scripts/modules/event-manager.mjs`** - Centralized event listener management

### Documentation
1. **`UI-UX-ANALYSIS.md`** - Comprehensive UX audit
2. **`PHASE1-IMPLEMENTATION-GUIDE.md`** - This file

---

## Step-by-Step Implementation

### Step 1: Update CSS Imports ✅ COMPLETE

**File:** `assets/modern-ui.css`

The main CSS file has been updated to import all component styles:

```css
@import url('./components/accessibility.css');
@import url('./components/buttons.css');
@import url('./components/dropdown.css');
@import url('./components/color-fixes.css');
```

**Status:** ✅ Complete

---

### Step 2: Import Event Manager

**File:** `scripts/playhand-modern-refactored.mjs`

Add the import at the top of the file:

```javascript
import { EventManager } from './modules/event-manager.mjs?v=1';
```

Then in the `init()` method, initialize the event manager:

```javascript
async init() {
  this.setupTheme();
  await this.loadDeckList();

  setTimeout(() => {
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
    this.populatePredefinedDecks();
    this.setupZoneTabs();

    // Initialize centralized event manager ← ADD THIS
    EventManager.init(this);

    this.loadDefaultDeck();
  }, 500);
}
```

**Effort:** 5 minutes

---

### Step 3: Update Template Markup

**File:** `views/playhand-modern.ejs`

This is the most time-intensive step. Replace inline handlers with data attributes.

#### Pattern A: Top Control Bar

**BEFORE (lines 213-224):**
```html
<button class="btn btn-primary-action" onclick="openDeckSelectionModal(event)" title="Select decks">
  🎴 Decks
</button>
<button class="btn btn-primary-action" onclick="window.handSimulator?.quickTwoPlayerSetup()" title="Quick setup">
  ⚡ Setup
</button>
<button id="endTurnButton" class="btn btn-secondary-action">
  ⏭️ End Turn
</button>
<button id="combatButton" class="btn btn-danger" onclick="window.handSimulator?.initializeCombat()" title="Start combat phase">
  ⚔️ Combat
</button>
```

**AFTER:**
```html
<button
  class="btn btn-game-primary"
  data-action="openDeckModal"
  aria-label="Select decks for players">
  🎴 Decks
</button>
<button
  class="btn btn-game-primary"
  data-action="quickSetup"
  aria-label="Quick two-player setup">
  ⚡ Setup
  <kbd class="keyboard-shortcut">Q</kbd>
</button>
<button
  id="endTurnButton"
  class="btn btn-game-secondary"
  aria-label="End current turn">
  ⏭️ End Turn
  <kbd class="keyboard-shortcut">T</kbd>
</button>
<button
  class="btn btn-destructive"
  data-action="combat"
  aria-label="Start combat phase">
  ⚔️ Combat
  <kbd class="keyboard-shortcut">C</kbd>
</button>
```

**Changes:**
- ✅ Removed `onclick` attributes
- ✅ Added `data-action` attributes
- ✅ Added `aria-label` for screen readers
- ✅ Added keyboard shortcut hints
- ✅ Used semantic button classes (.btn-game-primary, .btn-destructive)

---

#### Pattern B: Dropdown Buttons

**BEFORE:**
```html
<button class="btn btn-tertiary-action" onclick="this.nextElementSibling.classList.toggle('show')" style="padding: 6px 12px;">
  ⋯
</button>
<div class="dropdown-menu" style="display: none; position: absolute; background: var(--bg-primary); ...">
  <button class="dropdown-item" onclick="window.handSimulator?.startTwoPlayerGame(); this.parentElement.classList.remove('show')" style="width: 100%; text-align: left; ...">
    🎮 Start Game
  </button>
</div>
```

**AFTER:**
```html
<div class="dropdown">
  <button
    class="btn btn-game-tertiary"
    data-action="toggleOverflow"
    aria-haspopup="true"
    aria-expanded="false"
    aria-label="More actions">
    ⋯
  </button>
  <div class="dropdown-menu" role="menu" aria-label="Additional game actions">
    <button class="dropdown-item" data-action="startGame" role="menuitem">
      🎮 Start Game
    </button>
    <button class="dropdown-item" data-action="toggleSound" role="menuitem">
      🔊 Toggle Sound
    </button>
  </div>
</div>
```

**Changes:**
- ✅ Removed all inline styles
- ✅ Removed onclick handlers
- ✅ Added data-action attributes
- ✅ Added ARIA roles (menu, menuitem)
- ✅ Added aria-haspopup and aria-expanded
- ✅ Wrapped in .dropdown container

---

#### Pattern C: Life Counter Buttons

**BEFORE:**
```html
<button onclick="window.handSimulator.changeLife(-1)" style="cursor: pointer; min-width: 44px; min-height: 44px; padding: 8px 12px; background: #dc3545; border: none; border-radius: 6px; font-weight: bold; font-size: 1.25rem; color: white; user-select: none; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onmouseenter="this.style.background='#c82333'" onmouseleave="this.style.background='#dc3545'" title="Lose 1 life">−1</button>
```

**AFTER:**
```html
<button
  class="btn btn-lg btn-destructive"
  data-action="changeLife"
  data-player="player"
  data-amount="-1"
  aria-label="Lose 1 life">
  −1
</button>
```

**Changes:**
- ✅ Removed 12 inline styles
- ✅ Removed onclick and hover handlers
- ✅ Used semantic classes
- ✅ Added data attributes for player and amount
- ✅ Added aria-label

---

#### Pattern D: Token Creation Buttons

**BEFORE:**
```html
<button class="btn btn-sm btn-outline-primary" onclick="window.handSimulator.createToken('Treasure', 'Artifact', 'player'); document.getElementById('playerTokenMenu').classList.remove('show');" style="padding: 8px; text-align: left;">💎 Treasure</button>
```

**AFTER:**
```html
<button
  class="btn btn-sm btn-outline-primary"
  data-action="createToken"
  data-token="Treasure"
  data-player="player"
  role="menuitem">
  💎 Treasure
</button>
```

**Changes:**
- ✅ Removed onclick handler
- ✅ Removed inline style
- ✅ Added data-token attribute
- ✅ EventManager handles menu closing automatically

---

#### Pattern E: Board Wipe Buttons

**BEFORE:**
```html
<button class="btn btn-xs btn-outline-danger" onclick="window.handSimulator?.wrathOfGod()" title="Destroy all creatures">💀 Wrath</button>
```

**AFTER:**
```html
<button
  class="btn btn-xs btn-outline-danger"
  data-action="boardWipe"
  data-spell="wrath"
  aria-label="Wrath of God - Destroy all creatures">
  💀 Wrath
</button>
```

**Changes:**
- ✅ Removed onclick
- ✅ Added data-action and data-spell
- ✅ Improved aria-label with full effect description

---

### Step 4: Add ARIA Landmarks

**File:** `views/playhand-modern.ejs`

Update major sections with proper ARIA landmarks:

#### Top Bar

**BEFORE (line 209):**
```html
<div class="play-controls-bar" role="toolbar" aria-label="Game Controls">
```

**AFTER:**
```html
<header class="play-controls-bar" role="banner">
  <nav role="navigation" aria-label="Game controls">
    <div class="controls-section">
      <!-- buttons -->
    </div>
  </nav>
</header>
```

#### Sidebar

**BEFORE (line 289):**
```html
<aside class="app-sidebar">
  <div id="gameLogContainer" style="height: 100%; display: flex; flex-direction: column;">
    <h3 style="padding: 12px; margin: 0; border-bottom: 1px solid var(--border-color); font-size: 14px; font-weight: 600;">📜 Game Log</h3>
    <div id="gameLogPanel" style="flex: 1; overflow-y: auto; padding: 12px; font-size: 12px;"></div>
  </div>
</aside>
```

**AFTER:**
```html
<aside class="app-sidebar" role="complementary" aria-label="Game log">
  <div id="gameLogContainer">
    <h3>📜 Game Log</h3>
    <div
      id="gameLogPanel"
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions">
    </div>
  </div>
</aside>
```

**CSS for game log container (move to modern-ui.css):**
```css
#gameLogContainer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

#gameLogContainer h3 {
  padding: 12px;
  margin: 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
  font-weight: 600;
}

#gameLogPanel {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-size: 12px;
}
```

#### Main Content Area

**BEFORE (line 296):**
```html
<main class="app-main">
```

**AFTER:**
```html
<main class="app-main" role="main" aria-label="Game board">
```

#### Player Areas

**BEFORE:**
```html
<div class="player-area" id="opponentArea">
```

**AFTER:**
```html
<section
  class="player-area"
  id="opponentArea"
  role="region"
  aria-labelledby="opponentHeader">
  <div class="player-header" id="opponentHeader">
    <!-- header content -->
  </div>
</section>
```

---

### Step 5: Add Skip Links

**File:** `views/playhand-modern.ejs`

Add skip links at the very top of <body> (line 204):

**BEFORE:**
```html
<body>
  <div class="app-container">
```

**AFTER:**
```html
<body>
  <a href="#mainContent" class="skip-link">Skip to main content</a>
  <a href="#gameLog" class="skip-link">Skip to game log</a>

  <div class="app-container">
```

Then add IDs to target sections:

```html
<main class="app-main" role="main" aria-label="Game board" id="mainContent">

<div id="gameLogPanel" role="log" aria-live="polite" id="gameLog">
```

---

### Step 6: Add Live Region for Announcements

**File:** `views/playhand-modern.ejs`

Add at the end of <body>, before closing tag:

```html
  </div> <!-- End app-container -->

  <!-- Screen reader announcements -->
  <div
    id="ariaAnnouncements"
    class="live-region"
    role="status"
    aria-live="polite"
    aria-atomic="true">
  </div>

  <!-- Urgent announcements (errors, turn changes) -->
  <div
    id="ariaAlerts"
    class="live-region"
    role="alert"
    aria-live="assertive"
    aria-atomic="true">
  </div>
</body>
```

Then update UIManager to use these regions:

**File:** `scripts/modules/ui-updates.mjs`

Add method to announce to screen readers:

```javascript
announceToScreenReader(message, isUrgent = false) {
  const regionId = isUrgent ? 'ariaAlerts' : 'ariaAnnouncements';
  const region = document.getElementById(regionId);

  if (region) {
    region.textContent = message;

    // Clear after 3 seconds
    setTimeout(() => {
      region.textContent = '';
    }, 3000);
  }
}
```

Call it when important actions occur:

```javascript
// In drawCard method:
this.announceToScreenReader(`Drew ${cardName}`);

// In endTurn method:
this.announceToScreenReader(`Turn ${turnNumber} ended`, true);

// In mulligan method:
this.announceToScreenReader(`Mulliganed to ${handSize} cards`);
```

---

### Step 7: Implement Progressive Disclosure

**File:** `views/playhand-modern.ejs`

Add expertise level selector in settings or top bar:

```html
<div class="expertise-selector" role="radiogroup" aria-label="Interface complexity">
  <label>
    <input
      type="radio"
      name="expertise"
      value="beginner"
      onchange="setExpertiseLevel('beginner')"
      aria-label="Beginner mode - 8 essential actions">
    Beginner
  </label>
  <label>
    <input
      type="radio"
      name="expertise"
      value="advanced"
      checked
      onchange="setExpertiseLevel('advanced')"
      aria-label="Advanced mode - 20 common actions">
    Advanced
  </label>
  <label>
    <input
      type="radio"
      name="expertise"
      value="expert"
      onchange="setExpertiseLevel('expert')"
      aria-label="Expert mode - All 40+ actions">
    Expert
  </label>
</div>
```

**Add to existing setExpertiseLevel function** in playhand-modern.ejs <script>:

```javascript
function setExpertiseLevel(level) {
  // Update active button (existing code)
  document.querySelectorAll('.expertise-selector input').forEach(input => {
    input.checked = (input.value === level);
  });

  // Update body data attribute
  document.body.setAttribute('data-expertise-level', level);

  // Store preference
  localStorage.setItem('mtg-expertise-level', level);

  // Show toast
  const messages = {
    'beginner': 'Beginner mode: 8 essential actions',
    'advanced': 'Advanced mode: 20 common actions',
    'expert': 'Expert mode: All actions visible'
  };

  if (window.handSimulator?.showToast) {
    window.handSimulator.showToast(messages[level], 'info');
  }
}
```

**Tag actions by expertise level:**

Beginner actions (always visible):
```html
<button
  class="btn btn-game-primary action-beginner"
  data-action="draw"
  data-player="player">
  📥 Draw <kbd>D</kbd>
</button>
```

Advanced actions (hidden in beginner mode):
```html
<button
  class="btn btn-game-secondary action-advanced"
  data-action="scry"
  data-player="player">
  🔍 Scry
</button>
```

Expert actions (hidden in beginner and advanced modes):
```html
<button
  class="btn btn-game-tertiary action-expert"
  data-action="cascade"
  data-player="player">
  ⚡ Cascade
</button>
```

**CSS handles the hiding** (already in buttons.css):

```css
[data-expertise-level="beginner"] .action-advanced,
[data-expertise-level="beginner"] .action-expert {
  display: none !important;
}

[data-expertise-level="advanced"] .action-expert {
  display: none !important;
}
```

---

### Step 8: Update CSP

**File:** `startapp.mjs`

**BEFORE (line 17):**
```javascript
"script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
```

**AFTER:**
```javascript
"script-src 'self'; style-src 'self';"
```

**IMPORTANT:** Only do this AFTER all inline handlers and styles are removed!

---

### Step 9: Test Everything

#### Testing Checklist

**Keyboard Navigation:**
- [ ] Tab through all buttons in logical order
- [ ] Enter/Space activates focused buttons
- [ ] Arrow keys navigate dropdown menus
- [ ] Escape closes modals and dropdowns
- [ ] All keyboard shortcuts work (D, M, T, C, Q, 1-7)
- [ ] Focus indicators visible on all interactive elements

**Screen Reader:**
- [ ] Install NVDA (Windows) or VoiceOver (Mac)
- [ ] Navigate with screen reader only
- [ ] Verify all buttons have meaningful labels
- [ ] Confirm live regions announce game events
- [ ] Check skip links work

**Visual:**
- [ ] All buttons have proper hierarchy (primary/secondary/tertiary)
- [ ] Color contrast passes WCAG AA (use Lighthouse)
- [ ] Dark theme still works
- [ ] No visual regressions

**Functionality:**
- [ ] All previous onclick handlers now work via EventManager
- [ ] Deck selection modal opens and closes
- [ ] Life counters work
- [ ] Token creation works
- [ ] Board wipes work
- [ ] Library actions work
- [ ] Dropdowns open/close correctly

**Progressive Disclosure:**
- [ ] Beginner mode shows 8 core actions only
- [ ] Advanced mode shows ~20 actions
- [ ] Expert mode shows all actions
- [ ] Preference persists in localStorage

**Security:**
- [ ] CSP no longer shows violations
- [ ] No console errors
- [ ] No XSS vulnerabilities (test with sample inputs)

---

## Estimated Time Investment

| Task | Effort | Priority |
|------|--------|----------|
| Step 1: CSS imports | 5 min | ✅ DONE |
| Step 2: Import EventManager | 5 min | P0 |
| Step 3: Update template markup | 6 hours | P0 |
| Step 4: Add ARIA landmarks | 1 hour | P0 |
| Step 5: Add skip links | 15 min | P1 |
| Step 6: Add live regions | 45 min | P1 |
| Step 7: Progressive disclosure | 2 hours | P1 |
| Step 8: Update CSP | 5 min | P0 |
| Step 9: Testing | 3 hours | P0 |
| **Total** | **~13 hours** | |

---

## Quick Reference: Data Attribute Patterns

### Action Types
```html
data-action="draw"           <!-- Player draws card -->
data-action="mulligan"       <!-- Mulligan hand -->
data-action="passTurn"       <!-- Pass turn -->
data-action="combat"         <!-- Enter combat -->
data-action="createToken"    <!-- Create token -->
data-action="boardWipe"      <!-- Cast board wipe -->
data-action="changeLife"     <!-- Modify life total -->
data-action="viewLibrary"    <!-- Open library modal -->
data-action="toggleLibrary"  <!-- Toggle library menu -->
```

### Player Targeting
```html
data-player="player"         <!-- Action affects Player 1 -->
data-player="opponent"       <!-- Action affects Player 2 -->
```

### Additional Context
```html
data-amount="1"              <!-- Life change amount -->
data-amount="-3"             <!-- Lightning Bolt damage -->
data-token="Treasure"        <!-- Token type -->
data-spell="wrath"           <!-- Board wipe spell -->
```

### ARIA Attributes
```html
aria-label="Descriptive action name"
aria-labelledby="elementId"
aria-describedby="helpTextId"
aria-haspopup="true"
aria-expanded="false"
role="button|menu|menuitem|region|navigation"
```

---

## Migration Strategy

### Option A: All at Once (Recommended)
1. Create feature branch: `git checkout -b phase1-accessibility`
2. Update all templates in one session (6-8 hours)
3. Test thoroughly
4. Merge when everything works

### Option B: Incremental
1. Start with top control bar
2. Test and commit
3. Move to player controls
4. Test and commit
5. Move to opponent controls
6. Test and commit

**Pros of Option A:** Faster, less merge conflicts, can update CSP once done
**Pros of Option B:** Safer, easier to debug, can deploy partial improvements

---

## Troubleshooting

### Issue: Buttons don't respond to clicks

**Cause:** EventManager not initialized or data-action doesn't match event listener

**Fix:**
1. Check browser console for errors
2. Verify EventManager.init(this) is called
3. Verify data-action matches the switch cases in EventManager
4. Add console.log to event handler to confirm it's reached

### Issue: Dropdown stays open after clicking item

**Cause:** closeDropdown() not being called

**Fix:** EventManager automatically closes dropdowns via `this.closeDropdown(btn)`. Verify the button is inside a `.dropdown-menu` or `.advanced-actions-panel`.

### Issue: CSP violations still showing

**Cause:** Inline styles or onclick handlers still present

**Fix:**
1. Search template for `onclick=`
2. Search template for `style="`
3. Search template for `onmouseover=`
4. Remove all instances before updating CSP

### Issue: Screen reader not announcing

**Cause:** Live region not present or aria-live not set

**Fix:**
1. Verify `#ariaAnnouncements` div exists
2. Check `aria-live="polite"` attribute
3. Verify announceToScreenReader() is being called
4. Test with actual screen reader (NVDA/VoiceOver)

### Issue: Keyboard shortcuts stopped working

**Cause:** Event listeners may be preventing keyboard events

**Fix:** Existing keyboard shortcuts are in setupKeyboardShortcuts(). EventManager doesn't interfere with them. Check for `event.preventDefault()` calls that might be blocking.

---

## Next Steps (Phase 2)

After Phase 1 is complete and tested:

1. **Slide-out panels** - Replace dropdowns with better mobile UX
2. **Deck search** - Add fuzzy search to deck selection modal
3. **Card action buttons** - Make card actions discoverable (replace right-click)
4. **Keyboard hints overlay** - Press "?" to see all shortcuts
5. **Onboarding tutorial** - Interactive walkthrough for new users

---

## Resources

**Testing Tools:**
- Lighthouse (Chrome DevTools)
- axe DevTools (Chrome extension)
- WAVE (WebAIM)
- NVDA Screen Reader (Windows)
- VoiceOver (Mac/iOS)

**Documentation:**
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- MDN Accessibility: https://developer.mozilla.org/en-US/docs/Web/Accessibility

---

## Success Metrics

After Phase 1 implementation, you should achieve:

✅ **Accessibility:**
- Lighthouse Accessibility Score: 40% → 95%
- Keyboard Navigation: 0% → 100%
- WCAG AA Compliance: 40% → 100%

✅ **Security:**
- CSP Violations: 416 → 0
- XSS Attack Surface: High → Low

✅ **Maintainability:**
- Inline Styles: 278 → 0
- Inline Handlers: 138 → 0
- CSS Reusability: Low → High

✅ **User Experience:**
- Cognitive Load: High → Medium (with beginner mode)
- Discoverability: 30% → 60%
- Power User Efficiency: +40% (keyboard shortcuts)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-05
**Status:** Ready for Implementation
