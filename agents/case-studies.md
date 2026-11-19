# Case studies agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`briefs/*.html`, `briefs/case-study.css`, and referenced approved assets; incoming links from selected work and the archive.

Explain project problems, personal contributions, implementation decisions, and supported outcomes. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Separate the owner's contribution from team or organization outcomes; source factual claims and avoid invented metrics.
- Check narrative structure, screenshots, captions, accessible headings, navigation back to the portfolio, and responsive layout.
- Keep private brief Markdown and client material out of public pages. A new public page needs a separately listed change to `scripts/build-site.js` approved through the coordinator.
- Preserve page security policies and coordinate changes to shared project descriptions with their owners.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Every published claim is supported; pages and assets are deliberately included in the public build; private material is excluded; page navigation and layout work.

Relevant verification: `tests/security.test.js`, `node scripts/build-site.js`, and browser inspection of every changed case-study page; existing browser coverage alone may not cover all page layouts.
