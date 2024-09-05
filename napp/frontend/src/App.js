import React, { useState } from 'react';
import { PdfLoader, PdfHighlighter, Tip, Highlight, Popup, AreaHighlight } from 'react-pdf-highlighter';
import './App.css';

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () => document.location.hash.slice("#highlight-".length);

const resetHash = () => { document.location.hash = ""; };

function App() {
  const [url, setUrl] = useState(null);
  const [highlights, setHighlights] = useState([]);

  const scrollViewerTo = (highlight) => {};

  const addHighlight = (highlight) => {
    setHighlights([{ ...highlight, id: getNextId() }, ...highlights]);
  };

  const updateHighlight = (highlightId, position, content) => {
    setHighlights(
      highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      })
    );
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUrl(URL.createObjectURL(file));
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  return (
    <div className="App">
      <div className="header">
        <h1>PDF Annotator</h1>
        <label htmlFor="file-upload" className="file-input__label">
          Select PDF
        </label>
        <input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf" className="file-input__input" />
      </div>
      {url ? (
        <div style={{ position: 'absolute', top: 120, left: 0, right: 0, bottom: 0, overflow: 'auto' }}>
          <PdfLoader url={url} beforeLoad={<div>Loading...</div>}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollChange={resetHash}
                scrollRef={(scrollTo) => {
                  scrollViewerTo(scrollTo);
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      addHighlight({ content, position, comment });
                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={(popupContent) =>
                        setTip(highlight, (highlight) => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index}
                      children={component}
                    />
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      ) : (
        <div>No PDF file selected</div>
      )}
    </div>
  );
}

function HighlightPopup({ comment }) {
  return (
    <div className="Highlight__popup">
      {comment ? (
        <div className="Highlight__comment">{comment}</div>
      ) : null}
    </div>
  );
}

export default App;