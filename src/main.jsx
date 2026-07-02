import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import html2pdf from 'html2pdf.js';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';
import './styles.css';

const money = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

function App() {
  const [invoice, setInvoice] = useState({
    consultantName: 'Your Name',
    consultantTitle: 'Software Development & Consulting',
    consultantEmail: 'you@example.com',
    consultantPhone: '(000) 000-0000',
    consultantAddress: 'Street Address\nCity, State ZIP',
    invoiceNumber: 'INV-0001',
    invoiceDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    dueDate: 'Due upon receipt',
    terms: 'Due upon receipt',
    clientCompany: 'Client Company',
    clientContact: 'Client Contact',
    clientEmail: 'client@example.com',
    clientAddress: 'Client Street Address\nCity, State ZIP',
    paymentInstructions: 'ACH / Check / Zelle details go here.',
    notes: 'Thank you for your business.',
    accent: '#2557A7',
  });

  const [items, setItems] = useState([
    { description: 'Software development services', qty: 1, rate: 950 },
  ]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0), [items]);
  const tax = 0;
  const total = subtotal + tax;

  const setField = (field, value) => setInvoice((prev) => ({ ...prev, [field]: value }));
  const setItem = (index, field, value) => setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const addItem = () => setItems((prev) => [...prev, { description: '', qty: 1, rate: 0 }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const exportPdf = () => {
    const element = document.getElementById('invoice-document');
    html2pdf()
      .set({
        margin: 0,
        filename: `${invoice.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(element)
      .save();
  };

  const exportWord = async () => {
    const doc = buildWordDocument(invoice, items, subtotal, tax, total);
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${invoice.invoiceNumber || 'invoice'}.docx`);
  };

  return (
    <main className="app" style={{ '--accent': invoice.accent }}>
      <style data-export>{exportStyles}</style>
      <section className="editor no-print">
        <div className="editor-header">
          <div>
            <h1>Invoice Generator</h1>
            <p>Edit the fields, then export to PDF or Word.</p>
          </div>
          <div className="actions">
            <button onClick={exportPdf}>Export PDF</button>
            <button className="secondary" onClick={exportWord}>Export Word</button>
          </div>
        </div>

        <div className="form-grid">
          {Object.entries(invoice).map(([key, value]) => key === 'accent' ? (
            <label key={key}>Accent Color<input type="color" value={value} onChange={(e) => setField(key, e.target.value)} /></label>
          ) : key.toLowerCase().includes('address') || key === 'paymentInstructions' || key === 'notes' ? (
            <label key={key}>{labelize(key)}<textarea value={value} onChange={(e) => setField(key, e.target.value)} /></label>
          ) : (
            <label key={key}>{labelize(key)}<input value={value} onChange={(e) => setField(key, e.target.value)} /></label>
          ))}
        </div>

        <h2>Line Items</h2>
        <div className="line-editor">
          {items.map((item, index) => (
            <div className="line-row" key={index}>
              <textarea placeholder="Description" value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} />
              <input type="number" placeholder="Qty" value={item.qty} onChange={(e) => setItem(index, 'qty', e.target.value)} />
              <input type="number" placeholder="Rate" value={item.rate} onChange={(e) => setItem(index, 'rate', e.target.value)} />
              <button className="ghost" onClick={() => removeItem(index)}>Remove</button>
            </div>
          ))}
          <button className="secondary" onClick={addItem}>Add Line Item</button>
        </div>
      </section>

      <Invoice invoice={invoice} items={items} subtotal={subtotal} tax={tax} total={total} />
    </main>
  );
}

function Invoice({ invoice, items, subtotal, tax, total }) {
  return (
    <section id="invoice-document" className="invoice-sheet">
      <div className="top-rule" />
      <header className="invoice-header">
        <div>
          <div className="brand-mark">{initials(invoice.consultantName)}</div>
          <h1>{invoice.consultantName}</h1>
          <p>{invoice.consultantTitle}</p>
        </div>
        <div className="invoice-title">
          <span>Invoice</span>
          <strong>{invoice.invoiceNumber}</strong>
        </div>
      </header>

      <section className="invoice-meta">
        <div className="party-card">
          <span className="eyebrow">From</span>
          <strong>{invoice.consultantName}</strong>
          <p>{lines(invoice.consultantAddress)}</p>
          <p>{invoice.consultantEmail}<br />{invoice.consultantPhone}</p>
        </div>
        <div className="party-card">
          <span className="eyebrow">Bill To</span>
          <strong>{invoice.clientCompany}</strong>
          <p>{invoice.clientContact}<br />{invoice.clientEmail}</p>
          <p>{lines(invoice.clientAddress)}</p>
        </div>
        <div className="summary-card">
          <Meta label="Invoice Date" value={invoice.invoiceDate} />
          <Meta label="Due Date" value={invoice.dueDate} />
          <Meta label="Terms" value={invoice.terms} />
        </div>
      </section>

      <table className="items-table">
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{lines(item.description)}</td>
              <td>{item.qty}</td>
              <td>{money(item.rate)}</td>
              <td>{money(Number(item.qty || 0) * Number(item.rate || 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="totals">
        <div className="payment-box">
          <span className="eyebrow">Payment Instructions</span>
          <p>{lines(invoice.paymentInstructions)}</p>
        </div>
        <div className="totals-box">
          <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
          <div><span>Tax</span><strong>{money(tax)}</strong></div>
          <div className="grand-total"><span>Total Due</span><strong>{money(total)}</strong></div>
        </div>
      </section>

      <footer>
        {invoice.notes}
      </footer>
    </section>
  );
}


const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const LIGHT_BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'E7EAF0' };

function text(value, options = {}) {
  return new TextRun({ text: String(value ?? ''), ...options });
}

function cell(children, options = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    borders: options.borders || { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER },
    shading: options.shading,
    width: options.width,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
  });
}

function multilineParagraphs(value, opts = {}) {
  return String(value || '').split('\n').map((line) => new Paragraph({
    children: [text(line, opts.text || {})],
    spacing: { after: 80 },
  }));
}

function buildWordDocument(invoice, items, subtotal, tax, total) {
  const accent = invoice.accent.replace('#', '').toUpperCase();
  const rows = items.map((item) => new TableRow({ children: [
    cell(multilineParagraphs(item.description), { borders: { bottom: LIGHT_BORDER, top: NO_BORDER, left: NO_BORDER, right: NO_BORDER }, width: { size: 55, type: WidthType.PERCENTAGE } }),
    cell(new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(item.qty)] }), { borders: { bottom: LIGHT_BORDER, top: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
    cell(new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(money(item.rate))] }), { borders: { bottom: LIGHT_BORDER, top: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
    cell(new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(money(Number(item.qty || 0) * Number(item.rate || 0)), { bold: true })] }), { borders: { bottom: LIGHT_BORDER, top: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
  ]}));

  return new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 24, color: accent } }, spacing: { after: 420 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }, rows: [
          new TableRow({ children: [
            cell([
              new Paragraph({ children: [text(invoice.consultantName, { bold: true, size: 34 })] }),
              new Paragraph({ children: [text(invoice.consultantTitle, { color: '536071', size: 20 })] }),
            ]),
            cell([
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [text('INVOICE', { bold: true, size: 24, color: '536071' })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(invoice.invoiceNumber, { bold: true, size: 26 })] }),
            ]),
          ]})
        ]}),
        new Paragraph({ spacing: { after: 240 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }, rows: [
          new TableRow({ children: [
            cell([new Paragraph({ children: [text('FROM', { bold: true, color: accent, size: 18 })] }), new Paragraph({ children: [text(invoice.consultantName, { bold: true })] }), ...multilineParagraphs(invoice.consultantAddress), new Paragraph({ children: [text(invoice.consultantEmail)] }), new Paragraph({ children: [text(invoice.consultantPhone)] })], { borders: { top: LIGHT_BORDER, bottom: LIGHT_BORDER, left: LIGHT_BORDER, right: LIGHT_BORDER } }),
            cell([new Paragraph({ children: [text('BILL TO', { bold: true, color: accent, size: 18 })] }), new Paragraph({ children: [text(invoice.clientCompany, { bold: true })] }), new Paragraph({ children: [text(invoice.clientContact)] }), new Paragraph({ children: [text(invoice.clientEmail)] }), ...multilineParagraphs(invoice.clientAddress)], { borders: { top: LIGHT_BORDER, bottom: LIGHT_BORDER, left: LIGHT_BORDER, right: LIGHT_BORDER } }),
            cell([
              new Paragraph({ children: [text('Invoice Date: ', { color: '536071' }), text(invoice.invoiceDate, { bold: true })] }),
              new Paragraph({ children: [text('Due Date: ', { color: '536071' }), text(invoice.dueDate, { bold: true })] }),
              new Paragraph({ children: [text('Terms: ', { color: '536071' }), text(invoice.terms, { bold: true })] }),
            ], { borders: { top: LIGHT_BORDER, bottom: LIGHT_BORDER, left: LIGHT_BORDER, right: LIGHT_BORDER } }),
          ]})
        ]}),
        new Paragraph({ spacing: { after: 280 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }, rows: [
          new TableRow({ children: ['Description', 'Qty', 'Rate', 'Amount'].map((h, idx) => cell(new Paragraph({ alignment: idx ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [text(h.toUpperCase(), { bold: true, color: '6B7280', size: 18 })] }), { borders: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'D9DEE8' } } })) }),
          ...rows,
        ]}),
        new Paragraph({ spacing: { after: 240 } }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER }, rows: [
          new TableRow({ children: [
            cell([new Paragraph({ children: [text('PAYMENT INSTRUCTIONS', { bold: true, color: accent, size: 18 })] }), ...multilineParagraphs(invoice.paymentInstructions)], { borders: { top: LIGHT_BORDER, bottom: LIGHT_BORDER, left: LIGHT_BORDER, right: LIGHT_BORDER } }),
            cell([
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(`Subtotal  ${money(subtotal)}`)] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(`Tax  ${money(tax)}`)] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [text(`TOTAL DUE  ${money(total)}`, { bold: true, size: 28 })] }),
            ], { shading: { type: ShadingType.CLEAR, fill: 'F7F8FB' }, borders: { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER } }),
          ]})
        ]}),
        new Paragraph({ spacing: { before: 360 }, children: [text(invoice.notes, { color: '6B7280' })] }),
      ],
    }],
  });
}

