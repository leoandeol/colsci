import React, { useState, useRef } from 'react';
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
  const [url, setUrl] = useState("https://arxiv.org/pdf/1708.08021.pdf");
  const [highlights, setHighlights] = useState<Array<IHighlight>>([]);
  const [error, setError] = useState<string | null>(null);
  const scrollViewerToRef = useRef<(highlight: IHighlight) => void>(() => {});

  const resetHighlights = () => {
    setHighlights([]);
  };

  const toggleDocument = () => {
    setUrl(url === "https://arxiv.org/pdf/1708.08021.pdf" 
      ? "https://arxiv.org/pdf/1604.02480.pdf"
      : "https://arxiv.org/pdf/1708.08021.pdf");
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
        toggleDocument={toggleDocument}
      />
      <div className="w-3/4 relative">
        <PdfLoader 
          url={url} 
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
            Error loading PDF: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationPage;