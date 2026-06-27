// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

export const Errors = {
  NETWORK_ERROR: 'Network error. Check your connection.',
  PARSE_ERROR: 'Could not parse API response.',
  DATA_ERROR: 'No data available.',
  EMPTY_ERROR: 'Empty response from server.',

  httpError(status) {
    const messages = {
      401: '401: Invalid API key.',
      403: '403: Missing API key.',
      404: '404: Resource not found.',
      429: '429: Rate limit exceeded.',
    };
    return messages[status] ?? `Server returned HTTP ${status}.`;
  },
};
