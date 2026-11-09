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
        'Simulation · XR & Spatial Computing · AI Applications · Product Development');
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
