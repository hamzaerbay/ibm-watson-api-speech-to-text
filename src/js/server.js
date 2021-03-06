
const credentials = require('./credentials');
// Create an app on https://console.bluemix.net/docs/services/speech-to-text/getting-started.html#gettingStarted
const express = require('express');

const app = express();
const watson = require('watson-developer-cloud');
const vcapServices = require('vcap_services');
const cors = require('cors');

// on bluemix, enable rate-limiting and force https
if (process.env.VCAP_SERVICES) {
  // enable rate-limiting
  const RateLimit = require('express-rate-limit');
  app.enable('trust proxy'); // required to work properly behind Bluemix's reverse proxy

  const limiter = new RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
  });

  //  apply to /api/*
  app.use('/api/', limiter);

  // force https - microphone access requires https in Chrome and possibly other browsers
  // (*.mybluemix.net domains all have built-in https support)
  const secure = require('express-secure-only');
  app.use(secure());
}

app.use(express.static(`${__dirname}/static`));
app.use(cors());

// token endpoints
// **Warning**: these endpoints should probably be guarded with additional authentication & authorization for production use

// speech to text token endpoint
const sttAuthService = new watson.AuthorizationV1(
  Object.assign(
    {
      username: credentials.username, // or hard-code credentials here
      password: credentials.password,
    },
    vcapServices.getCredentials('speech_to_text'), // pulls credentials from environment in bluemix, otherwise returns {}
  ),
);
app.use('/api/speech-to-text/token', (req, res) => {
  sttAuthService.getToken(
    {
      url: watson.SpeechToTextV1.URL,
    },
    (err, token) => {
      if (err) {
        console.log('Error retrieving token: ', err);
        res.status(500).send('Error retrieving token');
        return;
      }
      res.send(token);
    },
  );
});

const port = process.env.PORT || process.env.VCAP_APP_PORT || 3002;
app.listen(port, () => {
  console.log('Example IBM Watson Speech JS SDK client app & token server live at http://localhost:%s/', port);
});

// Chrome requires https to access the user's microphone unless it's a localhost url so
// this sets up a basic server on port 3001 using an included self-signed certificate
// note: this is not suitable for production use
// however bluemix automatically adds https support at https://<myapp>.mybluemix.net
if (!process.env.VCAP_SERVICES) {
  const fs = require('fs');
  const https = require('https');
  const HTTPS_PORT = 3001;

  const options = {
    key: fs.readFileSync(`${__dirname}/keys/localhost.pem`),
    cert: fs.readFileSync(`${__dirname}/keys/localhost.cert`),
  };
  https.createServer(options, app).listen(HTTPS_PORT, () => {
    console.log('Secure server live at https://localhost:%s/', HTTPS_PORT);
  });
}
