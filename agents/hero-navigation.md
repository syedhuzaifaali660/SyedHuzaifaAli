# Hero and navigation agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`index.html`: `.header_area` and `#home`; relevant rules in `style.css` and `css/responsive.css`; navigation behavior in `js/active.js`.

Improve first impressions, professional positioning, calls to action, and navigation. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Check heading hierarchy, mobile menu keyboard behavior, Escape/focus handling, active-link state, and section anchor destinations.
- Check hero text, video contrast, loading cost, reduced-motion behavior, and resume download target.
- Coordinate changes to section IDs with their owners. Visit-count collection in `js/portfolio-analytics.js` is outside your scope; route analytics changes to the coordinator.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Navigation and hero work at mobile and desktop widths without overlap; links reach their intended destinations; keyboard and reduced-motion behavior are verified.

Relevant verification: `tests/homepage-content.test.js`, `scripts/check-browser.cjs`; analytics tests only if the approved scope includes analytics.
