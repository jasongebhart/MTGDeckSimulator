/**
 * Validation Middleware
 */
import { SecurityService } from '../services/securityService.mjs';
import { ApiError } from './errorHandler.mjs';

export function validateXMLUpload(req, res, next) {
  if (!req.file && !req.body.xmlContent) {
    return next(new ApiError('No XML file or content provided', 400, 'MISSING_XML'));
  }

  let xmlContent;
  if (req.file) {
    xmlContent = req.file.buffer.toString();
  } else {
    xmlContent = req.body.xmlContent;
  }

  const validation = SecurityService.validateXMLSecurity(xmlContent);
  if (!validation.valid) {
    return next(new ApiError(`XML validation failed: ${validation.reason}`, 400, 'INVALID_XML'));
  }

  req.xmlContent = xmlContent;
  next();
}

export function validateDeckName(req, res, next) {
  const { deckName } = req.body;

  if (!deckName || typeof deckName !== 'string') {
    return next(new ApiError('Deck name is required and must be a string', 400, 'INVALID_DECK_NAME'));
  }

  if (deckName.length < 1 || deckName.length > 100) {
    return next(new ApiError('Deck name must be between 1 and 100 characters', 400, 'INVALID_DECK_NAME'));
  }

  // Sanitize deck name - remove potentially dangerous characters
  req.body.deckName = deckName.replace(/[<>:"/\\|?*]/g, '');
  next();
}

export function validateFileUpload(req, res, next) {
  if (!req.file) {
    return next(new ApiError('No file uploaded', 400, 'NO_FILE'));
  }

  const allowedTypes = ['text/xml', 'application/xml', 'text/plain'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return next(new ApiError('Invalid file type. Only XML files are allowed', 400, 'INVALID_FILE_TYPE'));
  }

  if (req.file.size > 1024 * 1024) { // 1MB limit
    return next(new ApiError('File size too large. Maximum size is 1MB', 413, 'FILE_TOO_LARGE'));
  }

  next();
}