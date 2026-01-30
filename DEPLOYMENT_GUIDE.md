# Visual Novel Puppet - Online Deployment Guide

Your app is now ready to be deployed online! Here are your options:

---

## 🚀 OPTION 1: Railway.app (EASIEST - Recommended)

**Perfect for beginners. Free tier available.**

### Steps:

1. **Create a GitHub repository:**
   - Go to https://github.com/new
   - Create a new repository (can be private)
   - Upload all your files:
     - `server.js`
     - `viewer.html` (put in `public/` folder)
     - `control.html` (put in `public/` folder)
     - `package.json`
     - All your `public/sprites/` and `public/bg/` folders

2. **Deploy to Railway:**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js and deploy
   - You'll get a URL like: `https://your-app.railway.app`

3. **Access your app:**
   - Controller: `https://your-app.railway.app/control.html`
   - Viewer: `https://your-app.railway.app/viewer.html`
   - Share the viewer URL with your friend!

**Cost:** Free tier (500 hours/month)

---

## 🚀 OPTION 2: Render.com

**Another great free option with persistent deployment.**

### Steps:

1. **Push to GitHub** (same as Railway step 1)

2. **Deploy to Render:**
   - Go to https://render.com
   - Sign up with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Settings:
     - Build Command: `npm install`
     - Start Command: `npm start`
   - Click "Create Web Service"
   - You'll get a URL like: `https://your-app.onrender.com`

3. **Access your app:**
   - Controller: `https://your-app.onrender.com/control.html`
   - Viewer: `https://your-app.onrender.com/viewer.html`

**Cost:** Free tier available (spins down after inactivity, restarts on access)

---

## 🚀 OPTION 3: Fly.io

**Best for global deployment and lower latency.**

### Steps:

1. **Install Fly CLI:**
   ```bash
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Deploy:**
   ```bash
   # Login
   fly auth login
   
   # Launch app (in your project folder)
   fly launch
   # Follow prompts, say YES to Dockerfile
   
   # Deploy
   fly deploy
   ```

3. **Access your app:**
   - You'll get a URL like: `https://your-app.fly.dev`
   - Controller: `https://your-app.fly.dev/control.html`
   - Viewer: `https://your-app.fly.dev/viewer.html`

**Cost:** Free tier (3 shared VMs)

---

## 🏠 OPTION 4: Self-Hosting with Ngrok (Quick Test)

**Best for testing before deploying. NOT for permanent use.**

### Steps:

1. **Install Ngrok:**
   - Download from https://ngrok.com/download
   - Sign up for free account

2. **Run your server locally:**
   ```bash
   node server.js
   ```

3. **In another terminal, start Ngrok:**
   ```bash
   ngrok http 8080
   ```

4. **Share the URL:**
   - Ngrok will give you a URL like: `https://abc123.ngrok.io`
   - Controller: `https://abc123.ngrok.io/control.html`
   - Viewer: `https://abc123.ngrok.io/viewer.html`
   - Share viewer URL with your friend!

**Note:** URL changes every time you restart Ngrok (unless you pay for static URLs)

---

## 📁 Project Structure for Deployment

Make sure your project looks like this:

```
your-project/
├── server.js
├── package.json
├── Dockerfile (optional, for Railway/Render)
├── .gitignore
└── public/
    ├── control.html
    ├── viewer.html
    ├── sprites/
    │   ├── happy/
    │   │   ├── sprite1.png
    │   │   └── sprite2.png
    │   └── sad/
    │       └── sprite1.png
    └── bg/
        ├── room.png
        ├── night.png
        └── sky.png
```

---

## 🔒 Security Tips

1. **Password Protection (Optional):**
   - Add a simple password to `control.html` so only you can access it
   - Keep `viewer.html` public for your friend

2. **Rate Limiting:**
   - The current setup is fine for 2 users
   - If you expect more viewers, consider adding rate limiting

3. **HTTPS:**
   - All cloud platforms provide HTTPS automatically
   - Required for WebSocket connections to work properly

---

## 🎮 How to Use Once Deployed

**For You (Controller):**
1. Visit: `https://your-app-url.com/control.html`
2. Control the character, backgrounds, and dialogue

**For Your Friend (Viewer):**
1. Visit: `https://your-app-url.com/viewer.html`
2. See everything you control in real-time
3. Can send messages back to you via the phone chat

---

## 💡 Recommended Path for Beginners

1. **Test locally first** - Make sure everything works
2. **Try Ngrok** - Test with your friend quickly
3. **Deploy to Railway** - Permanent solution (easiest)

---

## 🆘 Troubleshooting

**WebSocket not connecting:**
- Make sure you're using HTTPS (not HTTP)
- Check browser console for errors
- Ensure the server is running

**Images not loading:**
- Verify all images are in `public/sprites/` and `public/bg/`
- Check file names match exactly (case-sensitive)

**App sleeping (Render):**
- Free tier sleeps after 15 min of inactivity
- First visit takes ~30 seconds to wake up
- Upgrade to paid tier for 24/7 uptime

---

## 📊 Comparison Table

| Platform | Free Tier | Always On | Setup Difficulty | Best For |
|----------|-----------|-----------|------------------|----------|
| Railway  | ✅ 500hrs | ✅        | ⭐ Easy          | Beginners |
| Render   | ✅        | ❌*       | ⭐ Easy          | Budget |
| Fly.io   | ✅        | ✅        | ⭐⭐ Medium     | Performance |
| Ngrok    | ✅        | ❌        | ⭐ Easy          | Testing |

*Spins down after inactivity on free tier

---

## 🎉 You're Ready!

Pick a platform above and follow the steps. Your visual novel puppet will be live and accessible from anywhere in the world!

Good luck! 🚀
