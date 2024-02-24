const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const albumsPath = path.join(__dirname, 'albums');
const photos = getPhotos();

// Function to get all photo file paths inside the albums directory
function getPhotos() {
    return fs.readdirSync(albumsPath)
        .map(file => path.join(albumsPath, file));
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/photoviewer', (req, res) => {
    if (photos.length === 0) {
        res.send('No photos found.');
        return;
    }
    res.sendFile(photos[0]);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

let currentIndex = 0;

function updateIndex(offset) {
    currentIndex = (currentIndex + offset + photos.length) % photos.length;
}

app.get('/next', (req, res) => {
    updateIndex(1);
    res.sendFile(photos[currentIndex]);
});

app.get('/prev', (req, res) => {
    updateIndex(-1);
    res.sendFile(photos[currentIndex]);
});
