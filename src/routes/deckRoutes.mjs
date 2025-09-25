/**
 * Deck Routes - RESTful API endpoints for deck operations
 */
import { Router } from 'express';
import multer from 'multer';
import { DeckController } from '../controllers/deckController.mjs';
import { validateXMLUpload, validateDeckName, validateFileUpload } from '../middleware/validation.mjs';
import { cacheMiddleware, deckCache, parseCache, statsCache, keyGenerators } from '../middleware/cache.mjs';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024, // 1MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['text/xml', 'application/xml', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only XML files are allowed.'), false);
    }
  },
});

// API Routes with caching
router.post('/upload', upload.single('deckFile'), validateFileUpload, validateXMLUpload,
  cacheMiddleware(parseCache, keyGenerators.xmlContent), DeckController.uploadDeck);

router.post('/create', validateDeckName, DeckController.createDeck);

router.post('/save', DeckController.saveDeck);

router.get('/:fileName', cacheMiddleware(deckCache, keyGenerators.fileName), DeckController.loadDeck);

router.post('/statistics', cacheMiddleware(statsCache, keyGenerators.deckStatistics), DeckController.getDeckStatistics);

export default router;