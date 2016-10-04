/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
require('dotenv').load({silent: true});
var express = require('express');
var app = express();
var DocumentConversionV1 = require('watson-developer-cloud/document-conversion/v1');
var fs = require('fs');
var path = require('path');

// Bootstrap application settings
require('./config/express')(app);


var documentConversion = new DocumentConversionV1({
  // If unspecified here, the DOCUMENT_CONVERSION_USERNAME and DOCUMENT_CONVERSION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  // username: '<username>',
  // password: '<password>',
  password: "0Wk0G8vqFS7g",
  username: "bf7f14f6-37be-4cad-b6ae-d0899cf6478d",
  version_date: '2015-12-01'
});

var types = {
  'ANSWER_UNITS': '.json',
  'NORMALIZED_HTML': '.html',
  'NORMALIZED_TEXT': '.txt'
};

var samples = ['Sample_Referral_01.pdf'];
var uploadFolder = path.join(__dirname, 'uploads/');
var sampleFolder = path.join(__dirname, 'public/data/');

/**
 * Returns the file path to a previously uploaded file or a sample file
 * @param  {String} filename the file name
 * @return {String} absolute path to the file or null if it doesn't exists
 */
function getFilePath(filename) {
  if (samples.indexOf(filename) !== -1) {
    return sampleFolder + filename;
  } else {
    console.log(uploadFolder);
    if (fs.readdirSync(uploadFolder).indexOf(filename) !== -1) {
      return uploadFolder + filename;
    }
    return null;
  }
}

app.get('/', function(req, res) {
  res.render('index');
});

/*
 * Uploads a file
 */
app.post('/files', app.upload.single('document'), function(req, res, next) {
  if (!req.file && !req.file.path) {
    return next({
      error: 'Missing required parameter: file',
      code: 400
    });
  }
  res.json({
    id: req.file.filename
  });
});

/*
 * Converts a document
 */
app.get('/api/convert', function(req, res, next) {
  var file = getFilePath(req.query.document_id);
  var params = {
    conversion_target: req.query.conversion_target,
    file: file ? fs.createReadStream(file) : null
  };

  documentConversion.convert(params, function(err, data) {
    if (err) {
      return next(err);
    }
    var type = types[req.query.conversion_target];
    res.type(type);
    if (req.query.download) {
      res.setHeader('content-disposition', 'attachment; filename=output-' + Date.now() + '.' + type);
    }
    res.send(data);
  });
});

/*
 * Returns an uploaded file from the service
 */
app.get('/files/:id', function(req, res) {
  var file = getFilePath(req.params.id);
  fs.createReadStream(file).on('response', function(response) {
    if (req.query.download) {
      response.headers['content-disposition'] = 'attachment; filename=' + req.params.id;
    }
  })
  .pipe(res);
});

// error-handler settings
require('./config/error-handler')(app);

module.exports = app;
