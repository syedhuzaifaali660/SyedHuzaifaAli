# Portfolio analytics

Account dashboard: https://syedhuzaifaali.goatcounter.com/

The dashboard is restricted to logged-in users. Public visitor counters were enabled in the site's GoatCounter settings. No API keys or account credentials are stored in the portfolio.

## What is counted

- `/portfolio`: portfolio visits. GoatCounter session deduplication is enabled; these are visits, not an exact lifetime count of distinct people.
- `card-click-{project-id}`: clicks anywhere on a card, including its buttons. Repeated clicks are counted.
- `button-click-{project-id}-{button-name}`: the button-specific breakdown, including middle-clicks. This is separate attribution of the same interaction, so don't sum card and button events into a single click total.

The footer displays 1,000 historical visits plus the tracked `/portfolio` count. The historical baseline is applied in the page display. Card and button clicks are available in the private dashboard.

Project IDs are stored in `projects.json` so changing a title or order doesn't reset its history. New projects without an ID derive one from their title; add a permanent unique ID when adding a project.

## Preview and verification

Ordinary localhost previews and unrelated hosts send no tracking events. They can read the real public counts. Production tracking is allowed only on `https://syedhuzaifaali660.github.io/SyedHuzaifaAli/`.

For a deliberate local integration test, use `http://127.0.0.1:8000/?analytics-test=1#work`. All test events have a `test-` path prefix and `TEST /` titles; they never feed the public visit count. Close the test page when finished.

GoatCounter caches its public counter response for up to four hours. If the count is unavailable, the footer displays the historical baseline and identifies it as such in the tooltip.

This code remains local until the portfolio is published. It cannot reconstruct traffic before installation. No deployment, commit or push was performed as part of setup.

Sources: [Counters](https://www.goatcounter.com/help/visitor-counter), [events](https://www.goatcounter.com/help/events), [JavaScript integration](https://www.goatcounter.com/help/js).
