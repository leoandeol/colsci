const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3001;

// import components from './components';
const { search: arxivSearch } = require('./components/arxiv');
const { search: dblpSearch }  = require('./components/dblp');

app.use(cors());
app.use(express.json());

const hosts = [
  {
    name: 'DBLP',
    code: 'dblp',
    func: dblpSearch,
  },
  // {
  //   name: 'Google Scholar',
  //   code: 'google_scholar',
  // },
  // {
  //   name: 'Semantic Scholar',
  //   code: 'semantic_scholar',
  // },
  {
    name: "arXiv",
    code: 'arxiv',
    func: arxivSearch,
  }
];


app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  const host = req.query.host;
  console.log(`Searching for: "${query}" on host: ${host}`);

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  if (!host) {
    return res.status(400).json({ error: 'Query parameter "host" is required' });
  }

  try {
    const current_host = hosts.find(h => h.code === host);
    
    if (!current_host) {
      return res.status(400).json({ error: 'Invalid host specified' });
    }

    if (typeof current_host.func !== 'function') {
      return res.status(501).json({ error: `Search function for ${current_host.name} is not implemented yet` });
    }

    // Instead of passing 'res' to the search function, let it return the results
    const results = await current_host.func(query);
    
    // Send the results back to the client
    res.json(results);

  } catch (error) {
    console.error('Error searching for articles:', error);
    console.log('Error searching for articles:', error);
    if (error.response && error.response.status === 501) {
      res.status(501).json({ error: `Search function for ${host} is not fully implemented yet` });
    } else {
      res.status(500).json({ error: 'An error occurred while searching for articles', details: error.message });
    }
  }
});

app.post('/api/save', async (req, res) => {
  try {
    const article = req.body;
    const folderId = crypto.randomBytes(8).toString('hex');
    const folderPath = path.join(__dirname, 'saved_articles', folderId);

    await fs.mkdir(folderPath, { recursive: true });

    // Save article information
    await fs.writeFile(path.join(folderPath, 'info.json'), JSON.stringify(article, null, 2));

    // Save BibTeX file
    if (article.bibtex) {
      await fs.writeFile(path.join(folderPath, 'citation.bib'), article.bibtex);
    }

    // Save PDF file
    if (article.pdfLink) {
      const pdfResponse = await axios.get(article.pdfLink, { responseType: 'arraybuffer' });
      await fs.writeFile(path.join(folderPath, 'paper.pdf'), pdfResponse.data);
    }

    res.json({ success: true, folderId });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ error: 'An error occurred while saving the article', details: error.message });
  }
});

app.get('/api/available-pdfs', async (req, res) => {
  try {
    const savedArticlesPath = path.join(__dirname, 'saved_articles');
    const entries = await fs.readdir(savedArticlesPath, { withFileTypes: true });
    
    const folders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    
    const pdfFiles = await Promise.all(folders.map(async (folder) => {
      try {
        const folderPath = path.join(savedArticlesPath, folder);
        const files = await fs.readdir(folderPath);
        if (files.includes('paper.pdf')) {
          const infoFilePath = path.join(folderPath, 'info.json');
          const infoFileExists = await fs.access(infoFilePath).then(() => true).catch(() => false);
          
          if (infoFileExists) {
            const infoFile = await fs.readFile(infoFilePath, 'utf-8');
            const info = JSON.parse(infoFile);
            return {
              url: `/api/pdf/${folder}/paper.pdf`,
              title: info.title || 'Untitled',
              authors: info.authors || []
            };
          }
        }
      } catch (error) {
        console.error(`Error processing folder ${folder}:`, error);
      }
      return null;
    }));

    const availablePdfs = pdfFiles.filter(pdf => pdf !== null);
    console.log('Available PDFs:', JSON.stringify(availablePdfs, null, 2));
    res.json(availablePdfs);
  } catch (error) {
    console.error('Error listing available PDFs:', error);
    res.status(500).json({ error: 'An error occurred while listing available PDFs', details: error.message });
  }
});


// Serve PDF files
app.use('/api/pdf', express.static(path.join(__dirname, 'saved_articles')));

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});