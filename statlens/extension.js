// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

import { StatsService } from './services/stats.js';
import { AlarmsService } from './services/alarms.js';
import { StatsSection } from './ui/statsSection.js';
import { Indicator } from './ui/indicator.js';
import { Menu } from './ui/menu.js';
import {
  COINGECKO_ASSET_SYMBOL,
  COINGECKO_ASSET_URL,
  PREFERENCES_KEYS,
} from './constants.js';
import { formatPrice } from './utils.js';

export default class StatlensExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._cancellable = new Gio.Cancellable();
    this._fetching = false;
    this._lastData = null;
    this._lastCurrency = null;
    this._notificationSource = null;

    this._stats = new StatsService(this._settings);
    this._alarms = new AlarmsService(this._settings);

    this._indicator = new Indicator();

    const statsSection = new StatsSection(this._settings, this.dir.get_path());
    this._menu = new Menu(
      this.uuid,
      this._settings,
      this._stats.meta,
      statsSection,
      () => this._refresh(),
    );
    this._indicator.menu.addMenuItem(this._menu);

    Main.panel.addToStatusArea(this.uuid, this._indicator);

    this._refresh();
    this._startTimer();
    this._connectSettings();
  }

  disable() {
    this._cancellable?.cancel();
    this._stopTimer();
    this._disconnectSettings();
    this._indicator?.destroy();
    this._notificationSource?.destroy();
    this._indicator = null;
    this._menu = null;
    this._stats = null;
    this._alarms = null;
    this._settings = null;
    this._notificationSource = null;
    this._lastData = null;
    this._lastCurrency = null;
  }

  _getNotificationSource() {
    if (!this._notificationSource) {
      this._notificationSource = new MessageTray.Source({
        title: 'Statlens',
        icon: new Gio.ThemedIcon({ name: 'alarm-symbolic' }),
      });

      // The shell may destroy the source (e.g. the user clears it from the
      // Notifications panel); reset the reference so it gets recreated.
      this._notificationSource.connect('destroy', () => {
        this._notificationSource = null;
      });

      Main.messageTray.add(this._notificationSource);
    }

    return this._notificationSource;
  }

  async _refresh() {
    if (this._fetching) return;

    this._fetching = true;

    try {
      const currency = this._settings.get_string(
        PREFERENCES_KEYS.DISPLAY_CURRENCY,
      );
      const data = await this._stats.fetchCoinStats(
        currency,
        this._cancellable,
      );
      if (this._cancellable.is_cancelled()) return;

      this._menu.restore();

      this._lastData = data;
      this._lastCurrency = currency;

      this._indicator.setPrice(data.price, data.change, currency);
      this._menu.update(data, currency);

      this._notifyTriggeredAlarms(data.priceUsd);
    } catch (error) {
      if (this._cancellable.is_cancelled()) return;
      this._indicator.setError(error.message);
      this._menu.collapse();
    } finally {
      this._fetching = false;
    }
  }

  _notifyTriggeredAlarms(priceUsd) {
    const triggeredAlarms = this._alarms.consumeTriggered(priceUsd);
    if (triggeredAlarms.length === 0) return;

    const source = this._getNotificationSource();

    for (const alarm of triggeredAlarms) {
      const notification = new MessageTray.Notification({
        source,
        title: `${COINGECKO_ASSET_SYMBOL} Price Alarm`,
        body: `Price ${alarm.above ? 'reached' : 'dropped to'} ${formatPrice(alarm.target, 'usd')}`,
      });
      notification.connect('activated', () => {
        Gio.AppInfo.launch_default_for_uri(COINGECKO_ASSET_URL, null);
      });
      source.addNotification(notification);
    }
  }

  _startTimer() {
    const interval = this._settings.get_int(PREFERENCES_KEYS.REFRESH_INTERVAL);
    this._timeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      interval,
      () => {
        this._refresh();
        return GLib.SOURCE_CONTINUE;
      },
    );
  }

  _stopTimer() {
    if (this._timeoutId) {
      GLib.Source.remove(this._timeoutId);
      this._timeoutId = null;
    }
  }

  _connectSettings() {
    this._signalIds = [];

    this._signalIds.push(
      this._settings.connect(
        `changed::${PREFERENCES_KEYS.REFRESH_INTERVAL}`,
        () => {
          this._stopTimer();
          this._startTimer();
        },
      ),
    );

    this._signalIds.push(
      this._settings.connect(
        `changed::${PREFERENCES_KEYS.DISPLAY_CURRENCY}`,
        () => this._refresh(),
      ),
    );

    this._signalIds.push(
      this._settings.connect(`changed::${PREFERENCES_KEYS.API_KEY}`, () => {
        this._stats.setApiKey(
          this._settings.get_string(PREFERENCES_KEYS.API_KEY),
        );
        this._refresh();
      }),
    );

    this._signalIds.push(
      this._settings.connect(
        `changed::${PREFERENCES_KEYS.ENABLED_STATS}`,
        () => {
          if (this._lastData && this._lastCurrency)
            this._menu.update(this._lastData, this._lastCurrency);
        },
      ),
    );
  }

  _disconnectSettings() {
    for (const id of this._signalIds) {
      if (id) this._settings.disconnect(id);
    }
    this._signalIds = [];
  }
}
