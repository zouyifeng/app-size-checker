import fs from 'fs'
import plist from 'simple-plist'
import { MacosAppInfo } from './types'

export async function readdirSafe(p: string) {
  try {
    return await fs.promises.readdir(p)
  } catch (err) {
    console.error(err)
    return []
  }
}

export async function readFileSafe(p: string) {
  try {
    return await fs.promises.readFile(p, { encoding: 'utf8' })
  } catch (err) {
    console.error(err)
    return ''
  }
}

export async function readFileAsBufferSafe(p: string) {
  try {
    return await fs.promises.readFile(p)
  } catch (err) {
    console.error(err)
    return
  }
}

export async function readPlistFile(path: string): Promise<MacosAppInfo> {
  return new Promise((resolve, reject) => {
    plist.readFile<MacosAppInfo>(path, (error, data) => {
      // console.log(error, data)

      if (error || !data) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}
