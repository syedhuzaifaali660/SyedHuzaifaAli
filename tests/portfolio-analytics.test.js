const test = require('node:test');
const assert = require('node:assert/strict');
let analytics = {};
try { analytics = require('../js/portfolio-analytics.js'); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
}

function harness(active = true) {
    const events = [];
    const pending = new Map();
    let id = 0;
    let now = 0;
    const tracker = analytics.createTracker({
        active,
        send: event => events.push(event),
        schedule: (callback, delay) => { pending.set(++id, {callback, at: now + delay}); return id; },
        cancel: timer => pending.delete(timer)
    });
    return { tracker, events, pending, advance(ms) {
        now += ms;
        for (const [timer, job] of [...pending]) {
            if (job.at <= now) { pending.delete(timer); job.callback(); }
        }
    }};
}

test('ordinary localhost and unrelated sites never send portfolio tracking', () => {
    assert.equal(typeof analytics.trackingMode, 'function');
    assert.equal(analytics.trackingMode(new URL('http://127.0.0.1:8000/?review=cards')), 'off');
    assert.equal(analytics.trackingMode(new URL('https://example.com/SyedHuzaifaAli/')), 'off');
    assert.equal(analytics.trackingMode(new URL('https://syedhuzaifaali660.github.io/another-site/')), 'off');
    assert.equal(analytics.trackingMode(new URL('https://syedhuzaifaali660.github.io/SyedHuzaifaAli/?review=cards#work')), 'production');
    assert.equal(analytics.trackingMode(new URL('http://127.0.0.1:8000/?analytics-test=1')), 'test');
});

test('hover must remain continuous for ten seconds and counts once', () => {
    const h = harness();
    h.tracker.hover('pokemon-generator', 'Pokémon generator', true);
    h.advance(9999);
    assert.equal(h.events.length, 0);
    h.tracker.hover('pokemon-generator', 'Pokémon generator', false);
    h.advance(1);
    assert.equal(h.events.length, 0);
    h.tracker.hover('pokemon-generator', 'Pokémon generator', true);
    h.advance(9999);
    assert.equal(h.events.length, 0);
    h.advance(1);
    h.tracker.hover('pokemon-generator', 'Pokémon generator', false);
    h.tracker.hover('pokemon-generator', 'Pokémon generator', true);
    h.advance(10000);
    assert.deepEqual(h.events, [{path:'card-view-pokemon-generator', title:'Card view: Pokémon generator', event:true}]);
});

test('hidden tabs restart the full ten-second hover requirement', () => {
    const h = harness();
    h.tracker.hover('a', 'Project A', true);
    h.advance(9000);
    h.tracker.pageVisible(false);
    h.advance(10000);
    assert.equal(h.events.length, 0);
    h.tracker.pageVisible(true);
    h.advance(9999);
    assert.equal(h.events.length, 0);
    h.advance(1);
    assert.equal(h.events[0].path, 'card-view-a');
});

test('a button counts as a view immediately without duplicate views after hover or repeated clicks', () => {
    const h = harness();
    h.tracker.hover('planar', 'Heat Pump PlanAR', true);
    h.advance(1000);
    h.tracker.click('planar', 'Heat Pump PlanAR', 'watch-demo');
    h.tracker.click('planar', 'Heat Pump PlanAR', 'watch-demo');
    h.advance(10000);
    assert.deepEqual(h.events.map(event=>event.path), ['card-view-planar','card-click-planar','button-click-planar-watch-demo','card-click-planar','button-click-planar-watch-demo']);
    assert.ok(h.events.slice(1).every(event=>event.event && event.no_session));
});

test('clicking the card body does not immediately count as a view and local previews send nothing', () => {
    const h = harness();
    h.tracker.click('planar', 'Heat Pump PlanAR', null);
    assert.deepEqual(h.events.map(event=>event.path), ['card-click-planar']);
    const local = harness(false);
    local.tracker.click('planar', 'Heat Pump PlanAR', 'watch-demo');
    local.tracker.hover('planar', 'Heat Pump PlanAR', true);
    local.advance(10000);
    assert.equal(local.events.length, 0);
});

test('a missing path is zero only when the service returns a valid zero count', () => {
    assert.equal(typeof analytics.counterValue, 'function');
    assert.equal(analytics.counterValue(404, {count:'0',count_unique:'0'}), '0');
    assert.equal(analytics.counterValue(200, {count:'1,234'}), '1,234');
    assert.equal(analytics.counterValue(503, {}), null);
    assert.equal(analytics.counterValue(403, {count:'0'}), null);
    assert.equal(analytics.counterValue(200, {count:'<script>'}), null);
});
