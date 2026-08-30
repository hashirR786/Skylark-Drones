/**
 * Vercel Serverless Function: Monday.com GraphQL API Proxy
 * Solves CORS issues for browser-to-Monday.com API calls
 * 
 * Usage: POST /api/monday
 * Headers: Authorization: Bearer <MONDAY_API_TOKEN> (optional, can be in body)
 * Body: { query: string, variables?: object, apiKey?: string }
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, variables, apiKey } = req.body;
  const token = apiKey || req.headers.authorization?.replace('Bearer ', '') || process.env.MONDAY_API_TOKEN;

  if (!token) {
    return res.status(401).json({ error: 'Monday.com API token is required' });
  }

  if (!query) {
    return res.status(400).json({ error: 'GraphQL query is required' });
  }

  try {
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'API-Version': '2024-01',
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: `Monday.com API error: ${response.statusText}`, details: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Monday.com proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch from Monday.com', message: error.message });
  }
}
