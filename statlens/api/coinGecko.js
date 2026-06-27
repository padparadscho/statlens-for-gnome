// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';

import { Errors } from '../errors.js';

Gio._promisify(
  Soup.Session.prototype,
  'send_and_read_async',
  'send_and_read_finish',
);

export class CoinGeckoClient {
  constructor(baseUrl, apiKey) {
    this._session = new Soup.Session({ timeout: 30 });
    this._baseUrl = baseUrl;
    this._apiKey = apiKey;
  }

  async fetchCoinPrice(coinId, vsCurrency, cancellable) {
    const url = `${this._baseUrl}/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=${encodeURIComponent(vsCurrency)}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    return this._fetchJson(url, cancellable);
  }

  async fetchCoinDetails(coinId, cancellable) {
    const url = `${this._baseUrl}/coins/${encodeURIComponent(coinId)}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;
    return this._fetchJson(url, cancellable);
  }

  async fetchCoinChart(coinId, vsCurrency, days, cancellable) {
    const url = `${this._baseUrl}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=${encodeURIComponent(vsCurrency)}&days=${encodeURIComponent(days)}`;
    return this._fetchJson(url, cancellable);
  }

  async _fetchJson(url, cancellable) {
    const message = this._prepareRequest(url);
    const bytes = await this._executeRequest(message, cancellable);
    this._validateResponse(message, bytes);
    return this._parseResponse(bytes);
  }

  _prepareRequest(url) {
    const message = Soup.Message.new('GET', url);
    if (this._apiKey) {
      message.get_request_headers().append('x-cg-demo-api-key', this._apiKey);
    }
    return message;
  }

  async _executeRequest(message, cancellable) {
    try {
      return await this._session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        cancellable,
      );
    } catch (err) {
      throw new Error(Errors.NETWORK_ERROR, { cause: err });
    }
  }

  _validateResponse(message, bytes) {
    const status = message.statusCode;
    if (status !== Soup.Status.OK) {
      throw new Error(Errors.httpError(status));
    }

    if (!bytes) {
      throw new Error(Errors.EMPTY_ERROR);
    }
  }

  _parseResponse(bytes) {
    const decoder = new TextDecoder();
    const text = decoder.decode(bytes.get_data());
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(Errors.PARSE_ERROR, { cause: err });
    }
  }

  setApiKey(apiKey) {
    this._apiKey = apiKey;
  }
}
