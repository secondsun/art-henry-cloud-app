var mbaasApi = require('fh-mbaas-api');
var q = require('q');
var request = require('request');
var memecanvas = require('memecanvas');
var dateFormat = require('dateformat');

var Meme = function () {
    this.create = create;

    memecanvas.init('static', '-meme');

    function create(req, res) {

        memecanvas.generate(req.file.path, req.body.topMessage, req.body.bottomMessage, function (error, memefilename) {
            if (error) {
                console.log(error);
                console.trace()
                res.statusCode = 500;
                res.end(error);
            } else {
                var today = dateFormat(new Date(), "mmm d, yyyy h:MM:ss TT");
                var meme = {
                    ownerId : req.get('X-FH-sessionToken'),
                    createdOn : today,
                    updatedOn : today,
                    sharedWith : [],
                    commits : [{
                        ownerId : req.get('X-FH-sessionToken'),
                        createdOn : today,
                        updatedOn : today,
                        photoUrl : req.protocol + '://' + req.get('host') + '/' + memefilename,
                        comments : [{
                            ownerId : req.get('X-FH-sessionToken'),
                            createdOn : today,
                            updatedOn : today,
                            comment : "Posted " + today
                        }]
                    }]
                };
                
                console.log('meme.js - ',memefilename);

                mbaasApi.db({
                    "act": "create",
                    "type": 'photos',
                    "fields" : meme
                }, function(err, data) {
                    if (err) {
                        res.statusCode = 500;
                        res.end(err);
                    } else {
                        
                        res.statusCode = 200;
                        res.json({});
                    }
                });
                
            }
        });

    }

};

module.exports = new Meme();
