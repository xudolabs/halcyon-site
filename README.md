# Halcyon — series website

A static site for the Halcyon trilogy (Trigger, Cascade, Respite): a 3D book shelf, a band per book, and an in-browser reader that paginates the opening of Trigger into real page spreads, with shareable links to each page (`#read-trigger-12`).

No build step and no framework, just HTML, CSS and JavaScript. It runs on GitHub Pages for free.

```
index.html              page layout
css/site.css            all styling
js/content.js           ← EDIT ME: blurbs, statuses, bio, Tally links, cover paths
js/app.js               shelf, book sections, reader, routing
excerpts/trigger.js     reader text (generated, see below)
assets/covers/          drop real cover art here
tools/build_excerpt.py  manuscript → excerpt converter
CNAME.example           rename to CNAME once you own a domain
```

## 1. Publish on GitHub Pages (free)

1. Create a new **public** repo on GitHub, e.g. `halcyon-site`.
2. Upload these files (drag them into "Add file → Upload files", or `git push`).
3. In the repo, open **Settings → Pages**, then set Source to **Deploy from a branch**, Branch `main`, folder `/ (root)`, and click Save.
4. After a minute the site is live at `https://<your-username>.github.io/halcyon-site/`.

## 2. Use your own domain

Buy the domain at any registrar (Cloudflare Registrar, Porkbun and Namecheap all work). Then:

**At the registrar's DNS settings**

| Type  | Name | Value                     |
|-------|------|---------------------------|
| A     | @    | 185.199.108.153           |
| A     | @    | 185.199.109.153           |
| A     | @    | 185.199.110.153           |
| A     | @    | 185.199.111.153           |
| CNAME | www  | `<your-username>.github.io` |

**In the repo**

1. Rename `CNAME.example` to `CNAME` and put your domain inside it, e.g. `www.halcyontrilogy.com`.
2. In **Settings → Pages → Custom domain**, enter the same domain and Save.
3. Once the DNS check passes (minutes to a few hours), tick **Enforce HTTPS**. The certificate is free.

## 3. Edit the content

Everything a writer would change is in `js/content.js`: the hook line, blurbs, status, word counts, author bio, and the Tally links for the ARC form (`arcUrl`) and updates (`newsletterUrl`). The current blurbs and bio are sample copy, so rewrite them in your own voice.

**Covers:** until you add art, the site draws gold-on-black covers in CSS. To use your real Trigger cover, save it as `assets/covers/trigger.jpg` (about 1600×2400) and set `cover: "assets/covers/trigger.jpg"`.

## 4. Change the excerpt

The reader currently shows the Prologue and Chapter 1 of Trigger v14.2. To regenerate it from any manuscript version:

```bash
pip install python-docx
python tools/build_excerpt.py "Trigger — Full Manuscript v14.2 (clean).docx" --slug trigger --start "Prologue" --end "3"
```

`--end "3"` stops before Chapter 3, so that command gives the Prologue plus Chapters 1–2. To add an excerpt for Cascade:

1. Run the script with `--slug cascade`.
2. Add `<script src="excerpts/cascade.js"></script>` to `index.html`.
3. Set `excerpt: "cascade"` on that book in `content.js`.

## Preview locally

Open `index.html` in a browser, or run `python -m http.server` in this folder and visit http://localhost:8000.
