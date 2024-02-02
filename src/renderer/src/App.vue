<script setup lang="ts">
import Versions from './components/Versions.vue'
import { compact } from 'lodash'
import { ref } from 'vue'

const ipcHandle = () => window.electron.ipcRenderer.send('ping')

const apps = ref([])

const getApps = () => window.electron.ipcRenderer.invoke('get_apps')

getApps().then((items) => {
  apps.value = compact(items)
})
</script>

<template>
  <div class="flex flex-wrap">
    <div
      v-for="app in apps"
      class="flex items-center justify-center flex-col w-30 h-30"
    >
      <img :src="app.icon" class="w-14 h-14" salt="" />
      <div class="text-white text-center text-xs">{{ app.name }}</div>
    </div>
  </div>
</template>
