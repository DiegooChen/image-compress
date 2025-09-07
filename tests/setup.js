// Jest 测试环境设置
require('@testing-library/jest-dom');

// Mock global objects
global.JSZip = jest.fn();
global.Worker = jest.fn(() => ({
  postMessage: jest.fn(),
  addEventListener: jest.fn(),
  terminate: jest.fn()
}));

// Mock DOM APIs
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Canvas API for image processing tests
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: jest.fn()
  })),
  toDataURL: jest.fn(() => 'data:image/jpeg;base64,mock-data'),
  toBlob: jest.fn((callback) => callback(new Blob(['mock'], { type: 'image/jpeg' })))
};

global.HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
global.HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;
global.HTMLCanvasElement.prototype.toBlob = mockCanvas.toBlob;

// Mock localStorage with proper state management
const localStorageStore = {};
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn((key) => localStorageStore[key] || null),
    setItem: jest.fn((key, value) => { localStorageStore[key] = String(value); }),
    removeItem: jest.fn((key) => { delete localStorageStore[key]; }),
    clear: jest.fn(() => {
      Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
    })
  },
  writable: true
});