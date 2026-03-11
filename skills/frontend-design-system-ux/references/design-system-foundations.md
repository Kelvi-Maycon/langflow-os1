# Design System Foundations

## Token Model

- Start with semantic tokens, not one-off component colors.
- Keep the first layer small: canvas, surface, elevated surface, primary text, muted text, border, primary action, accent, success, warning, danger.
- Split primitive palette tokens from semantic tokens only when the system is large enough to justify the extra indirection.
- Keep naming stable across CSS and JS theme files.

## Color

- Reserve one clear primary action color and one secondary accent unless the brand already requires more.
- Keep surface depth shallow. Most screens need only canvas, card, and emphasis surfaces.
- Keep body text at or above 4.5:1 contrast against its background.
- Keep large text, iconography, and UI boundaries at or above 3:1 when they carry meaning.
- Avoid using color as the only way to show status or validation.
- Prefer quiet neutrals behind content so emphasis colors stay meaningful.

## Typography

- Limit the system to one display family and one workhorse body family unless an existing brand system says otherwise.
- Use roughly 4-6 type sizes per screen, not a dozen micro-variants.
- Keep body text comfortable to read; avoid shrinking below 14px for product UI.
- Let headings create structure. Use weight, size, and spacing together instead of size alone.
- Keep line length controlled in reading-heavy views.

## Spacing And Layout

- Use a consistent 4px or 8px rhythm.
- Let section spacing be visibly larger than component padding.
- Align edges aggressively. Messy alignment weakens polish faster than muted color issues.
- Use whitespace to group meaning before reaching for borders.
- Keep dense screens readable by creating clear zones and repeated alignment rules.

## Radius, Border, And Elevation

- Use radius to reinforce tone. Fewer sizes feel more systemized.
- Keep border opacity low but visible enough to separate light surfaces.
- Use shadows sparingly. Prefer one subtle card shadow and one stronger hero or overlay shadow.
- Do not stack border, heavy shadow, and colored background on every card at once.

## Motion

- Give motion a job: orient, confirm, or stage content.
- Keep one easing curve family and 2-3 duration steps.
- Disable or reduce non-essential animation when `prefers-reduced-motion` is active.
- Avoid constant looping effects outside very deliberate hero moments.

## Accessibility Baseline

- Preserve keyboard access for every interactive control.
- Make focus-visible styles obvious and consistent.
- Pair validation color with text and, when useful, icons.
- Keep hit areas comfortable on touch devices.
- Use semantic HTML first, then add ARIA only when the component truly needs custom semantics.

## Practical Default

Use this baseline when the prompt is vague:

- expressive but restrained typography
- light background with strong text contrast
- one hero accent and one support accent
- generous section spacing
- rounded but not inflated components
- short, purposeful motion
