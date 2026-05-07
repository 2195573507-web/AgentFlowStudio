---
name: ui-polisher
description: Review and improve UI components for visual quality, consistency, accessibility, and responsiveness. Use when UI needs refinement or design review.
---

## Trigger

- User asks to "improve the UI" or "make it look better"
- UI review is needed before release
- Components look inconsistent or unstyled
- Accessibility audit is requested

## Steps

1. Review existing UI components for visual consistency
2. Check spacing, typography, color usage against design system
3. Verify dark mode / light mode compatibility
4. Check responsive behavior across breakpoints
5. Audit for accessibility: contrast ratios, keyboard navigation, ARIA labels
6. Identify components that need refinement
7. Apply fixes: adjust spacing, colors, shadows, borders
8. Ensure loading, empty, and error states are handled
9. Verify transition animations are smooth
10. Document any remaining design debt

## Checklist

- [ ] Colors use design system tokens (not hardcoded)
- [ ] Spacing is consistent (4px grid)
- [ ] Typography hierarchy is clear
- [ ] Dark mode renders correctly
- [ ] Interactive elements have hover/focus states
- [ ] Loading states exist for async operations
- [ ] Empty states are informative
- [ ] Error states are actionable
- [ ] Animations are smooth (60fps)
- [ ] Glass-morphism effects are consistent

## Completion Criteria

- Visual consistency across all pages
- No broken layouts at common screen sizes
- Dark mode works on all pages
- Loading, empty, error states present on all data-dependent pages
