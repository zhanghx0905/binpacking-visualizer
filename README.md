# Binpacking Visualizer

This application is based on https://github.com/SebLeich/storage-manager-2.0 and rebuilt with TypeScript, Next.js, React, and three.js.

It is used to visualize the results of bin packing algorithms. The app loads a solution JSON file, renders the packed container in 3D, and shows container usage, positioned goods, selected/hovered item details, and validation errors.

The previous Angular implementation is kept in the `angular-v0.1` branch.

## Features

- 3D bin packing result visualization with three.js
- Orbit controls for rotating and zooming the scene
- Hover and click selection for goods
- Container summary and volume usage
- Positioned goods table
- Solution validation for out-of-container and overlapping goods
- Upload another solution JSON
- Download the current solution JSON
- Generate a deterministic random example
- Repack the current solution with the built-in 3D shelf optimizer

## Packing Optimizer

The optimizer is inspired by Google OR-Tools' bin packing formulation:

https://developers.google.com/optimization/pack/bin_packing

The OR-Tools example models bin packing as an optimization problem that minimizes the number of bins used. This application runs fully in the browser, while the official OR-Tools package targets Python, C++, Java, and C#. For that reason, the app uses a lightweight TypeScript 3D shelf-packing heuristic instead of bundling OR-Tools directly.

The built-in optimizer:

- sorts generated or uploaded goods by volume
- allows width/length rotation
- packs goods row by row and layer by layer into one container
- produces the same solution JSON shape used by the visualizer
- reports unpacked goods in the generated solution description

Use `random example` to generate and pack a seeded set of goods. Use `optimize current` to repack the currently selected solution's goods into the same container.

## Development Server

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

To use another port:

```bash
npm run dev -- -p 3001
```

## Build

Run the production build:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Node.js Version

This project targets Node.js 24:

```json
"engines": {
  "node": "24.x"
}
```

For local development with `nvm`, run:

```bash
nvm use
```

## Vercel Deployment

Vercel should use Node.js 24.x from `package.json`. If a deployment still reports an invalid or discontinued Node.js version such as `18.x`, update the Vercel project setting:

```txt
Project Settings -> Build and Deployment -> Node.js Version -> 24.x
```

Then redeploy the latest commit.

## Solution Data

The example solution is served from:

```txt
public/data/exemplary-solution.json
```

Uploaded files should use the same shape:

```json
{
  "solution": {
    "id": "solution-id",
    "description": "Super-Flo",
    "container": {
      "id": "container-id",
      "xCoord": 0,
      "yCoord": 0,
      "zCoord": 0,
      "height": 1700,
      "width": 2100,
      "length": 3500,
      "unit": "mm",
      "goods": []
    }
  }
}
```
