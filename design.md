---
name: Heritage Industrial Minimal
colors:
  surface: '#fcf8f7'
  surface-dim: '#ddd9d8'
  surface-bright: '#fcf8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f2'
  surface-container: '#f1edec'
  surface-container-high: '#ebe7e6'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#534345'
  inverse-surface: '#313030'
  inverse-on-surface: '#f4f0ef'
  outline: '#867275'
  outline-variant: '#d8c1c3'
  surface-tint: '#924756'
  primary: '#541626'
  on-primary: '#ffffff'
  primary-container: '#702c3b'
  on-primary-container: '#f195a5'
  inverse-primary: '#ffb2be'
  secondary: '#77592a'
  on-secondary: '#ffffff'
  secondary-container: '#ffd79d'
  on-secondary-container: '#7a5c2c'
  tertiary: '#35292e'
  on-tertiary: '#ffffff'
  tertiary-container: '#4c3f45'
  on-tertiary-container: '#bcabb1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9de'
  primary-fixed-dim: '#ffb2be'
  on-primary-fixed: '#3d0415'
  on-primary-fixed-variant: '#75303f'
  secondary-fixed: '#ffddb0'
  secondary-fixed-dim: '#e8c088'
  on-secondary-fixed: '#281800'
  on-secondary-fixed-variant: '#5d4215'
  tertiary-fixed: '#f1dee4'
  tertiary-fixed-dim: '#d4c2c8'
  on-tertiary-fixed: '#23191d'
  on-tertiary-fixed-variant: '#504349'
  background: '#fcf8f7'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.005em
  numeric-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses the precision, prestige, and grounded authority of high-end textile manufacturing and billing operations. Crafted for executive dashboards, ledger auditing, loom-to-client pipeline tracking, and high-volume billing, the visual language combines the disciplined restraint of Swiss financial applications with the tactility and quiet luxury of an established weaving house.

Key stylistic principles:
- **Disciplined Prestige:** The interface uses deep, steeped burgundy and subtle warm gold accents to reflect legacy and trade authority, balanced against an airy, calm backdrop.
- **Architectural Utility:** A clean, minimal layout prioritizes dense transactional data, currency precision, and complex line-item legibility without visual exhaustion.
- **Micro-Detail Luxury:** Hairline dividers, strict tabular alignment, and crisp geometric surfaces ensure billing tables read like modern fine-print ledgers rather than generic SaaS utilities.

## Colors

The palette balances deep organic textile tones with razor-sharp ledger contrast.

- **Primary (`#702C3B` - Deep Burgundy):** Reserved for primary navigation bars, top-level dashboard headers, primary call-to-action buttons, high-priority invoice state badges, and brand anchors.
- **Secondary (`#D4AE77` - Warm Gold):** Employed selectively for focal accents, active state indicator rings, subtle icon highlights, premium account tier tags, and interactive focus trims. Never overused as a background wash.
- **Tertiary & Base Text (`#30252A` - Espresso Charcoal):** Deep, warm slate-charcoal used for all primary titles, invoice amounts, numbers, and high-priority data points. Avoid pure `#000000`.
- **Muted Text (`#6C5D64` - Heather Slate):** Used for metadata, invoice timestamps, table column headers, units (meters/kg), and helper strings.
- **Page Canvas (`#FAF6F5` - Pale Alabaster):** A low-strain, warm tinted off-white that keeps long shifts of invoice scanning gentle on the eyes.
- **Surface (`#FFFFFF`):** Pure white designated exclusively for elevated panels, invoice sheets, tables, and modal dialogues.
- **Borders & Rules (`#E8DFDC` - Threadline):** Crisp 1px structural outlines defining boundaries between ledger rows, ledger cards, and split panes.
- **Functional Semantics:**
  - Success (`#1E7B54` - Emerald): Paid status, completed shipments, balanced ledgers.
  - Warning (`#B8741A` - Amber): Pending approval, partial payments, low yarn stock.
  - Error (`#B82A3A` - Crimson): Overdue invoices, payment failures, cancelled work orders.

## Typography

Inter serves as the single typographic anchor across all viewports to achieve uncompromising tabular alignment and structural density. 

Implementation Rules:
- **Tabular Figures:** All tables, metrics, invoice totals, rate cards, and date columns must enforce `font-feature-settings: "tnum" 1, "cv05" 1` to ensure vertical alignment across integer decimals and dates.
- **Label Formatting:** `label-md` and `label-sm` should be styled in uppercase with intentional positive tracking (`letterSpacing: 0.04em` to `0.05em`) when serving as table headers, status tags, or field indicators.
- **Hierarchy Restraint:** Avoid gratuitous weight jumping. Use medium (`500`) for primary numbers and ledger rows, reserving semibold (`600`) strictly for section heads and financial totals.
