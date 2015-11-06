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
                var callback = function (error, accountList) {
                    if (error) {
                        res.statusCode = 500;
                        return res.end(error);
                    } else {
                        if (!accountList || accountList.count === 0) {
                            //no account, must create.
                            res.json({});
                        } else {
                            var account = accountList.list[0].fields;
                            var today = dateFormat(new Date(), "mmm dS, yyyy h:MM:ss TT");
                            var meme = {
                                ownerId: account.given_name + ' ' + account.family_name,
                                createdOn: today,
                                updatedOn: today,
                                sharedWith: [],
                                commits: [{
                                        ownerId: account.given_name + ' ' + account.family_name,
                                        createdOn: today,
                                        updatedOn: today,
                                        photoUrl: req.protocol + '://' + req.get('host') + '/static/' + memefilename,
                                        comments: [{
                                                ownerId: account.given_name + ' ' + account.family_name,
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

                }

                mbaasApi.db({
                    "act": "list",
                    "type": 'account',
                    "eq": {"id": req.get('X-FH-sessionToken')},
                }, callback);


            }
        });

    }

};

module.exports = new Meme();
