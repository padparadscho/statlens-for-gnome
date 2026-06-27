// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import GObject from 'gi://GObject';
import St from 'gi://St';

import { SPARKLINE_GREEN_COLOR, SPARKLINE_RED_COLOR } from '../constants.js';

export const Sparkline = GObject.registerClass(
  {
    GTypeName: 'StatlensSparkline',
  },
  class Sparkline extends St.DrawingArea {
    _init() {
      super._init({
        style_class: 'sparkline',
        x_expand: true,
        y_expand: false,
        reactive: false,
      });
      this._prices = [];
      this.connect('destroy', () => {
        this._prices = [];
      });
    }

    setPrices(prices) {
      this._prices = prices ?? [];
      this.queue_repaint();
    }

    vfunc_repaint() {
      if (this._prices.length < 2) return;

      const [width, height] = this.get_surface_size();
      const cr = this.get_context(); // cairo context

      const min = Math.min(...this._prices);
      const max = Math.max(...this._prices);
      const range = max - min || 1;
      const stepX = width / (this._prices.length - 1);

      const [r, g, b, a] =
        this._prices.at(-1) >= this._prices[0]
          ? SPARKLINE_GREEN_COLOR
          : SPARKLINE_RED_COLOR;
      cr.setSourceRGBA(r, g, b, a);
      cr.setLineWidth(1.5);

      for (let index = 0; index < this._prices.length; index++) {
        const x = index * stepX;
        const y = height - ((this._prices[index] - min) / range) * height;
        if (index === 0) cr.moveTo(x, y);
        else cr.lineTo(x, y);
      }
      cr.stroke();

      cr.$dispose();
    }
  },
);
