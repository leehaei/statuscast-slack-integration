var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser'); 

require('dotenv').config();
//const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
//const port = process.env.PORT;
const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

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

//Event Subscriptions
app.post('/slack/events', function(request, response) {
	//console.log(request.body.token);
	var type = request.body.type;
	if(type == 'url_verification') {
		console.log("verified!");
		var challenge = {
			"challenge" : request.body.challenge
		}
		response.end(JSON.stringify(challenge));
	}
	//response.sendStatus(200);
});

//slash command
app.post('/create-incident', function(request, response) {
	console.log(request.body);
	var token = request.body.token;
	console.log(token);
	if(token == SLACK_TOKEN) {
		console.log("verified!");
		var text = request.body.text;
		var res = [
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "Created incident "
				}
			},
			{
				"type": "section",
				"text": {
					"type": "mrkdwn",
					"text": "Pick one or more components from the list"
				},
				"accessory": {
					"type": "multi_static_select",
					"placeholder": {
						"type": "plain_text",
						"text": "Select items",
						"emoji": true
					},
					"options": [
						{
							"text": {
								"type": "plain_text",
								"text": "Choice 1",
								"emoji": true
							},
							"value": "value-0"
						},
						{
							"text": {
								"type": "plain_text",
								"text": "Choice 2",
								"emoji": true
							},
							"value": "value-1"
						},
						{
							"text": {
								"type": "plain_text",
								"text": "Choice 3",
								"emoji": true
							},
							"value": "value-2"
						}
					]
				}
			}
		]
		response.end(JSON.stringify(res));

	} else {
		response.end("Unable to Verify");
	}
	response.sendStatus(200);
});

//login/main page
app.get('/', function(request, response) {
    response.render('login');
});


module.exports = app;

