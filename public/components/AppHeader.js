export default {
  name: 'AppHeader',
  inject: ['state', 'actions'],
  template: `
    <header class="app-header">
      <div class="header-inner">
        <div class="app-logo">
          <span class="logo-dot"></span>
          <span>{{ state.config ? state.config.appname : 'mlbserver' }}</span>
        </div>

        <div class="header-right">
          <div v-if="state.username" class="user-menu" @click.stop="userMenuOpen = !userMenuOpen">
            <button class="user-badge">{{ state.username }}</button>
            <div class="user-dropdown" v-if="userMenuOpen">
              <a class="user-dropdown-item" :href="settingsUrl">Settings</a>
              <button class="user-dropdown-item" @click="actions.logout()">Logout</button>
            </div>
          </div>
          <button v-else class="btn" @click="state.showLogin = true">Login</button>
          <button class="hamburger" :class="{ open: state.menuOpen }" @click="state.menuOpen = !state.menuOpen; sessionStorage.setItem('menuOpen', state.menuOpen)" title="Options">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="header-drawer" v-if="state.menuOpen">
        <div class="header-nav">
          <button
            v-for="(id, label) in (state.config ? state.config.levels : {})"
            :key="label"
            class="nav-pill"
            :class="{ active: state.level === label }"
            @click="actions.setFilter('level', label); actions.setFilter('org', 'All')"
          >{{ label }}</button>

          <select
            class="org-select"
            :value="state.org"
            @change="actions.setFilter('org', $event.target.value); actions.setFilter('level', 'All')"
          >
            <option value="All">Org</option>
            <option
              v-for="o in (state.config ? state.config.orgs : [])"
              :key="o"
              :value="o"
            >{{ o }}</option>
          </select>
        </div>
        <div class="header-date-row">
          <span class="cache-time" v-if="state.gamesData">{{ state.gamesData.cacheUpdated }}</span>
          <button class="btn" :class="{ active: isToday }" @click="setDate('today')">Today</button>
          <button class="btn" :class="{ active: isYesterday }" @click="setDate('yesterday')">Yesterday</button>
          <input
            type="date"
            class="date-input"
            :value="displayDate"
            @change="setDate($event.target.value)"
          >
          <button class="btn" :class="{ active: state.scores === 'Show' }" @click="actions.setFilter('scores', state.scores === 'Show' ? 'Hide' : 'Show')">Scores</button>
        </div>
      </div>
    </header>
  `,
  data() {
    return { userMenuOpen: false }
  },
  computed: {
    settingsUrl() {
      var cp = this.state.config && this.state.config.contentProtect ? '?content_protect=' + this.state.config.contentProtect : ''
      return '/app/settings.html' + cp
    },
    displayDate() {
      if (!this.state.gamesData) return this.state.date || ''
      return this.state.gamesData.gameDate || this.state.date || ''
    },
    isToday() {
      if (!this.state.gamesData) return !this.state.date || this.state.date === 'today'
      return this.state.gamesData.gameDate === this.state.gamesData.today
    },
    isYesterday() {
      if (!this.state.gamesData) return this.state.date === 'yesterday'
      return this.state.gamesData.gameDate === this.state.gamesData.yesterday
    }
  },
  mounted() {
    document.addEventListener('click', () => { this.userMenuOpen = false })
  },
  methods: {
    setDate(val) {
      this.actions.setFilter('date', val)
    }
  }
}
