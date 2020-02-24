const axios = require('axios');
const qs = require('qs');

const SLACK_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;
const apiUrl = 'https://slack.com/api';


const updateView = async(user) => {

  let blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*Welcome!* \nThis is a home for Stickers app. You can add small notes here!"
      },
      accessory: {
        type: "button",
        action_id: "add_note",
        text: {
          type: "plain_text",
          text: "Add a Stickie",
          emoji: true
        }
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ":wave: Hey, my source code is on <https://glitch.com/edit/#!/apphome-demo-keep|glitch>!"
        }
      ]
    },
    {
      type: "divider"
    }
  ];

  // The final view -

  let view = {
    type: 'home',
    title: {
      type: 'plain_text',
      text: 'Keep notes!'
    },
    blocks: blocks
  }

  return JSON.stringify(view);
};


const displayHome = async(user, data) => {

  const args = {
    token: process.env.SLACK_TOKEN,
    user_id: user,
    view: await updateView(user)
  };

  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));

  try {
    if(result.data.error) {
      console.log(result.data.error);
    }
  } catch(e) {
    console.log(e);
  }
};


const openModal = async(trigger_id) => {

  const modal = {
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
    token: process.env.SLACK_TOKEN,
    trigger_id: trigger_id,
    view: JSON.stringify(modal)
  };

  const result = await axios.post(`${apiUrl}/views.open`, qs.stringify(args));
};



module.exports = { displayHome, openModal };
