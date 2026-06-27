// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Gio from 'gi://Gio';

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export class Menu extends PopupMenu.PopupMenuSection {
  constructor(uuid, meta, statsSection, refreshCallback) {
    super();

    this._uuid = uuid;
    this._meta = meta;
    this._refreshCallback = refreshCallback;
    this._stats = statsSection;

    this.addMenuItem(this._stats);
    this._addOuterItems(true);
  }

  collapse() {
    this._clearOuterItems();
    this._stats.setActive(false);

    const settingsItem = new PopupMenu.PopupImageMenuItem(
      'Settings',
      'system-settings-symbolic',
      {},
    );
    settingsItem.connect('activate', () => {
      const ext = Extension.lookupByUUID(this._uuid);
      ext?.openPreferences()?.catch(() => {});
    });
    this.addMenuItem(settingsItem);
  }

  restore() {
    this._clearOuterItems();
    this._stats.setActive(true);
    this._addOuterItems(true);
  }

  _clearOuterItems() {
    for (const item of this._getMenuItems().slice(1)) item.destroy();
  }

  _addOuterItems(showRefresh) {
    if (showRefresh && this._meta?.label) {
      this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      const linkItem = new PopupMenu.PopupImageMenuItem(
        this._meta.label,
        'webpage-symbolic',
        {},
      );
      linkItem.connect('activate', () => {
        if (this._meta?.url)
          Gio.AppInfo.launch_default_for_uri(this._meta.url, null);
      });
      this.addMenuItem(linkItem);
    }

    if (showRefresh) {
      const refreshItem = new PopupMenu.PopupImageMenuItem(
        'Refresh',
        'view-refresh-symbolic',
        {},
      );
      refreshItem.connect('activate', () => {
        refreshItem.stop_emission_by_name('activate');
        this._refreshCallback();
      });
      this.addMenuItem(refreshItem);
    }

    this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const settingsItem = new PopupMenu.PopupImageMenuItem(
      'Settings',
      'system-settings-symbolic',
      {},
    );
    settingsItem.connect('activate', () => {
      const ext = Extension.lookupByUUID(this._uuid);
      ext?.openPreferences()?.catch(() => {});
    });
    this.addMenuItem(settingsItem);
  }

  update(data, currency) {
    this._stats.update(data, currency);
  }
}
