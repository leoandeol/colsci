const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());

// Serve static files from the 'pdfs' directory
const pdfDirectory = path.join(__dirname, 'pdfs');

// Ensure the 'pdfs' directory exists
if (!fs.existsSync(pdfDirectory)){
    fs.mkdirSync(pdfDirectory, { recursive: true });
}

app.use('/pdfs', express.static(pdfDirectory));

app.get('/', (req, res) => {
  res.send('PDF Viewer Backend');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});