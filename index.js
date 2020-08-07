var express = require('express');
var multer  = require('multer');
var bearerToken = require('express-bearer-token');
var mysql = require('mysql');
var fs = require('fs');
var wait = require('wait.for');
var app = new express();
var jsonParser = express.json();
var _users = require('./users');
var _posts = require('./posts.json');

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "post_images");
    },
    
    filename: (req, file, cb) =>{
        cb(null, createID(50) + "." + file.originalname.split(".")[file.originalname.split(".").length - 1]);
    }
});

const fileFilter = (req, file, cb) => {
    let _type = file.originalname.split(".")[file.originalname.split(".").length - 1];
    if (+req.headers["content-length"] <= 2097152) {
        if(_type === "png" || _type === "jpg" || _type === "jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
        }
    } else {
        cb(null, false);
    }
}

app.use(express.urlencoded());
app.use(multer({storage:storageConfig, fileFilter: fileFilter}).single("image"));
//app.use(multer({dest: "post_images"}).single("image"));
app.use(express.static(__dirname));

var _db = require('./db/db_api.js');
var _eror = require('./errors/eror.js');
var eror = new _eror();
var db = new _db();

function randFloat(from, to, fix) {
    return +((Math.random() * (to - from)) + from).toFixed(fix);
}

function rand(from, to) {
    return Math.floor((Math.random() * (to - from + 1)) + from);
}

function createID(length = 20) {
    let char = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".toLowerCase();
    let arr = [];
    for (let i = 0; i < length; i++)
        arr[i] = (rand(-100, 100) >= 0) ? rand(0, 9): char[rand(0, char.length-1)];
    return arr.join('');
}

Date.prototype.getPostDate = function() {
    let _date = ((this.getHours() >= 10) ? this.getHours(): "0" + this.getHours()) + ":" + ((this.getMinutes() >= 10) ? this.getMinutes(): "0" + this.getMinutes()) + " " + ((this.getDate() >= 10) ? this.getDate(): "0" + this.getDate()) + "." + (((this.getMonth() + 1) >= 10) ? this.getMonth() + 1: "0" + (this.getMonth() + 1)) + "." + this.getFullYear();
    return _date;
}

function Post(title, anons, text, image) {
    this.title = title;
    this.anons = anons;
    this.text = text;
    this.image = image;
    if (title) this.id_post = this.lastIndex() + 1;
    this.createTime = new Date().getPostDate();
    this.comments = [];
}

Post.prototype.lastIndex = function() {
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    //console.log(post.posts + " post");
    if (post.posts.length === 0) return 0;
    let max = post.posts[0].id_post;
    for (let i = 1; i < post.posts.length; i++) {
        max = Math.max(max, post.posts[i].id_post);
    }
    return max;
}

Post.prototype.search = function(id_post) {
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    if (post.posts.length === 0) return [0, false];
    for (let i = 0; i < post.posts.length; i++)
        if (post.posts[i].id_post == id_post)
            return [i, true];
    return [0, false];
}

Post.prototype.calcRating = function(id_post, post) {
    let sum = 0;
    let temp = post.posts[id_post].comments.length;
    for (let i = 0; i < post.posts[id_post].comments.length; i++) {
        if (post.posts[id_post].comments[i].rating)
            sum += +post.posts[id_post].comments[i].rating;
        else
            temp--;
    }
    post.posts[id_post].rating = +(sum / temp).toFixed(1);
    fs.writeFileSync("posts.json", JSON.stringify(post));
}

function Comments(author, comment, rating, id_post) {
    this.id = this.lastIndex(id_post) + 1;
    this.author = author;
    this.comment = comment;
    if (rating) this.rating = rating;
    this.createTime = new Date().getPostDate();
}

Comments.prototype.lastIndex = function(id_post) {
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    if (post.posts[id_post].comments.length === 0) return 0;
    let max = post.posts[id_post].comments[0].id;
    for (let i = 1; i < post.posts[id_post].comments.length; i++) {
        max = Math.max(max, post.posts[id_post].comments[i].id)
    }
    return max;
}

function searchComments(id_post, id) {
    console.log(`search: ${id_post}, ${id}`);
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    if (post.posts[id_post].comments.length === 0) return [0, false];
    for (let i = 0; i < post.posts[id_post].comments.length; i++)
        if (post.posts[id_post].comments[i].id == id)
            return [i, true];
    return [0, false];
}

app.use(express.static("static"));

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/static/index.html');
});

app.get("/download/:name", function (req, res) {
    res.sendFile(__dirname + "/post_images/" + req.params.name);
});

app.post("/auth", jsonParser, function(req, res) {
    
    let user_index = _users.admins.findIndex((a, b, c) => (a.login === req.headers.login && a.password === req.headers.password));
    
    if (user_index !== -1 && _users.admins[user_index].bearerToken === "") {
        _users.admins[user_index].bearerToken = new _db().generateAccessToken(user_index);
        res.statusCode = 200;
        res.statusText = "Successful authorization";
        res.json({
            status: true,
            bearerToken: _users.admins[user_index].bearerToken,
        });
        console.log(`user ${_users.admins[user_index].login} login in ${new Date().getPostDate()}, bearerToken: ${_users.admins[user_index].bearerToken}`);
    } else {
        res.statusCode = 401;
        res.statusText = "Invalid authorization data";
        res.json({
            status: false,
            message: "Invalid authorization data",
        });
    }
});

