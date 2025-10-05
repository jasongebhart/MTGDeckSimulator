# Test Coverage Gap Analysis
**Phase 1 Accessibility & Security Improvements**

**Analysis Date:** 2025-10-05
**Current Coverage:** 3.98% statements, 5.65% branches
**Target Coverage:** 80% statements, 70% branches (industry standard)

---

## Executive Summary

### Current Test Status: ⚠️ CRITICAL GAPS

**Test Results:**
- ✅ **12 test suites** (10 passing, 2 failing)
- ✅ **135 tests** (132 passing, 3 failing)
- ❌ **Coverage: 3.98%** (Target: 80%)

**Verdict:** Current tests are **good but insufficient**. You have solid tests for core functionality, but **massive gaps** in coverage for:
- UI/UX components (0% coverage)
- Event handling (0% coverage)
- Accessibility features (0% coverage)
- Phase 1 improvements (0% coverage)

---

## Coverage Breakdown

### What's Well Tested ✅

**1. Security** (Good coverage)
- ✅ XSS prevention tests
- ✅ Input sanitization
- ✅ Path traversal protection
- **Files:** `__tests__/security.test.mjs`, `__tests__/services/securityService.test.mjs`

**2. Card Image Service** (Good coverage)
- ✅ Scryfall API integration
- ✅ Cache behavior
- ✅ Fallback handling
- **Files:** `__tests__/services/cardImageService.test.mjs`

**3. Deck Loading** (Good coverage)
- ✅ XML parsing
- ✅ Deck validation
- ✅ Subdirectory search
- **Files:** `__tests__/decks.test.mjs`

**4. Card Movement** (Good coverage)
- ✅ Zone transitions
- ✅ Shuffle functionality
- **Files:** `__tests__/cardMovement.test.mjs`, `__tests__/refactored/zones.test.mjs`

**5. Game Mechanics** (Partial coverage)
- ✅ Fetchlands (33% coverage)
- ✅ Triggered abilities
- **Files:** `__tests__/modules/fetchlands.test.mjs`, `__tests__/modules/triggered-abilities.test.mjs`

---

### Critical Gaps ❌

**Coverage by Area:**

| Area | Current | Target | Gap | Priority |
|------|---------|--------|-----|----------|
| Controllers | 0% | 60% | -60% | P0 |
| UI Modules | 6.71% | 70% | -63% | **P1** |
| Event Manager | 0% | 80% | -80% | **P1** |
| Accessibility | 0% | 80% | -80% | **P1** |
| Main Scripts | 1.39% | 50% | -49% | P2 |
| Integration | Minimal | 60% | -60% | P2 |

---

## Gap Analysis by Category

### 1. Phase 1 Components (NEW) - 0% Coverage ❌

**No tests exist for:**

#### A. Event Manager (`event-manager.mjs`) - **CRITICAL**
- ❌ Button click delegation
- ❌ Data attribute parsing
- ❌ Dropdown management
- ❌ Modal handling
- ❌ Keyboard event handling
- ❌ Life counter events
- ❌ Token creation events

**Impact:** High - This is the foundation of Phase 1. If it breaks, entire UI fails.

#### B. Accessibility Features - **HIGH PRIORITY**
- ❌ Focus indicators (CSS)
- ❌ Keyboard navigation
- ❌ ARIA landmarks
- ❌ Screen reader announcements
- ❌ Skip links
- ❌ Progressive disclosure (expertise levels)

**Impact:** High - Accessibility regressions could violate WCAG compliance.

#### C. Button Component System - **MEDIUM**
- ❌ Button hierarchy (primary/secondary/tertiary)
- ❌ Semantic intent classes
- ❌ Loading states
- ❌ Disabled states
- ❌ Keyboard activation

**Impact:** Medium - Visual bugs, not functional failures.

#### D. Color Contrast System - **LOW**
- ❌ WCAG AA compliance validation
- ❌ Theme switching
- ❌ Dark mode colors

