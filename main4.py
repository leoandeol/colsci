import tkinter as tk
from tkinter import filedialog, ttk
import fitz  # PyMuPDF
from PIL import Image, ImageTk
import io

class PDFViewer:
    def __init__(self, master):
        self.master = master
        self.master.title("PDF Viewer with Blue Text Selection")
        self.master.geometry("800x600")

        self.current_page = 0
        self.zoom_factor = 1.0
        self.doc = None
        self.selection_rects = []

        # Create widgets
        self.canvas = tk.Canvas(self.master)
        self.canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.scrollbar = tk.Scrollbar(self.master, orient=tk.VERTICAL, command=self.canvas.yview)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        # Buttons
        button_frame = tk.Frame(self.master)
        button_frame.pack(side=tk.BOTTOM, fill=tk.X)

        ttk.Button(button_frame, text="Open PDF", command=self.open_pdf).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Previous", command=self.prev_page).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Next", command=self.next_page).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Zoom In", command=self.zoom_in).pack(side=tk.LEFT)
        ttk.Button(button_frame, text="Zoom Out", command=self.zoom_out).pack(side=tk.LEFT)

        self.page_label = ttk.Label(button_frame, text="Page: 0/0")
        self.page_label.pack(side=tk.RIGHT)

        # Bind events
        self.canvas.bind("<Button-1>", self.start_select)
        self.canvas.bind("<B1-Motion>", self.update_selection)
        self.canvas.bind("<ButtonRelease-1>", self.end_select)

    def open_pdf(self):
        file_path = filedialog.askopenfilename(filetypes=[("PDF files", "*.pdf")])
        if file_path:
            self.doc = fitz.open(file_path)
            self.current_page = 0
            self.display_page()

    def display_page(self):
        if self.doc:
            page = self.doc[self.current_page]
            pix = page.get_pixmap(matrix=fitz.Matrix(self.zoom_factor, self.zoom_factor))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            self.photo = ImageTk.PhotoImage(image=img)
            self.canvas.delete("all")
            self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo)
            self.canvas.configure(scrollregion=self.canvas.bbox(tk.ALL))
            self.page_label.config(text=f"Page: {self.current_page + 1}/{len(self.doc)}")

    def prev_page(self):
        if self.doc and self.current_page > 0:
            self.current_page -= 1
            self.display_page()

    def next_page(self):
        if self.doc and self.current_page < len(self.doc) - 1:
            self.current_page += 1
            self.display_page()

    def zoom_in(self):
        self.zoom_factor *= 1.2
        self.display_page()

    def zoom_out(self):
        self.zoom_factor /= 1.2
        self.display_page()

    def start_select(self, event):
        self.clear_selection()
        self.start_x = self.canvas.canvasx(event.x)
        self.start_y = self.canvas.canvasy(event.y)

    def update_selection(self, event):
        self.clear_selection()
        end_x = self.canvas.canvasx(event.x)
        end_y = self.canvas.canvasy(event.y)
        self.highlight_selected_text(self.start_x, self.start_y, end_x, end_y)

    def end_select(self, event):
        end_x = self.canvas.canvasx(event.x)
        end_y = self.canvas.canvasy(event.y)
        self.copy_selected_text(self.start_x, self.start_y, end_x, end_y)

    def clear_selection(self):
        for rect in self.selection_rects:
            self.canvas.delete(rect)
        self.selection_rects = []

    def highlight_selected_text(self, x0, y0, x1, y1):
        if self.doc:
            page = self.doc[self.current_page]
            rect = fitz.Rect(x0/self.zoom_factor, y0/self.zoom_factor, x1/self.zoom_factor, y1/self.zoom_factor)
            words = page.get_text("words")
            for word in words:
                word_rect = fitz.Rect(word[:4])
                if word_rect.intersects(rect):
                    scaled_rect = fitz.Rect(
                        word_rect.x0 * self.zoom_factor,
                        word_rect.y0 * self.zoom_factor,
                        word_rect.x1 * self.zoom_factor,
                        word_rect.y1 * self.zoom_factor
                    )
                    highlight = self.canvas.create_rectangle(
                        scaled_rect.x0, scaled_rect.y0, scaled_rect.x1, scaled_rect.y1,
                        fill="light blue", outline="", stipple="gray50"
                    )
                    self.selection_rects.append(highlight)

    def copy_selected_text(self, x0, y0, x1, y1):
        if self.doc:
            page = self.doc[self.current_page]
            rect = fitz.Rect(x0/self.zoom_factor, y0/self.zoom_factor, x1/self.zoom_factor, y1/self.zoom_factor)
            words = page.get_text("words")
            text = ""
            for word in words:
                if fitz.Rect(word[:4]).intersects(rect):
                    text += word[4] + " "
            if text:
                self.master.clipboard_clear()
                self.master.clipboard_append(text.strip())
                print("Text copied to clipboard:", text.strip())

if __name__ == "__main__":
    root = tk.Tk()
    app = PDFViewer(root)
    root.mainloop()
