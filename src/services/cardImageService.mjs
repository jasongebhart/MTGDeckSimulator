/**
 * Enhanced Card Image Service - Handles MTG card image fetching and caching
 * Uses Scryfall API for card images with improved error handling and performance
 */

export class CardImageService {
  static SCRYFALL_API = 'https://api.scryfall.com/cards/named';
  static CARD_CACHE = new Map();
  static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  static MAX_CACHE_SIZE = 1000; // Limit cache size for memory management
  static REQUEST_DELAY = 75; // Delay between requests to respect rate limits

  static async getCardImageUrl(cardName, size = 'normal', dfcFrontFace = null) {
    if (!cardName) return this.getPlaceholderImageUrl('Unknown Card');

    const cacheKey = `${cardName}-${size}`;
    const cached = this.CARD_CACHE.get(cacheKey);

    // Return cached result if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.imageUrl || this.getPlaceholderImageUrl(cardName);
    }

    // Manage cache size
    this.manageCacheSize();

    // Check for local image first
    const localImageUrl = await this.checkLocalImage(cardName);
    if (localImageUrl) {
      // Cache the local image result
      this.CARD_CACHE.set(cacheKey, {
        imageUrl: localImageUrl,
        timestamp: Date.now(),
        source: 'local'
      });
      return localImageUrl;
    }

    try {
      // Try exact match first
      let response = await fetch(`${this.SCRYFALL_API}?exact=${encodeURIComponent(cardName)}`);

      // If exact match fails and we have a DFC front face hint, try the full DFC name
      if (!response.ok && response.status === 404 && dfcFrontFace) {
        const dfcFullName = `${dfcFrontFace} // ${cardName}`;
        response = await fetch(`${this.SCRYFALL_API}?exact=${encodeURIComponent(dfcFullName)}`);
      }

      // If still failing, try fuzzy search
      if (!response.ok && response.status === 404) {
        response = await fetch(`${this.SCRYFALL_API}?fuzzy=${encodeURIComponent(cardName)}`);
      }

      if (!response.ok) {
        throw new Error(`Scryfall API error: ${response.status}`);
      }

      const cardData = await response.json();

      // Try requested size, then fallback to other available sizes
      const fallbackSizes = [size, 'normal', 'small', 'large'];
      let imageUrl = null;

      // Check if this is a double-faced card (card_faces array exists)
      if (cardData.card_faces && cardData.card_faces.length > 0) {
        // Find the matching face by name
        const matchingFace = cardData.card_faces.find(face =>
          face.name.toLowerCase() === cardName.toLowerCase()
        );

        if (matchingFace) {
          // Get image from the specific face
          for (const fallbackSize of fallbackSizes) {
            if (matchingFace.image_uris?.[fallbackSize]) {
              imageUrl = matchingFace.image_uris[fallbackSize];
              break;
            }
          }
        } else {
          // Default to first face if no match found
          for (const fallbackSize of fallbackSizes) {
            if (cardData.card_faces[0].image_uris?.[fallbackSize]) {
              imageUrl = cardData.card_faces[0].image_uris[fallbackSize];
              break;
            }
          }
        }
      } else {
        // Single-faced card - use normal image_uris
        for (const fallbackSize of fallbackSizes) {
          if (cardData.image_uris?.[fallbackSize]) {
            imageUrl = cardData.image_uris[fallbackSize];
            break;
          }
        }
      }

      // Cache the result (even if null)
      this.CARD_CACHE.set(cacheKey, {
        imageUrl,
        timestamp: Date.now(),
        source: 'api',
        cardData: {
          name: cardData.name,
          type_line: cardData.type_line,
          mana_cost: cardData.mana_cost,
          colors: cardData.colors
        }
      });

      return imageUrl || this.getPlaceholderImageUrl(cardName);

    } catch (error) {
      console.warn(`Failed to fetch image for ${cardName}:`, error.message);

      // Cache failed result to avoid repeated requests
      this.CARD_CACHE.set(cacheKey, {
        imageUrl: null,
        timestamp: Date.now(),
        source: 'failed'
      });

      return this.getPlaceholderImageUrl(cardName);
    }
  }

  static async checkLocalImage(cardName) {
    // Try different extensions for local images
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    for (const ext of extensions) {
      const imagePath = `/assets/MagicImages/${cardName}.${ext}`;

      try {
        // Check if image exists by attempting to load it
        const response = await fetch(imagePath, { method: 'HEAD' });
        if (response.ok) {
          return imagePath;
        }
      } catch (error) {
        // Image doesn't exist, continue to next extension
        continue;
      }
    }

    return null; // No local image found
  }

  static manageCacheSize() {
    if (this.CARD_CACHE.size > this.MAX_CACHE_SIZE) {
      // Remove oldest 20% of entries
      const entriesToRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
      const sortedEntries = Array.from(this.CARD_CACHE.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      for (let i = 0; i < entriesToRemove; i++) {
        this.CARD_CACHE.delete(sortedEntries[i][0]);
      }
    }
  }

  static async getCardImageUrls(cardNames, size = 'small', onProgress = null) {
    const results = new Map();
    const uniqueCardNames = [...new Set(cardNames)]; // Remove duplicates

    // Process cards in batches to avoid overwhelming the API
    const batchSize = 8;
    let processedCount = 0;

    for (let i = 0; i < uniqueCardNames.length; i += batchSize) {
      const batch = uniqueCardNames.slice(i, i + batchSize);

      const promises = batch.map(async (cardName) => {
        const imageUrl = await this.getCardImageUrl(cardName, size);
        return { cardName, imageUrl };
      });

      const batchResults = await Promise.all(promises);

      for (const { cardName, imageUrl } of batchResults) {
        results.set(cardName, imageUrl);
        processedCount++;

        if (onProgress) {
          onProgress(processedCount, uniqueCardNames.length, cardName, imageUrl);
        }
      }

      // Respectful delay between batches
      if (i + batchSize < uniqueCardNames.length) {
        await new Promise(resolve => setTimeout(resolve, this.REQUEST_DELAY));
      }
    }

    return results;
  }

  // Method to preload images for better UX
  static async preloadImages(cardNames, size = 'small') {
    const imageUrls = await this.getCardImageUrls(cardNames, size);

    // Preload images in the browser
    const preloadPromises = Array.from(imageUrls.values()).map(url => {
      if (!url || url.startsWith('data:')) return Promise.resolve(); // Skip placeholders

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't fail the whole batch
        img.src = url;
      });
    });

    await Promise.allSettled(preloadPromises);
    return imageUrls;
  }

  static getPlaceholderImageUrl(cardName) {
    // Generate a simple placeholder based on card name
    const colors = ['#1e3a8a', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];
    const hash = cardName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const color = colors[Math.abs(hash) % colors.length];

    const svgContent = `
      <svg width="146" height="204" xmlns="http://www.w3.org/2000/svg">
        <rect width="146" height="204" fill="${color}" rx="8"/>
        <text x="73" y="90" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">
          <tspan x="73" dy="0">MTG</tspan>
          <tspan x="73" dy="20">Card</tspan>
        </text>
        <text x="73" y="160" text-anchor="middle" fill="white" font-family="Arial" font-size="8" opacity="0.8">
          ${cardName.length > 20 ? cardName.substring(0, 17) + '...' : cardName}
        </text>
      </svg>
    `;

    // Use URL encoding instead of base64 to avoid character encoding issues
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
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