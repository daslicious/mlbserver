export default {
  name: 'GameCard',
  inject: ['state', 'actions'],
  props: {
    game: { type: Object, required: true }
  },
  template: `
    <div class="game-card" :class="cardClasses" :style="cardStyle">
      <div class="card-strip"></div>

      <!-- Blackout overlay -->
      <div class="blackout-overlay" v-if="isFullyBlackedOut">
        <span class="blackout-label">Not Available</span>
        <span class="blackout-reason" v-if="blackoutReason">{{ blackoutReason }}</span>
      </div>

      <!-- Audio-only badge -->
      <div class="audio-overlay" v-if="isAudioOnly && !isFullyBlackedOut"></div>

      <div class="card-inner">
        <div class="card-matchup">
          <img class="team-logo" :src="awayLogoUrl" :alt="game.away.abbreviation" loading="lazy" @error="onLogoError">
          <div class="matchup-center">
            <div class="matchup-score" v-if="showScores && hasScores">
              <span>{{ game.away.score }}</span>
              <span style="color: var(--text-muted); font-size: 0.7em;">-</span>
              <span>{{ game.home.score }}</span>
            </div>
            <span class="matchup-at" v-else>@</span>
          </div>
          <img class="team-logo" :src="homeLogoUrl" :alt="game.home.abbreviation" loading="lazy" @error="onLogoError">
        </div>

        <div class="card-details">
          <div class="card-status" :class="statusClass">{{ statusText }}</div>
          <div class="card-pitchers" v-if="pitcherText">{{ pitcherText }}</div>
        </div>

        <div class="card-feeds" v-if="filteredBroadcasts.length > 0 && !isFullyBlackedOut">
          <template v-for="b in filteredBroadcasts" :key="b.mediaId">
            <span class="feed-pill pre-post" v-if="b.hasPreGame" style="padding: 0 2px;">/</span>
            <a v-if="b.isActive && !b.isBlackedOut" class="feed-pill" :href="buildLink(b)">{{ feedLabel(b) }}</a>
            <a v-else-if="b.isActive && b.isBlackedOut" class="feed-pill blacked-out" :href="buildLink(b)" :title="b.blackoutType || 'Blacked out'">{{ feedLabel(b) }}</a>
            <span v-else class="feed-pill inactive">{{ feedLabel(b) }}</span>
            <span class="feed-pill pre-post" v-if="b.hasPostGame" style="padding: 0 2px;">/</span>
          </template>
          <input v-if="showMvCheck" type="checkbox" class="mv-check" :value="mvValue" title="Add to multiview">
        </div>

        <a class="hl-link" v-if="canShowHighlights" :href="hlHref">Highlights</a>
      </div>
    </div>
  `,
  computed: {
    cfg() { return this.state.config },
    awayLabel() {
      if (this.game.away.isMajorLeague) return this.game.away.abbreviation
      let t = this.game.away.shortName || this.game.away.abbreviation
      if (this.game.away.parentOrg) t += ' (' + this.game.away.parentOrg + ')'
      return t
    },
    homeLabel() {
      if (this.game.home.isMajorLeague) return this.game.home.abbreviation
      let t = this.game.home.shortName || this.game.home.abbreviation
      if (this.game.home.parentOrg) t += ' (' + this.game.home.parentOrg + ')'
      return t
    },
    awayLogoUrl() {
      return this.game.away.teamId
        ? 'https://www.mlbstatic.com/team-logos/' + this.game.away.teamId + '.svg'
        : ''
    },
    homeLogoUrl() {
      return this.game.home.teamId
        ? 'https://www.mlbstatic.com/team-logos/' + this.game.home.teamId + '.svg'
        : ''
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
    metaText() {
      let parts = []
      if (this.game.doubleHeader !== 'N') parts.push('Game ' + this.game.gameNumber)
      if (this.game.description) parts.push(this.game.description)
      if (this.game.scheduledInnings && this.game.scheduledInnings != 9) parts.push(this.game.scheduledInnings + '-inning game')
      if (this.game.resumeDate) {
        parts.push(this.game.resumeLabel + ' ' + new Date(this.game.resumeDate).toLocaleString('default', { month: 'long', day: 'numeric' }))
      }
      return parts.join(' | ')
    },
    cardClasses() {
      return {
        'is-fav': this.game.isFavorite,
        'is-free': this.game.isFreeGame && !this.game.isFavorite,
        'is-live': this.game.status.abstractGameState === 'Live',
        'is-final': this.game.status.abstractGameState === 'Final',
        'game-card--blacked-out': this.isFullyBlackedOut,
        'game-card--audio-only': this.isAudioOnly
      }
    },
    cardStyle() {
      if (!this.game.isFavorite || !this.game.favoriteTeam || !this.cfg) return {}
      const c = this.cfg.teamColors[this.game.favoriteTeam]
      return c ? { '--fav-color': '#' + c[1] } : {}
    },
    curMediaType() {
      if (this.state.mediaType === 'Video') return 'MLBTV'
      if (this.state.mediaType === 'Spanish') return 'Spanish'
      return 'Audio'
    },
    curLang() { return this.state.mediaType === 'Spanish' ? 'es' : 'en' },
    filteredBroadcasts() {
      const mt = this.curMediaType, lang = this.curLang
      return this.game.broadcasts.filter(b => {
        if (b.mediaType !== mt) return false
        if (mt === 'MLBTV') return b.language === lang
        return true
      }).map(b => ({
        ...b,
        isActive: b.mediaStateCode === 'MEDIA_ON' || b.mediaStateCode === 'MEDIA_ARCHIVE' || this.game.status.abstractGameState === 'Final'
      }))
    },
    isFullyBlackedOut() {
      const fb = this.filteredBroadcasts
      return fb.length > 0 && fb.every(b => b.isBlackedOut)
    },
    blackoutReason() {
      const fb = this.filteredBroadcasts
      if (fb.length === 0) return ''
      const first = fb.find(b => b.blackoutType)
      if (!first) return ''
      if (first.blackoutType === 'Not entitled') return 'Not entitled'
      let reason = 'Regional blackout'
      if (first.blackoutExpiry) {
        reason += ' until ~' + new Date(first.blackoutExpiry).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
      }
      return reason
    },
    isAudioOnly() {
      if (this.state.mediaType !== 'Video') return false
      const hasVideo = this.game.broadcasts.some(b => b.mediaType === 'MLBTV' && b.language === 'en')
      return !hasVideo && this.game.broadcasts.some(b => b.mediaType === 'Audio')
    },
    showMvCheck() {
      return this.cfg && this.cfg.showMultiview && this.curMediaType === 'MLBTV'
    },
    mvValue() {
      const b = this.filteredBroadcasts.find(b => b.isActive)
      if (!b) return ''
      return 'http://127.0.0.1:' + this.cfg.port + '/stream.m3u8?mediaId=' + b.mediaId +
        '&resolution=' + this.cfg.defaults.multiviewResolution + this.actions.getContentProtectParam('&')
    },
    canShowHighlights() {
      return this.curMediaType === 'MLBTV' && this.game.status.abstractGameState !== 'Preview'
    },
    hlHref() {
      const gd = this.state.gamesData ? this.state.gamesData.gameDate : ''
      return this.cfg.httpRoot + '/highlights?gamePk=' + this.game.gamePk + '&gameDate=' + gd
    }
  },
  methods: {
    lastName(name) { const i = name.indexOf(' '); return i === -1 ? name : name.substring(i + 1) },
    feedLabel(b) { return b.isNational ? 'NATIONAL' : b.callSign },
    onLogoError(e) { e.target.style.display = 'none' },
    buildLink(b) {
      if (!this.cfg) return '#'
      const s = this.state, hr = this.cfg.httpRoot, link = this.actions.getLinkPath()
      let qs = '?mediaId=' + b.mediaId
      if (s.mediaType === 'Video') {
        if (s.resolution !== this.cfg.validOptions.resolutions[0]) qs += '&resolution=' + s.resolution
        if (s.audioTrack !== this.cfg.validOptions.audioTracks[0]) qs += '&audio_track=' + encodeURIComponent(s.audioTrack)
        if (s.captions !== this.cfg.validOptions.captions[0]) qs += '&captions=' + encodeURIComponent(s.captions)
        if (s.inningHalf) qs += '&inning_half=' + s.inningHalf
        if (s.inningNumber) {
          const sched = parseInt(this.game.scheduledInnings) || 9
          qs += '&inning_number=' + Math.max(0, parseInt(s.inningNumber) - (9 - sched))
        }
        if (s.skip !== this.cfg.validOptions.skip[0]) qs += '&skip=' + s.skip
        if (s.skipAdjust != this.cfg.defaults.skipAdjust) qs += '&skip_adjust=' + s.skipAdjust
        if (s.inningHalf || s.inningNumber || s.skip !== 'off') qs += '&gamePk=' + this.game.gamePk
      }
      if (s.pad !== this.cfg.validOptions.pad[0]) qs += '&pad=' + s.pad
      if (s.linkType === 'Embed') {
        if (s.startFrom !== this.cfg.validOptions.startFrom[0]) qs += '&startFrom=' + s.startFrom
        if (s.controls !== this.cfg.validOptions.controls[0]) qs += '&controls=' + s.controls
      }
      if (s.linkType === 'Stream' && b.mediaStateCode === 'MEDIA_ON') {
        if (s.forceVod !== this.cfg.validOptions.forceVod[0]) qs += '&force_vod=' + s.forceVod
      }
      if (s.linkType === 'Download') {
        qs += '&filename=' + (this.state.gamesData ? this.state.gamesData.gameDate : '') + ' ' + this.game.away.abbreviation + ' @ ' + this.game.home.abbreviation + ' ' + b.callSign
      }
      qs += this.actions.getContentProtectParam('&')
      return hr + '/' + link + qs
    }
  }
}
