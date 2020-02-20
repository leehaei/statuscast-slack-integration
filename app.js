var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser'); 
//const http = require(http);

require('dotenv').config();
const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const port = process.env.PORT;

var app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post('/slack/event', function(request, response) {
	//console.log(request.body.token);
	var type = request.body.type;
	if(type == 'url_verification') {
		console.log("verified!");
		var token = request.body.token;
		var challenge = {
			"challenge" : request.body.challenge
		}
		response.end(JSON.stringify(challenge));
	}
	//response.sendStatus(200);
});

//login/main page
app.get('/', function(request, response) {
    response.render('login');
});


module.exports = app;