import { createJSONStorage } from 'zustand/middleware'

function createMemoryStorage() {
  let store = {}

  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
  }
}

const memoryStorage = createMemoryStorage()

function getSafeStorage() {
  if (
    typeof window !== 'undefined' &&
    window.localStorage &&
    typeof window.localStorage.getItem === 'function'
  ) {
    return window.localStorage
  }

  if (
    typeof globalThis !== 'undefined' &&
    globalThis.localStorage &&
    typeof globalThis.localStorage.getItem === 'function'
  ) {
    return globalThis.localStorage
  }

  return memoryStorage
}

export const persistStorage = createJSONStorage(() => getSafeStorage())
