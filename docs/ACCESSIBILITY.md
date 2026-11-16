# Accessibility notes

Weft targets WCAG 2.2 AA for the reviewed routes.

## Automated results

Lighthouse desktop accessibility score is 100 on the dashboard, orders, new order, analytics, materials, architecture, order detail and invoice routes. No failed axe audits were reported at the time of the last check.

## Manual checklist

- [x] Skip link to main content
- [x] Labelled navigation, main and footer landmarks
- [x] Visible focus rings on interactive controls
- [x] Command palette reachable with Ctrl/Cmd+K and dismissable with Escape
- [x] Virtualized rows expose table roles, row count and row index
- [x] Status is conveyed with text and colour, not colour alone
- [x] Reduced-motion rule for animations and smooth scrolling
- [x] Form errors use text and `aria-invalid`
- [x] Theme toggle has an accessible name
- [ ] Keyboard cell-by-cell grid navigation
- [ ] Screen-reader pass with NVDA/VoiceOver

The last two are intentional gaps for a desktop-first ERP demo and are documented rather than claimed.
