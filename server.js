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
var fs = require('fs-extra');
var db = new sqlite3.Database('WanU.db');

fs.mkdirpSync('static_files/user_files');

db.run('CREATE TABLE IF NOT EXISTS WanU_user (email TEXT PRIMARY KEY, name TEXT, log_in INTEGER, language TEXT, city TEXT, pictures INTEGER)');
db.run('CREATE TABLE IF NOT EXISTS WanU_image (photo TEXT PRIMARY KEY, email TEXT, vote INTEGER)');

//var startup=fs.readdirSync(__dirname+'/static_files/public');
//for (var i=0; i<startup.length; i++){
//  db.run('INSERT OR IGNORE INTO WanU_image (name, vote) VALUES (?,?)', [startup[i], 1]);
//}


// creat account
app.post('/user', function (req, res) {
  var postBody = req.body;
  db.all("SELECT * FROM WanU_user WHERE email='"+postBody.email+"'", function (err, row) {
    if (row.length==0){
      db.run("INSERT INTO WanU_user (email, name, log_in, pictures) VALUES (?,?,?,?)", [postBody.email,postBody.name,0,0]);  
      fs.mkdirsSync('static_files/user_files/'+postBody.email);
      res.send('created');
      return;
    }
    res.send();
  });
});

// log in
app.get('/user/*', function (req, res) {

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
    }
  });
});

// log out
app.put('/user/*', function (req, res) {
  var userEmail = req.params[0];
  db.run("UPDATE WanU_user SET log_in=0 where email=?",[userEmail]);
});

app.delete('/user/*', function (req, res) {
  var userEmail = req.params[0]; 
  db.run("DELETE FROM WanU_user WHERE email=?",[userEmail]);
  fs.removeSync(__dirname+"/static_files/"+userEmail);
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

// update user preferance
app.post('/user_pref', function (req, res) {
  var postBody = req.body;
  db.run("UPDATE WanU_user SET language=?, city=? where email=?",[postBody.language,postBody.city,postBody.email]);
});


// get user image
app.get('/image/*', function (req, res) {
  var userEmail = req.params[0]; 
  var files=fs.readdirSync(__dirname+'/static_files/user_files/'+userEmail);
  res.send({photos:files});
});

// post user image
app.post('/image/*', function (req, res) {
  var userEmail = req.params[0]; 
  var form = new formidable.IncomingForm();
  form.uploadDir = __dirname + "/static_files/user_files/"+userEmail;
  form.keepExtensions = true;
  form.parse(req, function(err, fields, files) {
      var filesRes=fs.readdirSync(__dirname+'/static_files/user_files/'+userEmail);
      res.send({photos: filesRes});
  });
});

// get all images
app.get('/image', function (req, res) {
  var userEmail = req.params[0]; 
  var files=fs.readdirSync(__dirname+'/static_files/public');
  res.send({photos: files});
});


app.delete('/image/*', function (req, res) {
  var photo=req.body.photo;
  var userEmail = req.params[0];
  fs.unlinkSync(__dirname+"/static_files/user_files/"+userEmail+"/"+photo);
  try{
    fs.unlinkSync(__dirname+"/static_files/public/"+photo);
  }catch(err){}
  db.run("DELETE FROM WanU_image WHERE photo=?",[photo]);
  var filesRes=fs.readdirSync(__dirname+'/static_files/user_files/'+userEmail);
  res.send({photos: filesRes});
});

// update the votes
 app.put('/votes', function (req, res) {
  var postBody = req.body;
 // var email=postBody.email;
  var photo=postBody.photo;
  var vote=postBody.vote;
  vote=parseInt(vote)+1; //update the vote;
  db.run("UPDATE WanU_image SET vote=? where photo=?",[vote,photo]);

  var filedb1=new Array();
  var filedb2=new Array();
  var filedb3=new Array();

  db.all("SELECT * FROM WanU_image", function(err, rows) {  
        for (i=0;i<rows.length;i++){
          filedb1[i] = rows[i].photo;
          filedb2[i] = rows[i].vote;
          filedb3[i] = rows[i].email;
        }
        res.send({photos: filedb1, votes: filedb2, emails: filedb3});  
    });
});


app.get('/votes', function (req, res) {
  var filedb1=new Array();
  var filedb2=new Array();
  var filedb3=new Array();

  db.all("SELECT * FROM WanU_image", function(err, rows) {  
        for (i=0;i<rows.length;i++){
          filedb1[i] = rows[i].photo;
          filedb2[i] = rows[i].vote;
          filedb3[i] = rows[i].email;
        }
        res.send({photos: filedb1, votes: filedb2, emails: filedb3});  
    });
});

app.get('/votes/*', function (req, res) {
  var userEmail = req.params[0];
  var filedb1=new Array();

  db.all("SELECT * FROM WanU_image WHERE email="+userEmail, function(err, rows) {
        for (i=0;i<rows.length;i++){
          filedb1[i] = rows[i].photo;
        }
        res.send({photos: filedb1});  
    });
});

app.post('/image_publish', function (req, res) {
  var postBody = req.body;
  var photo = postBody.photo;
  var userEmail = postBody.email;
  /*
  var inStr = fs.createReadStream(__dirname+"/static_files/"+'mining'+"/"+photo, { flags: 'rs',
    encoding: null,
    fd: null,
    mode: 0o666,
    autoClose: true
  });
  var outStr = fs.createWriteStream(__dirname+"/static_files/public/"+photo);
  inStr.pipe(outStr);
  */
  db.run('INSERT OR IGNORE INTO WanU_image (photo, email, vote) VALUES (?,?,?)', [photo, userEmail, 0]);
  fs.copySync(__dirname + "/static_files/user_files/" + userEmail+"/"+photo,
    __dirname + "/static_files/public/"+photo);
});





// start the server on http://localhost:3000/
var server = app.listen(3000, function () {
  var port = server.address().port;
  console.log('Server started at http://localhost:%s/', port);
});
