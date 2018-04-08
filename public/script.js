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
    page: 'landing'
  },
  methods: {
    switchToLogin: function() {
      app.page = 'login';
    },
    switchToSignup: function() {
      app.page = 'signup'
    },
    switchToLanding: function() {
      app.page = 'landing'
    },
<<<<<<< HEAD
    submitSignup: function() {
      $.ajax({
        method: 'post',
        url: '/signup',
        data: {
          firstName: app.signUpInfo.firstName,
          lastName: app.signUpInfo.lastName,
          age: app.signUpInfo.age,
          email: app.signUpInfo.email,
          gender: app.signUpInfo.gender,
          username: app.signUpInfo.username,
          password: app.signUpInfo.password
        },
        success: function(data) {
          alert(data);
        }
      });
=======
    registerUser: function() {
      //TODO: add checks for all other variables being filled in
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
      }else{
        alert('passwords do not match');
      }
>>>>>>> a5692a4c6bde575ed0e5ff1e3eb98bac034c6b12
    }
  }


});