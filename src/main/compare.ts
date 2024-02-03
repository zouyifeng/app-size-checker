import fs from 'fs'
import path from 'path'
import _ from 'lodash'

import { app } from 'electron'
import asar from '@electron/asar'

console.log(app.getPath('temp'))


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

async function gen(p) {
  const getFolderSize = (await import("get-folder-size")).default;

  const map =new Map()
  const pkgs: string[] = []
  const files = fs.readdirSync(p)
  let dirs = files.map(item => {
    return path.join(p, item)
  })
  
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
  const path11 = path.join(path1, '/Contents/Resources/app.asar')
  const path22 = path.join(path2, '/Contents/Resources/app.asar')
  const dist11 = path.join(app.getPath('temp'), 'check1')
  asar.extractAll(path11, dist11)
  const dist22 = path.join(app.getPath('temp'), 'check2')
  asar.extractAll(path22, dist22) 

  return compare(path.join(dist11, 'node_modules'), path.join(dist22, 'node_modules'))
}

export const compareAsArUnpacked = async(path1: string, path2: string) => {

  const path11 = path.join(path1, '/Contents/Resources/app.asar.unpacked/node_modules')
  const path22 = path.join(path2, '/Contents/Resources/app.asar.unpacked/node_modules')

  return compare(path11, path22)
}

export const compare = async (path1: string, path2: string) => {

  return await Promise.all([gen(path1), gen(path2)]).then(([a, b]) => {
    // console.log(a.pkgs)
    // console.log(b.pkgs)
  
    // console.log(_.difference(a.pkgs, b.pkgs))
    // console.log('total ', fixed(a.size)+'MB', fixed(b.size)+'MB');

    const r1 = 'total size '+ fixed(a.size)+'MB ' +fixed(b.size)+'MB'
  
    // console.log(a.pkgs.length, b.pkgs.length)
  
    // console.log(_.intersection(a.pkgs, b.pkgs))
  
    const common = _.intersection(a.pkgs, b.pkgs)
    console.error('total: ', a.pkgs.length, b.pkgs.length)
    console.error('common: ', common.length);

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
    descDiffA.length && descDiffA.forEach(item => console.log(item.text))

    const r4 = descDiffA.join('\n')
    // console.log(`==== ${path1}: end\n`);
  
  
    const diffB = b.pkgs.filter(p => !common.includes(p))
    // console.log(`\n${path2}: `, diffB.length);
    diffB.forEach(pkg => {
      descDiffB.push({ text: pkg + ' size => ' + b.map.get(pkg) + 'MB ', diff: b.map.get(pkg) })
    })
    descDiffB.sort((a, b) =>  b.diff - a.diff)
    diffB.length && descDiffB.forEach(item => console.log(item.text))
    const r5 = descDiffB.join('\n')
    // console.log(`==== ${path2}: end\n`);
  
  
    desc.sort((a, b) =>  b.diff - a.diff)
    
    // console.log("=== common start")
    desc.forEach(item => console.log(item.text))

    const r6 = desc.map(item=> item.text).join('\n')
    // console.log("=== common end")
    
    return { result: r1 + '\n' + r2 + '\n' + r3 + '\n' + r4 + '\n' + r5 + '\n' + r6 }
  })
}
// console.log('包总数 ', result1.pkgs.length, resultA.pkgs.length)


