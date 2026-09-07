module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'XMZ CREATE Upload API',
      status: 'ready',
      storage: 'client-localStorage',
      note: 'Binary assets are NOT stored on server. Editor saves images/SFX to browser localStorage only.',
      maxSizeMB: 3
    });
  }

  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      storage: 'client-localStorage',
      message: 'No server upload. Use client localStorage path in the editor.'
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
