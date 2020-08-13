let express = require('express');
let session = require('express-session');
let bodyParser = require('body-parser');
let passport = require('passport');
let mongoClient = require('mongodb').MongoClient;
let localStrategy = require('passport-local').Strategy;
let flash = require('connect-flash');

let router = require('express').Router();

//let dbClient = new mongoClient("mongodb://localhost:27017/", { useNewUrlParser: true });
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
let _user = require('./game/user').User;
const _port = process.env.PORT || _setting.server.port;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: 'simpleKey'}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("static"));

console.log(new _user("Alex"));

passport.use(new localStrategy(async(user, password, done) => {
    let dbClient = new mongoClient("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true });
    let myPromise = () => {
        return new Promise((resolve, reject) => {
            dbClient.connect(async(err, client) => {
                if (err) return console.error(err);
    
                const db = client.db("local");
    
                var myPromise2 = () => {
                    return new Promise((resolve, reject) => {
                
                    db
                        .collection('db_users')
                        .find({username: user.toUpperCase()})
                        .limit(1)
                        .toArray(function(err, data) {
                            err 
                            ? reject(err) 
                            : resolve(data[0]);
                        });
                    });
                };
                let _us = await myPromise2();

                _us ? resolve(_us): reject({message: {type: "error", code: "001", message: "User not found"}});
            });
        });
    };

    let currentUser = await myPromise().catch((err) => {
        console.error(err.message);
        return null;
    });

    if(currentUser) {
        if (password === currentUser.password) {
            return done(null, currentUser.DataUser);
        }
        return done(null, false, {message: 'Wrong password'});
    }

    return done(null, false, {message: 'User not found'});
}));

app.post("/logout", function(req, res) {
    res.redirect('/');
});

app.post("/login", passport.authenticate('local', {session: true, failureFlash: 'Invalid username or password.', successFlash: 'Welcome!'}), function(req, res) {
    console.log(`User login ${req.user.username}`);
    res.json(req.user);
});

app.post("/checkin", (req, res) => {
    console.log(req.body);
    let dbClient = new mongoClient("mongodb://localhost:27017/", { useNewUrlParser: true, useUnifiedTopology: true });
    dbClient.connect((err, client) => {
        if (err) return console.error(err);

        const db = client.db("local");
        const collection = db.collection("db_users");
        let user = {username: req.body.username.toUpperCase(), password: req.body.password, DataUser: new _user(req.body.username, {isGuest: true, money: 1500})};
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

app.get("/page", function (req, res) {
    res.sendFile(__dirname + '/static/page2.html');
});

app.listen(_port, function() {
    console.log("server start: http://localhost:" + _port);
});

