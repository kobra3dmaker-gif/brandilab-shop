---
name: BrandiLab
description: A small Italian studio's catalogue of 3D-printed objects, each sold from its own tile.
colors:
  paper: "#ffffff"
  mist: "#f5f5f7"
  ink: "#1d1d1f"
  ink-secondary: "#6e6e73"
  ink-tertiary: "#86868b"
  hairline: "#d2d2d7"
  tile-black: "#000000"
  action-blue: "#0071e3"
  action-blue-hover: "#0077ed"
  on-blue: "#ffffff"
  danger: "#e30000"
  night-tile: "#1d1d1f"
  night-tile-raised: "#2c2c2e"
  night-ink-secondary: "#a1a1a6"
  night-hairline: "#424245"
  night-focus: "#2997ff"
  night-danger: "#ff453a"
typography:
  display:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.6rem, 7.6vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.9rem, 4vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 125"
  statement:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2rem, 4.6vw, 4rem)"
    fontWeight: 750
    lineHeight: 1.08
    letterSpacing: "-0.035em"
    fontVariation: "'wdth' 112"
  title:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1rem, 1.35vw, 1.2rem)"
    fontWeight: 750
    lineHeight: 1.12
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 112"
  price:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1rem, 1.35vw, 1.2rem)"
    fontWeight: 800
    letterSpacing: "-0.02em"
    fontFeature: "'tnum' 1"
    fontVariation: "'wdth' 125"
  body:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.005em"
    fontVariation: "'wdth' 112"
rounded:
  none: "0px"
spacing:
  tile-gap: "12px"
  tile-gap-mobile: "8px"
  tile-padding: "clamp(0.85rem, 1.8vw, 1.5rem)"
  gutter: "clamp(1rem, 3vw, 2.5rem)"
  container-max: "1440px"
  masthead: "68px"
components:
  button-blue:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.on-blue}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.8rem 1.4rem"
    height: "48px"
  button-blue-hover:
    backgroundColor: "{colors.action-blue-hover}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.8rem 1.4rem"
    height: "48px"
  button-ink-hover:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.on-blue}"
  button-line:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.8rem 1.4rem"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tile-light:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.tile-padding}"
  tile-dark:
    backgroundColor: "{colors.tile-black}"
    textColor: "{colors.mist}"
    rounded: "{rounded.none}"
    padding: "{spacing.tile-padding}"
  cart-square:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.on-blue}"
    rounded: "{rounded.none}"
    width: "44px"
    height: "44px"
  field-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "0.8rem 0.9rem"
    height: "48px"
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 1rem"
    height: "40px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: BrandiLab

## Overview

**Creative North Star: "The Catalogo on a White Table"**

A 1970s Italian product catalogue (one object per sheet, every piece sold by its own plate, name and price) set in Apple.com's palette. The page is white; products sit in square-cornered tiles that alternate a pale mist grey and pure black in a checkerboard, separated by 12px gutters of white. Everything typographic is one variable family, Archivo, and width does the work a display face would usually do: headlines run expanded and heavy, prices run expanded with tabular figures, body text stays at normal width.

The density is catalogue density: tiles are packed edge to edge in a 2/3/4-column mosaic with the newest piece opening as a 2×2 spread, while text surfaces (cover, product sheet, About, Contact) are held together by 2px ink rules rather than boxes. There are no rounded corners, no drop shadows and no gradients on any storefront surface. Depth comes from tone (mist against white, black against white) and from motion.

Motion is Apple-style by owner request: long, critically damped settles with no overshoot. Headlines rise out of a blur on load, tiles rise on scroll while their photo uncovers bottom-up like a print being laid down, and adding to cart sends the product photo flying into the masthead cart square. UI controls themselves stay under 300ms. Reduced motion collapses all of it to cross-fades.

**Key Characteristics:**
- White ground, mist-grey and black tiles in a positional checkerboard, 12px white gutters.
- One action blue for buying and the cart; ink for everything else.
- One family (Archivo variable), expanded heavy display, tabular prices.
- Square corners everywhere; 2px ink rules as the structural line.
- Authored line SVG icons with square caps.
- Long damped settles for reveals; sub-300ms for controls.

## Colors

Apple.com's palette, pinned by the owner: two neutral grounds, one near-black ink, black tiles, and a single action blue.

