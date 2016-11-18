module.exports = function(app, passport) {

    var contactFormEmailer = require('./contact-form');
    var authenticateUser = require('./authenticate-user');

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', isLoggedIn, function(req, res) {
        res.render('index.ejs', {
            user : req.user // get the user out of session and pass to template
        });           
        delete res.session.error;
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/classified', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // REQUEST ACCESS ======================
    // =====================================   
    // show the contact form
    app.get('/requestaccess', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('request-access.ejs', { message: req.flash('requestMessage'), success: req.flash('successMessage') });
    });

    // process the contact form
    app.post('/requestaccess', contactFormEmailer);

    // =====================================
    // AUTHENTICATE ACCOUNT ================
    // =====================================
    // authenticate an account from email link
     app.get('/authenticate', authenticateUser, function(req, res) {
        res.render('authenticate.ejs');           
    });

    // =====================================
    // CLASSIFIED SECTION ==================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    
    app.get('/classified', isLoggedIn, function(req, res) {
        res.render('classified/endeavour.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // ===================================== 
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });    
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.render('index.ejs');
}

