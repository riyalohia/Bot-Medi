var express = require('express');
var app = express();
const axios = require('axios');

// This module returns the nearby hospitals.
// These results are based on kind of disease.
// Google map's Places API is used.
module.exports = function(coords, items, app) {
    return new Promise(function(resolve, reject) {
        var apiKey = 'Google-Map-Api-Key';
        var string = "(";

        // Combine all the specialisations in one string to pass as a keyword.
        for (var i = 0; i < items.length; i++) {
            var keyword = items[i].Name;
            keyword = keyword.replace(' ', '_');
            if (i == items.length - 1) {
                string += keyword + ")"
            } else {
                string += keyword + ")OR("
            }    
        }

        var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + coords.lat + ',' + coords.lng + '&radius=1500&type=hospital&keyword=' + string + '&key=' + apiKey + '';
        axios.get(url)
            .then(response => {
                resolve(response.data.results);
            })
            .catch(error => {
                reject(error);
            });
    });

}