### Primary
- **Action Blue** (`action-blue`): every buy and checkout button, the masthead cart square, and the primary CTA on a black field (the custom-design tile, the About mission band). It also marks the order → print → deliver process as small solid squares, the bullet markers of product descriptions, the text caret, text selection (at 22% alpha), and the focus ring. Hover deepens to **Action Blue Hover** (`action-blue-hover`). In dark theme the focus ring shifts to **Night Focus Blue** (`night-focus`); the buttons keep the same blue.

### Neutral
- **Paper** (`paper`): the page ground in light theme, the cart drawer and mobile menu, form-field fill. In dark theme the ground becomes black (`tile-black`).
- **Mist** (`mist`): the light product tile, the cart drawer header, the footer, the About masthead, and the hover fill of quantity steppers. In dark theme the light tile becomes **Night Tile** (`night-tile`).
- **Tile Black** (`tile-black`): the dark product tile and the black bands (custom-design tile, About mission). In dark theme, where the ground is already black, the dark tile lifts to **Night Tile Raised** (`night-tile-raised`).
- **Ink** (`ink`): all primary text, the 2px structural rules, the outline of inputs, chips and steppers, the ink button. Inverted to mist (`#f5f5f7`) in dark theme.
- **Ink Secondary** (`ink-secondary`): intros, descriptions, counts, the second cover line, footer links. **Night Ink Secondary** (`night-ink-secondary`) in dark theme and on black tiles.
- **Ink Tertiary** (`ink-tertiary`): placeholders, the footer legal line, the resting remove icon.
- **Hairline** (`hairline`): 1px dividers between cart lines, spec rows, contact info rows and the footer base. **Night Hairline** (`night-hairline`) in dark theme.
- **Danger** (`danger` / `night-danger`): checkout errors and the remove icon on hover. Nowhere else.

### Named Rules
**The One Blue Rule.** Blue means "this moves you toward owning the object": buy, checkout, cart, and the single primary CTA of a black band. Navigation and secondary actions are ink or ink-outline. Decorative use is limited to the small square markers of the making process and description lists.

**The Checkerboard Rule.** Tile tone is set by grid position, not by product, so every column count reads as a checkerboard of mist and black. A product carries its desktop-mosaic tone onto its product page plate and its cart thumbnail.

**The No-Gradient Rule.** Surfaces are flat fills. The only translucency is the masthead (white or near-black at 80% with a 10px backdrop blur), which falls back to solid paper under reduced transparency.

## Typography

**Display Font:** Archivo variable, self-hosted (with system-ui, -apple-system, Segoe UI fallback)
**Body Font:** Archivo variable (same family)

**Character:** One grotesque family stretched across its width axis. Expanded (125%) and heavy (800–900) for display, wordmark and prices; semi-expanded (112%) and bold for buttons, product names and small headings; normal width for reading. The pairing is internal: contrast comes from width and weight, not from a second face.

### Hierarchy
- **Display** (800, 125% width, `clamp(2.6rem, 7.6vw, 6rem)` on the home cover, up to `clamp(2.75rem, 8vw, 6rem)` on page titles, line-height 0.92, -0.035em, balanced wrap): the cover line, page titles, the feature tile's product name (850, `clamp(2rem, 3.7vw, 3.6rem)`, max 14ch).
- **Headline** (800, 125% width, `clamp(1.9rem, 4vw, 3.25rem)`): section titles on About and Contact, the catalogue title (`clamp(1.75rem, 3vw, 2.5rem)`), the cart title (1.9rem). Always sits on or under a 2px ink rule.
- **Statement** (750, 112% width, `clamp(2rem, 4.6vw, 4rem)`, line-height 1.08, max 22ch): the "how we work" sentence whose words light up as it scrolls.
- **Title** (750, 112% width, `clamp(1rem, 1.35vw, 1.2rem)`, line-height 1.12, clamp to 3 lines): product names on tiles.
- **Price** (800, 125% width, tabular figures): every price. Tile `clamp(1rem, 1.35vw, 1.2rem)`, feature tile `clamp(1.4rem, 2.4vw, 2.2rem)`, product page `clamp(1.75rem, 3vw, 2.6rem)`, cart total 1.6rem at 850.
- **Body** (400, 1rem, line-height 1.55; descriptions 1.6 at max 62ch): reading text. Intros run 1–1.125rem in ink-secondary at max 44ch.
- **Label** (700, 112% width, 1rem, line-height 1.1): buttons. Smaller controls (language toggle 0.8rem at 0.04em, chips 0.9rem at 600) stay sentence or code case.

