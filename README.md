# 🍳 MoodMunch - AI Recipe Recommendation System

AI-powered recipe recommendations based on your mood and available ingredients with voice input support.

## 🚀 Quick Deploy to Production

### Prerequisites
- MongoDB Atlas account (free tier works)
- Google Gemini API key
- Vercel account (free)

### Backend Deployment (Vercel)

1. **Setup MongoDB Atlas**
```bash
   # Create cluster at https://www.mongodb.com/cloud/atlas
   # Get connection string: mongodb+srv://username:password@cluster.mongodb.net/dbname
   # Whitelist all IPs: 0.0.0.0/0
```

2. **Deploy Backend**
```bash
   cd backend
   
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   
   # Set environment variables in Vercel dashboard:
   # - MONGODB_URL
   # - GEMINI_API_KEY
   # - SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
   # - ALLOWED_ORIGINS_STR (your frontend URL)
```

3. **Note your backend URL**: `https://your-backend.vercel.app`

### Frontend Deployment (Vercel)

1. **Update API URL**
```javascript
   // frontend/src/utils/constants.js
   export const API_BASE = 'https://your-backend.vercel.app';  // Your backend URL
```

2. **Deploy Frontend**
```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   
   # Deploy
   vercel --prod
```

3. **Update Backend CORS**
   - Go to Vercel backend dashboard
   - Update `ALLOWED_ORIGINS_STR` environment variable
   - Add your frontend URL: `https://your-frontend.vercel.app`
   - Redeploy backend

## 📋 Local Development

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Run server
python main.py
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🔧 Environment Variables

### Backend (.env)
```bash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
GEMINI_API_KEY=your-gemini-api-key
SECRET_KEY=your-secret-key-min-32-chars
ALLOWED_ORIGINS_STR=http://localhost:3000,https://your-frontend.vercel.app
```

### Frontend (.env)
```bash
REACT_APP_API_BASE_URL=http://localhost:8000  # or your production URL
```

## 🧪 Testing

### Test Backend Health
```bash
curl https://your-backend.vercel.app/health
```

### Test Frontend
```bash
# Open browser
https://your-frontend.vercel.app
```

## 📚 API Documentation

Once deployed, visit:
- Interactive Docs: `https://your-backend.vercel.app/docs`
- Alternative Docs: `https://your-backend.vercel.app/redoc`

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Check connection string format
- Verify IP whitelist (0.0.0.0/0 for all)
- Ensure user has read/write permissions

**CORS Errors**
- Update `ALLOWED_ORIGINS_STR` with frontend URL
- Redeploy backend after changes

**Gemini API Errors**
- Verify API key is valid
- Check quota limits at https://makersuite.google.com

### Frontend Issues

**API Connection Failed**
- Verify `API_BASE` URL in `constants.js`
- Check backend is deployed and healthy
- Check network tab for exact error

**Build Fails**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`

## 📊 Monitoring

### Check Backend Logs
```bash
vercel logs your-backend-url --prod
```

### Check Frontend Logs
```bash
vercel logs your-frontend-url --prod
```

## 🔐 Security Checklist

- [ ] Changed default SECRET_KEY
- [ ] Using environment variables (not hardcoded)
- [ ] MongoDB password is strong
- [ ] CORS configured correctly
- [ ] MongoDB IP whitelist configured
- [ ] API keys not committed to git

## 🎯 Features

- ✅ Voice input for ingredients
- ✅ Text input alternative
- ✅ Mood-based recipe generation
- ✅ Recipe history
- ✅ Favorites system
- ✅ User profiles
- ✅ Analytics dashboard
- ✅ Dark mode
- ✅ Responsive design

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 📧 Support

For issues or questions:
- Open a GitHub issue
- Email: support@moodmunch.com (if available)

---

**Built with ❤️ using FastAPI, React, MongoDB, and Google Gemini AI**
```