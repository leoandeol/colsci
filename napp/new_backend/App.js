const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const DBLP_SEARCH_API = 'https://dblp.org/search/publ/api';

const parseXML = async (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

function generateBibTexUrl(url) {
  return `${url}.bib?param=1`;
}

function findPdfLink(info) {
  if (info.ee) {
    for (let link of info.ee) {
      if (typeof link === 'object' && link.$['data-type'] === 'pdf') {
        return link._;
      } else if (typeof link === 'string' && link.endsWith('.pdf')) {
        return link;
      }
    }
  }
  return null;
}

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log(`Searching for: "${query}"`);
    const response = await axios.get(DBLP_SEARCH_API, {
      params: {
        q: query,
        format: 'xml',
        h: 10 // Limit to 10 results
      }
    });

    const parsed = await parseXML(response.data);
    const hits = parsed.result.hits[0];
    const results = hits.hit || [];

    console.log(`Found ${results.length} results`);

    const articles = results.map(hit => {
      const info = hit.info[0];
      const url = info.url ? info.url[0] : (info.ee ? info.ee[0] : null);
      const pdfLink = findPdfLink(info);
      
      const articleInfo = {
        id: hit.$.id,
        title: info.title ? info.title[0] : 'N/A',
        authors: info.authors ? info.authors[0].author.map(a => a._) : [],
        year: info.year ? info.year[0] : 'N/A',
        venue: info.venue ? info.venue[0] : 'N/A',
        type: info.type ? info.type[0] : 'N/A',
        doi: info.doi ? info.doi[0] : null,
        url: url,
        bibtexUrl: url ? generateBibTexUrl(url) : null,
        pdfLink: pdfLink
      };

      console.log('Paper Details:');
      console.log(JSON.stringify(articleInfo, null, 2));
      console.log('---');

      return articleInfo;
    });

    console.log('Sending response with articles:', articles.length);
    res.json({
      articles,
      totalResults: parseInt(hits.$.total, 10)
    });
  } catch (error) {
    console.error('Error fetching data from DBLP:', error);
    res.status(500).json({ error: 'An error occurred while fetching data', details: error.message });
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
    if (article.bibtexUrl) {
      const bibtexResponse = await axios.get(article.bibtexUrl);
      await fs.writeFile(path.join(folderPath, 'citation.bib'), bibtexResponse.data);
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

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});