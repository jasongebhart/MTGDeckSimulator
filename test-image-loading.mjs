/**
 * Test script to verify CardImageService is working
 */

import { CardImageService } from './src/services/cardImageService.mjs';

console.log('CardImageService loaded:', CardImageService);
console.log('CardImageService methods:', Object.getOwnPropertyNames(CardImageService));

// Test fetching a card image
const testCardName = 'Black Lotus';
console.log(`\nTesting image fetch for: ${testCardName}`);

CardImageService.getCardImageUrl(testCardName, 'small')
  .then(url => {
    console.log('✓ Success! Image URL:', url);
    console.log('\nCache stats:', CardImageService.getCacheStats());
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ Error:', error);
    process.exit(1);
  });
