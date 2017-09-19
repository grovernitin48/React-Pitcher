var express = require('express'),
	path = require('path'),
	config = require('./config/config.js'),
	knox = require('knox'),
	fs = require('fs'),
	os = require('os'),
	formidable = require('formidable'),
	gm = require('gm'),
	mongoose = require('mongoose').connect(config.dbURL),
	s3 = require('s3')

var app = express();

app.set('views', path.join(__dirname, 'views')); // estalishing views folder as a source of html pages
app.engine('html', require('hogan-express')); // setting template engine
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public'))); // estalishing public folder as a source of static assets - js, img, css
app.set('port', process.env.PORT || 3000);
app.set('host', config.host);

// before using knox, configure knox client 
var client = knox.createClient({
	key:'AKIAIQLCGJRZPVOE7D3Q',
	secret:'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',
	bucket:'ladupicture'
});

/*var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: "AKIAIQLCGJRZPVOE7D3Q'",
    secretAccessKey: "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",
    // any other options are passed to new AWS.S3() 
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
  },
});
*/

var server = require('http').createServer(app); // listening to the app varable
var io = require('socket.io')(server);

require('./routes/routes.js')(express, app, formidable, fs, os, gm, client, mongoose, io, s3);

// var server = require('http').createServer(app); // listening to the app varable
// var io = require('socket.io')(server);

server.listen(app.get('port'), function(){
	console.log("photogrid running on " + app.get('port'));
})
