import React, { useState, useEffect } from 'react';

export default function GoogleScholarSearch() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      console.log('Sending search request for:', query);
      const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      console.log('Received data:', data);
      setArticles(data.articles);
      setTotalResults(data.totalResults);
      setNextPageUrl(data.nextUrl);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBibTeX = async (citationUrl) => {
    try {
      console.log('Fetching BibTeX from:', citationUrl);
      const response = await fetch(citationUrl);
      const text = await response.text();
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(text, 'text/html');
      const bibTeXLink = htmlDoc.querySelector('a.gs_citi[href*="scholar.bib"]');
      if (bibTeXLink) {
        console.log('Final BibTeX link:', bibTeXLink.href);
        return bibTeXLink.href;
      }
      console.error('BibTeX link not found in citation page');
      return null;
    } catch (error) {
      console.error('Error fetching BibTeX:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Articles state updated:', articles);
    articles.forEach(article => {
      console.log(`Paper ID: ${article.id}, Title: ${article.title}, Citation URL: ${article.citationUrl}`);
    });
  }, [articles]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Google Scholar Search</h1>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search term"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Search
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {articles.length > 0 && (
        <div>
          <p className="mb-2">Total results: {totalResults}</p>
          <ul>
            {articles.map((article, index) => (
              <li key={index} className="mb-4 border-b pb-2">
                <h2 className="font-bold">{article.title}</h2>
                <p>Authors: {article.authors.join(', ') || 'N/A'}</p>
                <p>Year: {article.year}</p>
                <p>Citations: {article.citations}</p>
                <p>Abstract: {article.abstract || 'N/A'}</p>
                {article.doi && <p>DOI: {article.doi}</p>}
                <div className="mt-2">
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 mr-2">
                    Read More
                  </a>
                  {article.pdfLink && (
                    <a href={article.pdfLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 mr-2">
                      PDF
                    </a>
                  )}
                  {article.citationUrl && (
                    <button
                      onClick={async () => {
                        const bibTeXLink = await fetchBibTeX(article.citationUrl);
                        if (bibTeXLink) {
                          console.log(`BibTeX link for "${article.title}":`, bibTeXLink);
                          window.open(bibTeXLink, '_blank');
                        } else {
                          console.error(`BibTeX link not found for "${article.title}"`);
                          alert('BibTeX link not found');
                        }
                      }}
                      className="text-green-500"
                    >
                      BibTeX
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {nextPageUrl && (
            <button onClick={() => window.open(nextPageUrl, '_blank')} className="bg-green-500 text-white p-2 rounded mt-4">
              Next Page on Google Scholar
            </button>
          )}
        </div>
      )}
    </div>
  );
}