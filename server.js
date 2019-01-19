const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());

const VERIFY_TOKEN = '';
const PAGE_ACCESS_TOKEN = '';

const callSendAPI = (senderPsid, response) => {
  let requestBody = {
    recipient: {
      id: senderPsid
    },
    message: response
  };

  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { 'access_token': PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: requestBody
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
};

const handlePostback = (senderPsid, receivedPostback) => {
  let response;
  let payload = receivedPostback.payload;

  if (payload === 'yes') {
    response = { text: 'Thanks!' };
  } else if (payload === 'no') {
    response = { text: 'Oops, try sending another image.' };
  }
  callSendAPI(senderPsid, response);
};

const handleMessage = (senderPsid, receivedMessage) => {
  let response;
  if (receivedMessage.text) {
    response = {
      text: `You sent the message: "${receivedMessage.text}". Now send me an image!`
    };
  }
  callSendAPI(senderPsid, response);
};

app.post('/webhook', (req, res) => {
  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function (entry) {
      let webhookEvent = entry.messaging[0];
      let senderPsid = webhookEvent.sender.id;

      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.get('/webhook', (req, res) => {

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.listen(process.env.PORT || 3000, () => console.log('webhook is listening'));
