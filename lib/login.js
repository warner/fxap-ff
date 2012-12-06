
const {on, emit} = require("api-utils/event/core");
const {defer} = require("api-utils/promise");
const {extend} = require("api-utils/util/object");
const {Request} = require("request");
let login = {};

const loginURL = "http://localhost:8081/";
var userid, salt, S1;

function post(options) {
    var d = defer();
    var postargs = extend(options, {onComplete: d.resolve});
    Request(postargs).post();
    return d;
}

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

    function gotSignedKey() {};

    function gotSalt(resp) {
        if (resp.status != 200)
            cb(resp);
        userid = resp.json.userid;
        salt = resp.json.salt;
        S1 = password + salt;

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

exports.sign_key = function(pubkey, cb) {
    var d = post({url: loginURL + "api/sign_key",
                  contentType: "application/json",
                  content: {email: email, S1: S1, pubkey: pubkey}
                  });
    return d;
}



// emit(login, "login", DATA);
