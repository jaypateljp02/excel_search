# 📊 Excel Search Engine

A modern, lightning-fast web application to upload Excel files, parse their contents, and search across all spreadsheets instantly. Powered by Next.js and Turso DB.

---

## ✨ Key Features

* **⚡ Lightning-Fast Search**: High-performance text searching across thousands of spreadsheet cells.
* **🎯 Relevance Sorting**: Smart search ranking (Exact matches first → Starts-with matches → Contains matches).
* **🔍 Zero-Padding Search Solver**: Smart numeric variation handling (e.g. searching for `poem_82` automatically matches `poem_082` and `poem_0082`).
* **🔇 Smart Noise Exclusion**: Automatically filters out Serial Number / Index columns (e.g., `Sr No`, `S.No.`, `index`) to keep search results clean and relevant.
* **📋 Expandable Row Details**: Click any search result to expand and view **all columns from that row** with the matched column highlighted.
* **🔒 Secure Excel Uploads**: Password-protected dashboard for uploading `.xlsx` and `.xls` files.

---

## 🛠️ Tech Stack

* **Frontend & Backend**: [Next.js](https://nextjs.org/) (App Router, React, Tailwind-free premium custom CSS)
* **Database**: [Turso DB](https://turso.tech/) (libSQL cloud database)
* **Excel Parsing**: [SheetJS (xlsx)](https://sheetjs.com/)

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
UPLOAD_PASSWORD=admin1234
TURSO_URL=libsql://your-database-name.turso.io
TURSO_TOKEN=your-turso-auth-token
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 3. Upload Excel Files
1. Navigate to [http://localhost:3000/upload](http://localhost:3000/upload).
2. Enter the upload password (configured via `UPLOAD_PASSWORD`, default is `admin1234`).
3. Drag & drop or select your `.xlsx` spreadsheets and click **Upload**.
4. Return to the home page to start searching!

---

## ☁️ Deployment on Vercel

1. Push your code to your GitHub repository:
   ```bash
   git remote add origin https://github.com/jaypateljp02/excel_search
   git branch -M main
   git push -u origin main
   ```
2. Import the repository into your **[Vercel Dashboard](https://vercel.com/)**.
3. Under **Project Settings > Environment Variables**, add the environment variables:
   * `UPLOAD_PASSWORD`
   * `TURSO_URL`
   * `TURSO_TOKEN`
4. Click **Deploy**. Vercel will automatically compile and deploy your application.
