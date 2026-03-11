# UX Review Checklist

## First-Pass Questions

- Can a user tell what this screen is for within a few seconds?
- Is the primary action obvious without scanning the whole page?
- Does the layout reflect task priority or just visual symmetry?
- Does the copy describe user goals instead of internal jargon?

## Flow Quality

- Reduce the number of decisions on the critical path.
- Keep destructive or advanced actions away from the main happy path.
- Show the next step when the user completes, fails, or abandons a task.
- Remove dead-end states.

## Forms

- Keep every field labeled.
- Explain why a field matters when the label is not enough.
- Validate early when helpful, late when disruptive.
- Make errors specific and recoverable.
- Keep required versus optional fields obvious.

## Feedback

- Show loading feedback for any action that is not instant.
- Show success feedback when the result is not otherwise obvious.
- Explain errors in plain language and offer the next action.
- Use empty states to teach, not merely report absence.

## Accessibility

- Check keyboard navigation.
- Check focus visibility.
- Check contrast for text and controls.
- Check semantic headings and labels.
- Check whether status, validation, or selection relies on color alone.

## Mobile

- Keep the main action reachable without precision tapping.
- Watch for clipped text, crowded controls, and hidden overflow.
- Preserve hierarchy when columns collapse.
- Avoid huge sticky regions that steal vertical space.

## Common Failure Modes

- Every action looks primary.
- The page relies on decoration instead of structure.
- Cards are used where a simpler list or section would read better.
- Important feedback appears far away from the trigger.
- The interface looks polished in the happy path but breaks in empty or error states.
- The layout mirrors a generic template more than the product's actual task.
