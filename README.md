# Local Invoice Generator

A simple, polished local invoice generator for software development / consulting invoices.

## Run locally

```bash
npm install
npm start
```

Then open the local URL Vite prints, usually:

```bash
http://127.0.0.1:5173
```

## Features

- Editable invoice fields
- Multi-line expandable addresses and descriptions
- Add/remove line items
- Accent color picker
- Export to PDF
- Export to Word `.docx`
- Runs locally in your browser

## Notes

- Tax is fixed at `$0.00` by default for your Florida software development use case.
- PDF export is the best-looking output.
- Word export is editable, but Word may render some web styling slightly differently.
