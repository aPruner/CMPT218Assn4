var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

var port = process.env.PORT || 3000;

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "index.html"
};

//setup passport strategy
passport.use(new LocalStrategy(
  function(username, password, done) {
    uModel.findOne({uname: username}, function (err, user){
      if (err) { return done(err); }
      //Incorrect username
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      //Incorrect password
      if (!user.verifyPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null,user);
    });
  }
));

//setup mongoose connection
mongoose.connect("mongodb://assignment4:assignment4@ds123399.mlab.com:23399/a3db");
var db = mongoose.connection;

db.once('open', function(){
  console.log('connection success');
});

// create Schema
var Schema = mongoose.Schema;

var User = new Schema ({
  userName: String,
  password: String,
  lastName: String,
  firstName: String,
  age: Number,
  gender: String,
  email: String,
  wins: Number,
  losses: Number
});

//create model
var uModel = mongoose.model('uModel', User);

//setup passport for use
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', express.static('./public', options));

// register user
app.post('/register', function(req,res){
  console.log('entered /register');

  uModel.create({
    'userName':req.body.userName,
    'password':req.body.password, //change to bcrypted password next
    'lastName':req.body.lastName,
    'firstName':req.body.firstName,
    'age': req.body.age,
    'gender': req.body.gender,
    'email': req.body.email,
    'wins': 0,
    'losses': 0
  }, function(err){
    if(err) throw(err);
    res.send('User Registered');//temporary response to see if creation works as intended, change later
  });
});

app.listen(port);
console.log('running on port',port);