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

if (typeof module !== 'undefined' && module.exports) module.exports = getProjectStats;
