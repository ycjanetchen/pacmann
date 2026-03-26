# PAC-MAN Game

A browser-playable Pac-Man game built with React and deployed to GitHub Pages.

**Live URL:** https://ycjanetchen.github.io/pacmann/

---

## Prompts Used (Claude Code Session)

The following prompts were sent to Claude Code to build and deploy this project:

> **Prompt 1:**
> `npx create-react-app pacman-game` / `cd pacman-game`
> *(Provided the full `pacman.jsx` source code to scaffold and fix)*
> "Made a jsx file from Claude chat

> **Prompt 2:**
> "Please build the React app and deploy it to GitHub Pages so it can be played at the URL"

---

## Development Process: React JSX → HTML on GitHub Pages

### Step 1 — Scaffold with Create React App

```bash
npx create-react-app pacman-game
cd pacman-game
```

`create-react-app` generates a project with:
- `src/` — React component source files (`.jsx` / `.js`)
- `public/index.html` — the HTML shell that React mounts into
- `package.json` — scripts and dependencies

The game logic lives entirely in `src/pacman.jsx` (a single React component), and `src/App.js` simply renders it:

```js
import PacManGame from './pacman';
function App() { return <PacManGame />; }
```

---

### Step 2 — How JSX Becomes HTML

React uses **JSX** — a syntax that looks like HTML but is actually JavaScript. For example:

```jsx
// JSX (source code)
function PacMan({ x, y }) {
  return <circle cx={x} cy={y} r={10} fill="#FFE000" />;
}
```

The build step compiles JSX → plain JavaScript using **Babel**, then **Webpack** bundles everything into a few static files:

```
build/
  index.html          ← the single HTML page (with <script> tags injected)
  static/
    js/main.[hash].js ← ALL your React components, compiled to vanilla JS
    css/main.[hash].css
```

The final `index.html` has no visible content — just an empty `<div id="root">`. When the browser loads `main.js`, React calls `ReactDOM.render()` which **inserts the game into the DOM at runtime**. This is called a **Single Page Application (SPA)**.

```html
<!-- build/index.html (simplified) -->
<body>
  <div id="root"></div>                         <!-- empty shell -->
  <script src="/pacmann/static/js/main.js"></script>  <!-- React fills it in -->
</body>
```

To run the build:

```bash
npm run build
```

---

### Step 3 — Configure for GitHub Pages

GitHub Pages serves files from a specific URL path (`/pacmann/`), so asset paths must include that prefix. This is set via the `homepage` field in `package.json`:

```json
{
  "homepage": "https://ycjanetchen.github.io/pacmann"
}
```

Create React App reads this and prefixes all asset URLs in the build output automatically:

```html
<!-- Without homepage -->
<script src="/static/js/main.js">

<!-- With homepage set to /pacmann -->
<script src="/pacmann/static/js/main.js">
```

---

### Step 4 — Automate Deployment with GitHub Actions

A workflow file at `.github/workflows/deploy.yml` runs on every push to `main` (or the feature branch). It:

1. Checks out the repo
2. Installs Node.js dependencies (`npm ci`)
3. Builds the React app (`npm run build`)
4. Pushes the `build/` folder to the `gh-pages` branch using `peaceiris/actions-gh-pages`

```yaml
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v4
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: pacman-game/build
```

The `gh-pages` branch ends up containing only the compiled static files — no React source, no `node_modules`. GitHub Pages serves this branch directly.

A `.nojekyll` file is automatically added to the `gh-pages` branch by the action. This tells GitHub **not** to run Jekyll (its default static-site processor), so `index.html` is served as-is rather than being processed as a Jekyll theme.

---

### Step 5 — Enable GitHub Pages in Repo Settings

1. Go to **Settings → Pages**
2. Set **Source** → *Deploy from a branch*
3. Set **Branch** → `gh-pages`, folder `/root`
4. Click **Save**

GitHub then runs its own `pages build and deployment` workflow to publish the files to the CDN.

---

### Full Flow Summary

```
src/pacman.jsx   (React + JSX)
      │
      │  npm run build  (Babel + Webpack)
      ▼
build/index.html + static/js/main.[hash].js
      │
      │  GitHub Actions → peaceiris/actions-gh-pages
      ▼
gh-pages branch  (static files only)
      │
      │  GitHub Pages CDN
      ▼
https://ycjanetchen.github.io/pacmann/
```

---

## Running Locally

```bash
cd pacman-game
npm install
npm start        # opens http://localhost:3000
```

## Game Controls

| Key | Action |
|-----|--------|
| ← → ↑ ↓ | Move Pac-Man |
| Enter | Start / restart game |

- Eat all yellow dots to win
- Pink power pellets turn ghosts blue — eat them for 200 points
- You have 3 lives

## Tech Stack

| Tool | Role |
|------|------|
| React 19 | UI framework / game rendering |
| SVG | Game board, Pac-Man, and ghost graphics |
| `useRef` | Mutable game state (avoids stale closures in the game loop) |
| `setInterval` | Game tick (180 ms) |
| Create React App | Build toolchain (Babel + Webpack) |
| GitHub Actions | CI/CD pipeline |
| GitHub Pages | Static file hosting |
