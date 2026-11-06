(function () {
    'use strict';
    var menu = document.getElementById('ca-navbar');
    var toggle = document.querySelector('.navbar-toggler');
    var links = document.querySelectorAll('#nav a[href^="#"]');
    function closeMenu() {
        menu.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', String(menu.classList.toggle('show')));
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && menu.classList.contains('show')) {
            closeMenu();
            toggle.focus();
        }
    });
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            var target = document.getElementById(link.getAttribute('href').slice(1));
            if (!target) return;
            event.preventDefault();
            closeMenu();
            target.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
            history.replaceState(null, '', link.getAttribute('href'));
            updateNavigation();
        });
    });
    function updateNavigation() {
        document.querySelector('.header_area').classList.toggle('sticky', window.scrollY > 48);
        var activeId = 'home';
        links.forEach(function (link) {
            var section = document.getElementById(link.hash.slice(1));
            if (section && section.getBoundingClientRect().top <= 100) activeId = section.id;
        });
        links.forEach(function (link) {
            var active = link.hash === '#' + activeId;
            link.parentElement.classList.toggle('active', active);
            if (active) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
        });
    }
    ['scroll', 'load', 'resize'].forEach(function (event) { window.addEventListener(event, updateNavigation); });
    updateNavigation();
    // Preserve the old scroll-up control without loading its plugin bundle.
    var top = document.createElement('a');
    top.id = 'scrollUp';
    top.href = '#home';
    top.textContent = '↑';
    top.setAttribute('aria-label', 'Back to top');
    top.style.position = 'fixed';
    top.style.zIndex = '1000';
    top.hidden = true;
    top.addEventListener('click', function (event) {
        event.preventDefault();
        document.getElementById('home').scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
    document.body.appendChild(top);
    window.addEventListener('scroll', function () { top.hidden = window.scrollY < 300; });
})();
