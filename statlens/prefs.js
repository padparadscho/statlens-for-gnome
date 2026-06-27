// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {
  AVAILABLE_CURRENCIES,
  MAX_REFRESH_INTERVAL,
  MIN_REFRESH_INTERVAL,
  PREFERENCES_KEYS,
  STATS_ROWS,
} from './constants.js';

export default class StatlensPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage();
    page.add(this._buildStatsGroup(settings));
    page.add(this._buildDataGroup(settings));
    page.add(this._buildApiGroup(settings));
    page.add(this._buildRefreshGroup(settings));
    window.add(page);
  }

  _buildStatsGroup(settings) {
    const group = new Adw.PreferencesGroup({
      title: 'Stats',
      description: 'Toggle which stats are shown in the menu.',
    });

    const enabledKeys = new Set(
      settings.get_strv(PREFERENCES_KEYS.ENABLED_STATS),
    );

    for (const [key, label] of STATS_ROWS) {
      const row = new Adw.SwitchRow({
        title: label,
        active: enabledKeys.has(key),
      });

      row.connect('notify::active', () => {
        const currentKeys = new Set(
          settings.get_strv(PREFERENCES_KEYS.ENABLED_STATS),
        );
        if (row.active) currentKeys.add(key);
        else currentKeys.delete(key);
        settings.set_strv(PREFERENCES_KEYS.ENABLED_STATS, [...currentKeys]);
      });

      group.add(row);
    }

    return group;
  }

  _buildDataGroup(settings) {
    const group = new Adw.PreferencesGroup({ title: 'Data' });

    const currencyRow = new Adw.ComboRow({
      title: 'Currency',
      subtitle: 'Which currency to display prices in.',
      model: Gtk.StringList.new(AVAILABLE_CURRENCIES.map(([, label]) => label)),
    });

    const selectedIndex = AVAILABLE_CURRENCIES.findIndex(
      ([key]) => key === settings.get_string(PREFERENCES_KEYS.DISPLAY_CURRENCY),
    );
    if (selectedIndex >= 0) currencyRow.set_selected(selectedIndex);

    currencyRow.connect('notify::selected', () => {
      const [currencyKey] = AVAILABLE_CURRENCIES[currencyRow.selected];
      settings.set_string(PREFERENCES_KEYS.DISPLAY_CURRENCY, currencyKey);
    });

    group.add(currencyRow);
    return group;
  }

  _buildApiGroup(settings) {
    const group = new Adw.PreferencesGroup({ title: 'API' });

    const apiKeyRow = new Adw.PasswordEntryRow({
      title: 'CoinGecko API Key.',
    });
    settings.bind(
      PREFERENCES_KEYS.API_KEY,
      apiKeyRow,
      'text',
      Gio.SettingsBindFlags.DEFAULT,
    );

    group.add(apiKeyRow);
    return group;
  }

  _buildRefreshGroup(settings) {
    const group = new Adw.PreferencesGroup({ title: 'Refresh' });

    const intervalRow = new Adw.SpinRow({
      title: 'Refresh Interval.',
      subtitle: 'How often to fetch new data (in seconds).',
      adjustment: new Gtk.Adjustment({
        lower: MIN_REFRESH_INTERVAL,
        upper: MAX_REFRESH_INTERVAL,
        step_increment: 10,
      }),
    });
    settings.bind(
      PREFERENCES_KEYS.REFRESH_INTERVAL,
      intervalRow,
      'value',
      Gio.SettingsBindFlags.DEFAULT,
    );

    group.add(intervalRow);
    return group;
  }
}
