import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup minimal DOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  url: 'http://localhost'
});

global.window = dom.window;
global.document = dom.window.document;
global.fetch = jest.fn();

// Import after globals are set
const { CardImageService } = await import('../../src/services/cardImageService.mjs');

describe('CardImageService', () => {
  beforeEach(() => {
    // Clear cache before each test
    CardImageService.clearCache();
    jest.clearAllMocks();
  });

  describe('Local Image Checking', () => {
    test('should check for local images with multiple extensions', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      const result = await CardImageService.checkLocalImage('Lightning Bolt');

      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe('/assets/MagicImages/Lightning Bolt.jpg');
    });

    test('should try different extensions until one succeeds', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: false }) // jpg fails
        .mockResolvedValueOnce({ ok: false }) // jpeg fails
        .mockResolvedValueOnce({ ok: true });  // png succeeds

      const result = await CardImageService.checkLocalImage('Test Card');

      expect(result).toBe('/assets/MagicImages/Test Card.png');
    });

    test('should return null if no local image exists', async () => {
      global.fetch.mockResolvedValue({ ok: false });

      const result = await CardImageService.checkLocalImage('Missing Card');

      expect(result).toBeNull();
    });
  });

  describe('Scryfall API Integration', () => {
    test('should fetch card image from Scryfall API', async () => {
      const mockCardData = {
        image_uris: {
          normal: 'https://cards.scryfall.io/normal/front/a/b/card.jpg'
        }
      };

      global.fetch
        .mockResolvedValueOnce({ ok: false }) // Local image check fails
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCardData
        }); // Scryfall API succeeds

      const result = await CardImageService.getCardImageUrl('Test Card', 'normal');

      expect(result).toBe('https://cards.scryfall.io/normal/front/a/b/card.jpg');
    });

    test('should try fuzzy search if exact match fails', async () => {
      const mockCardData = {
        image_uris: {
          normal: 'https://cards.scryfall.io/normal/fuzzy.jpg'
        }
      };

      global.fetch
        .mockResolvedValueOnce({ ok: false }) // Local check
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Exact match fails
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCardData
        }); // Fuzzy search succeeds

      const result = await CardImageService.getCardImageUrl('Aproximate Name', 'normal');

      expect(result).toContain('fuzzy.jpg');
    });

    test('should handle double-faced cards', async () => {
      const mockCardData = {
        card_faces: [
          {
            image_uris: {
              normal: 'https://cards.scryfall.io/normal/dfc.jpg'
            }
          }
        ]
      };

      global.fetch
        .mockResolvedValueOnce({ ok: false }) // Local
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCardData
        });

      const result = await CardImageService.getCardImageUrl('DFC Card', 'normal');

      expect(result).toBe('https://cards.scryfall.io/normal/dfc.jpg');
    });
  });

  describe('Caching', () => {
    test('should cache image URLs', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      await CardImageService.getCardImageUrl('Lightning Bolt', 'normal');
      await CardImageService.getCardImageUrl('Lightning Bolt', 'normal');

      // First call checks local, second should use cache
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should return cached results within duration', async () => {
      const mockUrl = '/assets/MagicImages/Test.jpg';
      global.fetch.mockResolvedValue({ ok: true });

      const result1 = await CardImageService.getCardImageUrl('Test', 'normal');
      const result2 = await CardImageService.getCardImageUrl('Test', 'normal');

      expect(result1).toBe(result2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should manage cache size', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      // Fill cache beyond max size (1000)
      for (let i = 0; i < 1100; i++) {
        await CardImageService.getCardImageUrl(`Card${i}`, 'normal');
      }

      const stats = CardImageService.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(1000);
    });

    test('should clear cache', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      await CardImageService.getCardImageUrl('Test', 'normal');
      expect(CardImageService.getCacheStats().size).toBe(1);

      CardImageService.clearCache();
      expect(CardImageService.getCacheStats().size).toBe(0);
    });
  });

  describe('Image Size Fallbacks', () => {
    test('should fall back to other sizes if requested size unavailable', async () => {
      const mockCardData = {
        image_uris: {
          normal: 'https://cards.scryfall.io/normal.jpg',
          small: 'https://cards.scryfall.io/small.jpg'
        }
      };

      global.fetch
        .mockResolvedValueOnce({ ok: false }) // Local
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCardData
        });

      const result = await CardImageService.getCardImageUrl('Test', 'large');

      // Should fall back to 'normal' since 'large' doesn't exist
      expect(result).toBe('https://cards.scryfall.io/normal.jpg');
    });
  });

  describe('Error Handling', () => {
    test('should return placeholder on API error', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: false }) // Local fails
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: false })
        .mockRejectedValueOnce(new Error('Network error')); // API fails

      const result = await CardImageService.getCardImageUrl('Error Card', 'normal');

      expect(result).toContain('data:image/svg');
      const decodedSvg = decodeURIComponent(result);
      expect(decodedSvg).toContain('Error Card');
    });

    test('should handle invalid card names gracefully', async () => {
      const result = await CardImageService.getCardImageUrl('', 'normal');

      expect(result).toContain('data:image/svg');
      const decodedSvg = decodeURIComponent(result);
      expect(decodedSvg).toContain('Unknown Card');
    });
  });

  describe('Cache Statistics', () => {
    test('should provide cache statistics', async () => {
      global.fetch.mockResolvedValue({ ok: true });

      await CardImageService.getCardImageUrl('Card1', 'normal');
      await CardImageService.getCardImageUrl('Card2', 'small');

      const stats = CardImageService.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toContain('Card1-normal');
      expect(stats.entries).toContain('Card2-small');
    });
  });
});
