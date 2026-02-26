# Locus

A high-performance, WebGL2-based 2D point visualization library. **Locus** is designed as a drop-in, bug-free replacement for Carrot Search `dotAtlas`.

## 🚀 Key Features
- **Scalability:** Smoothly renders 1,000,000+ points at 60 FPS using instanced WebGL2.
- **Topography:** Advanced elevation shading with contour lines and hill-shading.
- **SDF Typography:** Crisp, anti-aliased labels that maintain clarity at any zoom level.
- **API Compatible:** Matches the `dotAtlas` API signature (`embed`, `set`, `on`, `resize`).

## 📦 Installation
If using as a module:
```javascript
import { DotAtlas } from './locus.esm.js';
```

## 🛠 Usage

The API is designed to be a 1:1 replacement. Simply swap your import and keep your existing configuration:

```javascript
const atlas = DotAtlas.embed({
  element: document.getElementById("atlas-container"),
  layers: [
    { type: "elevation", visible: true, colorBands: [...] },
    { type: "marker", visible: true, sizeMultiplier: 1.0 }
  ],
  points: [
    { x: 0.1, y: -0.2, color: "#ff0000", label: "Cluster A" },
    // ...
  ]
});

// Update data dynamically
atlas.set("points", newData);

// Handle interactions
atlas.on("click", (e) => {
  console.log("Clicked point:", e.point);
});
```

## 📋 Migration from dotAtlas

1.  **Change Import**: Update your `import` statement to point to `Locus`.
2.  **Remove Watermark Logic**: Lumenis is open-source/internal; no license keys or watermark-removal code is required.
3.  **WebGL2**: Ensure your target browsers support WebGL2 (standard in all modern browsers).

## 🏗 Build Instructions

To generate the minified production build:

1.  `npm install`
2.  `npx rollup -c`
