(function () {
    'use strict';

    var cards = document.querySelectorAll('.skill-card');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    function reset(card) {
        card.style.removeProperty('--tilt-x');
        card.style.removeProperty('--tilt-y');
        card.style.removeProperty('--shine-x');
        card.style.removeProperty('--shine-y');
        card.classList.remove('is-hovered');
    }

    cards.forEach(function (card) {
        card.addEventListener('pointermove', function (event) {
            if (reducedMotion.matches || !finePointer.matches) return;
            var bounds = card.getBoundingClientRect();
            var x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
            var y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
            card.style.setProperty('--shine-x', (x * 100) + '%');
            card.style.setProperty('--shine-y', (y * 100) + '%');
            card.style.setProperty('--tilt-x', ((0.5 - y) * 4) + 'deg');
            card.style.setProperty('--tilt-y', ((x - 0.5) * 4) + 'deg');
            card.classList.add('is-hovered');
        });
        card.addEventListener('pointerleave', function () { reset(card); });
        card.addEventListener('pointercancel', function () { reset(card); });
    });

    var projectCards = new WeakSet();

    function resetProjectCard(card) {
        card.style.removeProperty('--card-rotate-x');
        card.style.removeProperty('--card-rotate-y');
        card.classList.remove('is-card-tilted');
    }

    function initProjectCardEffects() {
        document.querySelectorAll('.single-special').forEach(function (card) {
            if (projectCards.has(card) || card.dataset.cardTiltBound === 'true') return;
            projectCards.add(card);
            card.dataset.cardTiltBound = 'true';

            card.addEventListener('pointermove', function (event) {
                if (reducedMotion.matches || !finePointer.matches) return;
                var bounds = card.getBoundingClientRect();
                var x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
                var y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
                card.style.setProperty('--card-rotate-x', ((0.5 - y) * 3) + 'deg');
                card.style.setProperty('--card-rotate-y', ((x - 0.5) * 3) + 'deg');
                card.classList.add('is-card-tilted');
            });
            card.addEventListener('pointerleave', function () { resetProjectCard(card); });
            card.addEventListener('pointercancel', function () { resetProjectCard(card); });
        });
    }

    // Project cards are rendered from projects.json after this script loads.
    window.initProjectCardEffects = initProjectCardEffects;

    // The sweep is decorative; content is visible before and without this script.
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                if (!reducedMotion.matches) entry.target.classList.add('is-in-view');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15 });
        cards.forEach(function (card) { observer.observe(card); });
    }

    reducedMotion.addEventListener('change', function () {
        cards.forEach(function (card) { reset(card); });
        document.querySelectorAll('.single-special').forEach(function (card) { resetProjectCard(card); });
    });
})();
