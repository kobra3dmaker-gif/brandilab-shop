# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- **Gift buyers and collectors** looking for a striking object (dragons, figures, masks, lamps, decor) for themselves or as a present.
- **Gamers upgrading their desk setup** (controller stands, gaming accessories) who need the piece to be functional and fit their gear.

Mostly Italian visitors (Italian is the default language, English is offered). Many arrive on mobile from BrandiLab's TikTok Shop, Vinted, eBay and Subito presence.

## Product Purpose

BrandiLab's own online shop for its 3D-printed creations. The visitor should see how good the objects are, trust that they are well made, and buy directly here (Stripe Checkout) instead of on a marketplace. Success = add-to-cart and completed checkout.

## Positioning

Small Italian studio that designs and prints every piece itself, to order, with care for detail. Not mass-produced marketplace stock. Custom designs on request.

## Operating Context

- Catalogue lives in Sanity CMS (title, price, image, description, material, category, color, featured flag). One main image per product.
- Cart is client-side (localStorage); checkout is a Stripe Checkout Session created by a Cloudflare Worker (`api-worker/`).
- Static Vue 3 + Vite SPA deployed to GitHub Pages (brandilab.it); rebuilt when Sanity content changes.
- Bilingual (it/en via vue-i18n), light and dark theme following the OS with a manual toggle.

## Capabilities and Constraints

- **Made to order:** each item is printed after the order, in 1–2 days.
- **Delivery:** 2–3 working days in Italy.
- Materials: mainly PLA, also TPU and PETG depending on the product.
- Custom design requests are handled via the contact form / email.
- Free shipping is **not** a confirmed offer. Items are **not** in stock for immediate dispatch.

## Brand Commitments

- Name: BrandiLab. Logo: `brandilab-shop/src/assets/logo.webp`.
- Seller: BrandiLab, P.IVA IT04260600368, 41026 Pavullo nel Frignano (MO). Business email: brandilab3d@gmail.com.
- Order emails: Stripe's own receipts only (no custom email service), by owner decision.
- Voice: warm, direct, artisanal, Italian first.
- Palette: Apple.com's colour palette (white / #f5f5f7 / #1d1d1f ink / black tiles / #0071e3 action blue), pinned by the owner on 2026-10-08.
- Motion: Apple.com-style animation, requested by the owner.

## Evidence on Hand

- Product photos and data from Sanity.
- Real `featured` flag in Sanity (may be shown as "Bestseller"/featured).
- Marketplace presence: TikTok Shop, Vinted, eBay, Subito (logos in `src/assets/logos/`).
- **No customer reviews, ratings, sales counts or testimonials are available. Never fabricate them.** No confirmed limited editions, discounts or free-shipping thresholds.

## Product Principles

1. The object is the hero: every surface should make the printed piece look as good as it really is.
2. Honest persuasion only: craft, process, materials and real timings, never invented social proof or urgency.
3. Short path to buy: from first view to cart in as few, smooth steps as possible, especially on mobile.
4. Two audiences, one shop: decor/collectibles and gaming gear both feel first-class.
