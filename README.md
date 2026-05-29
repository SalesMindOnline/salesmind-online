# SalesMindOnline — AI B2B Sales Coaching App

## Folder Structure (upload ALL of these to GitHub root)
```
index.html
package.json
vite.config.js
README.md
src/
  App.jsx
  main.jsx
  index.css
api/
  claude.js
```

## Deploy to Vercel

1. Upload ALL files to GitHub repo (keep folder structure exactly as above)
2. Go to vercel.com → Add New Project → select your repo
3. Before deploying → Environment Variables → Add:
   - Name: ANTHROPIC_API_KEY
   - Value: your key from console.anthropic.com
4. Deploy!

## Connect Domain
- Vercel → Settings → Domains → Add salesmindOnline.com
- Copy the DNS records Vercel gives you
- Paste them into your domain registrar (Namecheap/Cloudflare)
- Wait 10-30 mins

## Revenue Model
- $49-99/month per user
- Target: 300-500 users = $180K-$600K ARR
