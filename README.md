# statuscast-slack-integration

This allows users from the IGM DevOps team to create incidents to StatusCast through slack. This assumes that the incident has occurred at the time of writing the incident. This integration can be accessed by using a slash command '/statuscast-create'

## Installation
1. Git clone repository
2. Retrieve tokens and IDs and create a .env file locally using .env/template as a template
4. Download NPM dependencies as needed

## API Reference
Uses xmlhttprequest and axios to post and get api data
 - [Slack Api](https://api.slack.com/)
 It uses the slack Api to create a bot and modals to retrive incident information from the user

 - [StatusCast Api](https://statuscast.readme.io/reference)
 It uses the StaticCast api to retrieve user token, and send the response collected by the slack Api

## How to use?
To create an incident:
1. Go to the app or to a channel
2. Use slash command '/statuscast-create' which opens up a 'Create an Incident' modal
3. Enter in the incident name/title, type (one of Informational, Performance, or Service Unavailable.), incident message and check all effected components
4. Click the 'Submit' button to send the incident 

To update an incident:
1. Go to the channel
2. Click the update button of the incident
3. Enter in the type of update and a message
4. Click submit to update the incident