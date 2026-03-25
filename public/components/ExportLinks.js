export default {
  name: 'ExportLinks',
  inject: ['state', 'actions'],
  template: `
    <details class="panel" v-if="state.config">
      <summary>IPTV &amp; Export</summary>
      <div class="panel-body">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; align-items: center;">
          <span class="opt-label">Scan Mode</span>
          <div class="btn-group">
            <button v-for="sm in state.config.validOptions.scanModes" :key="sm"
              class="btn" :class="{ active: state.scanMode === sm }"
              @click="toggleScanMode(sm)">{{ sm }}</button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.72rem; color: var(--text-secondary);">
          <div><strong style="color: var(--text-primary);">All:</strong>
            <a :href="ex('channels.m3u')">channels.m3u</a> |
            <a :href="ex('guide.xml')">guide.xml</a> |
            <a :href="ex('calendar.ics')">calendar.ics</a></div>
          <div><strong style="color: var(--text-primary);">By team:</strong>
            <a :href="ex('channels.m3u', '&includeTeams=' + teams)">channels.m3u</a> |
            <a :href="ex('guide.xml', '&includeTeams=' + teams)">guide.xml</a> |
            <a :href="ex('calendar.ics', '&includeTeams=' + teams)">calendar.ics</a></div>
          <div><strong style="color: var(--text-primary);">By team w/ radio:</strong>
            <a :href="ex('channels.m3u', '&includeTeams=' + teams + '&audio_track=radio')">channels.m3u</a> |
            <a :href="ex('guide.xml', '&includeTeams=' + teams + '&audio_track=radio')">guide.xml</a> |
            <a :href="ex('calendar.ics', '&includeTeams=' + teams + '&audio_track=radio')">calendar.ics</a></div>
          <div><strong style="color: var(--text-primary);">Include blackouts:</strong>
            <a :href="ex('channels.m3u', '&includeTeams=' + teams + '&includeBlackouts=true')">channels.m3u</a> |
            <a :href="ex('guide.xml', '&includeTeams=' + teams + '&includeBlackouts=true')">guide.xml</a> |
            <a :href="ex('calendar.ics', '&includeTeams=' + teams + '&includeBlackouts=true')">calendar.ics</a></div>
          <div><strong style="color: var(--text-primary);">Winter Leagues:</strong>
            <a :href="ex('channels.m3u', '&includeTeams=winter')">m3u</a> |
            <a :href="ex('guide.xml', '&includeTeams=winter')">xml</a> |
            <a :href="ex('calendar.ics', '&includeTeams=winter')">ics</a></div>
        </div>

        <div style="border-top: 1px solid var(--border); margin-top: 10px; padding-top: 8px;">
          <span class="opt-label" style="display: block; margin-bottom: 4px;">Stream Finder Settings</span>
          <div style="font-size: 0.72rem; color: var(--text-secondary);">
            <a :href="state.config.httpRoot + '/downloadsettings' + cpQ" download="mlbserverStreamFinder.txt">Download current settings</a>
            <div style="margin-top: 4px;">
              Upload from <a href="https://www.baseball-reference.com/stream-finder.shtml" target="_blank">Baseball Reference</a>:
              <form :action="state.config.httpRoot + '/upload' + cpQ" method="POST" enctype="multipart/form-data" style="margin-top: 4px;">
                <input name="file" type="file" style="font-size: 0.7rem; color: var(--text-secondary);" @change="$event.target.form.submit()">
              </form>
            </div>
          </div>
        </div>
      </div>
    </details>
  `,
  computed: {
    cpQ() { const c = this.state.config.contentProtect; return c ? '?content_protect=' + c : '' },
    teams() {
      const f = this.state.config.favTeams
      return (f && f.length > 0 && f[0].length > 0) ? f.join(',').toLowerCase() : 'ath,atl'
    },
    res() { const r = this.state.resolution; return (r && r !== 'adaptive') ? r : 'best' }
  },
  methods: {
    ex(file, extra) {
      const hr = this.state.config.httpRoot
      let url = hr + '/' + file + '?mediaType=' + this.state.mediaType + '&resolution=' + this.res
      if (extra) url += extra
      url += this.actions.getContentProtectParam('&')
      return url
    },
    async toggleScanMode(val) {
      this.actions.setFilter('scanMode', val)
      try {
        await fetch(this.state.config.httpRoot + '/api/settings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scanMode: val })
        })
      } catch (e) { console.error('Failed to save scan mode:', e) }
    }
  }
}
