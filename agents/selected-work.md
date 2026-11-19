# Selected work agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`index.html`: `#work` and `#featured-projects`; featured rendering in `js/projects.js`; relevant entries in `projects.json`; referenced project images.

Make the strongest relevant projects easy to understand and explore. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Check project selection, ordering, concise problem/role/outcome wording, thumbnails, and case-study destinations.
- Compare static featured markup with generated rendering so the two do not contradict each other.
- Coordinate shared project records and rendering with the project-archive owner, and case-study claims with the case-studies owner. Do not invent metrics or contributions.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Featured projects render consistently, use supported claims and working links, and retain a readable mobile layout.

Relevant verification: `tests/homepage-content.test.js`, `tests/project-technologies.test.js`, `tests/security.test.js`, and featured-card checks in `scripts/check-browser.cjs`.
