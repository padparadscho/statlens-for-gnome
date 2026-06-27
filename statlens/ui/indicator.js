// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { formatPrice } from '../utils.js';

export const Indicator = GObject.registerClass(
  {
    GTypeName: 'StatlensIndicator',
  },
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.5, 'Statlens', false);

      this._label = new St.Label({
        text: '---',
        y_align: Clutter.ActorAlign.CENTER,
      });
      this.add_child(this._label);
    }

    setPrice(price, change, currency) {
      this._label.text = formatPrice(price, currency);
      this._label.style_class = change >= 0 ? 'green-text' : 'red-text';
    }

    setError(message) {
      this._label.text = message ?? '---';
      this._label.style_class = 'orange-text';
    }
  },
);
