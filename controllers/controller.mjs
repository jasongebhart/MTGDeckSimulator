// controller.js

// XML loading functions available but not used in controller
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';

// Security validation functions
function isValidXML(xmlText) {
  try {
    // Basic XML structure validation
    if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
      return false;
    }

    // Basic validation - check for proper XML tags
    const hasOpeningTag = xmlText.includes('<');
    const hasClosingTag = xmlText.includes('>');

    return hasOpeningTag && hasClosingTag;
  } catch {
    return false;
  }
}

function containsXXEPatterns(xmlText) {
  const xxePatterns = [
    /<!ENTITY/i, // Entity declarations
    /<!DOCTYPE.*\[/i, // DOCTYPE with internal subset
    /SYSTEM\s+["']file:/i, // External file references
    /SYSTEM\s+["']http/i, // External HTTP references
    /SYSTEM\s+["']ftp/i, // External FTP references
    /PUBLIC\s+.*SYSTEM/i, // Public external references
    /&#x[0-9a-fA-F]+;/, // Hex character references (potential bypass)
    /&#[0-9]+;/, // Decimal character references (potential bypass)
  ];

  return xxePatterns.some(pattern => pattern.test(xmlText));
}

// Function to set up routes for the Express app
export function setupRoutes(app) {
  // Modern routes (primary paths)
  const modernRoutes = [
    { path: '/', template: 'decks-modern' }, // Root now redirects to modern deck view
    { path: '/decks', template: 'decks-modern' },
    { path: '/decks-modern', template: 'decks-modern' }, // Keep explicit modern URL
    { path: '/playhand', template: 'playhand-modern' },
    { path: '/playhand-modern', template: 'playhand-modern' }, // Keep explicit modern URL
    { path: '/handsimulation', template: 'handsimulation' },
    { path: '/alldecks', template: 'alldecks' },
    { path: '/create-deck-form', template: 'create-deck-form' },
  ];

  // Legacy routes (with /legacy prefix)
  const legacyRoutes = [
    { path: '/legacy/decks', template: 'legacy/decks' },
    { path: '/legacy/playhand', template: 'legacy/playhand' },
    { path: '/legacy/handsimulation', template: 'legacy/handsimulation' },
    { path: '/legacy/alldecks', template: 'legacy/alldecks' },
    { path: '/legacy/create-deck-form', template: 'legacy/create-deck-form' },
  ];

  // Authentication routes
  const authRoutes = [
    { path: '/login', template: 'login' },
    { path: '/logout', template: 'logout' },
  ];

  // Combine all routes
  const routes = [...modernRoutes, ...legacyRoutes, ...authRoutes];

  // Set up the routes using a loop
  routes.forEach(route => {
    app.get(route.path, (req, res) => {
      res.render(route.template); // Render the specified template
    });
  });

  const storage = multer.memoryStorage(); // Store the uploaded file in memory
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1 * 1024 * 1024, // 5 MB maximum file size
    },
    fileFilter: (req, file, cb) => {
      const allowedExtensions = ['xml'];

      // Get the file extension by splitting the original file name
      const fileExtension = file.originalname.split('.').pop().toLowerCase();

      if (allowedExtensions.includes(fileExtension)) {
        cb(null, true); // File is allowed
      } else {
        cb(new Error('Invalid file type. Only .xml files are allowed.'), false);
      }
    },
  });

  app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Use environment variables for credentials in production
    const validUsername = process.env.APP_USERNAME || 'admin';
    const validPassword = process.env.APP_PASSWORD || 'change-me-in-production';

    // In production, use proper password hashing (bcrypt)
    if (username === validUsername && password === validPassword) {
      req.session.user = username;
      res.redirect('/dashboard');
    } else {
      // Add rate limiting and logging for failed attempts in production
      console.log(`Failed login attempt for username: ${username} from IP: ${req.ip}`);
      res.redirect('/login?error=invalid');
    }
  });

  app.get('/dashboard', (req, res) => {
    if (req.session.user) {
      // User is logged in, and you can access their session data
      const username = req.session.user;
      res.render('dashboard', { username }); // Render the dashboard with user-specific data
    } else {
      // User is not logged in, redirect to the login page
      //const username = 'testuser';
      //res.render('dashboard', { username });
      res.redirect('/login');
    }
  });
  app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error(err);
      } else {
        console.log('Session has been destroyed.');
      }
      res.redirect('/login'); // Redirect to the login page after logout
    });
  });

  // Authentication middleware
  const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // New route for processing deck creation - now requires authentication
  app.post('/create-deck', requireAuth, upload.single('XMLFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }

      // Access the uploaded file's content (in this case, as a buffer)
      const XMLFileBuffer = req.file.buffer;
      const xmlText = XMLFileBuffer.toString('utf8');

      // Validate XML content for security
      if (!isValidXML(xmlText)) {
        return res.status(400).send('Invalid XML format.');
      }

      // Check for XXE attack patterns
      if (containsXXEPatterns(xmlText)) {
        console.log(`Potential XXE attack detected from IP: ${req.ip}`);
        return res.status(400).send('XML contains forbidden content.');
      }

      // Process the uploaded file content (XMLFileBuffer) as needed
      console.log('Original file name:', req.file.originalname);
      console.log('File size:', req.file.size, 'bytes');

      // Your custom processing code here

      // Send a success status code (201) back to the client
      res.sendStatus(201);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while processing the deck creation request.');
    }
  });

  // API Routes for Modern UI
  // Load predefined deck by filename
  app.get('/api/v1/decks/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const deckPath = path.join('xml', filename);

      // Check if file exists and has .xml extension
      if (!fs.existsSync(deckPath) || !filename.toLowerCase().endsWith('.xml')) {
        return res.status(404).json({
          success: false,
          error: { message: 'Deck not found' }
        });
      }

      const xmlContent = fs.readFileSync(deckPath, 'utf8');

      // Parse XML
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@',
        parseAttributeValue: true
      });

      const parsedData = parser.parse(xmlContent);
      const deckData = processDeckData(parsedData, filename);

      res.json({
        success: true,
        data: deckData
      });

    } catch (error) {
      console.error('Error loading deck:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to load deck file' }
      });
    }
  });

  // Upload deck file endpoint
  app.post('/api/v1/decks/upload', upload.single('deckFile'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' }
        });
      }

      const xmlContent = req.file.buffer.toString('utf8');

      // Validate XML content for security
      if (!isValidXML(xmlContent)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid XML format' }
        });
      }

      // Check for XXE attack patterns
      if (containsXXEPatterns(xmlContent)) {
        console.log(`Potential XXE attack detected from IP: ${req.ip}`);
        return res.status(400).json({
          success: false,
          error: { message: 'XML contains forbidden content' }
        });
      }

      // Parse XML
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@',
        parseAttributeValue: true
      });

      const parsedData = parser.parse(xmlContent);
      const deckData = processDeckData(parsedData, req.file.originalname);

      res.json({
        success: true,
        data: deckData
      });

    } catch (error) {
      console.error('Error processing uploaded deck:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Failed to process deck file' }
      });
    }
  });
}

