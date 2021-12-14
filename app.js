//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const socket = require('socket.io');
const fs = require('fs');
const Minio = require('minio')
const upload = require('express-fileupload');
var Multer = require("multer");

// Database connections ------------------------------------------------------------------------------------
//mongoose.connect("mongodb://10.20.20.98/diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true });
mongoose.connect("mongodb://localhost:27017/diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true });

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
    property: String,
    organization: String
});

const User = mongoose.model("User", userSchema);


var minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'diastema',
    secretKey: 'diastema'
});
// -----------------------------------------------------------------------------------------------------------

const app = express();
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(upload())

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
                    //res.redirect("/upload?us=" + req.body.username + "&org=" + data[0].toObject().organization);
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

// Data upload route --------------------------------------------
app.route("/upload")
    .get((req,res) => {
        const username = req.query.us;
        const org = req.query.org;
        res.render("upload", {user: username, organization:org});
    })
    .post((req,res) => {
        //console.log(req.body);
        const org = (req.body.organization).toLowerCase();

        // for (m in req.files.inpFile) {

            // minioClient.bucketExists(org, function(err, exists) {
            //     if (err) {
            //       return console.log(err)
            //     }
            //     if (exists) {
            //         minioClient.fPutObject(org, "analysis-2/raw/"+req.files.inpFile.name, req.files.inpFile.data, function(error, etag) {
            //             if(error) {
            //                 return console.log(error);
            //             }
            //             console.log(req.files.inpFile.name + "uploaded");
            //         });
            //     } else {
            //         minioClient.makeBucket(org, function(err) {
            //             if (err) return console.log(err);
            //             minioClient.fPutObject(org, "analysis-2/raw/"+req.files.inpFile.name, req.files.inpFile.data, function(error, etag) {
            //                 if(error) {
            //                     return console.log(error);
            //                 }
            //                 console.log(req.files.inpFile.name + " uploaded");
            //             });
            //         });
            //     }
            // });
        // }
        res.redirect("/modelling?us=" + req.body.user + "&org=" + req.body.organization + "&id=" + Math.random().toString(16).slice(2));
    });

// Modelling route --------------
app.route("/modelling")
    .get((req,res) => {
        const username = req.query.us;
        const organization = req.query.org;
        const id = req.query.id;
        res.render("modelling", {user:username,org:organization,id:id});
    })

// Toolkit route -------------
app.route("/toolkit")
    .post((req,res) => {
        console.log(req.body);
        res.redirect("/modelling");
    });

// Visualization route ---
app.route("/visualize")
    .get((req,res) => {
        const username = req.query.us;
        const organization = req.query.org;
        const id = req.query.id;
        res.render("visualization", {user:username,org:organization,id:id});
    })
    .post((req,res) => {

    });

// Messaging route ---
app.route("/messages")
    .post((req,res) => {
        let data = req.body;

        // The orchestrator sends updates about finished jobs
        if (data.message == "update") {
            io.sockets.emit("Modeller", data.update);

        // The orchestrator sends the message to begin visualization
        } else if (data.message == "visualize") {
            // Inform the modelling component
            io.sockets.emit("Modeller", "Data ready for visualization");

            // Get the name of the bucket
            const splitter = data.path.split("/")
            const bucket = splitter[0];

            // Find the files that the bucket contains
            var objectsStream = minioClient.listObjectsV2(bucket, '', true,'')
            objectsStream.on('data', function(obj) {
                let path = obj.name; //analysis-2/classified-3/wine_quality.csv
                let filename = path.substring(path.lastIndexOf('/') + 1);
                // Download the file locally
                minioClient.fGetObject(bucket, path, 'public/data/'+filename, function(err) {
                    if (err) {
                        return console.log(err)
                    } else {
                        console.log("Downloaded file: " + filename);
                    }
                    data.newpath = "data/" + filename;
                    data.file = filename;
                    data.org = bucket;

                    // Inform the visualization component
                    io.sockets.emit("Visualizer", data);
                })
            })
        }
        res.sendStatus(200);
    });

const server = app.listen(3000, function () {
    console.log('Started on port 3000');
});

// Setup server socket ---
const io = socket(server);