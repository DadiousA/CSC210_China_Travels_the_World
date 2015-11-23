// Prerequisites - first run:
//   npm install express
//   npm install body-parser
//
// then run:
//   node server.js
//

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('static_files'));
var sqlite3 = require('sqlite3').verbose();
var formidable = require('formidable');
var path = require('path');
var util = require('util');
var fs = require('fs-extra');
var mkdirp = require('mkdirp'); 
var db = new sqlite3.Database('WanU.db');

db.run('CREATE TABLE IF NOT EXISTS WanU_user (email TEXT PRIMARY KEY, name TEXT, log_in INTEGER, language TEXT, city TEXT, pictures INTEGER)');

// creat account
app.post('/users', function (req, res) {
  var postBody = req.body;
  db.all("SELECT * FROM WanU_user WHERE email='"+postBody.email+"'", function (err, row) {
    if (row.length==0)
    {
      db.run("INSERT INTO WanU_user (email, name, log_in, pictures) VALUES (?,?,?,?)", [postBody.email,postBody.name,0,0]);  
      mkdirp('static_files/user_files/'+postBody.email, function (err) {});
      res.send('Account created.');
      return;
    }
    else {
      res.send();
      return;
    }
  });
});

// log in
app.get('/users/*', function (req, res) {

  var userEmail = req.params[0]; 
  db.all("SELECT * FROM WanU_user where email=?",[userEmail], function (err, row) {
    if (row.length!=0){
      if(row[0].log_in==0){
        res.send("OK");
        db.run("UPDATE WanU_user SET log_in=1 where email=?",[userEmail]);
        return;
      }
      else{
        res.send("Fail");
        return;
      }
    }
    else{ 
      res.send();
      return;
    }
  });
});

// log out
app.put('/user/*', function (req, res) {
  var userEmail = req.params[0];
  db.run("UPDATE WanU_user SET log_in=0 where email=?",[userEmail]);
  res.send('OK');
});

// delete account
app.delete('/user/*', function (req, res) {
  var userEmail = req.params[0]; 
  db.run("DELETE FROM WanU_user WHERE email=?",[userEmail]);
  fs.removeSync(__dirname+"/static_files/user_files/"+userEmail);
  res.send("OK");
});

// update user preferance
app.post('/user_pref', function (req, res) {
  var postBody = req.body;
  db.run("UPDATE WanU_user SET language=?, city=? where email=?",[postBody.language,postBody.city,postBody.email]);
});

// get user preference
app.get('/user_pref/*', function (req, res) {
  var userEmail = req.params[0]; 
    db.all("SELECT * FROM WanU_user WHERE email=?", [userEmail], function(err, row){
      if (row.length!=0){
        var user_pref={name: row[0].name, language: row[0].language, city: row[0].city};
        res.send(user_pref);
        return;
      }
    });
});

// post user image
app.post('/image/*', function (req, res) {
  var userEmail = req.params[0]; 
  var form = new formidable.IncomingForm();
  form.uploadDir = __dirname + "/static_files/image_base";
  form.keepExtensions = true;
  form.parse(req, function(err, fields, files) {
    db.all("SELECT * FROM WanU_user WHERE email=?", [userEmail], function(err, row){
      var numPictures = row[0].pictures;
      numPictures++;
      db.run("UPDATE WanU_user SET pictures=? where email=?",[numPictures,userEmail]);
      fs.copySync(files.image.path,
                    __dirname + "/static_files/user_files/" + userEmail+"/"+numPictures+path.extname(files.image.path));

      var filesRes=fs.readdirSync(__dirname+'/static_files/user_files/'+userEmail);
      var user_photos={photos: filesRes};
      res.send(user_photos);
    });
  });
});

// get user image
app.get('/image/*', function (req, res) {
  var userEmail = req.params[0]; 
//  console.log(userEmail);
  var files=fs.readdirSync(__dirname+'/static_files/user_files/'+userEmail);
  var user_photos={photos: files};
  res.send(user_photos);
});

// get all image

app.get('/image', function (req, res) {
  var files=fs.readdirSync(__dirname+'/static_files/image_base');
  var user_photos={photos: files};
  res.send(user_photos);
});





// start the server on http://localhost:3000/
var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Server started at http://localhost:%s/', port);
});
