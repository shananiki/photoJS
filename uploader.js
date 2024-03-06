const express = require('express');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'albums'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve the HTML page
app.get('/uploader', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Handle file upload
app.post('/upload', upload.single('image'), (req, res) => {
    res.send('File uploaded successfully!');
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
