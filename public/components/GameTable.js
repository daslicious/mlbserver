export default {
  name: 'GameTable',
  inject: ['state', 'actions'],
  template: `
    <div class="game-table" v-if="state.gamesData">
      <!-- Live Games -->
      <template v-if="liveGames.length > 0">
        <div class="section-header">
          <div class="live-dot"></div>
          <span class="section-tag live">LIVE</span>
          <span class="section-count">{{ liveGames.length }}</span>
        </div>
        <div class="game-grid">
          <game-card v-for="g in liveGames" :key="g.gamePk" :game="g" />
        </div>
      </template>

      <!-- Upcoming Games -->
      <template v-if="upcomingGames.length > 0">
        <div class="section-header">
          <span class="section-tag">UPCOMING</span>
          <span class="section-count">{{ upcomingGames.length }}</span>
        </div>
        <div class="game-grid">
          <game-card v-for="g in upcomingGames" :key="g.gamePk" :game="g" />
        </div>
      </template>

      <!-- Final Games (only when menu open) -->
      <template v-if="finalGames.length > 0 && state.menuOpen">
        <div class="section-header">
          <span class="section-tag">FINAL</span>
          <span class="section-count">{{ finalGames.length }}</span>
        </div>
        <div class="game-grid">
          <game-card v-for="g in finalGames" :key="g.gamePk" :game="g" />
        </div>
      </template>

      <!-- No live/upcoming -->
      <div class="no-games" v-if="liveGames.length === 0 && upcomingGames.length === 0 && !state.loading">
        <div class="no-games-text">No live or upcoming games</div>
      </div>
    </div>
  `,
  computed: {
    allGames() {
      if (!this.state.gamesData || !this.state.gamesData.games) return []
      return [...this.state.gamesData.games].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return 0
      })
    },
    liveGames() {
      return this.allGames.filter(g => g.status.abstractGameState === 'Live')
    },
    upcomingGames() {
      return this.allGames.filter(g => g.status.abstractGameState === 'Preview')
    },
    finalGames() {
      return this.allGames.filter(g =>
        g.status.abstractGameState === 'Final' ||
        g.status.detailedState === 'Postponed'
      )
    }
  }
}
