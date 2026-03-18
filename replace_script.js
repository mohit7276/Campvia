const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    if (!file.match(/\.(ts|html|css|json)$/)) return;

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Case-specific replacements
    content = content.replace(/NEXUS ED/g, 'CAMPVIA');
    content = content.replace(/Nexus Ed/g, 'Campvia');
    content = content.replace(/NEXUS HUB/g, 'CAMPVIA HUB');
    content = content.replace(/Nexus Institute/g, 'Campvia');
    content = content.replace(/Nexus AI/g, 'Campvia AI');

    // Generalized replacements keeping case
    content = content.replace(/NEXUS/g, 'CAMPVIA');
    content = content.replace(/Nexus/g, 'Campvia');
    content = content.replace(/nexus/g, 'campvia');

    // Changing logo 'N' to 'C' in components (very specifically)
    content = content.replace(
        /class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500\/30 group-hover:rotate-12 transition-transform">\s*N\s*<\/div>/g,
        'class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30 group-hover:rotate-12 transition-transform">\n                C</div>'
    );

    content = content.replace(
        /class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500\/30">\s*N\s*<\/div>/g,
        'class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/30">\n                        C</div>'
    );

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
