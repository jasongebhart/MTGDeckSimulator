/**
 * Deck Service - Handles deck-related operations
 */
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import path from 'path';

export class DeckService {
  static async parseDeckXML(xmlContent) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    try {
      const result = parser.parse(xmlContent);
      return this.extractDeckData(result);
    } catch (error) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  static extractDeckData(parsedXml) {
    const cards = [];
    let deckName = 'Unknown Deck';

    // Extract deck name if available
    if (parsedXml.deck && parsedXml.deck['@_name']) {
      deckName = parsedXml.deck['@_name'];
    }

    // Extract cards - handle different XML structures
    const cardNodes = this.findCardNodes(parsedXml);

    for (const cardNode of cardNodes) {
      const card = this.extractCardInfo(cardNode);
      if (card) {
        cards.push(card);
      }
    }

    return {
      name: deckName,
      cards,
      totalCards: cards.reduce((sum, card) => sum + (card.quantity || 1), 0),
    };
  }

  static findCardNodes(parsedXml) {
    // Handle various XML structures for MTG decks
    if (parsedXml.deck && parsedXml.deck.card) {
      return Array.isArray(parsedXml.deck.card) ? parsedXml.deck.card : [parsedXml.deck.card];
    }

    if (parsedXml.card) {
      return Array.isArray(parsedXml.card) ? parsedXml.card : [parsedXml.card];
    }

    return [];
  }

  static extractCardInfo(cardNode) {
    if (typeof cardNode === 'string') {
      return { name: cardNode, quantity: 1 };
    }

    const card = {
      name: cardNode['@_name'] || cardNode.name || cardNode._text,
      quantity: parseInt(cardNode['@_quantity'] || cardNode.quantity || 1),
      cost: cardNode['@_cost'] || cardNode.cost,
      type: cardNode['@_type'] || cardNode.type,
    };

    if (!card.name) return null;

    return card;
  }

  static async loadDeckFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const xmlContent = await fs.readFile(fullPath, 'utf8');
      return this.parseDeckXML(xmlContent);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Deck file not found: ${filePath}`);
      }
      throw error;
    }
  }

  static async saveDeckFile(deckData, filePath) {
    const xmlContent = this.generateXML(deckData);
    await fs.writeFile(filePath, xmlContent, 'utf8');
    return xmlContent;
  }

  static generateXML(deckData) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
    xml += `<deck name="${this.escapeXML(deckData.name)}">\\n`;

    for (const card of deckData.cards) {
      xml += `  <card name="${this.escapeXML(card.name)}" quantity="${card.quantity}"`;
      if (card.cost) xml += ` cost="${this.escapeXML(card.cost)}"`;
      if (card.type) xml += ` type="${this.escapeXML(card.type)}"`;
      xml += '/>\\n';
    }

    xml += '</deck>';
    return xml;
  }

  static escapeXML(text) {
    if (typeof text !== 'string') return text;
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  static calculateDeckStatistics(deckData) {
    const stats = {
      totalCards: 0,
      creatures: 0,
      spells: 0,
      lands: 0,
      averageCost: 0,
      colorDistribution: {},
      manaCurve: {},
      cardTypeDetails: { creatures: 0, spells: 0, lands: 0, artifacts: 0, planeswalkers: 0, enchantments: 0, other: 0 }
    };

    let totalCost = 0;
    let cardsWithCost = 0;

    for (const card of deckData.cards) {
      const quantity = card.quantity || 1;
      stats.totalCards += quantity;

      // Categorize by type with more detail
      if (card.type) {
        const typeStr = card.type.toLowerCase();
        if (typeStr.includes('creature')) {
          stats.creatures += quantity;
          stats.cardTypeDetails.creatures += quantity;
        } else if (typeStr.includes('land')) {
          stats.lands += quantity;
          stats.cardTypeDetails.lands += quantity;
        } else if (typeStr.includes('artifact')) {
          stats.spells += quantity;
          stats.cardTypeDetails.artifacts += quantity;
        } else if (typeStr.includes('planeswalker')) {
          stats.spells += quantity;
          stats.cardTypeDetails.planeswalkers += quantity;
        } else if (typeStr.includes('enchantment')) {
          stats.spells += quantity;
          stats.cardTypeDetails.enchantments += quantity;
        } else if (typeStr.includes('instant') || typeStr.includes('sorcery')) {
          stats.spells += quantity;
          stats.cardTypeDetails.spells += quantity;
        } else {
          stats.spells += quantity;
          stats.cardTypeDetails.other += quantity;
        }
      }

      // Calculate cost statistics and mana curve
      if (card.cost) {
        const convertedCost = this.parseManaCost(card.cost);
        if (convertedCost !== null) {
          totalCost += convertedCost * quantity;
          cardsWithCost += quantity;

          // Build mana curve data
          stats.manaCurve[convertedCost] = (stats.manaCurve[convertedCost] || 0) + quantity;
        }
      } else if (card.type && card.type.toLowerCase().includes('land')) {
        // Count lands as 0-cost for mana curve
        stats.manaCurve[0] = (stats.manaCurve[0] || 0) + quantity;
      }

      // Color distribution (enhanced)
      if (card.cost) {
        this.updateColorDistribution(stats.colorDistribution, card.cost, quantity);
      }
    }

    if (cardsWithCost > 0) {
      stats.averageCost = Math.round((totalCost / cardsWithCost) * 100) / 100;
    }

    return stats;
  }

  static parseManaCost(costString) {
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

  static updateColorDistribution(colorDist, cost, quantity) {
    // Simplified color extraction from mana cost
    const colors = ['W', 'U', 'B', 'R', 'G'];

    for (const color of colors) {
      const matches = (cost.match(new RegExp(color, 'g')) || []).length;
      if (matches > 0) {
        colorDist[color] = (colorDist[color] || 0) + (matches * quantity);
      }
    }
  }
}