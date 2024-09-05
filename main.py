import tkinter as tk
from tkinter import filedialog, scrolledtext
import fitz  # PyMuPDF
from PIL import Image, ImageTk
import io

class PDFViewer:
    def __init__(self, master):
        self.master = master
        self.master.title("PDF Viewer")
        self.master.geometry("800x600")

        self.current_page = 0
        self.zoom_factor = 1.0

        # Create widgets
        self.canvas = tk.Canvas(self.master)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.scrollbar = tk.Scrollbar(self.master, orient=tk.VERTICAL, command=self.canvas.yview)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        # Buttons
        button_frame = tk.Frame(self.master)
        button_frame.pack(side=tk.BOTTOM, fill=tk.X)

        tk.Button(button_frame, text="Open PDF", command=self.open_pdf).pack(side=tk.LEFT)
        tk.Button(button_frame, text="Previous", command=self.prev_page).pack(side=tk.LEFT)
        tk.Button(button_frame, text="Next", command=self.next_page).pack(side=tk.LEFT)
        tk.Button(button_frame, text="Zoom In", command=self.zoom_in).pack(side=tk.LEFT)
        tk.Button(button_frame, text="Zoom Out", command=self.zoom_out).pack(side=tk.LEFT)
        tk.Button(button_frame, text="Copy Text", command=self.copy_text).pack(side=tk.LEFT)

        self.page_label = tk.Label(button_frame, text="Page: 0/0")
        self.page_label.pack(side=tk.RIGHT)

    def open_pdf(self):
        file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
        if file_path:
            self.doc = fitz.open(file_path)
            self.current_page = 0
            self.display_page()

    def display_page(self):
        if hasattr(self, 'doc'):
            page = self.doc[self.current_page]
            pix = page.get_pixmap(matrix=fitz.Matrix(self.zoom_factor, self.zoom_factor))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            photo = ImageTk.PhotoImage(image=img)
            self.canvas.delete("all")
            self.canvas.create_image(0, 0, anchor=tk.NW, image=photo)
            self.canvas.image = photo
            self.canvas.configure(scrollregion=self.canvas.bbox(tk.ALL))
            self.page_label.config(text=f"Page: {self.current_page + 1}/{len(self.doc)}")

    def prev_page(self):
        if hasattr(self, 'doc') and self.current_page > 0:
            self.current_page -= 1
            self.display_page()

    def next_page(self):
        if hasattr(self, 'doc') and self.current_page < len(self.doc) - 1:
            self.current_page += 1
            self.display_page()

    def zoom_in(self):
        self.zoom_factor *= 1.2
        self.display_page()

    def zoom_out(self):
        self.zoom_factor /= 1.2
        self.display_page()

    def copy_text(self):
        if hasattr(self, 'doc'):
            page = self.doc[self.current_page]
            text = page.get_text()
            self.master.clipboard_clear()
            self.master.clipboard_append(text)
            print("Text copied to clipboard")

if __name__ == "__main__":
    root = tk.Tk()
    app = PDFViewer(root)
    root.mainloop()
