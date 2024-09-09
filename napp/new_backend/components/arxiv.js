const arxiv = require('arxiv-api');
const doi2bib = require('doi2bib');

async function search(query) {
  try {
    console.log(`Searching arXiv for: "${query}"`);
    const results = await arxiv.search({
      searchQueryParams: [
        {
          include: [{ name: query }],
        },
      ],
      start: 0,
      maxResults: 10,
    });

    console.log(`Found ${results.length} results`);
    //console.debug('Results:', results);

    const get_doi = (url) => {
      //console.log(url);
      if (!url.includes
        ('arxiv.org')) {
        console.error('Invalid arXiv URL');
        return null;
      }
      // check if format is xxxx.xxxxx
      //console.log(url.split('/').pop().split('.'));
      const format = url.split('/').pop().split('.').length;
      const correct_format = format === 2;
      if(!correct_format){
        //console.log("Url format is not xxxx.xxxxx, it is ", url.split('/').pop().split('.').length);
        console.error('Invalid arXiv URL format for arXiv DOI');
        return null;
      }
      const arxiv_id = url.split('/').pop();
      const arxiv_id_filtered = arxiv_id.split('v')[0];
      return `10.48550/arXiv.${arxiv_id_filtered}`;
    };

    const articles = await Promise.all(results.map(async (paper) => {
      const doi = get_doi(paper.id);
      let bibtex = null;

      if (!doi) {
        console.error(`Invalid DOI for arXiv paper: ${paper.id}`);
      } else {
        try {
          const citation = await doi2bib.getCitation(doi);
          bibtex = citation;//.bibtex;
          //console.log(bibtex);
          //bibtexUrl = citation.bibtex;
        } catch (error) {
          console.error(`Error fetching BibTeX for DOI ${doi}:`, error);
        }
      }

      return {
        id: paper.id,
        title: paper.title,
        authors: paper.authors.map(author => author[0]),
        abstract: paper.summary,
        url: paper.links[0].href,
        year: paper.published.substring(0, 4),
        pdfLink: paper.links.find(link => link.title === 'pdf')?.href,
        doi: doi,
        venue: 'arXiv',
        type: 'preprint',
        bibtex: bibtex
      };
    }));

    return {
      articles,
      totalResults: results.length
    };
  } catch (error) {
    console.error('Error fetching data from arXiv:', error);
    throw error;
  }
}

module.exports = { search };