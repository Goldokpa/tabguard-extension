# Smart TabGuard Extension - Testing Guide

## Overview
This guide will help you test the Smart TabGuard extension with all its AI-powered features including content analysis, smart form tracking, contextual warnings, and tab summarization.

## Prerequisites
- Chrome 138+ (required for Summarizer API)
- At least 4GB VRAM (for AI features)
- Stable internet connection (for model download)

## Installation Steps

### 1. Load the Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `basic-version` folder
5. The extension should appear in your extensions list

### 2. Verify Installation
- Look for the Smart TabGuard icon in your Chrome toolbar
- The icon should be visible and clickable
- Check that the extension appears in your extensions list

## Testing Scenarios

### Test 1: Basic Protection Features

#### 1.1 Site Protection
1. Navigate to any website (e.g., `https://example.com`)
2. Click the Smart TabGuard icon
3. Click "Protect this Site" button
4. Verify the button changes to "Unprotect this Site"
5. Try to close the tab - you should see a warning

#### 1.2 Form Detection (Basic)
1. Go to a website with a form (e.g., `https://httpbin.org/forms/post`)
2. Start filling out the form
3. Try to close the tab
4. You should see a warning about unsaved changes

### Test 2: AI Features Status

#### 2.1 Check AI Status
1. Click the Smart TabGuard icon
2. Look at the AI status indicator in the header:
   - **Green dot**: AI features available
   - **Orange dot**: AI features not available (Chrome < 138 or insufficient hardware)
   - **Red dot**: Error checking AI status

#### 2.2 AI Features Toggle
1. In the popup, find the "AI Features" section
2. Toggle "Enable AI Summarization" on/off
3. Toggle "Auto-summarize tabs" on/off
4. Verify settings persist after closing/reopening popup

### Test 3: Smart Content Analysis

#### 3.1 Form Analysis
1. Navigate to a complex form (e.g., a registration form)
2. Open browser console (F12)
3. Look for console messages like:
   - "Smart TabGuard content script initialized"
   - "Content analysis received: {contentType: 'form', ...}"
4. Fill out some fields and watch for completion feedback

#### 3.2 Article Analysis
1. Go to a news article or blog post
2. Check console for content analysis messages
3. Verify the extension categorizes it as "article" content

#### 3.3 Document Analysis
1. Navigate to a document editor (e.g., Google Docs, Notion)
2. Check console for "document" content type detection

### Test 4: Enhanced Form Tracking

#### 4.1 Completion Feedback
1. Find a form with multiple required fields
2. Start filling out the form
3. When you reach ~80% completion, you should see:
   - A green notification: "Almost done! X% complete"
   - The notification should auto-dismiss after 5 seconds

#### 4.2 Auto-save Suggestions
1. Fill out a complex form
2. Wait 30 seconds without saving
3. You should see a blue notification: "Consider saving your progress"
4. Click "Save Now" to test the save functionality

#### 4.3 Contextual Warnings
1. Fill out a form partially
2. Try to close the tab
3. You should see a specific warning like:
   - "You're 75% through completing this form. Are you sure you want to leave?"

### Test 5: Tab Summarization

#### 5.1 Manual Summary Generation
1. Navigate to a content-rich page (article, blog post)
2. Click the Smart TabGuard icon
3. Click "Generate Summary" button
4. Watch for:
   - Button text changes to "Generating..."
   - Summary appears in the "Tab Summary" section
   - Summary metadata (type, length, timestamp)

#### 5.2 Auto-summarization
1. Enable "Auto-summarize tabs" in the popup
2. Navigate to different types of content:
   - News articles
   - Blog posts
   - Documentation pages
3. Wait for automatic summarization (may take a few seconds)
4. Check the popup for generated summaries

### Test 6: Smart Recommendations

#### 6.1 Protection Recommendations
1. Navigate to a site that's not protected
2. Open the popup
3. Look for recommendations like:
   - "Consider protecting this site to prevent accidental tab closure"

#### 6.2 AI Feature Recommendations
1. Disable AI features in the popup
2. Navigate to a content-rich page
3. Look for recommendations to enable AI features

### Test 7: Error Handling

#### 7.1 Unsupported Browser
1. Test on Chrome < 138 (if available)
2. Verify graceful fallback to basic functionality
3. Check that AI status shows as unavailable

#### 7.2 Network Issues
1. Disconnect internet temporarily
2. Try to generate a summary
3. Verify appropriate error handling

## Expected Behaviors

### Console Messages to Look For
```
Smart TabGuard content script initialized
Content analysis received: {contentType: 'form', complexity: 'medium', ...}
Generated summary for tab X: [title]
Smart TabGuard background script initialized
```

### Visual Indicators
- **Extension Icon**: Changes color based on protection status
- **AI Status**: Color-coded indicator in popup header
- **Completion Feedback**: Green notification for form progress
- **Save Suggestions**: Blue notification for auto-save
- **Summary Display**: Formatted summary with metadata

### Performance Expectations
- Content analysis: Should complete within 1-2 seconds
- Summary generation: 5-15 seconds depending on content length
- Form tracking: Real-time response to user input
- Popup loading: Should be instant

## Troubleshooting

### Common Issues

#### 1. AI Features Not Available
- **Cause**: Chrome version < 138 or insufficient hardware
- **Solution**: Update Chrome or use basic features only

#### 2. Summaries Not Generating
- **Cause**: Network issues or model download problems
- **Solution**: Check internet connection and try again

#### 3. Form Tracking Not Working
- **Cause**: Dynamic content or complex form structure
- **Solution**: Refresh page and try again

#### 4. Popup Not Loading
- **Cause**: Extension not properly loaded
- **Solution**: Reload extension in chrome://extensions/

### Debug Information
- Open browser console (F12) to see detailed logs
- Check the "Errors" tab in chrome://extensions/ for extension errors
- Monitor network tab for API calls

## Test Results Template

Use this template to document your testing:

```
Test Date: _______________
Chrome Version: _______________
Hardware: _______________

✅ Basic Protection: Pass/Fail
✅ AI Features Status: Pass/Fail
✅ Content Analysis: Pass/Fail
✅ Form Tracking: Pass/Fail
✅ Tab Summarization: Pass/Fail
✅ Smart Recommendations: Pass/Fail
✅ Error Handling: Pass/Fail

Notes: _______________
Issues Found: _______________
```

## Next Steps After Testing

1. **Report Issues**: Document any bugs or unexpected behaviors
2. **Performance Feedback**: Note any performance issues
3. **Feature Requests**: Suggest improvements or new features
4. **User Experience**: Provide feedback on UI/UX

## Support

If you encounter issues during testing:
1. Check the console for error messages
2. Verify Chrome version and hardware requirements
3. Try reloading the extension
4. Document the issue with steps to reproduce 