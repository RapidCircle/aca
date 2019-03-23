/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const LowDbSessionStore = require('nodejs-msgraph-utils/stores/lowDbSessionStore.js')(session);
const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const graph = require('./graph');
const db = require('./db.js');
const debug = require('nodejs-msgraph-utils/utils/logger.js')('app');


// Configure simple-oauth2
const oauth2 = require('simple-oauth2').create({
  client: {
    id: process.env.OAUTH_APP_ID,
    secret: process.env.OAUTH_APP_PASSWORD
  },
  auth: {
    tokenHost: process.env.OAUTH_AUTHORITY,
    authorizePath: process.env.OAUTH_AUTHORIZE_ENDPOINT,
    tokenPath: process.env.OAUTH_TOKEN_ENDPOINT
  }
});


// Configure passport
// Passport calls serializeUser and deserializeUser to
// manage users
passport.serializeUser(function(user, done) {
  debug.info('SerializeUser');
  // Use the OID property of the user as a key
  db.set(`users.${user.profile.oid}`, user).write();
  done(null, user.profile.oid);
});

passport.deserializeUser(function(id, done) {
  debug.info('DeserializeUser');
  let user = db.get(`users.${id}`).value();
  user.oauthToken = oauth2.accessToken.create(user.oauthToken.token);
  done(null, user);
});

// Callback function called once the sign-in is complete
// and an access token has been obtained
async function signInComplete(iss, sub, profile, accessToken, refreshToken, params, done) {
  if (!profile.oid) {
    return done(new Error("No OID found in user profile."), null);
  }

  try{
    const user = await graph.getUserDetails(accessToken);

    if (user) {
      // Add properties to profile
      profile['email'] = user.mail ? user.mail : user.userPrincipalName;
    }
  } catch (err) {
    done(err, null);
  }

  // Create a simple-oauth2 token from raw tokens
  let oauthToken = oauth2.accessToken.create(params);

  // Save the profile and tokens in user storage
  db.set(`users.${profile.oid}`, { profile, oauthToken }).write();  
  return done(null, { profile, oauthToken});
}

// Configure OIDC strategy
passport.use(new OIDCStrategy(
  {
    identityMetadata: `${process.env.OAUTH_AUTHORITY}${process.env.OAUTH_ID_METADATA}`,
    clientID: process.env.OAUTH_APP_ID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.OAUTH_REDIRECT_URI,
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.OAUTH_APP_PASSWORD,
    validateIssuer: true,
    passReqToCallback: false,
    scope: process.env.OAUTH_SCOPES.split(' ')
  },
  signInComplete
));



var app = express();
const sessionFile = path.resolve(__dirname, process.env.WEBSITES_ENABLE_APP_SERVICE_STORAGE? '/home/sessions.json': '../data/sessions.json');

// Session middleware
app.use(session({
  secret: 'CirclerPower',
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  cookie: {
    path: '/', 
    httpOnly: true, 
    maxAge: 365 * 24 * 3600 * 1000   // One year for example
  }, 
  store: new LowDbSessionStore({ filename: sessionFile })
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use('/_api/users', require('./routes/users.js'));
//app.use('/_api/resources', usersRouter);
//app.use('/_api/workflows', usersRouter);
app.use('/_api/jobs', require('./routes/jobs.js'));
app.use('/_api/resources', require('./routes/resources.js'));
app.use('/_api/setup', require('./routes/setup.js'));
app.use('/_auth', require('./routes/auth'));
app.use('/', proxy('localhost:3001'));

const serializeError = require('serialize-error');

app.use(function (err, req, res, next) {
  let error = serializeError(err);
  res.status(500).send(error);
});


/* Register all Resource handling workflows */
const workflow = require('./workflow.js');
workflow.use(workflow.actions.Archive, 'Microsoft.Storage/storageAccounts', require('./workflows/archiveStorageAccount.js'));
workflow.use(workflow.actions.Archive, 'Microsoft.ClassicStorage/storageAccounts', require('./workflows/archiveStorageAccount.js'));
workflow.use(workflow.actions.Delete, 'Microsoft.Storage/storageAccounts', require('./workflows/deleteStorageAccount.js'));
//workflow.use(workflow.actions.Delete, 'Microsoft.ClassicStorage/storageAccounts', require('./workflows/deleteStorageAccount.js'));
workflow.use(workflow.actions.Delete, 'Microsoft.Web/sites', require('./workflows/deleteAppService.js'));


const workflowEngine = require('./middleware/engine.js');
workflowEngine.start(oauth2);

/* The job engine processes jobs that have a recurring behaviour without any interaction from users. */
const jobEngine = require('./middleware/jobs.js');
jobEngine.start(oauth2);


module.exports = app;
