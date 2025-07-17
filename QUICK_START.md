# Smart TabGuard - Quick Start Testing

## 🚀 Quick Installation

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)

2. **Load Extension**
   - Click "Load unpacked"
   - Select the `basic-version` folder
   - Extension should appear in your toolbar

## 🧪 Quick Test Checklist

### ✅ Basic Functionality (2 minutes)
- [ ] Click extension icon - popup opens
- [ ] Navigate to any website
- [ ] Click "Protect this Site" 
- [ ] Try to close tab - see warning

### ✅ AI Features (3 minutes)
- [ ] Check AI status indicator in popup header
- [ ] Toggle "Enable AI Summarization" on/off
- [ ] Navigate to a news article
- [ ] Click "Generate Summary" button
- [ ] Wait for summary to appear

### ✅ Smart Form Tracking (5 minutes)
- [ ] Go to `https://httpbin.org/forms/post`
- [ ] Fill out some form fields
- [ ] Watch for completion feedback (green notification)
- [ ] Try to close tab - see contextual warning

### ✅ Content Analysis (2 minutes)
- [ ] Open browser console (F12)
- [ ] Navigate to different sites
- [ ] Look for console messages about content analysis

## 🎯 Test URLs

### Forms
- `https://httpbin.org/forms/post` - Simple form
- `https://www.w3schools.com/html/html_forms.asp` - Form examples
- Any registration/login form

### Articles
- `https://news.ycombinator.com` - News articles
- `https://medium.com` - Blog posts
- Any news website

### Documents
- `https://docs.google.com` - Google Docs
- `https://notion.so` - Notion
- Any rich text editor

## 🔍 What to Look For

### Console Messages
```
Smart TabGuard content script initialized
Content analysis received: {contentType: 'form', ...}
Generated summary for tab X: [title]
```

### Visual Feedback
- **Green notifications**: Form completion progress
- **Blue notifications**: Save suggestions
- **AI status indicator**: Color-coded in popup header
- **Summary display**: In popup with metadata

### Expected Behaviors
- Form tracking works in real-time
- Summaries generate in 5-15 seconds
- Warnings are contextual and helpful
- Settings persist between sessions

## 🐛 Common Issues

### AI Features Not Working?
- Check Chrome version (needs 138+)
- Verify internet connection
- Check hardware requirements (4GB+ VRAM)

### Extension Not Loading?
- Make sure you selected the `basic-version` folder
- Check "Errors" tab in chrome://extensions/
- Try reloading the extension

### No Console Messages?
- Refresh the page
- Check if content script is injected
- Look for errors in console

## 📝 Quick Feedback

After testing, note:
- ✅ What worked well
- ❌ What didn't work
- 💡 Suggestions for improvement
- 🐛 Any bugs found

## 🎉 Success Indicators

You'll know it's working when:
- Popup opens with AI status indicator
- Form fields trigger completion feedback
- Summaries generate for articles
- Contextual warnings appear when closing tabs
- Console shows content analysis messages

---

**Ready to test?** Follow the checklist above and let me know how it goes! 