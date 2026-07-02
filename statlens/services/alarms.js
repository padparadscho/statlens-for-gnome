// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import GLib from 'gi://GLib';

import { PREFERENCES_KEYS } from '../constants.js';

export class AlarmsService {
  constructor(settings) {
    this._settings = settings;
  }

  getAlarms() {
    return this._settings
      .get_value(PREFERENCES_KEYS.PRICE_ALARMS)
      .deep_unpack()
      .map(([target, above]) => ({ target, above }));
  }

  setAlarms(alarms) {
    const variant = new GLib.Variant(
      'a(db)',
      alarms.map(({ target, above }) => [target, above]),
    );
    this._settings.set_value(PREFERENCES_KEYS.PRICE_ALARMS, variant);
  }

  consumeTriggered(priceUsd) {
    const alarms = this.getAlarms();
    const triggered = alarms.filter((alarm) =>
      alarm.above ? priceUsd >= alarm.target : priceUsd <= alarm.target,
    );

    if (triggered.length > 0)
      this.setAlarms(alarms.filter((alarm) => !triggered.includes(alarm)));

    return triggered;
  }
}
