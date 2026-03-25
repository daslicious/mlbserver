export default {
  name: 'HighlightsModal',
  inject: ['state', 'actions'],
  props: {
    gamePk: { type: String, default: '' },
    gameDate: { type: String, default: '' },
    visible: { type: Boolean, default: false }
  },
  emits: ['close'],
  template: `
    <div class="highlights-overlay" v-if="visible" @click.self="$emit('close')">
      <div class="highlights-panel">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span class="option-label" style="font-size: 0.8rem;">Highlights</span>
          <button class="btn" @click="$emit('close')" style="padding: 2px 8px;">&times;</button>
        </div>
        <div v-if="loading" style="color: var(--text-muted); font-size: 0.8rem;">Loading...</div>
        <div v-else-if="highlights.length === 0" style="color: var(--text-muted); font-size: 0.8rem;">No highlights available</div>
        <div v-else style="max-height: 60vh; overflow-y: auto;">
          <div v-for="h in highlights" :key="h.id" style="padding: 8px 0; border-bottom: 1px solid var(--border);">
            <div style="font-size: 0.8rem; color: var(--text-primary); margin-bottom: 4px;">{{ h.title }}</div>
            <div style="display: flex; gap: 8px; font-size: 0.7rem;">
              <a v-if="h.hlsUrl" class="broadcast-link" :href="embedLink(h.hlsUrl)">Watch</a>
              <a v-if="h.mp4Url" class="broadcast-link" :href="h.mp4Url" target="_blank">MP4</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return { highlights: [], loading: false }
  },
  watch: {
    visible(val) {
      if (val && this.gamePk) this.fetchHighlights()
    }
  },
  methods: {
    async fetchHighlights() {
      this.loading = true
      this.highlights = []
      try {
        const cp = this.actions.getContentProtectParam('&')
        const url = this.state.config.httpRoot + '/highlights?gamePk=' + this.gamePk + '&gameDate=' + this.gameDate + cp
        const resp = await fetch(url)
        const data = await resp.json()
        if (Array.isArray(data)) {
          this.highlights = data.map(h => ({
            id: h.id || Math.random(),
            title: h.title || h.headline || 'Highlight',
            hlsUrl: h.playbacks ? (h.playbacks.find(p => p.url && p.url.includes('.m3u8')) || {}).url : null,
            mp4Url: h.playbacks ? (h.playbacks.find(p => p.url && p.url.includes('.mp4')) || {}).url : null
          }))
        }
      } catch (e) {
        console.error('Failed to fetch highlights:', e)
      } finally {
        this.loading = false
      }
    },
    embedLink(hlsUrl) {
      const hr = this.state.config.httpRoot
      const cp = this.actions.getContentProtectParam('&')
      return hr + '/embed.html?highlight_src=' + encodeURIComponent(hlsUrl) + cp
    }
  }
}
