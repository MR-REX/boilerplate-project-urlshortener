require('dotenv').config();

const express = require('express');
const cors = require('cors');

const URL = require('url').URL;

const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
  extended: false
}));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const urls = [];
const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;

function validateUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObject = new URL(url);

    if (!urlPattern.test(url)) {
      reject(new Error('Invalid URL'));
      return;
    }

    resolve({
      exists: true,
      url
    });
  });
}

function getShortLinkUrl(linkId) {
  return (linkId && urls[linkId - 1]) || null;
}

function addShortLinkId(url) {
  let linkId = urls.indexOf(url);

  if (linkId === -1) {
    urls.push(url);
    linkId = urls.length;
  }

  return linkId;
}

app.post('/api/shorturl', function(req, res) {
  validateUrl(req.body.url).then(result => {
    if (!result.exists) {
      throw new Error('URL doesn\'t exists');
    }

    res.json({
      original_url: result.url,
      short_url: addShortLinkId(result.url)
    });
  }).catch(error => res.json({ error: 'invalid url' }));
});

app.get('/api/shorturl/:shorturl_id', function(req, res) {
  const linkId = +req.params.shorturl_id;
  const url = getShortLinkUrl(linkId);

  if (!url) {
    res.json({ error: 'No short URL found for the given input' })
    return;
  }

  res.redirect(url);
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
