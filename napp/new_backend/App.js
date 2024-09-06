const express = require('express');
const cors = require('cors');
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

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log(`Searching for: "${query}"`);
    const searchOpts = {
      keywords: query,
      yearLow: 2000,
      yearHigh: new Date().getFullYear(),
    };

    const results = await search(searchOpts);
    console.log(`Found ${results.papers.length} results`);

    const articles = results.papers.map(paper => {
      console.log('Processing paper:', paper.title);
      const doiMatch = paper.url.match(/https?:\/\/doi\.org\/(10\.[^/]+\/[^/\s]+)/);
      const doi = doiMatch ? doiMatch[1] : null;
      const paperId = extractPaperId(paper.relatedArticlesUrl);
      const pdfLink = paper.source && paper.source.type === 'pdf' ? paper.source.url : null;
      const citationUrl = generateCitationUrl(paperId);

      console.log('Paper ID:', paperId);
      console.log('Generated Citation URL:', citationUrl);

      return {
        id: paperId,
        title: paper.title,
        authors: paper.authors.map(author => author.name),
        abstract: paper.description,
        url: paper.url,
        year: paper.year || 'N/A',
        citations: paper.citation ? paper.citation.count : 0,
        doi,
        citationUrl,
        pdfLink
      };
    });

    console.log('Sending response with articles:', articles.length);
    res.json({
      articles,
      totalResults: results.totalPapers,
      nextPageUrl: results.nextUrl
    });
  } catch (error) {
    console.error('Error fetching data from Google Scholar:', error);
    res.status(500).json({ error: 'An error occurred while fetching data', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});