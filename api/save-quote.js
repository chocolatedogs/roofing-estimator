// api/save-quote.js
// Place this file at: roofing-estimator/api/save-quote.js
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const quote = req.body;
    if (!quote || !quote.id) return res.status(400).json({ error: 'Invalid quote data' });

    // Save quote as JSON blob, keyed by job ID
    const blob = await put(
      `quotes/${quote.id}.json`,
      JSON.stringify(quote),
      { access: 'public', contentType: 'application/json', addRandomSuffix: false }
    );

    return res.status(200).json({ success: true, url: blob.url });
  } catch (err) {
    console.error('Save quote error:', err);
    return res.status(500).json({ error: err.message });
  }
}
