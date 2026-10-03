const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ reduced = false, fine = true, project = false } = {}) {
    const handlers = {};
    const values = new Map();
    const classes = new Set();
    const card = {
        dataset: {},
        style: {
            setProperty: (key, value) => values.set(key, value),
            removeProperty: key => values.delete(key)
        },
        classList: { add: key => classes.add(key), remove: key => classes.delete(key) },
        addEventListener: (name, callback) => { handlers[name] = callback; },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 })
    };
    const motion = { matches: reduced, addEventListener: (name, callback) => { handlers.motionChange = callback; } };
    const context = {
        window: { matchMedia: query => query.includes('reduced-motion') ? motion : { matches: fine } },
        document: { querySelectorAll: selector => project ? (selector === '.single-special' ? [card] : []) : (selector.includes('.skill-topic') ? [card] : []) },
        WeakSet
    };
    vm.runInNewContext(fs.readFileSync(require.resolve('../js/skills.js'), 'utf8'), context);
    if (project) context.window.initProjectCardEffects();
    return { handlers, values, classes, motion, initProjectEffects: context.window.initProjectCardEffects };
}

test('skill panels tilt within 2.1 degrees and reset when the mouse leaves', () => {
    const { handlers, values, classes } = setup();
    assert.equal(typeof handlers.pointermove, 'function');
    handlers.pointermove({ pointerType: 'mouse', clientX: 400, clientY: 0 });
    assert.equal(values.get('--tilt-x'), '2.1deg');
    assert.equal(values.get('--tilt-y'), '2.1deg');
    assert.ok(classes.has('is-hovered'));
    handlers.pointerleave();
    assert.equal(values.size, 0);
    assert.equal(classes.size, 0);
});

test('rendered project cards use the same tilt strength, bind once, and reset on leave', () => {
    const { handlers, values, classes, initProjectEffects } = setup({ project: true });
    const firstHandler = handlers.pointermove;
    initProjectEffects();
    assert.equal(handlers.pointermove, firstHandler);
    handlers.pointermove({ pointerType: 'mouse', clientX: 400, clientY: 0 });
    assert.equal(values.get('--card-rotate-x'), '2.1deg');
    assert.equal(values.get('--card-rotate-y'), '2.1deg');
    assert.ok(classes.has('is-card-tilted'));
    handlers.pointerleave();
    assert.equal(values.size, 0);
    assert.equal(classes.size, 0);
});

test('touch input, coarse pointers, and reduced motion do not tilt project cards', () => {
    for (const options of [{}, { fine: false }, { reduced: true }]) {
        const { handlers, values } = setup({ ...options, project: true });
        handlers.pointermove({ pointerType: options.fine === false || options.reduced ? 'mouse' : 'touch', clientX: 400, clientY: 0 });
        assert.equal(values.size, 0);
    }
});

test('enabling reduced motion clears an existing project-card tilt', () => {
    const { handlers, values, motion } = setup({ project: true });
    handlers.pointermove({ pointerType: 'mouse', clientX: 400, clientY: 0 });
    assert.ok(values.size > 0);
    motion.matches = true;
    handlers.motionChange();
    assert.equal(values.size, 0);
});

test('touch input, coarse pointers, and reduced motion do not tilt skill panels', () => {
    for (const options of [{}, { fine: false }, { reduced: true }]) {
        const { handlers, values } = setup(options);
        assert.equal(typeof handlers.pointermove, 'function');
        handlers.pointermove({ pointerType: options.fine === false || options.reduced ? 'mouse' : 'touch', clientX: 400, clientY: 0 });
        assert.equal(values.size, 0);
    }
});

test('enabling reduced motion clears an existing skill-panel tilt', () => {
    const { handlers, values, motion } = setup();
    assert.equal(typeof handlers.pointermove, 'function');
    handlers.pointermove({ pointerType: 'mouse', clientX: 400, clientY: 0 });
    assert.ok(values.size > 0);
    motion.matches = true;
    handlers.motionChange();
    assert.equal(values.size, 0);
});
