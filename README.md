# Texter Docs

Public documentation site for **Texter** bot YAML (Docusaurus 3, GitHub Pages).

Live: [whatsper.github.io/texterdocs](https://whatsper.github.io/texterdocs/)

## Commands

```bash
npm install
npm start          # dev
npm run build      # output in build/
```

Deploy: GitHub Actions workflow pushes `build/` to `gh-pages`. Optional repo secret **`FEEDBACK_WEBHOOK_URL`** bakes the feedback widget webhook into the production build; leave unset to hide the widget locally.