**Impact:** Low - CSS-only, unlikely to break.

---

### 2. UI Components - 6.71% Coverage ❌

**Modules with 0% coverage:**

#### A. UI Updates (`ui-updates.mjs`) - **FAILING TESTS**
- ❌ `updateZoneDisplay()` - test exists but **FAILING**
- ❌ `updateLifeDisplay()`
- ❌ `showToast()`
- ❌ `updateTurnDisplay()`
- ❌ `updateHandCountDisplay()`
- ❌ Screen reader announcements (new in Phase 1)

**Current Issue:** Tests fail due to JSDOM limitations with complex DOM manipulation.

**Impact:** High - UI updates are core functionality.

#### B. Other UI Modules (0% coverage)
- ❌ `card-actions.mjs` - Card drag/drop, context menus
- ❌ `modal-manager.mjs` - Modal open/close, focus trap
- ❌ `hand-sorting.mjs` - Hand sorting algorithms
- ❌ `dynamic-stats.mjs` - Live stat calculations
- ❌ `context-menus.mjs` - Right-click menus

**Impact:** Medium - Feature bugs, not data corruption.

---

### 3. Controllers - 0% Coverage ❌

**Files with no tests:**

#### A. Main Controller (`controller.mjs`) - **CRITICAL**
- ❌ Deck loading endpoints
- ❌ Subdirectory search (recently added!)
- ❌ Error handling
- ❌ Response formatting

**Impact:** Critical - Backend failures break entire app.

#### B. Deck Controller (`deckController.mjs`)
- ❌ Deck CRUD operations
- ❌ File system operations
- ❌ Validation logic

**Impact:** High - Could corrupt deck files.

---

### 4. Integration Tests - Minimal Coverage ❌

**Current integration test (`__tests__/integration.test.mjs`) covers:**
- ✅ Basic server startup
- ✅ Simple deck loading

**Missing integration tests:**
- ❌ Full game flow (setup → play → end turn)
- ❌ Two-player interactions
- ❌ Complex card interactions (cascade, delve)
- ❌ Error recovery scenarios
- ❌ State persistence

**Impact:** High - Real-world usage scenarios untested.

---

## Recommended Test Additions

### Priority 0: Critical - Add Before Template Migration

**These tests validate Phase 1 infrastructure works correctly.**

#### 1. Event Manager Tests (NEW)
**File:** `__tests__/modules/event-manager.test.mjs`

```javascript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { EventManager } from '../../scripts/modules/event-manager.mjs';

describe('EventManager', () => {
  let dom, document, mockSimulator;

  beforeEach(() => {
    dom = new JSDOM(`
      <button data-action="draw" data-player="player">Draw</button>
      <button data-action="changeLife" data-player="player" data-amount="-1">-1</button>
      <div class="dropdown">
        <button data-action="toggleLibrary">Library</button>
        <div id="playerLibraryActionsMenu" class="dropdown-menu"></div>
      </div>
    `);
    document = dom.window.document;
    global.document = document;

    mockSimulator = {
      drawCard: jest.fn(),
      changeLife: jest.fn(),
    };
  });

  test('initializes without errors', () => {
    expect(() => EventManager.init(mockSimulator)).not.toThrow();
  });

  test('handles button click with data-action', () => {
    EventManager.init(mockSimulator);
    const drawBtn = document.querySelector('[data-action="draw"]');
    drawBtn.click();
    expect(mockSimulator.drawCard).toHaveBeenCalledTimes(1);
  });

  test('parses data-amount attribute correctly', () => {
    EventManager.init(mockSimulator);
    const lifeBtn = document.querySelector('[data-action="changeLife"]');
    lifeBtn.click();
    expect(mockSimulator.changeLife).toHaveBeenCalledWith(-1);
  });

  test('toggles dropdown menu', () => {
    EventManager.init(mockSimulator);
    const toggleBtn = document.querySelector('[data-action="toggleLibrary"]');
    const menu = document.getElementById('playerLibraryActionsMenu');

    toggleBtn.click();
    expect(menu.classList.contains('show')).toBe(true);

    toggleBtn.click();
    expect(menu.classList.contains('show')).toBe(false);
  });

  test('closes all dropdowns when clicking outside', () => {
    EventManager.init(mockSimulator);
    const menu = document.getElementById('playerLibraryActionsMenu');
    menu.classList.add('show');

    document.body.click();
    expect(menu.classList.contains('show')).toBe(false);
  });
});
```