app.post("/logout", jsonParser, function(req, res) {
    
    let user_index = -1
    if (req.headers.authorization !== undefined)
        user_index = new _db().accessTokenUserID(req.headers.authorization.split(" ")[1])
    
    if (_users.admins[user_index].bearerToken !== "" && req.headers.authorization.split(" ")[1] === _users.admins[user_index].bearerToken) {
        _users.admins[user_index].bearerToken = ""
        res.statusCode = 200;
        res.statusText = "Successful logout";
        res.json({
            status: true,
            message: _users.admins[user_index].login + " logout"
        });
        console.log(`user ${_users.admins[user_index].login} logout in ${new Date().getPostDate()}`);
    } else {
        res.statusCode = 401;
        res.statusText = "Invalid bearerToken";
        res.json({
            status: false,
            message: "Invalid bearerToken",
        });
    }
});

app.post("/posts", jsonParser, function(req, res) {
    //console.log(req.body);
    //console.log(req.file);
    
    let user_index = -1;
    if (req.headers.authorization !== undefined)
        user_index = new _db().accessTokenUserID(req.headers.authorization.split(" ")[1]);
    
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    let temp = db.checkParams(['title', 'anons', 'text', 'image'], req.body);
    if (req.headers.authorization !== undefined && req.headers.authorization.split(" ")[1] === _users.admins[user_index].bearerToken) {
        if (temp[1]) {
            post.posts.push(new Post(req.body.title, req.body.anons, req.body.text, req.file.filename));
            fs.writeFileSync("posts.json", JSON.stringify(post));
            res.statusCode = 201;
            res.statusText = "Successful creation";
            res.json({
                status: true,
                id_post: post.posts[post.posts.length-1].id_post,
            });
            console.log(`Пользователь ${_users.admins[user_index].login} создал блог '${req.body.title}' время ${new Date().getPostDate()}`);
        } else {
            res.statusCode = 400;
            res.statusText = "Creating error";
            res.json({
                status: false,
                message: temp[0],
            });
            console.log(`Ошибка при создании поста ${new Date().getPostDate()}`);
            console.table(temp[0]);
        }
    } else {
        res.statusCode = 401;
        res.statusText = "Unauthorized";
        res.json({
            message: "Unauthorized",
        });
        console.log(`Пользователь не авторизован! В доступе отказано ${new Date().getPostDate()}`);
    }
});

app.post("/posts/:id_post", jsonParser, function(req, res) {
    
    let user_index = -1;
    if (req.headers.authorization !== undefined)
        user_index = new _db().accessTokenUserID(req.headers.authorization.split(" ")[1]);
    
    let temp = db.checkParams(['title', 'anons', 'text', 'image'], req.body);
    let temp2 = new Post().search(req.params.id_post);
    if (req.headers.authorization.split(" ")[1] === _users.admins[user_index].bearerToken) {
        if (temp2[1]) {
            if (temp[1]) {
                
                let post = fs.readFileSync("posts.json", "utf8");
                post = JSON.parse(post);
                if (req.file !== undefined) {
                    fs.unlink('post_images/' + post.posts[temp2[0]].image, (err) => {
                    if (err) 
                        console.error(err);
                    else
                        console.log(`Файл удален.`);
                    });
                }
                
                post.posts[temp2[0]].title = req.body.title;
                post.posts[temp2[0]].anons = req.body.anons;
                post.posts[temp2[0]].text = req.body.text;
                post.posts[temp2[0]].image = (req.file === undefined) ? req.body.image: req.file.filename;
                fs.writeFileSync("posts.json", JSON.stringify(post));
                res.statusCode = 201;
                res.statusText = "Successful creation";
                res.json({
                    status: true,
                    post: {
                        title: req.body.title,
                        datetime: post.posts[temp2[0]].createTime,
                        anons: req.body.anons,
                        text: req.body.text,
                        image: req.body.image,
                    }
                });
                console.log(`Пост успешно отредактирован пользователем ${_users.admins[user_index].login} в ${new Date().getPostDate()}`);
            } else {
                res.statusCode = 400;
                res.statusText = "Editing error";
                res.json({
                    status: false,
                    message: temp[0],
                });
            }
        } else {
            res.statusCode = 404;
            res.statusText = "Post not found"
            res.json({
                message: "Post not found",
            });
        }
    } else {
        res.statusCode = 401;
        res.statusText = "Unauthorized";
        res.json({
            message: "Unauthorized",
        });
    }
});

