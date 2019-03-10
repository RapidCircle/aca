/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

var express = require('express');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  let params = {
    active: { home: true }
  };

  res.render('index', params);
});

/* GET */
router.get('/test', async function (req, res, next) {

  let x = Math.floor(Math.random() * Math.floor(10000));

  res.send({
    amount: x.toString(),
    description: 'Hello From Express'
  });
});



module.exports = router;
