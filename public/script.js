var io = require('socket.io-client');
var p1 = 'X', p2 = 'O';
var socket = io.connect('http://localhost:3000'), player, game;

var app = new Vue({
  el: '#app',
  data: {
    // app state
    loginInfo: {
      userName: '',
      password: ''
    },
    signUpInfo: {
      firstName: '',
      lastName: '',
      age: 0,
      email: '',
      gender: '',
      userName: '',
      password: '',
      passwordConfirm: ''
    },
    currentUserData: {
      userName: 'vberezny',
      wins: 0,
      losses: 0
    },
    page: 'landing'
  },
  methods: {
    switchToLogin: function() {
      app.page = 'login';
    },
    switchToSignup: function() {
      app.page = 'signup';
    },
    switchToLanding: function() {
      app.page = 'landing';
    },
    registerUser: function() {
      //TODO: add checks for all other variables being filled in (or input validation on front end)
      if(app.signUpInfo.password === app.signUpInfo.passwordConfirm) {
        $.ajax({
          method: 'post',
          url: '/register',
          data: {
            firstName: app.signUpInfo.firstName,
            lastName: app.signUpInfo.lastName,
            age: app.signUpInfo.age,
            email: app.signUpInfo.email,
            gender: app.signUpInfo.gender,
            userName: app.signUpInfo.userName,
            password: app.signUpInfo.password
          },
          success: function (data) {
            alert(data); //temporary to prevent errors
          }
        });
      } else {
        alert('passwords do not match');
      }
    },
    loginUser: function() {
      $.ajax({
        method: 'post',
        url: '/login',
        data: {
          userName: app.loginInfo.userName,
          password: app.loginInfo.password
        },
        success: function(data) {
          console.log(data);
          if(data === 'logged in') {
            alert(data); //temporary to prevent errors
            app.page = 'home';
            app.currentUserData.userName = app.loginInfo.userName;
          }else{
            alert(data);
          }
        }
      });
    },
    logoutUser: function() {
      $.ajax({
        method: 'post',
        url: '/logout',
        data: {
          user: app.currentUserData.userName
        },
        success: function (data) {
          alert(data); //temporary to prevent errors
          app.page = 'landing';
        }
      });
    },
    createNewGame: function() {
      console.log('inside createNewGame');
      socket.emit('createGame', {name: app.currentUserData.userName});
      // player = new Player(app.currentUserData.userName, p1);
      console.log('createGame emitted to server side');
    },
    joinGame: function() {
      console.log('inside joinGame');
      $.ajax({
        method: 'get',
        url: '/rooms',
        success: function(roomId) {
          console.log('room received, it is:', roomId);
          socket.emit('joinGame', {
            name: app.currentUserData.userName,
            room: roomId
          });
          // player = new Player(app.currentUserData.userName, p2);
          console.log('joinGame emitted to server side');
        }
      });
    }
  }
});