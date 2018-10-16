# Innovaccer Medicare

This project has two main folders namely `client`  and `server`.
Client contains the frontend part and Server contains the backend part.

## Technologies Used

Frontend : HTML, CSS, JavaScript
Backend : NodeJS, Express
Database : MongoDB

## Fetching Diseases and Treatments

![alt tag](https://raw.githubusercontent.com/riyalohia/Innovaccer-Medicare/master/Documentation/form.PNG "Search Symptoms")

After clicking on Detect button, a Post request is sent from *client.js* to *server.js*.

### client.js

```
$.ajax({
    type: 'POST',
    data: symptom,
    url: '/symptoms',
    dataType: 'JSON'
})
```

The above code in client.js sends symptom and age to server.js in JSON format.

### app.js

```
app.post('/symptoms', function(request, response) {
    .
    .
    .
});
```

The parameters like symptom and age are accessed in server.js via request.body.

```
function getDiseases(symptom, age) {
    return getSymptomId(symptom).then(data => {
        id = data;
        return axios.get("https://sandbox-healthservice.priaid.ch/diagnosis?symptoms=[\'"+id+ "\']&year_of_birth=" + age + "&token=" + token + "&language=en-gb&format=json")
            .then(response => {
                return response.data;
            })
    });
}
```

The above function in server.js returns the medical conditions for a given symptom. Symptom id and YOB is used to get diseases from ApiMedic API.

#### storeDiseaseToDatabase.js

```
app.post('/symptoms', function(req, res) {
    getDiseases(req.body.symptom, req.body.age).then(diagnosisArray => {
        require('./server/storeDiseaseToDatabase.js')(diagnosisArray).then(message => {
        	.
        	.
        });
    });
});
```

After fetching diseases from Apimedic, these diseases are stored in Mongodb database.
A `storeDiseaseToDatabase` module in server folder is used for storing diseases in database.


```
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
```

The above code in storeDiseaseToDatabase.js will store *disease ID*, *disease name*, *Accuracy*, and *specialisation* to Mongodb collection. (Here diagnosisArray is the array of medical conditions for a given symptom).

#### getTreatments.js

```
app.post('/symptoms', function(req, res) {
    getDiseases(req.body.symptom, req.body.age).then(diagnosisArray => {
        require('./server/storeDiseaseToDatabase.js')(diagnosisArray).then(message => {
            require('./server/getTreatments.js')(diagnosisArray).then(message => {
            	res.send(message);
            });
        });
    });
});
```

After inserting the data in database, treatments for a particular disease are fetched.
`getTreatments` module in server folder is used for this purpose. Treatments are fetched using web scraping. Website used is : `https://www.nhsinform.scot/`.

There are 2 main functions in this module : *getDiseasesLink*, *getTreatments*.

##### function getDiseasesLink() {}

```
var url = 'https://www.nhsinform.scot/illnesses-and-conditions/a-to-z';
request(url, function(err, resp, body) {
    $ = cheerio.load(body);
    links = $('a');
    var boolean = true;
    $(links).each(function(i, link) {
        .
        .
    });
});
```

The above function fetches the redirectional link of desired diseases from all the relevant elements in the body of *https://www.nhsinform.scot/illnesses-and-conditions/a-to-z*  page.

##### function getTreatments() {}

```
return getDiseasesLink(disease).then(response => {
	var url = 'https://www.nhsinform.scot' + response + '#treatment';
    request(url, function(err, resp, body) {
        $ = cheerio.load(body);
        links = $('div#treatment h2');
        .
        .
});
```

The above function fetches the treatments for a particular disease from the treatments section of the webpage.

##### Updating Treatments in Database

```
async.each(diagnosisArray, (q, next) => {
    promises.push(getTreatments(q.Issue.Name).then(response => {
        collection.update({ id: q.Issue.ID }, { $set: { Treatment: response } });
    }))
    next();
});
```

The above code adds a new field *Treatment* (type array) in database and updates all the diseases with their treatments.

After the promises `storeDiseaseToDatabase` and `getTreatments` are resoleved, response is sent to client.js. After recieving this response in client.js, a function named *populateDiv* will run.

#### sendDataToClient.js

```
app.get('/treatments', function(req, res) {
	.
	.
	collection.find().toArray(function(err, items) {
    	if (err) {
        	reject(err);
    	} else {
        	res.send(items);
    	}
	});
});
```

The above code snippet will fetch the complete database and send it to client.js via get request.

### client.js

#### function populateDiv() {}

```
$.getJSON('/treatments', function(data) {
    data.forEach(function(i) {
       // DOM is Manipulated.
    });
```

The above code snippet will recieve the fetched documents from database, based on this data, relevant elements will be added in the DOM.

## Fetching Nearby Hospitals

![alt tag](https://raw.githubusercontent.com/riyalohia/Innovaccer-Medicare/master/Documentation/hospitals.PNG "Get Nearby Hospitals")

After clicking on the *Nearby Hospitals*, user's current location is detected in the form of latitude and longitude.

### client.js

```
$.ajax({
    type: 'POST',
    data: { 'ID': id, 'coords': lat_lng },
    url: '/doctors',
    dataType: 'JSON'
})
```

ID (disease id) and user's coordinates are sent from client.js to app.js via Post request.

### app.js

```
app.post('/doctors', function(req, res) {
    require('./server/getDiseaseSpecialisation.js')(req.body.ID._id, app).then(specialisation=>{
        require('./server/getHospitals.js')(req.body.coords, specialisation, app).then(hospitals => {
            res.send({ "hospitals": hospitals });
        });
    });
});
```

After recieving request, diseases specialisations are fetched from database via `getDiseaseSpecialisation.js` module.

#### getDiseaseSpecialisation.js

```
collection.find({ '_id': ObjectID(id) }).toArray(function(err, items) {
    if (err) {
        reject(err);
    } else {
        resolve(items[0].Specialisation);
    }
});
```

The above code snippet will fetch specialisation array of a particular disease.

#### getHospitals.js

```
var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location='+coords.lat+','+coords.lng+'&radius=1500&type=hospital&keyword=' + string + '&key=' + apiKey + '';
```

Google map's Places API is used to fetch the nearby hospitals. These nearby results are based on kind of disease. Here parameter *location* is the coordinates and keyword is a string which is the combination of specialisation array.

After the promises `getDiseaseSpecialisation` and `getHospitals` are resolved, response is sent to client.js. Client.js will recieve the hospitals data. After recieving this data, *displayHospitals* function will be called in client.js where DOM manipulation will take place.

## Keyword Extractor

`keywordExtractor.js` module extracts the keywords from sentence. 

```
var result = keyword_extractor.extract(sentence, {
    language: "english",
    remove_digits: true,
    return_changed_case: true,
    remove_duplicates: true
});
```

The module used for this purpose is *keyword-extractor*.
 
## Database Schema

![alt tag](https://raw.githubusercontent.com/riyalohia/Innovaccer-Medicare/master/Documentation/database.PNG "Mongodb Architecture")