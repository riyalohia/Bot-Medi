var express = require('express');
var app = express();
var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var MongoClient = require('mongodb').MongoClient;

// This module is used to get treatments for diseases.
// Treatments are fetched using web scrapping of https://www.nhsinform.scot/
module.exports = function(diagnosisArray) {
    let treatments = [];

    // Get href links of the diseases from the page.
    function getDiseasesLink(disease) {
        return new Promise(function(resolve, reject) {
            var url = 'https://www.nhsinform.scot/illnesses-and-conditions/a-to-z';
            request(url, function(err, resp, body) {
                $ = cheerio.load(body);
                links = $('a');
                var boolean = true;
                $(links).each(function(i, link) {
                    if (boolean) {
                        var str = $(link).attr('title') + "";
                        disease = disease + "";
                        if (str.indexOf(disease.toLowerCase()) !== -1 || str.indexOf(disease.charAt(0).toUpperCase() + disease.slice(1)) !== -1 || str.indexOf(disease) !== -1) {
                            boolean = false;
                            resolve($(link).attr('href'));
                        }
                    }
                });
                if (boolean) {
                    resolve("Not Matched");
                }
            });
        });
    }

    // Get treatments related to diseases.
    function getTreatments(disease, callback) {
        return new Promise(function(resolve, reject) {
            return getDiseasesLink(disease).then(response => {
                if (response !== "Not Matched") {
                    var url = 'https://www.nhsinform.scot' + response + '#treatment';
                    request(url, function(err, resp, body) {
                        $ = cheerio.load(body);
                        links = $('div#treatment h2');
                        treatments = [];
                        $(links).each(function(i, link) {
                            treatments.push($(link).text());
                        });
                        resolve(treatments);
                    });
                } else {
                    resolve("No Treatments");
                }

            });
        });
    }

    // Update database by adding a new field Treatment.
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
            var promises = [];
            async.each(diagnosisArray, (q, next) => {
                promises.push(getTreatments(q.Issue.Name).then(response => {
                    if (response !== "No Treatments") {
                        collection.update({ id: q.Issue.ID }, { $set: { Treatment: response } });
                    }
                }))
                next();
            });
            Promise.all(promises).then((result) => {
                resolve({ message: "Success" });
            })
        });
    });
}