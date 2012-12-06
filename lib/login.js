
const {defer} = require("api-utils/promise");
const {extend} = require("sdk/util/object");
const {Request} = require("request");

const loginURL = "http://localhost:8081/";

function post(options) {
    var d = defer();
    var postargs = extend(options, {onComplete: d.resolve});
    Request(postargs).post();
    return d.promise;
}

function build_S1(password, salt) {
    return password + salt; // phase1 is simple
}

exports.createAccount = function(email, password) {
    var salt, S1;
    var d = post({url: loginURL + "api/get_entropy",
                  contentType: "application/json",
                  content: JSON.stringify({})});
    var d1 = defer();
    d
        .then(function(resp) {
            if (resp.status != 200)
                throw Error(resp.text);
            salt = resp.json.entropy; // TODO: hash together with local entropy
            //var salt = b32encode(random(16));
            S1 = build_S1(password, salt);
            return post({url: loginURL + "api/create_account",
                         contentType: "application/json",
                         content: JSON.stringify({email: email, salt: salt, S1: S1})});
        })
        .then(function(resp) {
            if (resp.status != 200)
                throw Error(resp.text);
            // TODO phase2: now create the SUK, the WSUK, call set_keys
            return "ok";
        })
        .then(d1.resolve);
    return d1.promise;
};

// We currently use a "one login per browser" model, so these are global (to
// this module). To support multiple simultaneous logins in a single browser
// (maybe one profile-per-window, or fast-user-switching, or something),
// these must move to hidden ("namespaces") properties of a "login" object,
// which is given to the caller in response to a login() operation.
var email, userid, salt, S1;

exports.login = function(email0, password) {
    var d = post({url: loginURL + "api/get_userid",
                  contentType: "application/json",
                  content: JSON.stringify({email: email0})});
    var d1 = defer();
    d
        .then(function(resp) {
            if (resp.status != 200)
                throw Error(resp.text);
            // stash these globally upon success
            email = email0;
            userid = resp.json.userid;
            salt = resp.json.salt;
            S1 = build_S1(password, salt);
            // TODO phase2: fetch RUK/WSUK for later use
            //return post({url: loginURL + "api/get_keys",
            //             contentType: "application/json",
            //             content: JSON.stringify({userid: userid, S1: S1})});
            // ...
            return "ok";
        })
        .then(d1.resolve);
    return d1.promise;
};

exports.logout = function() {
    email = null;
    userid = null;
    salt = null;
    S1 = null;
};

exports.sign_key = function(email0, pubkey) {
    if (!email || !userid || !salt || !S1)
        throw Error("not logged in, please call login() first");
    if (email0 != email)
        throw Error("logged in with a different email");
    var d = post({url: loginURL + "api/sign_key",
                  contentType: "application/json",
                  content: JSON.stringify({email: email, S1: S1, pubkey: pubkey})
                 });
    var d1 = defer();
    d
        .then(function(resp) {
            if (resp.status != 200)
                throw Error(resp.text);
            return resp.json.cert;
        })
        .then(d1.resolve);
    return d1.promise;
};
