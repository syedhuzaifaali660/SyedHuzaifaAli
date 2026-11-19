const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
const decode = text => text.replace(/&amp;/g, '&');
const expected = [
    ['Spatial Computing & XR',
        'AR / VR / MR|Medical Simulation|AR Foundation|ARKit / ARCore|OpenXR / Meta XR|LiDAR|Digital Twins|Spatial Mapping|GLB / BIM Workflows'],
    ['AI, Computer Vision & Automation',
        'Python|NLP|OpenCV|Synthetic Data Generation|Domain Randomization|PyTorch / YOLO|Core ML|LangChain / Gemini API|Workflow Automation'],
    ['Architecture & Engineering',
        'Unity / C#|OOP / SOLID|Modular Architecture|REST APIs|PHP / MySQL|Unity Editor Tools|Performance Optimization|Automated Testing|CI/CD'],
    ['Technical Leadership & Product Management',
        'Team Leadership|Developer Mentoring|Cross-functional Collaboration|Requirements Gathering|Roadmap Planning|Feature Prioritization|Client Communication|Feedback-Driven Improvements|SaaS Pricing & Packaging'],
    ['Multiplayer & Real-Time',
        'Photon PUN 2|Agora|Normcore Realtime|Ready Player Me|VRM / UniVRM|Matchmaking|Voice Chat|Session Recovery|Network Pose Streaming'],
    ['Platforms & Monetization',
        'iOS / Android|PC / WebGL|Meta Quest|In-App Purchases|Ads Integration|Firebase Analytics|Cloud Integration|TestFlight / App Store Connect']
];

test('homepage hero preserves the name and uses the requested role and focus', () => {
    assert.match(html, /<h1[^>]*>Syed Huzaifa Ali<\/h1>/);
    const roles = html.match(/<span class="hero-roles">(.*?)<\/span>\s*<span class="hero-specialty">/s)[1];
    assert.equal(roles.replace(/<[^>]+>/g, '').trim(), 'Senior Software Engineer | Technical Lead');
    assert.equal(decode(html.match(/<span class="hero-specialty">(.*?)<\/span>/)[1]),
        'I build real-time simulations, XR applications, and AI tools. My work spans software architecture, backend development, and DevOps.');
});

