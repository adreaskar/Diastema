//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const socket = require('socket.io');
const fs = require('fs');
const Minio = require('minio')
const upload = require('express-fileupload');
const { path } = require("express/lib/application");

// Database connections ------------------------------------------------------------------------------------
const baseUrl = "mongodb://localhost:27017/";
//const baseUrl = "mongodb://10.20.20.98/";
mongoose.main = mongoose.createConnection(baseUrl + "diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true });

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String,
    property: String,
    organization: String
});

const User = mongoose.main.model("User", userSchema);


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
                    res.redirect("/upload?us=" + req.body.username + "&org=" + data[0].toObject().organization);
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
        const org = (req.body.organization).toLowerCase();
        const usecase = req.body.usecase;
        const source = req.body.source;
        const label = req.body.label;
        const id = Math.random().toString(16).slice(2);

        const uploadpath = 'public/data/';

        // Save file to local storage
        req.files.inpFile.mv(uploadpath + req.files.inpFile.name, function(error){
            if (error) {
                console.log("Error could not copy to local storage");
                console.log(error);
            }
        });

        // Check if bucket exists
        minioClient.bucketExists(org, function(err, exists) {

            if (err) {
                return console.log(err)
            }
            // If exists, put the file in the bucket to the specified path and then delete it from local storage
            if (exists) {
                minioClient.fPutObject(org, "analysis-"+ id +"/raw/"+req.files.inpFile.name, uploadpath+req.files.inpFile.name, function(error, etag) {
                    if(error) {
                        return console.log(error);
                    }
                    console.log("Organization bucket exists");
                    console.log(req.files.inpFile.name + " has been uploaded to minIO bucket");
                    // Deletes the local file
                    fs.unlinkSync(uploadpath+req.files.inpFile.name);
                });
            // If it doesnt exist, create bucket and then the rest
            } else {
                minioClient.makeBucket(org, function(err) {
                    if (err) return console.log(err);
                    minioClient.fPutObject(org, "analysis-"+ id +"/raw/"+req.files.inpFile.name, uploadpath+req.files.inpFile.name, function(error, etag) {
                        if(error) {
                            return console.log(error);
                        }
                        console.log("Organization bucket has been created");
                        console.log(req.files.inpFile.name + " has been uploaded to minIO bucket");
                        // Deletes the local file
                        fs.unlinkSync(uploadpath+req.files.inpFile.name);   
                    });
                });
            }
        });

        res.redirect("/modelling?us=" + req.body.user + "&org=" + req.body.organization + "&id=" + id + "&usecase=" + usecase + "&source=" + source + "&label=" + label + "&dataset=" + req.files.inpFile.name);
    });

// Modelling route -----------------------------------------------------
app.route("/modelling")
    .get((req,res) => {
        const username = req.query.us;
        const organization = req.query.org;
        const id = req.query.id;
        res.render("modelling", {user:username,org:organization,id:id});
    });

// Dashboard route -----------------------------------------------------
app.route("/dashboard")
    .get((req,res)=> {
        const username = req.query.us;
        const organization = req.query.org;
        const id = req.query.id;
        let data = [];

        // Search for collections in organization database
        mongoose.dash = mongoose.createConnection(baseUrl + organization.toLowerCase(), { useUnifiedTopology: true, useNewUrlParser: true });
        mongoose.dash.on('open', function (ref) {
            
            //Get all collection names
            mongoose.dash.db.listCollections().toArray((error, collections) => {

                // Database has collections
                if (collections.length != 0) {
                    let query = "yes";

                    // For each collection, gather the information needed
                    collections.forEach(async (collection,i) => {
                        let coll = mongoose.dash.db.collection(collection.name);

                        // Information schema
                        let info = {
                            id:collection.name, 
                            jobs:[]
                        }

                        // Get all records in this collection
                        let records = await coll.find().toArray();

                        // For every record, gather information needed
                        records.forEach(record => {
                            if(record["job-json"]) {
                                info["jobs"].push(record["job-json"]["title"]);
                            }
                            if (record["kind"]) {
                                info.label = record.metadata["analysis-label"];
                                info.usecase = record.metadata.usecase;
                                info.source = record.metadata.source;
                                info.dataset = record.metadata.dataset;
                                info.user = record.metadata.user;
                                info.date = record.metadata["analysis-date"];
                                info.time = record.metadata["analysis-time"];
                            }
                        });

                        data.push(info);

                        // If it is the last collection, render the page
                        if (i === collections.length - 1 ) {
                            res.render("dashboard", {user:username,org:organization,id:id,query:query,data:data});
                        }
                    });
                // Database is empty
                } else {
                    let query = "no";
                    res.render("dashboard", {user:username,org:organization,id:id,query:query});
                }

            });
        });
    });

// Toolkit route ------------------
app.route("/toolkit")
    .post((req,res) => {
        console.log(req.body);
        res.redirect("/modelling");
    });

// Visualization route -----------------------------------------------------
app.route("/visualize")
    .get((req,res) => {
        const username = req.query.us;
        const organization = req.query.org;
        const id = req.query.id;
        res.render("visualization", {user:username,org:organization,id:id});
    })
    .post((req,res) => {

    });

// Messaging route --------------------------------------------------------------------------
app.route("/messages")
    .post((req,res) => {
        let data = req.body;

        // The orchestrator sends updates about finished jobs -----
        if (data.message == "update") {
            io.sockets.emit("Modeller", data.update);

        // The orchestrator sends the message to begin visualization --------
        } else if (data.message == "visualize") {

            // Get the name of the bucket
            const splitter = data.path.split("/")
            const bucket = splitter[0];
            const prefix = splitter[1]+"/"+splitter[2]+"/";

            // Find the files that the bucket contains
            var objectsStream = minioClient.listObjectsV2(bucket, prefix, true,'')
            objectsStream.on('data', function(obj) {
                let path = obj.name; //analysis-2sd8asf98g/classified-3/wine_quality.csv
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

                    // Inform the Modelling component
                    io.sockets.emit("Modeller", "Data ready for visualization, visit the Dashboard");
                    // Inform the Dashboard component
                    io.sockets.emit("Dashboard", "Data ready for visualization");
                    io.sockets.emit("Visualizer", data);

                    // Inform the visualization component
                    // io.sockets.emit("Visualizer", data);
                });
            });
        }
        res.sendStatus(200);
    });

const server = app.listen(3000, function () {
    console.log('Started on port 3000');
});

// Setup server socket ---
const io = socket(server);