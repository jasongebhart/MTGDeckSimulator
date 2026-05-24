# Phase 1 Testing Checklist

**Status:** Server Running ✅ | CSP Updated ✅ | Ready for Testing
**URL:** http://localhost:3001/playhand-modern

---

## ✅ Pre-Testing Verification (COMPLETE)

- ✅ Server starts without errors
- ✅ CSP header updated (no `'unsafe-inline'`)
- ✅ All 146 inline event handlers removed
- ✅ Event listener module loaded (1000+ lines)
- ✅ All 51 data-action types implemented

---

## 🧪 Functional Testing

### 1. Top Control Bar (9 buttons)

#### ⏳ Deck Selection
- [ ] Click **🎴 Decks** button
  - [ ] Modal opens
  - [ ] Player 1 deck list populated
  - [ ] Player 2 deck list populated
  - [ ] Search input works
  - [ ] Can select and load decks
  - [ ] Modal closes (X button, backdrop, Escape)

#### ⏳ Game Setup
- [ ] Click **⚡ Quick Setup** button
  - [ ] Two-player game initializes
  - [ ] Both players draw 7 cards
  - [ ] Life totals set to 20

#### ⏳ Turn Management
- [ ] Click **🔚 End Turn** button
  - [ ] Turn counter increments
  - [ ] Turn indicator updates

#### ⏳ Combat
- [ ] Click **⚔️ Combat** button
  - [ ] Combat phase initiates
  - [ ] Combat UI elements appear

#### ⏳ Board Wipes
- [ ] Click **💀 Board Wipes** button
  - [ ] Board wipes panel opens
  - [ ] All 7 spell buttons visible

#### ⏳ More Actions Dropdown
- [ ] Click **⋯ More** button
  - [ ] Dropdown menu opens
  - [ ] All options visible
  - [ ] Dropdown closes when clicking outside

---

### 2. Life Counters (20 buttons)

#### ⏳ Opponent Life Counter
- [ ] Click **−1** button (large red)
  - [ ] Opponent life decreases by 1
  - [ ] Visual feedback
- [ ] Click **+1** button (large green)
  - [ ] Opponent life increases by 1
- [ ] Click **−3** button (small gray)
  - [ ] Opponent life decreases by 3
- [ ] Click **−2** button (small gray)
  - [ ] Opponent life decreases by 2
- [ ] Click **+3** button (small cyan)
  - [ ] Opponent life increases by 3
- [ ] Click on **life total number**
  - [ ] Prompt appears to set exact value
  - [ ] Life updates to entered value

#### ⏳ Player Life Counter
- [ ] Click **−1** button (large red)
  - [ ] Player life decreases by 1
- [ ] Click **+1** button (large green)
  - [ ] Player life increases by 1
- [ ] Click **−3** button (small gray)
  - [ ] Player life decreases by 3
- [ ] Click **−2** button (small gray)
  - [ ] Player life decreases by 2
- [ ] Click **+3** button (small cyan)
  - [ ] Player life increases by 3
- [ ] Click on **life total number**
  - [ ] Prompt appears
  - [ ] Life updates correctly

---

### 3. Player Actions (10 buttons)

#### ⏳ Player 1 Controls
- [ ] **📥 Draw** button
  - [ ] Draws 1 card from library
  - [ ] Hand count increments
- [ ] **🎲 New Game** button
  - [ ] Resets game state
  - [ ] Draws 7 cards
  - [ ] Mulligan count resets
- [ ] **🔄 Mulligan** button
  - [ ] Returns hand to library
  - [ ] Draws N-1 cards
  - [ ] Mulligan count increments
- [ ] **🔓 Untap All** button
  - [ ] All player cards untap
- [ ] **🔀 Shuffle** button
  - [ ] Library shuffles

---

### 4. Opponent Actions (10 buttons)

#### ⏳ Player 2 Controls
- [ ] **📥 Draw** button
  - [ ] Opponent draws 1 card
- [ ] **🎲 New Game** button
  - [ ] Opponent resets and draws 7
- [ ] **🔄 Mulligan** button
  - [ ] Opponent mulligans
- [ ] **🔓 Untap All** button
  - [ ] Opponent cards untap
- [ ] **🔀 Shuffle** button
  - [ ] Opponent library shuffles

---

### 5. Zone Buttons (12 buttons)

#### ⏳ Player Zones
- [ ] **📚 Library** button
  - [ ] Library modal opens
  - [ ] Shows player library cards
- [ ] **🪦 Graveyard** button
  - [ ] Graveyard modal opens
  - [ ] Shows player graveyard
- [ ] **💠 Exile** button
  - [ ] Exile modal opens
  - [ ] Shows player exile zone

#### ⏳ Opponent Zones
- [ ] **📚 Library** button
  - [ ] Shows opponent library
- [ ] **🪦 Graveyard** button
  - [ ] Shows opponent graveyard
- [ ] **💠 Exile** button
  - [ ] Shows opponent exile

---

### 6. Token Creation (32 buttons)

