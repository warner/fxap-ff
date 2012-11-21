
const {on, emit} = require("api-utils/event/core");
const {Request} = require("request");
let login = {};

const loginURL = "http://localhost:8081/";

exports.createAccount = function(email, password, cb) {
    var salt = b32encode(random(16));
    var S1 = password + salt; // phase1 is simple
    Request({url: loginURL + "api/create_account",
             contentType: "application/json",
             content: {email: email, salt: salt, S1: S1},
             onComplete: function(resp) {
                 if (resp.status != 200)
                     cb(resp);
                 // now get_entropy, create the SUK, the WSUK, call set_keys
                 cb(null, "ok");
             }
            }).post();
};


exports.onLogin = function(cb) {
    on(login, "login", cb);
};

exports.startLogin = function(email, password) {
    var userid, salt, S1;

    function gotSignedKey() {};

    function gotSalt(resp) {
        if (resp.status != 200)
            cb(resp);
        userid = resp.json.userid;
        salt = resp.json.salt;
        S1 = password + salt;

        Request({url: loginURL + "api/sign_key",
                 contentType: "application/json",
                 content: {email: email, S1: S1, pubkey: pubkey},
                 onComplete: gotSignedKey
                }).post();
        Request({url: loginURL + "api/get_keys",
                 contentType: "application/json",
                 content: {userid: userid, S1: S1},
                 onComplete: gotKeys
                }).post();
    }

    Request({url: loginURL + "api/get_userid",
             contentType: "application/json",
             content: {email: email, salt: salt, S1: S1},
             onComplete: gotSalt
             }).post();
};



// emit(login, "login", DATA);