app.delete("/posts/:id_post", jsonParser, function(req, res) {
    
    let user_index = -1;
    if (req.headers.authorization !== undefined)
        user_index = new _db().accessTokenUserID(req.headers.authorization.split(" ")[1]);
    
    let temp = new Post().search(req.params.id_post);
    if (req.headers.authorization.split(" ")[1] === _users.admins[user_index].bearerToken) {
        if (temp[1]) {
            let post = fs.readFileSync("posts.json", "utf8");
            post = JSON.parse(post);
            fs.unlink('post_images/' + post.posts[temp[0]].image, (err) => {
                    if (err) 
                        console.error(err);
                    else
                        console.log(`Файл удален.`);
                    });
            let _namePost = post.posts[temp[0]].title;
            post.posts.splice(temp[0], 1);
            fs.writeFileSync("posts.json", JSON.stringify(post));
            res.statusCode = 201;
            res.statusText = "Successful delete";
            res.json({
                status: true,
            });
            console.log(`Пользователь ${_users.admins[user_index].login} удалил пост '${_namePost}' в ${new Date().getPostDate()}`);
        } else {
            res.statusCode = 404;
            res.statusText = "Post not found"
            res.json({
                message: "Post not found",
            });
        }
    } else {
        res.statusCode = 401;
        res.statusText = "Unauthorized";
        res.json({
            message: "Unauthorized",
        });
    }
});

app.get("/posts/:id_post", jsonParser, function(req, res) {
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    let temp = new Post().search(req.params.id_post);
    if (temp[1]) {
        res.statusCode = 200;
        res.statusText = "View post";
        res.json(post.posts[temp[0]]);
    } else {
        res.statusCode = 404;
        res.statusText = "Post not found";
        res.json({
            message: "Post not found",
        });
    }
})

app.get("/posts", jsonParser, function(req, res) {
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    for (let i = 0; i < post.posts.length; i++)
        delete post.posts[i].comments;
    res.json(post.posts);
});

app.delete("/posts/:id_post/comments/:id", jsonParser, function(req, res) {
    
    let user_index = -1;
    if (req.headers.authorization !== undefined)
        user_index = new _db().accessTokenUserID(req.headers.authorization.split(" ")[1]);
    
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    let temp = new Post().search(req.params.id_post);
    let temp2 = searchComments(temp[0], req.params.id);
    console.log(temp, temp2);
    if (user_index !== -1 && req.headers.authorization.split(" ")[1] === _users.admins[user_index].bearerToken) {
        if (temp[1]){
            if (temp2[1]) {
                let post = fs.readFileSync("posts.json", "utf8");
                post = JSON.parse(post);
                post.posts[temp[0]].comments.splice(temp2[0], 1);
                new Post().calcRating(temp[0], post);
                fs.writeFileSync("posts.json", JSON.stringify(post));
                res.statusCode = 201;
                res.statusText = "Successful delete";
                res.json({
                    status: true,
                });
            } else {
                res.statusCode = 404;
                res.statusText = "Comment not found";
                res.json({
                    message: "Comment not found",
                });
            }
        } else {
            res.statusCode = 404;
            res.statusText = "Post not found";
            res.json({
                message: "Post not found",
            });
        }
    } else {
        res.statusCode = 401;
        res.statusText = "Unauthorized";
        res.json({
            message: "Unauthorized",
        });
    }
    if (user_index === -1) {
        res.statusCode = 401;
        res.statusText = "Unauthorized";
        res.json({
            message: "Unauthorized",
        });
    }
});

app.post("/posts/:id_post/comments", jsonParser, function(req, res) {
    let user_index = -1;
    if (req.headers.authorization !== undefined)
        user_index = new _db().accessTokenUserID(req.headers.authorization.split(" ")[1]);
    
    let post = fs.readFileSync("posts.json", "utf8");
    post = JSON.parse(post);
    let temp2 = new Post().search(req.params.id_post);
    if (user_index !== -1 && req.headers.authorization.split(" ")[1] === _users.admins[user_index].bearerToken) {
        let temp = db.checkParams(['comment'], req.body);
        if (temp2[1]) {
            if (temp[1]) {
                post.posts[temp2[0]].comments.push(new Comments("Admin", req.body.comment, req.body.rating, temp2[0]));
                new Post().calcRating(temp2[0], post);
                res.statusCode = 201;
                res.statusText = "Successful creation";
                res.json({
                    status: true,
                });
            } else {
                res.statusCode = 400;
                res.statusText = "Creating error";
                res.json({
                    status: false,
                    message: temp[0],
                });
            }
        } else {
            res.statusCode = 404;
            res.statusText = "Post not found";
            res.json({
                message: "Post not found",
            });
        }
    } else {
        let temp = db.checkParams(['author', 'comment'], req.body);
        if (temp2[1]) {
            if (temp[1]) {
                post.posts[temp2[0]].comments.push(new Comments(req.body.author, req.body.comment, req.body.rating, temp2[0]));
                new Post().calcRating(temp2[0], post);
                res.statusCode = 201;
                res.statusText = "Successful creation";
                res.json({
                    status: true,
                });
            } else {
                res.statusCode = 400;
                res.statusText = "Creating error";
                res.json({
                    status: false,
                    message: temp[0],
                });
            }
        } else {
            res.statusCode = 404;
            res.statusText = "Post not found";
            res.json({
                message: "Post not found",
            });
        }
    }
});

app.listen(8100, function() {
    console.log("server start, port: " + 8100);
});

