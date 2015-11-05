var mbaasApi = require('fh-mbaas-api');
var q = require('q');
var request = require('request');

var Meme = function () {
    this.create = create;
    
    function create(req, res) {
        console.log(req.file);
        console.log(req.body);
        res.statusCode = 200;
        res.end("{}");
    }
    
};

module.exports = new Meme();
