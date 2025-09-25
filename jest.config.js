export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'scripts/**/*.mjs',
    'controllers/**/*.mjs',
    '!scripts/archive/**',
    '!node_modules/**',
  ],
  testMatch: ['**/__tests__/**/*.test.mjs', '**/?(*.)+(spec|test).mjs'],
};