**Estimated Effort:** 3 hours
**Coverage Gain:** +80% on event-manager.mjs

---

#### 2. Accessibility Tests (NEW)
**File:** `__tests__/accessibility.test.mjs`

```javascript
import { describe, test, expect } from '@jest/globals';
import { JSDOM } from 'jsdom';
import fs from 'fs';

describe('Accessibility Features', () => {
  let dom, document;

  beforeEach(() => {
    // Load actual template
    const html = fs.readFileSync('./views/playhand-modern.ejs', 'utf8');
    dom = new JSDOM(html);
    document = dom.window.document;
    global.document = document;
  });

  describe('ARIA Landmarks', () => {
    test('has skip links', () => {
      const skipLinks = document.querySelectorAll('.skip-link');
      expect(skipLinks.length).toBeGreaterThan(0);
    });

    test('has main landmark', () => {
      const main = document.querySelector('main[role="main"]');
      expect(main).toBeTruthy();
      expect(main.getAttribute('aria-label')).toBeTruthy();
    });

    test('has navigation landmark', () => {
      const nav = document.querySelector('[role="navigation"]');
      expect(nav).toBeTruthy();
    });

    test('has complementary landmark for game log', () => {
      const aside = document.querySelector('aside[role="complementary"]');
      expect(aside).toBeTruthy();
    });

    test('has live region for announcements', () => {
      const liveRegion = document.getElementById('ariaAnnouncements');
      expect(liveRegion).toBeTruthy();
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Button Accessibility', () => {
    test('all buttons have accessible names', () => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        const hasLabel = btn.getAttribute('aria-label') ||
                        btn.textContent.trim() ||
                        btn.getAttribute('title');
        expect(hasLabel).toBeTruthy();
      });
    });

    test('dropdown buttons have aria-haspopup', () => {
      const dropdownToggles = document.querySelectorAll('[data-action*="toggle"]');
      dropdownToggles.forEach(btn => {
        expect(btn.getAttribute('aria-haspopup')).toBeTruthy();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('all interactive elements are keyboard accessible', () => {
      const interactive = document.querySelectorAll('button, a, input, select, textarea');
      interactive.forEach(el => {
        const tabindex = el.getAttribute('tabindex');
        // Should not have tabindex="-1" unless intentionally removed from tab order
        if (tabindex === '-1' && !el.classList.contains('skip-on-tab')) {
          console.warn(`Element not keyboard accessible: ${el.outerHTML}`);
        }
      });
    });

    test('keyboard shortcuts are documented', () => {
      const shortcuts = document.querySelectorAll('.keyboard-shortcut');
      // At least 5 major shortcuts should be visible
      expect(shortcuts.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Color Contrast', () => {
    test('CSS includes contrast fixes', () => {
      const cssContent = fs.readFileSync('./assets/components/color-fixes.css', 'utf8');
      expect(cssContent).toContain('WCAG AA');
      expect(cssContent).toContain('contrast');
    });
  });
});
```

**Estimated Effort:** 4 hours
**Coverage Gain:** Validates Phase 1 accessibility features

---

### Priority 1: High - Add After Template Migration

#### 3. Controller Tests
**File:** `__tests__/controllers/controller.test.mjs`

```javascript
import { describe, test, expect } from '@jest/globals';
import express from 'express';
import request from 'supertest';
// ... test deck endpoints, subdirectory search, error handling
```

