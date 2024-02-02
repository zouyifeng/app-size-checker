import getFolderSize from 'get-folder-size';
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

// const path1 = './dist1/app.asar.unpacked/node_modules'
// const pathA = './dist2/app.asar.unpacked/node_modules'

const path1 = './dist1/asar/node_modules'
const pathA = './dist2/asar/node_modules'

async function gen(p) {
  const map =new Map()
  const pkgs = []
  const files = fs.readdirSync(p)
  let dirs = files.map(item => {
    return path.join(p, item)
  })
  
  const ps = dirs.map(dir => getFolderSize(dir))

  const pss = await Promise.all(ps)

  dirs.forEach((item, i) => {
    const arr = item.split('/')
    const pkg = arr[arr.length-1]
  
    pkgs.push(pkg)
    map.set(pkg, (pss[i].size/1000/1000).toFixed(2))
  })


  return { map, pkgs, size: _.sum(pss.map(item => item.size)) }
}

Promise.all([gen(path1), gen(pathA)]).then(([a, b]) => {
  // console.log(a.pkgs)
  // console.log(b.pkgs)

  // console.log(_.difference(a.pkgs, b.pkgs))
  console.log('total ', fixed(a.size)+'MB', fixed(b.size)+'MB');

  // console.log(a.pkgs.length, b.pkgs.length)

  // console.log(_.intersection(a.pkgs, b.pkgs))

  const common = _.intersection(a.pkgs, b.pkgs)
  console.error('total: ', a.pkgs.length, b.pkgs.length)
  console.error('common: ', common.length);


  let desc = []

  let descDiffA = []
  let descDiffB = []

  common.forEach(pkg => {
    // console.log(pkg, 'size => ',a.map.get(pkg)+'MB ', b.map.get(pkg) + 'MB ')
    desc.push({ text: pkg + ' size => ' + a.map.get(pkg)+'MB ' + b.map.get(pkg) + 'MB ', diff: Math.abs(a.map.get(pkg) - b.map.get(pkg))})
  })

  const diffA = a.pkgs.filter(p => !common.includes(p))
  console.log('\n==== diffA: ', diffA.length);
  diffA.forEach(pkg => {
    descDiffA.push({ text: pkg + ' size => ' + a.map.get(pkg)+'MB ' + b.map.get(pkg) + 'MB ', diff:  a.map.get(pkg) })
  })
  descDiffA.sort((a, b) =>  b.diff - a.diff)
  descDiffA.length && descDiffA.forEach(item => console.log(item.text))
  console.log('==== diffA: end\n');


  const diffB = b.pkgs.filter(p => !common.includes(p))
  console.log('\ndiffB: ', diffB.length);
  diffB.forEach(pkg => {
    descDiffB.push({ text: pkg + ' size => ' + b.map.get(pkg) + 'MB ', diff: b.map.get(pkg) })
  })
  descDiffB.sort((a, b) =>  b.diff - a.diff)
  diffB.length && descDiffB.forEach(item => console.log(item.text))
  console.log('==== diffB: end\n\n');


  desc.sort((a, b) =>  b.diff - a.diff)
  
  console.log("=== common start")
  desc.forEach(item => console.log(item.text))
  console.log("=== common end")

})

function fixed(a) {
  return (a/1000/1000).toFixed(2)
}

// console.log('包总数 ', result1.pkgs.length, resultA.pkgs.length)