function Meta({ label, value }) {
  return <div className="meta-row"><span>{label}</span><strong>{value}</strong></div>;
}

function labelize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}
function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'YN';
}
function lines(text) {
  return String(text || '').split('\n').map((line, i) => <React.Fragment key={i}>{line}{i < String(text || '').split('\n').length - 1 && <br />}</React.Fragment>);
}

const exportStyles = `
body { margin: 0; font-family: Arial, sans-serif; color: #172033; }
.invoice-sheet { width: 8.5in; min-height: 11in; padding: .72in; box-sizing: border-box; background: white; }
.top-rule { height: 8px; background: var(--accent, #2557A7); border-radius: 999px; margin-bottom: 42px; }
.invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 46px; }
.brand-mark { width: 44px; height: 44px; border-radius: 14px; background: var(--accent, #2557A7); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 14px; }
h1 { margin: 0; font-size: 28px; letter-spacing: -0.04em; }
p { margin: 6px 0 0; line-height: 1.5; color: #536071; }
.invoice-title { text-align: right; text-transform: uppercase; color: #536071; letter-spacing: .15em; }
.invoice-title strong { display: block; margin-top: 8px; color: #172033; font-size: 18px; letter-spacing: 0; }
.invoice-meta { display: grid; grid-template-columns: 1.2fr 1.2fr 1fr; gap: 18px; margin-bottom: 42px; }
.party-card, .summary-card, .payment-box { border: 1px solid #E7EAF0; border-radius: 18px; padding: 20px; }
.eyebrow { display: block; color: var(--accent, #2557A7); font-size: 11px; text-transform: uppercase; letter-spacing: .16em; font-weight: bold; margin-bottom: 10px; }
.party-card strong { font-size: 16px; }
.meta-row { display: flex; justify-content: space-between; gap: 18px; padding: 8px 0; border-bottom: 1px solid #EEF1F5; }
.meta-row:last-child { border-bottom: 0; }
.meta-row span { color: #6B7280; }
.items-table { width: 100%; border-collapse: collapse; margin-bottom: 36px; }
.items-table th { text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: .12em; border-bottom: 1px solid #D9DEE8; padding: 0 0 12px; }
.items-table td { padding: 18px 0; border-bottom: 1px solid #EEF1F5; vertical-align: top; }
.items-table th:nth-child(n+2), .items-table td:nth-child(n+2) { text-align: right; }
.totals { display: grid; grid-template-columns: 1fr 260px; gap: 28px; align-items: start; }
.totals-box { border-radius: 20px; background: #F7F8FB; padding: 18px 20px; }
.totals-box div { display: flex; justify-content: space-between; padding: 8px 0; color: #536071; }
.grand-total { margin-top: 10px; padding-top: 16px !important; border-top: 1px solid #D9DEE8; color: #172033 !important; font-size: 18px; }
footer { margin-top: 44px; color: #6B7280; font-size: 13px; }
`;

createRoot(document.getElementById('root')).render(<App />);
