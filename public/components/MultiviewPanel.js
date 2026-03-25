export default {
  name: 'MultiviewPanel',
  inject: ['state', 'actions'],
  template: `
    <details class="panel" v-if="state.config && state.config.showMultiview">
      <summary>Multiview</summary>
      <div class="panel-body">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <a href="#" class="btn" @click.prevent="startMultiview">{{ startLabel }}</a>
          <a href="#" class="btn" @click.prevent="stopMultiview">{{ stopLabel }}</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px;">
          <div v-for="i in 4" :key="i" style="display: flex; align-items: center; gap: 6px;">
            <span class="opt-label" style="width: 12px; margin: 0;">{{ i }}</span>
            <textarea rows="1" class="small-input" style="flex: 1; width: auto; resize: vertical;" v-model="slots[i-1]"></textarea>
            <input type="number" class="small-input" style="width: 48px;" v-model="syncs[i-1]" step="0.1" title="Sync (sec)">
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; font-size: 0.72rem;">
          <label style="display: flex; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" v-model="dvr" style="accent-color: var(--amber);"> DVR
          </label>
          <label style="display: flex; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" v-model="faster" @change="faster && (dvr = true)" style="accent-color: var(--amber);"> Faster
          </label>
          <label style="display: flex; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" v-model="reencode" style="accent-color: var(--amber);"> Re-encode audio
          </label>
          <label style="display: flex; align-items: center; gap: 4px; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" v-model="parkAudio" style="accent-color: var(--amber);"> Park audio
          </label>
        </div>
        <div style="border-top: 1px solid var(--border); padding-top: 8px; margin-bottom: 8px;">
          <span class="opt-label">Alternate audio</span>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            <textarea rows="1" class="small-input" style="flex: 1; width: auto; resize: vertical;" v-model="audioUrl"></textarea>
            <input type="number" class="small-input" style="width: 52px;" v-model="audioUrlSeek" step="1" title="Seek (sec)">
          </div>
        </div>
        <div style="font-size: 0.68rem; color: var(--text-muted);">
          Watch:
          <a :href="watchLink('embed.html', 'msrc')">Embed</a> |
          <a :href="watchLink('stream.m3u8', 'src')">Stream</a> |
          <a :href="watchLink('chromecast.html', 'msrc')">Chromecast</a> |
          <a :href="watchLink('advanced.html', 'msrc')">Advanced</a> |
          <a :href="watchLink('download.ts', 'src') + '&filename=' + gameDate + ' Multiview'">Download</a>
        </div>
      </div>
    </details>
  `,
  data() {
    return {
      slots: ['', '', '', ''], syncs: [0, 0, 0, 0],
      dvr: false, faster: false, reencode: false, parkAudio: false,
      audioUrl: '', audioUrlSeek: 0,
      startLabel: 'Start', stopLabel: 'Stopped'
    }
  },
  computed: {
    mvStreamUrl() {
      const c = this.state.config
      return 'http://127.0.0.1:' + c.multiviewPort + '/multiview/master.m3u8' +
        (c.contentProtect ? '?content_protect=' + c.contentProtect : '')
    },
    gameDate() { return (this.state.gamesData && this.state.gamesData.gameDate) || '' }
  },
  methods: {
    watchLink(file, param) {
      const hr = this.state.config.httpRoot, cp = this.actions.getContentProtectParam('&')
      return hr + '/' + file + '?' + param + '=' + encodeURIComponent(this.mvStreamUrl) + cp
    },
    async startMultiview() {
      let count = 0, qs = ''
      for (let i = 0; i < 4; i++) {
        if (this.slots[i]) {
          count++
          qs += 'streams=' + encodeURIComponent(this.slots[i]) + '&sync=' + encodeURIComponent(this.syncs[i]) + this.actions.getContentProtectParam('&') + '&'
        }
      }
      if (count < 1 || count > 4) { alert('Multiview requires 1-4 streams'); return }
      if (this.faster) qs += 'faster=true&dvr=true&'
      else if (this.dvr) qs += 'dvr=true&'
      if (this.reencode) qs += 'reencode=true&'
      if (this.parkAudio) qs += 'park_audio=true&'
      if (this.audioUrl) {
        qs += 'audio_url=' + encodeURIComponent(this.audioUrl) + '&'
        if (this.audioUrlSeek != 0) qs += 'audio_url_seek=' + encodeURIComponent(this.audioUrlSeek)
      }
      this.startLabel = 'Starting...'
      try {
        const r = await fetch(this.state.config.httpRoot + '/multiview?' + qs)
        const t = await r.text()
        if (t === 'started') setTimeout(() => { this.startLabel = 'Restart'; this.stopLabel = 'Stop' }, 15000)
        else alert(t)
      } catch (e) { alert('Error: ' + e.message) }
    },
    async stopMultiview() {
      this.stopLabel = 'Stopping...'
      try {
        const r = await fetch(this.state.config.httpRoot + '/multiview' + (this.state.config.contentProtect ? '?content_protect=' + this.state.config.contentProtect : ''))
        const t = await r.text()
        if (t === 'stopped') setTimeout(() => { this.stopLabel = 'Stopped'; this.startLabel = 'Start' }, 3000)
        else alert(t)
      } catch (e) { alert('Error: ' + e.message) }
    }
  }
}
