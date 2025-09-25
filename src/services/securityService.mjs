/**
 * Security Service - Handles XML validation and XXE protection
 */

export class SecurityService {
  static isValidXML(xmlText) {
    try {
      if (!xmlText?.trim()) return false;

      // Basic XML structure validation
      if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
        return false;
      }

      // Basic validation - check for proper XML tags
      const hasOpeningTag = xmlText.includes('<');
      const hasClosingTag = xmlText.includes('>');

      return hasOpeningTag && hasClosingTag;
    } catch (_error) {
      return false;
    }
  }

  static containsXXEPatterns(xmlText) {
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

  static validateXMLSecurity(xmlText) {
    if (!this.isValidXML(xmlText)) {
      return { valid: false, reason: 'Invalid XML format' };
    }

    if (this.containsXXEPatterns(xmlText)) {
      return { valid: false, reason: 'Potential XXE attack detected' };
    }

    return { valid: true };
  }
}