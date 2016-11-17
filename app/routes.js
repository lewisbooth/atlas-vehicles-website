module.exports = function(app, passport, nodemailer, bcrypt, crypto) {

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
    // CONTACT =============================
    // =====================================   
    // show the contact form
    app.get('/contact', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('request-access.ejs', { message: req.flash('contactMessage') });
    });

    // process the contact form
    app.post('/contact', contactFormEmailer);

    // =====================================
    // CREATE ACCOUNT ======================
    // =====================================
    // show the signup form
    app.get('/createaccount', function(req, res) {
        // render the page and pass in any flash data if it exists
        res.render('create-account.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/createaccount', passport.authenticate('create-account', {
        successRedirect : '/success', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    app.get('/success', function(req, res) {
        res.render('success.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // CLASSIFIED SECTION ==================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    
    app.get('/classified', isLoggedIn, function(req, res) {
        res.render('classified/overview.ejs', {
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

    // =====================================
    // CONTACT FORM EMAILER ================
    // ===================================== 

    // Creates new user in database with 'authenticated = false' field, then sends an email to admin for them to manually authenticate the user using a URL (see GET /authenticate handler). Once user is authenticated they can log in at /login.

    function contactFormEmailer(req, res) {        


        //Sanitize inputs (tag removal)
        var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
        var tagOrComment = new RegExp(
            '<(?:'
            // Comment body.
            + '!--(?:(?:-*[^->])*--+|-?)'
            // Special "raw text" elements whose content should be elided.
            + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
            + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
            // Regular name
            + '|/?[a-z]'
            + tagBody
            + ')>',
            'gi');
        function sanitise(html) {
            var oldHtml;
            do {
                oldHtml = html;
                html = html.replace(tagOrComment, '');
            } while (html !== oldHtml);
            return html.replace(/</g, '&lt;');
        }

        //Generate hashed user ID
        var SHA1 = function(input){
            return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex')
        }
        
        
        var userID = SHA1(userEmail);
        
        // Email template        
        var content =                 
            '<p><b>Name:</b><br>\n\n' + sanitise(req.body.name) + '</p>' +
            '<p><b>Email:</b><br>\n\n' + sanitise(req.body.email) + '</p>' +
            '<p><b>Tel:</b><br>\n\n' + sanitise(req.body.phone) + '</p>' +
            '<p><b>Organisation:</b><br>\n\n' + sanitise(req.body.organisation) + '</p>' +
            '<p><b>Vehicle Requirements:</b><br>\n\n' + sanitise(req.body.message) + '</p>' +
            '<p><b>User ID:</b><br>\n\n' + userID + '</p>' +
            '<p><b><a href="http://localhost:8080/authenticate?' + userID + '">Authenticate this user</a></b></p>';

        mailOptions = {
            from: 'Atlas Vehicles<atlasvehiclesquery@gmail.com>', // sender address
            to: 'lewis.booth@ciconline.co.uk', // list of receivers
            subject: 'Atlas Vehicles – Access request from \n\n' + req.body.name, // Subject line            
            html: content
        };

        //Send the mail
        var transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: 'atlasvehiclesquery@gmail.com', // Your email id
                pass: 'AtlasVehicles1' // Your password
            } 
        });

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log('ERROR in authorisation request from: ' + req.body.email + error);
                return done(req.flash('contactMessage', 'Error sending email'));
            }
            
            console.log('Authorisation request from: ' + req.body.email + info.response);
            res.redirect('/success');
        });
    }
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.render('index.ejs');
}

