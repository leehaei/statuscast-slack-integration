var express = require('express');
var path = require('path');
var session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios'); 

require('dotenv').config();
//SLACK tokens
const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

//StatusCast Login
const STATUSCAST_USERNAME = process.env.STATUSCAST_USERNAME;
const STATUSCAST_PASSWORD = process.env.STATUSCAST_PASSWORD;


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



//creates a modal for users to input incident information
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
					"type": "input", 
					"block_id": "incident_type", 
					"label": { 
					  "type": "plain_text", 
					  "text": "Incident Type" 
					}, 
					"element": { 
					  "type": "static_select", 
					  "action_id": "clicked_incident_type", 
					  "placeholder": { 
						"type": "plain_text", 
						"text": "Select something" 
					  }, 
					  "options": [ { 
						"text": { 
						  "type": "plain_text", 
						  "text": "Informational"
						},
						"value": "type_informational" 
					  }, { 
						"text": { 
						  "type": "plain_text", 
						  "text": "Performance" 
						}, 
						"value": "type_performance"
					  }, { 
						"text": { 
						  "type": "plain_text", 
						  "text": "Service Unavailable" 
						}, 
						"value": "type_service_unavailable"
					  }
					]}
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
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Application 2",
									"emoji": true
								},
								"value": "application2"
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



//collects all incident information from modal when user submits
app.post('/slack/actions', async(request, response) => {

	var stop = {
		"response_action": "clear"
	  };

	  var body = request.body.payload;
	  var payload = JSON.parse(body);
	  var type = JSON.stringify(payload.type);

	  var val = payload.view.state.values;
	  var subject_val = (JSON.stringify(val.incident_title.incident_title_value.value)).replace(/['"]+/g, '');
	  var type_val = (JSON.stringify(val.incident_type.clicked_incident_type.selected_option.text.text)).replace(/['"]+/g, '');
	  var message_val = (JSON.stringify(val.incident_message.incident_message_value.value)).replace(/['"]+/g, '');
	  var option = val.incident_components.incident_components_value.selected_options;
	  
	  //gets all affected components
	  var components = [];
	  for(var i = 0; i < option.length; ++i) {
		  components[i] = (JSON.stringify(option[i].text.text)).replace(/['"]+/g, '');
	  }

	  //outputs all information in an error section
	  var input = "This is the incident title: " + subject_val + "\nThis is the incident message: " + message_val;
	  input += "\nThis is the incident components: ";
	  for(var i = 0; i < components.length; ++i) {
		input += " " + components[i];
	  }
	var input_test = {
		"response_action": "errors",
		"errors": {
		  "incident_title": subject_val,
		  "incident_type": type_val,
		  "incident_message": message_val,
			"incident_components": components[0] + " " + components[1] + " " + components[2] + " " + components[3]
		}
	  };



	  //gets today's date
	  var curr_date = new Date().toISOString();

	  //get incident type and set if downtime
	  var incident_type = 5;
	  var treat_downtime = true;
	  if(type_val === "Informational" ) {
		treat_downtime = false;
	  } else if (type_val === "Performance" ) {
		incident_type = 2;
	  } else {
		incident_type = 4;
	  }

	

	/*
	var options = {
	method: 'POST',
	url: 'https://sample.statuscast.com/api/v1/incidents/create',
	headers: {accept: 'application/json', 'content-type': 'application/json'}
	};

	request(options, function (error, response, body) {
	if (error) throw new Error(error);

	console.log(body);
	});
	  
	  var body = {
		dateToPost: curr_date,				
		incidentType: incident_type,
		messageSubject: subject_val,
		messageText: message_val,
		comScheduledMaintNightOfPosting: false,	
		comScheduledMaintDaysBefore: 2,								
		comScheduledMaintHoursBefore: 4,							
		allowDisqus: false,		
		active: true,					
		happeningNow: true,					
		treatAsDownTime: treat_downtime,	
		estimatedDuration: 10,
		sendNotifications: true,
		affectedComponents: components
	  };
	  */

	  var output = "Current Date: " + curr_date + " ";
	  output += "Incident Type: " + incident_type + " ";
	  output += "Subject Type: " + subject_val + " ";
	  output += "Message Text: " + message_val + " ";
	  output += "Treat As DownTime?: " + treat_downtime + " ";
	  output += "Affected Components: " + components[0] + " " + components[1] + " " + components[2];

	  var output_test = "";
	  const data = {
			grant_type: password,
			username: STATUSCAST_USERNAME,
			password: STATUSCAST_PASSWORD
	};

	const headers = {
		headers: {
			"Content-type": "application/json; charset=utf-8",
		}
	};

	if(type == "\"view_submission\"") {
		axios.post('https://igm-sandbox.statuscast.com/api/v1/token', data, headers)
		.then(res => {
			output_test = {
				"response_action": "errors",
				"errors": {
				  "incident_title": JSON.stringify(data)
				}
			  };
			  response.send(output_test);
		}).catch(error => {
			output_test = {
				"response_action": "errors",
				"errors": {
				  "incident_title": JSON.stringify(data)
				}
			  };
			  response.send(output_test);
		});
	} else {
		response.send(input_test);
	}


});


app.get('/', function(request, response) {
    response.render('login');
});

module.exports = app;



/*
https://status.statuscast.com/api/docs/#api-Incidents-Create
https://statuscast.readme.io/reference#incidents_createincident_params-form-post -- more recent

Incident Types:
{
  "2": "Performance",
  "3": "ScheduledMaintenance", ---dont have
  "4": "ServiceUnavailable",
  "5": "Informational",
  "6": "Normal"  ---dont have
}

Requst Example:
/v1/incidents
Authorization	Bearer [token]
var body = {
  dateToPost: "12/12/2014",					-- today's date	
  incidentType: 2,							-- type_val
  messageSubject: "new incident",			-- subject_val
  messageText: "new incident text",			-- message_val
  comScheduledMaintNightOfPosting: true,	-- false			-- indicates if scheduled event
  comScheduledMaintDaysBefore: 2,								-- how early notifications should be sent out if scheduled
  comScheduledMaintHoursBefore: 4,								-- same as above
  allowDisqus: true,						-- false			-- enable Disqus functionality
  active: true,								-- true				-- if incident is active
  happeningNow: true,						-- true				-- if incident is happening now
  treatAsDownTime: true,					-- true for 4		-- if incident should be considered downtime
  estimatedDuration: 10, // minutes								-- estimated duration
  sendNotifications: true,					-- true
  affectedComponents: [						-- components
    20609
  ]
}

var request = require("request");

var options = {
  method: 'POST',
  url: 'https://sample.statuscast.com/api/v1/incidents/create',
  headers: {accept: 'application/json', 'content-type': 'application/json'}
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
*/