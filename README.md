# Web Demos

This repository contains a few small HTML demos. The main landing page lists each example.

## Viewing locally

Open `index.html` in any modern web browser to view the list of demos.

### Included pages

* `auction.html` – simple auction tracker demo
* `moon.html` – whimsical moon advice generator
* `universe.html` – space data dashboard powered by public APIs
* `sky.html` – shows visible planets drifting across your screen

## GitHub Pages

You can enable GitHub Pages in your repository settings to host static content publicly.

## Real-time sky demo configuration

The `projects/realtime-sky.html` page now expects you to supply API keys at runtime. The
previous demo keys have been revoked in the OpenWeather and IPGeolocation dashboards to
avoid accidental reuse. Before publishing the page, follow these steps:

1. Generate fresh API keys for OpenWeather and IPGeolocation in your own accounts.
2. Open the page in a browser while signed in locally. A setup card will prompt you to
   provide both keys; they are stored only in `localStorage` on that browser.
3. Use the "Configure API keys" button to paste the values. If you need to rotate them
   later, click the button again to overwrite the stored keys.
4. Once both keys are present the demo will resume making API calls. Without keys it will
   pause network activity and keep showing the setup instructions instead.

## License

This project is released under the MIT License. See `LICENSE` for details.
