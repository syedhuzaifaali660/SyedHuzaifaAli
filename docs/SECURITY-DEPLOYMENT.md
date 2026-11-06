# Security deployment and maintenance

Build with `node scripts/build-site.js`. Preview and publish only `dist/`, never the repository root. The build starts clean, includes three named case-study pages and their referenced assets, and exports only the project fields needed by the page. Add new public pages deliberately to the page allowlist in the build script.

Run `node --test tests/*.test.js` before publishing. The GitHub Actions workflow tests, builds, and uploads only `dist/`. Set repository Settings > Pages > Build and deployment > Source to **GitHub Actions**, then publish the reviewed changes to master. No remote deployment was performed during the local security changes.

The old Jekyll configuration excludes development directories as defense in depth, but it is not a replacement for the allowlisted build. Do not add private material to this repository, even if excluded from deployment: a public repository and its history are independently readable.

Unused original photos, IDE files, the generation manifest, and obsolete JavaScript libraries were preserved in the sibling `SyedHuzaifaAli-private/security-cleanup-2026-11-06/` directory. These files are removed from the current website tree, not from prior Git commits or existing remote deployments. Historical cleanup and cache removal require a separate review; do not rewrite shared history casually.

## Browser protections

Every public HTML page has an early Content Security Policy and referrer policy. Inline scripts, executable project URLs, object embeds, forms, and child frames are blocked. Project text is written with DOM text setters, not interpreted as HTML. Layout CSS remains local; the old Bootstrap CSS contains layout rules only. The vulnerable jQuery, Bootstrap JavaScript, and legacy plugin scripts are removed.

The analytics SDK and external icon stylesheet have integrity hashes. If the analytics provider updates its mutable SDK URL, the browser will refuse the changed bytes and the historical visit baseline remains visible. Review upstream changes, update the SHA-384 hash in `js/portfolio-analytics.js`, and verify analytics before accepting a new SDK. Do not remove integrity checking as a workaround. Analytics host checks are traffic hygiene, not authentication.

## Accepted hosting limitation: response headers

The user chose to keep GitHub Pages on 2026-11-06. GitHub Pages does not apply custom `_headers` files. The CSP meta tag cannot enforce `frame-ancestors`, and HTML cannot set `X-Frame-Options` or `X-Content-Type-Options`. These protections are not fixed on GitHub Pages by committing this file.

Enforcing these remaining response headers would require a host supporting custom headers or a controlled custom-domain proxy. No hosting migration is planned. HTTPS/HSTS on GitHub Pages and the page-level CSP remain in use.

After deployment, check the live homepage and case-study response headers and confirm old private asset URLs return 404. A local test cannot remove files already served by the old deployment.

## Optional browser regression check

With Playwright available to Node and Chromium installed, run `node scripts/check-browser.cjs` after building. The check uses a temporary localhost server, sends no analytics events, tests hostile project data and navigation, confirms all images load, and checks that private paths return 404. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` optionally selects an already installed browser. Screenshots go to ignored `output/playwright/`.
