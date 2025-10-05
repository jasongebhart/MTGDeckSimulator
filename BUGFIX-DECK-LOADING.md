# Bug Fix: Deck Loading from Subdirectories

**Date:** 2025-10-04
**Issue:** Decks in subdirectories (legacy/, Brothers_War/, crimson_vow/) failed to load with 404 errors
**Status:** ✅ FIXED

---

## Problems Fixed

### 1. Method Name Mismatch
**Issue:** `deck-loader.mjs` called `this.gameState.resetGame()` but the method is `resetState()`
**Error:** `TypeError: this.gameState.resetGame is not a function`

**Fix:** Changed line 163 in `deck-loader.mjs`:
```javascript
// Before
this.gameState.resetGame();

// After
this.gameState.resetState();
```

---

### 2. Subdirectory Deck Loading
**Issue:** API endpoint only searched in `xml/` directory, not subdirectories
**Error:** 404 for decks like `Red-Delver.xml` (in `xml/legacy/`) and `Limited-BrothersWar.xml` (in `xml/Brothers_War/`)

**Fix:** Updated `controllers/controller.mjs` lines 206-227:
- Frontend extracts just filename: `Red-Delver.xml`
- Backend searches main `xml/` folder first
- If not found, searches subdirectories: `legacy/`, `Brothers_War/`, `crimson_vow/`
- Loads first match found

**Frontend change** (`deck-loader.mjs` line 121):
```javascript
// Extract just the filename - backend will search subdirectories
const filename = deckPath.split('/').pop();
```

**Backend change** (`controller.mjs` lines 215-227):
```javascript
if (!fs.existsSync(deckPath)) {
  // Search in subdirectories
  const subdirs = ['legacy', 'Brothers_War', 'crimson_vow'];
  for (const subdir of subdirs) {
    const subdirPath = path.join('xml', subdir, filename);
    if (fs.existsSync(subdirPath)) {
      deckPath = subdirPath;
      break;
    }
  }
}
```

---

### 3. Content Security Policy Blocking Page Load
**Issue:** Strict CSP blocked inline styles and scripts in EJS templates
**Error:** `Refused to execute inline script/style because it violates CSP directive`
**Result:** Blank screen, no content displayed

**Fix:** Temporarily relaxed CSP in `startapp.mjs` line 17:
```javascript
// Before
script-src 'self'; style-src 'self';

// After (temporary - needs refactoring)
script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

**Added TODO comment:**
```javascript
// TODO: Refactor to remove inline styles and onclick handlers, then tighten CSP
```

---

### 4. Server Process Not Reloading
**Issue:** Old server process remained running even after code changes
**Symptom:** Updated code didn't take effect, console.log statements didn't appear

**Fix:**
- Killed process by PID: `taskkill //F //PID <pid>`
- Found PID via: `netstat -ano | findstr :3001 | findstr LISTENING`

---

## Testing Performed

✅ **Affinity deck** - Loads from `xml/affinity.xml` (root directory)
✅ **Red Delver deck** - Loads from `xml/legacy/Red-Delver.xml` (subdirectory)
✅ **Brothers War deck** - Loads from `xml/Brothers_War/Limited-BrothersWar.xml` (subdirectory)
✅ **CSP errors** - Resolved by allowing unsafe-inline temporarily
✅ **Page rendering** - Game UI displays correctly with hand, battlefield, etc.

---

## Server Logs Working

Console now shows deck loading process:
```
Looking for deck: Red-Delver.xml
Checking: xml\legacy\Red-Delver.xml
Found in subdirectory: legacy
Loading deck from: xml\legacy\Red-Delver.xml
```

---

## Cache Busting

Added version parameters to force browser cache refresh:
```javascript
// playhand-modern-refactored.mjs lines 22-25
import { DeckLoader } from './modules/deck-loader.mjs?v=3';
import { CardActions } from './modules/card-actions.mjs?v=3';
import { HandSorting } from './modules/hand-sorting.mjs?v=3';
import { ModalManager } from './modules/modal-manager.mjs?v=3';
```

Increment version number when making changes to these modules to force browser reload.

---

## Known Technical Debt

### 1. Inline Styles and Scripts
**Issue:** EJS templates contain inline `style=""` attributes and `onclick=""` handlers
**Impact:** Requires `'unsafe-inline'` in CSP, reducing security
**Solution:**
- Move all inline styles to CSS classes in stylesheets
- Replace onclick handlers with proper event listeners
- Tighten CSP back to not allow unsafe-inline

**Examples:**
```html
<!-- Bad: Inline styles and handlers -->
<button onclick="doSomething()" style="padding: 6px;">Click</button>

<!-- Good: CSS classes and event listeners -->
<button class="btn-action" id="myButton">Click</button>
<script>
  document.getElementById('myButton').addEventListener('click', doSomething);
</script>
```

### 2. Subdirectory Search List
**Issue:** Hardcoded subdirectory list in `controller.mjs`
**Current:** `['legacy', 'Brothers_War', 'crimson_vow']`
**Solution:** Dynamically scan `xml/` for subdirectories on server start

### 3. Debug Logging
**Issue:** Added many `console.log` statements for debugging
**Solution:** Remove or convert to proper logging framework with log levels

---

## Files Modified

1. **scripts/modules/deck-loader.mjs**
   - Line 163: Fixed `resetGame()` → `resetState()`
   - Line 121: Extract filename for backend search
   - Added debug logging (lines 11, 20, 122, 158, 162, 164)

2. **controllers/controller.mjs**
   - Lines 206-238: Added subdirectory search logic
   - Added debug logging for deck loading process

3. **startapp.mjs**
   - Lines 14-17: Relaxed CSP to allow unsafe-inline (temporary)
   - Added TODO comment for future refactoring

4. **scripts/playhand-modern-refactored.mjs**
   - Lines 22-25: Added cache-busting version parameters (?v=3)

---

## Summary

All deck loading issues have been **completely resolved**:

✅ Decks load from subdirectories successfully
✅ Method name mismatch fixed (`resetState` vs `resetGame`)
✅ CSP configured to allow page rendering
✅ Server logs show deck loading process
✅ Cache busting prevents stale JavaScript

**Next Steps:**
- Remove inline styles/scripts from templates (Priority 3 refactoring)
- Tighten CSP back to secure defaults
- Add dynamic subdirectory scanning
- Clean up debug logging

The application is now fully functional! 🎉
