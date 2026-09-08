# Restaurant Order Platform

Generic, white-label ready restaurant website template.

- **Homepage** is designed to be customized per restaurant (logo, colours, text, images, contact).
- Everything else (menu, ordering, staff dashboard) can be built generically on top of this.

## Current Status
Homepage only (static). Built for easy deployment on **Cloudflare Pages**.

## How to customize for a new restaurant
1. Replace images in `/assets`
2. Update text, phone, address, WhatsApp in `index.html`
3. Change brand colour in `css/styles.css` (`--color-secondary`)
4. Update logo

## Deploy to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Create a project → Connect to Git
3. Select this repository (`restaurant-order-platform`)
4. Build settings: Framework preset = None, Build command = (leave empty), Output directory = `/`
5. Deploy

Free SSL + global CDN included.

## Tech
- Pure HTML / CSS / JS (no framework)
- Mobile-first & responsive
- CSS variables for easy rebranding
