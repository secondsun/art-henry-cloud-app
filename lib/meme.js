var mbaasApi = require('fh-mbaas-api');
var q = require('q');
var request = require('request');
var memecanvas = require('memecanvas');
var dateFormat = require('dateformat');

var Meme = function () {
    this.create = create;
    this.refresh = refresh;
    memecanvas.init('static', '-meme');

    function refresh(req, res) {
        mbaasApi.db({
            "act": "list",
            "type": 'photos'
        }, function (err, data) {
            if (err) {
                res.statusCode = 500;
                res.end(err);
            } else {
                res.statusCode = 200;
                res.json(data);
            }
        });
    }

    function create(req, res) {

        memecanvas.generate(req.file.path, req.body.topMessage, req.body.bottomMessage, function (error, memefilename) {
            if (error) {
                console.log(error);
                console.trace()
                res.statusCode = 500;
                res.end(error);
            } else {
                var callback = function (error, account) {
                    account = JSON.parse(account)
                    console.log(account);
                    if (error) {
                        console.trace(error);
                        res.statusCode = 500;
                        return res.end(error);
                    } else {

                        res.statusCode = 200;
                        res.json({"fileNameResult": req.protocol + '://' + req.get('host') + '/' + memefilename});
                    };


                }

                mbaasApi.session.get(req.get('X-FH-sessionToken'), callback);

            }
        });

    }

};

module.exports = new Meme();
