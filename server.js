'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes');
const auth = require('./auth.js');


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
      routes(app, myDataBase);
      auth(app, myDataBase);


  }).catch(e => {
      app.route('/').get((req, res) => {
        res.render('index', { title: e, message: 'Unable to login' });
  });
});




// app.listen out here...
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
