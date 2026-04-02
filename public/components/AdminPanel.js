export default {
  name: 'AdminPanel',
  inject: ['state', 'actions'],
  template: `
    <details class="panel" v-if="state.role === 'admin' && state.menuOpen">
      <summary>Admin</summary>
      <div class="panel-body">
        <!-- Invites -->
        <div style="margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span class="opt-label" style="margin: 0;">Invite Codes</span>
            <button class="btn" @click="generateInvite" style="font-size: 0.68rem; padding: 3px 10px;">Generate</button>
          </div>
          <div v-if="newCode" style="margin-bottom: 8px; padding: 8px 10px; background: var(--amber-glow); border: 1px solid var(--amber-dim); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.8rem; color: var(--amber); display: flex; align-items: center; gap: 8px;">
            <span style="flex: 1; user-select: all;">{{ newCode }}</span>
            <button class="btn" @click="copyCode" style="font-size: 0.62rem; padding: 2px 8px;">{{ copied ? 'Copied' : 'Copy' }}</button>
          </div>
          <div v-if="invites.length > 0" style="display: flex; flex-direction: column; gap: 4px;">
            <div v-for="inv in invites" :key="inv.code" style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--text-secondary);">
              <span style="font-family: var(--font-mono); color: var(--text-primary);">{{ inv.code }}</span>
              <span style="color: var(--text-muted);">{{ formatDate(inv.createdAt) }}</span>
              <button class="btn" @click="revokeInvite(inv.code)" style="font-size: 0.6rem; padding: 2px 6px; margin-left: auto;">Revoke</button>
            </div>
          </div>
          <div v-else-if="!newCode" style="font-size: 0.68rem; color: var(--text-muted);">No active invites</div>
        </div>

        <!-- Users -->
        <div style="border-top: 1px solid var(--border); padding-top: 10px;">
          <span class="opt-label" style="display: block; margin-bottom: 6px;">Users</span>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div v-for="u in userList" :key="u.username" style="display: flex; align-items: center; gap: 8px; font-size: 0.7rem; color: var(--text-secondary);">
              <span style="color: var(--text-primary);">{{ u.username }}</span>
              <span style="font-size: 0.6rem; color: var(--text-muted);">{{ u.role }}</span>
              <span style="font-size: 0.6rem; color: var(--text-muted);">{{ formatDate(u.createdAt) }}</span>
              <button v-if="u.username !== state.username" class="btn" @click="deleteUser(u.username)" style="font-size: 0.6rem; padding: 2px 6px; margin-left: auto;">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </details>
  `,
  data() {
    return {
      invites: [],
      userList: [],
      newCode: '',
      copied: false
    }
  },
  watch: {
    'state.menuOpen'(val) {
      if (val && this.state.role === 'admin') this.loadData()
    }
  },
  methods: {
    async loadData() {
      try {
        const [invResp, usrResp] = await Promise.all([
          fetch('/api/admin/invites'),
          fetch('/api/admin/users')
        ])
        if (invResp.ok) this.invites = await invResp.json()
        if (usrResp.ok) this.userList = await usrResp.json()
      } catch (e) {}
    },
    async generateInvite() {
      try {
        const resp = await fetch('/api/admin/invite', { method: 'POST' })
        const data = await resp.json()
        if (data.code) {
          this.newCode = data.code
          this.copied = false
          this.loadData()
        }
      } catch (e) {}
    },
    copyCode() {
      navigator.clipboard.writeText(this.newCode).then(() => { this.copied = true })
    },
    async revokeInvite(code) {
      try {
        await fetch('/api/admin/invite/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code })
        })
        this.invites = this.invites.filter(i => i.code !== code)
        if (this.newCode === code) this.newCode = ''
      } catch (e) {}
    },
    async deleteUser(username) {
      try {
        await fetch('/api/admin/user/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username })
        })
        this.userList = this.userList.filter(u => u.username !== username)
      } catch (e) {}
    },
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
}
