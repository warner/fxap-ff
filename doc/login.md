
Firefox Account Login
=====================

    let login = require("login");
    
    login.createAccount("email@example.com", "password",
        function() {
            login.onLogin(function() {console.log("logged in!");});
            login.startLogin("email@example.com", "password");
        });
