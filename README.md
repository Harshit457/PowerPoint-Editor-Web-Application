# PowerPoint Editor Web Application

A production-ready, web-based PowerPoint-style presentation editor built with **Next.js 15**, **Fabric.js**, **Redux Toolkit**, and **Tailwind CSS**. This application allows users to create, edit, manage, and save multi-slide presentations with text, shapes, and images — directly in the browser.

## 🚀 Live Demo
[Live Application Link](https://your-deployed-url.com)

---

## 📌 Features

### 🎨 Slide & Element Management
- Add, delete, and switch between slides.
- Add and edit:
  - Text boxes
  - Shapes (rectangles, circles, lines)
  - Images (via URL or local file upload)
- Move, resize, and style elements on the canvas.

### 💾 Save & Load
- Save the entire presentation as a `.json` file to your local machine.
- Load saved `.json` files to restore presentations exactly as they were.

### 🖥️ User Interface
- **Slide Thumbnails**: Easily navigate between slides.
- **Canvas Area**: Central editing space powered by Fabric.js.
- **Toolbar**: Add new elements and customize selected items.

### 📱 Optional Enhancements (if implemented)
- Undo/Redo functionality.
- Export individual slides as PNG/JPEG.
- Mobile-responsive layout.

---

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Canvas Library**: Fabric.js
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Persistence**: File System Access API

---

## 📂 Project Structure

```
src/
├── app/                 # Next.js App Router pages and layout
├── components/          # Reusable UI components (toolbar, slide thumbnails, etc.)
├── store/               # Redux slices and store configuration
├── hooks/               # Custom hooks for state access and dispatch
├── utils/               # Helper functions (file handling, element management)
└── styles/              # Tailwind CSS configuration
```

---

## ⚙️ Installation & Setup

1. **Clone the Repository**
```bash
git clone https://github.com/Harshit457/PowerPoint-Editor-Web-Application.git
cd powerpoint-editor
```

2. **Install Dependencies**
```bash
npm install
```

3. **Run the Development Server**
```bash
npm run dev
```
The app will be available at **http://localhost:3000**.

4. **Build for Production**
```bash
npm run build
npm start
```

---

## 📥 Example JSON File
An example `.json` file is provided in the `/examples` folder for testing the **Load Presentation** feature.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
