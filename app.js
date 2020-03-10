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

//StatusCast Component IDs
const JIRA = process.env.JIRA_ID;
const JENKINS = process.env.JENKINS_ID;
const CONFLUENCE = process.env.CONFLUENCE_ID;
const BITBUCKET = process.env.BITBUCKET_ID;
const SONARQUBE = process.env.SONARQUBE_ID;
const WHITESOURCE = process.env.WHITESOURCE_ID;
const ARTIFACTORY = process.env.ARTIFACTORY_ID;
const APPLICATION2 = process.env.APPLICATION2_ID;
var access_token;
var channel_ID = "CURG4CVHS";

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
function sendSuccess(raw_id, raw_date, raw_title, raw_components) {

	var message, id, date, title, components;
	var promise = new Promise(function(resolve, reject) {
		//sets variables for modal
        id = "*ID:*\n" + raw_id;
	    date = "*When:*\n" + raw_date;
	    title = "*Title:*\n" + raw_title;
	    var lst_components = raw_components[0];
        for(var i = 1; i < raw_components.length; ++i) {
            lst_components += ", " + raw_components[i];
        }
        components = "*Components:*\n" + lst_components;
		setTimeout(() => resolve("done"), 1000);
	});

	promise.then(function(result) {
		if(result === "done") {
			message = "[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"You have created a new incident at *<https:\/\/igm-sandbox.statuscast.com\/|status.igm.tools>*\"}},{\"type\":\"section\",\"fields\":[{\"type\":\"mrkdwn\",\"text\":\"" + id + "\"},{\"type\":\"mrkdwn\",\"text\":\"" + date + "\"},{\"type\":\"mrkdwn\",\"text\":\"" + title + "\"},{\"type\":\"mrkdwn\",\"text\":\"" + components + "\"}]}]";
			const args = {
				channel: channel_ID,
				text: "test",
				blocks: message
			};

			const headers = {
				headers: {
					"Content-type": "application/json; charset=utf-8",
					"Authorization": "Bearer " + SLACK_BOT_TOKEN
				}
			};

			axios.post('https://slack.com/api/chat.postMessage', args, headers)
			.then(res => {
				response.end();
			}).catch(error => {
				response.sendStatus(404);
			});
		}
	})

}

//collects all incident information from modal when user submits
app.post('/slack/actions', async(request, response) => {

	//gets type of action
	var body = request.body.payload;
	var payload = JSON.parse(body);
	var type = (JSON.stringify(payload.type)).replace(/['"]+/g, '');

	//if user submits an incident
	if(type == "view_submission") {

		// get values from modal
		  var val = payload.view.state.values;
		  var subject_val = (JSON.stringify(val.incident_title.incident_title_value.value)).replace(/['"]+/g, '');
		  var type_val = (JSON.stringify(val.incident_type.clicked_incident_type.selected_option.text.text)).replace(/['"]+/g, '');
		  var message_val = (JSON.stringify(val.incident_message.incident_message_value.value)).replace(/['"]+/g, '');
		  var option = val.incident_components.incident_components_value.selected_options;
		  
		  //gets all affected components
		  var str_components = [];
		  var components = [];
		  for(var i = 0; i < option.length; ++i) {
			var component = (JSON.stringify(option[i].text.text)).replace(/['"]+/g, '');
			if (component === "Jira") {
				components.push(JIRA);
				str_components.push("Jira");
			} else if (component === "Jenkins") {
				components.push(JENKINS);
				str_components.push("Jenkins");
			} else if (component === "Confluence") {
				components.push(CONFLUENCE);
				str_components.push("Confluence");
			} else if (component === "BitBucket") {
				components.push(BITBUCKET);
				str_components.push("BitBucket");
			} else if (component === "Sonarqube") {
				components.push(SONARQUBE);
				str_components.push("Sonarqube");
			} else if (component === "Whitesource") {
				components.push(WHITESOURCE);
				str_components.push("Whitesource");
			} else if (component === "Artifactory") {
				components.push(ARTIFACTORY);
				str_components.push("Artifactory");
			} else {
				components.push(APPLICATION2);
				str_components.push("Application 2");
			}
		  }

		//gets today's date
		var curr_date = new Date().toISOString();
		var str_date = ((curr_date.substring(0,16)).replace(/T/g,' ')).replace(/Z/g,' ');

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
					
					//closes modal
					
					var stop = {
						"response_action": "clear"
					  };
					response.send(stop);
					
					//sends a success message with incident id
					sendSuccess(id, str_date, subject_val, str_components);
					/*
						var output_test = {
							"response_action": "errors",
							"errors": {
							"incident_title": message
							}
						};
						response.send(output_test);
					*/
				}
			}
		});

	} else {

		var stop = {
			"response_action": "clear"
		  };
		response.send(stop);
	}
		
		
});


app.get('/', function(request, response) {
    response.render('login');
});

module.exports = app;