var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
const bodyParser = require('body-parser');
var incident_name = "";
const axios = require('axios'); 
const qs = require('qs');
const apiUrl = 'https://slack.com/api';

require('dotenv').config();

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
		incident_name = request.body.text;
		//var text = "Incident Requested: " + incident_name
		var res = {
			"blocks": [
				{
					"type": "section",
					"fields": [
						{
							"type": "plain_text",
							"text": "Incident Requested: ",
							"emoji": true
						}
					]
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
							"value": "create_incident",
							"action_id": "create_incident"
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

app.post('/slack/actions', async(request, response) => {
  
	const { token, trigger_id, user, actions, type } = JSON.parse(request.body.payload);
  
	if(actions && actions[0].action_id.match(/create_incident/)) {
		var modal = {
			"type": "modal",
			"title": {
				"type": "plain_text",
				"text": "Create an Incident",
				"emoji": true
			},
			"submit": {
				"type": "plain_text",
				"text": "Submit",
				"emoji": true
			},
			"close": {
				"type": "plain_text",
				"text": "Cancel",
				"emoji": true
			},
			"blocks": [
				{
					"type": "section",
					"text": {
						"type": "mrkdwn",
						"text": "Please fill in the fields to create a StatusCast incident"
					}
				},
				{
					"type": "divider"
				},
				{
					"type": "input",
					"element": {
						"type": "plain_text_input"
					},
					"label": {
						"type": "plain_text",
						"text": "Incident Title",
						"emoji": true
					}
				},
				{
					"type": "input",
					"element": {
						"type": "plain_text_input",
						"placeholder": {
							"type": "plain_text",
							"text": "placeholder"
						  },
						"multiline": true
					},
					"label": {
						"type": "plain_text",
						"text": "Incident message",
						"emoji": true
					}
				},
				{
					"type": "input",
					"element": {
						"type": "checkboxes",
						"options": [
							{
								"text": {
									"type": "plain_text",
									"text": "Jira",
									"emoji": true
								},
								"value": "jira"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Jenkins",
									"emoji": true
								},
								"value": "jenkins"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Confluence",
									"emoji": true
								},
								"value": "confluence"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "BitBucket",
									"emoji": true
								},
								"value": "bitbucket"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Sonarqube",
									"emoji": true
								},
								"value": "sonarqube"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Whitesource",
									"emoji": true
								},
								"value": "whitesource"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Artifactory",
									"emoji": true
								},
								"value": "artifactory"
							}
						]
					},
					"label": {
						"type": "plain_text",
						"text": "Select all affected components",
						"emoji": true
					}
				}
			]
		};

		const args = {
			token: token,
			trigger_id: trigger_id,
			view: JSON.stringify(modal)
		};
		const headers = {
			headers: {
				"Content-type": "application/json; charset=utf-8",
    			"Authorization": "Bearer " + token
			}
		};
		
		axios.post(`${apiUrl}/views.open`, args, headers).then(res => {
			const data = res.data;
			if (!data.ok) {
				return data.error;
			  }
		}).catch(error => {
			console.log("Error: ", error);
		});
	}
});
/*
 const viewData = payloads.openModal({
    trigger_id: payload.trigger_id,
    user_id: payload.message.user,
    text: payload.message.text
  })
const callAPIMethod = async (method, payload) => {
    let result = await axios.post(`${apiUrl}/views.open`, payload, {
        headers: { Authorization: "Bearer " + process.env.SLACK_ACCESS_TOKEN }
    });
    return result.data;
}
*/
//login/main page
app.get('/', function(request, response) {
    response.render('login');
});


module.exports = app;

