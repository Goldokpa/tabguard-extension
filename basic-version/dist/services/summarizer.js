// Summarizer Service for Smart TabGuard
// Handles all interactions with Chrome's Summarizer API
export class SummarizerService {
    constructor() {
        this.summarizer = null;
        this.isInitialized = false;
        this.initializationPromise = null;
    }
    static getInstance() {
        if (!SummarizerService.instance) {
            SummarizerService.instance = new SummarizerService();
        }
        return SummarizerService.instance;
    }
    /**
     * Check if the Summarizer API is available in the current browser
     */
    async isSupported() {
        return 'Summarizer' in self;
    }
    /**
     * Initialize the summarizer with the specified configuration
     */
    async initialize(config = {}) {
        if (this.isInitialized) {
            return;
        }
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        this.initializationPromise = this.performInitialization(config);
        return this.initializationPromise;
    }
    async performInitialization(config) {
        try {
            // Check if API is supported
            if (!('Summarizer' in self)) {
                throw new Error('Summarizer API is not supported in this browser');
            }
            // Check availability
            const availability = await Summarizer.availability();
            if (availability === 'unavailable') {
                throw new Error('Summarizer API is not available');
            }
            // Create summarizer with progress monitoring
            this.summarizer = await Summarizer.create({
                type: config.type || 'key-points',
                format: config.format || 'markdown',
                length: config.length || 'medium',
                sharedContext: config.sharedContext,
                monitor: (monitor) => {
                    monitor.addEventListener('downloadprogress', (event) => {
                        const progress = (event.loaded / event.total) * 100;
                        console.log(`Summarizer model download progress: ${progress.toFixed(1)}%`);
                    });
                }
            });
            // Wait for the summarizer to be ready
            await this.summarizer.ready;
            this.isInitialized = true;
            console.log('Summarizer initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize summarizer:', error);
            throw error;
        }
    }
    /**
     * Generate a summary for the given text
     */
    async summarize(text, context) {
        if (!this.isInitialized || !this.summarizer) {
            throw new Error('Summarizer not initialized');
        }
        try {
            const summary = await this.summarizer.summarize(text, {
                context: context
            });
            return summary;
        }
        catch (error) {
            console.error('Failed to generate summary:', error);
            throw error;
        }
    }
    /**
     * Generate a streaming summary for the given text
     */
    async *summarizeStreaming(text, context) {
        if (!this.isInitialized || !this.summarizer) {
            throw new Error('Summarizer not initialized');
        }
        try {
            const stream = this.summarizer.summarizeStreaming(text, {
                context: context
            });
            for await (const chunk of stream) {
                yield chunk;
            }
        }
        catch (error) {
            console.error('Failed to generate streaming summary:', error);
            throw error;
        }
    }
    /**
     * Generate a smart tab summary based on content type
     */
    async generateTabSummary(tabId, url, title, content) {
        // Determine the best summary type based on content
        const summaryType = this.determineSummaryType(content, url);
        // Reinitialize with the appropriate type if needed
        if (this.summarizer) {
            await this.initialize({ type: summaryType, length: 'short' });
        }
        const summary = await this.summarize(content, `This is content from: ${title}`);
        return {
            tabId,
            url,
            title,
            summary,
            type: summaryType,
            length: 'short',
            timestamp: Date.now()
        };
    }
    /**
     * Determine the best summary type based on content and URL
     */
    determineSummaryType(content, url) {
        const urlLower = url.toLowerCase();
        // Check for form-heavy content
        if (content.includes('<form') || content.includes('input') || content.includes('textarea')) {
            return 'key-points';
        }
        // Check for article/blog content
        if (urlLower.includes('blog') || urlLower.includes('article') || urlLower.includes('news')) {
            return 'teaser';
        }
        // Check for document/editor content
        if (urlLower.includes('docs') || urlLower.includes('drive') || urlLower.includes('office')) {
            return 'tldr';
        }
        // Default to key-points for general content
        return 'key-points';
    }
    /**
     * Clean up resources
     */
    dispose() {
        if (this.summarizer) {
            // Remove event listeners if any
            this.summarizer = null;
        }
        this.isInitialized = false;
        this.initializationPromise = null;
    }
}
