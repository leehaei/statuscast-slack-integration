require('dotenv').config();

//StatusCast Component IDs
const JIRA = process.env.JIRA_ID;
const JENKINS = process.env.JENKINS_ID;
const CONFLUENCE = process.env.CONFLUENCE_ID;
const BITBUCKET = process.env.BITBUCKET_ID;
const SONARQUBE = process.env.SONARQUBE_ID;
const WHITESOURCE = process.env.WHITESOURCE_ID;
const ARTIFACTORY = process.env.ARTIFACTORY_ID;
const APPLICATION2 = process.env.APPLICATION2_ID;

module.exports = {
    getBody: function(body, components) {
        for(var i = 0; i < components.length; ++i) {
            body+="&affectedComponents="+components[i];
        }
        return body;
	},
	getSuccess: function(color, id, date, title, components, in_message, type_val) {
		var message = "[{\"callback_id\": \"incident_message\",\"mrkdwn_in\":[\"text\"],\"color\":\"" + color +"\",\"pretext\":\"<https:\/\/igm-sandbox.statuscast.com\/|status.igm.tools> - New incident created from Slack:\",\"fields\":[{\"title\":\"*ID:*\",\"value\":\"" + id + "\",\"short\":true},{\"title\":\"*Title:*\",\"value\":\"" + title + "\",\"short\":true},{\"title\":\"*When:*\",\"value\":\"" + date + "\",\"short\":true},{\"title\":\"*Components:*\",\"value\":\"" + components + "\",\"short\":true},{\"title\":\"*Type*\",\"value\":\"" + type_val + "\",\"short\":true},{\"title\":\"*Message:*\",\"value\":\"" + in_message + "\",\"short\":true}],\"actions\": [{\"name\": \"update\",\"text\": \"Update\",\"type\": \"button\",\"value\": \"update\"},{\"name\": \"delete\",\"text\": \"Delete\",\"style\": \"danger\",\"type\": \"button\",\"value\": \"delete\",\"confirm\": {\"title\": \"Delete Incident\",\"text\": \"Are you sure you want to delete this incident?\",\"ok_text\": \"Yes\",\"dismiss_text\": \"No\"}}]}]";
		/*
		var json_message = [{
			"callback_id": "incident_message",
			"mrkdwn_in": ["text"],
			"color": color,
			"pretext": "<https://igm-sandbox.statuscast.com/|status.igm.tools> - New *" + type_val + "* incident created from Slack:",
			"fields":[{
				"title": "*ID:*",
				"value": id ,
				"short":true
			},{
				"title": "*Title:*",
				"value": title,
				"short":true
			},{
				"title": "*When:*",
				"value": date,
				"short":true
			},{ 
				"title": "*Components:*",
				"value": components,
				"short":true
			},{
				"title": "*Message:*",
				"value": in_message,
				"short":true
			}],
			"actions": [{
				"name": "update",
				"text": "Update",
				"type": "button",
				"value": "update"
			},{
				"name": "delete",
				"text": "Delete",
				"style": "danger",
				"type": "button",
				"value": "delete",
				"confirm": {
					"title": "Delete Incident",
					"text": "Are you sure you want to delete this incident?",
					"ok_text": "Yes",
					"dismiss_text": "No"
				}
			}]
		}];*/
		return message;
	},
    getComponents: function(option) {
        var all_components = [];
        var components = [];
        var str_components = "";

        for(var i = 0; i < option.length; ++i) {
            var component = (JSON.stringify(option[i].text.text)).replace(/['"]+/g, '');
            if(i == 0) {
                str_components += component;
            } else {
                str_components += ", " + component;
            }
			
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
          all_components.push(str_components);
          all_components.push(components);
          return all_components;
	},
	getUpdateModal: function() {
		var modal = {
			"type": "modal",
			"callback_id": "update",
			"title": {
				"type": "plain_text",
				"text": "Update an Incident",
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
					"type": "input",
					"block_id": "update_type",
					"label": {
						"type": "plain_text",
						"text": "Update Type"
					},
					"element": {
						"type": "static_select",
						"action_id": "clicked_update_type",
						"placeholder": {
							"type": "plain_text",
							"text": "Select something"
						},
						"options": [
							{
								"text": {
									"type": "plain_text",
									"text": "Informational"
								},
								"value": "update_informational"
							},
							{
								"text": {
									"type": "plain_text",
									"text": "Resolved"
								},
								"value": "update_resolved"
							}
						]
					}
				},
				{
					"type": "input",
					"block_id": "update_message",
					"element": {
						"type": "plain_text_input",
						"action_id": "update_message",
						"multiline": true
					},
					"label": {
						"type": "plain_text",
						"text": "Update message",
						"emoji": true
					}
				}
			]
		};
		return modal;
	},
    getModal: function() {
        var modal = {
			"type": "modal",
			"callback_id": "create",
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
        return modal;
    }
}