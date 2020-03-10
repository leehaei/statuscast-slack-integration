module.exports = {
    getBody: function(body, components) {
        for(var i = 0; i < components.length; ++i) {
            body+="&affectedComponents="+components[i];
        }
        return body;
    },
    getSuccess: function(raw_id, raw_date, raw_title, raw_components) {

        //sets variables for modal
        var id = "*ID:*\n" + raw_id;
	    var date = "*When:*\n" + raw_date;
	    var title = "*Title:*\n" + raw_title;
	    var lst_components = raw_components[0];
        for(var i = 1; i < raw_components.length; ++i) {
            lst_components += ", " + raw_components[i];
        }
        var components = "*Components:*\n" + lst_components;

        var success = [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        
                        "text": "You have created a new incident at *<https://igm-sandbox.statuscast.com/|status.igm.tools>*"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "id"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "date"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "title"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "components"
                        }
                    ]
                }
            ];
        return success;
    },
    getModal: function() {
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
        return modal;
    }
}