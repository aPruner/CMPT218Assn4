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
      waitingForPlayer: false,
      topBoard: [],
      middleBoard: [],
      bottomBoard: [],
      p1UserName: '',
      p2UserName: '',
      playerTurn: 0,
      playerWhoWon: 0,
      roomId: '',
      totalXonBoard: 0,
      totalYonBoard: 0
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
      this.setupSocketEventHandlers();

    },
    setupSocketEventHandlers: function() {
      socket.on('newGame', function(data) {
        console.log('inside newGame handler, setting up the game');
        app.currentUserData.playerSymbol = 'X';
        app.currentUserData.playerNumber = 1;
        app.currentGameData.waitingForPlayer = true;
        app.currentGameData.roomId = data.room;

      });

      socket.on('player1', function(data) {
        console.log('inside player1 handler');
        console.log('the game is about to start, as someone has connected!');
        app.page = 'game';
        app.currentGameData.waitingForPlayer = false;
        app.currentGameData.playerTurn = 1;
        app.currentGameData.p1UserName = app.currentUserData.userName;
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
        app.currentGameData.playerTurn = 1;
        app.currentGameData.p2UserName = app.currentUserData.userName;
        // initialize the game boards
        app.currentGameData.topBoard = fillBoard();
        app.currentGameData.middleBoard = fillBoard();
        app.currentGameData.bottomBoard = fillBoard();
      });

      socket.on('turnWasPlayed', function(data) {
        console.log('inside turnWasPlayed handler, data is: ', data);
        console.log('Player ' + parseInt(app.currentGameData.playerTurn) + ' just played a turn');
        app.updateUI(data);
        if (app.currentGameData.playerTurn === 1) {
          app.currentGameData.playerTurn = 2;
        } else {
          app.currentGameData.playerTurn = 1;
        }

        // check for a winner!
        var winnerObject = {};
        if (app.currentGameData.totalXonBoard >= 3 || app.currentGameData.totalYonBoard >= 3) {
          winnerObject = app.checkForWin();
        }
        if (!winnerObject.winnerExists) {
          console.log('Now, it will be player' + parseInt(app.currentGameData.playerTurn) + '\'s turn');
        } else {
          console.log('The game has ended, and player ' + parseInt(winnerObject.winner) + ' has won the game!');
          socket.emit('gameEnded', {
            room: data.room,
            winner: winnerObject.winner
          });
        }
      });

      socket.on('gameEnd', function(data) {
        console.log('Good game! Stats will be recorded for this match');
        app.page = 'home';
        app.currentUserData.playerNumber = 0;
        app.currentUserData.playerSymbol = '';
        app.currentGameData = {
          waitingForPlayer: false,
          topBoard: [],
          middleBoard: [],
          bottomBoard: [],
          p1UserName: '',
          p2UserName: '',
          playerTurn: 0,
          playerWhoWon: 0,
          roomId: '',
          totalXonBoard: 0,
          totalYonBoard: 0
        };
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
            app.setupSocketEventHandlers();
          }
        }
      });
    },
    playTurn: function(event) {
      // console.log('inside playTurn');
      console.log('it is player ' + parseInt(app.currentGameData.playerTurn) + '\'s turn to move');
      if (app.currentGameData.playerTurn === app.currentUserData.playerNumber) {
        if (event && event.target) {
          var cell = event.target.className.split(' ')[1].slice(4, 7);
          var cellZ = parseInt(cell[1]);
          var cellX = parseInt(cell[2]);

          if (app.currentGameData.topBoard[cellZ][cellX] !== '' || app.currentGameData.middleBoard[cellZ][cellX] !== '' || app.currentGameData.bottomBoard[cellZ][cellX] !== '') {
            alert('This cell has already been filled!');
            return;
          }

          console.log(event);
          socket.emit('playTurn', {
            cell: cell,
            symbol: app.currentUserData.playerSymbol,
            room: app.currentGameData.roomId
          });
        }
      } else {
        alert('It\'s not your turn!');
      }
    },
    updateUI: function(data) {
      console.log('inside updateUI', data.cell);
      // var cell = data.element.className.split(' ')[1].slice(4, 7);
      var cellY = parseInt(data.cell[0]);
      var cellZ = parseInt(data.cell[1]);
      var cellX = parseInt(data.cell[2]);
      if (cellY === 0) {
        app.currentGameData.topBoard[cellZ][cellX] = data.symbol;
      } else if (cellY === 1) {
        app.currentGameData.middleBoard[cellZ][cellX] = data.symbol;
      } else {
        app.currentGameData.bottomBoard[cellZ][cellX] = data.symbol;
      }
      if (data.symbol === 'X') {
        app.currentGameData.totalXonBoard++;
      } else if (data.symbol === 'Y') {
        app.currentGameData.totalYonBoard++;
      }
      $('.cell' + data.cell).html(data.symbol);
      // console.log('topBoard');
      // console.log(app.currentGameData.topBoard);
      // console.log('middleBoard');
      // console.log(app.currentGameData.middleBoard);
      // console.log('bottomBoard');
      // console.log(app.currentGameData.bottomBoard);
    },
    checkForWin: function() {
      // need to check all boards individually, and all boards put together
      console.log('inside checkForWin');

      // first check individual boards for win conditions

      // top board rows
      var winSt = '';
      var i;
      var j;
      for (i = 0; i < 3; i++) {
        winSt = '';
        for (j = 0; j < 3; j++) {
          winSt += app.currentGameData.topBoard[i][j]
        }
        if (winSt === 'XXX') {
          return {
            winnerExists: true,
            winner: 1
          }
        } else if (winSt === 'OOO') {
          return {
            winnerExists: true,
            winner: 2
          }
        }
      }

      // top board columns
      for (i = 0; i < 3; i++) {
        winSt = '';
        for (j = 0; j < 3; j++) {
          winSt += app.currentGameData.topBoard[j][i]
        }
        if (winSt === 'XXX') {
          return {
            winnerExists: true,
            winner: 1
          }
        } else if (winSt === 'OOO') {
          return {
            winnerExists: true,
            winner: 2
          }
        }
      }

      // top board diagonals
      winSt = '';
      for (i = 0; i < 3; i++) {
        winSt += app.currentGameData.topBoard[i][i]
      }
      if (winSt === 'XXX') {
        return {
          winnerExists: true,
          winner: 1
        }
      } else if (winSt === 'OOO') {
        return {
          winnerExists: true,
          winner: 2
        }
      }

      winSt = '';
      i = 2;
      j = 0;
      while (j < 3 && i >= 0) {
        winSt += app.currentGameData.topBoard[i][j];
        i--;
        j++;
      }
      if (winSt === 'XXX') {
        return {
          winnerExists: true,
          winner: 1
        }
      } else if (winSt === 'OOO') {
        return {
          winnerExists: true,
          winner: 2
        }
      }

      // middle board rows
      for (i = 0; i < 3; i++) {
        winSt = '';
        for (j = 0; j < 3; j++) {
          winSt += app.currentGameData.middleBoard[i][j]
        }
        if (winSt === 'XXX') {
          return {
            winnerExists: true,
            winner: 1
          }
        } else if (winSt === 'OOO') {
          return {
            winnerExists: true,
            winner: 2
          }
        }
      }

      // middle board columns
      for (i = 0; i < 3; i++) {
        winSt = '';
        for (j = 0; j < 3; j++) {
          winSt += app.currentGameData.middleBoard[j][i]
        }
        if (winSt === 'XXX') {
          return {
            winnerExists: true,
            winner: 1
          }
        } else if (winSt === 'OOO') {
          return {
            winnerExists: true,
            winner: 2
          }
        }
      }

      // middle board diagonals
      winSt = '';
      for (i = 0; i < 3; i++) {
        winSt += app.currentGameData.middleBoard[i][i]
      }
      if (winSt === 'XXX') {
        return {
          winnerExists: true,
          winner: 1
        }
      } else if (winSt === 'OOO') {
        return {
          winnerExists: true,
          winner: 2
        }
      }

      winSt = '';
      i = 2;
      j = 0;
      while (j < 3 && i >= 0) {
        winSt += app.currentGameData.middleBoard[i][j];
        i--;
        j++;
      }
      if (winSt === 'XXX') {
        return {
          winnerExists: true,
          winner: 1
        }
      } else if (winSt === 'OOO') {
        return {
          winnerExists: true,
          winner: 2
        }
      }

      // bottom board rows
      for (i = 0; i < 3; i++) {
        winSt = '';
        for (j = 0; j < 3; j++) {
          winSt += app.currentGameData.bottomBoard[i][j]
        }
        if (winSt === 'XXX') {
          return {
            winnerExists: true,
            winner: 1
          }
        } else if (winSt === 'OOO') {
          return {
            winnerExists: true,
            winner: 2
          }
        }
      }

      // bottom board columns
      for (i = 0; i < 3; i++) {
        winSt = '';
        for (j = 0; j < 3; j++) {
          winSt += app.currentGameData.bottomBoard[j][i]
        }
        if (winSt === 'XXX') {
          return {
            winnerExists: true,
            winner: 1
          }
        } else if (winSt === 'OOO') {
          return {
            winnerExists: true,
            winner: 2
          }
        }
      }

      // bottom board diagonals
      winSt = '';
      for (i = 0; i < 3; i++) {
        winSt += app.currentGameData.bottomBoard[i][i]
      }
      if (winSt === 'XXX') {
        return {
          winnerExists: true,
          winner: 1
        }
      } else if (winSt === 'OOO') {
        return {
          winnerExists: true,
          winner: 2
        }
      }

      winSt = '';
      i = 2;
      j = 0;
      while (j < 3 && i >= 0) {
        winSt += app.currentGameData.bottomBoard[i][j];
        i--;
        j++;
      }
      if (winSt === 'XXX') {
        return {
          winnerExists: true,
          winner: 1
        }
      } else if (winSt === 'OOO') {
        return {
          winnerExists: true,
          winner: 2
        }
      }

      // now check cross board win conditions
      var board3d = [app.currentGameData.topBoard, app.currentGameData.middleBoard, app.currentGameData.bottomBoard];

      return {
        winnerExists: false,
        winner: 0
      };
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