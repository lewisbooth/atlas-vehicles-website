// =====================================
// AUTHENTICATE USER ===================
// ===================================== 

// Creates new user in database with 'authenticated = false' field, then sends an email to the site admin with manual authentication link (see GET /authenticate handler). Once user is manually authenticated they can log in at /login.

var User            = require('../app/models/user');
var nodemailer      = require('nodemailer');

module.exports = function authenticateUser(req, res, done) {

    var authID = req.query.id;
    console.log('Authentication request from: ' + req.query.id);

    // if query string exists then render authentication page, else redirect to homepage
    try {
        if (authID.length) {
            User.findOne({ 'local.userID' :  authID }, function(err, user) {    
                    
                if (err) {
                    console.log('Error authenticating user');
                    req.flash('authMessage', 'Error authenticating user');
                    res.render('authenticate.ejs', { message: req.flash('authMessage') });
                }
                // authenticate user if they exist
                if (user) {
                    console.log('User Exists');
                    req.flash('authMessage', 'User authenticated');
                    res.render('authenticate.ejs', { success: req.flash('authMessage') });

                    user.local.authenticated = true;

                    // update the user
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return (null);
                    });    

                    var userName = user.local.name;
                    var userEmail = user.local.email;

                    // Send confirmation email to user       
                    var contentUser =                 
                        '<h3>Your account has been authenticated.</h3>' +
                        '<p>To view more information about our products, please log in <a href="http://localhost:8080/login">here</a>.</p>';

                    mailOptionsUser = {
                        from: 'Atlas Vehicles<atlasvehiclesquery@gmail.com>', // sender address
                        to: userEmail, // list of receivers
                        subject: 'Atlas Vehicles – Account Authenticated for ' + userName, // Subject line            
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

                    transporter.sendMail(mailOptionsUser, function(error, info){
                        if(error){
                            console.log('ERROR in authorisation request from: ' + req.body.email + error);                    
                            req.flash('requestMessage', 'Error sending request, please try again');
                            res.render('request-access.ejs', { message: req.flash('requestMessage') });
                        }
                        
                    }); 

                } else {    
                    console.log('User does not exist');
                    req.flash('authMessage', 'User does not exist');
                    res.render('authenticate.ejs', { message: req.flash('authMessage') });
                }
            })
        }
    } catch(e) {
        res.redirect('/');
    }        
           
}