export default {
  name: 'FilterBar',
  inject: ['state', 'actions'],
  template: `
    <details class="panel" v-if="state.config">
      <summary>Filters</summary>
      <div class="panel-body">
        <div class="opt-row">
          <div class="opt-group">
            <span class="opt-label">Media</span>
            <div class="btn-group">
              <button v-for="mt in state.config.validOptions.mediaTypes" :key="mt"
                class="btn" :class="{ active: state.mediaType === mt }"
                @click="actions.setFilter('mediaType', mt)">{{ mt }}</button>
            </div>
          </div>

          <div class="opt-group">
            <span class="opt-label">Link</span>
            <div class="btn-group">
              <button v-for="lt in state.config.validOptions.linkTypes" :key="lt"
                class="btn" :class="{ active: state.linkType === lt }"
                @click="actions.setFilter('linkType', lt)">{{ lt }}</button>
            </div>
          </div>

          <div class="opt-group">
            <span class="opt-label">Scores</span>
            <div class="btn-group">
              <button v-for="s in state.config.validOptions.scores" :key="s"
                class="btn" :class="{ active: state.scores === s }"
                @click="actions.setFilter('scores', s)">{{ s }}</button>
            </div>
          </div>

          <template v-if="state.linkType === 'Embed'">
            <div class="opt-group">
              <span class="opt-label">Controls</span>
              <div class="btn-group">
                <button v-for="c in state.config.validOptions.controls" :key="c"
                  class="btn" :class="{ active: state.controls === c }"
                  @click="actions.setFilter('controls', c)">{{ c }}</button>
              </div>
            </div>
            <div class="opt-group">
              <span class="opt-label">Start From</span>
              <div class="btn-group">
                <button v-for="sf in state.config.validOptions.startFrom" :key="sf"
                  class="btn" :class="{ active: state.startFrom === sf }"
                  @click="actions.setFilter('startFrom', sf)">{{ sf }}</button>
              </div>
            </div>
          </template>

          <template v-if="state.linkType === 'Stream' && isToday">
            <div class="opt-group">
              <span class="opt-label">Force VOD</span>
              <div class="btn-group">
                <button v-for="fv in state.config.validOptions.forceVod" :key="fv"
                  class="btn" :class="{ active: state.forceVod === fv }"
                  @click="actions.setFilter('forceVod', fv)">{{ fv }}</button>
              </div>
            </div>
          </template>

          <template v-if="state.mediaType === 'Video'">
            <div class="opt-group">
              <span class="opt-label">Inning</span>
              <div style="display: flex; gap: 4px;">
                <select class="inning-select" :value="state.inningHalf" @change="actions.setFilter('inningHalf', $event.target.value)">
                  <option v-for="ih in state.config.validOptions.inningHalves" :key="'ih'+ih" :value="ih">{{ ih || 'any' }}</option>
                </select>
                <select class="inning-select" :value="state.inningNumber" @change="actions.setFilter('inningNumber', $event.target.value)">
                  <option v-for="n in state.config.validOptions.inningNumbers" :key="'in'+n" :value="n">{{ n || '-' }}</option>
                </select>
              </div>
            </div>
          </template>
        </div>
      </div>
    </details>
  `,
  computed: {
    isToday() {
      return this.state.gamesData && this.state.gamesData.gameDate === this.state.gamesData.today
    }
  }
}
