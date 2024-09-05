import tkinter as tk
from tkinter import filedialog, ttk
import fitz  # PyMuPDF

class PDFViewer:
    def __init__(self, master):
        self.master = master
        self.master.title("PDF Viewer with Text Selection")
        self.master.geometry("800x600")

        self.current_page = 0
        self.doc = None

        # Create widgets
        self.text_widget = tk.Text(self.master, wrap=tk.WORD)
        self.text_widget.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.scrollbar = tk.Scrollbar(self.master, orient=tk.VERTICAL, command=self.text_widget.yview)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.text_widget.configure(yscrollcommand=self.scrollbar.set)

        # Buttons
        button_frame = tk.Frame(self.master)
        button_frame.pack(side=tk.BOTTOM, fill=tk.X)

        ttk.Button(button_frame, text="Open PDF", command=self.open_pdf).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Previous", command=self.prev_page).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Next", command=self.next_page).pack(side=tk.LEFT)

        self.page_label = ttk.Label(button_frame, text="Page: 0/0")
        self.page_label.pack(side=tk.RIGHT)

    def open_pdf(self):
        file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
        if file_path:
            self.doc = fitz.open(file_path)
            self.current_page = 0
            self.display_page()

    def display_page(self):
        if self.doc:
            self.text_widget.delete('1.0', tk.END)
            page = self.doc[self.current_page]

            # Extract text with its formatting
            blocks = page.get_text("dict")["blocks"]
            for block in blocks:
                if block["type"] == 0:  # Text block
                    for line in block["lines"]:
                        for span in line["spans"]:
                            text = span["text"]
                            self.text_widget.insert(tk.END, text)
                        self.text_widget.insert(tk.END, '\n')
                self.text_widget.insert(tk.END, '\n')

            self.page_label.config(text=f"Page: {self.current_page + 1}/{len(self.doc)}")

    def prev_page(self):
        if self.doc and self.current_page > 0:
            self.current_page -= 1
            self.display_page()

    def next_page(self):
        if self.doc and self.current_page < len(self.doc) - 1:
            self.current_page += 1
            self.display_page()

if __name__ == "__main__":
    root = tk.Tk()
    app = PDFViewer(root)
    root.mainloop()
