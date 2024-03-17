import * as fs from 'fs'
import * as path from 'path'
import _ from 'lodash'


import { app } from 'electron'
import * as asar from '@electron/asar'
import { spawn, exec } from 'child_process'
import log from 'electron-log/main';
const iconv = require('iconv-lite');


log.info(app.getAppPath())

const isMac = process.platform === 'darwin'

let scriptPath = path.join(app.getAppPath(), '..', `/app/script/mac.js`)
if (!app.isPackaged) {
  scriptPath = `script/mac.js`
}

// const path1 = './dist1/app.asar.unpacked/node_modules'
// const pathA = './dist2/app.asar.unpacked/node_modules'

// const path1 = './dist1/asar/node_modules'
// const pathA = './dist2/asar/node_modules'

// const winPath1 = 'C:\\Users\\kingsoft\\AppData\\Local\\Programs\\xiezuo\\resources\\app.asar.unpacked\\node_modules'
// const winPath2 = 'C:\\Users\\kingsoft\\AppData\\Local\\Programs\\WOA\\resources\\app.asar.unpacked\\node_modules'

// const winPath3 = './dist1/node_modules'
// const winPath4 = './dist2/node_modules'

// const dllPath1 = 'C:\\Users\\kingsoft\\AppData\\Local\\Programs\\xiezuo'
// const dllPath2 = 'C:\\Users\\kingsoft\\AppData\\Local\\Programs\\WOA'

async function gen(p, filterDir = false) {
  const getFolderSize = (await import("get-folder-size")).default;

  const map =new Map()
  const pkgs: string[] = []
  const files = fs.readdirSync(p)
  let dirs = files.map(item => {
    return path.join(p, item)
  })

  if (filterDir)
    dirs = dirs.filter(dir => !fs.lstatSync(dir).isDirectory())

  const ps = dirs.map(dir => getFolderSize(dir))

  const pss = await Promise.all(ps)

  dirs.forEach((item, i) => {
    const arr = item.split(path.sep)
    const pkg = arr[arr.length-1]
  
    pkgs.push(pkg)
    map.set(pkg, (pss[i].size/1000/1000).toFixed(2))
  })

  return { map, pkgs, size: _.sum(pss.map(item => item.size)) }
}


function fixed(a) {
  return (a/1000/1000).toFixed(2)
}

export const compareAsar = async (path1: string, path2: string) => {
  const path11 = path.join(path1, '/Resources/app.asar')
  const path22 = path.join(path2, '/Resources/app.asar')
  const dist11 = randomDist()
  log.info('compareAsar dist 1 ', dist11 )
  asar.extractAll(path11, dist11)
  const dist22 = randomDist()
  log.info('compareAsar dist 2 ', dist22 )
  asar.extractAll(path22, dist22) 

  return compare(path.join(dist11, 'node_modules'), path.join(dist22, 'node_modules'))
}

export const compareAsArUnpacked = async(path1: string, path2: string) => {

  const path11 = path.join(path1, '/Resources/app.asar.unpacked/node_modules')
  const path22 = path.join(path2, '/Resources/app.asar.unpacked/node_modules')

  return compare(path11, path22)
}

