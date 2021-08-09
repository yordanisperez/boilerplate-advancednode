'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());



app.set('view engine', 'pug');
app.set('views',process.cwd() + '/views/pug'); //Sets the directory where all the views (.pug) are stored.


myDB(async client => 
  {
      const myDataBase = await client.db('database').collection('users');
      app.route('/').get((req, res) => {
        res.render('index', {
          title: 'Connected to Database',
          message: 'Please login',
          showLogin: true
        });
      });
      app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {

        res.redirect('/profile');
      });
    
      app.route('/profile').get(ensureAuthenticated,(req, res) => {
      
        res.render('profile',{username: req.user.username});
      });

      app.route('/logout').get((req, res) => {
        req.logout();
        res.redirect('/');
      });

      passport.serializeUser((user, done) => {
        done(null, user._id);
      });
      passport.deserializeUser((id, done) => {
        myDataBase.findOne({ _id: new ObjectID(id) }, (err, doc) => {
        done(null, doc);
        });
      });


      passport.use(new LocalStrategy(
        function(username, password, done) {
          myDataBase.findOne({ username: username }, function (err, user) {
            console.log('User '+ username +' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (password !== user.password) { return done(null, false); }
            return done(null, user);
          });
        }
      ));   
  }).catch(e => {
      app.route('/').get((req, res) => {
        res.render('index', { title: e, message: 'Unable to login' });
  });
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// app.listen out here...
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
