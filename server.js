let express = require('express');
let session = require('express-session');
let bodyParser = require('body-parser');
let passport = require('passport');
let mongoClient = require('mongodb').MongoClient;
let localStrategy = require('passport-local').Strategy;
let flash = require('connect-flash');

let router = require('express').Router();

let dbClient = new mongoClient("mongodb://localhost:27017/", { useNewUrlParser: true });
let app = new express();

function checkAuth() {
    return app.use((req, res, next) => {
    if(req.body.user)
        return;
    else
        res.redirect('/');
    });
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

let _setting = require('./setup/setting.json');
let _user = require('./modules/user').User;
const _port = process.env.PORT || _setting.server.port;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'simpleKey'}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("static"));

passport.use(new localStrategy((user, password, done) => {
    if(user !== 'test_user')
        return done(null, false, {message: 'User not found'});
    else if(password !== 'test_password')
    return done(null, false, {message: 'Wrong password'});

    return done(null, {id: 1, name: 'Test', age: 21});
}));

app.post("/logout", function(req, res) {
    res.redirect('/');
});

app.post("/login", function(req, res) {

});

app.post("/db", (req, res) => {
    console.log(req.body);
    dbClient = new mongoClient("mongodb://localhost:27017/", { useNewUrlParser: true });
    dbClient.connect((err, client) => {
        if (err) return console.error(err);

        const db = client.db("local");
        const collection = db.collection("user");
        let user = {username: req.body.username, password: req.body.password, DataUser: new _user(req.body.username, {})};
        collection.insertOne(user, function(err, result){
            if(err){ 
                return console.log(err);
            }
            console.log(result.ops);
            client.close();
            res.json({message: 'User added', status: true, user: result.ops});
        });
    });
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/static/index.html');
});

app.listen(_port, function() {
    console.log("server start: http://localhost:" + _port);
});

