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
    page: 'signup'
  },
  methods: {
    // methods here

  }
});