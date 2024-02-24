const p = require('path');
const _ = require('lodash');
const extractDmg = require("extract-dmg");

(async () => {
	const args = process.argv.slice(2);  
	const appPath = args[0]
	const extractDir = args[1]
	const extractFolder = 'woa-size-' + _.random(0, 1000).toString()
	const dist = p.join(extractDir, extractFolder)
	const b = await extractDmg(appPath, dist); // Extract and get contents
	console.log(p.join(dist, b[b.length-1]))
})()