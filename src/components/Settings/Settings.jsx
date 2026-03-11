import { useEffect, useRef, useState } from 'react'
import { useConfig } from '../../store/useConfig.js'
import { callOpenAI } from '../../services/openai.js'
import { callGemini } from '../../services/gemini.js'
import { useCardStore } from '../../store/useCardStore.js'
import { DEFAULT_MISSIONS, MISSION_META } from '../../constants/learning.js'
import { calculateStreakStats, getDayKey, useProgressStore } from '../../store/useProgressStore.js'
import { useUiStore } from '../../store/useUiStore.js'
import { storage } from '../../utils/storage.js'
import PageHeader from '../shared/PageHeader.jsx'
import { BrainIcon, BoltIcon, GridIcon, SettingsIcon, SparkIcon } from '../shared/icons.jsx'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']
const OAI_MODELS = [
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5.2',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o-mini',
  'gpt-4o',
]
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']

function StatusDot({ status }) {
  const color = status === 'ok' ? '#10B981' : status === 'error' ? '#EF4444' : '#F59E0B'
  return <span className="status-dot" style={{ background: color }} />
}

export default function Settings() {
  const fileInputRef = useRef(null)
  const { config, setConfig, setAI } = useConfig()
  const { flashcards } = useCardStore()
  const { xp, level, dailyStats, totals, achievements, autoAdjustMeta, resetProgress } =
    useProgressStore()
  const { publishMilestone, pushToast } = useUiStore()

  const [testStatus, setTestStatus] = useState(null)
  const [testMsg, setTestMsg] = useState('')
  const [tab, setTab] = useState('essential')
  const [banner, setBanner] = useState(null)
  const [form, setForm] = useState({
    provider: config.provider || '',
    openaiKey: config.openaiKey || '',
    openaiModel: config.openaiModel || 'gpt-5-mini',
    geminiKey: config.geminiKey || '',
    geminiModel: config.geminiModel || 'gemini-2.0-flash',
  })

  const todayStats = dailyStats[getDayKey()] || {}
  const streakStats = calculateStreakStats(dailyStats, config.study?.minSessionMinutes ?? 5)
  const usageBytes = storage.getUsage()
  const usageKB = (usageBytes / 1024).toFixed(1)
  const usagePct = Math.round((usageBytes / (5 * 1024 * 1024)) * 100)

  const save = () => {
    setAI(
      form.provider,
      form.provider === 'openai' ? form.openaiKey : form.geminiKey,
      form.provider === 'openai' ? form.openaiModel : form.geminiModel,
    )
    setTestStatus(null)
    setBanner({ type: 'success', text: 'Configuracoes salvas localmente.' })
    pushToast({
      kind: 'success',
      source: 'settings',
      title: 'Configuracoes salvas',
      description: 'Seu setup foi atualizado no navegador.',
    })
  }

  const test = async () => {
    setTestStatus('testing')
    setTestMsg('')
    try {
      let response
      if (form.provider === 'openai') {
        response = await callOpenAI({
          apiKey: form.openaiKey,
          model: form.openaiModel,
          systemPrompt: 'You are a helper.',
          userPrompt: 'Reply: OK',
        })
      } else {
        response = await callGemini({
          apiKey: form.geminiKey,
          model: form.geminiModel,
          systemPrompt: 'You are a helper.',
          userPrompt: 'Reply: OK',
        })
      }

      setTestStatus('ok')
      setTestMsg(`Conexao confirmada: ${response.slice(0, 40)}`)
      pushToast({
        kind: 'success',
        source: 'settings',
        title: 'Conexao validada',
        description: 'O provedor respondeu ao teste.',
      })
    } catch (error) {
      setTestStatus('error')
      setTestMsg(error.message)
      pushToast({
        kind: 'error',
        source: 'settings',
        title: 'Falha no teste',
        description: error.message,
      })
    }
  }

  const exportBackup = () => {
    const data = storage.exportAll()
    const anchor = document.createElement('a')
    anchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(data)}`
    anchor.download = 'langflow-backup.json'
    anchor.click()

    publishMilestone({
      kind: 'success',
      source: 'settings',
      title: 'Backup exportado',
      description: 'Seus dados locais foram baixados em JSON.',
    })
  }

  const importBackup = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      try {
        storage.importAll(loadEvent.target?.result)
        publishMilestone({
          kind: 'success',
          source: 'settings',
          title: 'Backup importado',
          description: 'Os dados foram carregados. A pagina sera atualizada.',
        })
        setBanner({
          type: 'success',
          text: 'Backup importado com sucesso. Atualizando a aplicacao...',
        })
        window.setTimeout(() => window.location.reload(), 250)
      } catch {
        setBanner({
          type: 'error',
          text: 'Arquivo invalido. Use um backup JSON gerado pelo LangFlow.',
        })
        pushToast({
          kind: 'error',
          source: 'settings',
          title: 'Importacao falhou',
          description: 'O arquivo nao pode ser lido como backup valido.',
        })
      } finally {
        event.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  const handleResetProgress = () => {
    resetProgress()
    publishMilestone({
      kind: 'info',
      source: 'settings',
      title: 'Gamificacao reiniciada',
      description: 'XP, streak e missoes foram limpos sem apagar palavras ou cards.',
    })
  }

  useEffect(() => {
    const handlePageAction = (event) => {
      if (event.detail?.action === 'settings-primary') {
        save()
      }
    }

    window.addEventListener('langflow:page-action', handlePageAction)
    return () => window.removeEventListener('langflow:page-action', handlePageAction)
  }, [form])

  return (
    <div>
      <PageHeader
        icon={<SettingsIcon size={22} />}
        title="Configuracoes"
        description="Ajuste nivel, IA, pratica e dados locais sem sair do fluxo principal."
      />

      <div className="page-content settings-page">
        <div className="settings-tabs">
          {[
            ['essential', 'Essencial', <GridIcon key="essential" size={16} />],
            ['ai', 'IA', <SparkIcon key="ai" size={16} />],
            ['study', 'Estudo & SRS', <BrainIcon key="study" size={16} />],
            ['data', 'Dados & progresso', <BoltIcon key="data" size={16} />],
          ].map(([key, label, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`settings-tab${tab === key ? ' active' : ''}`}
            >
              <span className="settings-tab-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {banner ? (
          <div
            className={`alert ${banner.type === 'success' ? 'alert-success' : banner.type === 'error' ? 'alert-error' : 'alert-info'} mb-lg`}
          >
            {banner.text}
          </div>
        ) : null}

        {tab === 'essential' ? (
          <div className="settings-section-grid">
            <div className="card">
              <h3 className="settings-section-title">Nivel atual</h3>
              <div className="settings-pill-row">
                {LEVELS.map((levelOption) => (
                  <button
                    key={levelOption}
                    type="button"
                    onClick={() => setConfig({ userLevel: levelOption })}
                    className={`settings-pill${config.userLevel === levelOption ? ' active' : ''}`}
                  >
                    {levelOption}
                  </button>
                ))}
              </div>
              <div className="settings-inline-copy">
                Sessao minima: {config.study?.minSessionMinutes ?? 5} min · Cards por dia:{' '}
                {config.srs?.dailyLimit ?? 20}
              </div>
            </div>

            <div className="card">
              <h3 className="settings-section-title">Controles frequentes</h3>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="input-label">Cards por dia</label>
                  <input
                    className="input"
                    type="number"
                    min={5}
                    max={200}
                    value={config.srs?.dailyLimit ?? 20}
                    onChange={(event) =>
                      setConfig({ srs: { ...config.srs, dailyLimit: Number(event.target.value) } })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">Palavras por sessao</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={10}
                    value={config.builder?.sessionWordLimit ?? 5}
                    onChange={(event) =>
                      setConfig({
                        builder: {
                          ...config.builder,
                          sessionWordLimit: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'ai' ? (
          <div style={{ maxWidth: 760 }}>
            <div className="card mb-lg">
              <h3 className="settings-section-title">Provedor de IA</h3>
              <div className="settings-pill-row mb-lg">
                {[
                  ['openai', 'OpenAI'],
                  ['gemini', 'Gemini'],
                  ['', 'Sem IA'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, provider: key }))}
                    className={`settings-pill${form.provider === key ? ' active' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.provider === 'openai' ? (
                <div className="flex-col gap-md">
                  <div>
                    <label className="input-label">API key OpenAI</label>
                    <input
                      className="input"
                      type="password"
                      placeholder="sk-proj-..."
                      value={form.openaiKey}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, openaiKey: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="input-label">Modelo</label>
                    <select
                      className="input"
                      value={form.openaiModel}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, openaiModel: event.target.value }))
                      }
                    >
                      {OAI_MODELS.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {form.provider === 'gemini' ? (
                <div className="flex-col gap-md">
                  <div>
                    <label className="input-label">API key Gemini</label>
                    <input
                      className="input"
                      type="password"
                      placeholder="AIza..."
                      value={form.geminiKey}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, geminiKey: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="input-label">Modelo</label>
                    <select
                      className="input"
                      value={form.geminiModel}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, geminiModel: event.target.value }))
                      }
                    >
                      {GEMINI_MODELS.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              {!form.provider ? (
                <div className="alert alert-info">
                  Sem IA configurada. Reader e Builder vao usar fallback local.
                </div>
              ) : null}

              <div className="flex gap-sm mt-lg">
                <button className="btn btn-primary" onClick={save}>
                  Salvar
                </button>
                {form.provider ? (
                  <button
                    className="btn btn-outline"
                    onClick={test}
                    disabled={testStatus === 'testing'}
                  >
                    {testStatus === 'testing' ? 'Testando...' : 'Testar conexao'}
                  </button>
                ) : null}
              </div>

              {testStatus && testStatus !== 'testing' ? (
                <div
                  className={`alert ${testStatus === 'ok' ? 'alert-success' : 'alert-error'} mt-md`}
                >
                  <StatusDot status={testStatus} /> {testMsg}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'study' ? (
          <div style={{ maxWidth: 860 }}>
            <div className="card mb-lg">
              <h3 className="settings-section-title">Pratica e SRS</h3>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="input-label">Variacoes por palavra</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={3}
                    value={config.builder?.phrasesPerWord ?? 3}
                    onChange={(event) =>
                      setConfig({
                        builder: { ...config.builder, phrasesPerWord: Number(event.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">Peso de palavras dificeis (%)</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={100}
                    value={config.builder?.difficultWordsWeight ?? 30}
                    onChange={(event) =>
                      setConfig({
                        builder: {
                          ...config.builder,
                          difficultWordsWeight: Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="card mb-lg">
              <h3 className="settings-section-title">Missoes e ritmo</h3>
              <div className="flex flex-col gap-md">
                {MISSION_META.map(({ key, label, icon }) => (
                  <div key={key} className="settings-mission-row">
                    <div className="flex justify-between items-center mb-sm">
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-heading)' }}>
                        {icon} {label}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--c-muted)' }}>
                        hoje: {todayStats[key] || 0} /{' '}
                        {config.missions?.[key] ?? DEFAULT_MISSIONS[key]}
                      </div>
                    </div>
                    <div className="flex items-center gap-sm">
                      <input
                        type="range"
                        min={1}
                        max={key === 'flashcardReviews' ? 30 : 12}
                        value={config.missions?.[key] ?? DEFAULT_MISSIONS[key]}
                        onChange={(event) =>
                          setConfig({
                            missions: { ...config.missions, [key]: Number(event.target.value) },
                          })
                        }
                        style={{ flex: 1, accentColor: 'var(--c-brand)' }}
                      />
                      <span className="settings-range-value">
                        {config.missions?.[key] ?? DEFAULT_MISSIONS[key]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="settings-section-title">Streak e auto-ajuste</h3>
              <div className="grid-2" style={{ gap: 16 }}>
                <div>
                  <label className="input-label">Sessao minima para contar streak</label>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={60}
                    value={config.study?.minSessionMinutes ?? 5}
                    onChange={(event) =>
                      setConfig({
                        study: { ...config.study, minSessionMinutes: Number(event.target.value) },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="input-label">Auto-ajuste</label>
                  <button
                    type="button"
                    className={`settings-pill${config.autoAdjustDifficulty ? ' active' : ''}`}
                    onClick={() =>
                      setConfig({ autoAdjustDifficulty: !config.autoAdjustDifficulty })
                    }
                  >
                    {config.autoAdjustDifficulty ? 'Ativado' : 'Desativado'}
                  </button>
                </div>
              </div>

              <div className="settings-inline-copy" style={{ marginTop: 12 }}>
                Ultimo ajuste:{' '}
                {autoAdjustMeta?.toLevel
                  ? `${autoAdjustMeta.fromLevel} -> ${autoAdjustMeta.toLevel}`
                  : 'nenhum ajuste ainda'}
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'data' ? (
          <div style={{ maxWidth: 860 }}>
            <div className="card mb-lg">
              <h3 className="settings-section-title">Uso local e progresso</h3>
              <div style={{ fontSize: 13, color: 'var(--c-muted)', marginBottom: 10 }}>
                Uso: <strong style={{ color: 'var(--c-heading)' }}>{usageKB} KB</strong> de ~5000 KB
                ({usagePct}%)
              </div>
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar"
                  style={{
                    width: `${Math.min(usagePct, 100)}%`,
                    background: usagePct > 80 ? 'var(--c-error)' : undefined,
                  }}
                />
              </div>

              <div className="stat-row mt-lg">
                <div className="stat-card">
                  <div className="stat-val">{level}</div>
                  <div className="stat-label">Nivel</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{xp}</div>
                  <div className="stat-label">XP</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{streakStats.currentStreak}</div>
                  <div className="stat-label">Streak</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{flashcards.length}</div>
                  <div className="stat-label">Cards</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{achievements.length}</div>
                  <div className="stat-label">Conquistas</div>
                </div>
              </div>

              <div className="grid-2 mt-lg" style={{ gap: 16 }}>
                <div className="card">
                  <div className="section-label mb-sm">Colecoes</div>
                  <div className="flex flex-col gap-sm">
                    {[
                      ['Palavras lidas', totals.readerWords],
                      ['Exercicios builder', totals.builderExercises],
                      ['Cards salvos', totals.savedCards],
                      ['Revisoes', totals.flashcardReviews],
                    ].map(([label, value]) => (
                      <div key={label} className="settings-data-row">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="section-label mb-sm">Backup e reset</div>
                  <div className="flex gap-sm flex-wrap">
                    <button className="btn btn-outline btn-sm" onClick={exportBackup}>
                      Exportar backup
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Importar backup
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={handleResetProgress}>
                      Resetar gamificacao
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={importBackup}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
