/* Shared GoatCounter counts. No credentials or dashboard access tokens belong here. */
(function () {
    'use strict';
    var site = 'https://syedhuzaifaali.goatcounter.com';

    function trackingMode(url) {
        if (url.protocol === 'https:' && url.hostname === 'syedhuzaifaali660.github.io' &&
            /^\/SyedHuzaifaAli(?:\/|$)/.test(url.pathname)) return 'production';
        if (['localhost', '127.0.0.1', '[::1]'].indexOf(url.hostname) !== -1 &&
            url.searchParams.get('analytics-test') === '1') return 'test';
        return 'off';
    }

    function projectKey(project) {
        return project.id || project.title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function counterValue(status, body) {
        if (status !== 200 && status !== 404) return null;
        var value = body && body.count;
        if (typeof value !== 'string' || !/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) return null;
        // GoatCounter returns 404 with a zero count for paths that have no visits yet.
        return status === 404 && value !== '0' ? null : value;
    }

    function createTracker(options) {
        var seen = new Set();
        var hovered = new Map();
        var timers = new Map();
        var pageIsVisible = true;
        var schedule = options.schedule || setTimeout;
        var cancel = options.cancel || clearTimeout;
        function stop(id) {
            if (timers.has(id)) cancel(timers.get(id));
            timers.delete(id);
        }
        function view(id, title) {
            if (!options.active || seen.has(id)) return;
            stop(id);
            seen.add(id);
            options.send({path: 'card-view-' + id, title: 'Card view: ' + title, event: true});
        }
        function start(id, title) {
            if (!options.active || !pageIsVisible || seen.has(id) || timers.has(id)) return;
            timers.set(id, schedule(function () {
                timers.delete(id);
                if (pageIsVisible && hovered.has(id)) view(id, title);
            }, 10000));
        }
        return {
            hover: function (id, title, isHovered) {
                if (isHovered) { hovered.set(id, title); start(id, title); }
                else { hovered.delete(id); stop(id); }
            },
            pageVisible: function (isVisible) {
                pageIsVisible = isVisible;
                if (!isVisible) { timers.forEach(cancel); timers.clear(); }
                else hovered.forEach(function (title, id) { start(id, title); });
            },
            click: function (id, title, button) {
                if (!options.active) return;
                if (button) view(id, title);
                options.send({path: 'card-click-' + id, title: 'Card clicks: ' + title, event: true, no_session: true});
                if (button) options.send({path: 'button-click-' + id + '-' + button,
                    title: 'Button: ' + title + ' / ' + button, event: true, no_session: true});
            }
        };
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {trackingMode: trackingMode, projectKey: projectKey,
            counterValue: counterValue, createTracker: createTracker};
        return;
    }

    var mode = trackingMode(new URL(window.location.href));
    var prefix = mode === 'test' ? 'test-' : '';
    var pendingEvents = [];
    var sdkReady = false;
    var sdkFailed = false;
    function send(event) {
        if (mode === 'off' || sdkFailed) return;
        var payload = Object.assign({}, event, {path: prefix + event.path});
        if (mode === 'test') payload.title = 'TEST / ' + payload.title;
        if (!sdkReady) { if (pendingEvents.length < 250) pendingEvents.push(payload); return; }
        if (!window.goatcounter.filter()) window.goatcounter.count(payload);
    }
    var tracker = createTracker({active: mode !== 'off', send: send});
    tracker.pageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', function () {
        tracker.pageVisible(document.visibilityState === 'visible');
    });

    // Counts are loaded only for the hero and cards that enter the viewport.
    var requests = new Map();
    var queue = [];
    var running = 0;
    function pump() {
        while (running < 4 && queue.length) {
            var task = queue.shift();
            running++;
            task().finally(function () { running--; pump(); });
        }
    }
    function getCount(path) {
        if (requests.has(path)) return requests.get(path);
        var promise = new Promise(function (resolve) {
            queue.push(function () {
                var controller = new AbortController();
                var timeout = setTimeout(function () { controller.abort(); }, 8000);
                return fetch(site + '/counter/' + encodeURIComponent(path) + '.json', {
                    credentials: 'omit', signal: controller.signal
                }).then(function (response) {
                    return response.json().then(function (body) { return counterValue(response.status, body); });
                }).catch(function () { return null; }).then(resolve).finally(function () { clearTimeout(timeout); });
            });
        });
        requests.set(path, promise);
        pump();
        return promise;
    }
    function loadCounters(element) {
        element.querySelectorAll('[data-counter-path]').forEach(function (counter) {
            if (counter.dataset.countRequested) return;
            counter.dataset.countRequested = 'true';
            getCount(counter.dataset.counterPath).then(function (count) {
                counter.textContent = count === null ? '—' : count;
                var badge = counter.closest('[data-count-label]');
                if (badge) {
                    badge.setAttribute('aria-label', badge.dataset.countLabel + ': ' + (count === null ? 'unavailable' : count));
                    if (count === null) badge.title = 'Count temporarily unavailable';
                }
            });
        });
    }
    function initProjects() {
        var cards = document.querySelectorAll('[data-project-id]');
        var observer = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var card = entry.target;
                if (entry.isIntersecting) loadCounters(card);
                if (!entry.isIntersecting) tracker.hover(card.dataset.projectId, card.dataset.projectTitle, false);
            });
        }, {threshold: 0}) : null;
        cards.forEach(function (card) {
            if (card.dataset.analyticsBound) return;
            card.dataset.analyticsBound = 'true';
            if (observer) observer.observe(card);
            else loadCounters(card);
            card.addEventListener('pointerenter', function (event) {
                if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    tracker.hover(card.dataset.projectId, card.dataset.projectTitle, true);
                }
            });
            function endHover() { tracker.hover(card.dataset.projectId, card.dataset.projectTitle, false); }
            card.addEventListener('pointerleave', endHover);
            card.addEventListener('pointercancel', endHover);
            card.addEventListener('click', function (event) {
                if (event.target.closest('.project-metrics')) return;
                var button = event.target.closest('a[data-project-button]');
                tracker.click(card.dataset.projectId, card.dataset.projectTitle,
                    button ? button.dataset.projectButton : null);
            });
            card.addEventListener('auxclick', function (event) {
                var button = event.target.closest('a[data-project-button]');
                if (event.button === 1 && button) tracker.click(card.dataset.projectId,
                    card.dataset.projectTitle, button.dataset.projectButton);
            });
        });
    }
    window.portfolioAnalytics = {projectKey: projectKey, initProjects: initProjects};

    function start() {
        var hero = document.querySelector('.portfolio-visits');
        if (hero) loadCounters(hero);
        initProjects();
        if (mode === 'off') return;
        window.goatcounter = {no_onload: true, no_events: true, allow_local: mode === 'test',
            endpoint: site + '/count', path: '/portfolio'};
        send({path: mode === 'test' ? 'portfolio' : '/portfolio', title: 'Syed Huzaifa Ali portfolio', event: mode === 'test'});
        var script = document.createElement('script');
        script.src = 'https://gc.zgo.at/count.js';
        script.async = true;
        script.setAttribute('data-goatcounter', site + '/count');
        script.addEventListener('load', function () {
            if (!window.goatcounter || typeof window.goatcounter.count !== 'function') {
                sdkFailed = true; pendingEvents.length = 0; return;
            }
            sdkReady = true;
            pendingEvents.splice(0).forEach(function (event) {
                if (!window.goatcounter.filter()) window.goatcounter.count(event);
            });
        });
        script.addEventListener('error', function () { sdkFailed = true; pendingEvents.length = 0; });
        document.head.appendChild(script);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
