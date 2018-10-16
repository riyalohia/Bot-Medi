var express = require('express');
var app = express();
var keyword_extractor = require("keyword-extractor");

// This module is used to extract keywords from a sentence.
module.exports = function(sentence, symptoms) {
    return new Promise(function(resolve, reject) {
        var result = keyword_extractor.extract(sentence, {
            language: "english",
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: true
        });

        // Get required symtom ID.
        var arrFound = symptoms.filter(function(item) {
            for (var i = 0; i < result.length; i++) {
                var sym = result[i].charAt(0).toUpperCase() + result[i].slice(1);
                if (item.Name == sym || item.Name.indexOf(sym) !== -1) {
                    return item.Name;
                }
            }
        });
        resolve(arrFound[0].ID);
    });
};