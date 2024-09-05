import React, { useState } from 'react';

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
      const response = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setArticles(data.articles);
      setTotalResults(data.totalResults);
      setNextPageUrl(data.nextPageUrl);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                  Read More
                </a>
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