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
db.run('CREATE TABLE IF NOT EXISTS WanU_image (name TEXT PRIMARY KEY, vote INTEGER)');

var startup=fs.readdirSync(__dirname+'/static_files/public');
console.log(startup);
for (var i=0; i<startup.length; i++){
  db.run('INSERT OR IGNORE INTO WanU_image (name, vote) VALUES (?,?)', [startup[i], 1]);
}


// creat account
app.post('/users', function (req, res) {
  var postBody = req.body;
  db.all("SELECT * FROM WanU_user WHERE email='"+postBody.email+"'", function (err, row) {
    if (row.length==0)
    {
      db.run("INSERT INTO WanU_user (email, name, log_in, pictures) VALUES (?,?,?,?)", [postBody.email,postBody.name,0,0]);  
      mkdirp('static_files/'+postBody.email, function (err) {});
      // add in a default photo
  //    var inStr = fs.createReadStream(__dirname+"/static_files/"+email+"/"+photo);
      var inStr = fs.createReadStream(__dirname+"/static_files/public/index_eiffel.jpg");
      var outStr = fs.createWriteStream('static_files/'+postBody.email+'/index_eiffel.jpg');
      inStr.pipe(outStr);
      // add in a default photo
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

// get user collection
app.get('/image/*', function (req, res) {
  var userEmail = req.params[0]; 
//  console.log(userEmail);
  var files=fs.readdirSync(__dirname+'/static_files/'+userEmail);
  var user_photos={photos: files};
  console.log(files);
  res.send(user_photos);
});


// update the votes
 app.post('/image_vote/', function (req, res) {
  var postBody = req.body;
 // var email=postBody.email;
  var photo=postBody.photo;
  var vote=postBody.vote;
  photo=photo.replace(/#/, '.' );
  console.log(photo);
  //introduce the database here;
  vote=parseInt(vote)+1; //update the vote;
  db.run("UPDATE WanU_image SET vote=? where name=?",[vote,photo]);
  //introduce the database above;

  var filedb1=new Array();
  var filedb2=new Array();

  var counter=0;
  db.all("SELECT name, vote FROM WanU_image", function(err, rows) {  
        rows.forEach(function (row) {  
            console.log(row.name, row.vote);  
            filedb1[counter]=row.name;
            console.log("photo:"+row.name);
            console.log("vote:"+row.vote);
            filedb2[counter]=row.vote;
            counter=counter+1;
            console.log("counter: "+counter);
            console.log(filedb1);
            console.log(filedb2);
        });
          console.log("ko....");
          var user_photos={photos: filedb1, votes: filedb2,};
          console.log(user_photos);
          console.log("...............");
          res.send(user_photos);  
    });

});

// get user image
app.get('/image', function (req, res) {
  var userEmail = req.params[0]; 
  var files=fs.readdirSync(__dirname+'/static_files/public');
  res.send({photos: files});
});

// update the votes


app.get('/public_image', function (req, res) {
  var filedb1=new Array();
  var filedb2=new Array();

  var counter=0;
  db.all("SELECT name, vote FROM WanU_image", function(err, rows) {  
        rows.forEach(function (row) {  
            console.log(row.name, row.vote);  
            filedb1[counter]=row.name;
            filedb2[counter]=row.vote;
            counter=counter+1;
            console.log("counter: "+counter);
        });
          var user_photos={photos: filedb1, votes: filedb2,};
          res.send(user_photos);  
    });
});

// update user preferance
app.post('/user_pref', function (req, res) {
  var postBody = req.body;
  db.run("UPDATE WanU_user SET language=?, city=? where email=?",[postBody.language,postBody.city,postBody.email]);
});



app.post('/image_delete', function (req, res) {
  var postBody = req.body;
  var email=postBody.email;
  var photo=postBody.photo,
  photo=photo.replace(/#/, '.' );
  console.log(photo);
  fs.unlink(__dirname+"/static_files/"+email+"/"+photo, function(err) {
        if (err) {
        return console.error(err);
        }
        console.log("File deleted successfully!");
});
  res.send("OK");
});


app.post('/image_publish', function (req, res) {
  var postBody = req.body;
  var email=postBody.email;
  var photo=postBody.photo,
  photo=photo.replace(/#/, '.' );
  console.log(photo);

  var inStr = fs.createReadStream(__dirname+"/static_files/"+'mining'+"/"+photo, { flags: 'rs',
  encoding: null,
  fd: null,
  mode: 0o666,
  autoClose: true
});
  var outStr = fs.createWriteStream(__dirname+"/static_files/public/"+photo);
  inStr.pipe(outStr);
  db.run('INSERT OR IGNORE INTO WanU_image (name, vote) VALUES (?,?)', [photo, 1]);
  //
  //update the voting database;
  db.all("SELECT name, vote FROM WanU_image", function(err, rows) {  
        rows.forEach(function (row) {  
            console.log(row.name, row.vote);  
        })  
    });

  //
  console.log("just published 1 photo");
  res.send("OK");

});

app.post('/image/*', function (req, res) {
  var userEmail = req.params[0]; 
  var form = new formidable.IncomingForm();
  form.uploadDir = __dirname + "\\static_files\\" + userEmail;
  form.keepExtensions = true;
  form.parse(req, function(err, fields, files) {
    db.all("SELECT * FROM WanU_user WHERE email=?", [userEmail], function(err, row){
      var numPictures = row[0].pictures;
      numPictures++;
      db.run("UPDATE WanU_user SET pictures=? where email=?",[numPictures,userEmail]);
      var road=files.image.path
      var extent=path.extname(road)
      fs.renameSync(road,
                    __dirname + "\\static_files\\" + userEmail+"\\"+userEmail+numPictures+path.extname(road));
      fs.copy(__dirname + "\\static_files\\" + userEmail+"\\"+userEmail+numPictures+extent, __dirname + "\\static_files\\" +"mining"+"\\"+userEmail+numPictures+extent, {replace: true});

      res.send("Image Successfully Uploaded.");
    });
  });
});


/*
// READ a list of all usernames (note that there's no '*' at the end)
//
// To test with curl, run:
//   curl -X GET http://localhost:3000/users
app.get('/users', function (req, res) {
  var allUsernames = [];

  for (var i = 0; i < fakeDatabase.length; i++) {
    var e = fakeDatabase[i];
    allUsernames.push(e.name); // just record names
  }

  res.send(allUsernames);
});
*/

app.delete('/user/*', function (req, res) {
  var userEmail = req.params[0]; 
  db.run("DELETE FROM WanU_user WHERE email=?",[userEmail]);
  fs.removeSync(__dirname+"/static_files/"+userEmail);
  res.send("OK");
});



// start the server on http://localhost:3000/
var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Server started at http://localhost:%s/', port);
});
