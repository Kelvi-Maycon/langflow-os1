import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useCardStore } from '../store/useCardStore.js';
import { useConfig } from '../store/useConfig.js';
import { useProgressStore } from '../store/useProgressStore.js';
import { useWordStore } from '../store/useWordStore.js';
import { useUiStore } from '../store/useUiStore.js';

function createMemoryStorage() {
  let store = {};

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    key(index) {
      return Object.keys(store)[index] ?? null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
}

const memoryStorage = createMemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryStorage,
  configurable: true,
});

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
}

beforeEach(() => {
  memoryStorage.clear();
  useConfig.getState().resetConfig();
  useWordStore.getState().clearAll();
  useCardStore.getState().clearAll();
  useProgressStore.getState().resetProgress();
  useUiStore.getState().clearUi();
});

afterEach(() => {
  cleanup();
});
