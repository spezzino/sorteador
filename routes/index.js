var express = require('express');
var fs = require('fs');
var uuid = require('uuid/v4');
var axios = require('axios');
var querystring = require('querystring');
var router = express.Router();


var shuffle = function (array) {

	var currentIndex = array.length;
	var temporaryValue, randomIndex;

	// While there remain elements to shuffle...
	while (0 !== currentIndex) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;

		// And swap it with the current element.
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}

	return array;

};

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', function(req, res, next) {
  const fileName = req.files.csv.md5;
  req.files.csv.mv('./uploads/'+fileName, function() {
    res.redirect('/preview/'+fileName);
  });
});

router.get('/preview/:fileName', function(req, res, next) {
  fs.readFile('./uploads/'+req.params.fileName, 'utf8', (err, data) => {
  	const names = [];
  	data.split('\n').forEach((line) => {
  	  const info = line.split(',');
      names.push({name: info[0].trim(), email: info[1].trim()});
  	});
  	res.render('preview', { names, md5: req.params.fileName });
  });
});

router.post('/shuffle', function(req, res, next) {
  fs.readFile('./uploads/'+req.body.md5, 'utf8', (err, data) => {
  	const names = [];
  	data.split('\n').forEach((line) => {
  	  const info = line.split(',');
      names.push({name: info[0].trim(), email: info[1].trim()});
  	});
  	shuffle(names);
  	const results = [];
    const mailPromises = [];
  	let giver = names.pop();
  	results.push({to: giver, from: names[0]});
    mailPromises.push(axios.post('https://sendy.bulk-mail.xyz/subscribe',
        querystring.stringify({
          name: names[0].name,
          email: names[0].email,
          amigo: giver.name,
          list: process.env.SENDY_LIST
        })
      ));
  	while(names.length>0){
  	  let receiver = names.pop();
  	  results.push({from: giver, to: receiver});

      mailPromises.push(axios.post('https://sendy.bulk-mail.xyz/subscribe',
        querystring.stringify({
          name: giver.name,
          email: giver.email,
          amigo: receiver.name,
          list: process.env.SENDY_LIST
        })
      ));

  	  giver = receiver;
  	}
    
    Promise.all(mailPromises)
    .then((res) => console.log('mails enviados'))
    .catch((err) => console.err(err));

  	const shuffleId = uuid();
  	fs.writeFile('./uploads/'+shuffleId, JSON.stringify(results), () => {
  	  res.render('results', { results, shuffleId });
  	});
  });
});

module.exports = router;
