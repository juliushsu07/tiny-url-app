var express = require("express");
var app = express();

var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

function generateRandomString() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var urlDatabase = {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
};

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
    let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
    res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
    let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
    res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    // console.log(urlDatabase);
    res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
    let longURL = urlDatabase[req.params.shortURL];
    res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
    let templateVars = { urls: urlDatabase };
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
    let shortURL = req.params.id;
    let longURL = req.body.longURL;
    urlDatabase[shortURL] = longURL;
    res.redirect("/urls");
});

app.post("/login", (req, res) => {
    res.cookie("username", req.body.username);
    res.redirect("/urls");
});

app.post("/logout", (req, res) => {
    res.clearCookie("username");
    res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
    let templateVars = {
        urls: urlDatabase,
        username: req.cookies["username"],
        shortURL: req.params.id,
        longURL: urlDatabase[req.params.id]
    };
    res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}!`);
});