const assert = require('node:assert/strict');
const test = require('node:test');
const getProjectStats = require('../js/project-stats.js');
const projects = require('../projects.json');

test('counts each project once per group, including overlapping AR and VR tags', () => {
    assert.deepEqual(getProjectStats([
        { categories: ['category2', 'category3', 'category7', 'category7'] },
        { categories: ['category1'] },
        { categories: [] }
    ]), { total: 3, games: 1, xr: 1, webgl: 1 });
});

test('adding a project automatically updates its relevant counters', () => {
    const before = getProjectStats(projects);
    const after = getProjectStats([...projects, { categories: ['category1', 'category2', 'category7'] }]);
    for (const key of ['total', 'games', 'xr', 'webgl']) assert.equal(after[key], before[key] + 1);
});

test('empty data produces zero counts', () => {
    assert.deepEqual(getProjectStats([]), { total: 0, games: 0, xr: 0, webgl: 0 });
});

test('utility demos remain in the portfolio without inflating the game count', () => {
    const demos = projects.filter(project => ['Architecture showcase', 'YouTube API integration'].includes(project.title));
    assert.equal(demos.length, 2);
    assert.deepEqual(getProjectStats(demos), { total: 2, games: 0, xr: 0, webgl: 0 });
});

test('the native iPad planning application does not inflate WebGL counts', () => {
    const planar = projects.find(project => project.title === 'Heat Pump PlanAR — Fraunhofer ISE');
    assert.ok(planar);
    assert.deepEqual(getProjectStats([planar]), { total: 1, games: 0, xr: 1, webgl: 0 });
});
