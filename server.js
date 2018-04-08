var express = require('express');
var app = express();
var server = require('http').createServer(app);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var io = require('socket.io')(server);

var saltRounds = 10;

var port = process.env.PORT || 3000;

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "index.html"
};

//setup passport strategy
passport.use(new LocalStrategy({
    usernameField: 'userName',
    passwordField: 'password'
  },
  function(username, password, done) {
    uModel.findOne({userName: username}, function (err, user) {
      if (err) { return done(err); }
      //Incorrect username
      if (!user) {
        return done(null, false);
      }
      //Incorrect password
      //bcrypt.compareSync(myPlaintextPassword, hash)
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false);
      }
      //both userName and passWord correct
      return done(null,user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

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

//pre hook to bcrypt password
User.pre('save', function(next){
  var user = this;
  if (!user.isModified('password')) return next();

  bcrypt.genSalt(saltRounds, function(err, salt){
    if(err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash){
      if(err) return next(err);

      user.password = hash;
      next();
    });
  });
});

//setup passport for use
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', express.static('./public', options));

// register user
app.post('/register', function(req,res){
  console.log('entered /register');

  var newUser = new uModel({
    'userName':req.body.userName,
    'password':req.body.password,
    'lastName':req.body.lastName,
    'firstName':req.body.firstName,
    'age': req.body.age,
    'gender': req.body.gender,
    'email': req.body.email,
    'wins': 0,
    'losses': 0
  });
  newUser.save(function(err){
    if(err) throw(err);
    res.send('User Registered');//temporary response to see if creation works as intended, change later
  });
});

//authenticate login request
app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res) {
  console.log('entered /login');
  res.send('logged in');
});

//logout user
app.post('/logout', function(req, res){
  console.log('entered /logout');
  req.logout();
  res.send('logged out');
});

io.on('connection', function(socket) {
  // Reference: https://ayushgp.github.io/Tic-Tac-Toe-Socket-IO/

  /**
   * Create a new game room and notify the creator of game.
   */
  socket.on('createGame', function(data){
    socket.join('room-' + ++rooms);
    socket.emit('newGame', {name: data.name, room: 'room-'+rooms});
  });

  /**
   * Connect the Player 2 to the room he requested. Show error if room full.
   */
  socket.on('joinGame', function(data){
    var room = io.nsps['/'].adapter.rooms[data.room];
    if(room && room.length == 1){
      socket.join(data.room);
      socket.broadcast.to(data.room).emit('player1', {});
      socket.emit('player2', {name: data.name, room: data.room })
    } else {
      socket.emit('err', {message: 'Sorry, The room is full!'});
    }
  });

  /**
   * Handle the turn played by either player and notify the other.
   */
  socket.on('playTurn', function(data){
    socket.broadcast.to(data.room).emit('turnPlayed', {
      cell: data.cell,
      room: data.room
    });
  });

  /**
   * Notify the players about the victor.
   */
  socket.on('gameEnded', function(data){
    socket.broadcast.to(data.room).emit('gameEnd', data);
  });
});

server.listen(port);
console.log('running on port',port);