const express = require('express');
const tests = require('./routes/tests');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use('/tests', tests);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
