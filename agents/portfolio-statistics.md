# Portfolio statistics agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`index.html`: `.cool_facts_area`; `js/project-stats.js`; count integration in `js/projects.js`; category data in `projects.json`.

Keep displayed project counts understandable and grounded in the source data. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Trace each count from category membership through counting and display formatting; distinguish exact values, rounded values, and lower-bound claims.
- Inspect existing rounding and special cases explicitly. Do not treat current tests or display wording as evidence that a numeric claim is accurate.
- Check category overlap, duplicate counting, empty data, fallback labels, animation, and reduced motion. Coordinate data changes with the archive owner.
- Portfolio visits belong to analytics in the hero, not to project statistics; route that work to the coordinator.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Each displayed number has an explained derivation; labels accurately describe rounding or bounds; updates and fallback states are accessible.

Relevant verification: `tests/project-stats.test.js`, related content checks, and browser checks for rendered counts; propose a regression test for changed counting behavior.
