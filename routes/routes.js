// all the functionality resides in routes.js
module.exports = function(express, app, formidable, fs, os, gm, client, mongoose, io, s3){

var Socket;

io.on('connection', function(socket){
	Socket = socket; // socket returned by socket.io,  able to use socket outside of socket.io connection event listener
})


// creating the mongoose schema
var singleImage = new mongoose.Schema({
	filename:String,
	votes:Number
})

// turning schema into model
var singleImageModel = mongoose.model('singleImage', singleImage);

var router = express.Router();

router.get('/', function(req, res, next){
	res.render('index', {host:app.get('host')});
})

router.post('/upload', function(req, res, next){
	// File upload

	function generateFilename(filename){ // generating random file name
		//console.log('iska use hua');
		var ext_regex = /(?:\.([^.]+))?$/;
		var ext = ext_regex.exec(filename)[1]; // finding the extension
		var date = new Date().getTime();
		var charBank = "abcdefghijklmnopqrstuvwxyz";
		var fstring = '';
		for(var i = 0; i < 15; i++){
			fstring += charBank[parseInt(Math.random()*26)];
		}
		return (fstring += date + '.' + ext);
	}

	var tmpFile, nfile, fname;
	var newForm = new formidable.IncomingForm();
	  //console.log('pahucha yaha tk');
		newForm.keepExtensions = true;
		newForm.parse(req, function(err, fields, files){
			tmpFile = files.upload.path;
			fname = generateFilename(files.upload.name);
			nfile = os.tmpDir() + '/' + fname;
			res.writeHead(200, {'Content-type':'text/plain'});
			res.end();
			//console.log(fname + 'and' + nfile);
		})

		newForm.on('end', function(){ // when the file upload completes
			fs.rename(tmpFile, nfile, function(){
				// Resize the image and upload this file into the S3 bucket
				gm(nfile).resize(300).write(nfile, function(){ // resizing
				

				fs.readFile(nfile, function(err, buf){
					// Upload to the S3 Bucket using knox client
			//	var object = { foo: "bar" };
			//	var string = JSON.stringify(object);
				var req = client.put(fname, {
   							// 'Content-Length': Buffer.byteLength(string)
  							'Content-Type': 'image/png'
						});		
				req.on('response', function(res){
 				 if (200 == res.statusCode) {
  				  console.log('saved to %s', req.url);
 					 }
				});
				req.end(buf);






					/*fs.readFile(nfile, function(err, buf){
						//console.log(buf.length);
						var req = client.put(nfile, { // describing the file which is put into s3
							'Content-Length':buf.length,
							'Content-Type':'image/png'					
					})

//var s3 = new AWS.S3({signatureVersion: 'v4'});
var params = {
  localFile: nfile,
 
  s3Params: {
    Bucket: "ladupicture",
    Key: "AKIAIQLCGJRZPVOE7D3Q",
    // other options supported by putObject, except Body and ContentLength. 
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
  },
};
var uploader = client.uploadFile(params);
uploader.on('error', function(err) {
  console.error("unable to upload:", err.stack);
});
uploader.on('progress', function() {
  console.log("progress", uploader.progressMd5Amount,
            uploader.progressAmount, uploader.progressTotal);
});
uploader.on('end', function() {
  console.log("done uploading");
});
*/
						console.log('ye b kam kr ra hai or fname hai : ' + fname);
						req.on('response', function(res){
							if(res.statusCode == 200){
								// This means that the file is in the S3 Bucket !
								var newImage = new singleImageModel({
									filename:fname,
									votes:0
								}).save();

								Socket.emit('status', {'msg':'Saved !!', 'delay':3000});
								Socket.emit('doUpdate', {});

								// Delete the Local File
								fs.unlink(nfile, function(){
									console.log('Local File Deleted !');
								})

							}
						})

						req.end(buf);
					})
				})
			})
		})
})

router.get('/getimages', function(req, res, next){
	singleImageModel.find({}, null, {sort:{votes:-1}}, function(err, result){ // empty brackets to record all the records
		res.send(JSON.stringify(result));
	})
})

router.get('/voteup/:id', function(req, res, next){
	singleImageModel.findByIdAndUpdate(req.params.id, {$inc:{votes:1}}, function(err, result){
		res.send(200, {votes:result.votes});
	})
})


app.use('/', router);
}