// Modern Deck Selector Functionality

let currentSelectedDeck = './decks/classic/affinity.xml';
let allDecks = [];
let currentCategory = 'all';

// Initialize deck selector when DOM is loaded
export function initDeckSelector() {
    // Populate all decks array from the HTML
    populateDecksFromHTML();

    // Setup event listeners
    setupEventListeners();

    // Show initial category
    showCategory('all');

    // Select first deck by default
    selectDeck('./decks/classic/affinity.xml');
}

function populateDecksFromHTML() {
    const deckItems = document.querySelectorAll('.deck-item');
    allDecks = Array.from(deckItems).map(item => ({
        path: item.getAttribute('data-path'),
        name: item.querySelector('.deck-name').textContent,
        type: item.querySelector('.deck-type').textContent,
        category: getDeckCategory(item),
        element: item
    }));
}

function getDeckCategory(deckElement) {
    const categorySection = deckElement.closest('.deck-category');
    if (!categorySection) return 'casual';

    if (categorySection.querySelector('.category-title').textContent.includes('Featured')) {
        return 'all';
    } else if (categorySection.querySelector('.category-title').textContent.includes('Legacy')) {
        return 'legacy';
    } else if (categorySection.querySelector('.category-title').textContent.includes('Limited')) {
        return 'limited';
    } else {
        return 'casual';
    }
}

function setupEventListeners() {
    // Category tabs
    const categoryTabs = document.querySelectorAll('.category-tab');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.getAttribute('data-category');
            showCategory(category);
            setActiveTab(tab);
        });
    });

    // Search functionality
    const searchInput = document.querySelector('.deck-search-input');
    const searchClear = document.querySelector('.deck-search-clear');

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', clearSearch);
    }

    // Deck selection
    const deckItems = document.querySelectorAll('.deck-item');
    deckItems.forEach(item => {
        item.addEventListener('click', () => {
            const deckPath = item.getAttribute('data-path');
            selectDeck(deckPath);
        });
    });
}

function showCategory(category) {
    currentCategory = category;

    // Hide all categories
    const allCategories = document.querySelectorAll('.deck-category');
    allCategories.forEach(cat => {
        cat.classList.remove('active');
    });

    if (category === 'all') {
        // Show all categories
        allCategories.forEach(cat => {
            cat.classList.add('active');
        });
    } else {
        // Show specific categories based on selection
        allCategories.forEach(cat => {
            const title = cat.querySelector('.category-title').textContent.toLowerCase();

            if ((category === 'legacy' && title.includes('legacy')) ||
                (category === 'limited' && title.includes('limited')) ||
                (category === 'casual' && (title.includes('casual') || title.includes('other')))) {
                cat.classList.add('active');
            }
        });
    }

    // Update search filter
    handleSearch();
}

function setActiveTab(activeTab) {
    const allTabs = document.querySelectorAll('.category-tab');
    allTabs.forEach(tab => tab.classList.remove('active'));
    activeTab.classList.add('active');
}

function handleSearch() {
    const searchTerm = document.querySelector('.deck-search-input').value.toLowerCase().trim();

    // Filter decks based on search term and category
    allDecks.forEach(deck => {
        const matchesSearch = !searchTerm ||
                              deck.name.toLowerCase().includes(searchTerm) ||
                              deck.type.toLowerCase().includes(searchTerm);

        const matchesCategory = currentCategory === 'all' ||
                                deck.category === currentCategory;

        // Show/hide deck item
        if (matchesSearch && (currentCategory === 'all' || matchesCategory)) {
            deck.element.style.display = 'block';
        } else {
            deck.element.style.display = 'none';
        }
    });

    // Hide empty categories
    const allCategories = document.querySelectorAll('.deck-category');
    allCategories.forEach(category => {
        const visibleDecks = category.querySelectorAll('.deck-item[style*="block"], .deck-item:not([style*="none"])');
        const hasVisibleDecks = Array.from(visibleDecks).some(deck =>
            !deck.style.display || deck.style.display !== 'none'
        );

        if (hasVisibleDecks) {
            category.style.display = 'block';
        } else {
            category.style.display = 'none';
        }
    });
}

function clearSearch() {
    const searchInput = document.querySelector('.deck-search-input');
    if (searchInput) {
        searchInput.value = '';
        handleSearch();
        searchInput.focus();
    }
}

function selectDeck(deckPath) {
    currentSelectedDeck = deckPath;

    // Update visual selection
    const allItems = document.querySelectorAll('.deck-item');
    allItems.forEach(item => {
        item.classList.remove('selected');
        if (item.getAttribute('data-path') === deckPath) {
            item.classList.add('selected');
        }
    });

    // Update hidden form select for compatibility
    const hiddenSelect = document.getElementById('hiddenDeckSelect');
    if (hiddenSelect) {
        // Clear existing options
        hiddenSelect.innerHTML = '';

        // Add selected option
        const option = document.createElement('option');
        option.value = deckPath;
        option.selected = true;

        // Get deck name from path
        const deckName = deckPath.split('/').pop().replace('.xml', '');
        option.textContent = deckName;
        hiddenSelect.appendChild(option);

        // Trigger change event for compatibility
        const changeEvent = new globalThis.Event('change', { bubbles: true });
        hiddenSelect.dispatchEvent(changeEvent);
    }

    // Update any legacy form references
    const legacyForm = document.forms['formDecks'];
    if (legacyForm && legacyForm.elements['selectDeck']) {
        legacyForm.elements['selectDeck'].value = deckPath;
    }

    // Emit custom event for other scripts
    const deckSelectedEvent = new globalThis.CustomEvent('deckSelected', {
        detail: { deckPath, deckName: getDeckNameFromPath(deckPath) }
    });
    document.dispatchEvent(deckSelectedEvent);
}

function getDeckNameFromPath(path) {
    return path.split('/').pop().replace('.xml', '');
}

// Export functions for external use
export function getSelectedDeck() {
    return currentSelectedDeck;
}

export function selectDeckByName(deckName) {
    const deck = allDecks.find(d => d.name.toLowerCase().includes(deckName.toLowerCase()));
    if (deck) {
        selectDeck(deck.path);
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDeckSelector);
} else {
    initDeckSelector();
}