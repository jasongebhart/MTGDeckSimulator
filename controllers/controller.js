module.exports = function(app){

  app.get('/', function(req, res){
    res.render('decks');
  });

  app.get('/decks', function(req, res){
    res.render('decks');
  });

  app.get('/playhand', function(req, res){
    res.render('playhand');
  });

  app.get('/handsimulation', function(req, res){
    res.render('handsimulation');
  });

  app.get('/alldecks', function(req, res){
    res.render('alldecks');
  });

let XMLFile;

  app.post('/clicked', (req, res) => {
    const click = {clickTime: new Date()};
    var XMLFile = req.body.XMLFile;
    //XMLFile = req.body.XMLFile

        console.log(XMLFile);
    console.log(click);
    res.sendStatus(201);
  });

};
