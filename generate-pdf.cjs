const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { execSync } = require('child_process');

console.log('=== Eventra Academic Report PDF Generator ===');

const mdPath = path.join(__dirname, 'EVENTRA_FINAL_PROJECT_REPORT.md');
const htmlPath = path.join(__dirname, 'EVENTRA_FINAL_PROJECT_REPORT.html');
const pdfPath = path.join(__dirname, 'EVENTRA_FINAL_PROJECT_REPORT.pdf');

if (!fs.existsSync(mdPath)) {
  console.error(`Error: Markdown file not found at ${mdPath}`);
  process.exit(1);
}

console.log(`Reading Markdown file: ${mdPath}...`);
let mdContent = fs.readFileSync(mdPath, 'utf8');

// 1. Preprocess markdown
// Replace \newpage with <div class="page-break"></div>
mdContent = mdContent.replace(/\\newpage/g, '\n\n<div class="page-break"></div>\n\n');

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: false,
});

console.log('Parsing Markdown to HTML...');
let parsedHtml = marked.parse(mdContent);

// Transform mermaid code blocks to <div class="mermaid">...</div>
parsedHtml = parsedHtml.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, (match, code) => {
  // Decode HTML entities if any
  const decoded = code
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return `<div class="mermaid-container"><div class="mermaid">\n${decoded}\n</div></div>`;
});

// Wrap chapter titles with page-break class
parsedHtml = parsedHtml.replace(/<h1 id="chapter-([0-9]+)[^"]*">([\s\S]*?)<\/h1>/gi, (match, num, title) => {
  return `<div class="page-break"></div><h1 class="chapter-heading" id="chapter-${num}">${title}</h1>`;
});

parsedHtml = parsedHtml.replace(/<h1 id="references">([\s\S]*?)<\/h1>/gi, (match, title) => {
  return `<div class="page-break"></div><h1 class="chapter-heading" id="references">${title}</h1>`;
});

parsedHtml = parsedHtml.replace(/<h1 id="appendices">([\s\S]*?)<\/h1>/gi, (match, title) => {
  return `<div class="page-break"></div><h1 class="chapter-heading" id="appendices">${title}</h1>`;
});