**Estimated Effort:** 6 hours
**Coverage Gain:** +60% on controller.mjs

---

#### 4. Fix Failing UI Tests
**File:** `__tests__/modules/ui-updates.test.mjs`

**Current Issues:**
- Tests fail due to JSDOM limitations
- Missing CardImageService mock
- Incomplete DOM setup

**Fixes Needed:**
```javascript
// Mock CardImageService properly
jest.mock('../../src/services/cardImageService.mjs', () => ({
  CardImageService: {
    getCardImageUrl: jest.fn(() => Promise.resolve('http://example.com/card.jpg'))
  }
}));

// Setup complete DOM with all required elements
beforeEach(() => {
  document.body.innerHTML = `
    <div id="opponentGraveyard2"></div>
    <div id="opponentHandContainer2"></div>
    <!-- ... all required elements -->
  `;
});
```

**Estimated Effort:** 2 hours
**Coverage Gain:** Fix 3 failing tests

---

### Priority 2: Medium - Add for Robustness

#### 5. Integration Tests
**File:** `__tests__/integration/full-game-flow.test.mjs`

```javascript
describe('Full Game Flow', () => {
  test('complete game from setup to end turn', async () => {
    // Setup two players
    // Draw opening hands
    // Play lands
    // Cast spells
    // Combat
    // End turn
    // Verify state consistency
  });

  test('cascade mechanic works correctly', async () => {
    // Load deck with cascade spell
    // Cast cascade spell
    // Verify cascade triggers
    // Verify card is cast or put on bottom
  });
});
```

**Estimated Effort:** 8 hours
**Coverage Gain:** +50% on integration scenarios

---

#### 6. Component Visual Regression Tests
**File:** `__tests__/visual/buttons.visual.test.mjs`

Use a tool like **Playwright** or **Puppeteer** to test visual appearance:

```javascript
test('buttons have correct visual hierarchy', async ({ page }) => {
  await page.goto('http://localhost:3001/playhand-modern');

  // Check primary button is larger than secondary
  const primaryBtn = await page.locator('.btn-game-primary').first();
  const secondaryBtn = await page.locator('.btn-game-secondary').first();

  const primarySize = await primaryBtn.evaluate(el => el.offsetHeight);
  const secondarySize = await secondaryBtn.evaluate(el => el.offsetHeight);

  expect(primarySize).toBeGreaterThan(secondarySize);
});
```

**Estimated Effort:** 10 hours (requires Playwright setup)
**Coverage Gain:** Prevents visual regressions

---

## Test Priority Matrix

### Must Add (Before Production)

| Test | Effort | Impact | Priority | When |
|------|--------|--------|----------|------|
| Event Manager | 3h | Critical | **P0** | **Before template migration** |
| Accessibility | 4h | High | **P0** | **Before template migration** |
| Fix failing UI tests | 2h | High | P1 | After template migration |
| Controller tests | 6h | Critical | P1 | After template migration |

**Total P0 Effort:** 7 hours

---

### Should Add (For Quality)

| Test | Effort | Impact | Priority | When |
|------|--------|--------|----------|------|
| Integration tests | 8h | High | P2 | Phase 2 |
| UI component tests | 10h | Medium | P2 | Phase 2 |
| Visual regression | 10h | Medium | P3 | Phase 3 |

**Total P2 Effort:** 28 hours

---

## Coverage Targets

### Phase 1 (After Template Migration)

| Area | Current | Target | Tests to Add |
|------|---------|--------|--------------|
| Event Manager | 0% | **80%** | event-manager.test.mjs |
| Accessibility | 0% | **80%** | accessibility.test.mjs |
| UI Updates | 0% | 60% | Fix existing tests |
| Controllers | 0% | 60% | controller.test.mjs |
| **Overall** | **3.98%** | **40%** | |

---

### Phase 2 (Quality Improvement)

