//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");

// Database connection and schema creation -------------------------------------------------------------------
mongoose.connect("mongodb://localhost:27017/diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true });

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
    property: String
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
                console.log(data);
                if (data.length === 0) {
                    console.log('no user found');
                    res.redirect("/");
                } else {
                    res.redirect("/dashboard");
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
            property: req.body.property
        });

        user.save();

        res.redirect("/")
    });

// Modelling route --------------
app.route("/dashboard")
    .get((req,res) => {
        res.render("dashboard");
    });

// Toolkit route -------------
app.route("/toolkit")
    .post((req,res) => {
        console.log(req.body);
        res.redirect("/dashboard")
    });

// Visualization route ---
app.route("/dashboard")
    .get((res,req) => {

    })
    .post((res,req) => {

    });

app.listen(3000, function () {
    console.log('Started on port 3000');
});