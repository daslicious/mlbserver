export default {
  name: 'VideoOptions',
  inject: ['state', 'actions'],
  template: `
    <details class="panel" v-if="state.config && state.mediaType === 'Video'">
      <summary>Stream Options</summary>
      <div class="panel-body">
        <div class="opt-row">
          <div class="opt-group">
            <span class="opt-label">Video</span>
            <div class="opt-pills">
              <button v-for="(r, i) in state.config.validOptions.resolutions" :key="r"
                class="pill" :class="{ active: state.resolution === r }"
                @click="actions.setFilter('resolution', r)">
                {{ r }}<span class="pill-bw" v-if="state.config.validOptions.displayBandwidths[i]">{{ state.config.validOptions.displayBandwidths[i] }}</span>
              </button>
            </div>
          </div>

          <div class="opt-group">
            <span class="opt-label">Audio</span>
            <div class="opt-pills">
              <button v-for="(at, i) in state.config.validOptions.audioTracks" :key="at"
                class="pill" :class="{ active: state.audioTrack === at }"
                @click="actions.setFilter('audioTrack', at)">{{ state.config.validOptions.displayAudioTracks[i] }}</button>
            </div>
          </div>

          <div class="opt-group">
            <span class="opt-label">Captions</span>
            <div class="btn-group">
              <button v-for="c in state.config.validOptions.captions" :key="c"
                class="btn" :class="{ active: state.captions === c }"
                @click="actions.setFilter('captions', c)">{{ c }}</button>
            </div>
          </div>

          <div class="opt-group">
            <span class="opt-label">Skip</span>
            <div class="opt-pills">
              <button v-for="s in state.config.validOptions.skip" :key="s"
                class="pill" :class="{ active: state.skip === s }"
                @click="actions.setFilter('skip', s)">{{ s }}</button>
            </div>
            <div v-if="state.skip !== 'off'" style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
              <span class="opt-label" style="margin: 0;">Adjust</span>
              <input type="number" class="small-input" :value="state.skipAdjust" step="1"
                @change="actions.setFilter('skipAdjust', $event.target.value)">
            </div>
          </div>

          <div class="opt-group">
            <span class="opt-label">Pad</span>
            <div class="btn-group">
              <button v-for="p in state.config.validOptions.pad" :key="p"
                class="btn" :class="{ active: state.pad === p }"
                @click="actions.setFilter('pad', p)">{{ p }}</button>
            </div>
          </div>
        </div>
      </div>
    </details>
  `
}
