# MTG Deck Simulator

A Node.js web application for simulating Magic The Gathering gameplay and deck testing. MTG Deck Simulator provides an interactive interface for managing MTG decks, testing card interactions, and analyzing deck performance through realistic game simulations.

![MTG Version](https://img.shields.io/badge/version-1.0.2-blue.svg)
![Node Version](https://img.shields.io/badge/node-18.17.1-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

## Features

- **Interactive Deck Management**: Create, load, and modify MTG deck configurations
- **Game Simulation Engine**: Realistic MTG gameplay simulation with card interactions
- **Deck Testing Tools**: Analyze deck performance and card synergies
- **Web Interface**: User-friendly EJS-templated web interface
- **Session Management**: Track user progress and deck modifications
- **XML Card Database**: Comprehensive card information and game rules storage
- **Deck Analysis**: Performance reports and statistical analysis

## Getting Started

### Prerequisites

- Node.js 18.17.1 or higher
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd MTGDeckSimulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your secure credentials and settings
   ```

4. Start the application:
   ```bash
   npm start
   # or
   node startapp.mjs
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Running the Simulator

1. **Start the Server**:
   ```bash
   npm start
   ```

2. **Access the Web Interface**: Open `http://localhost:3000` in your browser

3. **Create or Load Decks**:
   - Use the web interface to create new decks
   - Load existing deck configurations from the `decks/` directory
   - Import deck lists in standard formats

4. **Simulate Games**:
   - Select deck configurations for simulation
   - Run game scenarios to test deck performance
   - Analyze results and card interactions

### Deck Management

- **Create Decks**: Use the web interface to build new deck configurations
- **Save Decks**: Store deck configurations in the `decks/` directory
- **Load Decks**: Import existing deck files for testing
- **Modify Decks**: Edit deck lists and test variations

### Quick Start Commands

```bash
# Development start
npm start

# Alternative start method
node startapp.mjs

# Windows batch file
mtg.cmd

# PowerShell script
./start-mtg.ps1
```

## Project Structure

```
MTGDeckSimulator/
├── controllers/           # Server-side logic and game simulation
├── views/                # EJS templates for web interface
├── assets/               # Static resources (CSS, JavaScript)
├── decks/                # Saved deck configurations
├── scripts/              # Utility scripts for deck management
├── xml/                  # Card data and game rules
├── test/                 # Test files and scenarios
├── topdecks/             # Additional deck resources
├── startapp.mjs          # Main application entry point
├── package.json          # Project configuration and dependencies
├── Devnotes.md          # Development notes and documentation
└── README.md            # This file
```

## Technologies

- **Backend**: Node.js 18.17.1, Express.js
- **Frontend**: EJS templating engine, HTML5, CSS3, JavaScript
- **Data Processing**: XML2JSON, XMLBuilder
- **Session Management**: Express-session
- **File Upload**: Multer
- **HTTP Client**: Axios
- **Dependency Management**: Hapi/Topo

## API Dependencies

The application uses the following Node.js packages:

```json
{
  "@hapi/topo": "^6.0.2",
  "axios": "^1.6.0",
  "ejs": "^3.1.9",
  "express": "^4.18.2",
  "express-session": "^1.17.3",
  "multer": "^1.4.5-lts.1",
  "xml2json": "^0.12.0",
  "xmlbuilder": "^15.1.1"
}
```

## Security

This application includes several security enhancements:

- **Content Security Policy (CSP)**: Prevents XSS attacks
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- **XXE Protection**: XML processing includes validation against XXE attacks
- **Environment-based Configuration**: Credentials stored in environment variables
- **Authentication**: File upload endpoints require authentication
- **Input Validation**: File type restrictions and size limits

### Security Configuration

1. Set secure environment variables in `.env`:
   ```bash
   APP_USERNAME=your-secure-username
   APP_PASSWORD=your-secure-password
   SESSION_SECRET=your-32-character-random-string
   NODE_ENV=production
   ```

2. For production deployment:
   - Use strong credentials
   - Generate a cryptographically secure session secret
   - Enable HTTPS
   - Consider implementing rate limiting
   - Use a proper authentication system instead of hardcoded credentials

## Game Features

- **Card Interaction Simulation**: Realistic Magic The Gathering rule enforcement
- **Deck Performance Analysis**: Statistical analysis of deck efficiency
- **Mulligan Simulation**: Opening hand analysis and decision making
- **Turn-by-Turn Simulation**: Detailed game state progression
- **Card Database Integration**: Access to comprehensive card information

## Development

### Running in Development Mode

```bash
# Start with auto-reload (if configured)
npm run dev

# Start normally
npm start
```

### Testing

```bash
# Run test suite (if configured)
npm test

# Manual testing via web interface
npm start
# Navigate to http://localhost:3000
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow Node.js best practices
- Test deck simulations thoroughly
- Maintain MTG rule accuracy
- Document new features and card interactions
- Ensure cross-browser compatibility for the web interface

## Troubleshooting

### Common Issues

1. **Node Version**: Ensure you're using Node.js 18.17.1 as specified in package.json
2. **Dependencies**: Run `npm install` if experiencing module errors
3. **Port Conflicts**: The default port is 3000; modify in startapp.mjs if needed
4. **Deck Loading**: Verify deck files are in the correct format in the `decks/` directory

## License

ISC License - see package.json for details.

## Author

Jason Gebhart

---

**Note**: This simulator is for educational and testing purposes. It is not affiliated with Wizards of the Coast or Magic: The Gathering.