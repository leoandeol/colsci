import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument, rgb, Color } from 'pdf-lib';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './App.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url,
// ).toString();

function App() {
  const [numPages, setNumPages] = useState(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.5);
  const [annotations, setAnnotations] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [isHighlighting, setIsHighlighting] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const containerRef = useRef(null);
  const pagesRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = containerRef.current.scrollTop;
      const pageHeight = containerRef.current.scrollHeight / numPages;
      const currentPage = Math.floor(scrollPosition / pageHeight) + 1;
      // You can use this currentPage value to update UI or perform any other actions
    };

    containerRef.current?.addEventListener('scroll', handleScroll);
    return () => containerRef.current?.removeEventListener('scroll', handleScroll);
  }, [numPages]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
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
      setAnnotations([]);
      setHighlights([]);
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
    }
  };

  const toggleAnnotationMode = () => {
    setIsAnnotating(!isAnnotating);
    setIsHighlighting(false);
  };

  const toggleHighlightMode = () => {
    setIsHighlighting(!isHighlighting);
    setIsAnnotating(false);
  };

  const handleAnnotation = (event) => {
    if (!isAnnotating || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const text = prompt('Enter annotation text:');
    if (text) {
      const newAnnotation = { x, y, text, page: getCurrentPage() };
      setAnnotations([...annotations, newAnnotation]);
    }
  };

  const handleHighlight = () => {
    if (!isHighlighting) return;

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const container = containerRef.current.getBoundingClientRect();

    const highlight = {
      x: (rect.left - container.left) / scale,
      y: (rect.top - container.top) / scale,
      width: rect.width / scale,
      height: rect.height / scale,
      text: selection.toString(),
      page: getCurrentPage()
    };

    setHighlights([...highlights, highlight]);
    selection.removeAllRanges();
  };

  const getCurrentPage = () => {
    const scrollPosition = containerRef.current.scrollTop;
    const pageHeight = containerRef.current.scrollHeight / numPages;
    return Math.floor(scrollPosition / pageHeight) + 1;
  };

  const editAnnotation = (index) => {
    setEditingAnnotation(index);
  };

  const updateAnnotation = (index, newText) => {
    const updatedAnnotations = [...annotations];
    updatedAnnotations[index].text = newText;
    setAnnotations(updatedAnnotations);
    setEditingAnnotation(null);
  };

  const saveAnnotations = async () => {
    if (!file) return;

    const existingPdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();

    // Calculate the overall scale factor
    const firstPage = pages[0];
    const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();
    const displayWidth = containerRef.current.clientWidth;
    const displayHeight = containerRef.current.clientHeight;
    const scaleX = pdfWidth / displayWidth;
    const scaleY = pdfHeight / displayHeight;
    const scaleFactor = Math.max(scaleX, scaleY);

    // Calculate horizontal offset
    const horizontalOffset = (pdfWidth - (displayWidth * scaleFactor)) / 2;

    annotations.forEach(ann => {
      const page = pages[ann.page - 1];
      const { height } = page.getSize();

      page.drawText(ann.text, {
        x: (ann.x * scaleFactor) - horizontalOffset,
        y: height - (ann.y * scaleFactor) - 12 * scaleFactor, // Adjust for text height
        size: 12 * scaleFactor,
        color: rgb(0, 0, 0), // Black color for text
      });
    });

    highlights.forEach(hl => {
      const page = pages[hl.page - 1];
      const { height } = page.getSize();

      page.drawRectangle({
        x: (hl.x * scaleFactor) - horizontalOffset,
        y: height - ((hl.y + hl.height) * scaleFactor),
        width: hl.width * scaleFactor,
        height: hl.height * scaleFactor,
        color: rgb(1, 1, 0),
        opacity: 0.2,
      });
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'annotated_document.pdf';
    link.click();
  };


  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer__header">
        <h1>Interactive PDF Viewer with Annotations and Highlights</h1>
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
        <div className="controls">
          <button onClick={toggleAnnotationMode}>
            {isAnnotating ? 'Disable Annotation' : 'Enable Annotation'}
          </button>
          <button onClick={toggleHighlightMode}>
            {isHighlighting ? 'Disable Highlighting' : 'Enable Highlighting'}
          </button>
          <button onClick={() => setScale(scale + 0.2)}>Zoom In</button>
          <button onClick={() => setScale(Math.max(0.5, scale - 0.2))}>Zoom Out</button>
          <button onClick={saveAnnotations}>Save Annotations</button>
        </div>
      </header>
      <main className="pdf-viewer__main" ref={containerRef} onClick={handleAnnotation} onMouseUp={handleHighlight}>
        {error && <div className="error-message">{error}</div>}
        {file && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page 
                key={`page_${index + 1}`}
                pageNumber={index + 1} 
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                inputRef={(ref) => (pagesRef.current[index] = ref)}
              />
            ))}
            {annotations.map((ann, index) => (
              <div
                key={index}
                className="annotation"
                style={{ 
                  left: `${ann.x * scale}px`, 
                  top: `${ann.y * scale}px`,
                  transform: `scale(${scale})`
                }}
                onClick={() => editAnnotation(index)}
              >
                {editingAnnotation === index ? (
                  <input
                    type="text"
                    value={ann.text}
                    onChange={(e) => updateAnnotation(index, e.target.value)}
                    onBlur={() => setEditingAnnotation(null)}
                    autoFocus
                  />
                ) : (
                  ann.text
                )}
              </div>
            ))}
            {highlights.map((hl, index) => (
              <div
                key={`highlight_${index}`}
                className="highlight"
                style={{
                  position: 'absolute',
                  left: `${hl.x * scale}px`,
                  top: `${hl.y * scale}px`,
                  width: `${hl.width * scale}px`,
                  height: `${hl.height * scale}px`,
                  backgroundColor: 'rgba(255, 255, 0, 0.3)',
                  pointerEvents: 'none',
                }}
              />
            ))}
          </Document>
        )}
      </main>
    </div>
  );
}

export default App;