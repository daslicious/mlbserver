import AppHeader from './components/AppHeader.js'
import FilterBar from './components/FilterBar.js'
import VideoOptions from './components/VideoOptions.js'
import SpecialStreams from './components/SpecialStreams.js'
import GameCard from './components/GameCard.js'
import GameTable from './components/GameTable.js'
import MultiviewPanel from './components/MultiviewPanel.js'
import ExportLinks from './components/ExportLinks.js'
import HighlightsModal from './components/HighlightsModal.js'

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

  // Filter state
  date: '',
  level: 'MLB',
  org: 'All',
  mediaType: 'Video',
  linkType: 'Embed',
  startFrom: 'Beginning',
  controls: 'Show',
  scores: 'Hide',
  resolution: 'adaptive',
  audioTrack: 'all',
  captions: 'disabled',
  forceVod: 'off',
  inningHalf: '',
  inningNumber: '',
  skip: 'off',
  skipAdjust: 0,
  pad: 'off',
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
  if (params.mediaType) state.mediaType = params.mediaType
  if (params.linkType) state.linkType = params.linkType
  if (params.startFrom) state.startFrom = params.startFrom
  if (params.controls) state.controls = params.controls
  if (params.scores) state.scores = params.scores
  if (params.resolution) state.resolution = params.resolution
  if (params.audio_track) state.audioTrack = params.audio_track
  if (params.captions) state.captions = params.captions
  if (params.force_vod) state.forceVod = params.force_vod
  if (params.inning_half) state.inningHalf = params.inning_half
  if (params.inning_number) state.inningNumber = params.inning_number
  if (params.skip) state.skip = params.skip
  if (params.skip_adjust) state.skipAdjust = params.skip_adjust
  if (params.pad) state.pad = params.pad
  if (params.scan_mode) state.scanMode = params.scan_mode
}

// Sync state to URL
function syncURL() {
  if (!state.config) return
  const cfg = state.config
  const d = cfg.validOptions
  const params = new URLSearchParams()

  if (state.date && state.date !== 'today') params.set('date', state.date)
  if (state.level !== 'MLB') params.set('level', state.level)
  if (state.org !== 'All') params.set('org', state.org)
  if (state.mediaType !== d.mediaTypes[0]) params.set('mediaType', state.mediaType)
  if (state.linkType !== d.linkTypes[0]) params.set('linkType', state.linkType)
  if (state.linkType === 'Embed') {
    if (state.startFrom !== d.startFrom[0]) params.set('startFrom', state.startFrom)
    if (state.controls !== d.controls[0]) params.set('controls', state.controls)
  }
  if (state.scores !== d.scores[0]) params.set('scores', state.scores)
  if (state.mediaType === 'Video') {
    if (state.resolution !== d.resolutions[0]) params.set('resolution', state.resolution)
    if (state.audioTrack !== d.audioTracks[0]) params.set('audio_track', state.audioTrack)
    if (state.captions !== d.captions[0]) params.set('captions', state.captions)
    if (state.inningHalf) params.set('inning_half', state.inningHalf)
    if (state.inningNumber) params.set('inning_number', state.inningNumber)
    if (state.skip !== d.skip[0]) {
      params.set('skip', state.skip)
      if (state.skipAdjust != cfg.defaults.skipAdjust) params.set('skip_adjust', state.skipAdjust)
    }
  }
  if (state.pad !== d.pad[0]) params.set('pad', state.pad)
  if (state.linkType === 'Stream' && state.forceVod !== d.forceVod[0]) params.set('force_vod', state.forceVod)

  const qs = params.toString()
  const newUrl = window.location.pathname + (qs ? '?' + qs : '')
  window.history.replaceState(null, '', newUrl)
}

// API calls
async function fetchConfig() {
  try {
    const cp = state.config ? state.config.contentProtect : ''
    let url = '/api/config'
    if (cp) url += '?content_protect=' + cp
    const resp = await fetch(url)
    const data = await resp.json()
    state.config = data
    // Apply config defaults to state
    if (data.linkType) state.linkType = state.linkType || data.linkType
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

// Actions provided to components
const actions = {
  setFilter(key, value) {
    state[key] = value
    // Filters that trigger a data refetch
    if (['date', 'level', 'org'].includes(key)) {
      fetchGames()
    }
    syncURL()
  },

  getLinkPath() {
    const lt = state.linkType
    if (lt === 'Embed') return 'app/player.html'
    if (lt === 'Stream') return 'stream.m3u8'
    if (lt === 'Download') return 'download.ts'
    return lt.toLowerCase() + '.html'
  },

  getContentProtectParam(prefix) {
    if (state.config && state.config.contentProtect) {
      return prefix + 'content_protect=' + state.config.contentProtect
    }
    return ''
  }
}

// Initialize the app
restoreState()

const app = createApp({
  setup() {
    onMounted(async () => {
      await fetchConfig()
      restoreState() // Re-apply after config loads
      await fetchGames()
    })
    return { state }
  }
})

// Provide state and actions globally
app.provide('state', state)
app.provide('actions', actions)

// Register components
app.component('app-header', AppHeader)
app.component('filter-bar', FilterBar)
app.component('video-options', VideoOptions)
app.component('special-streams', SpecialStreams)
app.component('game-card', GameCard)
app.component('game-table', GameTable)
app.component('multiview-panel', MultiviewPanel)
app.component('export-links', ExportLinks)
app.component('highlights-modal', HighlightsModal)

app.mount('#app')
