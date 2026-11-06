const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
let security = {};
try { security = require('../js/projects.js'); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

test('project links reject executable schemes, disguised URLs and credential-bearing links', () => {
    assert.equal(typeof security.safeUrl, 'function');
    for (const url of ['javascript:alert(1)', 'java\nscript:alert(1)', 'data:text/html,evil', '//evil.example',
        'http://example.com', 'https://user:secret@example.com/', '../private.md', 'briefs/../private.md']) {
        assert.equal(security.safeUrl(url, 'link'), null, url);
    }
    assert.equal(security.safeUrl('https://example.com/demo?v=1', 'link'), 'https://example.com/demo?v=1');
    assert.equal(security.safeUrl('briefs/heat-pump-planar.html', 'link'), 'briefs/heat-pump-planar.html');
});

test('project images are limited to local public images', () => {
    assert.equal(typeof security.safeUrl, 'function');
    for (const url of ['https://tracker.example/image.png', 'img/../../private.png', 'img/%2e%2e/private.png',
        'img/x.jpg" onerror="alert(1)', 'ProfilePicture/IMG_1802.JPG']) {
        assert.equal(security.safeUrl(url, 'image'), null, url);
    }
    assert.equal(security.safeUrl('img/projects/GolfGame.png', 'image'), 'img/projects/GolfGame.png');
});

test('deployment copies only approved assets and omits private source fields', () => {
    const script = path.resolve(__dirname, '../scripts/build-site.js');
    assert.ok(fs.existsSync(script), 'an allowlisted publishing build must exist');
    const { buildSite } = require(script);
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-public-'));
    try {
        buildSite(path.resolve(__dirname, '..'), output);
        for (const file of ['index.html', 'js/projects.js', 'briefs/heat-pump-planar.html', 'img/projects/ata-app-store/ipad-05-highres.webp']) {
            assert.ok(fs.existsSync(path.join(output, file)), file);
        }
        for (const file of ['briefs/scenic.md', 'analytics-setup.md', 'tests/security.test.js', '.git/config',
            'ProfilePicture/IMG_1802.JPG', 'img/projects/thumbnails/generation-manifest.json']) {
            assert.ok(!fs.existsSync(path.join(output, file)), file);
        }
        const projects = JSON.parse(fs.readFileSync(path.join(output, 'projects.json')));
        assert.equal(projects.length, require('../projects.json').length);
        assert.ok(projects.every(project => !('details' in project) && !('originalImageUrl' in project)));
    } finally { fs.rmSync(output, { recursive: true, force: true }); }
});
