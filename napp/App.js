const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { search } = require('@rpidanny/google-scholar');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

function extractPaperId(relatedArticlesUrl) {
  const match = relatedArticlesUrl.match(/related:(.*?):scholar/);
  return match ? match[1] : null;
}

function generateCitationUrl(paperId) {
  return `https://scholar.google.com/scholar?q=info:${paperId}:scholar.google.com/&output=cite&scirp=0&hl=en`;
}

// Function to fetch and extract BibTeX link from the citation URL
async function fetchBibTeXLink(citationUrl) {
  try {
    // Fetch the HTML content of the citation page
    const response = await axios.get(citationUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Assuming the BibTeX link is in an anchor tag with some identifiable class or text
    const bibtexLink = $('a[href*="scholar.bib"]').attr('href');

    if (!bibtexLink) {
      throw new Error('BibTeX link not found on the citation page');
    }

    // Google Scholar links are often relative, so construct the full URL
    const fullBibtexLink = new URL(bibtexLink, citationUrl).href;
    return fullBibtexLink;
  } catch (error) {
    console.error('Error fetching BibTeX:', error.message);
    throw new Error('Failed to load or parse BibTeX link');
  }
}

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log(`Searching for: "${query}"`);
    const searchOpts = {
      keywords: query,
      yearLow: 1950,
      yearHigh: new Date().getFullYear(),
    };

    const results = await search(searchOpts);
    console.log(`Found ${results.papers.length} results`);

    const articles = await Promise.all(
      results.papers.map(async (paper) => {
        console.log('Processing paper:', paper.title);
        const paperId = extractPaperId(paper.relatedArticlesUrl);
        const citationUrl = generateCitationUrl(paperId);

        let bibtexUrl = null;
        try {
          // Attempt to fetch the BibTeX link
          bibtexUrl = await fetchBibTeXLink(citationUrl);
          console.log('Fetched BibTeX URL:', bibtexUrl);
        } catch (error) {
          console.warn(`BibTeX link not found for "${paper.title}"`, error.message);
        }

        return {
          id: paperId,
          title: paper.title,
          authors: paper.authors.map((author) => author.name),
          abstract: paper.description,
          url: paper.url,
          year: paper.year || 'N/A',
          citations: paper.citation ? paper.citation.count : 0,
          citationUrl,
          bibtexUrl,
        };
      })
    );

    res.json({
      articles,
      totalResults: results.totalPapers,
      nextPageUrl: results.nextUrl,
    });
  } catch (error) {
    console.error('Error fetching data from Google Scholar:', error);
    res.status(500).json({ error: 'An error occurred while fetching data', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
