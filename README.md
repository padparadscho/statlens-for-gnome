> [!IMPORTANT]  
> This project is in active development and may not have been fully tested. Use at your own risk.

> [!WARNING]
> This project and involved contributors are not affiliated with, endorsed by, or sponsored by Stronghold or any of its affiliates. This is an independent personal project developed for educational and experimental purposes only.

> [!NOTE]
> Respect developers, prefer to contribute instead of copying their work.

# Statlens for GNOME

GNOME Shell extension for tracking SHx (Stronghold) asset metrics and notifying on price changes.

## Install

Download the latest release from the [releases page](https://github.com/padparadscho/statlens-for-gnome/releases)

```sh
# Extract
unzip -q statlens@padparadscho.com.zip -d ~/.local/share/gnome-shell/extensions/statlens@padparadscho.com/

# Compile
glib-compile-schemas ~/.local/share/gnome-shell/extensions/statlens@padparadscho.com/schemas/

# Enable
gnome-extensions enable statlens@padparadscho.com
```

> [!NOTE]
> On **Wayland**, log out and log back in. On **X11**, press `Alt + F2`, type `r`, and hit `Enter`.

## License

This project is licensed under the [AGPL-3.0](/LICENSE) license.
