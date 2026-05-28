const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '../index.html');
const appJsPath = path.join(__dirname, '../static/app.js');

// 1. Fix index.html
if (fs.existsSync(indexHtmlPath)) {
    let content = fs.readFileSync(indexHtmlPath, 'utf8');

    // Rename Tailwind Config keys
    content = content.replace(/"text-light":/g, '"txtlight":');
    content = content.replace(/"text-dark":/g, '"txtdark":');

    // Replace color classes
    content = content.replace(/text-text-light/g, 'text-txtlight');
    content = content.replace(/text-text-dark/g, 'text-txtdark');

    // Add pointer-events-none to the absolute decor divs
    const decor1 = 'class="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 dark:bg-primary-dark/5 rounded-full blur-2xl"';
    const replacement1 = 'class="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 dark:bg-primary-dark/5 rounded-full blur-2xl pointer-events-none"';
    content = content.replace(decor1, replacement1);

    const decor2 = 'class="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 dark:bg-primary-dark/5 rounded-full blur-2xl"';
    const replacement2 = 'class="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 dark:bg-primary-dark/5 rounded-full blur-2xl pointer-events-none"';
    content = content.replace(decor2, replacement2);

    fs.writeFileSync(indexHtmlPath, content, 'utf8');
    console.log('Successfully updated index.html keys, classes, and pointer-events-none.');
} else {
    console.error('index.html not found!');
}

// 2. Fix static/app.js
if (fs.existsSync(appJsPath)) {
    let content = fs.readFileSync(appJsPath, 'utf8');

    // Replace color classes
    content = content.replace(/text-text-light/g, 'text-txtlight');
    content = content.replace(/text-text-dark/g, 'text-txtdark');

    fs.writeFileSync(appJsPath, content, 'utf8');
    console.log('Successfully updated static/app.js classes.');
} else {
    console.error('static/app.js not found!');
}
