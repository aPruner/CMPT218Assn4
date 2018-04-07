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
    }
  }


});