var app = new Vue({
  el: '#app',
  data: {
    // app state
    loginInfo: {
      username: '',
      password: ''
    },
    signUpInfo: {
      firstName: '',
      lastName: '',
      age: 0,
      email: '',
      gender: '',
      username: '',
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
    }
  }


});