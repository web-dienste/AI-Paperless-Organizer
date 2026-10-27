import { useState, useEffect } from 'react'
import { Save, Check, X, Eye, EyeOff, TestTube, Loader2, ChevronDown, ChevronUp, Cpu, Lock, Bug, Trash2, Ban, Key, Copy, Power, Code2 } from 'lucide-react'
import clsx from 'clsx'
import * as api from '../services/api'
import { tr, locale } from '../i18n'

interface LLMProvider {
  id: number
  name: string
  display_name: string
  api_key: string
  api_base_url: string
  model: string
  classifier_model: string
  vision_model: string
  is_active: boolean
  is_configured: boolean
}

export default function SettingsPanel() {
  // Paperless Settings
  const [paperlessUrl, setPaperlessUrl] = useState('')
  const [paperlessToken, setPaperlessToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [paperlessSaving, setPaperlessSaving] = useState(false)
  const [paperlessTestResult, setPaperlessTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // LLM Providers
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)
  const [llmTestResult, setLlmTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [testingLLM, setTestingLLM] = useState(false)
  
  // Provider edit states
  const [editingProvider, setEditingProvider] = useState<{[key: string]: LLMProvider}>({})
  const [savingProvider, setSavingProvider] = useState<string | null>(null)
  
  
  // Ollama installed models (fetched from Ollama API)
  const [ollamaInstalledModels, setOllamaInstalledModels] = useState<string[]>([])
  const [ollamaModelsLoading, setOllamaModelsLoading] = useState(false)
  
  // App Settings
  const [appSettings, setAppSettings] = useState({
    password_enabled: false,
    password_set: false,
    show_debug_menu: false,
    sidebar_compact: false,
    classifier_provider: 'ollama',
  })
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savingAppSettings, setSavingAppSettings] = useState(false)
  const [appSettingsSaved, setAppSettingsSaved] = useState(false)
  
  // Ignored Items
  const [ignoredItems, setIgnoredItems] = useState<api.IgnoredItem[]>([])
  const [loadingIgnored, setLoadingIgnored] = useState(false)
  const [removingIgnored, setRemovingIgnored] = useState<number | null>(null)

  // API Keys
  const [apiKeys, setApiKeys] = useState<api.ApiKeyInfo[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [deletingKeyId, setDeletingKeyId] = useState<number | null>(null)

  useEffect(() => {
    loadSettings()
    loadAppSettings()
    loadIgnoredItems()
    loadApiKeys()
  }, [])
  
  const loadIgnoredItems = async () => {
    setLoadingIgnored(true)
    try {
      const items = await api.getIgnoredItems()
      setIgnoredItems(items)
    } catch (e) {
      console.error('Failed to load ignored items:', e)
    } finally {
      setLoadingIgnored(false)
    }
  }
  
  const handleRemoveIgnored = async (id: number) => {
    setRemovingIgnored(id)
    try {
      await api.removeIgnoredItem(id)
      setIgnoredItems(ignoredItems.filter(item => item.id !== id))
    } catch (e) {
      console.error('Failed to remove ignored item:', e)
    } finally {
      setRemovingIgnored(null)
    }
  }

  const loadApiKeys = async () => {
    try {
      const keys = await api.listApiKeys()
      setApiKeys(keys)
    } catch (e) {
      console.error('Failed to load API keys:', e)
    }
  }

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return
    setGeneratingKey(true)
    try {
      const result = await api.generateApiKey(newKeyName.trim())
      setGeneratedKey(result.key)
      setNewKeyName('')
      loadApiKeys()
    } catch (e) {
      console.error('Failed to generate key:', e)
    } finally {
      setGeneratingKey(false)
    }
  }

  const handleDeleteKey = async (id: number) => {
    setDeletingKeyId(id)
    try {
      await api.deleteApiKey(id)
      loadApiKeys()
    } catch (e) {
      console.error('Failed to delete key:', e)
    } finally {
      setDeletingKeyId(null)
    }
  }

  const handleToggleKey = async (id: number) => {
    try {
      await api.toggleApiKey(id)
      loadApiKeys()
    } catch (e) {
      console.error('Failed to toggle key:', e)
    }
  }

  const loadOllamaInstalledModels = async () => {
    setOllamaModelsLoading(true)
    try {
      const res = await api.getClassifierOllamaModels()
      if (res.connected && res.installed) {
        setOllamaInstalledModels(res.installed.map((m: any) => m.name))
      }
    } catch (e) {
      console.error('Failed to load Ollama models:', e)
    } finally {
      setOllamaModelsLoading(false)
    }
  }

  const loadAppSettings = async () => {
    try {
      const settings = await api.getAppSettings()
      setAppSettings(settings)
    } catch (e) {
      console.error('Error loading app settings:', e)
    }
  }

  const saveAppSettings = async (updates: Partial<typeof appSettings> & { password?: string }) => {
    setSavingAppSettings(true)
    try {
      await api.updateAppSettings(updates)
      await loadAppSettings()
      setAppSettingsSaved(true)
      setTimeout(() => setAppSettingsSaved(false), 2000)
      // Reload page to apply changes (like debug menu toggle)
      if (updates.show_debug_menu !== undefined) {
        window.location.reload()
      }
    } catch (e) {
      console.error('Error saving app settings:', e)
    } finally {
      setSavingAppSettings(false)
    }
  }

  const handleSetPassword = async () => {
    if (!newPassword) return
    await saveAppSettings({ password: newPassword, password_enabled: true })
    setNewPassword('')
  }

  const handleRemovePassword = async () => {
    await api.removePassword()
    await loadAppSettings()
    localStorage.removeItem('app_authenticated')
  }

  const loadSettings = async () => {
    try {
      const [paperlessSettings, llmProviders] = await Promise.all([
        api.getPaperlessSettings(),
        api.getLLMProviders()
      ])

      setPaperlessUrl(paperlessSettings.url)
      setPaperlessToken(paperlessSettings.api_token)
      setProviders(llmProviders)
      
      // Initialize edit states
      const editStates: {[key: string]: LLMProvider} = {}
      llmProviders.forEach((p: LLMProvider) => {
        editStates[p.name] = { ...p }
      })
      setEditingProvider(editStates)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const savePaperlessSettings = async () => {
    setPaperlessSaving(true)
    setPaperlessTestResult(null)
    try {
      await api.savePaperlessSettings({ url: paperlessUrl, api_token: paperlessToken })
      
      // Run detailed test via debug endpoint
      const testRes = await fetch('/api/debug/paperless-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: paperlessUrl, token: paperlessToken })
      })
      const testResult = await testRes.json()
      
      if (testResult.success && testResult.is_paperless) {
        setPaperlessTestResult({ 
          success: true, 
          message: tr("Verbindung erfolgreich! API gefunden: {url}", { url: testResult.working_url })
        })
      } else {
        // Fallback to simple status check
        const status = await api.getPaperlessStatus()
        if (status.connected) {
          setPaperlessTestResult({ success: true, message: tr("Verbindung erfolgreich!") })
        } else {
          setPaperlessTestResult({ 
            success: false, 
            message: testResult.message || status.error || tr("Verbindung fehlgeschlagen")
          })
        }
      }
    } catch (error) {
      setPaperlessTestResult({ success: false, message: tr("Fehler beim Speichern") })
    } finally {
      setPaperlessSaving(false)
    }
  }

  const saveProvider = async (providerName: string) => {
    const editState = editingProvider[providerName]
    if (!editState) return
    
    const provider = providers.find(p => p.name === providerName)
    if (!provider) return

    setSavingProvider(providerName)
    try {
      await api.updateLLMProvider(provider.id, {
        name: editState.name,
        display_name: editState.display_name,
        api_key: editState.api_key,
        api_base_url: editState.api_base_url,
        model: editState.model,
        classifier_model: editState.classifier_model || '',
        vision_model: editState.vision_model || '',
        is_active: editState.is_active
      })
      
      // Reload providers
      const newProviders = await api.getLLMProviders()
      setProviders(newProviders)
      
      // Update edit states
      const editStates: {[key: string]: LLMProvider} = {}
      newProviders.forEach((p: LLMProvider) => {
        editStates[p.name] = { ...p }
      })
      setEditingProvider(editStates)
    } catch (error) {
      console.error('Error updating provider:', error)
    } finally {
      setSavingProvider(null)
    }
  }

  const activateProvider = async (providerName: string) => {
    const provider = providers.find(p => p.name === providerName)
    if (!provider) return

    setSavingProvider(providerName)
    try {
      await api.updateLLMProvider(provider.id, {
        name: provider.name,
        display_name: provider.display_name,
        api_key: editingProvider[providerName]?.api_key || provider.api_key,
        api_base_url: editingProvider[providerName]?.api_base_url || provider.api_base_url,
        model: editingProvider[providerName]?.model || provider.model,
        classifier_model: editingProvider[providerName]?.classifier_model || provider.classifier_model || '',
        vision_model: editingProvider[providerName]?.vision_model || provider.vision_model || '',
        is_active: true
      })
      
      const newProviders = await api.getLLMProviders()
      setProviders(newProviders)
      
      const editStates: {[key: string]: LLMProvider} = {}
      newProviders.forEach((p: LLMProvider) => {
        editStates[p.name] = { ...p }
      })
      setEditingProvider(editStates)
    } catch (error) {
      console.error('Error activating provider:', error)
    } finally {
      setSavingProvider(null)
    }
  }

  const updateEditState = (providerName: string, field: keyof LLMProvider, value: string | boolean) => {
    setEditingProvider(prev => ({
      ...prev,
      [providerName]: {
        ...prev[providerName],
        [field]: value
      }
    }))
  }

  const testLLM = async () => {
    setTestingLLM(true)
    setLlmTestResult(null)
    try {
      const result = await api.testLLMConnection()
      if (result.success) {
        setLlmTestResult({ success: true, message: tr("Verbunden mit {provider} ({model})", { provider: result.provider, model: result.model }) })
      } else {
        setLlmTestResult({ success: false, message: result.error || tr("Test fehlgeschlagen") })
      }
    } catch (error) {
      setLlmTestResult({ success: false, message: tr("Verbindung fehlgeschlagen") })
    } finally {
      setTestingLLM(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Paperless Settings */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-xl text-surface-100 mb-6">{tr("Paperless-ngx Verbindung")}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">{tr("Paperless URL")}</label>
            <input
              type="url"
              value={paperlessUrl}
              onChange={(e) => setPaperlessUrl(e.target.value)}
              placeholder="https://paperless.example.com"
              className="input"
            />
            <p className="mt-1 text-xs text-surface-500">{tr("Tipp: Für lokales Paperless nutze ")}<code className="text-primary-400">{tr("http://host.docker.internal:PORT")}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">{tr("API Token")}</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={paperlessToken}
                onChange={(e) => setPaperlessToken(e.target.value)}
                placeholder={tr("Token aus Paperless Admin-Bereich")}
                className="input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
              >
                {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {paperlessTestResult && (
            <div className={clsx(
              'p-4 rounded-lg',
              paperlessTestResult.success 
                ? 'bg-emerald-500/10 border border-emerald-500/30'
                : 'bg-red-500/10 border border-red-500/30'
            )}>
              <div className="flex items-center gap-2">
                {paperlessTestResult.success ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
                <span className={paperlessTestResult.success ? 'text-emerald-400' : 'text-red-400'}>
                  {paperlessTestResult.success ? tr("Verbindung erfolgreich!") : tr("Verbindung fehlgeschlagen")}
                </span>
              </div>
              <p className="mt-2 text-sm text-surface-300">{paperlessTestResult.message}</p>
            </div>
          )}

          <button
            onClick={savePaperlessSettings}
            disabled={paperlessSaving}
            className="btn btn-primary flex items-center gap-2"
          >
            {paperlessSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}{tr("Speichern & Testen")}</button>
        </div>
      </div>

      {/* LLM Providers */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-semibold text-xl text-surface-100">{tr("LLM Provider")}</h2>
          <button
            onClick={testLLM}
            disabled={testingLLM}
            className="btn btn-secondary flex items-center gap-2"
          >
            {testingLLM ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}{tr("Aktiven Provider testen")}</button>
        </div>

        {llmTestResult && (
          <div className={clsx(
            'p-3 rounded-lg flex items-center gap-2 mb-4',
            llmTestResult.success 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          )}>
            {llmTestResult.success ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            {llmTestResult.message}
          </div>
        )}

        <div className="space-y-3">
          {providers.map((provider) => {
            const editState = editingProvider[provider.name] || provider
            const isExpanded = expandedProvider === provider.name
            
            return (
              <div
                key={provider.id}
                className={clsx(
                  'rounded-xl border transition-all duration-200',
                  provider.is_active 
                    ? 'bg-primary-500/10 border-primary-500/30' 
                    : 'bg-surface-800/50 border-surface-600/50'
                )}
              >
                {/* Provider Header */}
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedProvider(isExpanded ? null : provider.name)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-surface-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-400" />
                    )}
                    <span className="font-medium text-surface-100">
                      {provider.display_name}
                    </span>
                    {provider.is_active && (
                      <span className="badge badge-primary">{tr("Aktiv")}</span>
                    )}
                    {provider.is_configured && !provider.is_active && (
                      <span className="badge badge-success">{tr("Konfiguriert")}</span>
                    )}
                  </div>
                  {!provider.is_active && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        activateProvider(provider.name)
                      }}
                      disabled={savingProvider === provider.name}
                      className="btn btn-secondary text-sm"
                    >
                      {savingProvider === provider.name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        tr("Aktivieren")
                      )}
                    </button>
                  )}
                </div>

                {/* Provider Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-surface-600/50 space-y-4">
                    {/* API Key (not for Ollama) */}
                    {provider.name !== 'ollama' && (
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">{tr("API Key")}</label>
                        <input
                          type="password"
                          value={editState.api_key === '***' ? '' : editState.api_key}
                          onChange={(e) => updateEditState(provider.name, 'api_key', e.target.value)}
                          placeholder={provider.api_key ? '••••••••••••••••' : tr("API Key eingeben")}
                          className="input"
                        />
                        <p className="mt-1 text-xs text-surface-500">
                          {provider.name === 'openai' && tr("Hole deinen Key von platform.openai.com/api-keys")}
                          {provider.name === 'anthropic' && tr("Hole deinen Key von console.anthropic.com")}
                          {provider.name === 'azure' && tr("Azure Portal → Cognitive Services → Keys")}
                        </p>
                      </div>
                    )}

                    {/* Base URL (for Azure and Ollama) */}
                    {(provider.name === 'azure' || provider.name === 'ollama') && (
                      <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                          {provider.name === 'azure' ? tr("Azure Endpoint") : tr("Ollama URL")}
                        </label>
                        <input
                          type="url"
                          value={editState.api_base_url}
                          onChange={(e) => updateEditState(provider.name, 'api_base_url', e.target.value)}
                          placeholder={provider.name === 'azure' ? 'https://xxx.openai.azure.com' : 'http://host.docker.internal:11434'}
                          className="input"
                        />
                        {provider.name === 'ollama' && (
                          <p className="mt-1 text-xs text-surface-500">{tr("Für lokales Ollama: ")}<code className="text-primary-400">{tr("http://host.docker.internal:11434")}</code>
                          </p>
                        )}
                      </div>
                    )}

                    {/* === OLLAMA: Role-based model selection with live data === */}
                    {provider.name === 'ollama' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-medium text-surface-300">{tr("Modelle")}</label>
                          <button
                            onClick={loadOllamaInstalledModels}
                            disabled={ollamaModelsLoading}
                            className="btn text-xs flex items-center gap-1.5 bg-surface-700 hover:bg-surface-600 text-surface-300"
                          >
                            {ollamaModelsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cpu className="w-3 h-3" />}{tr("Installierte Modelle laden")}</button>
                        </div>

                        {/* Bereinigung Model */}
                        <div className="p-3 bg-surface-700/30 rounded-lg space-y-2">
                          <label className="block text-sm font-medium text-surface-200">{tr("Bereinigung-Modell")}</label>
                          <p className="text-xs text-surface-500">{tr("Fuer Metadaten-Bereinigung (Tags, Korrespondenten, Dokumententypen zusammenfuehren)")}</p>
                          {ollamaInstalledModels.length > 0 ? (
                            <select
                              value={editState.model}
                              onChange={(e) => updateEditState(provider.name, 'model', e.target.value)}
                              className="input"
                            >
                              {!ollamaInstalledModels.includes(editState.model) && editState.model && (
                                <option value={editState.model}>{editState.model}{tr(" (nicht gefunden)")}</option>
                              )}
                              {ollamaInstalledModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editState.model}
                              onChange={(e) => updateEditState(provider.name, 'model', e.target.value)}
                              placeholder={tr("z.B. llama3.1")}
                              className="input"
                            />
                          )}
                        </div>

                        {/* Klassifizierer Model */}
                        <div className="p-3 bg-surface-700/30 rounded-lg space-y-2">
                          <label className="block text-sm font-medium text-surface-200">{tr("Klassifizierer-Modell")}</label>
                          <p className="text-xs text-surface-500">{tr("Fuer Dokument-Klassifizierung (Tags, Typ, Korrespondent zuordnen)")}</p>
                          {ollamaInstalledModels.length > 0 ? (
                            <select
                              value={editState.classifier_model || ''}
                              onChange={(e) => updateEditState(provider.name, 'classifier_model', e.target.value)}
                              className="input"
                            >
                              <option value="">{tr("Gleich wie Bereinigung (")}{editState.model || '-'})</option>
                              {ollamaInstalledModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editState.classifier_model || ''}
                              onChange={(e) => updateEditState(provider.name, 'classifier_model', e.target.value)}
                              placeholder={editState.model || tr("Gleich wie Bereinigung")}
                              className="input"
                            />
                          )}
                        </div>

                        {/* Vision Model */}
                        <div className="p-3 bg-surface-700/30 rounded-lg space-y-2">
                          <label className="block text-sm font-medium text-surface-200">{tr("OCR Vision-Modell")}</label>
                          <p className="text-xs text-surface-500">{tr("Fuer Texterkennung mit Ollama Vision (wird in OCR-Einstellungen verwaltet)")}</p>
                          {ollamaInstalledModels.length > 0 ? (
                            <select
                              value={editState.vision_model || ''}
                              onChange={(e) => updateEditState(provider.name, 'vision_model', e.target.value)}
                              className="input"
                            >
                              <option value="">{tr("Nicht gesetzt")}</option>
                              {ollamaInstalledModels.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editState.vision_model || ''}
                              onChange={(e) => updateEditState(provider.name, 'vision_model', e.target.value)}
                              placeholder={tr("z.B. qwen3-vl:4b-instruct")}
                              className="input"
                            />
                          )}
                        </div>

                        {ollamaInstalledModels.length === 0 && !ollamaModelsLoading && (
                          <p className="text-xs text-surface-500">{tr("Klicke \"Installierte Modelle laden\" um Dropdowns zu sehen.")}</p>
                        )}
                      </div>
                    ) : provider.name === 'mistral-ocr' ? (
                      /* === MISTRAL OCR: Nur API-Key, kein Modell === */
                      <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg space-y-1">
                        <p className="text-xs text-orange-300 font-medium">{tr("Dedizierter OCR-Service")}</p>
                        <p className="text-xs text-surface-400">{tr("Mistral OCR ist ein eigener API-Service mit nur einem Modell (mistral-ocr-latest). Es wird nur ein API-Key benötigt — kein Modell auswählen. Wird ausschließlich für OCR genutzt (nicht für Klassifizierung/Bereinigung).")}</p>
                      </div>
                    ) : (
                      /* === CLOUD PROVIDERS: Simple text inputs === */
                      <>
                        <div className="p-3 bg-surface-700/30 rounded-lg space-y-2">
                          <label className="block text-sm font-medium text-surface-200">{tr("Bereinigung-Modell")}</label>
                          <p className="text-xs text-surface-500">{tr("Fuer Metadaten-Bereinigung (Tags, Korrespondenten, Dokumententypen zusammenfuehren)")}</p>
                          <input
                            type="text"
                            value={editState.model}
                            onChange={(e) => updateEditState(provider.name, 'model', e.target.value)}
                            placeholder={{
                              openai: 'z.B. gpt-4o, gpt-4o-mini',
                              anthropic: 'z.B. claude-sonnet-4-20250514',
                              azure: 'z.B. gpt-4',
                              mistral: 'z.B. mistral-small-latest',
                              openrouter: 'z.B. mistralai/mistral-small-2603',
                            }[provider.name] || tr("Modellname eingeben")}
                            className="input"
                          />
                        </div>

                        <div className="p-3 bg-surface-700/30 rounded-lg space-y-2">
                          <label className="block text-sm font-medium text-surface-200">{tr("Klassifizierer-Modell ")}<span className="text-surface-500 font-normal">{tr("(optional)")}</span></label>
                          <p className="text-xs text-surface-500">{tr("Eigenes Modell fuer Dokument-Klassifizierung (leer = Bereinigung-Modell wird verwendet)")}</p>
                          <input
                            type="text"
                            value={editState.classifier_model || ''}
                            onChange={(e) => updateEditState(provider.name, 'classifier_model', e.target.value)}
                            placeholder={editState.model ? tr("Gleich wie {model}", { model: editState.model }) : tr("Gleich wie Bereinigung-Modell")}
                            className="input"
                          />
                        </div>
                      </>
                    )}

                    {/* Save Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => saveProvider(provider.name)}
                        disabled={savingProvider === provider.name}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        {savingProvider === provider.name ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}{tr("Speichern")}</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Job-Zuweisung */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary-400" />{tr("Job-Zuweisung")}</h2>
        <p className="text-sm text-surface-400 mb-4">{tr("Welcher Provider wird fuer welchen Job verwendet?")}</p>
        <div className="space-y-4">
          {/* Bereinigung */}
          <div className="flex items-center justify-between p-3 bg-surface-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-surface-200">{tr("Metadaten-Bereinigung")}</p>
              <p className="text-xs text-surface-500">{tr("Tags, Korrespondenten, Dokumententypen aufraeumen")}</p>
            </div>
            <select
              value={providers.find(p => p.is_active)?.name || ''}
              onChange={async (e) => {
                const selectedName = e.target.value
                const selectedProvider = providers.find(p => p.name === selectedName)
                if (!selectedProvider) return
                const edit = editingProvider[selectedName]
                await api.updateLLMProvider(selectedProvider.id, {
                  name: selectedProvider.name,
                  display_name: selectedProvider.display_name,
                  api_key: edit?.api_key || selectedProvider.api_key,
                  api_base_url: edit?.api_base_url || selectedProvider.api_base_url,
                  model: edit?.model || selectedProvider.model,
                  classifier_model: edit?.classifier_model || selectedProvider.classifier_model || '',
                  vision_model: edit?.vision_model || selectedProvider.vision_model || '',
                  is_active: true
                })
                const newProviders = await api.getLLMProviders()
                setProviders(newProviders)
                const editStates: {[key: string]: LLMProvider} = {}
                newProviders.forEach((p: LLMProvider) => { editStates[p.name] = { ...p } })
                setEditingProvider(editStates)
              }}
              className="input w-48 text-sm"
            >
              {providers.filter(p => (p.is_configured || p.name === 'ollama') && p.name !== 'mistral-ocr').map(p => (
                <option key={p.name} value={p.name}>{p.display_name}</option>
              ))}
            </select>
          </div>

          {/* Klassifizierer */}
          <div className="flex items-center justify-between p-3 bg-surface-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-surface-200">{tr("Dokument-Klassifizierer")}</p>
              <p className="text-xs text-surface-500">{tr("Tags, Typ, Korrespondent, Speicherpfad zuordnen")}</p>
            </div>
            <select
              value={appSettings.classifier_provider}
              onChange={async (e) => {
                const val = e.target.value
                setAppSettings(prev => ({ ...prev, classifier_provider: val }))
                await api.updateAppSettings({ classifier_provider: val })
              }}
              className="input w-48 text-sm"
            >
              {providers.filter(p => p.name !== 'mistral-ocr').map(p => (
                <option key={p.name} value={p.name}>{p.display_name}</option>
              ))}
            </select>
          </div>

          {/* Benchmark */}
          <div className="flex items-center justify-between p-3 bg-surface-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-surface-200">{tr("Benchmark")}</p>
              <p className="text-xs text-surface-500">{tr("Mehrere Provider gleichzeitig testen")}</p>
            </div>
            <div className="text-sm text-surface-400">{tr("Freie Auswahl im Klassifizierer")}</div>
          </div>

          {/* OCR */}
          <div className="flex items-center justify-between p-3 bg-surface-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-surface-200">{tr("OCR Vision")}</p>
              <p className="text-xs text-surface-500">{tr("Texterkennung mit Ollama Vision-Modellen")}</p>
            </div>
            <div className="text-sm text-surface-400">{tr("Ollama (eigene OCR-Einstellungen)")}</div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-lg text-surface-100 mb-6 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary-400" />{tr("App-Einstellungen")}</h2>

        <div className="space-y-6">
          {/* Password Protection */}
          <div className="p-4 rounded-lg bg-surface-800/50 border border-surface-700">
            <h3 className="font-medium text-surface-100 mb-3">{tr("Passwort-Schutz")}</h3>
            <p className="text-sm text-surface-400 mb-4">{tr("Schütze die gesamte Anwendung mit einem Passwort. Ohne Passwort ist kein Zugriff möglich!")}</p>
            
            {appSettings.password_set ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>{tr("Passwort ist gesetzt")}</span>
                </div>
                <button
                  onClick={handleRemovePassword}
                  className="btn btn-danger btn-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />{tr("Entfernen")}</button>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={tr("Neues Passwort")}
                    className="input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSetPassword}
                  disabled={!newPassword || savingAppSettings}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />{tr("Setzen")}</button>
              </div>
            )}
          </div>

          {/* Debug Menu Toggle */}
          <div className="p-4 rounded-lg bg-surface-800/50 border border-surface-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-surface-100 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-surface-400" />{tr("Debug-Menü in Sidebar")}</h3>
                <p className="text-sm text-surface-400 mt-1">{tr("Zeigt Netzwerk-Diagnose-Tools in der Navigation")}</p>
              </div>
              <button
                onClick={() => saveAppSettings({ show_debug_menu: !appSettings.show_debug_menu })}
                className={clsx(
                  'relative w-12 h-6 rounded-full transition-colors',
                  appSettings.show_debug_menu ? 'bg-primary-500' : 'bg-surface-600'
                )}
              >
                <span className={clsx(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                  appSettings.show_debug_menu ? 'left-7' : 'left-1'
                )} />
              </button>
            </div>
          </div>

          {/* Save Confirmation */}
          {appSettingsSaved && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <Check className="w-4 h-4" />{tr("Einstellungen gespeichert")}</div>
          )}
        </div>
      </div>
      
      {/* Ignored Items */}
      <div className="card p-6">
        <h2 className="font-display font-semibold text-lg text-surface-100 mb-6 flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-400" />{tr("Ignorierte Einträge")}{ignoredItems.length > 0 && (
            <span className="text-sm font-normal text-surface-400">({ignoredItems.length})</span>
          )}
        </h2>
        
        <p className="text-sm text-surface-400 mb-4">{tr("Diese Einträge werden bei KI-Analysen nicht mehr vorgeschlagen. Du kannst sie hier wieder aktivieren.")}</p>
        
        {loadingIgnored ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
          </div>
        ) : ignoredItems.length === 0 ? (
          <div className="text-center py-8 text-surface-500">{tr("Keine ignorierten Einträge vorhanden.")}</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {ignoredItems.map(item => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-surface-800/50 border border-surface-700"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-surface-200">{item.item_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-700 text-surface-400">
                      {item.entity_type === 'tag' ? tr("Tag") : 
                       item.entity_type === 'correspondent' ? tr("Korrespondent") : tr("Dokumententyp")}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface-700 text-surface-400">
                      {item.analysis_type === 'nonsense' ? tr("Unsinnig") :
                       item.analysis_type === 'correspondent_match' ? tr("Korrespondent-Match") :
                       item.analysis_type === 'doctype_match' ? tr("Dokumententyp-Match") : tr("Ähnlich")}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 mt-1">{tr("Ignoriert am ")}{new Date(item.created_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveIgnored(item.id)}
                  disabled={removingIgnored === item.id}
                  className="p-2 rounded text-surface-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title={tr("Wieder aktivieren")}
                >
                  {removingIgnored === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Externe API */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Code2 className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl font-semibold text-surface-100">{tr("Externe API (RAG Chat)")}</h2>
        </div>

        <p className="text-sm text-surface-400 mb-4">{tr("Binde den Dokumenten-Chat in deine eigene Software ein. Generiere einen API-Key und nutze die REST-API, um per Chat Dokumente zu finden und Fragen zu beantworten.")}</p>

        {/* API Key generieren */}
        <div className="border border-surface-600 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-surface-200 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-primary-400" />{tr("API-Keys verwalten")}</h3>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateKey()}
              placeholder={tr("Name fuer den Key (z.B. 'Mein ERP-System')")}
              className="flex-1 px-3 py-2 bg-surface-700 border border-surface-600 rounded-lg text-sm text-surface-100 placeholder-surface-500"
            />
            <button
              onClick={handleGenerateKey}
              disabled={!newKeyName.trim() || generatingKey}
              className="btn btn-primary flex items-center gap-2"
            >
              {generatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}{tr("Key generieren")}</button>
          </div>

          {generatedKey && (
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-3">
              <div className="text-sm font-medium text-green-300 mb-1">{tr("Neuer API-Key erstellt:")}</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-surface-800 px-3 py-2 rounded border border-green-700 text-sm font-mono text-green-300 break-all">
                  {generatedKey}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(generatedKey); }}
                  className="p-2 text-green-400 hover:bg-green-900/50 rounded"
                  title={tr("Kopieren")}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-green-400 mt-1">{tr("Speichere diesen Key jetzt! Er wird nicht erneut angezeigt.")}</p>
            </div>
          )}

          {apiKeys.length > 0 && (
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between bg-surface-700/50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Key className={clsx('w-4 h-4', k.is_active ? 'text-green-400' : 'text-surface-500')} />
                    <div>
                      <div className="text-sm font-medium text-surface-100">{k.name}</div>
                      <div className="text-xs text-surface-400">
                        {k.key_prefix}{tr("... | Erstellt: ")}{k.created_at ? new Date(k.created_at).toLocaleDateString(locale) : '-'}
                        {k.last_used_at && <>{tr(" | Zuletzt: ")}{new Date(k.last_used_at).toLocaleDateString(locale)}</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleKey(k.id)}
                      className={clsx('p-1.5 rounded', k.is_active ? 'text-green-400 hover:bg-surface-600' : 'text-surface-500 hover:bg-surface-600')}
                      title={k.is_active ? tr("Deaktivieren") : tr("Aktivieren")}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      disabled={deletingKeyId === k.id}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-surface-600 rounded"
                      title={tr("Loeschen")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API Dokumentation */}
        <div className="border border-surface-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-surface-200 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary-400" />{tr("API-Dokumentation")}</h3>
            <a
              href="/docs"
              target="_blank"
              rel="noopener"
              className="btn btn-primary flex items-center gap-2 text-sm"
            >
              <TestTube className="w-4 h-4" />{tr("Swagger UI oeffnen")}</a>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-surface-100 mb-1">{tr("Was kann die API?")}</h4>
              <ul className="list-disc list-inside text-surface-400 space-y-1">
                <li><strong className="text-surface-200">{tr("Chat")}</strong>{tr(" - Stelle Fragen zu deinen Dokumenten, die KI antwortet mit Quellenangaben")}</li>
                <li><strong className="text-surface-200">{tr("Suche")}</strong>{tr(" - Semantische Dokumentensuche (findet Bedeutung, nicht nur Stichworte)")}</li>
                <li><strong className="text-surface-200">{tr("Sessions")}</strong>{tr(" - Chat-Verlaeufe werden gespeichert und koennen abgerufen werden")}</li>
                <li><strong className="text-surface-200">{tr("Transaktions-Match")}</strong>{tr(" - Bank-/PayPal-Buchung an Paperless-Beleg matchen (für EÜR/Buchhaltung)")}</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-surface-100 mb-1">{tr("Authentifizierung")}</h4>
              <p className="text-surface-400 mb-2">{tr("Sende den API-Key als Bearer-Token im Authorization-Header:")}</p>
              <pre className="bg-surface-900 text-green-400 rounded-lg p-3 overflow-x-auto text-xs">
{tr("Authorization: Bearer po_dein_api_key_hier")}</pre>
            </div>

            <div>
              <h4 className="font-medium text-surface-100 mb-1">{tr("Chat-Endpunkt (SSE Streaming)")}</h4>
              <pre className="bg-surface-900 text-green-400 rounded-lg p-3 overflow-x-auto text-xs">
{tr("POST /api/rag/chat\nContent-Type: application/json\nAuthorization: Bearer po_dein_api_key\n\n{\n  \"question\": \"Welche Rechnungen habe ich von Vodafone?\",\n  \"session_id\": null,\n  \"filters\": {\n    \"correspondent_id\": null,\n    \"document_type_id\": null,\n    \"tags\": null\n  }\n}")}</pre>
              <p className="text-surface-500 mt-1">{tr("Antwort: Server-Sent Events (SSE) mit Token-Stream und Quellenangaben.")}</p>
            </div>

            <div>
              <h4 className="font-medium text-surface-100 mb-1">{tr("Such-Endpunkt")}</h4>
              <pre className="bg-surface-900 text-green-400 rounded-lg p-3 overflow-x-auto text-xs">
{tr("POST /api/rag/search\nContent-Type: application/json\nAuthorization: Bearer po_dein_api_key\n\n{\n  \"query\": \"Mietvertrag\",\n  \"limit\": 5\n}")}</pre>
              <p className="text-surface-500 mt-1">{tr("Antwort: JSON mit relevanten Dokumenten, Scores und Snippets.")}</p>
            </div>

            <div>
              <h4 className="font-medium text-surface-100 mb-1">{tr("Transaktions-Match (für EÜR/Buchhaltung)")}</h4>
              <p className="text-surface-400 mb-2 text-xs">{tr("Matcht eine Bank-/PayPal-Buchung gegen deine Paperless-Dokumente per Score-System (Rechnungsnummer, Betrag, IBAN, Datum, Kundenname, Volltext). Gibt Top 3 Treffer mit Score 0-100% zurück.")}</p>
              <pre className="bg-surface-900 text-green-400 rounded-lg p-3 overflow-x-auto text-xs">
{tr("POST /api/match/transaction\nContent-Type: application/json\nAuthorization: Bearer po_dein_api_key\n\n{\n  \"transaction\": {\n    \"amount\": 41.22,\n    \"date\": \"2025-11-10\",\n    \"description\": \"Domain renewal\",\n    \"customer\": \"TLD Registrar Ltd\",\n    \"iban\": \"DE...\",\n    \"bookingNumber\": \"WEB-2025-0058\",\n    \"paypalTransactionId\": \"1048329975057\"\n  },\n  \"options\": {\n    \"dateWindowDays\": 7,\n    \"amountToleranceEur\": 0.5,\n    \"amountTolerancePercent\": 0,\n    \"fuzzyThreshold\": 75,\n    \"limit\": 3\n  }\n}")}</pre>
              <p className="text-surface-500 mt-1 text-xs">{tr("Antwort: ")}<code className="text-surface-300">{tr("matches[]")}</code>{tr(" mit")}{' '}<code className="text-surface-300">{tr("documentId")}</code>, <code className="text-surface-300">{tr("score")}</code>,
                {' '}<code className="text-surface-300">{tr("confidence")}</code>{tr(" (high/medium/low),")}{' '}<code className="text-surface-300">{tr("matchedOn[]")}</code>{tr(" (welches Feld welches Gewicht beisteuerte).")}</p>
            </div>

            <div>
              <h4 className="font-medium text-surface-100 mb-1">{tr("Weitere Endpunkte")}</h4>
              <div className="bg-surface-700/50 rounded-lg p-3 space-y-1 text-xs font-mono text-surface-200">
                <div><span className="text-blue-400">{tr("GET")}</span>{tr(" /api/rag/sessions - Alle Chat-Sessions auflisten")}</div>
                <div><span className="text-blue-400">{tr("GET")}</span>{tr(" /api/rag/sessions/:id - Einzelne Session mit Nachrichten")}</div>
                <div><span className="text-red-400">{tr("DELETE")}</span>{tr(" /api/rag/sessions/:id - Session loeschen")}</div>
                <div><span className="text-green-400">{tr("POST")}</span>{tr(" /api/rag/index/start - Indexierung starten")}</div>
                <div><span className="text-blue-400">{tr("GET")}</span>{tr(" /api/rag/index/status - Indexierungsstatus")}</div>
                <div><span className="text-blue-400">{tr("GET")}</span>{tr(" /api/rag/config - RAG-Konfiguration")}</div>
                <div><span className="text-blue-400">{tr("GET")}</span>{tr(" /api/match/health - Health-Check Match-API")}</div>
                <div><span className="text-blue-400">{tr("GET")}</span>{tr(" /api/match/log - Letzte 30 Match-Anfragen")}</div>
              </div>
            </div>

            <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-3">
              <p className="text-primary-300 text-xs">
                <strong>{tr("Tipp:")}</strong>{tr(" In der Swagger UI kannst du alle Endpunkte direkt im Browser testen. Klicke auf einen Endpunkt, dann auf \"Try it out\", fuege deinen API-Key ein und sende die Anfrage.")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
