# Thomas — Cybersecurity Portfolio

A responsive, framework-free cybersecurity portfolio for **Kaung Hein Set (Thomas)**. Built as a static site so it works on **GitHub Pages without npm, build tools, or paid hosting**.

## Live site

After publishing, add your URL here: `https://YOUR_GITHUB_USERNAME.github.io/`

## What's included

- `index.html` — main portfolio: About, 3D Lab experience, Projects, Skills, Certifications, Journey and Contact
- `projects/` — four detailed technical case-study pages
- `styles.css` — responsive base design, layout, and accessibility styles
- `neon.css` — cyan/violet/pink neon design, atmospheric lighting, terminal panels, and hover effects
- `depth3d.css` — CSS 3D floating security cube, holographic orbits, and four-layer scroll-controlled investigation model
- `script.js` — project filters, mobile menu, reveal effects, scroll progress, email copy, and motion toggle
- `neon.js` — switch between cyan and violet neon accents; decorative cursor spotlight (no tracking)
- `depth3d.js` — interactive hero parallax and scroll-driven 3D rotation, stage navigation, and artwork depth
- `assets/Kaung_Hein_Set_Thomas_Resume.pdf` — downloadable one-page ATS résumé
- `assets/favicon.svg` — website icon
- `assets/portfolio-preview.webp` — screenshot of the homepage

No tracking, frameworks, third-party JavaScript, back-end, or API keys are included. The floating 3D cube, depth layers and related UI are illustrative artwork, **not live data or fabricated security metrics**. The site runs offline after you unzip it (except external certificate links and mailto). The neon styling also works without online fonts or any remote assets.

## Preview locally

1. Unzip the download.
2. Double-click **`index.html`**. It will open in your browser.
3. Hover over the floating 3D security core (desktop) and scroll to **3D Lab** to rotate the investigation stack.
4. Use the four stage buttons to jump to Collect, Correlate, Detect, and Respond; explore case-study cards below.

You can also run `python -m http.server 8000` from the folder and browse to `http://localhost:8000`.

## Publish to GitHub Pages (free)

### Option 1 — Personal site URL (recommended)

1. Sign in to [GitHub](https://github.com/) and select **New repository**.
2. Set the repository name to **`YOUR_GITHUB_USERNAME.github.io`** (replace with your actual GitHub username).
3. Make the repository **Public**.
4. Upload **all files and folders inside this project folder** to the *root* of your new repository. `index.html` must be directly at the top level.
5. In the repository, open **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**. Select **main** and **/(root)**, then save.
7. After GitHub completes publication, visit `https://YOUR_GITHUB_USERNAME.github.io/`.

### Option 2 — Normal repository name

Make a repository like `cybersecurity-portfolio`, upload the same files, and enable **Settings → Pages → main / (root)**. Your address will look like `https://YOUR_GITHUB_USERNAME.github.io/cybersecurity-portfolio/`. Relative URLs in this site work with either approach.

## Important things to review before sending to recruiters

- **Credential visibility:** The six certificate cards link to the external credential URLs from your source résumé. Open each in an incognito/private browser window and verify recruiters can access it. In particular, confirm Google Drive sharing permissions.
- **Your contact information:** The email shown is `k.set@wlv.ac.uk`. Update it across `index.html` and the résumé if necessary.
- **Your actual evidence:** The illustrations are conceptual, **not screenshots of monitoring results**. Add sanitized evidence/screenshots to your project pages when ready. Do not publish passwords, secrets, live malware, private user information, or sensitive logs.
- **GitHub / LinkedIn:** Personal profile URLs were not supplied, so **no fake social-profile links were added**. Add them to the contact section after you decide what links to use.
- **eJPT:** Correctly marked as **exam preparation in progress**, not an earned certificate.
- **SOC Home Lab:** Identified as ongoing; planned scenarios are clearly separated from completed testing.

## Editing content

Open the `.html` files with VS Code or another text editor. The main text and credential links are written in plain HTML so you don't need to learn a framework just to update a project.

The enhanced neon palette is defined at the top of `neon.css`. Change `--neon`, `--secondary`, or `--pink` to customize it. The **CYAN MODE** button on the 3D hero switches to the alternate violet theme, and the selection is saved locally in your browser.

**Adjust 3D effects:** Edit `depth3d.css` for the cube faces, holographic rings, and scroll scene; edit `depth3d.js` for rotation speed and stage transitions. The design uses native CSS 3D transforms and a lightweight scroll handler — no WebGL library, CDN, or dependencies to install.

## Accessibility and design

Includes keyboard navigation, responsive layouts, high-contrast text, semantic content, a skip link, accessible palette controls, and a pause-motion toggle. Honors the operating system’s **reduced-motion** preference with a static 3D arrangement while keeping all content and stage buttons usable. Uses local/system fonts so no font download is required.

---

Portfolio content adapted from the user's original PDF résumé and documented cybersecurity lab work. Project art is illustrative only.

## Interactive 360 degree security core

The core in the home-page hero is now a real six-face CSS 3D object surrounded by floating neon orbital elements. Drag with your mouse, swipe on mobile, or focus the graphic and use the arrow keys to rotate fully around either axis. Use **RESET** (or Home) to restore the angle and **AUTO: ON/OFF** (or Space) to toggle gentle automatic rotation. An idle orbit and floating motion enhance the look; reduced-motion preferences and the site's global Pause Motion button disable automatic movement.

This runs in any modern browser without WebGL, external assets, dependencies, or a build step. The model is decorative and does not claim to show live security telemetry.


### Full orbital-core WebGL upgrade

The hero now contains a **single physically three-dimensional emblem**: an extruded shield, beveled glowing outline and checkmark, glass mounting plate, three toroidal neon orbits, orbit satellites, dotted halo, and textured 3D title. Everything is part of the same draggable object, and rotates together through unrestricted 360-degree yaw **and** pitch. Slow floating and optional auto-rotation are built in.

This uses local `core3d.js` / `core3d.css` and browser WebGL without a CDN or package installation. Mouse/touch drag, keyboard arrow keys, Home reset, Space auto on/off, and global pause motion are supported. If WebGL is unavailable, an interactive software 3D renderer takes over automatically, so the **whole emblem still floats and rotates 360 degrees** (a simple CSS-only fallback is reserved for browsers without either canvas mode). The four project case-study pages, certifications, and résumé were not changed.
