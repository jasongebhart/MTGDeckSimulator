import { describe, test, expect } from '@jest/globals';
import { SecurityService } from '../../src/services/securityService.mjs';

describe('SecurityService', () => {
  describe('isValidXML', () => {
    test('should validate proper XML with declaration', () => {
      const validXML = '<?xml version="1.0"?><root><child>content</child></root>';
      expect(SecurityService.isValidXML(validXML)).toBe(true);
    });

    test('should validate XML without declaration', () => {
      const validXML = '<root><child>content</child></root>';
      expect(SecurityService.isValidXML(validXML)).toBe(true);
    });

    test('should reject non-XML content', () => {
      expect(SecurityService.isValidXML('This is just text')).toBe(false);
    });

    test('should reject empty string', () => {
      expect(SecurityService.isValidXML('')).toBe(false);
    });

    test('should reject null/undefined', () => {
      expect(SecurityService.isValidXML(null)).toBe(false);
      expect(SecurityService.isValidXML(undefined)).toBe(false);
    });
  });

  describe('containsXXEPatterns', () => {
    test('should detect ENTITY declarations', () => {
      const xxeXML = '<!ENTITY test "value">';
      expect(SecurityService.containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect external file references', () => {
      const xxeXML = 'SYSTEM "file:///etc/passwd"';
      expect(SecurityService.containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should detect external HTTP references', () => {
      const xxeXML = 'SYSTEM "http://malicious.com"';
      expect(SecurityService.containsXXEPatterns(xxeXML)).toBe(true);
    });

    test('should not flag safe XML', () => {
      const safeXML = '<deck><card name="Lightning Bolt"/></deck>';
      expect(SecurityService.containsXXEPatterns(safeXML)).toBe(false);
    });
  });

  describe('validateXMLSecurity', () => {
    test('should return valid for safe XML', () => {
      const safeXML = '<?xml version="1.0"?><deck><card name="Test"/></deck>';
      const result = SecurityService.validateXMLSecurity(safeXML);
      expect(result.valid).toBe(true);
    });

    test('should return invalid for XXE patterns', () => {
      const maliciousXML = '<?xml version="1.0"?><!ENTITY xxe SYSTEM "file:///etc/passwd"><root>&xxe;</root>';
      const result = SecurityService.validateXMLSecurity(maliciousXML);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Potential XXE attack detected');
    });

    test('should return invalid for malformed XML', () => {
      const invalidXML = 'not xml at all';
      const result = SecurityService.validateXMLSecurity(invalidXML);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid XML format');
    });
  });
});