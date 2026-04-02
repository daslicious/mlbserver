export default {
  name: 'LoginModal',
  inject: ['state', 'actions'],
  template: `
    <div class="login-backdrop" v-if="state.showLogin" @click.self="state.showLogin = false" @keydown.esc="state.showLogin = false" tabindex="-1" ref="backdrop">
      <div class="login-card">
        <div class="login-glow"></div>
        <h2 class="login-title">{{ title }}</h2>

        <div class="login-error" v-if="error">{{ error }}</div>

        <div class="login-field" v-if="mode === 'register' && hasUsers">
          <label class="login-label">Invite Code</label>
          <input class="login-input mono" type="text" v-model="inviteCode" placeholder="Enter invite code" autocomplete="off" @keydown.enter="submit">
        </div>

        <div class="login-field">
          <label class="login-label">Username</label>
          <input class="login-input" type="text" v-model="username" placeholder="Choose a username" autocomplete="username" @keydown.enter="submit">
        </div>

        <div class="login-field">
          <label class="login-label">Password</label>
          <input class="login-input" type="password" v-model="password" placeholder="Choose a password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" @keydown.enter="submit">
        </div>

        <button class="login-submit" @click="submit" :disabled="loading">
          {{ loading ? '...' : submitLabel }}
        </button>

        <p class="login-toggle" v-if="hasUsers">
          <span v-if="mode === 'login'">Have an invite? <a href="#" @click.prevent="switchMode('register')">Create account</a></span>
          <span v-else>Already have an account? <a href="#" @click.prevent="switchMode('login')">Login</a></span>
        </p>
      </div>
    </div>
  `,
  data() {
    return {
      mode: 'register',
      username: '',
      password: '',
      inviteCode: '',
      error: '',
      loading: false
    }
  },
  computed: {
    hasUsers() {
      return this.state.config && this.state.config.hasUsers
    },
    title() {
      if (!this.hasUsers) return 'Create Admin Account'
      return this.mode === 'login' ? 'Login' : 'Create Account'
    },
    submitLabel() {
      if (!this.hasUsers) return 'Create Admin'
      return this.mode === 'login' ? 'Login' : 'Create Account'
    }
  },
  watch: {
    'state.showLogin'(val) {
      if (val) {
        this.error = ''
        this.mode = this.hasUsers ? 'login' : 'register'
        this.$nextTick(() => { this.$refs.backdrop && this.$refs.backdrop.focus() })
      }
    }
  },
  methods: {
    switchMode(m) {
      this.mode = m
      this.error = ''
    },
    async submit() {
      this.error = ''
      if (!this.username.trim() || !this.password) {
        this.error = 'Username and password required'
        return
      }
      if (this.mode === 'register' && this.hasUsers && !this.inviteCode.trim()) {
        this.error = 'Invite code required'
        return
      }
      this.loading = true
      try {
        var url = this.mode === 'login' ? '/api/auth/login' : '/api/auth/register'
        var body = { username: this.username.trim(), password: this.password }
        if (this.mode === 'register' && this.inviteCode.trim()) body.inviteCode = this.inviteCode.trim()
        var resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        var data = await resp.json()
        if (data.error) {
          this.error = data.error
        } else {
          this.state.username = data.username
          this.state.role = data.role
          this.state.showLogin = false
          this.username = ''
          this.password = ''
          this.inviteCode = ''
          this.actions.onAuthSuccess && this.actions.onAuthSuccess()
        }
      } catch (e) {
        this.error = 'Connection error'
      } finally {
        this.loading = false
      }
    }
  }
}
