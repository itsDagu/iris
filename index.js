const slackEventsApi = require('@slack/events-api');
const SlackClient = require('@slack/client').WebClient;
const express = require('express');
var request = require('request');
var getImageUrls = require('get-image-urls');
var textCaption= '';

//Microsoft Azure constants
const subscriptionKey = process.env.COMPUTER_VISION_TOKEN;
const uriBase =
    'https://westcentralus.api.cognitive.microsoft.com/vision/v2.0/analyze';
const params = {
    'visualFeatures': 'Description',
    'details': '',
    'language': 'en'
};

// *** Initialize an Express application
const app = express();

// *** Initialize a client with your access token
const slack = new SlackClient(process.env.SLACK_ACCESS_TOKEN);

// *** Initialize event adapter using signing secret from environment variables ***
const slackEvents = slackEventsApi.createEventAdapter(process.env.SLACK_SIGNING_SECRET);


// Homepage
app.get('/', (req, res) => {
  const url = `https://${req.hostname}/slack/events`;
  res.setHeader('Content-Type', 'text/html');
  return res.send(`<pre>Copy this link to paste into the event URL field: <a href="${url}">${url}</a></pre>`);
});

// *** Plug the event adapter into the express app as middleware ***
app.use('/slack/events', slackEvents.expressMiddleware());


// BEGIN MAIN PROJECT CODE//-----------------------------------------------------------------------------------------------------

// get url from image and send to python script
slackEvents.on('file_shared', (event) => {
  
slack.files.sharedPublicURL ({
  file: event.file_id,
  }).then(function(data){

//retrieve public url from sharedpublic url
var slackurl = data.file.permalink_public;    
var publicurl = '';
  
getImageUrls(slackurl)
  .then(function(images, publicurl) {
  publicurl = images[0].url;
  console.log(publicurl)
  
  const imageUrl = publicurl;

  // Request parameters.
  const options = {
    uri: uriBase,
    qs: params,
    body: '{"url": ' + '"' + imageUrl + '"}',
    headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key' : subscriptionKey
}
}
request.post(options, (error, response, body) => {
  if (error) {
    console.log('Error: ', error);
    return;
  }
  
  //var jsonResponse = JSON.stringify(body, null, '');
  textCaption = JSON.stringify(JSON.parse(body).description.captions[0].text, null, '');
  
  slack.chat.postMessage({
      as_user:false,
      username:'IRIS Bot',
      channel: event.channel_id,
      text: `Beep boop beep boop. Image contains `+ textCaption
      })
    })})

// check publicurl variable as global
// console.log(publicurl)

// Microsoft Azure

  })
});

// END MAIN PROJECT CODE//-----------------------------------------------------------------------------------------------------

// *** Handle errors ***
slackEvents.on('error', (error) => {
  if (error.code === slackEventsApi.errorCodes.TOKEN_VERIFICATION_FAILURE) {
    // This error type also has a `body` propery containing the request body which failed verification.
    console.error(`An unverified request was sent to the Slack events Request URL. Request body: \
${JSON.stringify(error.body)}`);
  } else {
    console.error(`An error occurred while handling a Slack event: ${error.message}`);
  }
});

// Start the express application
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
