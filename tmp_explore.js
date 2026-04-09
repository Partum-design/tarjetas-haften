const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

let files = [];
walkDir(path.join(__dirname, 'fotos'), (filePath) => {
    files.push(filePath);
});

fs.writeFileSync('tmp_photo_list.txt', files.join('\n'));
console.log('Saved to tmp_photo_list.txt');
