import React, { useState } from 'react';

export default function DBLPSearch() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
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
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">DBLP Search</h1>
      <form onSubmit={handleSearch} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search term"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {articles.length > 0 && (
        <div>
          <p className="mb-2">Total results: {totalResults}</p>
          <ul>
            {articles.map((article) => (
              <li key={article.id} className="mb-4 border-b pb-2">
                <h2 className="font-bold">{article.title}</h2>
                <p>Authors: {article.authors.join(', ') || 'N/A'}</p>
                <p>Year: {article.year}</p>
                <p>Venue: {article.venue}</p>
                <p>Type: {article.type}</p>
                {article.doi && <p>DOI: {article.doi}</p>}
                <div className="mt-2">
                {article.url && (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 mr-2">
                    Read More
                  </a>
                )}
                <a href={article.bibtexUrl} target="_blank" rel="noopener noreferrer" className="text-green-500">
                  BibTeX
                </a>
              </div>
            </li>
          ))}
          </ul>
        </div>
      )}
    </div>
  );
}