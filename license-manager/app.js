'use strict';
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();

var hfc = require('fabric-client');
var host = 'localhost';
var port = 33000;
module.exports = app;

var enrollAdmin = require('./enrollAdmin.js');
var registerUser = require('./registerUser.js');
var queryToken = require('./query.js');
var fetchHistory = require('./fetchHistory.js');
var requestToken = require('./RequestToken');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var server = http.createServer(app).listen(port, function() {});
console.log('****************** SERVER STARTED ************************');
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

//REST APIs
app.get("/", function(req,res) {
	res.send("Gopalji");
});

app.get("/enrollAdmin", function(req,res) {
	enrollAdmin.enrollTheAdmin();
	res.send("Admin enrolled");
});

app.get("/registerUser/:userName", function(req,res) {
	var userName = req.params.userName;

	registerUser.registerTheUser( userName,function(result){
		console.log(result);
		if(result == 'true')
			res.send("User " + userName + " Registered");
		else
			res.send("user registration failed");
	});
});


app.get("/requestToken/:userName", function(req,res) {
	var userName = req.params.userName;

	requestToken.requestTheToken(userName, function(result) {
		if(result == 'false')
			res.send("Unable to fetch token for user " + userName);
		else {
			queryToken.queryLedger(userName, function(result) {
				var resultJson = JSON.parse(result);
				var count = Object.keys(resultJson).length;
				var licenseObtained = "";
				for(var i=0;i< count; i++){
					var owner =resultJson[i].Record.owner;
					if(owner == userName){
						licenseObtained= resultJson[i].Record.licenseKey;
						break;
					}
				}
				if(licenseObtained == "")
					res.send("Unable to fetch license for user "+ userName);
				else
				res.send("Received token for user " + userName + ": " + licenseObtained);
			});
			
		}
			
	});
});


app.get("/fetchHistory/:userName", function(req,res) {
	var userName = req.params.userName;
	fetchHistory.fetchTheHistory(userName, function(result) {
		res.send("History \n" +JSON.stringify(result));
	});

});

	
app.get("/queryToken/:userName", function(req,res) {
	var userName = req.params.userName;
	queryToken.queryLedger(userName, function(result) {
		res.send("Received token for user " + userName + ": " + JSON.stringify(result));
		
	});

});

function callRegisterUser(userName, callback){
	callback(registerUser.registerTheUser( userName));
}
