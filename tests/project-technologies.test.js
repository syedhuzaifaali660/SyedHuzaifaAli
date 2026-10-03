const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');

test('the confirmed stacks remain specific to their projects', () => {
    const projects = JSON.parse(fs.readFileSync(require.resolve('../projects.json'), 'utf8'));
    const find = title => projects.find(p => p.title === title).details;
    assert.ok(find('Acromania multiplayer game')?.technologies.includes('PHP'));
    assert.ok(find('Acromania multiplayer game')?.technologies.includes('SQL'));
    assert.ok(!find('Acromania multiplayer game')?.technologies.includes('MySQL'));
    for (const tech of ['Firebase', 'Agora', 'JavaScript', 'HTML', 'Custom APIs']) {
        assert.ok(find('Portfolio explorer')?.technologies.includes(tech), tech);
    }
    for (const tech of ['PHP', 'MySQL', 'Firebase', 'Custom APIs']) {
        assert.ok(find('Real Deal: Thrift Hunter')?.technologies.includes(tech), tech);
    }
    for (const title of ['Astro Adventures', 'VR cricket gamification', 'Kinect bubble game', 'Car racing gamification', 'Max League', 'Zinc Club']) {
        assert.ok(find(title)?.technologies.includes('Firebase Analytics'), title);
    }
    // Utility demos are not game telemetry claims.
    for (const title of ['Architecture showcase', 'YouTube API integration']) {
        assert.ok(!find(title)?.technologies.includes('Firebase Analytics'), title);
    }
});
