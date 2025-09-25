/**
 * Card Image Service - Handles MTG card image fetching and caching
 * Uses Scryfall API for card images
 */

export class CardImageService {
  static SCRYFALL_API = 'https://api.scryfall.com/cards/named';
  static CARD_CACHE = new Map();
  static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static async getCardImageUrl(cardName, size = 'normal') {
    if (!cardName) return null;

    const cacheKey = `${cardName}-${size}`;
    const cached = this.CARD_CACHE.get(cacheKey);

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.imageUrl;
    }

    try {
      const response = await fetch(`${this.SCRYFALL_API}?exact=${encodeURIComponent(cardName)}`);

      if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const cardData = await response.json();
      const imageUrl = cardData.image_uris?.[size] || cardData.image_uris?.normal;

      // Cache the result
      this.CARD_CACHE.set(cacheKey, {
        imageUrl,
        timestamp: Date.now()
      });

      return imageUrl;

    } catch (error) {
      console.warn(`Failed to fetch image for ${cardName}:`, error.message);

      // Cache null result to avoid repeated failed requests
      this.CARD_CACHE.set(cacheKey, {
        imageUrl: null,
        timestamp: Date.now()
      });

      return null;
    }
  }

  static async getCardImageUrls(cardNames, size = 'small') {
    const results = new Map();

    // Process cards in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < cardNames.length; i += batchSize) {
      const batch = cardNames.slice(i, i + batchSize);

      const promises = batch.map(async (cardName) => {
        const imageUrl = await this.getCardImageUrl(cardName, size);
        return { cardName, imageUrl };
      });

      const batchResults = await Promise.all(promises);

      for (const { cardName, imageUrl } of batchResults) {
        results.set(cardName, imageUrl);
      }

      // Small delay between batches to be respectful to the API
      if (i + batchSize < cardNames.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  static getPlaceholderImageUrl(cardName) {
    // Generate a simple placeholder based on card name
    const colors = ['#1e3a8a', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];
    const hash = cardName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const color = colors[Math.abs(hash) % colors.length];

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="146" height="204" xmlns="http://www.w3.org/2000/svg">
        <rect width="146" height="204" fill="${color}" rx="8"/>
        <text x="73" y="90" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">
          <tspan x="73" dy="0">🃏</tspan>
          <tspan x="73" dy="20">MTG</tspan>
          <tspan x="73" dy="20">Card</tspan>
        </text>
        <text x="73" y="160" text-anchor="middle" fill="white" font-family="Arial" font-size="8" opacity="0.8">
          ${cardName.length > 20 ? cardName.substring(0, 17) + '...' : cardName}
        </text>
      </svg>
    `)}`;
  }

  static clearCache() {
    this.CARD_CACHE.clear();
  }

  static getCacheStats() {
    return {
      size: this.CARD_CACHE.size,
      entries: Array.from(this.CARD_CACHE.keys())
    };
  }
}