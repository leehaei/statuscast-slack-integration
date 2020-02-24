var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const bodyParser = require('body-parser');
//const axios = require('axios'); 
//const qs = require('qs');

//const appHome = require('./appHome');
//const message = require('./message');


//const apiUrl = 'https://slack.com/api';

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

/*
//Event Subscriptions
app.post('/slack/events', async(request, response) => {
	switch (req.body.type) {
		case 'url_verification': {
			response.send({ challenge: request.body.challenge });
			break;
		}
		case 'event_callback': {
			const { type, user, channel, tab, text, subtype } = JSON.parse(req.body.event);
			if (type === 'app_home_opened') {
				appHome.displayHome(user);
			}
			break;
		}
		default: { response.sendStatus(404); }
	}
});

app.post('/slack/actions', async(req, res) => {
  
	const { token, trigger_id, user, actions, type } = JSON.parse(req.body.payload);
  
	// Button with "add_" action_id clicked --
	if(actions && actions[0].action_id.match(/add_/)) {
	  appHome.openModal(trigger_id);
	}
});
*/
//slash command
app.post('/create-incident', function(request, response) {
	console.log(request.body);
	var token = request.body.token;
	console.log(token);
	if(token == SLACK_TOKEN) {
		console.log("verified!");
		var text = request.body.text;
		var res = {
			"blocks": [
				{
					"type": "section",
					"text": {
						"type": "mrkdwn",
						"text": "*Here's what you can do with StatusCast:*"
					}
				},
				{
					"type": "actions",
					"elements": [
						{
							"type": "button",
							"text": {
								"type": "plain_text",
								"text": "Create An Incident",
								"emoji": true
							},
							"value": "create_incident"
						}
					]
				},
				{
					"type": "context",
					"elements": [
						{
							"type": "image",
							"image_url": "https://api.slack.com/img/blocks/bkb_template_images/placeholder.png",
							"alt_text": "placeholder"
						}
					]
				}
			]
		};
		response.send(res);

	} else {
		response.end("Unable to Verify");
		response.sendStatus(200);
	}
	
});

//login/main page
app.get('/', function(request, response) {
    response.render('login');
});


module.exports = app;

