const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express().use(bodyParser.json());

const VERIFY_TOKEN = '';
const PAGE_ACCESS_TOKEN = '';

const getRequestParameters = requestBody => {
  return {
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { 'access_token': PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: requestBody
  };
};

const callSendAPI = (senderPsid, response) => {
  let requestBody = {
    recipient: {
      id: senderPsid
    },
    message: response
  };

  request(getRequestParameters(requestBody), (err, res, body) => {
    console.log(err ? `Unable to send message: ${err}` : 'Message sent!');
  });
};

const getResponse = (payload) => {
  if (payload === 'yes') return { text: 'Thanks!' };
  return { text: 'Oops, try sending another image.' };
};

const handlePostback = (senderPsid, receivedPostback) => {
  const payload = receivedPostback.payload;
  const response = getResponse(payload);
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

const processEntry = entry => {
  const webhookEvent = entry.messaging[0];
  const senderPsid = webhookEvent.sender.id;

  if (webhookEvent.message) {
    handleMessage(senderPsid, webhookEvent.message);
  } else if (webhookEvent.postback) {
    handlePostback(senderPsid, webhookEvent.postback);
  }
};

app.post('/webhook', (req, res) => {
  if (req.body.object !== 'page') return res.sendStatus(404);
  req.body.entry.forEach(processEntry);
  res.status(200).send('EVENT_RECEIVED');
});

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (!(mode && token)) return;
  if (!(mode === 'subscribe' && token === VERIFY_TOKEN)) return res.sendStatus(403);
  console.log('WEBHOOK_VERIFIED');
  res.status(200).send(challenge);
});

app.listen(process.env.PORT, () => console.log('webhook is listening'));
