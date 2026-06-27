// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

export const PREFERENCES_KEYS = {
  API_KEY: 'set-api-key',
  REFRESH_INTERVAL: 'set-refresh-interval',
  DISPLAY_CURRENCY: 'set-display-currency',
  ENABLED_STATS: 'set-enabled-stats',
};

export const AVAILABLE_CURRENCIES = [
  ['usd', 'USD', '$'],
  ['eur', 'EUR', '€'],
  ['btc', 'BTC', '₿'],
];

export const BREAKPOINTS = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

export const MIN_REFRESH_INTERVAL = 10;
export const MAX_REFRESH_INTERVAL = 600;

export const STATS_ROWS = [
  ['price', 'Price'],
  ['change', '24h Change'],
  ['sparkline', '24h Sparkline'],
  ['volume', '24h Volume'],
  ['hl', '24h High / Low'],
  ['supply', 'Circulating Supply'],
  ['mc', 'Market Cap'],
  ['fdv', 'Fully Diluted Valuation'],
];

export const STATS_LABELS = Object.fromEntries(STATS_ROWS);

export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_ASSET_ID = 'stronghold-token';
export const COINGECKO_ASSET_URL =
  'https://www.coingecko.com/en/coins/stronghold';

export const SPARKLINE_GREEN_COLOR = [0.15, 0.64, 0.41, 1.0];
export const SPARKLINE_RED_COLOR = [0.88, 0.11, 0.14, 1.0];
