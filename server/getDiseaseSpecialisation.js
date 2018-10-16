var express = require('express');
var app = express();
const axios = require('axios');
var MongoClient = require('mongodb').MongoClient;
let ObjectID = require("mongodb").ObjectID;

// This module is used to get Specialisation of a particular disease from database.
// Specialisation is passed to Google map api as a 'keyword' to get particular kind of nearby hospitals.
module.exports = function(id, app) {
    return new Promise(function(resolve, reject) {
        MongoClient.connect('mongodb://localhost:27017/medicare', function(err, db) {
            if (err) {
                reject(err);
            } else {
                resolve(db);
            }
        })
    }).then(function(db) {
        return new Promise(function(resolve, reject) {
            var collection = db.collection('Medical_Conditions');
            collection.find({ '_id': ObjectID(id) }).toArray(function(err, items) {
                if (err) {
                    reject(err);
                } else {
                    resolve(items[0].Specialisation);
                }
            });
        });
    });

};