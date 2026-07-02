// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { AlarmsService } from './services/alarms.js';
import {
  AVAILABLE_CURRENCIES,
  MAX_PRICE_ALARMS,
  MAX_REFRESH_INTERVAL,
  MIN_REFRESH_INTERVAL,
  PREFERENCES_KEYS,
  STATS_ROWS,
} from './constants.js';

export default class StatlensPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const alarmsService = new AlarmsService(settings);

    const settingsPage = new Adw.PreferencesPage({
      name: 'settings',
      title: 'Settings',
      icon_name: 'system-settings-symbolic',
    });
    settingsPage.add(this._buildStatsGroup(settings));
    settingsPage.add(this._buildDataGroup(settings));
    settingsPage.add(this._buildApiGroup(settings));
    settingsPage.add(this._buildRefreshGroup(settings));
    window.add(settingsPage);

    const alarmsPage = new Adw.PreferencesPage({
      name: 'alarms',
      title: 'Alarms',
      icon_name: 'alarm-symbolic',
    });
    window.add(alarmsPage);

    let alarmsGroup = null;
    const rebuildAlarms = () => {
      if (alarmsGroup) alarmsPage.remove(alarmsGroup);
      alarmsGroup = this._buildAlarmsGroup(alarmsService, rebuildAlarms);
      alarmsPage.add(alarmsGroup);
    };
    rebuildAlarms();

    this._showTargetPage(window, settings);
  }

  _showTargetPage(window, settings) {
    const targetPage = settings.get_string(PREFERENCES_KEYS.PREFS_TARGET_PAGE);
    if (!targetPage) return;

    window.set_visible_page_name(targetPage);
    settings.set_string(PREFERENCES_KEYS.PREFS_TARGET_PAGE, '');
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

  _buildAlarmsGroup(alarmsService, rebuildAlarms) {
    const alarms = alarmsService.getAlarms();
    const group = new Adw.PreferencesGroup({
      title: 'Price Alarms',
      description: 'Get notified once when SHX reaches a target price in USD.',
    });

    alarms.forEach((alarm, index) => {
      group.add(
        this._buildAlarmRow(alarmsService, alarms, alarm, index, rebuildAlarms),
      );
    });

    const addRow = new Adw.ButtonRow({ title: 'Add Alarm' });
    addRow.set_sensitive(alarms.length < MAX_PRICE_ALARMS);
    addRow.connect('activated', () => {
      alarmsService.setAlarms([...alarms, { target: 0, above: true }]);
      rebuildAlarms();
    });
    group.add(addRow);

    return group;
  }

  _buildAlarmRow(alarmsService, alarms, alarm, index, rebuildAlarms) {
    const row = new Adw.SpinRow({
      title: `Alarm ${index + 1}`,
      subtitle: alarm.above ? 'Notify above target' : 'Notify below target',
      digits: 6,
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 100000000,
        step_increment: 0.000001,
      }),
      value: alarm.target,
    });

    row.connect('notify::value', () => {
      alarm.target = row.value;
      alarmsService.setAlarms(alarms);
    });

    const directionToggle = this._buildDirectionToggle(alarm, () => {
      row.subtitle = alarm.above
        ? 'Notify above target'
        : 'Notify below target';
      alarmsService.setAlarms(alarms);
    });

    const removeButton = new Gtk.Button({
      icon_name: 'app-remove-symbolic',
      valign: Gtk.Align.CENTER,
      css_classes: ['flat', 'error'],
      tooltip_text: 'Remove alarm',
    });
    removeButton.connect('clicked', () => {
      alarmsService.setAlarms(alarms.filter((_, i) => i !== index));
      rebuildAlarms();
    });

    row.add_suffix(directionToggle);
    row.add_suffix(removeButton);
    return row;
  }

  _buildDirectionToggle(alarm, onChange) {
    const aboveButton = new Gtk.ToggleButton({
      icon_name: 'pan-up-symbolic',
      tooltip_text: 'Notify above target',
      active: alarm.above,
    });

    const belowButton = new Gtk.ToggleButton({
      icon_name: 'pan-down-symbolic',
      tooltip_text: 'Notify below target',
      active: !alarm.above,
    });
    belowButton.set_group(aboveButton);

    const applyColors = () => {
      aboveButton.css_classes = aboveButton.active ? ['success'] : [];
      belowButton.css_classes = belowButton.active ? ['error'] : [];
    };
    applyColors();

    aboveButton.connect('toggled', () => {
      if (!aboveButton.active) return;
      alarm.above = true;
      applyColors();
      onChange();
    });
    belowButton.connect('toggled', () => {
      if (!belowButton.active) return;
      alarm.above = false;
      applyColors();
      onChange();
    });

    const box = new Gtk.Box({
      css_classes: ['linked'],
      valign: Gtk.Align.CENTER,
    });
    box.append(aboveButton);
    box.append(belowButton);
    return box;
  }
}
