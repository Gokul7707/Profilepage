# Gokul Srinivasan Prabu — Portfolio

Personal portfolio showcasing projects, skills, journey, and contact.

## Live site

**https://gokul7707.github.io/Profilepage/**

After pushing to `main`, enable GitHub Pages once:

1. Open [Profilepage Settings → Pages](https://github.com/Gokul7707/Profilepage/settings/pages)
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

The workflow in `.github/workflows/pages.yml` deploys automatically on every push to `main`.

## Local development

```bash
pnpm install
pnpm run dev
```

Opens the site at `http://localhost:8080/hello.html` with the FastAPI contact API on port 8000.

## Optional: full backend on Render

For the contact form API (instead of mailto on GitHub Pages), connect this repo to [Render](https://render.com) using `render.yaml` and set SMTP env vars.
