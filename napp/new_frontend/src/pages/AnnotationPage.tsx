import React, { useState, useRef, useEffect } from 'react';
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  Popup,
  Tip,
  PdfLoader,
  IHighlight,
} from 'react-pdf-highlighter';
import type { NewHighlight } from 'react-pdf-highlighter';
import { Sidebar } from "../components/Sidebar";
import { Spinner } from "../components/Spinner";
import '../utils/pdfjs-init';

interface PdfFile {
  url: string;
  title: string;
  authors?: string[];
}

interface ApiPdfResponse {
  url: string;
  title: string;
  authors?: string[];
}

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const AnnotationPage: React.FC = () => {
  const [currentFile, setCurrentFile] = useState<PdfFile>({
    url: "https://arxiv.org/pdf/1708.08021.pdf",
    title: "Default PDF"
  });
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [error, setError] = useState<string | null>(null);
  const [availableFiles, setAvailableFiles] = useState<PdfFile[]>([]);
  const scrollViewerToRef = useRef<(highlight: IHighlight) => void>(() => {});

  useEffect(() => {
    fetch('http://localhost:3001/api/available-pdfs')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        console.log('Raw response:', text);
        return JSON.parse(text) as ApiPdfResponse[];
      })
      .then(pdfs => {
        const files = pdfs.map((pdf: ApiPdfResponse) => ({
          url: `http://localhost:3001${pdf.url}`,
          title: pdf.title,
          authors: pdf.authors
        }));
        setAvailableFiles(files);
        if (files.length > 0) {
          setCurrentFile(files[0]);
        }
      })
      .catch(error => {
        console.error("Error fetching available PDFs:", error);
        setError(`Error fetching available PDFs: ${error.message}`);
      });
  }, []);

  const resetHighlights = () => {
    setHighlights([]);
  };

  const addHighlight = (highlight: NewHighlight) => {
    setHighlights([{ ...highlight, id: Math.random().toString() }, ...highlights]);
  };

  const updateHighlight = (
    highlightId: string,
    position: { boundingRect: any, rects: any[], pageNumber: number },
    content: { text?: string; image?: string }
  ) => {
    setHighlights(
      highlights.map((h) => {
        return h.id === highlightId
          ? { ...h, position: { ...h.position, ...position }, content: { ...h.content, ...content } }
          : h;
      })
    );
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        highlights={highlights}
        resetHighlights={resetHighlights}
        availableFiles={availableFiles}
        currentFile={currentFile.url}
        onFileChange={(url) => {
          const newFile = availableFiles.find(file => file.url === url);
          if (newFile) {
            setCurrentFile(newFile);
          }
        }}
      />
      <div className="w-3/4 relative">
        <PdfLoader 
          url={currentFile.url} 
          beforeLoad={<Spinner />}
          onError={(error: Error) => {
            console.error("Error loading PDF:", error);
            setError(error.message);
          }}
        >
          {(pdfDocument) => (
            <PdfHighlighter
              pdfDocument={pdfDocument}
              enableAreaSelection={(event) => event.altKey}
              onScrollChange={() => {}}
              scrollRef={(scrollTo) => {
                scrollViewerToRef.current = scrollTo;
              }}
              onSelectionFinished={(
                position,
                content,
                hideTipAndSelection,
                transformSelection,
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
                isScrolledTo,
              ) => {
                const isTextHighlight = !highlight.content?.image;

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
                        { 
                          boundingRect: viewportToScaled(boundingRect),
                          rects: [],
                          pageNumber: highlight.position.pageNumber
                        },
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
                  >
                    {component}
                  </Popup>
                );
              }}
              highlights={highlights}
            />
          )}
        </PdfLoader>
        {error && (
          <div className="text-red-500 p-4">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationPage;