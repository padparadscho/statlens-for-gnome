// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {
  COINGECKO_ASSET_NAME,
  COINGECKO_ASSET_SYMBOL,
  PREFERENCES_KEYS,
  STATS_LABELS,
  STATS_ROWS,
} from '../constants.js';
import { formatCount, formatNumber, formatPrice } from '../utils.js';
import { ProgressBar } from './progressBar.js';
import { Sparkline } from './sparkline.js';

const textFormatters = {
  volume(data, currency) {
    return formatNumber(data.volume, currency);
  },
  mc(data, currency) {
    return formatNumber(data.mc, currency);
  },
  fdv(data, currency) {
    return data.fdv != null ? formatNumber(data.fdv, currency) : '---';
  },
};

export class StatsSection extends PopupMenu.PopupMenuSection {
  constructor(settings, extensionPath) {
    super();

    this._settings = settings;
    this._extensionPath = extensionPath;
    this._rows = {};
    this._headerItem = null;
    this._logoIcon = null;
    this._rankLabel = null;
    this._valueLabels = {};
    this._priceLabel = null;
    this._changeLabel = null;
    this._sparkline = null;
    this._highLowBar = null;
    this._highLowCaption = null;
    this._supplyBar = null;
    this._supplyCaption = null;
    this._emptyItem = null;
    this._active = true;

    this._rebuild();

    this._enabledStatsChangedId = settings.connect(
      `changed::${PREFERENCES_KEYS.ENABLED_STATS}`,
      () => {
        if (this._active) this._rebuild();
      },
    );
  }

  setActive(active) {
    this._active = active;
    if (active) this._rebuild();
    else this.clearRows();
  }

  update(data, currency) {
    this._updateHeader(data);

    if (this._priceLabel) {
      const arrow = data.change >= 0 ? '▲' : '▼';
      this._priceLabel.text = `${formatPrice(data.price, currency)} ${arrow}`;
      this._priceLabel.style_class =
        data.change >= 0 ? 'green-text' : 'red-text';
    }

    if (this._changeLabel) {
      const arrow = data.change >= 0 ? '▲' : '▼';
      this._changeLabel.text = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}% ${arrow}`;
      this._changeLabel.style_class =
        data.change >= 0 ? 'green-text' : 'red-text';
    }

    for (const [key, label] of Object.entries(this._valueLabels))
      label.text = textFormatters[key]?.(data, currency) ?? '---';

    if (this._supplyBar) this._updateSupply(data);
    if (this._highLowBar) this._updateHighLow(data, currency);
    if (this._sparkline) this._sparkline.setPrices(data.sparkline);
  }

  _updateHeader(data) {
    if (this._rankLabel && data.rank != null)
      this._rankLabel.text = `#${data.rank}`;
  }

  _updateSupply(data) {
    if (data.circulatingSupply == null) {
      this._supplyBar.setProgress(0);
      this._supplyCaption.text = '---';
      return;
    }
    if (data.totalSupply != null && data.totalSupply > 0) {
      const percent = (data.circulatingSupply / data.totalSupply) * 100;
      this._supplyBar.setProgress(percent);
      this._supplyCaption.text = `${formatCount(data.circulatingSupply)} / ${formatCount(data.totalSupply)}`;
    } else {
      this._supplyBar.setProgress(100);
      this._supplyCaption.text = formatCount(data.circulatingSupply);
    }
  }

  _updateHighLow(data, currency) {
    if (data.high == null || data.low == null || data.price == null) {
      this._highLowBar.setProgress(0);
      this._highLowCaption.text = '---';
      return;
    }
    const range = data.high - data.low;
    const percent = range > 0 ? ((data.price - data.low) / range) * 100 : 100;
    this._highLowBar.setProgress(percent);
    this._highLowCaption.text = `${formatPrice(data.low, currency)} / ${formatPrice(data.high, currency)}`;
  }

  clearRows() {
    if (this._headerItem) {
      this._headerItem.destroy();
      this._headerItem = null;
      this._logoIcon = null;
      this._rankLabel = null;
    }

    if (this._sparkline) this._sparkline.setPrices([]);
    for (const row of Object.values(this._rows)) row.destroy();
    this._rows = {};
    this._valueLabels = {};
    this._priceLabel = null;
    this._changeLabel = null;

    this._sparkline = null;

    this._highLowBar = null;
    this._highLowCaption = null;

    this._supplyBar = null;
    this._supplyCaption = null;

    if (this._emptyItem) {
      this._emptyItem.destroy();
      this._emptyItem = null;
    }
  }

