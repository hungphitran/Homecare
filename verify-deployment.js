const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment readiness...\n');

// Check critical files
const criticalFiles = [
    'index.js',
    'package.json',
    'vercel.json',
    'vercel-build.js',
    'vercel.webpack.config.js'
];

console.log('📁 Checking critical files:');
criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
    } else {
        console.log(`  ❌ ${file} - MISSING!`);
    }
});

// Check critical modules
const criticalModules = [
    'gopd',
    'get-intrinsic',
    'side-channel',
    'qs',
    'path-browserify'
];

console.log('\n📦 Checking critical modules:');
criticalModules.forEach(module => {
    const modulePath = path.join(__dirname, 'node_modules', module);
    if (fs.existsSync(modulePath)) {
        console.log(`  ✅ ${module}`);
        
        // Special check for gopd
        if (module === 'gopd') {
            const gopdPath = path.join(modulePath, 'gOPD.js');
            if (fs.existsSync(gopdPath)) {
                console.log(`    ✅ gOPD.js found`);
            } else {
                console.log(`    ❌ gOPD.js missing`);
            }
        }
    } else {
        console.log(`  ❌ ${module} - MISSING!`);
    }
});

// Check package.json scripts
console.log('\n📋 Checking package.json scripts:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = ['build', 'vercel-build'];
    requiredScripts.forEach(script => {
        if (packageJson.scripts && packageJson.scripts[script]) {
            console.log(`  ✅ ${script} script found`);
        } else {
            console.log(`  ❌ ${script} script missing`);
        }
    });
} catch (error) {
    console.log(`  ❌ Error reading package.json: ${error.message}`);
}

console.log('\n🎯 Deployment verification completed!');
console.log('If all checks pass, you should be ready to deploy to Vercel.');
