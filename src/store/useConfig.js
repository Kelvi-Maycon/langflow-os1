// store/useConfig.js — Configurações do usuário
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_MISSIONS } from '../constants/learning.js'
import { persistStorage } from '../utils/persistStorage.js'

const STORE_VERSION = 3

export const DEFAULT_CONFIG = {
  userLevel: 'B1',
  provider: '', // 'openai' | 'gemini' | ''
  openaiKey: '',
  openaiModel: 'gpt-5-mini',
  geminiKey: '',
  geminiModel: 'gemini-2.0-flash',
  srs: {
    dailyLimit: 20,
    intervals: { nao_lembro: 1, dificil: 3, bom: 7, facil: 14 },
  },
  builder: {
    difficultWordsWeight: 30,
    phrasesPerWord: 3,
    sessionWordLimit: 5,
  },
  study: {
    minSessionMinutes: 5,
  },
  autoAdjustDifficulty: true,
  missions: DEFAULT_MISSIONS,
}

function mergeConfig(currentConfig, updates) {
  const next = { ...currentConfig, ...updates }

  if (updates.srs) {
    next.srs = {
      ...currentConfig.srs,
      ...updates.srs,
      intervals: {
        ...currentConfig.srs?.intervals,
        ...updates.srs?.intervals,
      },
    }
  }

  if (updates.builder) {
    next.builder = {
      ...currentConfig.builder,
      ...updates.builder,
    }
  }

  if (updates.study) {
    next.study = {
      ...currentConfig.study,
      ...updates.study,
    }
  }

  if (updates.missions) {
    next.missions = {
      ...currentConfig.missions,
      ...updates.missions,
    }
  }

  return next
}

function migrateConfig(persistedState) {
  const persistedConfig = persistedState?.config || {}
  const builder = {
    ...DEFAULT_CONFIG.builder,
    ...(persistedConfig.builder || {}),
  }

  if (
    typeof persistedConfig.wordBankWeight === 'number' &&
    !persistedConfig.builder?.difficultWordsWeight
  ) {
    builder.difficultWordsWeight = persistedConfig.wordBankWeight
  }

  return {
    config: {
      ...DEFAULT_CONFIG,
      ...persistedConfig,
      srs: {
        ...DEFAULT_CONFIG.srs,
        ...(persistedConfig.srs || {}),
        intervals: {
          ...DEFAULT_CONFIG.srs.intervals,
          ...(persistedConfig.srs?.intervals || {}),
        },
      },
      builder,
      study: {
        ...DEFAULT_CONFIG.study,
        ...(persistedConfig.study || {}),
      },
      missions: {
        ...DEFAULT_CONFIG.missions,
        ...(persistedConfig.missions || {}),
      },
    },
  }
}

export const useConfig = create(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      setConfig: (updates) => set((state) => ({ config: mergeConfig(state.config, updates) })),
      setAI: (provider, key, model) =>
        set((state) => ({
          config: mergeConfig(state.config, {
            provider,
            ...(provider === 'openai' ? { openaiKey: key, openaiModel: model } : {}),
            ...(provider === 'gemini' ? { geminiKey: key, geminiModel: model } : {}),
          }),
        })),
      getAIConfig: () => {
        const { config } = get()
        if (!config.provider) return null
        return config
      },
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: 'langflow_config',
      storage: persistStorage,
      version: STORE_VERSION,
      migrate: (persistedState) => migrateConfig(persistedState),
    },
  ),
)
