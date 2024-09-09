import React from "react";
import type { IHighlight } from '../utils/pdf-highlighter';

interface PdfFile {
  url: string;
  title: string;
  authors?: string[];
}

interface Props {
  highlights: Array<IHighlight>;
  resetHighlights: () => void;
  availableFiles: PdfFile[];
  currentFile: string;
  onFileChange: (file: string) => void;
}

const updateHash = (highlight: IHighlight) => {
  document.location.hash = `highlight-${highlight.id}`;
};

// Use environment variable or fallback to 'dev' if not set
const APP_VERSION = process.env.REACT_APP_VERSION || 'dev';

export function Sidebar({
  highlights,
  resetHighlights,
  availableFiles,
  currentFile,
  onFileChange,
}: Props) {
  return (
    <div className="sidebar" style={{ width: "25vw" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>
          Leo's Epic PDF Highlighter v{APP_VERSION}
        </h2>
        <p>
          <small>
            To create area highlight hold ⌥ Option key (Alt), then click and
            drag.
          </small>
        </p>
      </div>
      <div style={{ padding: "1rem" }}>
        <select
          value={currentFile}
          onChange={(e) => onFileChange(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md"
        >
          {availableFiles.map((file, index) => (
            <option key={index} value={file.url}>
              {file.title}
            </option>
          ))}
        </select>
      </div>
      <ul className="sidebar__highlights">
        {highlights.map((highlight, index) => (
          <li
            key={index}
            className="sidebar__highlight"
            onClick={() => {
              updateHash(highlight);
            }}
          >
            <div>
              <strong>{highlight.comment.text}</strong>
              {highlight.content.text ? (
                <blockquote style={{ marginTop: "0.5rem" }}>
                  {`${highlight.content.text.slice(0, 90).trim()}…`}
                </blockquote>
              ) : null}
              {highlight.content.image ? (
                <div
                  className="highlight__image"
                  style={{ marginTop: "0.5rem" }}
                >
                  <img src={highlight.content.image} alt={"Screenshot"} />
                </div>
              ) : null}
            </div>
            <div className="highlight__location">
              Page {highlight.position.pageNumber}
            </div>
          </li>
        ))}
      </ul>
      {highlights.length > 0 ? (
        <div style={{ padding: "1rem" }}>
          <button type="button" onClick={resetHighlights}>
            Reset highlights
          </button>
        </div>
      ) : null}
    </div>
  );
}