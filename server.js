var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var port = process.env.PORT || 3000;

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "index.html"
};

//setup mongoose connection
mongoose.connect("mongodb://assignment4:assignment4@ds123399.mlab.com:23399/a3db");
var db = mongoose.connection;

db.once('open', function(){
  console.log('connection success');
});

// create Schema
var Schema = mongoose.Schema;

var User = new Schema ({
  uname: String,
  lname: String,
  fname: String,
  age: Number,
  gender: Boolean,//not sure yet
  email: String,
  wins: Number,
  losses: Number
});

//create model
var uModel = mongoose.model('uModel', User);

app.use('/', express.static('./public', options));

app.listen(port);
console.log('running on port',port);