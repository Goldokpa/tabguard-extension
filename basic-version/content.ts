/// <reference types="chrome"/>

// content.ts
// Enhanced content script for Smart TabGuard
// Provides smart content detection, contextual warnings, and intelligent form tracking

interface FormDataInfo {
  formId: string;
  fields: FormField[];
  completionPercentage: number;
  lastModified: number;
  hasUnsavedChanges: boolean;
}

interface FormField {
  name: string;
  type: string;
  value: string;
  required: boolean;
  isModified: boolean;
}

interface ContentAnalysis {
  contentType: 'form' | 'article' | 'document' | 'general';
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  keyFields: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

let hasUnsavedChanges = false;
let isSiteProtected = false;
let currentFormData: FormDataInfo | null = null;
let contentAnalysis: ContentAnalysis | null = null;
let warningShown = false;
let autoSaveInterval: number | null = null;

// Initialize content script
initializeContentScript();

/**
 * Initialize the enhanced content script
 */
async function initializeContentScript() {
  try {
    // Check if the site is protected
    await checkProtectionStatus();
    
    // Analyze page content
    await analyzePageContent();
    
    // Set up enhanced form detection
    setupEnhancedFormDetection();
    
    // Set up smart change tracking
    setupSmartChangeTracking();
    
    // Set up enhanced beforeunload warning
    setupEnhancedWarning();
    
    // Set up auto-save suggestions
    setupAutoSaveSuggestions();
    
    console.log('Smart TabGuard content script initialized');
  } catch (error) {
    console.error('Failed to initialize content script:', error);
  }
}

/**
 * Check if the current site is protected
 */
async function checkProtectionStatus(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'GET_PROTECTION_STATUS',
      hostname: window.location.hostname
    });
    
    if (response && response.isProtected) {
      isSiteProtected = true;
    }
  } catch (error) {
    console.error('Failed to check protection status:', error);
  }
}

/**
 * Analyze page content for smart categorization
 */
async function analyzePageContent(): Promise<void> {
  try {
    const analysis = await performContentAnalysis();
    contentAnalysis = analysis;
    
    // Send analysis to background script for potential summarization
    chrome.runtime.sendMessage({
      action: 'CONTENT_ANALYSIS_COMPLETE',
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Failed to analyze page content:', error);
  }
}

/**
 * Perform detailed content analysis
 */
async function performContentAnalysis(): Promise<ContentAnalysis> {
  const forms = document.querySelectorAll('form');
  const inputs = document.querySelectorAll('input, textarea, select');
  const articles = document.querySelectorAll('article, [role="main"], main');
  
  let contentType: ContentAnalysis['contentType'] = 'general';
  let complexity: ContentAnalysis['complexity'] = 'low';
  let estimatedTime = 0;
  let keyFields: string[] = [];
  let riskLevel: ContentAnalysis['riskLevel'] = 'low';
  
  // Determine content type
  if (forms.length > 0) {
    contentType = 'form';
    complexity = forms.length > 2 ? 'high' : forms.length > 1 ? 'medium' : 'low';
    
    // Analyze form complexity
    const requiredFields = Array.from(inputs).filter(input => 
      input.hasAttribute('required') || 
      input.getAttribute('aria-required') === 'true'
    );
    
    const textFields = Array.from(inputs).filter(input => 
      input.tagName === 'TEXTAREA' || 
      ((input as HTMLInputElement).type === 'text' || (input as HTMLInputElement).type === 'email' || (input as HTMLInputElement).type === 'url')
    );
    
    estimatedTime = Math.max(1, Math.ceil((requiredFields.length * 2 + textFields.length * 3) / 2));
    
    // Identify key fields
    keyFields = Array.from(inputs)
      .filter(input => input.hasAttribute('required') || input.tagName === 'TEXTAREA')
      .map(input => input.getAttribute('name') || input.getAttribute('id') || 'unnamed')
      .slice(0, 5);
    
    riskLevel = requiredFields.length > 5 ? 'high' : requiredFields.length > 2 ? 'medium' : 'low';
    
  } else if (articles.length > 0 || document.querySelector('article, .post, .entry')) {
    contentType = 'article';
    complexity = 'medium';
    estimatedTime = Math.ceil(document.body.textContent?.length || 0 / 1000); // Rough estimate
    riskLevel = 'low';
    
  } else if (document.querySelector('.document, .editor, [contenteditable]')) {
    contentType = 'document';
    complexity = 'high';
    estimatedTime = 10; // Default for documents
    riskLevel = 'medium';
  }
  
  return {
    contentType,
    complexity,
    estimatedTime,
    keyFields,
    riskLevel
  };
}

/**
 * Set up enhanced form detection with detailed tracking
 */
function setupEnhancedFormDetection(): void {
  const forms = document.querySelectorAll('form');
  
  forms.forEach((form, index) => {
    const formId = form.id || `form_${index}`;
    const formData: FormDataInfo = {
      formId,
      fields: [],
      completionPercentage: 0,
      lastModified: Date.now(),
      hasUnsavedChanges: false
    };
    
    // Track form fields
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      const fieldData: FormField = {
        name: field.getAttribute('name') || field.getAttribute('id') || 'unnamed',
        type: field.getAttribute('type') || field.tagName.toLowerCase(),
        value: (field as HTMLInputElement).value || '',
        required: field.hasAttribute('required') || field.getAttribute('aria-required') === 'true',
        isModified: false
      };
      
      formData.fields.push(fieldData);
      
      // Track field changes
      field.addEventListener('input', () => handleFieldChange(formData, fieldData, field));
      field.addEventListener('change', () => handleFieldChange(formData, fieldData, field));
    });
    
    // Track form submission
    form.addEventListener('submit', () => handleFormSubmit(formData));
    
    // Store form data
    if (index === 0) {
      currentFormData = formData;
    }
  });
}

