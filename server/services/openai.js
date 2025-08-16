const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateTestCode(description, url) {
  const codePrompt = `Generate a JavaScript async function using Playwright's page object to test: ${description}. Navigate to ${url}. Return as plain code without backticks.`;
  const gen = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You generate Playwright test functions.' },
      { role: 'user', content: codePrompt }
    ]
  });
  return gen.choices[0].message.content.trim();
}

async function validateDom(description, dom, screenshot) {
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
  return validation.choices[0].message.content;
}

module.exports = { generateTestCode, validateDom };
