
var express         = require('express');
var app             = express();
var port            = process.env.PORT || 8080;
var path            = require('path');
var mongoose        = require('mongoose');
var passport        = require('passport');
var flash           = require('connect-flash');
var morgan          = require('morgan');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var session         = require('express-session');
var configDB        = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// Enable SSL in production

//  var forceSsl = function (req, res, next) {
//     if (req.headers['x-forwarded-proto'] !== 'https') {
//         return res.redirect(['https://', req.get('Host'), req.url].join(''));
//     }
//     return next();
//  };

// app.use(forceSsl);

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs'); // set up ejs for templating

// required for passport
app.use(session({ secret: 'atlasvehicles', maxAge: 60000 })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// static files ================================================================
app.use(express.static(path.join(__dirname, 'public'))); // routes static file requests to /public directory

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port); 