// =====================================
// CONTACT FORM EMAILER ================
// ===================================== 

// Creates new user in database with 'authenticated = false' field, then sends an email to the site admin with manual authentication link (see GET /authenticate handler). Once user is manually authenticated they can log in at /login.

var nodemailer      = require('nodemailer');
var bcrypt          = require('bcrypt-nodejs');
var crypto          = require('crypto');
var User            = require('../app/models/user');

module.exports = function contactFormEmailer(req, res, done) {

    // =====================================
    // SANITIZE INPUTS =====================
    // ===================================== 

    // Function for sanitising inputs (tag removal)
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

    // Generate unique user ID with a fast 20-character hash
    var sha1 = function(input){
        return crypto.createHash('sha1').update(JSON.stringify(input)).digest('hex')
    }

    var generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    
    // Sanitise form inputs
    var userName            = sanitise(req.body.name);
    var userEmail           = sanitise(req.body.email);
    var userPassword        = sanitise(req.body.password);
    var userPasswordHash    = generateHash(userPassword);
    var userPhone           = sanitise(req.body.phone);
    var userOrganisation    = sanitise(req.body.organisation);
    var userRequirements    = sanitise(req.body.message);
    var userID              = sha1(req.body.email);

    // =====================================
    // ADD USER TO DATABASE & SEND EMAIL ===
    // ===================================== 

    // check to see if the user trying to login already exists
    User.findOne({ 'local.email' :  userEmail }, function(err, user) {
    
        if (err)
            return console.log(err);

        // flash message if user exists
        if (user) {
            req.flash('requestMessage', 'An account with this email address already exists');
            res.render('request-access.ejs', { message: req.flash('requestMessage') });
        } else {            
            // if there is no user with that email
            // create the user
            var newUser            = new User();

            // set the user's local credentials
            newUser.local.name          = userName;
            newUser.local.email         = userEmail;
            newUser.local.phone         = userPhone;
            newUser.local.organisation  = userOrganisation;
            newUser.local.userID        = userID;
            newUser.local.requirements  = userRequirements;
            newUser.local.password      = userPasswordHash;
            newUser.local.authenticated = 'false';

            // save the user
            newUser.save(function(err) {
                if (err)
                    throw err;
                return (null, newUser);
            });     

            // Admin email template        
            var contentAdmin =                 
                '<p><b>Name:</b><br>\n\n' + userName + '</p>' +
                '<p><b>Email:</b><br>\n\n' + userEmail + '</p>' +
                '<p><b>Tel:</b><br>\n\n' + userPhone + '</p>' +
                '<p><b>Organisation:</b><br>\n\n' + userOrganisation + '</p>' +
                '<p><b>Vehicle Requirements:</b><br>\n\n' + userRequirements + '</p>' +
                '<p><b>User ID:</b><br>\n\n' + userID + '</p>' +
                
                //Generate authentication link from hashed email field
                '<p><b><a href="http://www.atlasvehicles.com/authenticate?id=' + userID + '">Authenticate this user</a></b></p>';

            mailOptionsAdmin = {
                from: 'Atlas Vehicles<atlasvehiclesquery@gmail.com>', // sender address
                to: 'Robert Pearson<rob@ciconline.co.uk>', // list of receivers
                subject: 'Atlas Vehicles – Access request from ' + req.body.name, // Subject line            
                html: contentAdmin
            };

            // User email template        
            var contentUser =                 
                '<h3>Thank you for your interest in Atlas Vehicles.</h3>' +
                '<p>We will review your details and contact you regarding your query. You will receive a confirmation email when your account is approved.</p>';

            mailOptionsUser = {
                from: 'Atlas Vehicles<atlasvehiclesquery@gmail.com>', // sender address
                to: userEmail, // list of receivers
                subject: 'Atlas Vehicles – Application received for ' + req.body.name, // Subject line            
                html: contentUser
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

            transporter.sendMail(mailOptionsAdmin, function(error, info){
                if(error){
                    console.log('ERROR in authorisation request from: ' + req.body.email + error);                    
                    req.flash('requestMessage', 'Error sending request, please try again');
                    res.render('request-access.ejs', { message: req.flash('requestMessage') });
                }
                
                req.flash('successMessage', 'Application received. We will contact you to review your details.');
                res.render('request-access.ejs', { success: req.flash('successMessage') });

            }); 

            transporter.sendMail(mailOptionsUser, function(error, info){
                if(error){
                    console.log('ERROR in authorisation request from: ' + req.body.email + error);                    
                    req.flash('requestMessage', 'Error sending request, please try again');
                    res.render('request-access.ejs', { message: req.flash('requestMessage') });
                }
                
            }); 
        }
    })
           
}
