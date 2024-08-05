const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const userModel = require('./Models/user');
const postModel = require('./Models/posts');
const session = require('express-session');
const flash = require('connect-flash');

// Middleware setup
app.use(cookieParser());
app.use(session({
    secret: 'secret', // Change this to a more secure secret
    resave: false,
    saveUninitialized: true
}));
app.use(flash());
app.use(express.static(path.join(__dirname, 'Public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Home page
app.get('/', (req, res) => {
    let messages = {
        error: req.flash('error')
    };
    res.render('Home', { messages });
});

// Register page
app.get('/register', (req, res) => {
    res.render('Register');
});

// Handle registration
app.post('/register', async (req, res) => {
    try {
        const { fname, lname, mob, mail, address, git, pass } = req.body;

        // Check if the email already exists in the database
        const existingUser = await userModel.findOne({ mail: mail });
        if (existingUser) {
            // If the email exists, redirect to /route
            return res.redirect('/route');
        }

        // Proceed with registration
        bcrypt.genSalt(10, async (err, salt) => {
            if (err) {
                return res.status(500).send('Error generating salt');
            }

            bcrypt.hash(pass, salt, async (err, hash) => {
                if (err) {
                    return res.status(500).send('Error hashing password');
                }

                // Create new user
                let user = await userModel.create({
                    fname: fname,
                    lname: lname,
                    address: address,
                    mob: mob,
                    git: git,
                    mail: mail,
                    pass: hash
                });

                // Generate JWT token
                let token = jwt.sign({ mail: user.mail }, "secret");

                // Set the token in a cookie
                res.cookie("token", token);

                // Render main page
                res.render("main", { user, users: [] });
            });
        });
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// Handle login
app.post('/login', async (req, res) => {
    let { mail, pass } = req.body;
    let user = await userModel.findOne({ mail });

    if (!user) {
        req.flash('error', 'Invalid email or password');
        return res.redirect('/');
    }

    bcrypt.compare(pass, user.pass, (err, result) => {
        if (result) {
            let token = jwt.sign({ mail: user.mail }, "secret");
            res.cookie("token", token);
            res.redirect('/main'); // Redirect to the main page after successful login
        } else {
            req.flash('error', 'Invalid email or password');
            res.redirect('/'); // Render the home page with the error message
        }
    });
});

// Handle creating posts
app.post('/posts', isloggedin, async (req, res) => {
    let user = await userModel.findOne({ mail: req.user.mail });
    let content = req.body.content;

    let post = await postModel.create({
        user: user._id,
        content: content
    });

    user.posts.push(post._id);
    await user.save();

    // Fetch all users along with their posts
    let users = await userModel.find().populate('posts').exec();
    res.render("main", { user, users });
});

// Main page
app.get('/main', isloggedin, async function (req, res) {
    try {
        // Fetch all users along with their posts
        let users = await userModel.find().populate('posts').exec();
        let currentUser = await userModel.findOne({ mail: req.user.mail }).exec();
        res.render('main', { users, user: currentUser });
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

// Middleware to check if user is logged in
function isloggedin(req, res, next) {
    if (!req.cookies.token) return res.redirect('/');
    
    try {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    } catch (err) {
        res.redirect('/');
    }
}

// Handle logout
app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
