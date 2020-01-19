const app = require('express')();
const express = require('express');
const server = require('http').Server(app);
const multer = require('multer');
const path = require("path");
const fs = require("fs");
const io = require("socket.io")(server);
var port = 65515;

app.get('/', function (req, res) {
	res.sendFile('/pages/index.html', {root: '.'})
});

app.use('/js', express.static(__dirname + '/js'));
app.use('/songs', express.static(__dirname + '/songs'));
app.use('/pages', express.static(__dirname + '/pages'));

// // Uploading // //

var storage = multer.diskStorage({
	destination: './songs',
	filename: function(req, file, cb) {
		cb(null, file.originalname.substring(0, file.originalname.indexOf(".")) + '=' + Date.now() + path.extname(file.originalname));
	}
});
var upload = multer({ storage: storage });

app.post('/upload', upload.single("song"), function(req, res) {
  if (req.file) {
    console.log(req.file);
  }
	res.redirect('back');
});
// // Socket.io // //

io.on("connection", function(socket) {
  socket.on("SongScan", function() {
    fs.readdir("./songs", function(path, items) {
      socket.emit("Songs", path, items);
    });
  });
});

server.listen(port, function() {
	console.log("Ready");
});