  destroy() {
    if (this._enabledStatsChangedId) {
      this._settings.disconnect(this._enabledStatsChangedId);
      this._enabledStatsChangedId = null;
    }
    super.destroy();
  }

  _rebuild() {
    this.clearRows();

    this._addHeaderRow();

    const enabled = new Set(
      this._settings.get_strv(PREFERENCES_KEYS.ENABLED_STATS),
    );
    const filteredRows = STATS_ROWS.filter(([key]) => enabled.has(key));

    if (filteredRows.length === 0) {
      this._emptyItem = this._addEmptyRow();
      return;
    }

    for (const [key] of filteredRows) {
      if (key === 'sparkline') {
        this._rows[key] = this._addSparklineRow();
      } else if (key === 'supply') {
        this._rows[key] = this._addSupplyRow();
      } else if (key === 'hl') {
        this._rows[key] = this._addHighLowRow();
      } else {
        const [row, valueLabel] = this._addRow(STATS_LABELS[key]);
        this._rows[key] = row;
        if (key === 'price') this._priceLabel = valueLabel;
        else if (key === 'change') this._changeLabel = valueLabel;
        else this._valueLabels[key] = valueLabel;
      }
    }
  }

  _createSection(label, ...widgets) {
    const item = this._createMenuItem();
    const vbox = new St.BoxLayout({ vertical: true, x_expand: true });
    const nameLabel = new St.Label({
      text: label.toUpperCase(),
      style_class: 'label-text',
    });
    vbox.add_child(nameLabel);
    for (const widget of widgets) vbox.add_child(widget);
    item.add_child(vbox);
    this.addMenuItem(item);
    return item;
  }

  _addRow(label) {
    const valueLabel = new St.Label({ text: '---' });
    const item = this._createSection(label, valueLabel);
    return [item, valueLabel];
  }

  _addHeaderRow() {
    const item = this._createMenuItem(true);
    item.add_style_class_name('header-item');

    const headerRow = new St.BoxLayout({
      style_class: 'header-row',
      x_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });

    const logoPath = GLib.build_filenamev([
      this._extensionPath,
      'icons',
      'stronghold-logo.svg',
    ]);
    this._logoIcon = new St.Icon({
      gicon: new Gio.FileIcon({ file: Gio.File.new_for_path(logoPath) }),
      icon_size: 18,
      fallback_icon_name: 'image-x-generic-symbolic',
      y_align: Clutter.ActorAlign.CENTER,
    });

    const labelsBox = new St.BoxLayout({
      vertical: true,
      x_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
      style_class: 'header-labels',
    });

    const nameLabel = new St.Label({
      text: COINGECKO_ASSET_NAME,
      style_class: 'header-name',
    });

    const symbolLabel = new St.Label({
      text: COINGECKO_ASSET_SYMBOL,
      style_class: 'header-symbol',
    });

    this._rankLabel = new St.Label({
      text: '---',
      style_class: 'rank-badge',
      y_align: Clutter.ActorAlign.START,
      x_align: Clutter.ActorAlign.END,
    });

    labelsBox.add_child(nameLabel);
    labelsBox.add_child(symbolLabel);

    headerRow.add_child(this._logoIcon);
    headerRow.add_child(labelsBox);
    headerRow.add_child(this._rankLabel);

    item.add_child(headerRow);
    this.addMenuItem(item);

    this._headerItem = item;
  }

  _addSparklineRow() {
    this._sparkline = new Sparkline();
    return this._createSection(STATS_LABELS.sparkline, this._sparkline);
  }

  _addHighLowRow() {
    this._highLowBar = new ProgressBar();
    this._highLowCaption = new St.Label({
      text: '---',
      style_class: 'progress-bar-caption',
    });
    return this._createSection(
      STATS_LABELS.hl,
      this._highLowBar,
      this._highLowCaption,
    );
  }

  _addSupplyRow() {
    this._supplyBar = new ProgressBar();
    this._supplyCaption = new St.Label({
      text: '---',
      style_class: 'progress-bar-caption',
    });
    return this._createSection(
      STATS_LABELS.supply,
      this._supplyBar,
      this._supplyCaption,
    );
  }

  _addEmptyRow() {
    const item = this._createMenuItem(false);
    const label = new St.Label({
      text: 'No data selected',
      style_class: 'empty-text',
    });
    item.add_child(label);
    this.addMenuItem(item);
    return item;
  }

  _createMenuItem(reactive = true) {
    const item = new PopupMenu.PopupBaseMenuItem({
      reactive,
      activate: false,
      hover: false,
      can_focus: false,
    });
    item.track_hover = false;
    return item;
  }
}
