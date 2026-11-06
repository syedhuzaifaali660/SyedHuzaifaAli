'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { safeUrl } = require('../js/projects.js');

// Only these pages and their local dependencies are eligible for deployment.
const pages = ['index.html', 'briefs/heat-pump-planar.html',
    'briefs/spirometry-golf-dolphin.html', 'briefs/pokemon-synthetic-detector.html'];
const scripts = ['js/active.js', 'js/project-stats.js', 'js/portfolio-analytics.js', 'js/skills.js', 'js/projects.js'];
const fields = ['id', 'title', 'description', 'categories', 'imageUrl', 'altText', 'imageCredit',
    'thumbnailFit', 'thumbnailPosition', 'links'];

function buildSite(root, output) {
    // Never merge into a previous deployment: removed files must disappear.
    if (fs.readdirSync(output).length) throw new Error('Output directory must be empty');
    const copied = new Set();
    function copy(relative) {
        if (copied.has(relative)) return;
        if (path.isAbsolute(relative) || relative.split('/').some(part => part === '..' || part.startsWith('.'))) {
            throw new Error('Unsafe asset path: ' + relative);
        }
        const source = path.join(root, relative);
        if (!fs.realpathSync(source).startsWith(fs.realpathSync(root) + path.sep)) throw new Error('Asset escapes source directory');
        const target = path.join(output, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
        copied.add(relative);
        if (!/\.(html|css)$/.test(relative)) return;
        const content = fs.readFileSync(source, 'utf8');
        const references = relative.endsWith('.html')
            ? [...content.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(match => match[1])
            : [...content.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(match => match[1]);
        for (const reference of references) {
            if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) continue;
            const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(relative), reference.split(/[?#]/)[0]));
            const allowed = pages.includes(dependency) || scripts.includes(dependency) ||
                dependency === 'syed-huzaifa-ali-resume.pdf' || dependency === 'briefs/case-study.css' ||
                /^(?:css\/[^/]+\.css|style\.css|fonts\/[^/]+\.(?:woff2?|ttf|eot|svg|otf)|img\/(?:[\w-]+\/)*[\w.-]+\.(?:png|jpe?g|webp|svg|mp4))$/i.test(dependency);
            if (!allowed) throw new Error('Unapproved public dependency: ' + dependency);
            copy(dependency);
        }
    }
    pages.forEach(copy);
    scripts.forEach(copy);
    copy('img/skills/LICENSE-devicon.txt');
    const projects = JSON.parse(fs.readFileSync(path.join(root, 'projects.json'), 'utf8'));
    const publicProjects = projects.map(project => {
        if (!safeUrl(project.imageUrl, 'image')) throw new Error('Invalid project image');
        copy(project.imageUrl);
        for (const link of project.links || []) {
            if (!safeUrl(link.url, 'link')) throw new Error('Invalid project link');
            if (link.url.startsWith('briefs/') && !pages.includes(link.url)) throw new Error('Unapproved case study');
        }
        return Object.fromEntries(fields.filter(field => field in project).map(field => [field, project[field]]));
    });
    fs.writeFileSync(path.join(output, 'projects.json'), JSON.stringify(publicProjects, null, 2) + '\n');
    fs.writeFileSync(path.join(output, '.nojekyll'), '');
    return copied.size + 2;
}
if (require.main === module) {
    const root = path.resolve(__dirname, '..');
    const output = path.join(root, 'dist');
    fs.rmSync(output, {recursive: true, force: true});
    fs.mkdirSync(output);
    console.log('Built ' + buildSite(root, output) + ' public files in dist/');
}
module.exports = {buildSite};