const sleep = (ms: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const compare = async (path1: string, path2: string, filterDir: boolean = false) => {

  return await Promise.all([gen(path1, filterDir), gen(path2, filterDir)]).then(([a, b]) => {
    // console.log(a.pkgs)
    // console.log(b.pkgs)
  
    // console.log(_.difference(a.pkgs, b.pkgs))
    // console.log('total ', fixed(a.size)+'MB', fixed(b.size)+'MB');

    const r1 = 'total size '+ fixed(a.size)+'MB ' +fixed(b.size)+'MB'
  
    // console.log(a.pkgs.length, b.pkgs.length)
  
    // console.log(_.intersection(a.pkgs, b.pkgs))
  
    const common = _.intersection(a.pkgs, b.pkgs)
    // console.error('total: ', a.pkgs.length, b.pkgs.length)
    // console.error('common: ', common.length);

    const r2 = 'total  ' + a.pkgs.length + b.pkgs.length
    const r3 = 'common: ' + common.length
  
    let desc: { text: string, diff:number }[] = []
  
    let descDiffA: { text: string; diff: any; }[] = []
    let descDiffB: { text: string; diff: any; }[] = []
  
    common.forEach(pkg => {
      // console.log(pkg, 'size => ',a.map.get(pkg)+'MB ', b.map.get(pkg) + 'MB ')
      desc.push({ text: pkg + ' size => ' + a.map.get(pkg)+'MB ' + b.map.get(pkg) + 'MB ', diff: Math.abs(a.map.get(pkg) - b.map.get(pkg))})
    })
  
    const diffA = a.pkgs.filter(p => !common.includes(p))
    // console.log(`\n==== ${path1}: `, diffA.length);
    diffA.forEach(pkg => {
      descDiffA.push({ text: pkg + ' size => ' + a.map.get(pkg)+'MB ', diff:  a.map.get(pkg) })
    })
    descDiffA.sort((a, b) =>  b.diff - a.diff)
    // descDiffA.length && descDiffA.forEach(item => console.log(item.text))

    const r4 = descDiffA.join('\n')
    // console.log(`==== ${path1}: end\n`);
  
  
    const diffB = b.pkgs.filter(p => !common.includes(p))
    // console.log(`\n${path2}: `, diffB.length);
    diffB.forEach(pkg => {
      descDiffB.push({ text: pkg + ' size => ' + b.map.get(pkg) + 'MB ', diff: b.map.get(pkg) })
    })
    descDiffB.sort((a, b) =>  b.diff - a.diff)
    // diffB.length && descDiffB.forEach(item => console.log(item.text))
    const r5 = descDiffB.join('\n')
    // console.log(`==== ${path2}: end\n`);
  
  
    desc.sort((a, b) =>  b.diff - a.diff)
    
    // console.log("=== common start")
    // desc.forEach(item => console.log(item.text))

    const r6 = desc.map(item=> item.text).join('\n')
    // console.log("=== common end")
    
    return { result: r6 + '\n' + r1 + '\n' + r2 + '\n' + r3 + '\n' + r4 + '\n' + r5 + '\n' + r6 }
  })
}
// console.log('包总数 ', result1.pkgs.length, resultA.pkgs.length)

const random = () => _.random(0, 1000).toString()
const randomDist = () => path.join(app.getPath('temp'), 'woa-size-' + random())

export const extractPkgs = async (path1: string, path2: string) => {

  console.log('isMac: ', isMac);
  if(isMac) {
    try {
      const job1: Promise<string> = new Promise((resolve, reject) => {
        const dist = randomDist()
        log.info('extractPkgs 1 ', dist)
        fs.mkdirSync(dist)
        const childProcess = spawn('/usr/local/bin/node', [scriptPath, path1, dist], { env: { PATH: process.env.PATH }, shell: true })
        childProcess.stdout.on('data', (data) => {  
          resolve(data.toString().replaceAll('\n', ''))
        });
        childProcess.stderr.on('data', (data) => {  
          reject(data.toString())
          log.error(iconv.decode(data.toString(), 'cp936'))
        });  
      })
  
      await sleep(500)
  
      const job2: Promise<string> = new Promise((resolve, reject) => {
        const dist = randomDist()
        log.info('extractPkgs 2 ', dist)
        fs.mkdirSync(dist)
        const childProcess1 = spawn('/usr/local/bin/node', [scriptPath, path2, dist], { env: { PATH: process.env.PATH }, shell: true })
        childProcess1.stdout.on('data', (data) => {  
          resolve(data.toString().replaceAll('\n', ''))
        });
        childProcess1.stderr.on('data', (data) => {  
          reject(data.toString())
          log.error(iconv.decode(data.toString(), 'cp936'))
        });
      })
  
      const result = await Promise.all([job1, job2])
      // const [p1, p2] = result
      // console.log('result: ', result);
      // const r1 = await compareAsar(p1, p2)
      // const r2 = await compareAsArUnpacked(path1, path2)
  
      return result
    } catch(e) {
      // console.error(e)
      return '操作失败'
    }
  } else {
    let zipExe = ''
    if (app.isPackaged) {
      zipExe = path.join(app.getAppPath(), '..', 'app\\script\\7z.exe')
      log.info('zip exe path', zipExe)
    } else {
      zipExe = 'script\\7z.exe'
    }
    console.log('zipExe: ', zipExe);
    try {
      const p1 = new Promise((resolve) => {
        const extractDir = path.join(path1, '..', _.random(0, 10000).toString())
        console.log('extractDir: ', extractDir);
        const appZipPath = path.join(extractDir, 'app.7z')
        console.log('appZipPath: ', appZipPath);
  
        fs.mkdirSync(extractDir)
  
        const command1 = zipExe + ' x -y -o' + extractDir + ' ' + `"${path1}"`
        console.log('command1: ', command1);
        exec(command1, (err) => {
          console.log('err1: ', err);
          const command2 = zipExe + ' x -y -o' + extractDir + ' ' + appZipPath
          console.log('command2: ', command2);
          exec(command2,  (err) => {
            console.log('err2: ', err);
            resolve(extractDir)
          })
        })
      })

      await sleep(500)

      const p2 = new Promise((resolve) => {
        const extractDir = path.join(path1, '..', _.random(0, 10000).toString())
        console.log('extractDir: ', extractDir);
        const appZipPath = path.join(extractDir, 'app.7z')
        console.log('appZipPath: ', appZipPath);
  
        fs.mkdirSync(extractDir)
  
        const command1 = zipExe + ' x -y -o' + extractDir + ' ' + `"${path2}"`
        console.log('command1: ', command1);
        exec(command1, (err) => {
          console.log('err1: ', err);
          const command2 = zipExe + ' x -y -o' + extractDir + ' ' + appZipPath
          console.log('command2: ', command2);
          exec(command2,  (err) => {
            console.log('err2: ', err);
            resolve(extractDir)
          })
        })
      })

      const result = await Promise.all([p1, p2])
      console.log('result: ', result);

      return result
    } catch(e) {
      log.info('extractPkgs err ', iconv.decode(e, 'cp936'))
      return e
    }
  }



}

export const compare_pkgs_asar = async (paths: string[]) => {
  try {
    const [path1, path2] = paths
    const r1 = await compareAsar(path1, path2)
    return r1
  } catch(e) {
    return '操作失败'
  }
}

export const compare_pkgs_asar_unpacked = async (paths: string[]) => {
  try {
    const [path1, path2] = paths
    const r1 = await compareAsArUnpacked(path1, path2)
    return r1
  } catch(e) {
    return '操作失败'
  }
}

// export const extractPkg = async (pkgPath: string) => {
//   console.log('path: ', pkgPath);
//   const extractDmg = require("extract-dmg");
//   // const tempPath = app.getPath('temp')
//   // const target = path.resolve(tempPath, Date.now().toString())
//   // const target1 = path.resolve(__dirname, Date.now().toString())
//   // console.log('tempPath: ', tempPath);
//   const r = await extractDmg(pkgPath, '/Users/zouyifeng/Documents/Project/myself/practice-electron/dmg-extract/extractDir')
//   console.log('r: ', r);
// }