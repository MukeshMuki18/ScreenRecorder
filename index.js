const express = require('express');

const app = express();

app.use(function(req, res, next) {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(express.static('static'));



app.listen(3000, () => {
  console.log('server started');
});
