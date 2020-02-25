var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const bodyParser = require('body-parser');
var incident_name = "";
const axios = require('axios'); 
//import { WebClient } from '@slack/web-api';
require('dotenv').config();

const { createMessageAdapter } = require('@slack/interactive-messages');
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackInteractions = createMessageAdapter(slackSigningSecret);

const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

//const web = new WebClient(SLACK_BOT_TOKEN);

var app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/*
const port = process.env.PORT || 3000;

(async () => {
  const server = await slackInteractions.start(port);
  console.log(`Listening for events on ${server.address().port}`);
})();
*/

app.post('/slack/events', async(request, response) => {
	switch (req.body.type) {
		case 'url_verification': {
			response.send({ challenge: request.body.challenge });
			break;
		}
		default: { response.sendStatus(404); }
	}
});

app.post('/create-incident', function(request, response) {
	var token = request.body.token;
	if(token === SLACK_TOKEN) {
		console.log("verified!");

		incident_name = request.body.text;
		const trigger_id = request.body.trigger_id;
		
		var modal = {
			"type": "modal",
			"callback_id": "incident_view",
			"title": {
				"type": "plain_text",
				"text": "Create an Incident",
				"emoji": true
			},
			"blocks": [
				{
					"type": "section",
					"text": {
						"type": "mrkdwn",
						"text": "Please fill in the fields to create a StatusCast incident"
					}
				}
			],
			"submit": {
				"type": "plain_text",
				"text": "Submit"
			}
		};
		const args = {
			token: SLACK_BOT_TOKEN,
			trigger_id: trigger_id,
			view: JSON.stringify(modal)
		};
		response.send(modal);
		/*
		console.log("Trigger_ID" + trigger_id);
		const headers = {
			headers: {
				"Content-type": "application/json; charset=utf-8",
    			"Authorization": "Bearer " + SLACK_BOT_TOKEN
			}
		};
		
		axios.post('https://slack.com/api/views.open', args)
		.then(res => {
			console.log(res);
		}).catch(error => {
			console.log("Error: ", error);
		});
		*/

	} else {
		response.end("Unable to Verify");
		response.sendStatus(200);
	}
	
});

/*
app.post('/slack/actions', async(request, response) => {
  
	const { token, trigger_id, user, actions, type } = JSON.parse(request.payload);
  
	if(actions && actions[0].action_id.match("create_incident")) {
		var modal = {
			"type": "modal",
			"callback_id": "incident_view",
			"title": {
				"type": "plain_text",
				"text": "Create an Incident",
				"emoji": true
			},
			"blocks": [
				{
					"type": "section",
					"text": {
						"type": "mrkdwn",
						"text": "Please fill in the fields to create a StatusCast incident"
					}
				}
			],
			submit: {
				type: 'plain_text',
				text: 'Submit'
			}
		};

		const args = {
			token: SLACK_BOT_TOKEN,
			trigger_id: trigger_id,
			view: modal
		};
		console.log("Trigger_ID" + trigger_id);
		const headers = {
			headers: {
				"Content-type": "application/json; charset=utf-8",
    			"Authorization": "Bearer " + SLACK_BOT_TOKEN
			}
		};
		
		axios.post('https://slack.com/api/views.open', args).then(res => {
			const data = res.data;
			if (!data.ok) {
				return data.error;
			  }
		}).catch(error => {
			console.log("Error: ", error);
		});
	}
});
*/
//login/main page
app.get('/', function(request, response) {
    response.render('login');
});


module.exports = app;

