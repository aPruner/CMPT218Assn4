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
      userName: '',
      wins: 0,
      losses: 0,
      totalGames: 0
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
            app.page = 'landing';
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
          if(data === 'logged in') {
            app.page = 'home';
            app.currentUserData.userName = app.loginInfo.userName;
            app.loginInfo.password = ''; //clear password after login
            $.ajax({
              method: 'post',
              url: '/retrieveStats',
              data: {
                userName: app.currentUserData.userName
              },
              success: function(data) {
                var wins = 0;
                var losses = 0;
                var games = 0;
                $.each(JSON.parse(data), function(i, item){
                  wins = item.wins;
                  losses = item.losses;
                  games = wins + losses;
                });
                app.currentUserData.wins = wins;
                app.currentUserData.losses = losses;
                app.currentUserData.totalGames = games;
              }
            });
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
          app.currentUserData.userName = '';
          app.currentUserData.losses = 0;
          app.currentUserData.wins = 0;
          app.currentUserData.totalGames = 0;
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