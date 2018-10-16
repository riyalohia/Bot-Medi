var express = require('express');
var app = express();
var MongoClient = require('mongodb').MongoClient;

// Store diseases to Mongodb database.
module.exports = function(diagnosisArray) {
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
            collection.remove({});  //Remove previous documents before adding new.
            var obj = [];
            for (var i = 0; i < diagnosisArray.length; i++) {
                obj.push({ id: diagnosisArray[i].Issue.ID, Name: diagnosisArray[i].Issue.Name, Accuracy: diagnosisArray[i].Issue.Accuracy, Specialisation: diagnosisArray[i].Specialisation })
            }
            collection.insert(obj, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ message: 'Updated' });
                }
            });
        });
    });
}