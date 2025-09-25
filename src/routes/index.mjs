/**
 * Route Registration - Main router setup
 */
import { Router } from 'express';
import deckRoutes from './deckRoutes.mjs';

const router = Router();

// API version 1 routes
router.use('/api/v1/decks', deckRoutes);

// Modern UI routes
router.get('/', (req, res) => {
  res.render('decks-modern');
});

router.get('/decks-modern', (req, res) => {
  res.render('decks-modern');
});

// Legacy route compatibility (for existing frontend)
router.get('/decks-legacy', (req, res) => {
  res.render('decks');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/logout', (req, res) => {
  res.render('logout');
});

router.get('/decks', (req, res) => {
  res.render('decks');
});

router.get('/playhand', (req, res) => {
  res.render('playhand');
});

router.get('/handsimulation', (req, res) => {
  res.render('handsimulation');
});

router.get('/alldecks', (req, res) => {
  res.render('alldecks');
});

router.get('/create-deck-form', (req, res) => {
  res.render('create-deck-form');
});

export default router;