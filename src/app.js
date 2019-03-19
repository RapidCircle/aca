/**
 @author: Hans van den Akker (mysim1)
 @license SSPL
 @copyright© 2019 Rapid Circle B.V.
**/

const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const LowDbSessionStore = require('nodejs-msgraph-utils/stores/lowDbSessionStore.js')(session);
const flash = require('connect-flash');
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

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter = require('./routes/auth');
var calendarRouter = require('./routes/calendar');
var initRouter = require('./routes/init');

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

// Flash middleware
app.use(flash());

// Set up local vars for template layout
app.use(function(req, res, next) {
  // Read any flashed errors and save
  // in the response locals
  res.locals.error = req.flash('error_msg');

  // Check for simple error string and
  // convert to layout's expected format
  var errs = req.flash('error');
  for (var i in errs){
    res.locals.error.push({message: 'An error occurred', debug: errs[i]});
  }

  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

var hbs = require('hbs');
var moment = require('moment');
// Helper to format date/time sent by Graph
hbs.registerHelper('eventDateTime', function(dateTime){
  return moment(dateTime).format('M/D/YY h:mm A');
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

app.use(function(req, res, next) {
  // Set the authenticated user in the
  // template locals
  if (req.user) {
    res.locals.user = req.user.profile;
  }
  next();
});

app.use('/_api', indexRouter);
app.use('/_api/users', usersRouter);
app.use('/_auth', authRouter);
app.use('/calendar', calendarRouter);
app.use('/_api/init', initRouter);
app.use('/', proxy('localhost:3001'))

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
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
