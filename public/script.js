var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000');

var fillBoard = function() {
  var board = [];
  for (var i = 0; i < 3; i++) {
    board.push([]);
    for (var j = 0; j < 3; j++) {
      board[i].push('');
    }
  }
  return board;
};

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
      totalGames: 0,
      playerNumber: 0,
      playerSymbol: ''
    },
    currentGameData: {
      waitingForPlayer: true,
      topBoard: [],
      middleBoard: [],
      bottomBoard: [],
      p1UserName: '',
      p2UserName: '',
      playerTurn: 0,
      playerWhoWon: 0,
      roomId: ''
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
            if(data === 'User Registered'){
              app.page = 'landing';
            }
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
          } else {
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
      socket.emit('createGame', {name: app.currentUserData.userName});
      console.log('lobby has been created, waiting for 2nd player...');
      socket.on('newGame', function(data) {
        app.currentUserData.playerSymbol = 'X';
        app.currentUserData.playerNumber = 1;
        app.currentGameData.waitingForPlayer = true;
        app.currentGameData.roomId = data.roomId;

      });

      socket.on('player1', function(data) {
        console.log('inside player1 handler');
        console.log('the game is about to start, as someone has connected!');
        app.page = 'game';
        app.currentGameData.waitingForPlayer = false;
        app.currentGameData.currentTurn = 1;
        // initialize the game boards
        app.currentGameData.topBoard = fillBoard();
        app.currentGameData.middleBoard = fillBoard();
        app.currentGameData.bottomBoard = fillBoard();
      });

      socket.on('player2', function(data) {
        console.log('inside player2 handler');
        console.log('the game is about to start, you have connected!');
        app.page = 'game';
        app.currentUserData.playerSymbol = 'O';
        app.currentUserData.playerNumber = 2;
        app.currentGameData.waitingForPlayer = false;
        app.currentGameData.roomId = data.room;
        app.currentGameData.currentTurn = 1;
        // initialize the game boards
        app.currentGameData.topBoard = fillBoard();
        app.currentGameData.middleBoard = fillBoard();
        app.currentGameData.bottomBoard = fillBoard();
      });

      socket.on('turnWasPlayed', function(data) {
        if (app.currentGameData.currentTurn === 1) {
          app.currentGameData.currentTurn = 2;
        } else {
          app.currentGameData.currentTurn = 1;
        }
        console.log('a turn was played!');
      });

      socket.on('gameEnd', function(data) {
        socket.leave(data.room);
        app.page = 'home';
        app.currentUserData.playerNumber = 0;
        app.currentUserData.playerSymbol = '';

      });

      socket.on('err', function(data) {
        console.log(data.message);
      });
    },
    joinGame: function() {
      console.log('inside joinGame');
      $.ajax({
        method: 'get',
        url: '/rooms',
        success: function(roomId) {
          if (roomId === 'no rooms created') {
            alert('No rooms have been created');
          } else {
            console.log('room received, it is:', roomId);
            socket.emit('joinGame', {
              name: app.currentUserData.userName,
              room: roomId
            });
            console.log('joinGame event emitted to backend');
          }
        }
      });
    },
    fillInCell: function(event) {
      console.log('inside fillInCell');
      console.log(event);
      if (event && event.target) {
        event.target.innerHTML = app.currentUserData.playerSymbol;
        var cell = event.target.className.split(' ')[1].slice(4, 7);
        var cellY = parseInt(cell[0]);
        var cellZ = parseInt(cell[1]);
        var cellX = parseInt(cell[2]);
        if (cellY === '0') {
          app.currentGameData.topBoard[cellZ][cellX] = app.currentUserData.playerSymbol;
        } else if (cellY === '1') {
          app.currentGameData.middleBoard[cellZ][cellX] = app.currentUserData.playerSymbol;
        } else {
          app.currentGameData.bottomBoard[cellZ][cellX] = app.currentUserData.playerSymbol;
        }
      }
      //run winnerCheck here?
      console.log('topBoard');
      console.log(app.currentGameData.topBoard);
      console.log('middleBoard');
      console.log(app.currentGameData.middleBoard);
      console.log('bottomBoard');
      console.log(app.currentGameData.bottomBoard);
    },
    winnerCheck: function() {
      //need to check all boards individually, and all boards put together
      
    }
    // saveGameStats: function() {
    //   $.ajax({
    //     method: 'post',
    //     url: '/storeGameData',
    //     data: {
    //       winner:
    //       loser:
    //     },
    //     success: function(data) {
    //       alert(data);
    //     }
    //   });
    // }
  }
});