import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import './App.css';

function App() {
    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [pageIsRendering, setPageIsRendering] = useState(false);
    const [pageNumIsPending, setPageNumIsPending] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const scale = 1.5;

  useEffect(() => {
    if (selectedFile) {
      loadPdf(selectedFile);
    }
  }, [selectedFile]);

  const loadPdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded successfully. Number of pages:', pdf.numPages);
      setPdfDoc(pdf);
      setPageNum(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum);
    }
  }, [pdfDoc, pageNum]);

  const renderPage = async (num) => {
    if (!pdfDoc) {
      console.log('PDF document not loaded yet.');
      return;
    }

    setPageIsRendering(true);
    try {
      console.log('Rendering page', num);
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderCtx = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderCtx).promise;
      console.log('Page rendered successfully');
      setPageIsRendering(false);

      if (pageNumIsPending !== null) {
        renderPage(pageNumIsPending);
        setPageNumIsPending(null);
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      setPageIsRendering(false);
    }
  };

  const queueRenderPage = (num) => {
    if (pageIsRendering) {
      setPageNumIsPending(num);
    } else {
      setPageNum(num);
    }
  };

  const handlePrevPage = () => {
    if (pageNum <= 1) return;
    queueRenderPage(pageNum - 1);
  };

  const handleNextPage = () => {
    if (pdfDoc && pageNum < pdfDoc.numPages) {
      queueRenderPage(pageNum + 1);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (selectedText) {
      console.log('Selected text:', selectedText);
      // Here you can implement copying to clipboard or any other action
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  return (
    <div className="pdf-viewer">
      <header className="pdf-viewer__header">
        <h1>PDF Viewer</h1>
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
      </header>
      <main className="pdf-viewer__main">
        <div className="canvas-container">
          <canvas ref={canvasRef} onMouseUp={handleTextSelection}></canvas>
        </div>
      </main>
      <footer className="pdf-viewer__footer">
        <div className="controls">
          <button onClick={handlePrevPage} disabled={pageNum <= 1}>Previous</button>
          <span className="page-info">{`Page ${pageNum} of ${pdfDoc ? pdfDoc.numPages : '--'}`}</span>
          <button onClick={handleNextPage} disabled={!pdfDoc || pageNum >= pdfDoc.numPages}>Next</button>
        </div>
      </footer>
    </div>
  );
}

export default App;
