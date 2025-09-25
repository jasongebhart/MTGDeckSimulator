import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // Browser globals for client-side code
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
        DOMParser: 'readonly',
        XMLSerializer: 'readonly',
        // Test globals
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // Code quality rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console.log for this project
      'prefer-const': 'warn',
      'no-var': 'error',

      // ES6+ features
      'arrow-spacing': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',

      // Best practices
      eqeqeq: ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Style (handled by Prettier, but good to have as warnings)
      semi: ['warn', 'always'],
      quotes: ['warn', 'single', { avoidEscape: true }],
    },
  },
  {
    // Specific rules for test files
    files: ['**/__tests__/**/*.mjs', '**/*.test.mjs'],
    rules: {
      'no-unused-vars': 'off', // Allow unused vars in tests for mocking
    },
  },
];
