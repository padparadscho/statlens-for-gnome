// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import { CoinGeckoClient } from '../api/coinGecko.js';
import { Errors } from '../errors.js';
import {
  COINGECKO_API_URL,
  COINGECKO_ASSET_ID,
  COINGECKO_ASSET_URL,
  PREFERENCES_KEYS,
} from '../constants.js';

export class StatsService {
  constructor(settings) {
    this._settings = settings;
    this._detailsCache = null;
    this._chartCache = null;
    this._client = new CoinGeckoClient(
      COINGECKO_API_URL,
      settings.get_string(PREFERENCES_KEYS.API_KEY),
    );
    this.meta = {
      label: 'Open on CoinGecko',
      url: COINGECKO_ASSET_URL,
    };
  }

  async fetchCoinStats(vsCurrency, cancellable) {
    const priceResponse = await this._client.fetchCoinPrice(
      COINGECKO_ASSET_ID,
      vsCurrency,
      cancellable,
    );
    const rawPriceResponse = priceResponse[COINGECKO_ASSET_ID];
    if (!rawPriceResponse || rawPriceResponse[vsCurrency] === undefined)
      throw new Error(Errors.DATA_ERROR);

    await this._fetchDetailsIfNeeded(cancellable);
    await this._fetchChartIfNeeded(vsCurrency, cancellable);

    return this._normalize(
      rawPriceResponse,
      this._detailsCache,
      this._chartCache,
      vsCurrency,
    );
  }

  async _fetchDetailsIfNeeded(cancellable) {
    if (this._detailsCache) return;

    try {
      this._detailsCache = await this._client.fetchCoinDetails(
        COINGECKO_ASSET_ID,
        cancellable,
      );
    } catch {
      // Detail fields will be missing until next enable
    }
  }

  async _fetchChartIfNeeded(vsCurrency, cancellable) {
    if (this._chartCache) return;

    try {
      const chartResponse = await this._client.fetchCoinChart(
        COINGECKO_ASSET_ID,
        vsCurrency,
        1,
        cancellable,
      );
      this._chartCache = chartResponse.prices?.map(([, price]) => price) ?? [];
    } catch {
      // Sparkline will be empty until next enable
    }
  }

  setApiKey(apiKey) {
    this._client.setApiKey(apiKey);
  }

  _normalize(rawPriceResponse, details, sparkline, vsCurrency) {
    const market = details?.market_data;
    return {
      rank: details?.market_cap_rank ?? null,
      price: rawPriceResponse[vsCurrency],
      priceUsd: rawPriceResponse.usd,
      change: rawPriceResponse[`${vsCurrency}_24h_change`],
      sparkline: sparkline ?? null,
      volume: rawPriceResponse[`${vsCurrency}_24h_vol`],
      high: market?.high_24h?.[vsCurrency] ?? null,
      low: market?.low_24h?.[vsCurrency] ?? null,
      circulatingSupply: market?.circulating_supply ?? null,
      totalSupply: market?.total_supply ?? market?.max_supply ?? null,
      mc: rawPriceResponse[`${vsCurrency}_market_cap`],
      fdv: market?.fully_diluted_valuation?.[vsCurrency] ?? null,
    };
  }
}
