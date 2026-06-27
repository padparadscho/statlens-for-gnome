// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { AVAILABLE_CURRENCIES, BREAKPOINTS } from './constants.js';

export function currencySymbol(currency) {
  for (const [key, , symbol] of AVAILABLE_CURRENCIES)
    if (key === currency) return symbol;
  return '';
}

export function formatDecimal(value) {
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(6);
}

export function formatPrice(value, currency) {
  const text = currency === 'btc' ? value.toFixed(8) : formatDecimal(value);
  return `${currencySymbol(currency)}${text}`;
}

export function formatNumber(value, currency) {
  const symbol = currencySymbol(currency);
  for (const [divisor, suffix] of BREAKPOINTS) {
    if (value >= divisor)
      return `${symbol}${(value / divisor).toFixed(2)}${suffix}`;
  }
  return `${symbol}${value.toFixed(2)}`;
}

export function formatCount(value) {
  for (const [divisor, suffix] of BREAKPOINTS) {
    if (value >= divisor) return `${(value / divisor).toFixed(1)}${suffix}`;
  }
  return value.toFixed(0);
}
