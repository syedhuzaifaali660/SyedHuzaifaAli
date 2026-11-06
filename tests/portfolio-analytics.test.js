const test = require('node:test');
const assert = require('node:assert/strict');
let analytics = {};
try { analytics = require('../js/portfolio-analytics.js'); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

function harness(active = true) {
    const events = [];
    const tracker = analytics.createTracker({ active, send: event => events.push(event) });
    return { tracker, events };
}

test('ordinary localhost and unrelated sites never send portfolio tracking', () => {
    assert.equal(typeof analytics.trackingMode, 'function');
    assert.equal(analytics.trackingMode(new URL('http://127.0.0.1:8000/?review=cards')), 'off');
    assert.equal(analytics.trackingMode(new URL('https://example.com/SyedHuzaifaAli/')), 'off');
    assert.equal(analytics.trackingMode(new URL('https://syedhuzaifaali660.github.io/another-site/')), 'off');
    assert.equal(analytics.trackingMode(new URL('https://syedhuzaifaali660.github.io/SyedHuzaifaAli/?review=cards#work')), 'production');
    assert.equal(analytics.trackingMode(new URL('http://127.0.0.1:8000/?analytics-test=1')), 'test');
});

test('project button clicks record separate card and button events', () => {
    const h = harness();
    h.tracker.click('planar', 'Heat Pump PlanAR', 'watch-demo');
    h.tracker.click('planar', 'Heat Pump PlanAR', 'watch-demo');
    assert.deepEqual(h.events.map(event => event.path), [
        'card-click-planar', 'button-click-planar-watch-demo',
        'card-click-planar', 'button-click-planar-watch-demo'
    ]);
    assert.ok(h.events.every(event => event.event && event.no_session));
});

test('card body clicks record only a card event and local previews send nothing', () => {
    const h = harness();
    h.tracker.click('planar', 'Heat Pump PlanAR', null);
    assert.deepEqual(h.events.map(event => event.path), ['card-click-planar']);
    const local = harness(false);
    local.tracker.click('planar', 'Heat Pump PlanAR', 'watch-demo');
    assert.equal(local.events.length, 0);
});

test('a missing path is zero only when the service returns a valid zero count', () => {
    assert.equal(typeof analytics.counterValue, 'function');
    assert.equal(analytics.counterValue(404, {count:'1'}), null);
    assert.equal(analytics.counterValue(503, {}), null);
    assert.equal(analytics.counterValue(403, {count:'0'}), null);
    assert.equal(analytics.counterValue(200, {count:'<script>'}), null);
});

test('the public visit counter adds the baseline once to valid counts', () => {
    assert.equal(analytics.counterValue(404, {count:'0'}), '1,000');
    assert.equal(analytics.counterValue(200, {count:'23'}), '1,023');
    assert.equal(analytics.counterValue(200, {count:'1,234'}), '2,234');
    assert.equal(analytics.counterValue(503, {}), null);
});
