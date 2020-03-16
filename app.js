var express = require('express');
var path = require('path');
var session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios'); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const variablesModule = require('./variables');

require('dotenv').config();

//Slack tokens
const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

//StatusCast Login
const STATUSCAST_USERNAME = process.env.STATUSCAST_USERNAME;
const STATUSCAST_PASSWORD = process.env.STATUSCAST_PASSWORD;

var access_token;
var channel_ID = "CURG4CVHS";
var bot_ID;
var color;

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function post_to_slack(url, args) {
	const headers = {
		headers: {
			"Content-type": "application/json; charset=utf-8",
			"Authorization": "Bearer " + SLACK_BOT_TOKEN
		}
	};
	axios.post(url, args, headers)
		.then(res => {
			response.end();
		}).catch(error => {
			response.sendStatus(404);
		});
}

//retrieves access token given credentials
function getAccessToken() {

	const data = "grant_type=password&username="+STATUSCAST_USERNAME+"&password="+STATUSCAST_PASSWORD;
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "https://igm-sandbox.statuscast.com/api/v1/token",  true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(data);

	xhr.onload = function() {
		var res = JSON.parse(this.responseText);
		access_token = (JSON.stringify(res.access_token)).replace(/['"]+/g, ''); 
	}
}

//sends a success message with incident id
function sendSuccess(id, date, title, components, in_message, type_val) {
	var json_bot_message = [{
		"mrkdwn_in":["text"],
		"color": color,
		"pretext": "You have created a new *" + type_val + "* incident *ID: " + id + "* from Slack:",
		"title": "See Details",
		"title_link": "https://igm-devops.slack.com/archives/CURG4CVHS"
	}];
	
	var message = variablesModule.getSuccess(color, id, date, title, components, in_message, type_val);
	var bot_message = JSON.stringify(json_bot_message);
	const args1 = {
		channel: bot_ID,
		attachments: message //bot_message
	};
	const args2 = {
		channel: channel_ID,
		attachments: message
	};
	post_to_slack('https://slack.com/api/chat.postMessage', args1);
	//post_to_slack('https://slack.com/api/chat.postMessage', args2);
}

function updateIncident(id, incident_type, trigger_id) {
	if(incident_type === "Informational") {
		var modal = variablesModule.getUpdateModal();
	} else {
		var modal = variablesModule.getUpdateModal();
	}

	const args = {
		token: SLACK_TOKEN,
		trigger_id: trigger_id,
		view: JSON.stringify(modal)
	};
	const headers = {
		headers: {
			"Content-type": "application/json; charset=utf-8",
			"Authorization": "Bearer " + SLACK_BOT_TOKEN
		}
	};
	axios.post('https://slack.com/api/views.open', args, headers);
}

//creates a modal for users to input incident information
app.post('/create-incident', function(request, response) {

	var token = request.body.token;
	if(token === SLACK_TOKEN) {
		const trigger_id = request.body.trigger_id;
		//modal format from variables file
		var modal = variablesModule.getModal();
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

	//gets type of action
	var body = request.body.payload;
	var payload = JSON.parse(body);
	var type = (JSON.stringify(payload.type)).replace(/['"]+/g, '');
	bot_ID = (JSON.stringify(payload.user.id)).replace(/['"]+/g, '');

	//if user submits an incident
	if(type === "view_submission") {

		// get values from modal
		  var val = payload.view.state.values;
		  var subject_val = (JSON.stringify(val.incident_title.incident_title_value.value)).replace(/['"]+/g, '');
		  var type_val = (JSON.stringify(val.incident_type.clicked_incident_type.selected_option.text.text)).replace(/['"]+/g, '');
		  var message_val = (JSON.stringify(val.incident_message.incident_message_value.value)).replace(/['"]+/g, '');
		  var option = val.incident_components.incident_components_value.selected_options;
		  
		  //gets all affected components
		  var str_components = (variablesModule.getComponents(option))[0];
		  var components = (variablesModule.getComponents(option))[1];

		//gets today's date
		var curr_date = new Date().toISOString();
		var hour = new Date().getHours() - 4;
		hour = ("0" + hour).slice(-2);
		var minute = new Date().getMinutes();
		minute = ("0" + minute).slice(-2);
		var str_date = curr_date.split('T')[0];
		str_date += " " + hour + ":" + minute;
		  
		//get incident type, color and set if downtime
		var incident_type = 5;
		var treat_downtime = true;

		if(type_val === "Informational" ) {
		  treat_downtime = false;
		  color = "#36a64f";// green
		} else if (type_val === "Performance" ) {
		  incident_type = 2;
		  color = "#ffae42";// yellow
		} else {
		  incident_type = 4;
		  color = "#FF0000";// red
		}
		
		//retrieves the access token
		var promise = new Promise(function(resolve, reject) {
			getAccessToken();
			setTimeout(() => resolve("done"), 1000);
		});

		promise.then(function(result) {
			
			if(result === "done") {

				//sets values from modal to create incident
				var pre_body = "dateToPost="+curr_date+"&incidentType="+JSON.stringify(incident_type)+"&messageSubject="+subject_val+"&messageText="+message_val+"&comScheduledMaintNightOfPosting=false&comScheduledMaintDaysBefore=2&comScheduledMaintHoursBefore=4&allowDisqus=false&active=true&happeningNow=true&treatAsDownTime="+treat_downtime+"&estimatedDuration=10&sendNotifications=true";
				var body = variablesModule.getBody(pre_body, components);	

				//create http request to create incident
				var xhr_send = new XMLHttpRequest();
				xhr_send.open("POST", "https://igm-sandbox.statuscast.com/api/v1/incidents/create", true);
				xhr_send.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xhr_send.setRequestHeader('Authorization', 'Bearer ' + access_token);
				xhr_send.send(body);
				xhr_send.onload = function() {

					//retrieves incident id
					var res = JSON.parse(this.responseText);
					var id = JSON.stringify(res.id);

					//sends a success message with incident id
					sendSuccess(id, str_date, subject_val, str_components, message_val, type_val);
					
					//closes modal
					var stop = {
						"response_action": "clear"
					  };
					response.send(stop);

				}
			}
		});
	} else if (type === "interactive_message") {
		var id = payload.original_message.attachments[0].fields[0].value;
		var incident_type = payload.original_message.attachments[0].fields[4].value;
		var trigger_id = payload.trigger_id;
		updateIncident(id, incident_type, trigger_id);
		response.end();
		//response.send(trigger_id);
	} else {
		response.sendStatus(200);
	}
		
});


app.get('/', function(request, response) {
    response.render('login');
});

module.exports = app;