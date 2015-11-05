var express = require('express');
var mbaasApi = require('fh-mbaas-api');
var mbaasExpress = mbaasApi.mbaasExpress();
var account = require('./lib/account');
var meme = require('./lib/meme');
var bodyParser = require('body-parser');
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

// Define custom sync handlers and interceptors
require('./lib/sync.js');

// Securable endpoints: list the endpoints which you want to make securable here
var securableEndpoints = ['/account/:accountId'];

var app = express();

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);
app.use(mbaasExpress.fhauth({cache: true, expire: 60*60*24*365}));


// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

app.use('/static', express.static('static'));
app.post('/meme/create', upload.single('image'), meme.create);

app.use(bodyParser());
// Add extra routes here
app.post('/account/login', account.login);
app.get('/account/:accountId', account.getAccount);
app.get('/account/me', account.getMe);

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';
var server = app.listen(port, host, function() {
  console.log("App started at: " + new Date() + " on port: " + port); 
});
