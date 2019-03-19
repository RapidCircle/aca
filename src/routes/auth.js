/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


var express = require('express');
var passport = require('passport');
var router = express.Router();
const debug = require('nodejs-msgraph-utils/utils/logger.js')('auth');

/* GET auth callback. */
router.get('/signin',
  function  (req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
        response: res,
        prompt: 'login',
        failureRedirect: '/',
        failureFlash: true,
        tenantIdOrName: process.env.tenantId
      }
    )(req,res,next);
  },
  function(req, res) {
    res.render('/');
  }
);

router.post('/callback',
  function(req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
        response: res,
        failureRedirect: '/',
        failureFlash: true
      }
    )(req,res,next);
  },
  function(req, res) {
    res.render('loggedin');
  }
);

router.get('/signout',
  function(req, res) {
    req.session.destroy(function(err) {
      req.logout();
      res.redirect('/');
    });
  }
);

router.get('/info', 
  function(req, res) {
    if (!req.isAuthenticated()) {
      res.send(401);
    }
    else {
      res.send({
        username: req.user.profile.email,
        displayName: req.user.profile.displayName
      });
    }
  }
);

module.exports = router;