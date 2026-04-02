export default {
  name: 'FavoritesSelector',
  inject: ['state', 'actions'],
  template: `
    <details class="panel" v-if="state.username && state.menuOpen && state.config">
      <summary>Favorite Teams</summary>
      <div class="panel-body">
        <div class="fav-grid">
          <button
            v-for="team in teams"
            :key="team"
            class="fav-team-btn"
            :class="{ active: isFav(team) }"
            :style="btnStyle(team)"
            @click="toggleFav(team)"
          >{{ team }}</button>
        </div>
      </div>
    </details>
  `,
  computed: {
    teams() {
      return this.state.config ? Object.keys(this.state.config.teamColors) : []
    },
    favTeams() {
      return this.state.config ? (this.state.config.favTeams || []) : []
    }
  },
  methods: {
    isFav(team) {
      return this.favTeams.includes(team)
    },
    btnStyle(team) {
      if (!this.isFav(team)) return {}
      const colors = this.state.config.teamColors[team]
      if (!colors) return {}
      return {
        color: '#' + colors[0],
        background: '#' + colors[1],
        borderColor: '#' + colors[1]
      }
    },
    async toggleFav(team) {
      const current = [...this.favTeams]
      const idx = current.indexOf(team)
      if (idx >= 0) current.splice(idx, 1)
      else current.push(team)
      // Update config in state so UI reflects immediately
      this.state.config.favTeams = current
      // Save to server
      try {
        const resp = await fetch('/api/user/preferences')
        let prefs = {}
        if (resp.ok) prefs = await resp.json()
        prefs.favTeams = current
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs)
        })
        // Refetch games to update favorite highlighting
        await this.actions.onAuthSuccess()
      } catch (e) {
        console.error('Failed to save favorites:', e)
      }
    }
  }
}
