var http = require('http');
var fs = require('fs');
var decks = require('./scripts/decks');

var xmlFile;
console.log(decks);
var server = http.createServer(function (req, res) {
  console.log('request was made: ' + req.url);
  if (req.url === '/decks' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(__dirname + '/decks.html', 'utf8').pipe(res);
  } else if (req.url === '/playhand') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(__dirname + '/playhand.html', 'utf8').pipe(res);
  } else if (req.url === '/alldecks') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(__dirname + '/alldecks.html', 'utf8').pipe(res);
  } else if (req.url === '/deckcomparison') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(__dirname + '/deckcomparison.html', 'utf8').pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    fs.createReadStream(__dirname + '/404.html', 'utf8').pipe(res);
  }
});
server.listen(8080);
console.log('Listening on Port 8080');
