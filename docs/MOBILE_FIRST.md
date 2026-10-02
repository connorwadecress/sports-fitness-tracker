# Mobile-First Guidelines

Most users will be on a phone, often mid-workout, with one hand, sweaty fingers, and patchy signal. Build for that.

## Layout

- **Start at 375px wide.** Write base Tailwind classes for mobile and add `sm:` / `md:` / `lg:` for larger screens. Never design desktop-first and shrink it down.
- **No horizontal scrolling** at 320px wide.
- **16px minimum side gutters** (`px-4`).
- **Respect safe areas** (notch and home indicator). The viewport uses `viewport-fit=cover`, so pad edge-pinned UI with `env(safe-area-inset-*)`.
- **Use `dvh`, not `vh`,** for full-height layouts so mobile browser toolbars don't cause jumps.

## Touch

- **Tap targets of at least 44×44px** (`min-h-11 min-w-11`).
- **Put main actions within thumb reach.** Prefer bottom navigation or bottom-anchored primary buttons over top-right controls.
- **Don't rely on hover.** Everything must work by tap.
- Leave at least 8px between adjacent tap targets.

## Forms (logging workouts)

- Use the right `inputMode` and `type` (`inputMode="decimal"` for weights and distances, `type="number"`/`"tel"` where suitable) so the right keyboard appears.
- **Inputs need a font size of 16px or more**, or iOS Safari zooms in on focus.
- Prefill sensible defaults, such as the last-used weight or reps.
- Keep forms short, and save as the user goes where possible.

## Performance

- **Server Components by default.** Only add `"use client"` where you need interactivity.
- Use `next/image` for images and `next/font` for fonts (already set up).
- **Budget:** LCP under 2.5s and INP under 200ms on a mid-range Android over 4G.
- Lazy-load heavy client components such as charts with `next/dynamic`.

## Accessibility

- Aim for WCAG 2.2 AA: 4.5:1 text contrast, visible focus states, and labelled inputs.
- Support system dark mode (`prefers-color-scheme`).
- Respect `prefers-reduced-motion`.
- Don't disable pinch-zoom.

## Testing on a real phone

1. Run `npm run dev` and open the **Network** URL on a phone on the same Wi-Fi.
2. Or open a PR and use the **Vercel preview URL**.
3. In Chrome DevTools, check device mode at 375×812 and 360×800, with network throttled to "Fast 4G".
