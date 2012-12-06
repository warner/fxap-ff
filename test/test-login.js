var login = require("login");

// make sure fxap-server is running (on localhost:8081) before running this

exports.test__load = function(test) {
    console.log("login loaded!");
    test.pass("yay");
};

exports.test_everything = function(test, done) {
    var d = login.createAccount("user@example.org", "password");
    d
        .then(function(ok) {
            if (ok != "ok")
                throw Error("createAccount not ok: "+ok);
            return login.login("user@example.org", "password");
        })
        .then(function(ok) {
            if (ok != "ok")
                throw Error("login not ok: "+ok);
            return login.sign_key("user@example.org", "pubkey");
        })
        .then(function(signed_key) {
            if (signed_key != "ok signed")
                throw Error("sign_key not ok: "+signed_key);
            test.pass("all good");
        })
        .then(null, function(err) {test.fail(err);})
        .then(done);
};

require("test").run(exports);
