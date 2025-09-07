// Global type declarations for tests

declare global {
  interface Window {
    JSZip: any;
  }

  interface Response {
    timing?: {
      responseStart: number;
      responseEnd: number;
    };
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number; 
      jsHeapSizeLimit: number;
    };
  }
}

export {};