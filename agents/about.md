# About agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`index.html`: `#about`; section-specific rules in `style.css` and `css/responsive.css`.

Present a clear, credible professional biography in the owner's voice. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Review paragraph order, readability, relevance to intended roles, and consistency with the hero and resume.
- Tie new claims about experience, employers, leadership, and achievements to supplied evidence. Flag missing facts instead of filling them in.
- Keep personal contact details and unrelated career notes out of public copy unless the user authorized publishing them.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Copy is supported by evidence, consistent with the rest of the portfolio, and readable without clipping or excessive line length on mobile and desktop.

Relevant verification: `tests/homepage-content.test.js` and About layout checks in `scripts/check-browser.cjs`; manual factual review.
