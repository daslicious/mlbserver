export default {
  name: 'SpecialStreams',
  inject: ['state', 'actions'],
  template: `
    <div class="special-streams" v-if="hasAnySpecial">
      <!-- Network streams: MASN, MLB Network, SNLA, SNY -->
      <div class="special-card" v-if="ss.masn">
        <span class="special-label">MASN</span>
        <a class="special-link" :href="buildSpecialLink('MASN')">Watch</a>
      </div>

      <div class="special-card" v-if="ss.mlbNetwork">
        <span class="special-label">MLB Network</span>
        <a class="special-link" :href="buildSpecialLink('MLBN')">Watch</a>
      </div>

      <div class="special-card" v-if="ss.snla">
        <span class="special-label">SportsNet LA</span>
        <a class="special-link" :href="buildSpecialLink('SNLA')">Watch</a>
      </div>

      <div class="special-card" v-if="ss.sny">
        <span class="special-label">SNY</span>
        <a class="special-link" :href="buildSpecialLink('SNY')">Watch</a>
      </div>

      <!-- Big Inning -->
      <div class="special-card" v-if="ss.bigInning">
        <span class="special-label">Big Inning</span>
        <span class="special-time">{{ formatTime(ss.bigInning.start) }} - {{ formatTime(ss.bigInning.end) }}</span>
        <a v-if="isLive(ss.bigInning)" class="special-link" :href="buildSpecialLink('biginning')">Watch</a>
        <span v-else class="special-time">Upcoming</span>
      </div>

      <!-- Game Changer -->
      <div class="special-card" v-if="ss.gameChanger">
        <span class="special-label">Game Changer</span>
        <span class="special-time">{{ formatTime(ss.gameChanger.start) }} - {{ formatTime(ss.gameChanger.end) }}</span>
        <a v-if="isLive(ss.gameChanger)" class="special-link" :href="buildGameChangerLink(false)">Watch</a>
        <span v-else class="special-time">Upcoming</span>
      </div>

      <!-- Stream Finder -->
      <div class="special-card" v-if="ss.streamFinder">
        <span class="special-label">Stream Finder</span>
        <span class="special-time">{{ formatTime(ss.streamFinder.start) }} - {{ formatTime(ss.streamFinder.end) }}</span>
        <a v-if="isLive(ss.streamFinder)" class="special-link" :href="buildGameChangerLink(true)">Watch</a>
        <span v-else class="special-time">Upcoming</span>
      </div>
    </div>
  `,
  computed: {
    ss() {
      return (this.state.gamesData && this.state.gamesData.specialStreams) || {}
    },
    hasAnySpecial() {
      const s = this.ss
      return s.masn || s.mlbNetwork || s.snla || s.sny || s.bigInning || s.gameChanger || s.streamFinder
    }
  },
  methods: {
    formatTime(isoStr) {
      if (!isoStr) return ''
      return new Date(isoStr).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
    },
    isLive(stream) {
      if (!stream || !stream.start || !stream.end) return false
      const now = new Date()
      const start = new Date(stream.start)
      const end = new Date(stream.end)
      start.setMinutes(start.getMinutes() - 10)
      end.setHours(end.getHours() + 1)
      return now >= start && now < end
    },
    buildSpecialLink(event) {
      const hr = this.state.config.httpRoot
      let qs = '?event=' + event + '&startFrom=Live'
      qs += this.actions.getContentProtectParam('&')
      return hr + '/app/player.html' + qs
    },
    buildGameChangerLink(isStreamFinder) {
      const cfg = this.state.config
      const hr = cfg.httpRoot
      const server = window.location.origin + hr
      let streamURL = server + '/gamechanger.m3u8'
      let cpChar = '?'
      if (isStreamFinder) { streamURL += '?streamFinder=on'; cpChar = '&' }
      if (cfg.contentProtect) { streamURL += cpChar + 'content_protect=' + cfg.contentProtect; cpChar = '&' }
      return hr + '/embed-videojs.html?src=' + encodeURIComponent(streamURL) + '&startFrom=Live' + this.actions.getContentProtectParam('&')
    }
  }
}
