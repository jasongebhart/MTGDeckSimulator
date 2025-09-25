/**
 * Caching Middleware - Simple in-memory cache for performance
 */

class SimpleCache {
  constructor(ttl = 300000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTTL) {
    const expireTime = Date.now() + (customTTL || this.ttl);
    this.cache.set(key, { value, expireTime });

    // Cleanup expired entries periodically
    this.cleanup();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expireTime) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    // Only cleanup occasionally to avoid performance impact
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expireTime) {
          this.cache.delete(key);
        }
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      ttl: this.ttl,
    };
  }
}

// Create cache instances for different types of data
export const deckCache = new SimpleCache(600000); // 10 minutes for deck files
export const parseCache = new SimpleCache(300000); // 5 minutes for parsed XML
export const statsCache = new SimpleCache(120000); // 2 minutes for statistics

// Cache middleware factory
export function cacheMiddleware(cache, keyGenerator, ttl) {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const cached = cache.get(key);

    if (cached) {
      // Add cache hit header
      res.set('X-Cache', 'HIT');
      return res.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache successful responses
    res.json = function(data) {
      if (data && data.success && data.data) {
        cache.set(key, data.data, ttl);
      }
      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
}

// Common key generators
export const keyGenerators = {
  fileName: (req) => `file:${req.params.fileName}`,
  xmlContent: (req) => `xml:${Buffer.from(req.body.xmlContent || req.xmlContent || '').toString('base64').slice(0, 50)}`,
  deckStatistics: (req) => `stats:${Buffer.from(req.body.xmlContent || '').toString('base64').slice(0, 50)}`,
};