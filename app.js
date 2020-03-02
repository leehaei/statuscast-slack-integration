var express = require('express');
var path = require('path');
var session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios'); 

require('dotenv').config();

const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const { createMessageAdapter } = require('@slack/interactive-messages');
//const {createEventAdapter, errorCodes} = require('@slack/events-api');//
const slackInteractions = createMessageAdapter(process.env.SLACK_SIGNING_SECRET);//

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
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

slackInteractions.action({ type: 'view_submission' }, async (event) => {
	var section = {
		"response_action": "clear"
	  };
	return section;
  });

  /*
slackInteractions.viewSubmission("incident_view", payload => {
	
	
	return Promise.resolve({
	   response_action: "errors",
	   errors: { "restaurant-name": "You may not select a due date in the past" }
	 });
   });
*/

app.post('/slack/events', async(request, response) => {
	switch (request.body.type) {
		case 'url_verification': {
			response.send({ challenge: request.body.challenge });
			break;
		}
		case 'view_submission': {
			
			response.sendStatus(200);
			if(request.body.callback_id === 'incident_view') {
				//response.sendStatus(200);
			}
		}
		default: { response.sendStatus(404); }
	}
});
app.post('/create-incident', function(request, response) {
	var token = request.body.token;
	if(token === SLACK_TOKEN) {
		const trigger_id = request.body.trigger_id;

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
					"block_id": "incident",
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
					"block_id": "incident_title",
					"element": {
						"type": "plain_text_input",
						"action_id": "incident_title_value"
					},
					"label": {
						"type": "plain_text",
						"text": "Incident Title",
						"emoji": true
					}
				},
				{
					"type": "section",
					"block_id": "incident_type",
					"text": {
						"type": "mrkdwn",
						"text": "Incident Type"
					},
					"accessory": {
						"type": "static_select",
						"placeholder": {
							"type": "plain_text",
							"text": "Informational",
							"emoji": true
						},
						"options": [
							{
								"text": {
									"type": "plain_text",
									"text": "Informational",
									"emoji": true
								},
								"value": "type_informational"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Performance",
									"emoji": true
								},
								"value": "type_performance"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Service Unavailable",
									"emoji": true
								},
								"value": "type_service_unavailable"
							}
						]
					}
				},
				{
					"type": "input",
					"block_id": "incident_message",
					"element": {
						"type": "plain_text_input",
						"action_id": "incident_message_value",
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
					"block_id": "incident_components",
					"element": {
						"type": "checkboxes",
						"action_id": "incident_components_value",
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
    			"Authorization": "Bearer " + SLACK_BOT_TOKEN
			}
		};

		axios.post('https://slack.com/api/views.open', args, headers)
		.then(res => {
			response.end();
		}).catch(error => {
			response.sendStatus(404);
		});

	} else {
		response.end("Unable to Verify");
		response.sendStatus(200);
	}

});

app.post('/slack/actions', async(request, response) => {
	var stop = {
		"response_action": "clear"
	  };

	  var body = request.body.payload;
	  var payload = JSON.parse(body);
	  var type = JSON.stringify(payload.type);

	  var val_str = JSON.stringify(payload.view.state.values);
	  var val = payload.view.state.values;
	  var title_val = JSON.stringify(val.incident_title.incident_title_value.value);
	  var message_val = JSON.stringify(val.incident_message.incident_message_value.value);
	  var option = val.incident_components.incident_components_value.selected_options;
	  var components =[];
	  for(var i = 0; i < option.length; ++i) {
		  components[i] = option[i];
	  }
	  
	var section = {
		"response_action": "errors",
		"errors": {
		  "incident_title": title_val,
		  "incident_message": message_val,
		  "incident_components": JSON.stringify(components[0])
		}
	  };
	
	  /*
	var requester = payload.user;
	var requester_id = JSON.stringify(requester.id);
	var requester_username = JSON.stringify(requester.username);
	var requester_name = JSON.stringify(requester.name);
	var requester_team = JSON.stringify(requester.team_id);
*/

	if(type == "\"view_submission\"") {
		response.send(section);
	} else {
		response.send(section);
	}

});


app.get('/', function(request, response) {
    response.render('login');
});

module.exports = app;