#### ⏳ Player Tokens (16 types)
- [ ] **💎 Treasure** token
- [ ] **🛡️ Soldier** token
- [ ] **🧚 Spirit** token
- [ ] **🧟 Zombie** token
- [ ] **⚡ Energy** counter
- [ ] **🌲 Saproling** token
- [ ] **🐉 Dragon** token
- [ ] **👤 Human** token
- [ ] **🐺 Wolf** token
- [ ] **😈 Demon** token
- [ ] **😇 Angel** token
- [ ] **🦅 Bird** token
- [ ] **🐱 Cat** token
- [ ] **🦖 Dinosaur** token
- [ ] **🔮 Wizard** token
- [ ] **⚔️ Knight** token

#### ⏳ Opponent Tokens (16 types)
- [ ] All 16 token types create correctly for opponent

---

### 7. Board Wipe Spells (7 buttons)

- [ ] **💀 Wrath** (Wrath of God)
- [ ] **🌊 Damnation**
- [ ] **⚡ Supreme Verdict**
- [ ] **🔥 Blasphemous Act**
- [ ] **❄️ Day of Judgment**
- [ ] **💥 Cyclonic Rift**
- [ ] **🌪️ Toxic Deluge**

Each should:
- [ ] Destroy/remove appropriate permanents
- [ ] Update game state correctly

---

### 8. Library Manipulation (10 buttons per player)

#### ⏳ Player Library Actions
- [ ] **🔝 View Top Card**
  - [ ] Shows top card
- [ ] **🔍 Scry 1**
  - [ ] Scry modal opens
  - [ ] Can keep or bottom card
- [ ] **🤔 Ponder**
  - [ ] Shows top 3 cards
  - [ ] Can rearrange or shuffle
- [ ] **🧠 Brainstorm**
  - [ ] Draws 3 cards
  - [ ] Puts 2 back on top
- [ ] **🕵️ Surveil 1**
  - [ ] Shows top card
  - [ ] Can keep or put in graveyard
- [ ] **⚡ Cascade**
  - [ ] Cascade mechanic works
- [ ] **🔀 Shuffle**
  - [ ] Library shuffles
- [ ] **⚰️ Mill 2**
  - [ ] Top 2 cards go to graveyard

---

### 9. Advanced Actions (6 buttons)

#### ⏳ Player Advanced Actions
- [ ] **🌍 Fetch Land** (Evolving Wilds)
  - [ ] Searches library for basic land
  - [ ] Panel closes after action
- [ ] **🌿 Cultivate**
  - [ ] Searches for lands
  - [ ] Puts one on battlefield, one in hand
  - [ ] Panel closes

#### ⏳ Discard Actions (4 buttons)
- [ ] **💀 Discard 1** (random)
  - [ ] Discards 1 random card
- [ ] **💀 Discard 2** (random)
  - [ ] Discards 2 random cards
- [ ] **💀 Discard All**
  - [ ] Empties hand to graveyard

---

### 10. Deck Management (8 buttons)

#### ⏳ Deck Selection Modal
- [ ] **Load Deck** (Player 1)
  - [ ] Loads selected deck for player
  - [ ] Deck name updates
- [ ] **Load Deck** (Player 2)
  - [ ] Loads selected deck for opponent
- [ ] **⭐ Set Default** (Player 1)
  - [ ] Sets current deck as default
  - [ ] Button state updates
- [ ] **✕ Clear Default** (Player 1)
  - [ ] Clears default deck
- [ ] **⭐ Set Default** (Player 2)
  - [ ] Sets opponent default deck
- [ ] **✕ Clear Default** (Player 2)
  - [ ] Clears opponent default
- [ ] **📁 Upload XML**
  - [ ] File picker opens
  - [ ] Can select XML file
  - [ ] Deck loads from XML

---

### 11. Test Buttons (3 buttons)

- [ ] **+Test GY** (Add test card to graveyard)
- [ ] **+Test Exile** (Add test card to exile)
- [ ] **+Test Creature** (Add test creature with counters)

---

### 12. Modal Interactions

#### ⏳ Deck Selection Modal
- [ ] Opens via **🎴 Decks** button
- [ ] Opens via deck name links (2 places)
- [ ] Closes via **✕** button
- [ ] Closes via backdrop click
- [ ] Closes via **Escape** key
- [ ] Content doesn't propagate clicks to backdrop

---

### 13. Mobile/Responsive

- [ ] **Mobile Overlay**
  - [ ] Opens on mobile
  - [ ] Closes when clicking overlay
  - [ ] Sidebar closes

---

### 14. File Triggers (2 buttons)

- [ ] **Choose Pre-defined Deck** button
  - [ ] Focuses deck search input
- [ ] **Upload Deck File** button
  - [ ] Triggers file upload button click

---

## ⌨️ Keyboard Navigation Testing

### 1. Tab Navigation
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible on all elements
- [ ] Tab order is logical (top to bottom, left to right)
- [ ] Can reach all buttons via Tab
- [ ] Shift+Tab works backwards

