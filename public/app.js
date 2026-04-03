import AppHeader from './components/AppHeader.js'
import SpecialStreams from './components/SpecialStreams.js'
import GameCard from './components/GameCard.js'
import GameTable from './components/GameTable.js'
import MultiviewPanel from './components/MultiviewPanel.js'
import ExportLinks from './components/ExportLinks.js'
import HighlightsModal from './components/HighlightsModal.js'
import LoginModal from './components/LoginModal.js'
import AdminPanel from './components/AdminPanel.js'
import FavoritesSelector from './components/FavoritesSelector.js'

const { createApp, reactive, watch, onMounted } = Vue

// Parse URL query params into state
function parseQueryParams() {
  const params = new URLSearchParams(window.location.search)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// Create reactive global state
const state = reactive({
  // Config from /api/config
  config: null,

  // Games data from /api/games
  gamesData: null,

  // Loading state
  loading: true,

  // Menu open state (persisted to sessionStorage)
  menuOpen: sessionStorage.getItem('menuOpen') === 'true',

  // Auth state
  username: null,
  role: null,
  showLogin: false,

  // Game listing state
  date: '',
  level: 'MLB',
  org: 'All',
  scores: 'Hide',
  mediaType: 'Video',
  scanMode: 'off',

  // View state
  currentView: 'games'
})

// Restore state from URL query params
function restoreState() {
  const params = parseQueryParams()
  if (params.date) state.date = params.date
  if (params.level) state.level = decodeURIComponent(params.level)
  if (params.org) state.org = decodeURIComponent(params.org)
  if (params.scores) state.scores = params.scores
  if (params.mediaType) state.mediaType = params.mediaType
}

// Sync state to URL
function syncURL() {
  if (!state.config) return
  const params = new URLSearchParams()

  if (state.date && state.date !== 'today') params.set('date', state.date)
  if (state.level !== 'MLB') params.set('level', state.level)
  if (state.org !== 'All') params.set('org', state.org)
  if (state.scores !== 'Hide') params.set('scores', state.scores)
  if (state.mediaType !== 'Video') params.set('mediaType', state.mediaType)

  const qs = params.toString()
  const newUrl = window.location.pathname + (qs ? '?' + qs : '')
  window.history.replaceState(null, '', newUrl)
}

// API calls
// Wrap fetch to strip credentials from URLs (fixes basic auth in URL breaking fetch)
const _origFetch = window.fetch
window.fetch = function(input, init) {
  if (typeof input === 'string' && input.startsWith('/')) {
    input = window.location.origin + input
  }
  return _origFetch.call(this, input, init)
}

async function fetchConfig() {
  try {
    const cp = state.config ? state.config.contentProtect : ''
    let url = '/api/config'
    if (cp) url += '?content_protect=' + cp
    const resp = await fetch(url)
    const data = await resp.json()
    state.config = data
    if (data.scanMode) state.scanMode = data.scanMode
  } catch (e) {
    console.error('Failed to fetch config:', e)
  }
}

async function fetchGames() {
  if (!state.config) return
  state.loading = true
  try {
    let url = '/api/games?'
    const params = new URLSearchParams()
    if (state.date) params.set('date', state.date)
    if (state.level !== 'MLB') params.set('level', state.level)
    if (state.org !== 'All') params.set('org', state.org)
    if (state.config.contentProtect) params.set('content_protect', state.config.contentProtect)
    url += params.toString()
    const resp = await fetch(url)
    state.gamesData = await resp.json()
  } catch (e) {
    console.error('Failed to fetch games:', e)
  } finally {
    state.loading = false
  }
}

// User preference fields that get saved/loaded per-user
const PREF_KEYS = ['favTeams', 'scores', 'mediaType', 'resolution', 'audioTrack', 'captions', 'skip', 'skipAdjust', 'pad']

async function fetchUserPreferences() {
  if (!state.username) return
  try {
    const resp = await fetch('/api/user/preferences')
    if (resp.ok) {
      const prefs = await resp.json()
      const urlParams = parseQueryParams()
      for (const key of PREF_KEYS) {
        if (prefs[key] !== undefined && !urlParams[key] && !urlParams[key.toLowerCase()]) {
          if (state[key] !== undefined) state[key] = prefs[key]
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch preferences:', e)
  }
}

var savePrefsTimer = null
function saveUserPreferences() {
  if (!state.username) return
  clearTimeout(savePrefsTimer)
  savePrefsTimer = setTimeout(async function() {
    try {
      const prefs = {}
      for (const key of PREF_KEYS) {
        if (state[key] !== undefined) prefs[key] = state[key]
      }
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      })
    } catch (e) {
      console.error('Failed to save preferences:', e)
    }
  }, 1000)
}

// Actions provided to components
const actions = {
  setFilter(key, value) {
    state[key] = value
    if (['date', 'level', 'org'].includes(key)) {
      fetchGames()
    }
    syncURL()
    saveUserPreferences()
  },

  getContentProtectParam(prefix) {
    if (state.config && state.config.contentProtect) {
      return prefix + 'content_protect=' + state.config.contentProtect
    }
    return ''
  },

  async onAuthSuccess() {
    await fetchConfig()
    await fetchUserPreferences()
    await fetchGames()
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {}
    state.username = null
    state.role = null
    await fetchConfig()
    await fetchGames()
  }
}

// Initialize the app
restoreState()

const app = createApp({
  setup() {
    onMounted(async () => {
      await fetchConfig()
      if (state.config) {
        state.username = state.config.username || null
        state.role = state.config.role || null
      }
      restoreState()
      await fetchUserPreferences()
      await fetchGames()
      setInterval(fetchGames, 2 * 60 * 1000)
    })
    return { state }
  }
})

// Provide state and actions globally
app.provide('state', state)
app.provide('actions', actions)

// Register components
app.component('app-header', AppHeader)
app.component('special-streams', SpecialStreams)
app.component('game-card', GameCard)
app.component('game-table', GameTable)
app.component('multiview-panel', MultiviewPanel)
app.component('export-links', ExportLinks)
app.component('highlights-modal', HighlightsModal)
app.component('login-modal', LoginModal)
app.component('admin-panel', AdminPanel)
app.component('favorites-selector', FavoritesSelector)

app.mount('#app')
