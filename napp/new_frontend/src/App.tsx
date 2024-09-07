import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import AnnotationPage from './pages/AnnotationPage';
import './style/App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <nav className="bg-gray-800 p-4">
          <ul className="flex space-x-4">
            <li>
              <Link to="/" className="text-white hover:text-gray-300">Home</Link>
            </li>
            <li>
              <Link to="/search" className="text-white hover:text-gray-300">Search</Link>
            </li>
            <li>
              <Link to="/annotate" className="text-white hover:text-gray-300">Annotate</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/annotate" element={<AnnotationPage />} />
        </Routes>
      </div>
    </Router>
  );
};

const Home: React.FC = () => (
  <div className="container mx-auto mt-8">
    <h1 className="text-3xl font-bold mb-4">Welcome to PDF Manager</h1>
    <p className="mb-4">Use the navigation above to search for papers or annotate saved PDFs.</p>
  </div>
);

export default App;