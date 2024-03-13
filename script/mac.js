const p = require('path');
const extractDmg = require("extract-dmg");

(async () => {
	const args = process.argv.slice(2);  
	const appPath = args[0]
	const dist = args[1]
	const b = await extractDmg(appPath, dist); // Extract and get contents
	console.log(p.join(dist, b[b.length-1]))
})()