import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source to match the version used by PdfLoader
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

export { pdfjsLib };