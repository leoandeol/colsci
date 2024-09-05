import React, { useState, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
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
  const [annotations, setAnnotations] = useState([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (file) {
      loadPdfAndAnnotations();
    }
  }, [file]);

  async function loadPdfAndAnnotations() {
    const pdfDoc = await PDFDocument.load(await file.arrayBuffer());
    pdfDoc.registerFontkit(fontkit);
    // Load existing annotations if any
    // This is a placeholder - you'd need to implement a way to store and retrieve annotations
    setAnnotations([]);
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(error) {
    console.error('Error while loading document! ', error.message);
    setError(`Error: ${error.message}`);
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

  const toggleAnnotationMode = () => {
    setIsAnnotating(!isAnnotating);
  };

  const handleCanvasClick = async (event) => {
    if (!isAnnotating || !file) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newAnnotation = { x, y, text: prompt('Enter annotation text:') };
    setAnnotations([...annotations, newAnnotation]);

    // Here you would typically save the annotation to the PDF
    // This is a placeholder for where you'd use pdf-lib to add the annotation
    console.log('New annotation:', newAnnotation);
  };

  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer__header">
        <h1>Interactive PDF Viewer with Annotations</h1>
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
        <div className="view-controls">
          <label>
            <input
              type="checkbox"
              checked={isContinuousScroll}
              onChange={toggleScrollMode}
            />
            Continuous Scroll
          </label>
          <label>
            <input
              type="checkbox"
              checked={isAnnotating}
              onChange={toggleAnnotationMode}
            />
            Annotation Mode
          </label>
        </div>
      </header>
      <main className="pdf-viewer__main" onClick={handleCanvasClick}>
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
                  canvasRef={canvasRef}
                />
              ))
            ) : (
              <Page 
                pageNumber={pageNumber} 
                scale={1.5}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                canvasRef={canvasRef}
              />
            )}
            {annotations.map((ann, index) => (
              <div
                key={index}
                className="annotation"
                style={{ left: ann.x, top: ann.y }}
              >
                {ann.text}
              </div>
            ))}
          </Document>
        )}
      </main>
      <footer className="pdf-viewer__footer">
        <div className="controls">
          {!isContinuousScroll && (
            <>
              <button onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} disabled={pageNumber <= 1}>
                Previous
              </button>
              <p>
                Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
              </p>
              <button onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))} disabled={pageNumber >= numPages}>
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