const fs = require('fs');
const path = require('path');

console.log('Starting Vercel build process...');

// Ensure critical modules are available
const criticalModules = [
    'gopd',
    'get-intrinsic', 
    'side-channel',
    'qs'
];

console.log('Checking critical modules...');
criticalModules.forEach(module => {
    const modulePath = path.join(__dirname, 'node_modules', module);
    if (fs.existsSync(modulePath)) {
        console.log(`✓ ${module} found at ${modulePath}`);
        
        // Check if gOPD.js exists in gopd module
        if (module === 'gopd') {
            const gopdPath = path.join(modulePath, 'gOPD.js');
            if (fs.existsSync(gopdPath)) {
                console.log(`✓ gOPD.js found in gopd module`);
            } else {
                console.log(`✗ gOPD.js NOT found in gopd module`);
            }
        }
    } else {
        console.log(`✗ ${module} NOT found`);
    }
});

console.log('Vercel build process completed.');
