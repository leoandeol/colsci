const axios = require('axios');
const xml2js = require('xml2js');

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

async function search(query) {
  try {
    console.log(`Searching DBLP for: "${query}"`);
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

    const articles = await Promise.all(results.map(async hit => {
      const info = hit.info[0];
      const url = info.url ? info.url[0] : (info.ee ? info.ee[0] : null);
      const pdfLink = findPdfLink(info);

      const bibtexUrl = url ? generateBibTexUrl(url) : null;
      // get the content of the bibtex file at that URL into the bibtex variable
      let bibtex = null;
      if (bibtexUrl) {
          try {
          const bibtexResponse = await axios.get(bibtexUrl);
          bibtex = bibtexResponse.data;
          } catch (error) {
          console.error(`Error fetching BibTeX for URL ${bibtexUrl}:`, error);
          }
      }
      else {
          console.error('No BibTeX URL found for:', url);
      }
      
      const articleInfo = {
        id: hit.$.id,
        title: info.title ? info.title[0] : 'N/A',
        authors: info.authors ? info.authors[0].author.map(a => a._) : [],
        year: info.year ? info.year[0] : 'N/A',
        venue: info.venue ? info.venue[0] : 'N/A',
        type: info.type ? info.type[0] : 'N/A',
        doi: info.doi ? info.doi[0] : null,
        url: url,
        bibtex: bibtex,
        pdfLink: pdfLink
      };
    //   console.log('Paper Details:');
    //   console.log(JSON.stringify(articleInfo, null, 2));
    //   console.log('---');

      return articleInfo;
    }));

    return {
      articles,
      totalResults: parseInt(hits.$.total, 10)
    };
  } catch (error) {
    console.error('Error fetching data from DBLP:', error);
    throw error;
  }
}

module.exports = { search };