/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/


var express = require('express');
var passport = require('passport');
var router = express.Router();
const graph = require('../graph.js');
const tokens = require('../tokens.js');

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
    res.send(`<script type="text/javascript">
                window.opener.postMessage('checkloggedin', '*');
                window.close();
              </script>`);
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
        displayName: req.user.profile.displayName,
        photo: '/_auth/photo'
      });
    }
  }
);

router.get('/photo',
  async function(req, res) {
    if (!req.isAuthenticated()) {
      // Redirect unauthenticated requests to home page
      res.send(401);
    } 
    else {
      // Get the access token
      let accessToken;
      try {
        accessToken = await tokens.getAccessToken(req);
      } catch (err) {
        console.log(err)
      }

      if (accessToken && accessToken.length > 0) {
        try {
          let x = await graph.getUserPhoto(accessToken);
          x.pipe(res);
        } catch (err) {
          res.send(500);
        }
      }
    }
  }
)

module.exports = router;