### Named Rules
**The Width-Is-Display Rule.** Never add a second typeface for headlines. Promote text by widening Archivo (112% → 125%) and adding weight.

**The Tabular Price Rule.** Prices, counts and quantities always use tabular numerals and expanded width.

**The Footer Wordmark.** The footer closes with "BrandiLab" at 900 weight, 125% width, `clamp(3.25rem, 13.5vw, 13rem)`, -0.055em, line-height 0.82, its letters rising out of the fold as the footer enters view.

## Layout

A 1440px container with a fluid gutter (`clamp(1rem, 3vw, 2.5rem)`) holds all text. The product mosaic breaks out of the gutter and runs nearly full-bleed with 12px outer padding and 12px gaps (8px under 700px).

- **Mosaic:** 2 columns under 700px (feature spans the full row), 3 columns from 700px (feature spans 2×2), 4 columns from 1100px. A related-products **strip** runs 2 columns, then 4 from 900px. A black custom-design tile spanning two columns closes the unfiltered catalogue.
- **Cover:** the display line and a side column (intro + three-step process list between 2px rules) sit side by side from 960px at 1.55 : 1; under 560px the intro hides and the steps compress into one wrapped line so the mosaic starts inside the first viewport.
- **Product page:** a two-column spread from 960px (plate 1.25fr, sheet 1fr); the plate field sticks under the masthead while the sheet scrolls.
- **Masthead:** fixed, 68px. Navigation collapses into a full-screen paper menu at 860px, with links set as stacked display type over 2px rules.
- **Rhythm:** sections are separated by a 2px ink rule plus clamp-based padding (roughly 1.5–3rem above, 3–6rem below a section). Tile interiors use `clamp(0.85rem, 1.8vw, 1.5rem)` padding and `clamp(0.75rem, 1.4vw, 1.1rem)` internal gaps.

## Elevation & Depth

The storefront is flat. No surface casts a shadow; depth is tonal (mist and black tiles on white, a mist header on the paper drawer) and temporal (things arrive by motion). Overlays separate by a 2px ink rule and, for the cart drawer, a 45% near-black scrim.

### Named Rules
**The Flat Catalogue Rule.** No box-shadows on storefront surfaces. If a layer needs separating, use a 2px ink rule, a tone change, or the scrim.

### Motion
- **Settle curve** (`cubic-bezier(0.16, 1, 0.3, 1)`): all reveals and load choreography. Headlines rise 0.35em out of a 10px blur over 1.1s, staggered ~110ms per line; side content rises 24px over 1s. Scroll reveals rise 56px (opacity 0.9s, travel 1.2s), staggered 90ms by column; tile photos uncover bottom-up via clip-path over 1.1s while settling from 1.14 scale over 1.8s.
- **Control curve** (`cubic-bezier(0.23, 1, 0.32, 1)`): press feedback (scale 0.97, 160ms), underline sweeps (220ms), the cart square bump (scale 1.18 over 420ms), button label swaps (220ms blur-in).
- **Drawer curve** (`cubic-bezier(0.32, 0.72, 0, 1)`): cart drawer in 380ms, out 220ms.
- **Page transition:** a blur cross-fade; the new page rises 18px out of a 6px blur.
- **Scroll timelines** (where supported, no-preference only): the cover recedes to 15% opacity and 0.92 scale as the catalogue rises over it; the feature photo drifts ±6% as parallax; footer letters rise out of the fold.
- **Reduced motion:** cross-fades only; no flight, no reveal, no parallax, no blur.

## Shapes

Square corners everywhere on the storefront: tiles, buttons, inputs, chips, the cart square, the drawer, the cookie card, badges (0px). Structure is drawn with lines: 2px ink rules for sections, outlines of inputs/chips/steppers and the drawer edge; 1px hairlines for row dividers inside lists. Product photos are mounted as 4:5 plates inside their tile, never bleeding to the tile edge. The only circles are the brand roundel logo (40px) and the checkout loading spinner. Icons are authored line SVGs, 2–2.75px stroke, square caps and joins.

## Components

### Buttons
Rectangular blocks, confident and heavy.
- **Shape:** square corners (0px), min-height 48px (56px for the feature tile, product page and checkout), 2px border slot.
- **Blue (primary):** action blue fill, white label, 700 weight at 112% width. Used for add-to-cart, checkout, and the one CTA on a black band. Hover deepens to action-blue-hover.
- **Ink:** ink fill, paper label. Hover turns action blue. Used for "back to catalogue", retry, contact submit.
- **Line:** 2px ink outline, ink label; hover fills ink. Used for "our story", cookie choices.
- **Press:** scale 0.97 over 160ms. Disabled at 55% opacity.
- **Added state:** after adding, the label swaps (blur-in, 220ms) to a check and "Aggiunto" for 1.6s.