// Helper function to process deck data
function processDeckData(parsedData, filename) {
  const deckName = filename.replace('.xml', '').replace(/([A-Z])/g, ' $1').trim();

  // Extract cards from various possible XML structures
  let cards = [];

  // Handle different XML structures
  if (parsedData.Decklist && parsedData.Decklist.Card) {
    // Structure: <Decklist><Card>...</Card></Decklist>
    cards = Array.isArray(parsedData.Decklist.Card) ? parsedData.Decklist.Card : [parsedData.Decklist.Card];
  } else if (parsedData.deck && parsedData.deck.card) {
    // Structure: <deck><card>...</card></deck>
    cards = Array.isArray(parsedData.deck.card) ? parsedData.deck.card : [parsedData.deck.card];
  } else if (parsedData.cards && parsedData.cards.card) {
    // Structure: <cards><card>...</card></cards>
    cards = Array.isArray(parsedData.cards.card) ? parsedData.cards.card : [parsedData.cards.card];
  } else if (parsedData.Card) {
    // Structure: <Card>...</Card> (root level)
    cards = Array.isArray(parsedData.Card) ? parsedData.Card : [parsedData.Card];
  }

  // Process cards and calculate statistics
  const processedCards = cards.map(card => ({
    name: card.Name || card.name || card['@name'] || 'Unknown',
    quantity: parseInt(card.Quantity || card.quantity || card['@quantity'] || 1),
    cost: card.Cost || card.cost || card.manacost || card['@cost'] || '',
    type: card.Type || card.type || card.cardtype || card['@type'] || ''
  }));

  const statistics = calculateDeckStatistics(processedCards);

  return {
    deck: {
      name: deckName,
      cards: processedCards,
      totalCards: processedCards.reduce((sum, card) => sum + card.quantity, 0)
    },
    statistics
  };
}

