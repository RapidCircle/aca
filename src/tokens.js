/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

const debug = require('nodejs-msgraph-utils/utils/logger.js')('oauth');

module.exports = {
  getAccessToken: async function(req) {    
    if (req.user) {
      // Get the stored token
      var storedToken = req.user.oauthToken;
      
      if (storedToken) {
        if (storedToken.expired()) {
          // refresh token
          var newToken = await storedToken.refresh();

          // Update stored token
          req.user.oauthToken = newToken;
          return newToken.token.access_token;
        }

        // Token still valid, just return it
        return storedToken.token.access_token;
      }
    }
  }
};