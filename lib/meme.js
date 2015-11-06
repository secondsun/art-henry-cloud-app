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
                var callback = function (error, account) {
                    console.log(account);
                    if (error) {
                        console.trace(error);
                        res.statusCode = 500;
                        return res.end(error);
                    } else {
                        
                            console.log(account);
                            var today = dateFormat(new Date(), "mmm d, yyyy h:MM:ss TT");
                            var meme = {
                                ownerId: account['name'],
                                createdOn: today,
                                updatedOn: today,
                                sharedWith: [],
                                commits: [{
                                        ownerId: account['name'],
                                        createdOn: today,
                                        updatedOn: today,
                                        photoUrl: req.protocol + '://' + req.get('host') +  '/' + memefilename,
                                        comments: [{
                                                ownerId: account['name'],
                                                createdOn: today,
                                                updatedOn: today,
                                                comment: "Posted " + today
                                            }]
                                    }]
                            };

                            mbaasApi.db({
                                "act": "create",
                                "type": 'photos',
                                "fields": meme
                            }, function (err, data) {
                                if (err) {
                                    res.statusCode = 500;
                                    res.end(err);
                                } else {

                                    res.statusCode = 200;
                                    res.json({});
                                }
                            });
                        

                    }

                }

                mbaasApi.session.get(req.get('X-FH-sessionToken'), callback);


            }
        });

    }

};

module.exports = new Meme();
