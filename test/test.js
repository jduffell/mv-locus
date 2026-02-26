document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('atlas-container');
    if (!container) {
        console.error('Container element not found');
        return;
    }

    console.log('Initializing Locus...');
    const atlas = new Locus({
        container,
        layers: [
            { type: 'elevation', color: [0.2, 0.5, 1.0, 0.6] },
            { type: 'markers' },
            { type: 'labels' }
        ]
    });

    // Generate some random data for the smoke test
    const points = [];
    const numPoints = 1000;
    console.log(`Generating ${numPoints} points...`);
    for (let i = 0; i < numPoints; i++) {
        points.push({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            id: i,
            label: `Point ${i}`,
            color: i % 2 === 0 ? '#ff5500' : '#00aaff',
            size: 5 + Math.random() * 15
        });
    }

    atlas.setData(points);
    atlas.render();
    console.log('Locus smoke test initialized.');
});