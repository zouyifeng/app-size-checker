<script setup lang="ts">
import { compact } from 'lodash'
import { ref, toRaw } from 'vue'
import type { Ref } from 'vue'
import unknownIcon from './assets/unknown.svg'
import { AppInfo, Pkg } from './types'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const toast = (text) => {
  Toastify({
    text,
    style: {
      background: 'linear-gradient(to right, #00b09b, #96c93d)'
    }
  }).showToast()
}

const invoke = window.electron.ipcRenderer.invoke

const apps: Ref<AppInfo[]> = ref([])

const compareFromApps: Ref<boolean> = ref(false)
const extractSuccess: Ref<boolean> = ref(false)
const pkgsExtractPath: Ref<string[]> = ref([])

const getApps = () => invoke('get_apps')

const r1: Ref<{ result: string }> = ref({ result: '' })
const r2: Ref<{ result: string }> = ref({ result: '' })
const r3: Ref<{ result: string }> = ref({ result: '' })
const r4: Ref<{ result: string }> = ref({ result: '' })
const r5: Ref<{ result: string }> = ref({ result: '' })

const compare = () => {
  if (selectApps.value.length === 2) {
    toast('正在对比，请稍等')
    invoke(
      'compare',
      selectApps.value.map((app) => app.basePath)
    ).then((res) => {
      r1.value = res
      toast('对比成功')
    })
  } else {
    toast('请选择两个协作应用')
  }
}

const compareAsar = () => {
  if (selectApps.value.length === 2) {
    toast('正在对比，请稍等')
    invoke(
      'compare_asar',
      selectApps.value.map((app) => app.basePath)
    ).then((res) => {
      r2.value = res
      toast('对比成功')
    })
  } else {
    toast('请选择两个协作应用')
  }
}

const compareDLL = () => {
  if (selectApps.value.length === 2) {
    toast('正在对比，请稍等')
    invoke(
      'compare_dll',
      selectApps.value.map((app) => app.basePath)
    ).then((res) => {
      r3.value = res
      toast('对比成功')
    })
  }
}

const extractPkgs = () => {
  if (selectPkgs.value.length === 2 && !extractSuccess.value) {
    toast('解压中，请稍等')
    invoke(
      'extract_pkgs',
      selectPkgs.value.map((app) => app.path)
    ).then((res) => {
      console.error(res)
      if (res && res.length === 2) {
        extractSuccess.value = true
        pkgsExtractPath.value = res
        toast('解压成功')
      } else {
        toast(res)
      }
    })
  }
}

getApps().then((items) => {
  apps.value = compact(items)
})

const selectApps: Ref<AppInfo[]> = ref([])

const selectApp = (app) => {
  selectApps.value.unshift(app)
  if (selectApps.value.length > 2) {
    selectApps.value.length = 2
  }
}

const input = ref(null)
const selectPkg = () => {
  if (input.value) {
    ;(input.value as HTMLInputElement).click()
  }
}

const selectPkgs: Ref<Pkg[]> = ref([])

const selectFile = (e) => {
  const file = e.target.files[0]
  selectPkgs.value.unshift({
    path: file.path,
    size: file.size
  })
  if (selectPkgs.value.length > 2) {
    selectPkgs.value.length = 2
  }
}

const kb2mb = (size) => {
  return (size / 1024 / 1024).toFixed(2)
}

const comparePkgsAsar = () => {
  toast('对比中，请稍等')
  invoke('compare_pkgs_asar', toRaw(pkgsExtractPath.value)).then((res) => {
    if (res) {
      r4.value = res
      toast('对比成功')
    }
  })
}

const comparePkgsAsarUnpacked = () => {
  toast('对比中，请稍等')
  invoke('compare_pkgs_asar_unpacked', toRaw(pkgsExtractPath.value)).then((res) => {
    if (res) {
      r5.value = res
      toast('对比成功')
    }
  })
}
</script>

