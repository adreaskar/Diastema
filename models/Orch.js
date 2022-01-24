const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orchSchema = new mongoose.Schema ({
    kind: String,
    newpath: String,
    file: String,
    org: String,
    job: String,
    column: String
});

module.exports = orchSchema;