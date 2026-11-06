/* GoatCounter visit and click analytics. No credentials or dashboard access tokens belong here. */
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
        if (status === 404 && value !== '0') return null;
        return (1000 + Number(value.replace(/,/g, ''))).toLocaleString('en-US');
    }

    function createTracker(options) {
        return {
            click: function (id, title, button) {
                if (!options.active) return;
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

    function loadVisitCount() {
        var counter = document.getElementById('portfolio-visit-count');
        if (!counter) return;
        var controller = new AbortController();
        var timeout = setTimeout(function () { controller.abort(); }, 8000);
        fetch(site + '/counter/' + encodeURIComponent('/portfolio') + '.json', {
            credentials: 'omit', signal: controller.signal
        }).then(function (response) {
            return response.json().then(function (body) { return counterValue(response.status, body); });
        }).catch(function () { return null; }).then(function (count) {
            if (count !== null) counter.textContent = count;
            else counter.parentElement.title = 'Historical baseline. Tracked visits are temporarily unavailable.';
        }).finally(function () { clearTimeout(timeout); });
    }

    function initProjects() {
        var cards = document.querySelectorAll('[data-project-id]');
        cards.forEach(function (card) {
            if (card.dataset.analyticsBound) return;
            card.dataset.analyticsBound = 'true';
            card.addEventListener('click', function (event) {
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
        loadVisitCount();
        initProjects();
        if (mode === 'off') return;
        window.goatcounter = {no_onload: true, no_events: true, allow_local: mode === 'test',
            endpoint: site + '/count', path: '/portfolio'};
        send({path: mode === 'test' ? 'portfolio' : '/portfolio', title: 'Syed Huzaifa Ali portfolio', event: mode === 'test'});
        var script = document.createElement('script');
        script.src = 'https://gc.zgo.at/count.js';
        // Fail closed if the SDK changes; review and refresh this hash deliberately.
        script.integrity = 'sha384-2UjvVpptg4JlEVgJI2PdscrjOjPcil/4F1ZvIMJ81CShQnEDSlPI+l4PfogvTLYi';
        script.crossOrigin = 'anonymous';
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