### 2. Keyboard Shortcuts
- [ ] **D** - Draw card
- [ ] **N** - New game (draw 7)
- [ ] **M** - Mulligan
- [ ] **P** - Pass turn
- [ ] **T** - End turn
- [ ] **U** - Untap all
- [ ] **C** - Combat
- [ ] **S** - Shuffle deck
- [ ] **?** - Show keyboard help overlay
  - [ ] Help overlay appears
  - [ ] Shows all shortcuts
  - [ ] Closes with button or Escape

### 3. Enter/Space on Buttons
- [ ] Tab to any button
- [ ] Press Enter → button activates
- [ ] Press Space → button activates

### 4. Escape Key
- [ ] Escape closes deck selection modal
- [ ] Escape closes keyboard help
- [ ] Escape closes other modals

### 5. Skip Link
- [ ] Tab from start of page
- [ ] Skip link appears
- [ ] Activating skip link jumps to main content

---

## 🔍 Accessibility Testing

### 1. ARIA Landmarks
- [ ] `<header role="banner">` present
- [ ] `<nav role="navigation">` present
- [ ] `<main role="main">` present
- [ ] `<aside role="complementary">` present
- [ ] Skip link targets `#main-content`

### 2. ARIA Labels
- [ ] All buttons have proper labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have labels
- [ ] Modals have `aria-modal="true"`

### 3. ARIA Live Regions
- [ ] Game log has `role="log"`
- [ ] Game log has `aria-live="polite"`
- [ ] Live region announces game events

### 4. Screen Reader Testing (NVDA/VoiceOver)
- [ ] Landmarks announced correctly
- [ ] Button labels read clearly
- [ ] Modal dialogs announced
- [ ] Game events announced in live region
- [ ] Focus management in modals

### 5. Color Contrast
- [ ] All text meets 4.5:1 minimum (WCAG AA)
- [ ] Large text meets 3:1 minimum
- [ ] UI components meet 3:1 minimum
- [ ] Run Lighthouse audit

---

## 🔒 Security Testing

### 1. CSP Verification
- [ ] Open browser DevTools Console
- [ ] Check for CSP violations
- [ ] **Expected:** 0 violations
- [ ] Verify CSP header: `script-src 'self'; style-src 'self';`

### 2. No Inline Event Handlers
- [ ] View page source
- [ ] Search for `onclick=`
  - [ ] **Expected:** 0 results
- [ ] Search for `oninput=`
  - [ ] **Expected:** 0 results
- [ ] Search for `onmouseenter=`
  - [ ] **Expected:** 0 results

### 3. Event System
- [ ] All buttons use `data-action` attributes
- [ ] Event listeners registered in console log
- [ ] No JavaScript errors in console

---

## 📊 Lighthouse Audit

### Run Audit
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Accessibility" category
4. Run audit

### Target Scores
- [ ] **Accessibility:** 90+ (was ~40%)
- [ ] **Performance:** No degradation
- [ ] **Best Practices:** No degradation
- [ ] **SEO:** No degradation

### Specific Checks
- [ ] All buttons have accessible names
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] ARIA attributes valid
- [ ] Landmarks present
- [ ] No console errors

---

## 🐛 Cross-Browser Testing

### Chrome
- [ ] All functionality works
- [ ] Keyboard nav works
- [ ] CSP enforced correctly

### Firefox
- [ ] All functionality works
- [ ] Keyboard nav works
- [ ] Visual consistency

### Edge
- [ ] All functionality works
- [ ] Keyboard nav works

### Safari (if available)
- [ ] All functionality works
- [ ] Keyboard nav works

---

## 🚨 Known Issues / Bugs

**Document any issues found during testing:**

1. Issue:
   - Description:
   - Steps to reproduce:
   - Expected behavior:
   - Actual behavior:
   - Severity: (Critical/High/Medium/Low)

---

## ✅ Testing Summary

**Total Test Cases:** ~200+

**Completed:**
- [ ] Functional testing (146 buttons/handlers)
- [ ] Keyboard navigation (all shortcuts + Tab)
- [ ] Accessibility (ARIA, landmarks, labels)
- [ ] Security (CSP, no inline handlers)
- [ ] Lighthouse audit (90+ score)
- [ ] Cross-browser testing

**Status:** ⏳ In Progress

---

## 🎯 Success Criteria

Phase 1 testing is complete when:

- ✅ All 146 replaced event handlers work correctly
- ✅ No CSP violations in console
- ✅ All keyboard shortcuts functional
- ✅ Tab navigation works for all interactive elements
- ✅ Skip link functional
- ✅ ARIA landmarks present
- ✅ Lighthouse Accessibility score 90+
- ✅ No JavaScript errors in console
- ✅ All modals open/close correctly
- ✅ All dropdowns toggle correctly

---

## 📝 Test Execution Notes

**Tester:**
**Date:**
**Browser:**
**Environment:**

**Notes:**

---

**Server URL:** http://localhost:3001/playhand-modern
**Console Check:** Open DevTools → Console tab → Look for "EventListenerManager initialized successfully"