/**
 * Handle field changes with smart tracking
 */
function handleFieldChange(formData: FormDataInfo, fieldData: FormField, field: Element): void {
  const newValue = (field as HTMLInputElement).value || '';
  const hasChanged = fieldData.value !== newValue;
  
  if (hasChanged) {
    fieldData.value = newValue;
    fieldData.isModified = true;
    formData.lastModified = Date.now();
    formData.hasUnsavedChanges = true;
    
    // Calculate completion percentage
    const requiredFields = formData.fields.filter(f => f.required);
    const completedFields = requiredFields.filter(f => f.value.trim() !== '');
    formData.completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
    
    // Notify background script
    chrome.runtime.sendMessage({ action: 'UNSAVED_CHANGES_DETECTED' });
    
    // Show contextual feedback for high-completion forms
    if (formData.completionPercentage >= 80 && !warningShown) {
      showCompletionFeedback(formData);
    }
  }
}

/**
 * Show contextual completion feedback
 */
function showCompletionFeedback(formData: FormDataInfo): void {
  const feedback = document.createElement('div');
  feedback.className = 'smart-tabguard-feedback';
  feedback.innerHTML = `
    <div class="feedback-content">
      <span class="feedback-icon">🎯</span>
      <span class="feedback-text">Almost done! ${formData.completionPercentage}% complete</span>
      <button class="feedback-close">×</button>
    </div>
  `;
  
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideIn 0.3s ease;
  `;
  
  feedback.querySelector('.feedback-close')?.addEventListener('click', () => {
    feedback.remove();
    warningShown = true;
  });
  
  document.body.appendChild(feedback);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (feedback.parentNode) {
      feedback.remove();
    }
  }, 5000);
}

/**
 * Handle form submission
 */
function handleFormSubmit(formData: FormDataInfo): void {
  formData.hasUnsavedChanges = false;
  formData.completionPercentage = 100;
  chrome.runtime.sendMessage({ action: 'CHANGES_SAVED' });
  
  // Remove any feedback
  const feedback = document.querySelector('.smart-tabguard-feedback');
  if (feedback) {
    feedback.remove();
  }
}

/**
 * Set up smart change tracking for non-form content
 */
function setupSmartChangeTracking(): void {
  // Track contenteditable elements
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(element => {
    element.addEventListener('input', () => {
      hasUnsavedChanges = true;
      chrome.runtime.sendMessage({ action: 'UNSAVED_CHANGES_DETECTED' });
    });
  });
  
  // Track general input changes
  document.addEventListener('input', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      hasUnsavedChanges = true;
      chrome.runtime.sendMessage({ action: 'UNSAVED_CHANGES_DETECTED' });
    }
  });
}

/**
 * Set up enhanced beforeunload warning with contextual information
 */
function setupEnhancedWarning(): void {
  window.addEventListener('beforeunload', (event) => {
    if (isSiteProtected && (hasUnsavedChanges || (currentFormData?.hasUnsavedChanges))) {
      event.preventDefault();
      
      let warningMessage = 'You have unsaved changes. Are you sure you want to leave?';
      
      // Add contextual information
      if (currentFormData) {
        if (currentFormData.completionPercentage > 0) {
          warningMessage = `You're ${currentFormData.completionPercentage}% through completing this form. Are you sure you want to leave?`;
        } else if (contentAnalysis) {
          warningMessage = `You have unsaved work on this ${contentAnalysis.contentType}. Estimated time to complete: ${contentAnalysis.estimatedTime} minutes. Are you sure you want to leave?`;
        }
      }
      
      event.returnValue = warningMessage;
      return warningMessage;
    }
  });
}

