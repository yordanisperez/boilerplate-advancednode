const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;

module.exports = function (app, myDataBase) {
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
            if (!bcrypt.compareSync(password, user.password)) { 
              return done(null, false);
            }
            
            return done(null, user);
          });
        }
      ));   


      passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_GITHUB/*INSERT CALLBACK_GITHUB URL ENTERED INTO GITHUB HERE*/
      },
        function(accessToken, refreshToken, profile, cb) {
          console.log(profile);
          //Database logic here with callback containing our user object
          myDataBase.findOne({ username: profile.username }, function (err, user) 
          {
           
            if (err) { return cb(err); }
            if (!user) { 
                //Add the user to database
                myDataBase.insertOne({
                    username:profile.username
                  
                  },
                    (err, doc) => {
                      if (err) {
                        res.redirect('/');
                      } else {
                        // The inserted document is held within
                        // the ops property of the doc
                        return cb(null, doc);
                      }
                    }
                  )


                return cb(null, false);
             }
            
            
            return cb(null, user);
          });

        }

      ));


}