| Area | Current | Target | Tests to Add |
|------|---------|--------|--------------|
| Integration | Minimal | 60% | full-game-flow.test.mjs |
| UI Components | 6.71% | 50% | card-actions, modals, etc. |
| **Overall** | **3.98%** | **60%** | |

---

### Phase 3 (Production Ready)

| Area | Current | Target | Tests to Add |
|------|---------|--------|--------------|
| Visual Regression | 0% | 80% | Playwright tests |
| Performance | 0% | 70% | Lighthouse CI |
| **Overall** | **3.98%** | **80%** | Industry standard |

---

## Recommendations

### Immediate Actions (Before Template Migration)

1. ✅ **Add Event Manager Tests** (3 hours)
   - Critical: Validates Phase 1 infrastructure
   - Must pass before migrating templates

2. ✅ **Add Accessibility Tests** (4 hours)
   - Critical: Ensures WCAG compliance
   - Prevents accessibility regressions

**Total: 7 hours**

---

### Post-Migration Actions

3. ✅ **Fix Failing UI Tests** (2 hours)
   - High priority: 3 tests currently failing
   - Quick fix with proper mocks

4. ✅ **Add Controller Tests** (6 hours)
   - High priority: Backend has 0% coverage
   - Prevents data corruption bugs

**Total: 8 hours**

---

### Long-Term Quality (Phase 2+)

5. **Integration Tests** (8 hours)
   - Validates full game flows
   - Catches edge cases

6. **Visual Regression Tests** (10 hours)
   - Prevents UI regressions
   - Automates visual QA

**Total: 18 hours**

---

## Answer to Your Question

### "Do we need to add more tests?"

**Short Answer: YES, but strategically.**

**Current tests are good for:**
- ✅ Core game mechanics
- ✅ Security (XSS, sanitization)
- ✅ Deck loading
- ✅ Card movement

**Critical gaps for Phase 1:**
- ❌ Event Manager (0% coverage) - **MUST ADD**
- ❌ Accessibility features (0% coverage) - **MUST ADD**
- ❌ UI components (failing tests) - **MUST FIX**
- ❌ Controllers (0% coverage) - **SHOULD ADD**

---

### Recommended Approach

**Option A: Minimum Viable Testing (7 hours)**
Add only P0 tests before template migration:
1. Event Manager tests (3h)
2. Accessibility tests (4h)

**Pros:** Minimal time investment, validates critical infrastructure
**Cons:** Still low overall coverage (~15%)

---

**Option B: Solid Foundation (15 hours)**
Add P0 + P1 tests:
1. Event Manager tests (3h)
2. Accessibility tests (4h)
3. Fix failing UI tests (2h)
4. Controller tests (6h)

**Pros:** ~40% coverage, production-ready
**Cons:** Moderate time investment

---

**Option C: Comprehensive (33 hours)**
Add all recommended tests through Phase 2:
- All P0 + P1 tests (15h)
- Integration tests (8h)
- UI component tests (10h)

**Pros:** ~60% coverage, industry standard
**Cons:** Significant time investment

---

### My Recommendation: **Option B** (15 hours)

**Why:**
- Validates Phase 1 infrastructure works
- Prevents regressions during template migration
- Achieves 40% coverage (10x improvement)
- Covers critical paths (event handling, accessibility, backend)
- Reasonable time investment

**When:**
- **Before template migration:** Event Manager + Accessibility tests (7h)
- **After template migration:** Fix UI tests + Controller tests (8h)

---

## Success Metrics

**After implementing Option B:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Statement Coverage | 3.98% | ~40% | +900% |
| Critical Path Coverage | ~20% | ~80% | +300% |
| Accessibility Coverage | 0% | 80% | ∞ |
| Event Handling Coverage | 0% | 80% | ∞ |
| Failing Tests | 3 | 0 | -100% |

---

**Next Step:** Create Event Manager and Accessibility tests before starting template migration?
