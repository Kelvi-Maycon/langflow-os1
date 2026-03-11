# Component And State Patterns

## Core Component Set

Start with the minimum set that can support most screens:

- page shell
- header and section wrappers
- primary, secondary, tertiary, and destructive buttons
- text input, select, textarea, checkbox, switch
- cards or panels
- navigation items
- badges, alerts, empty states, loaders

## Buttons

- Keep only one primary action in a local area.
- Use secondary and tertiary buttons to reduce visual noise.
- Keep destructive actions visually distinct and confirm them when risk is meaningful.
- Preserve visible hover, focus-visible, disabled, and loading states.

## Forms

- Keep labels visible. Do not rely on placeholders as labels.
- Place helper or validation text close to the field it describes.
- Validate with clear language, not only red borders.
- Keep field widths proportional to expected input length when that improves scanning.
- Group long forms into sections with progress or headings.

## Cards And Panels

- Use cards to group meaning, not as the default wrapper for every element.
- Keep one internal spacing rule per card type.
- Let titles, metadata, and actions follow the same order everywhere.
- Avoid noisy combinations of tinted background, thick border, and heavy shadow.

## Navigation

- Make the current location obvious.
- Keep navigation labels short and task-based.
- Collapse secondary navigation on mobile before collapsing primary context.
- Preserve keyboard navigation and focus order in menus, tabs, and drawers.

## Data And Dashboards

- Lead with the most decision-relevant metrics.
- Group supporting metrics nearby instead of spreading them evenly across the page.
- Use tables for comparison and cards for summary.
- Right-align numeric columns when it improves scanning.
- Add empty and zero-data states that explain what to do next.

## State Coverage

Check each critical screen for:

- default
- hover
- focus-visible
- active or pressed
- selected
- disabled
- loading
- empty
- error
- success

Missing states often create the "unfinished" feeling even when the base screen looks good.

## Responsive Rules

- Keep the primary task obvious on narrow screens.
- Stack sections before shrinking text too far.
- Preserve action placement consistency between desktop and mobile.
- Reduce decorative density on mobile before removing information hierarchy.
- Test overflow for long labels, translated copy, and user-generated content.

## Implementation Bias

- Reuse tokens first, reusable components second, one-off styles last.
- Keep component APIs small and composable.
- Prefer semantic markup and native controls when possible.
- Extract a shared primitive when the same anatomy appears three times or more.
