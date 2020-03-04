var express = require('express');
var path = require('path');
var session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios'); 

require('dotenv').config();

const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;


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

var incident_type = "type_informational";

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
						"text": "*Incident Type*"
					},
					"accessory": {
						"action_id": "clicked_incident_type",
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

	  /*
	  var val_str = JSON.stringify(payload.view.state.values);
	  var val = payload.view.state.values;
	  var title_val = JSON.stringify(val.incident_title.incident_title_value.value);
	  var message_val = JSON.stringify(val.incident_message.incident_message_value.value);
	  var option = val.incident_components.incident_components_value.selected_options;
	  var components = [];
	  for(var i = 0; i < option.length; ++i) {
		  components[i] = JSON.stringify(option[i].value);
	  }

	  var output = "This is the incident title: " + title_val + "\nThis is the incident message: " + message_val;
	 
	  output += "\nThis is the incident components: ";
	  for(var i = 0; i < components.length; ++i) {
		  output += " " + components[i];
	  }
	  
	  */
	var section = {
		"response_action": "errors",
		"errors": {
		  "incident_title": JSON.stringify(request.body)
		}
	  };

	  if(type == "\"interactive_message\"") {
		response.send(stop);
	  } else {
		response.send(section);
	  }

	/*

	if(type == "\"view_submission\"") {
		response.send(section);
	} else {
		response.send(section);
	}
	*/


});


app.get('/', function(request, response) {
    response.render('login');
});

module.exports = app;
