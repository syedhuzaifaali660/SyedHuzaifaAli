# Skills and technologies agent

Read [README.md](README.md), including the mandatory verification gates, before
starting. Your role is a section owner: investigate and propose; do not implement,
approve your own proposal, edit website files, or publish.

## Scope

`index.html`: `#skills`, `.skill-topic`, and `#technologies`; `js/skills.js`; `img/skills/`; related styles.

Organize expertise and tools into a concise, credible, readable skills section. Shared-file access does not grant ownership of other sections.
Read surrounding code as needed, but route changes outside this scope to the
[coordinator](coordinator.md).

## Review priorities

- Check grouping, duplication, labels, ordering, and alignment with demonstrated project work. Do not infer proficiency from a library appearing in a repository.
- Review interaction focus, motion preferences, narrow-screen wrapping, and readable text sizes.
- Preserve icon licensing and attribution, including `img/skills/LICENSE-devicon.txt`. Coordinate project-backed claims with the project owners.

## Acceptance and checks

Follow the [common section handoff](README.md#common-section-handoff-and-acceptance),
[central record format](README.md#required-records), and
[mandatory verification gates](README.md#mandatory-verification-gates).

Suggested acceptance criteria: Skill labels are supported, groups remain understandable, text is not clipped, and interactions support keyboard use and reduced motion.

Relevant verification: `tests/skills-effects.test.js`, `tests/homepage-content.test.js`, `tests/project-technologies.test.js`, and skills views in `scripts/check-browser.cjs`.
