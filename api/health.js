module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'XMZ CREATE',
    version: '1.0.0',
    time: new Date().toISOString(),
    runtime: 'vercel-serverless'
  });
};
