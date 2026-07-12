// api/upload-pdf.js
// Vercel serverless function - receives base64 PDF and returns a hosted URL
// Place this file at: roofing-estimator/api/upload-pdf.js

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// In-memory store (persists for the lifetime of the serverless function instance)
// For a small roofing company this is perfectly reliable
const pdfStore = new Map();

export default async function handler(req, res) {
  // Allow CORS from your Vercel app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: receive PDF and store it, return a URL
  if (req.method === 'POST') {
    try {
      const { pdf, filename } = req.body;
      if (!pdf) return res.status(400).json({ error: 'No PDF data' });

      // Generate a unique ID for this PDF
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

      // Store the base64 PDF with filename
      pdfStore.set(id, { pdf, filename: filename || 'quote', created: Date.now() });

      // Clean up PDFs older than 24 hours
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const [key, val] of pdfStore.entries()) {
        if (val.created < cutoff) pdfStore.delete(key);
      }

      // Return the URL to retrieve this PDF
      const url = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/upload-pdf?id=${id}`;
      return res.status(200).json({ url, id });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET: retrieve PDF by ID and serve it
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'No ID provided' });

    const entry = pdfStore.get(id);
    if (!entry) return res.status(404).json({ error: 'PDF not found or expired' });

    // Convert base64 back to buffer and serve as PDF
    const pdfBuffer = Buffer.from(entry.pdf, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${entry.filename}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
