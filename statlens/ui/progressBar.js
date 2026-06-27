// SPDX-FileCopyrightText: 2026 Padparadscho <contact@padparadscho.com>
// SPDX-License-Identifier: AGPL-3.0-only

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

export const ProgressBar = GObject.registerClass(
  {
    GTypeName: 'StatlensProgressBar',
  },
  class ProgressBar extends St.Widget {
    _init() {
      super._init({
        style_class: 'progress-bar-track',
        x_expand: true,
        y_expand: false,
      });

      this._fill = new St.Widget({
        style_class: 'progress-bar-fill',
      });
      this.add_child(this._fill);
      this._percent = 0;
    }

    setProgress(percent) {
      this._percent = Math.max(0, Math.min(100, percent));
      this.queue_relayout();
    }

    vfunc_allocate(box) {
      this.set_allocation(box);
      const width = box.get_width();
      const height = box.get_height();
      const fillWidth = Math.round((width * this._percent) / 100);

      const fillBox = new Clutter.ActorBox();
      fillBox.x1 = 0;
      fillBox.y1 = 0;
      fillBox.x2 = fillWidth;
      fillBox.y2 = height;

      this._fill.allocate(fillBox);
    }

    vfunc_get_preferred_width(_forHeight) {
      return [100, 100];
    }

    vfunc_get_preferred_height(_forWidth) {
      return [6, 6];
    }
  },
);
