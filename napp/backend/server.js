// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = 5000;

app.use(cors());
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

app.get('/', (req, res) => {
    res.send('PDF Viewer Backend');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
