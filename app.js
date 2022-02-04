//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const socket = require('socket.io');
const fs = require('fs');
const Minio = require('minio')
const upload = require('express-fileupload');
const MongoStore = require('connect-mongo');
const session = require('express-session');

// Database connections ------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------

// Mongodb setup
//const baseUrl = "mongodb://localhost:27017/";
const baseUrl = "mongodb://10.20.20.98/";
mongoose.main = mongoose.createConnection(baseUrl + "diastemaDB", { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

const userSchema = require('./models/User');
const User = mongoose.main.model("User", userSchema);

// minIO setup
//const endpoint = '127.0.0.1';
const endpoint = '10.20.20.191';
var minioClient = new Minio.Client({
    endPoint: endpoint,
    port: 9000,
    useSSL: false,
    accessKey: 'diastema',
    secretKey: 'diastema'
});

// -----------------------------------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------------------------------

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(upload());
app.use(session({
    secret:'diastema',
    resave:false,
    saveUninitialized:false,
    store:MongoStore.create({
        mongoUrl: baseUrl+"diastemaDB",
        collection:'sessions'
    })
}));

// Home route -----------------------------------------------------------------------------------------------------------
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

                    req.session.user = req.body.username;
                    req.session.org = (data[0].toObject().organization).toLowerCase();

                    res.redirect("/upload");
                }
            }
        });
    });

// Logout route -------------------------------------------------------------------------------------------------------------
app.route("/logout")
    .get((req,res) => {
        req.session.destroy((err) => {
            if (err) throw err;
            res.redirect("/")
        });
    });

// Register route -----------------------------------------------------------------------------------------------------------
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

// Data upload route -----------------------------------------------------------------------------------------------------------
app.route("/upload")
    .get((req,res) => {
        res.render("upload");
    })
    .post((req,res) => {

        req.session.usecase = req.body.usecase;
        req.session.source = req.body.source;
        req.session.label = req.body.label;
        req.session.analysisid = Math.random().toString(16).slice(2);
        req.session.filename = req.files.inpFile.name;

        const uploadpath = 'public/data/';

        // Save file to local storage
        req.files.inpFile.mv(uploadpath + req.files.inpFile.name, function(error){
            if (error) {
                console.log("Error could not copy to local storage");
                console.log(error);
            }
        });

        // Check if bucket exists
        minioClient.bucketExists(req.session.org, function(err, exists) {

            if (err) {
                return console.log(err)
            }
            // If exists, put the file in the bucket to the specified path and then delete it from local storage
            if (exists) {
                minioClient.fPutObject(req.session.org, "analysis-"+ req.session.analysisid +"/raw/"+req.files.inpFile.name, uploadpath+req.files.inpFile.name, function(error, etag) {
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
                minioClient.makeBucket(req.session.org, function(err) {
                    if (err) return console.log(err);
                    minioClient.fPutObject(req.session.org, "analysis-"+ req.session.analysisid +"/raw/"+req.files.inpFile.name, uploadpath+req.files.inpFile.name, function(error, etag) {
                        if(error) {
                            return console.log(error);
                        }
                        console.log("Organization bucket has been created");
                        console.log(req.files.inpFile.name + " has been uploaded to minIO bucket " + req.session.org);
                        // Deletes the local file
                        fs.unlinkSync(uploadpath+req.files.inpFile.name);   
                    });
                });
            }
        });

        res.redirect("/modelling");
    });

// Modelling route -----------------------------------------------------------------------------------------------------------
app.route("/modelling")
    .get((req,res) => {
        
        const username = req.session.user;
        const org = req.session.org;
        const id = req.session.analysisid;
        const usecase = req.session.usecase;
        const source = req.session.source;
        const label = req.session.label;
        const dataset = req.session.filename;

        res.render("modelling", {user:username,org:org, id:id,usecase:usecase,source:source,label:label,dataset:dataset});
    });

// Dashboard route -----------------------------------------------------------------------------------------------------------
app.route("/dashboard")
    .get((req,res)=> {

        const username = req.session.user;
        const organization = req.session.org;

        let data = [];

        // Search for collections in organization database
        mongoose.dash = mongoose.createConnection(baseUrl + organization, { useUnifiedTopology: true, useNewUrlParser: true });
        mongoose.dash.on('open', function (ref) {
            
            //Get all collection names
            mongoose.dash.db.listCollections().toArray((error, collections) => {

                // Database has collections
                if (collections.length != 0) {

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
                            if (record["kind"] === "metadata") {
                                info.label = record.metadata["analysis-label"];
                                info.usecase = record.metadata.usecase;
                                info.source = record.metadata.source;
                                info.dataset = record.metadata.dataset;
                                info.user = record.metadata.user;
                                info.date = record.metadata["analysis-date"];
                                info.time = record.metadata["analysis-time"];
                                info.org = organization;
                            }
                        });

                        data.push(info);

                        // If it is the last collection, render the page
                        if (i === collections.length - 1 ) {
                            res.render("dashboard", {user:username,query:true,data:data});
                        }
                    });
                // Database is empty
                } else {
                    res.render("dashboard", {user:username,query:false});
                }

            });
        });
    });

// Toolkit route -----------------------------------------------------------------------------------------------------------
app.route("/toolkit")
    .post((req,res) => {
        console.log(req.body);
        res.redirect("/modelling");
    });

// Visualization route -----------------------------------------------------------------------------------------------------------
app.route("/visualize")
    .post((req,res) => {

        // TAKE INFO FROM DASHBOARD FORM AND SEARCH MONGO
        // AFTER THAT RENDER WITH DATA

        mongoose.visualizer = mongoose.createConnection(baseUrl + req.session.org, { useUnifiedTopology: true, useNewUrlParser: true });
        mongoose.visualizer.once('open', function () {

            let coll = (req.body.id).replace("-", "_");
            mongoose.visualizer.db.collection(coll, function(err, collection){
                collection.find({kind:"visualize"}).toArray(function(err, data) {
                    let info = data[0];

                    // Add the correct dataset name that the user uploaded
                    collection.find({kind:"metadata"}).toArray(function(err, data) {
                        
                        info.file = data[0]["metadata"]["dataset"];
                        info.metadata = data[0]["metadata"];

                        res.render("visualization", {user:req.session.user,info:info});
                    });

                })
            });
        
        });
    });

// Messaging route -----------------------------------------------------------------------------------------------------------
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
                    io.sockets.emit("Dashboard", {notif:"Data ready for visualization",file:splitter[1]});

                    // ADD INFO TO MONGO//
                    mongoose.orchinfo = mongoose.createConnection(baseUrl + data.org, { useUnifiedTopology: true, useNewUrlParser: true });
                    const orchSchema = require('./models/Orch');

                    let coll = splitter[1].replace("-", "_");
                    const Orch = mongoose.orchinfo.model("Orch", orchSchema, coll);

                    const orch = new Orch ({
                        kind: "visualize",
                        newpath: data.newpath,
                        file: data.file,
                        org: data.org,
                        job: data.job,
                        column: data.column
                    });
            
                    orch.save();
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