<template>
  <div class="select-none">
    <div class="flex text-base text-white text-center mb-10 w-full">
      <div
        class="bg-slate-700 rounded py-2 w-1/2 cursor-pointer mr-10"
        :class="{ underline: compareFromApps }"
        @click="compareFromApps = true"
      >
        从已有应用中对比
      </div>
      <div
        class="bg-slate-700 rounded py-2 w-1/2 cursor-pointer"
        :class="{ underline: !compareFromApps }"
        @click="compareFromApps = false"
      >
        从已有安装包对比
      </div>
    </div>
    <!-- 从已有应用中对比 -->
    <div v-show="compareFromApps">
      <div class="flex flex-wrap">
        <div
          v-for="app in apps"
          @click="selectApp(app)"
          class="w-30 h-30 flex items-center justify-center flex-col mb-6"
        >
          <img :src="app.icon || unknownIcon" class="w-14 h-14" salt="" />
          <div class="text-white text-center text-xs">{{ app.name }}</div>
        </div>
      </div>
      <div class="font-bold mt-2 text-lg">选择已安装应用（{{ selectApps.length }}）</div>
      <div class="mt-2">{{ selectApps[0] && selectApps[0].name }}</div>
      <div>{{ selectApps[0] && selectApps[0].exePath }}</div>
      <div class="mt-2">{{ selectApps[1] && selectApps[1].name }}</div>
      <div>{{ selectApps[1] && selectApps[1].exePath }}</div>

      <div class="mt-4" v-if="selectApps.length === 2">
        <button
          class="p-1 rounded mr-2 radius-1 px-2.5 text-center cursor-pointer bg-slate-700"
          @click="compare"
        >
          对比 app.asar.unpacked
        </button>
        <button
          class="p-1 rounded mr-2 radius-1 px-2.5 text-center cursor-pointer bg-slate-700"
          @click="compareAsar"
        >
          对比 app.asar
        </button>
        <button
          class="p-1 rounded mr-2 radius-1 px-2.5 text-center cursor-pointer bg-slate-700"
          @click="compareDLL"
        >
          对比 DLL
        </button>
      </div>

      <div v-if="r1.result" class="font-bold mt-10 text-lg">app.asar.unpacked 对比结果</div>
      <pre v-if="r1.result" class="max-h-64 overflow-y-auto">{{ r1.result }}</pre>

      <div v-if="r2.result" class="font-bold mt-10 text-lg">app.asar 对比结果</div>
      <pre v-if="r2.result" class="max-h-64 overflow-y-auto">{{ r2.result }}</pre>

      <div v-if="r3.result" class="font-bold mt-10 text-lg">DLL 对比结果</div>
      <pre v-if="r3.result" class="max-h-64 overflow-y-auto">{{ r3.result }}</pre>
    </div>
    <!-- 从已有安装包中对比 -->
    <div v-show="!compareFromApps">
      <div class="flex text-white text-base text-center">
        <div class="rounded bg-slate-700 p-1 px-2.5 cursor-pointer mr-4" @click="selectPkg">
          选择安装包
        </div>
        <button
          class="rounded bg-slate-700 p-1 text-white px-2.5 cursor-pointer"
          v-if="selectPkgs.length === 2 && !extractSuccess"
          @click="extractPkgs"
        >
          解压
        </button>
        <button
          class="rounded bg-slate-700 p-1 text-white px-2.5 mr-4 cursor-pointer"
          v-if="extractSuccess"
          @click="comparePkgsAsar"
        >
          对比 app.asar
        </button>
        <button
          class="rounded bg-slate-700 p-1 text-white px-2.5 cursor-pointer"
          v-if="extractSuccess"
          @click="comparePkgsAsarUnpacked"
        >
          对比 app.asar.unpacked
        </button>
      </div>

      <input class="hidden" type="file" ref="input" @change="selectFile" />

      <div v-if="selectPkgs.length" class="mt-10 text-lg font-bold">已选安装包:</div>
      <div v-for="(item, index) in selectPkgs">
        <div class="mt-1">{{ index + 1 }}.</div>
        <div>位置: {{ item.path }}</div>
        <div>大小: {{ kb2mb(item.size) }} MB</div>
      </div>

      <div v-if="r4.result" class="font-bold mt-10 text-lg">app.asar 对比结果</div>
      <pre v-if="r4.result" class="max-h-64 overflow-y-auto">{{ r4.result }}</pre>

      <div v-if="r5.result" class="font-bold mt-10 text-lg">app.asar.unpacked 对比结果</div>
      <pre v-if="r5.result" class="max-h-64 overflow-y-auto">{{ r5.result }}</pre>
    </div>
  </div>
</template>
