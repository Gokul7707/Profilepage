# Gokul Srinivasan Prabu — Portfolio

Personal portfolio showcasing projects, skills, journey, and contact.

## Live site

| Platform | URL |
|----------|-----|
| **Vercel (recommended)** | https://profilepage.vercel.app *(after deploy)* |
| GitHub Pages | https://gokul7707.github.io/Profilepage/ |

## Deploy on Vercel

1. Open [Import Profilepage on Vercel](https://vercel.com/new/import?framework=vite&owner=Gokul7707&project-name=profilepage&provider=github&s=https%3A%2F%2Fgithub.com%2FGokul7707%2FProfilepage)
2. Confirm **Root Directory** is `./`
3. `vercel.json` already sets **Framework: Other** (static site + API)
4. Click **Deploy**
5. Add environment variables in **Project → Settings → Environment Variables**:
   - `CONTACT_EMAIL`
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_USER`
   - `SMTP_PASSWORD` (Gmail App Password, 16 chars)

Redeploy after adding env vars so the contact form sends email.

## Local development

```bash
pnpm install
pnpm run dev
```

Opens `http://localhost:8080/hello.html` with the FastAPI contact API on port 8000.
