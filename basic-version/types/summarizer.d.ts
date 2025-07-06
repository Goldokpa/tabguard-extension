// Type definitions for Chrome Summarizer API
// Based on: https://developer.chrome.com/docs/ai/summarizer-api

declare global {
  interface Window {
    Summarizer: typeof Summarizer;
  }

  interface SummarizerOptions {
    sharedContext?: string;
    type?: 'key-points' | 'tldr' | 'teaser' | 'headline';
    format?: 'markdown' | 'plain-text';
    length?: 'short' | 'medium' | 'long';
    monitor?: (monitor: SummarizerMonitor) => void;
  }

  interface SummarizerMonitor {
    addEventListener(type: 'downloadprogress', listener: (event: DownloadProgressEvent) => void): void;
    removeEventListener(type: 'downloadprogress', listener: (event: DownloadProgressEvent) => void): void;
  }

  interface DownloadProgressEvent {
    loaded: number;
    total: number;
  }

  interface SummarizerContext {
    context?: string;
  }

  interface Summarizer {
    ready: Promise<void>;
    summarize(text: string, options?: SummarizerContext): Promise<string>;
    summarizeStreaming(text: string, options?: SummarizerContext): AsyncIterable<string>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }

  interface SummarizerConstructor {
    availability(): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
    create(options?: SummarizerOptions): Promise<Summarizer>;
  }

  const Summarizer: SummarizerConstructor;
}

export {}; 