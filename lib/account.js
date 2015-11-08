var mbaasApi = require('fh-mbaas-api');
var q = require('q');
var request = require('request');

var Account = function () {
    this.login = oAuthPostLogin;
    this.getAccount = getAccount;
    this.getMe = getMe;

  /**
     * This function returns the user for the currently signed in user
     * 
     * @param {HttpRequest} req http request
     * @param {HttpResponse} res http repsonse
     *
     * @returns nothing
     */
    function getMe(req, res) {
        var sessionToken = req.get('X-FH-sessionToken');
        console.log ('account.js - getMe ', sessionToken);
        var callback = function(error, data) {
            if (error){
                res.statusCode = 500;
                console.log ('account.js - getMe ', sessionToken, ' with error ', error);
                return res.end(error);
            } else {
                if (!data) {
                    //no account, not logged in?
                    res.statusCode = 500;
                    console.log ('account.js - getMe ', sessionToken, ' with error no session ', error);
                    return res.end(error);
                } else {
                    console.log ('account.js - getMe ', sessionToken, ' - ', data)
                    return res.json(data);
                }
                
            }
            
        };
        
        console.log (mbaasApi.session);
        mbaasApi.session.get(sessionToken, callback);


    }

    /**
     * This function consumes a account id and returns the account or empty result
     * 
     * @param {HttpRequest} req http request
     * @param {HttpResponse} res http repsonse
     *
     * @returns nothing
     */
    function getAccount(req, res) {
        console.log(req.body);
        var accountId = req.path.accountId;
        
        var callback = function(error, data) {
            if (error){
                res.statusCode = 500;
                return res.end(error);
            } else {
                if (!data || data.count === 0) {
                    //no account, must create.
                    res.json({});
                } else {
                    res.json(data.list[0].fields);
                }
                
            }
            
        }
        
        mbaasApi.db({
            "act": "list",
            "type": 'account',
            "eq": {"id": accountId},
        }, callback);


    }
    
    /**
     * This function consumes the sessionToken, and the authResponse
     * 
     * @param {HttpRequest} req http request
     * @param {HttpResponse} res http repsonse
     *
     * @returns nothing
     */
    function oAuthPostLogin(req, res) {
        var sessionToken = req.body.sessionToken;
        var authResponse = req.body.authResponse;
        var callback = function(error, data) {
            if (error){
                res.statusCode = 500;
                console.log('account.js login error', error);
                console.trace('account.js - Error + ', error);
                return res.end(error);
            } else {
                res.json(data);
            }
            
        }
        mbaasApi.session.get(sessionToken, function (err, session) {
            if (!session) {
                console.log('account.js - No Session For ', sessionToken)
                initSession(sessionToken, authResponse, callback);
            } else {
                console.log('account.js - Session For ', sessionToken, ' is ', session)
                callback(null, session);
            }
        });


    }
    /**
     * Validate the user's session info with Google, and create a session object.  
     * This will also create a account object if necessary.
     * 
     * @param {String} sessionToken session token returned by the OAuth mbaas
     * @param {Object} authResponse authResponse returned by Google
     * @param {Callback} nodeCallback a node callback
     */
    function initSession(sessionToken, authResponse, nodeCallback) {
        //validate with google
        var options = {
            
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + authResponse.authToken}
        };


        request(options, handleGoogleResponse(sessionToken, authResponse, nodeCallback)).end();

    }

    /**
     * 
     * This callback consumes Google's response, and performs the appropriate 
     * actions on the session. (Set session optionally creating the account).
     * 
     * @param {type} sessionToken
     * @param {type} authResponse
     * @param {type} nodeCallback
     * @returns session Data on callback if successful, error on callback otherwise
     */
    function handleGoogleResponse(sessionToken, authResponse, nodeCallback) {
        return function (error, response, body) {
            
            //the whole response has been recieved, so we just print it out here
            if (error) {
              nodeCallback(e);
            } else {
              var resObject = JSON.parse(body);
                if (authResponse.id === resObject.id) {
                    //load from storage
                    checkAccountAndCreateSession(resObject.id, sessionToken, authResponse, nodeCallback);
                } else {
                    nodeCallback('Id for client does not match id for token.');
                }
            }

        };
    }

    /**
     * Loads a users data onto the session or creates a user and loads 
     * authResponse onto the session
     * 
     * @param {Sting}  googleUserId
     * @param {Sting} sessionToken
     * @param {Object} authResponse
     * @param {NodeCallback} nodeCallback
     * @returns session Data on callback if successful, error on callback otherwise
     */
    function checkAccountAndCreateSession(googleUserId, sessionToken, authResponse, nodeCallback) {
        console.log('checkAccountAndCreateSession');
        var handleResults = function (error, responseData) {
          console.log('checkAccountAndCreateSession_callback');
            if (error) {
                return nodeCallback(error, null);
            } else {
                if (!responseData || responseData.count === 0) {
                    //no account, must create.
                    createAccountAndSetSession(sessionToken, authResponse, nodeCallback);
                } else if (responseData.count > 1) {
                    return nodeCallback("error : Too many accounts returned", null);
                } else {
                    //account exists, set session and return it.
                    setSession(sessionToken, responseData.list[0].fields, nodeCallback);
                }
            }
        };

        mbaasApi.db({
            "act": "list",
            "type": 'account',
            "eq": {"id": googleUserId},
        }, handleResults);
    }

    /**
     *  Creates an account and sets the session to that account.
     * @param {Sting} sessionToken
     * @param {Object} authResponse
     * @param {NodeCallback} nodeCallback
     * @returns session Data on callback if successful, error on callback otherwise
     */
    function createAccountAndSetSession(sessionToken, authResponse, nodeCallback) {
      authResponse.authToken = '';
        mbaasApi.db({
            "act": "create",
            "type": 'account',
            "fields": [authResponse]
        }, function (error, data) {
          console.log('createAccountAndSetSession_cb');
            if (error) {
                return nodeCallback(error);
            } else {
                setSession(sessionToken, authResponse, nodeCallback);

            }
        });
    }

    /**
     * 
     * Sets the session.
     * 
     * @param {Sting} sessionToken
     * @param {Object} sessionData
     * @param {NodeCallback} nodeCallback
     * @returns session Data on callback if successful, error on callback otherwise
     */
    function setSession(sessionToken, sessionData, nodeCallback) {
        mbaasApi.session.set(sessionToken, JSON.stringify(sessionData), 0, function (error, ignore) {
          console.log('account.js - ', sessionToken, ' and data ',  sessionData);
            if (error)
                return nodeCallback(error);
            else
                return nodeCallback(null, sessionData);
        });
    }

};

module.exports = new Account();
