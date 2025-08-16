const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { generateTestCode, validateDom } = require('../services/openai');
const { runTest } = require('../services/playwright');

const router = express.Router();
const tests = new Map();

router.post('/', async (req, res) => {
  const { description, url } = req.body || {};
  if (!description || !url) {
    return res.status(400).json({ error: 'description and url required' });
  }

  const id = uuidv4();
  tests.set(id, { status: 'running' });

  (async () => {
    try {
      const code = await generateTestCode(description, url);
      const { dom, screenshot } = await runTest(code);
      const result = await validateDom(description, dom, screenshot);
      tests.set(id, {
        status: 'completed',
        result,
        screenshot: `data:image/png;base64,${screenshot}`
      });
    } catch (err) {
      tests.set(id, { status: 'error', error: err.message });
    }
  })();

  res.json({ id });
});

router.get('/:id/results', (req, res) => {
  const data = tests.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'not found' });
  res.json(data);
});

module.exports = router;
