import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

function App() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isContinuousScroll, setIsContinuousScroll] = useState(false);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error while loading document! ', error.message);
    setError(`Error: ${error.message}`);
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFile(file);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
    }
  };

  const toggleScrollMode = () => {
    setIsContinuousScroll(!isContinuousScroll);
  };

  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer__header">
        <h2>Collaborative Science</h2>
        <div className="file-input">
          <label htmlFor="file-upload" className="file-input__label">
            Choose PDF File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
      className="file-input__input"
          />
        </div>
        <div className="scroll-mode-toggle">
          <label>
            <input
              type="checkbox"
              checked={isContinuousScroll}
              onChange={toggleScrollMode}
            />
            Continuous Scroll
          </label>
        </div>
      </header>
      <main className="pdf-viewer__main">
        {error && <div className="error-message">{error}</div>}
        {file && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            {isContinuousScroll ? (
              Array.from(new Array(numPages), (el, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  scale={1.5}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              ))
            ) : (
              <Page
                pageNumber={pageNumber}
                scale={1.5}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            )}
          </Document>
        )}
      </main>
      <footer className="pdf-viewer__footer">
        <div className="controls">
          {!isContinuousScroll && (
            <>
              <button onClick={previousPage} disabled={pageNumber <= 1}>
                Previous
              </button>
              <p>
                Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
              </p>
              <button onClick={nextPage} disabled={pageNumber >= numPages}>
                Next
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
