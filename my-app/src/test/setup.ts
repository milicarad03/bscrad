import { vi } from 'vitest';

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
  length: 0,
  key: vi.fn(),
};

vi.stubGlobal('sessionStorage', sessionStorageMock);