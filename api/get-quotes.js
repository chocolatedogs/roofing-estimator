// api/get-quotes.js
// Place this file at: roofing-estimator/api/get-quotes.js
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // List all quote blobs
    const { blobs } = await list({ prefix: 'quotes/' });

    // Fetch each quote's JSON content
    const quotes = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const response = await fetch(blob.url);
          return await response.json();
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls and sort by date descending
    const validQuotes = quotes
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    return res.status(200).json({ quotes: validQuotes });
  } catch (err) {
    console.error('Get quotes error:', err);
    return res.status(500).json({ error: err.message });
  }
}
