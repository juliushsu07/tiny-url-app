const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const cookieSession = require('cookie-session');
const ejs = require('ejs');

const PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.set('trust proxy', 1);

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))


// Set up session parser middleware. You can think of this as an encrypted
// cookie store, but it does way more than that. You can save session data on a
// database for example. In this current setup, session data will be lost once
// the server is shut down. For more details, see:
// https://www.npmjs.com/package/express-session


var generateRandomString = function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

let urlsForUser = function(id) {
    let ownedURL = {};
    for(shortURL in urlDatabase){
        if(urlDatabase[shortURL].userId === id ){
            ownedURL[shortURL] = urlDatabase[shortURL];
        }
    }

    return ownedURL;
}

const urlDatabase = {
    "abc1": {
        userId: "u01",
        shortURL: "abc1",
        longURL: "http://www.lighthouselabs.ca"
    },
    "abc2": {
        userId: "u02",
        shortURL: "abc2",
        longURL: "http://www.google.com"
    }
}

const users = {
    "u01": {
        id: "u01",
        email: "u01@example.com",
        password: bcrypt.hashSync("abc-01",10)
    },
    "u02": {
        id: "u02",
        email: "u02@example.com",
        password: bcrypt.hashSync("abc-02",10)
    }
}

app.get("/", (req, res) => {
    res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
    res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {

    let ownedURL = urlsForUser(req.session.user_id);

    let templateVars = {
        urls: ownedURL,
        user: users[req.session.user_id]
    };

    let isLoggedIn = false;
    if (templateVars.user) {
        isLoggedIn = true;
        res.render("urls_index", templateVars);
    } else{
            res.redirect("/login");
    }

});

app.get("/urls/new", (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        user: users[req.session.user_id]
    };
    let isLoggedIn = false;
    if (templateVars.user) {
        isLoggedIn = true;
        res.render("urls_new", templateVars);
    } else{
     res.redirect("/login");

    }

});

app.post("/urls", (req, res) => {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
        userId: users[req.session.user_id],
        shortURL: shortURL,
        longURL: req.body.longURL
    }
    res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
    let urlExists = false;
    let longURL = '';
    if(urlDatabase[req.params.shortURL]){
        urlExists = true;
        longURL = urlDatabase[req.params.shortURL].longURL;
    }
    if(urlExists === true){
        res.redirect(longURL);
    } else{
        res.status(404).send("Short URL does not exist!!");
    }
});

app.get("/urls/:id", (req, res) => {
    let ownedURL = urlsForUser(req.session.user_id);

    let templateVars = {
        urls: ownedURL,
        user: users[req.session.user_id]
    };

    let isLoggedIn = false;
    if (templateVars.user) {
        isLoggedIn = true;
        res.render("urls_show", templateVars);
    } else{
            res.status(400).send("Can't view URL!! You're not logged!")
    }
});

app.post("/urls/:id", (req, res) => {
    let urlBelongsToUser = false;
    if(req.session.user_id === urlDatabase[req.params.id].userId){
        urlBelongsToUser = true;
    }
    if(urlBelongsToUser === true ){
        urlDatabase[req.params.id] = {
            userId: users[req.session.user_id],
            shortURL: req.params.id,
            longURL: req.body.longURL
        }
        res.redirect("/urls");
    } else {
        res.status(400).send("Can't update!! URL doesn't belong to this user!")
    };


});

app.post("/urls/:id/delete", (req, res) => {
    let urlBelongsToUser = false;
    if(req.session.user_id === urlDatabase[req.params.id].userId){
        urlBelongsToUser = true;
    }
    if(urlBelongsToUser === true ){
        delete urlDatabase[req.params.id];
        res.redirect("/urls");
    } else {
        res.status(400).send("Can't delete!! URL doesn't belong to this user!")
    };
});

app.get("/login", (req, res) => {
    let templateVars = {
        user: users[req.session.user_id]
    }
    res.render("login", templateVars);
});

app.post("/login", (req, res) => {
    let idIsFound = false;
    let userId = "";
    for (let id in users) {
        if (req.body.email === users[id].email && bcrypt.compareSync(req.body.password, users[id].password)) {
            userId = users[id].id;
            idIsFound = true;
        }
    }
    if (idIsFound) {
        req.session.user_id = userId;
        // res.cookie("user_id", userId);
        res.redirect("/urls");
    } else {
        res.status(400).send("Wrong e-mail and password combination!!");
    }
});

app.post("/logout", (req, res) => {
    req.session.user_id = null;
    res.redirect("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    let emailIsFound = false;
    for (let userIndex in users) {
        if (users[userIndex].email === req.body.email) {
            emailIsFound = true;
        }
    }
    if (!emailIsFound) {
        let userId = generateRandomString();
        console.log(userId);
        users[userId] = {
            id: userId,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 10)
        };
        console.log(users);
        res.redirect("login");
    } else {
        res.status(400).send('Email already exists!!');
    }
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});