/**
 * Set up auto-save suggestions
 */
function setupAutoSaveSuggestions(): void {
  // Check for auto-save capabilities
  const hasAutoSave = document.querySelector('[data-autosave], .autosave, [data-save-interval]');
  
  if (!hasAutoSave && currentFormData && contentAnalysis?.contentType === 'form') {
    // Suggest auto-save for complex forms
    setTimeout(() => {
      showAutoSaveSuggestion();
    }, 30000); // Show after 30 seconds of inactivity
  }
}

/**
 * Show auto-save suggestion
 */
function showAutoSaveSuggestion(): void {
  if (warningShown || !currentFormData?.hasUnsavedChanges) return;
  
  const suggestion = document.createElement('div');
  suggestion.className = 'smart-tabguard-suggestion';
  suggestion.innerHTML = `
    <div class="suggestion-content">
      <span class="suggestion-icon">💾</span>
      <span class="suggestion-text">Consider saving your progress</span>
      <button class="suggestion-action">Save Now</button>
      <button class="suggestion-close">×</button>
    </div>
  `;
  
  suggestion.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #2196f3;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: slideIn 0.3s ease;
  `;
  
  suggestion.querySelector('.suggestion-action')?.addEventListener('click', () => {
    // Try to trigger save
    const saveButton = document.querySelector('button[type="submit"], input[type="submit"], .save, .submit');
    if (saveButton) {
      (saveButton as HTMLElement).click();
    }
    suggestion.remove();
  });
  
  suggestion.querySelector('.suggestion-close')?.addEventListener('click', () => {
    suggestion.remove();
  });
  
  document.body.appendChild(suggestion);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (suggestion.parentNode) {
      suggestion.remove();
    }
  }, 10000);
}

/**
 * Observe DOM changes for dynamically added forms
 */
const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          
          // Check for new forms
          const newForms = element.querySelectorAll('form');
          if (newForms.length > 0) {
            setupEnhancedFormDetection();
          }
          
          // Check for new contenteditable elements
          const newEditable = element.querySelectorAll('[contenteditable="true"]');
          newEditable.forEach(editable => {
            editable.addEventListener('input', () => {
              hasUnsavedChanges = true;
              chrome.runtime.sendMessage({ action: 'UNSAVED_CHANGES_DETECTED' });
            });
          });
        }
      });
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style); 