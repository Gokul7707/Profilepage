# Gokul Srinivasan Prabu — Portfolio

Personal portfolio showcasing projects, skills, journey, and contact.

## Live site

| Platform | URL |
|----------|-----|
| **Vercel (recommended)** | https://profilepage.vercel.app *(after deploy)* |
| GitHub Pages | https://gokul7707.github.io/Profilepage/ |

## Deploy on Vercel

1. Import [Profilepage on Vercel](https://vercel.com/new/import?owner=Gokul7707&project-name=profilepage&provider=github&s=https%3A%2F%2Fgithub.com%2FGokul7707%2FProfilepage)
2. Set **Framework Preset** to **Other** (not Services)
3. Confirm **Root Directory** is `./`
4. Deploy, then add these **Environment Variables** and redeploy:

| Variable | Value |
|----------|-------|
| `CONTACT_EMAIL` | `gokulsrinivasan2020@gmail.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASSWORD` | Gmail App Password (16 chars, no spaces) |

The contact form uses [FormSubmit](https://formsubmit.co/) on live sites (no SMTP required). On the **first** submission, FormSubmit emails `gokulsrinivasan2020@gmail.com` an **Activate Form** link — click it once, then every visitor can send messages. Optional: set SMTP env vars on Vercel to send via Gmail instead.

## Local development

```bash
pnpm install
pnpm run dev
```

Opens `http://localhost:8080/hello.html` with the FastAPI contact API on port 8000.
