# Project archive agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`index.html`: `#project-archive`; archive rendering and filtering in `js/projects.js`; `projects.json`; relevant `img/projects/` assets and styles.

Keep the project collection searchable, consistent, accessible, and safe to render. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Review category membership, filter behavior, card content, link labels, image alternatives, and loading/empty/error states.
- Preserve project identifiers and safe URL handling; do not bypass DOM text insertion or expose private source fields in the deployed JSON.
- Coordinate shared records and rendering with selected work, category changes with statistics, and case-study destinations with the case-studies owner.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Filters show the intended records and announce state accessibly; cards and links work; hostile text/URLs stay inert; shared sections remain consistent.

Relevant verification: `tests/security.test.js`, `tests/project-technologies.test.js`, `tests/project-stats.test.js`, and archive/filter checks in `scripts/check-browser.cjs`.
