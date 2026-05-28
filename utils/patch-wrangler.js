const fs = require('fs');
const path = require('path');

const wranglerBinPath = path.join(__dirname, '../node_modules/wrangler/bin/wrangler.js');

if (fs.existsSync(wranglerBinPath)) {
    let content = fs.readFileSync(wranglerBinPath, 'utf8');
    
    const target = '...process.argv.slice(2),';
    const replacement = `...((() => {
			const args = process.argv.slice(2);
			if (args.length > 0 && args[0] === 'deploy') {
				console.log('--- Custom Antigravity Wrangler Shim Intercepted: wrangler deploy -> wrangler pages deploy dist ---');
				return ['pages', 'deploy', 'dist'];
			}
			return args;
		})()),`;

    if (content.includes(target) && !content.includes('Custom Antigravity Wrangler Shim')) {
        content = content.replace(target, replacement);
        fs.writeFileSync(wranglerBinPath, content, 'utf8');
        console.log('Successfully patched wrangler.js to intercept deploy command for Pages.');
    } else {
        console.log('Wrangler is already patched or target pattern was not found.');
    }
} else {
    console.log('Wrangler bin file not found at: ' + wranglerBinPath);
}
