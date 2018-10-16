var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

// This module returns the final updated database to client.js.
// This updated database contains Diseases, Specialisation and Treatments.
module.exports = function(app) {
    app.get('/treatments', function(req, res) {
        MongoClient.connect("mongodb://localhost:27017/medicare", function(err, db) {
            const mydb = db.db('medicare');
            mydb.collection('Medical_Conditions', function(err, collection) {
                var collection = db.collection('Medical_Conditions');

                collection.find().toArray(function(err, items) {
                    if (err) {
                        reject(err);
                    } else {
                        res.send(items);
                    }
                });
            });
        });
    });
}