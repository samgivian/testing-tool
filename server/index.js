const express = require('express');
const { OpenAI } = require('openai');
const { chromium } = require('playwright');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '1mb' }));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const tests = new Map();

app.post('/tests', async (req, res) => {
  const { description, url } = req.body || {};
  if (!description || !url) {
    return res.status(400).json({ error: 'description and url required' });
  }

  const id = uuidv4();
  tests.set(id, { status: 'running' });

  (async () => {
    try {
      const codePrompt = `Generate a JavaScript async function using Playwright's page object to test: ${description}. Navigate to ${url}. Return as plain code without backticks.`;
      const gen = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You generate Playwright test functions.' },
          { role: 'user', content: codePrompt }
        ]
      });
      const code = gen.choices[0].message.content.trim();

      const browser = await chromium.launch();
      const page = await browser.newPage();

      const testFunc = eval(`(async ({page}) => {${code}})`);
      await testFunc({ page });

      const dom = await page.content();
      const screenshot = await page.screenshot({ encoding: 'base64' });
      await browser.close();

      const validation = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: `Validate the following DOM against this description: ${description}` },
              { type: 'text', text: dom },
              {
                type: 'image_url',
                image_url: { url: `data:image/png;base64,${screenshot}` }
              }
            ]
          }
        ]
      });

      tests.set(id, {
        status: 'completed',
        result: validation.choices[0].message.content,
        screenshot: `data:image/png;base64,${screenshot}`
      });
    } catch (err) {
      tests.set(id, { status: 'error', error: err.message });
    }
  })();

  res.json({ id });
});

app.get('/tests/:id/results', (req, res) => {
  const data = tests.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'not found' });
  res.json(data);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
