(function () {
    'use strict';
    function safeUrl(value, kind) {
        if (typeof value !== 'string' || /[\s\\<>"'\x00-\x1f\x7f]/.test(value)) return null;
        if (kind === 'image') {
            return /^img\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpe?g|webp|svg)$/i.test(value) ? value : null;
        }
        if (/^briefs\/[a-z0-9-]+\.html$/.test(value)) return value;
        try {
            var url = new URL(value);
            return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
        } catch (_) { return null; }
    }
    function renderProject(project) {
        function element(tag, className, text) {
            var node = document.createElement(tag);
            node.className = className || '';
            if (text !== undefined) node.textContent = text;
            return node;
        }
        var column = element('div', 'col-lg-4 col-md-6 mb-4 archive-project');
        (project.categories || []).filter(function (category) { return /^category[1-9]$/.test(category); })
            .forEach(function (category) { column.classList.add(category); });
        var card = element('article', 'single-special text-center');
        card.dataset.projectId = window.portfolioAnalytics.projectKey(project);
        card.dataset.projectTitle = project.title;
        var header = element('div', 'project-header');
        header.style.setProperty('--thumbnail-fit', project.thumbnailFit === 'contain' ? 'contain' : 'cover');
        if (/^\d{1,3}% \d{1,3}%$/.test(project.thumbnailPosition || '')) {
            header.style.setProperty('--thumbnail-position', project.thumbnailPosition);
        }
        var imageUrl = safeUrl(project.imageUrl, 'image');
        if (imageUrl) {
            var image = element('img');
            image.src = imageUrl;
            image.alt = project.altText || '';
            image.loading = 'lazy';
            image.draggable = false;
            header.appendChild(image);
        }
        if (project.imageCredit) header.appendChild(element('span', 'project-image-credit', project.imageCredit));
        var body = element('div', 'project-body');
        body.appendChild(element('h3', '', project.title));
        body.appendChild(element('p', '', project.description || ''));
        var buttons = element('div', 'btn-group');
        (project.links || []).forEach(function (link) {
            var url = safeUrl(link.url, 'link');
            if (!url) return;
            var wrapper = element('div', 'app-download-btn');
            var anchor = element('a');
            anchor.href = url;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.dataset.projectButton = window.portfolioAnalytics.projectKey({title: link.text});
            anchor.setAttribute('aria-label', link.text + ' — ' + project.title);
            var label = element('p', 'mb-0');
            var icon = element('i', /^(?:fa[bsr]?|fa) fa-[a-z0-9-]+$/.test(link.icon || '') ? link.icon : '');
            icon.setAttribute('aria-hidden', 'true');
            if (link.text === 'View More') label.append(document.createTextNode(link.text + ' '), icon);
            else label.append(icon, document.createTextNode(' ' + link.text));
            anchor.appendChild(label);
            wrapper.appendChild(anchor);
            buttons.appendChild(wrapper);
        });
        body.appendChild(buttons);
        card.append(header, body);
        column.appendChild(card);
        return column;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {safeUrl: safeUrl, renderProject: renderProject};
        return;
    }
    window.portfolioProjects = {renderProject: renderProject};
    animateProjectStat(document.getElementById('total-project-count'), {target: 60, suffix: '+'});
    var status = document.getElementById('archive-status');
    fetch('projects.json', {credentials: 'omit', cache: 'no-cache'}).then(function (response) {
        if (!response.ok) throw new Error('Projects unavailable');
        return response.json();
    }).then(function (data) {
        if (!Array.isArray(data)) throw new Error('Invalid project list');
        var grid = document.getElementById('project-grid');
        var fragment = document.createDocumentFragment();
        data.forEach(function (project) { fragment.appendChild(renderProject(project)); });
        grid.replaceChildren(fragment);
        var stats = getProjectStats(data);
        document.querySelectorAll('[data-project-stat]').forEach(function (counter) {
            counter.removeAttribute('aria-label');
            animateProjectStat(counter, getProjectStatDisplay(stats[counter.dataset.projectStat]));
        });
        window.initProjectCardEffects();
        window.portfolioAnalytics.initProjects();
        var filters = document.querySelectorAll('#project-archive .category-button');
        function announce(count, category) {
            status.textContent = count + (count === 1 ? ' project' : ' projects') + (category ? ' in ' + category : ' in the archive');
        }
        announce(data.length);
        filters.forEach(function (filter) {
            filter.addEventListener('click', function () {
                filters.forEach(function (button) {
                    button.classList.toggle('current', button === filter);
                    button.setAttribute('aria-pressed', String(button === filter));
                });
                var count = 0;
                Array.from(grid.children).forEach(function (card) {
                    var visible = filter.dataset.filter === 'all' || card.classList.contains(filter.dataset.filter);
                    card.style.display = visible ? '' : 'none';
                    if (visible) count++;
                });
                announce(count, filter.dataset.filter === 'all' ? '' : filter.textContent.trim());
            });
        });
    }).catch(function () {
        document.getElementById('loading-projects')?.remove();
        document.querySelectorAll('[data-project-stat]').forEach(function (counter) {
            counter.textContent = '—';
            counter.setAttribute('aria-label', 'Count unavailable');
        });
        status.textContent = 'The project archive could not be loaded.';
    });
})();