// Construct complete, professional HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Eventra — Final Year Project Report</title>
  <style>
    /* =========================================================
       ACADEMIC REPORT STYLESHEET (B.Tech Final Year Guidelines)
       Size: A4 | Font: Times New Roman | 1.5 Spacing | Justified
       ========================================================= */

    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 20mm; /* Standard academic margins: Left 25mm, Right 20mm, Top 25mm, Bottom 25mm */
      @bottom-center {
        content: counter(page);
        font-family: 'Times New Roman', Times, serif;
        font-size: 10pt;
        color: #555;
      }
    }

    @page :first {
      margin: 20mm;
      @bottom-center { content: ""; }
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    html, body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.39;
      color: #111;
      background: #fff;
      margin: 0;
      padding: 0;
      text-align: justify;
      text-justify: inter-word;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always !important;
      break-before: page !important;
      height: 0;
      margin: 0;
      padding: 0;
    }

    /* Avoid breaks inside critical blocks */
    table, tr, td, th, pre, blockquote, .mermaid-container, .no-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-weight: bold;
      color: #000;
      page-break-after: avoid !important;
      break-after: avoid !important;
      margin-top: 1.0em;
      margin-bottom: 0.6em;
      text-align: left;
    }

    /* Headings Sizing */
    h1 {
      font-size: 18pt;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1.5pt solid #222;
      padding-bottom: 4pt;
      margin-top: 1.8em;
    }

    .chapter-heading {
      font-size: 20pt;
      text-align: center;
      margin-top: 2em;
      margin-bottom: 1.2em;
      border-bottom: 2pt solid #000;
      padding-bottom: 8pt;
    }

    h2 {
      font-size: 15pt;
      border-bottom: 0.5pt solid #888;
      padding-bottom: 2pt;
      margin-top: 1.3em;
    }

    h3 {
      font-size: 13pt;
      margin-top: 1.1em;
    }

    h4 {
      font-size: 11pt;
      font-style: italic;
    }

    p {
      margin-top: 0;
      margin-bottom: 0.48em;
      text-indent: 0;
    }

    strong, b {
      font-weight: bold;
    }

    em, i {
      font-style: italic;
    }

    ul, ol {
      margin-top: 0;
      margin-bottom: 1em;
      padding-left: 2em;
    }

    li {
      margin-bottom: 0.4em;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5em 0;
      font-size: 10pt;
      line-height: 1.4;
      text-align: left;
    }

    th, td {
      border: 1pt solid #444;
      padding: 4pt 6pt;
      vertical-align: top;
    }

    th {
      background-color: #f0f2f5;
      font-weight: bold;
      color: #000;
      text-align: center;
    }

    tr:nth-child(even) td {
      background-color: #fafbfc;
    }

    /* Code Blocks */
    pre {
      background-color: #f6f8fa;
      border: 1pt solid #d0d7de;
      border-radius: 4pt;
      padding: 6pt 8pt;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9pt;
      line-height: 1.45;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 1.2em 0;
    }

    code {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 9.5pt;
      background-color: #f3f4f6;
      padding: 1pt 3pt;
      border-radius: 2pt;
      border: 0.5pt solid #e5e7eb;
    }

    pre code {
      background-color: transparent;
      padding: 0;
      border: none;
      font-size: 9pt;
    }

    /* Mermaid Diagrams */
    .mermaid-container {
      margin: 2em auto;
      text-align: center;
      background: #fafbfc;
      border: 1pt solid #e1e4e8;
      border-radius: 6pt;
      padding: 14pt;
    }

    .mermaid {
      display: inline-block;
      max-width: 100%;
      margin: 0 auto;
    }

    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }

    /* Blockquotes */
    blockquote {
      margin: 1.2em 0;
      padding: 6pt 16pt;
      border-left: 3pt solid #0056b3;
      background-color: #f8fafc;
      font-style: italic;
    }

    /* Horizontal Rules */
    hr {
      border: none;
      border-top: 1pt solid #ccc;
      margin: 2em 0;
    }
  </style>

  <!-- Mermaid.js for vector diagram rendering -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'neutral',
      securityLevel: 'loose',
      themeVariables: {
        fontSize: '11px',
        fontFamily: 'Times New Roman, serif'
      }
    });
  </script>
</head>
<body>
  ${parsedHtml}
</body>
</html>`;

console.log(`Writing HTML to: ${htmlPath}...`);
fs.writeFileSync(htmlPath, fullHtml, 'utf8');

console.log('HTML file successfully generated.');
console.log('Initiating Headless Chrome / Edge PDF generation...');

// Find browser executable
const chromeCandidates = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

let browserExe = null;
for (const cand of chromeCandidates) {
  if (fs.existsSync(cand)) {
    browserExe = cand;
    break;
  }
}

if (!browserExe) {
  console.error('Error: Neither Google Chrome nor Microsoft Edge executable was found.');
  process.exit(1);
}

console.log(`Using Browser executable: ${browserExe}`);

const cmd = `"${browserExe}" --headless --disable-gpu --run-all-compositor-stages-before-draw --virtual-time-budget=8000 --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;

console.log('Executing PDF export (this may take 15-30 seconds to render all diagrams and pages)...');
try {
  execSync(cmd, { stdio: 'inherit' });
  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log('');
    console.log('========================================================');
    console.log('🎉 SUCCESS! Academic Project Report PDF Created!');
    console.log(`File: ${pdfPath}`);
    console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
    console.log('========================================================');
  } else {
    console.error('Error: PDF file was not created.');
    process.exit(1);
  }
} catch (err) {
  console.error('Execution error during PDF creation:', err.message);
  process.exit(1);
}
