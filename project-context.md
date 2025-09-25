# MTG Deck Simulator

## Overview

A Node.js web application for simulating Magic The Gathering gameplay and deck
testing. Provides an interactive interface for managing MTG decks, testing card
interactions, and analyzing deck performance.

## Core Components

- **startapp.mjs**: Main application entry point and Express server
  configuration.
- **controllers/**: Server-side logic for handling deck operations and game
  simulation.
- **views/**: EJS templates for rendering web interface and deck displays.
- **decks/**: Storage directory for saved deck configurations and lists.
- **assets/**: Static resources including CSS styles and client-side JavaScript.
- **scripts/**: Utility scripts for deck management and data processing.
- **xml/**: XML data files containing card information and game rules.

## Execution Flow

1. Server starts via startapp.mjs, configuring Express routes and middleware
2. User accesses web interface to create or load existing decks
3. Deck data is processed through controllers for validation and simulation
4. Game simulation engine processes card interactions and rules
5. Results are rendered through EJS templates and displayed to user
6. Session management tracks user progress and deck modifications

### Execution Example

```bash
npm start
# or
node startapp.mjs
```

## External Dependencies

- **Requirements:** Node.js 18.17.1, Express.js, EJS templating, XML parsing
  libraries
- **Inputs:** MTG card data (XML format), user deck configurations, game rules
- **Outputs:** Simulated game results, deck analysis reports, modified deck
  files