test('hero keeps the keyboard video and usable links without a playback button', () => {
    const hero = html.match(/<section class="wellcome_area[^>]*>(.*?)<\/section>/s)[1];
    const video = hero.match(/<video([^>]*)>(.*?)<\/video>/s);
    assert.ok(video, 'keyboard video remains in the hero');
    assert.doesNotMatch(video[1], /\bautoplay\b/);
    for (const attribute of ['muted', 'loop', 'playsinline']) assert.match(video[1], new RegExp('\\b' + attribute + '\\b'));
    assert.match(video[2], /<source src="img\/video\/geek.mp4" type="video\/mp4">/);
    assert.doesNotMatch(hero, /hero-motion-toggle|<button\b/);
    assert.match(hero, /<a class="contact-link" href="#work">View selected work<\/a>/);
    assert.match(hero, /<a class="contact-link hero-resume" href="syed-huzaifa-ali-resume.pdf" download>Download resume<\/a>/);
});

test('one intact historical visit counter appears in the footer rather than the hero', () => {
    const hero = html.match(/<section class="wellcome_area[^>]*>(.*?)<\/section>/s)[1];
    const footer = html.match(/<footer[^>]*>(.*?)<\/footer>/s)[1];
    assert.equal((html.match(/id="portfolio-visit-count"/g) || []).length, 1);
    assert.doesNotMatch(hero, /portfolio-visits/);
    assert.match(footer, /class="portfolio-visits" title="Includes 1,000 visits from before tracking\. Repeat visits within a session are deduplicated; counts update periodically\."/);
    assert.match(footer, /<i class="fas fa-eye" aria-hidden="true"><\/i>\s*<span id="portfolio-visit-count">1,000<\/span><span>portfolio visits<\/span>/);
    assert.ok(footer.indexOf('footer-social-icon') < footer.indexOf('portfolio-visits'));
    assert.ok(footer.indexOf('portfolio-visits') < footer.indexOf('copyright-text'));
});

test('six semantic skills cards contain the complete unique tags in reading order', () => {
    const cards = [...html.matchAll(/<section class="skill-topic" aria-labelledby="([^"]+)">(.*?)<\/section>/gs)];
    assert.equal(cards.length, 6);
    assert.equal(new Set(cards.map(card => card[1])).size, 6);
    cards.forEach((card, index) => {
        const heading = card[2].match(/<h3 id="([^"]+)">(.*?)<\/h3>/s);
        assert.equal(heading[1], card[1]);
        assert.equal(decode(heading[2]), expected[index][0]);
        const tags = [...card[2].matchAll(/<li>(.*?)<\/li>/gs)].map(match => decode(match[1]));
        assert.deepEqual(tags, expected[index][1].split('|'), expected[index][0]);
        assert.equal(new Set(tags).size, tags.length, expected[index][0]);
    });

});

test('About me contains exactly the three supplied paragraphs', () => {
    const about = html.match(/<section class="profile-about"[^>]*>(.*?)<\/section>/s)[1];
    assert.match(about, /<h2 id="about-heading">About me<\/h2>/);
    assert.deepEqual([...about.matchAll(/<p>(.*?)<\/p>/gs)].map(match => decode(match[1])), [
        'I’m a software engineer and technical lead with eight years of experience building real-time simulations, XR applications, and interactive products across mobile, web, and immersive platforms. My core work combines Unity and C# development with software architecture, performance optimization, and reliable delivery.',
        'At Fraunhofer ISE, I developed Heat Pump PlanAR, an iPad AR application for planning heat-pump installations using ARKit, LiDAR-aware workflows, and persistent spatial mapping. My current work focuses on backend development and DevOps. Previously, I led a 10-person multidisciplinary team delivering enterprise simulation programs for GSK, Abbott, and Roche.',
        'Alongside this work, I build AI projects spanning synthetic data generation, object detection, and LLM-powered automation. My product experience includes gathering requirements, contributing to roadmaps and feature priorities, incorporating client feedback, and defining pricing and usage tiers for an independent WebAR SaaS product.'
    ]);
});

test('capability descriptions lead six native default-closed skill disclosures', () => {
    const descriptions = [
        'Spatial mapping, AR/VR applications, and medical simulation.',
        'Synthetic data, object detection, and workflow automation.',
        'Unity/C# architecture, performance optimization, and delivery tooling.',
        'Team leadership, requirements, roadmaps, and feature prioritization.',
        'Multiplayer sessions, voice chat, and real-time avatar interactions.',
        'Mobile, WebGL, and XR platforms, with purchases, ads, and cloud integration.'
    ];
    const cards = [...html.matchAll(/<section class="skill-topic" aria-labelledby="([^"]+)">(.*?)<\/section>/gs)];
    assert.equal(cards.length, 6);
    cards.forEach((card, index) => {
        assert.equal(card[2].match(/<p class="skill-description">(.*?)<\/p>/)?.[1], descriptions[index]);
        const details = card[2].match(/<details class="skill-details"([^>]*)>(.*?)<\/details>/s);
        assert.ok(details, 'native details for ' + card[1]);
        assert.doesNotMatch(details[1], /\bopen\b/);
        assert.match(details[2], /^\s*<summary>View skills<\/summary>/);
        assert.match(details[2], /<ul class="skill-names">/);
        assert.ok(card[2].indexOf('skill-description') < card[2].indexOf('<details'));
    });
});

test('tools reference panel preserves all 31 tools in four ordered groups', () => {
    assert.match(html, /<p class="technology-subtitle">Core engines, languages, cloud infrastructure, and delivery workflows<\/p>/);
    const expectedGroups = [
        ['Engine, Languages & Frameworks', ['Unity 3D', 'C#', 'Swift', 'Python', 'JavaScript', 'PHP', 'HTML', 'CSS', 'LINQ', 'ARKit', 'OpenCV', 'PyTorch / YOLO']],
        ['Cloud, Backend & APIs', ['AWS', 'Firebase', 'REST APIs', 'MySQL', 'JSON', 'XML']],
        ['DevOps & Automation', ['Git', 'GitHub Actions', 'Docker', 'Jenkins', 'CI/CD']],
        ['Platforms, Stores & Workflow', ['iOS', 'Android', 'WebGL', 'App Store Connect', 'Google Play', 'Jira', 'Trello', 'Photoshop']]
    ];
    const groups = [...html.matchAll(/<section class="technology-group" aria-labelledby="([^"]+)">(.*?)<\/section>/gs)];
    assert.equal(groups.length, 4);
    groups.forEach((group, index) => {
        assert.equal(group[1], 'technology-group-' + (index + 1));
        const heading = group[2].match(/<h4 id="([^"]+)">(.*?)<\/h4>/);
        assert.equal(heading[1], group[1]);
        assert.equal(decode(heading[2]), expectedGroups[index][0]);
        assert.deepEqual([...group[2].matchAll(/<span>(.*?)<\/span>/g)].map(item => decode(item[1])), expectedGroups[index][1]);
    });
    assert.equal(groups.reduce((total, group) => total + (group[2].match(/<li>/g) || []).length, 0), 31);
});
