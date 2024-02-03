<script setup lang="ts">
import { compact } from 'lodash'
import { ref } from 'vue'
import type { Ref } from 'vue'
import unknownIcon from './assets/unknown.svg'
import { AppInfo } from './types'

const apps: Ref<AppInfo[]> = ref([])

const getApps = () => window.electron.ipcRenderer.invoke('get_apps')

const r1: Ref<{ result: string }> = ref({ result: '' })
const r2: Ref<{ result: string }> = ref({ result: '' })

const compare = () => {
  if (selectApps.value.length === 2) {
    window.electron.ipcRenderer.invoke('compare', selectApps.value.map(app => app.basePath)).then(res => {
      r1.value = res
    })
  }
}


const compareAsar = () => {
  if (selectApps.value.length === 2) {
    window.electron.ipcRenderer.invoke('compare_asar', selectApps.value.map(app => app.basePath)).then(res => {
      r2.value = res
    })
  }
}


getApps().then((items) => {
  apps.value = compact(items)
})

const selectApps: Ref<AppInfo[]> = ref([])

const selectApp = (app) => {
  console.log('app: ', app);
  selectApps.value.unshift(app)
  if (selectApps.value.length > 2) {
    selectApps.value.length = 2
  }
}
</script>

<template>
  <div class="flex flex-wrap">
    <div
      v-for="app in apps"
      @click="selectApp(app)"
      class=" w-30 h-30 flex items-center justify-center flex-col mb-6"
    >
      <img :src="app.icon || unknownIcon" class="w-14 h-14" salt="" />
      <div class="text-white text-center text-xs">{{ app.name }}</div>
    </div>
  </div>
  <div class="font-bold mt-2">SELECT APPS </div>
  <div class="mt-2">{{ selectApps[0] && selectApps[0].name }}</div>
  <div>{{ selectApps[0] && selectApps[0].exePath }}</div>

  <div class="mt-2">{{ selectApps[1] && selectApps[1].name }}</div>
  <div>{{ selectApps[1] && selectApps[1].exePath }}</div>
  
  <div class="font-bold mt-10"> COMPARE APP.ASAR.UNPACKED</div>
  <div class="p-1 rounded mt-2 radius-1 w-20 text-center cursor-pointer bg-slate-700"  @click="compare">compare</div>

  <div class="font-bold mt-2"></div>
  <pre class="max-h-64 overflow-y-auto">{{ r1.result }}</pre>

  <div class="font-bold mt-10">COMPARE APP.ASAR</div>
  <div class="p-1 rounded mt-2 radius-1 w-20 text-center cursor-pointer bg-slate-700"  @click="compareAsar">compare</div>
  <pre class="max-h-64 overflow-y-auto">{{ r2.result }}</pre>

</template>
