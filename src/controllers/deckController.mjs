/**
 * Deck Controller - Handles deck-related HTTP requests
 */
import { DeckService } from '../services/deckService.mjs';
import { ApiError, asyncHandler } from '../middleware/errorHandler.mjs';

export class DeckController {
  static uploadDeck = asyncHandler(async (req, res) => {
    const deckData = await DeckService.parseDeckXML(req.xmlContent);

    res.json({
      success: true,
      data: {
        deck: deckData,
        statistics: DeckService.calculateDeckStatistics(deckData),
      },
    });
  });

  static createDeck = asyncHandler(async (req, res) => {
    const { deckName, cards } = req.body;

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      throw new ApiError('Cards array is required and cannot be empty', 400, 'MISSING_CARDS');
    }

    const deckData = {
      name: deckName,
      cards: cards.map(card => ({
        name: card.name || '',
        quantity: parseInt(card.quantity) || 1,
        cost: card.cost || '',
        type: card.type || '',
      })),
    };

    // Validate card data
    for (const card of deckData.cards) {
      if (!card.name.trim()) {
        throw new ApiError('All cards must have a name', 400, 'INVALID_CARD_DATA');
      }
    }

    const statistics = DeckService.calculateDeckStatistics(deckData);

    res.json({
      success: true,
      data: {
        deck: deckData,
        statistics,
      },
    });
  });

  static saveDeck = asyncHandler(async (req, res) => {
    const { deckData, fileName } = req.body;

    if (!fileName || typeof fileName !== 'string') {
      throw new ApiError('File name is required', 400, 'MISSING_FILENAME');
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `./xml/${sanitizedFileName}.xml`;

    try {
      const xmlContent = await DeckService.saveDeckFile(deckData, filePath);

      res.json({
        success: true,
        data: {
          message: 'Deck saved successfully',
          fileName: sanitizedFileName,
          filePath,
          xmlContent,
        },
      });
    } catch (error) {
      throw new ApiError(`Failed to save deck: ${error.message}`, 500, 'SAVE_FAILED');
    }
  });

  static loadDeck = asyncHandler(async (req, res) => {
    const { fileName } = req.params;

    if (!fileName) {
      throw new ApiError('File name is required', 400, 'MISSING_FILENAME');
    }

    const filePath = `./xml/${fileName}`;

    try {
      const deckData = await DeckService.loadDeckFile(filePath);
      const statistics = DeckService.calculateDeckStatistics(deckData);

      res.json({
        success: true,
        data: {
          deck: deckData,
          statistics,
        },
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new ApiError('Deck file not found', 404, 'DECK_NOT_FOUND');
      }
      throw new ApiError(`Failed to load deck: ${error.message}`, 500, 'LOAD_FAILED');
    }
  });

  static getDeckStatistics = asyncHandler(async (req, res) => {
    const { xmlContent } = req.body;

    if (!xmlContent) {
      throw new ApiError('XML content is required', 400, 'MISSING_XML_CONTENT');
    }

    const deckData = await DeckService.parseDeckXML(xmlContent);
    const statistics = DeckService.calculateDeckStatistics(deckData);

    res.json({
      success: true,
      data: {
        statistics,
        deck: {
          name: deckData.name,
          totalCards: deckData.totalCards,
        },
      },
    });
  });
}