//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const socket = require('socket.io');

// Database connection and schema creation -------------------------------------------------------------------
mongoose.connect("mongodb://10.20.20.98/diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true });
//mongoose.connect("mongodb://localhost:27017/diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true });

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
    property: String,
    organization: String
});

const User = mongoose.model("User", userSchema);
// -----------------------------------------------------------------------------------------------------------

const app = express();
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// Home route ---------------------
app.route("/")
    .get((req,res) => {
        res.render("index");
    })
    .post((req,res) => {
        req.body.password = crypto.createHash('sha256').update(req.body.password).digest('hex');
        
        User.find({username:req.body.username, password:req.body.password}, (err,data) => {
            if (err) {
                console.log(err);
            } else {
                if (data.length === 0) {
                    console.log('no user found');
                    res.redirect("/");
                } else {
                    res.redirect("/modelling?us=" + req.body.username + "&org=" + data[0].toObject().organization + "&id=" + Math.random().toString(16).slice(2));
                }
            }
        });
    });

// Register route -------------
app.route("/register")
    .get((req,res) => {
        res.render("register");
    })
    .post((req,res) => {
        req.body.password = crypto.createHash('sha256').update(req.body.password).digest('hex');

        const user = new User ({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            property: req.body.property,
            organization: req.body.organization
        });

        user.save();

        res.redirect("/")
    });

// Modelling route --------------
app.route("/modelling")
    .get((req,res) => {
        const username = req.query.us;
        res.render("dashboard", {user:username});
    })
    .post((req,res) => {
        let data = req.body;
        io.sockets.emit("new-notification", data.message);
        res.sendStatus(200);
    });

// Toolkit route -------------
app.route("/toolkit")
    .post((req,res) => {
        console.log(req.body);
        res.redirect("/modelling")
    });

// Visualization route ---
app.route("/vizualize")
    .get((res,req) => {

    })
    .post((res,req) => {

    });

const server = app.listen(3000, function () {
    console.log('Started on port 3000');
});

// Setup server socket ---
const io = socket(server);