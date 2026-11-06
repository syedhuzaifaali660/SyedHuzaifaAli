/* Category IDs match the project filters and projects.json. */
function getProjectStats(projects) {
    return projects.reduce(function (stats, project) {
        var categories = project.categories || [];
        stats.total += 1;
        if (categories.indexOf('category1') !== -1) stats.games += 1;
        if (categories.indexOf('category2') !== -1 || categories.indexOf('category3') !== -1) stats.xr += 1;
        if (categories.indexOf('category7') !== -1) stats.webgl += 1;
        return stats;
    }, { total: 0, games: 0, xr: 0, webgl: 0 });
}

function getProjectStatDisplay(count) {
    // The portfolio displays seven projects as 10+.
    var target = count === 7 ? 10 : Math.round(count / 5) * 5;
    return { target: target, suffix: count === target ? '' : '+' };
}

function animateProjectStat(element, display) {
    function showFinalValue() {
        element.textContent = display.target;
        if (display.suffix) {
            var suffix = document.createElement('span');
            suffix.className = 'project-stat-suffix';
            suffix.textContent = display.suffix;
            element.appendChild(suffix);
        }
    }
    showFinalValue();
    if (!('IntersectionObserver' in window)) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var replayTimer;
    var frame;
    function play() {
        if (document.hidden || reducedMotion.matches) return;
        element.textContent = '0';
        var start = performance.now();
        function update(now) {
            var progress = Math.min((now - start) / 900, 1);
            if (progress === 1 || reducedMotion.matches) {
                showFinalValue();
                return;
            }
            element.textContent = Math.floor(display.target * progress);
            frame = requestAnimationFrame(update);
        }
        frame = requestAnimationFrame(update);
    }

    var observer = new IntersectionObserver(function (entries) {
        clearInterval(replayTimer);
        if (entries[entries.length - 1].isIntersecting) {
            replayTimer = setInterval(play, 10000);
        } else {
            cancelAnimationFrame(frame);
            showFinalValue();
        }
    });
    observer.observe(element);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = getProjectStats;
    module.exports.getProjectStatDisplay = getProjectStatDisplay;
}
