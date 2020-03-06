var express = require('express');
var path = require('path');
var session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios'); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const variablesModule = require('./variables');

require('dotenv').config();
//SLACK tokens
const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

//StatusCast Login
const STATUSCAST_USERNAME = process.env.STATUSCAST_USERNAME;
const STATUSCAST_PASSWORD = process.env.STATUSCAST_PASSWORD;

const JIRA = process.env.JIRA_ID;
const JENKINS = process.env.JENKINS_ID;
const CONFLUENCE = process.env.CONFLUENCE_ID;
const BITBUCKET = process.env.BITBUCKET_ID;
const SONARQUBE = process.env.SONARQUBE_ID;
const WHITESOURCE = process.env.WHITESOURCE_ID;
const ARTIFACTORY = process.env.ARTIFACTORY_ID;
const APPLICATION2 = process.env.APPLICATION2_ID;

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

function getAccessToken() {
	const data = "grant_type=password&username="+STATUSCAST_USERNAME+"&password="+STATUSCAST_PASSWORD;
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "https://igm-sandbox.statuscast.com/api/v1/token",  true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(data);

	xhr.onload = function() {
		var res = JSON.parse(this.responseText);
		var access_token = (JSON.stringify(res.access_token)).replace(/['"]+/g, '');
		return access_token;
	}
}

//collects all incident information from modal when user submits
app.post('/slack/actions', async(request, response) => {
	var body = request.body.payload;
	var payload = JSON.parse(body);
	var type = (JSON.stringify(payload.type)).replace(/['"]+/g, '');
	if(type == "view_submission") {
		// get values from modal
		  var val = payload.view.state.values;
		  var subject_val = (JSON.stringify(val.incident_title.incident_title_value.value)).replace(/['"]+/g, '');
		  var type_val = (JSON.stringify(val.incident_type.clicked_incident_type.selected_option.text.text)).replace(/['"]+/g, '');
		  var message_val = (JSON.stringify(val.incident_message.incident_message_value.value)).replace(/['"]+/g, '');
		  var option = val.incident_components.incident_components_value.selected_options;
		  
		  //gets all affected components
		  var components = [];
		  for(var i = 0; i < option.length; ++i) {
			var component = (JSON.stringify(option[i].text.text)).replace(/['"]+/g, '');
			if (component === "Jira") {
				components.push(JIRA);
			} else if (component === "Jenkins") {
				components.push(JENKINS);
			} else if (component === "Confluence") {
				components.push(CONFLUENCE);
			} else if (component === "BitBucket") {
				components.push(BITBUCKET);
			} else if (component === "Sonarqube") {
				components.push(SONARQUBE);
			} else if (component === "Whitesource") {
				components.push(WHITESOURCE);
			} else if (component === "Artifactory") {
				components.push(ARTIFACTORY);
			} else {
				components.push(APPLICATION2);
			}
		  }

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

		var access_token = getAccessToken();
		var body = variablesModule.getBody(curr_date, incident_type, subject_val, message_val, treat_downtime, components, components.length);		

	/*
			var xhr_send = new XMLHttpRequest();
			xhr_send.open("POST", "https://igm-sandbox.statuscast.com/api/v1/incidents/create", true);
			xhr_send.setRequestHeader('Content-Type', 'application/json');
			xhr_send.setRequestHeader('Authorization', 'Bearer ' + access_token);
			xhr_send.send(body);
		*/
			//xhr_send.onload = function() {
				var output_test = {
					"response_action": "errors",
					"errors": {
					"incident_title": access_token,
					"incident_message": body
					}
				};
				response.send(output_test);	
			//}
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