### Chips
- **Style:** 2px ink outline, 40px tall, 600 weight 0.9rem, square.
- **State:** selected fills ink with a paper label. Only rendered when real category data exists.

### Cards / Containers (Product Tiles)
- **Corner Style:** square (0px).
- **Background:** mist or tile-black by grid position (see The Checkerboard Rule); text flips accordingly.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Internal Padding:** `clamp(0.85rem, 1.8vw, 1.5rem)`.
- **Anatomy:** name and price on one row at the top (stacked under 700px), the photo plate below at 4:5, a full-width blue add button at the bottom. Plate hover zooms 1.035 over 500ms; name hover gets a 2px underline. The feature tile moves its button above the plate so it lands in the first viewport, and may carry a small inverted "featured" tag only when the real Sanity `featured` flag is set.

### Inputs / Fields
- **Style:** 2px ink outline, paper fill, square, min-height 48px, 1rem text, ink-tertiary placeholder, blue caret. Search carries an inline magnifier SVG; sort is a native select with a custom chevron.
- **Focus:** 3px focus-blue outline at 2px offset on the whole field.
- **Error:** danger-coloured 600-weight message below; no red borders.

### Navigation
- **Masthead:** fixed translucent bar; a 2px ink rule appears under it once the page scrolls. Left: roundel and "BrandiLab" wordmark (850, 125% width). Right: Catalogo / Chi siamo / Contatti at 600 weight with a 2px underline that sweeps in from the left on hover and stays on the current page; an IT/EN segmented toggle in a 2px ink frame (active segment filled ink); a line-icon theme toggle; and the cart.
- **Mobile (≤860px):** hamburger (two lines) opens a full-screen paper menu of display-size links over 2px rules, with the language toggle and theme switch below.

### Cart Square (signature)
A 44px blue square in the masthead showing the item count in expanded 800-weight tabular figures. On add to cart the product's plate is cloned and flies (520ms, two-stage arc, shrinking and fading) into the square, which then floods ink and bumps to 1.18 scale. Reduced motion skips the flight and only updates the count.

### Cart Drawer
Paper panel from the right, max 440px, 2px ink left edge, mist header with a display "Carrello" title. Lines show a 72px thumbnail on its product's tile tone, name, a 2px-framed quantity stepper, and a tabular line price, separated by hairlines. The footer sits under a 2px rule: total in expanded 850 weight, the made-to-order note in ink-secondary, a full-width 56px blue checkout button.

### Scroll Statement
A large semi-expanded statement whose words light from 16% to full opacity one after another as it scrolls through the viewport, set under a 2px rule with an ink-outline button below.

## Do's and Don'ts

### Do:
- **Do** keep every buy, checkout and cart affordance action blue (`#0071e3`), and keep everything else ink or ink-outline.
- **Do** assign tile tone by grid position so each layout reads as a mist/black checkerboard on white, with 12px gaps (8px on mobile).
- **Do** set headlines, prices and the wordmark in Archivo at 125% width and 800–900 weight; use tabular numerals for every number a shopper compares.
- **Do** separate sections with a 2px ink rule and list rows with a 1px hairline.
- **Do** mount product photos as 4:5 plates inside their tile, carrying the tile's tone to the product page and cart thumbnail.
- **Do** use `cubic-bezier(0.16, 1, 0.3, 1)` for reveals and keep control feedback under 300ms; give every motion a reduced-motion cross-fade fallback.
- **Do** draw icons as inline line SVGs with square caps, 2–2.75px stroke.

### Don't:
- **Don't** round corners on tiles, buttons, fields, chips or overlays; circles are reserved for the logo roundel and the spinner.
- **Don't** add box-shadows, gradients or glows to storefront surfaces.
- **Don't** introduce a second typeface or a system display face; widen Archivo instead.
- **Don't** use blue for navigation links, headings or decoration beyond the process-step and list-marker squares.
- **Don't** show ratings, review stars, stock counters, countdowns or free-shipping badges; the system has no component for them because the product has no such evidence.
- **Don't** let the action blue appear on more than one button per black band or per product tile.
