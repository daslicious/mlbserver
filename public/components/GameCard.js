export default {
  name: 'GameCard',
  inject: ['state', 'actions'],
  props: {
    game: { type: Object, required: true }
  },
  template: `
    <a class="game-card" :class="cardClasses" :style="cardStyle" :href="cardLink">
      <div class="card-strip"></div>

      <div class="blackout-overlay" v-if="hasNoActiveStream">
        <span class="blackout-label">Not Available</span>
      </div>

      <div class="audio-overlay" v-if="isAudioOnly && !hasNoActiveStream"></div>

      <div class="card-inner">
        <div class="card-matchup">
          <img class="team-logo" :src="awayLogoUrl" :alt="game.away.abbreviation" loading="lazy" @error="onLogoError">
          <div class="matchup-center">
            <div class="matchup-score" v-if="showScores && hasScores">
              <span>{{ game.away.score }}</span>
              <span style="color: var(--text-muted); font-size: 0.7em;">-</span>
              <span>{{ game.home.score }}</span>
            </div>
            <span class="matchup-vs" v-else>VS</span>
          </div>
          <img class="team-logo" :src="homeLogoUrl" :alt="game.home.abbreviation" loading="lazy" @error="onLogoError">
        </div>

        <div class="card-details">
          <div class="card-status" :class="statusClass">{{ statusText }}</div>
          <div class="card-pitchers" v-if="pitcherText">{{ pitcherText }}</div>
        </div>
      </div>
    </a>
  `,
  computed: {
    cfg() { return this.state.config },
    awayLogoUrl() {
      if (!this.game.away.teamId) return ''
      return '/app/logos/' + this.game.away.teamId + '.svg'
    },
    homeLogoUrl() {
      if (!this.game.home.teamId) return ''
      return '/app/logos/' + this.game.home.teamId + '.svg'
    },
    showScores() {
      return this.state.scores === 'Show' &&
        this.game.status.abstractGameState !== 'Preview' &&
        this.game.status.detailedState !== 'Postponed'
    },
    hasScores() {
      return this.game.away.score != null && this.game.home.score != null
    },
    statusText() {
      const g = this.game, s = g.status
      if (g.startTimeTBD) return 'Time TBD'
      let text = new Date(g.gameDate).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      if (s.abstractGameState === 'Live' && g.linescore) {
        let half = g.linescore.inningHalf ? g.linescore.inningHalf.substr(0, 1) : ''
        text = half + g.linescore.currentInning
      } else if (s.abstractGameState === 'Final') {
        text = s.detailedState
      } else if (s.detailedState === 'Postponed') {
        text = 'Postponed'
      } else if (s.detailedState && s.detailedState.startsWith('Delayed')) {
        text += ' — ' + s.detailedState
      }
      if (g.flags && g.flags.perfectGame) text += ' — Perfect Game'
      else if (g.flags && g.flags.noHitter) text += ' — No-Hitter'
      return text
    },
    statusClass() {
      if (this.game.status.abstractGameState === 'Live') return 'live'
      if (this.game.status.abstractGameState === 'Final') return 'final'
      return ''
    },
    pitcherText() {
      const a = this.game.away.probablePitcher, h = this.game.home.probablePitcher
      if (!a && !h) return ''
      return (a ? this.lastName(a) : 'TBD') + ' vs ' + (h ? this.lastName(h) : 'TBD')
    },
    cardClasses() {
      return {
        'is-fav': this.game.isFavorite,
        'is-free': this.game.isFreeGame && !this.game.isFavorite,
        'is-live': this.game.status.abstractGameState === 'Live',
        'is-final': this.game.status.abstractGameState === 'Final',
        'game-card--blacked-out': this.hasNoActiveStream,
        'game-card--audio-only': this.isAudioOnly
      }
    },
    cardStyle() {
      if (!this.game.isFavorite || !this.game.favoriteTeam || !this.cfg) return {}
      const c = this.cfg.teamColors[this.game.favoriteTeam]
      return c ? { '--fav-color': '#' + c[1] } : {}
    },
    filteredBroadcasts() {
      return this.game.broadcasts.filter(b => b.mediaType === 'MLBTV' && b.language === 'en').map(b => ({
        ...b,
        isActive: b.mediaStateCode === 'MEDIA_ON' || b.mediaStateCode === 'MEDIA_ARCHIVE' || this.game.status.abstractGameState === 'Final'
      }))
    },
    preferredBroadcast() {
      // For favorite team games, prefer the favorite team's feed
      const favSide = this.game.isFavorite && this.game.favoriteTeam
        ? (this.game.favoriteTeam === this.game.home.abbreviation ? 'home' : 'away')
        : 'home'
      return this.filteredBroadcasts.find(b => b.homeAway === favSide && b.isActive && !b.isBlackedOut) ||
        this.filteredBroadcasts.find(b => b.isActive && !b.isBlackedOut) ||
        this.filteredBroadcasts.find(b => b.homeAway === favSide && b.isActive) ||
        this.filteredBroadcasts.find(b => b.isActive) ||
        this.filteredBroadcasts[0] || null
    },
    allActiveBroadcasts() {
      return this.game.broadcasts.filter(b =>
        b.mediaStateCode === 'MEDIA_ON' || b.mediaStateCode === 'MEDIA_ARCHIVE' || this.game.status.abstractGameState === 'Final'
      )
    },
    hasNoActiveStream() {
      if (this.game.status.abstractGameState === 'Preview') return false
      return this.game.broadcasts.length === 0 || this.allActiveBroadcasts.length === 0
    },
    isAudioOnly() {
      const hasVideo = this.game.broadcasts.some(b => b.mediaType === 'MLBTV' && b.language === 'en' && !b.isBlackedOut)
      return !hasVideo && this.game.broadcasts.some(b => b.mediaType === 'Audio' && !b.isBlackedOut)
    },
    cardLink() {
      if (!this.cfg) return '#'
      if (this.hasNoActiveStream) return '#'
      const hr = this.cfg.httpRoot
      let qs = '?gamePk=' + this.game.gamePk
      if (this.state.gamesData) qs += '&date=' + this.state.gamesData.gameDate
      if (this.preferredBroadcast) qs += '&mediaId=' + this.preferredBroadcast.mediaId
      // Live games start at live point, final/archive start at beginning
      qs += '&startFrom=' + (this.game.status.abstractGameState === 'Final' ? 'Beginning' : 'Live')
      qs += this.actions.getContentProtectParam('&')
      return hr + '/app/player.html' + qs
    }
  },
  methods: {
    lastName(name) { const i = name.indexOf(' '); return i === -1 ? name : name.substring(i + 1) },
    onLogoError(e) { e.target.style.opacity = '0' }
  }
}