// Helper function to calculate deck statistics
function calculateDeckStatistics(cards) {
  let creatures = 0;
  let spells = 0;
  let lands = 0;
  let totalCost = 0;
  let totalCards = 0;
  let cardsWithCost = 0;

  // Enhanced statistics
  const manaCurve = {};
  const colorDistribution = {};
  const cardTypeDetails = {
    creatures: 0,
    spells: 0,
    lands: 0,
    artifacts: 0,
    planeswalkers: 0,
    enchantments: 0,
    other: 0
  };

  cards.forEach(card => {
    const quantity = card.quantity || 1;
    totalCards += quantity;

    const type = (card.type || '').toLowerCase();

    // Categorize by type with more detail
    if (type.includes('creature')) {
      creatures += quantity;
      cardTypeDetails.creatures += quantity;
    } else if (type.includes('land')) {
      lands += quantity;
      cardTypeDetails.lands += quantity;
      // Count lands as 0-cost for mana curve
      manaCurve[0] = (manaCurve[0] || 0) + quantity;
    } else if (type.includes('artifact')) {
      spells += quantity;
      cardTypeDetails.artifacts += quantity;
    } else if (type.includes('planeswalker')) {
      spells += quantity;
      cardTypeDetails.planeswalkers += quantity;
    } else if (type.includes('enchantment')) {
      spells += quantity;
      cardTypeDetails.enchantments += quantity;
    } else if (type.includes('instant') || type.includes('sorcery')) {
      spells += quantity;
      cardTypeDetails.spells += quantity;
    } else {
      spells += quantity;
      cardTypeDetails.other += quantity;
    }

    // Calculate average mana cost and build mana curve
    if (card.cost) {
      const costStr = card.cost.toString();
      const numericCost = parseManaCost(costStr);

      if (numericCost !== null && numericCost >= 0) {
        totalCost += numericCost * quantity;
        cardsWithCost += quantity;

        // Build mana curve data
        manaCurve[numericCost] = (manaCurve[numericCost] || 0) + quantity;
      }

      // Update color distribution
      updateColorDistribution(colorDistribution, costStr, quantity);
    }
  });

  return {
    creatures,
    spells,
    lands,
    totalCards,
    averageCost: cardsWithCost > 0 ? (totalCost / cardsWithCost).toFixed(1) : 0,
    manaCurve,
    colorDistribution,
    cardTypeDetails
  };
}

// Parse MTG mana cost format
function parseManaCost(costString) {
  if (!costString) return null;

  // Handle already numeric costs
  if (!isNaN(costString)) {
    return parseInt(costString);
  }

  // Parse MTG mana cost format like {3}{R}{R} or {1}{W}{U}
  let totalCost = 0;

  // Remove all braces and extract individual mana symbols
  const cleanCost = costString.replace(/[{}]/g, '');

  // Split into individual characters/symbols
  for (let i = 0; i < cleanCost.length; i++) {
    const symbol = cleanCost[i];

    // Handle numeric mana costs
    if (!isNaN(symbol) && symbol !== '') {
      totalCost += parseInt(symbol);
    }
    // Handle colored mana (W, U, B, R, G) and colorless symbols
    else if (['W', 'U', 'B', 'R', 'G', 'C'].includes(symbol.toUpperCase())) {
      totalCost += 1;
    }
    // Handle hybrid and other special symbols (count as 1 for now)
    else if (symbol === 'X' || symbol === 'Y' || symbol === 'Z') {
      totalCost += 0; // Variable costs count as 0
    }
  }

  return totalCost;
}

// Update color distribution
function updateColorDistribution(colorDist, cost, quantity) {
  const colors = ['W', 'U', 'B', 'R', 'G'];

  for (const color of colors) {
    const matches = (cost.match(new RegExp(`\\{${color}\\}`, 'g')) || []).length;
    if (matches > 0) {
      colorDist[color] = (colorDist[color] || 0) + (matches * quantity);
    }
  }
}
