import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

// GJS globals available at runtime
const gjs = {
  log: 'readonly',
  logError: 'readonly',
  print: 'readonly',
  printerr: 'readonly',
  ARGV: 'readonly',
  imports: 'readonly',
  global: 'readonly',
  globalThis: 'readonly',
  Debugger: 'readonly',
  System: 'readonly',
  Window: 'readonly',
  TextDecoder: 'readonly',
  TextEncoder: 'readonly',
};

export default [
  {
    ignores: ['**/node_modules/**', '**/schemas/gschemas.compiled'],
  },

  js.configs.recommended,

  {
    files: ['statlens/**/*.js'],
    languageOptions: {
      globals: gjs,
      sourceType: 'module',
    },
    rules: {
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-prototype-builtins': 'off',
      'no-undef': ['error'],
    },
  },

  // Disable formatting rules that conflict with Prettier
  eslintConfigPrettier,
];
