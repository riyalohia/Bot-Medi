var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const axios = require('axios');
var MongoClient = require('mongodb').MongoClient;
var token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6InJpeWFsaDE5OTdAZ21haWwuY29tIiwicm9sZSI6IlVzZXIiLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9zaWQiOiIzOTM4IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy92ZXJzaW9uIjoiMjAwIiwiaHR0cDovL2V4YW1wbGUub3JnL2NsYWltcy9saW1pdCI6Ijk5OTk5OTk5OSIsImh0dHA6Ly9leGFtcGxlLm9yZy9jbGFpbXMvbWVtYmVyc2hpcCI6IlByZW1pdW0iLCJodHRwOi8vZXhhbXBsZS5vcmcvY2xhaW1zL2xhbmd1YWdlIjoiZW4tZ2IiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL2V4cGlyYXRpb24iOiIyMDk5LTEyLTMxIiwiaHR0cDovL2V4YW1wbGUub3JnL2NsYWltcy9tZW1iZXJzaGlwc3RhcnQiOiIyMDE4LTEwLTA2IiwiaXNzIjoiaHR0cHM6Ly9zYW5kYm94LWF1dGhzZXJ2aWNlLnByaWFpZC5jaCIsImF1ZCI6Imh0dHBzOi8vaGVhbHRoc2VydmljZS5wcmlhaWQuY2giLCJleHAiOjE1Mzk3MTAxNTYsIm5iZiI6MTUzOTcwMjk1Nn0.J2rxhBavwv9RjTxW68TdX4498AOsAt48Cl2xHTieuSo';

// Get all the symptoms from Apimedic API.
function getSymptom() {
    return axios.get("https://sandbox-healthservice.priaid.ch/symptoms?token=" + token + "&language=en-gb&format=json")
        .then(response => {
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
}

function getSymptomId(symptom) {
    return getSymptom().then(data => {
        if (symptom.indexOf(" ") !== -1) {
            return require('./server/keywordExtractor.js')(symptom, data).then(id => {
                return id;
            });
        } else {
            var arrFound = data.filter(function(item) {
                return item.Name == symptom.charAt(0).toUpperCase() + symptom.slice(1);
            });
            return arrFound[0].ID;
        }
    })
}

// Get Medical_Conditions
function getDiseases(symptom, age) {
    return getSymptomId(symptom).then(data => {
        id = data;
        return axios.get("https://sandbox-healthservice.priaid.ch/diagnosis?symptoms=[\'" + id + "\']&gender=female&year_of_birth=" + age + "&token=" + token + "&language=en-gb&format=json")
            .then(response => {
                return response.data;
            })
    });
}

app.listen(8080, function() {
    console.log('Server running at http://localhost:8080/');
});

app.post('/doctors', function(req, res) {
    require('./server/getDiseaseSpecialisation.js')(req.body.ID._id, app).then(specialisation => {
        require('./server/getHospitals.js')(req.body.coords, specialisation, app).then(hospitals => {
            res.send({ "hospitals": hospitals });
        });
    });
});

app.post('/symptoms', function(req, res) {
    getDiseases(req.body.symptom, req.body.age).then(diagnosisArray => {
        require('./server/storeDiseaseToDatabase.js')(diagnosisArray).then(message => {
            require('./server/getTreatments.js')(diagnosisArray).then(message => {
                res.send(message);
            });
        });
    });
});

require('./server/sendDataToClient.js')(app);