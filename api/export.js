module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      name: 'XMZ CREATE API',
      version: '1.0.0',
      endpoints: {
        '/api/export': 'POST - Validate & process project export',
        '/api/upload': 'POST - Asset upload helper',
        '/api/health': 'GET - Health check'
      },
      message: 'XMZ CREATE backend is running'
    });
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) { body = {}; }
      }
      body = body || {};
      const project = body.project;

      if (!project) {
        return res.status(400).json({ error: 'Missing project data' });
      }
      if (!project.scene || !project.scene.root) {
        return res.status(400).json({ error: 'Invalid project structure' });
      }

      return res.status(200).json({
        success: true,
        message: 'Project validated successfully',
        projectName: project.name || 'Untitled',
        mode: project.mode || '2d',
        nodeCount: countNodes(project.scene.root),
        timestamp: new Date().toISOString(),
        downloadReady: true
      });
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

function countNodes(node) {
  let count = 1;
  if (node && node.children) {
    for (const c of node.children) count += countNodes(c);
  }
  return count;
}
