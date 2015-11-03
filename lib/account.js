var mbaasApi = require('fh-mbaas-api');
var q = require('q');
var request = require('request');

var Account = function () {
    this.login = oAuthPostLogin;

    /**
     * This function consumes the sessionToken, and the authResponse
     * 
     * @param {String} sessionToken session token returned by the OAuth mbaas
     * @param {Object} authResponse authResponse returned by Google
     * @param {Callback} callback a node callback
     * @returns nothing, but returns the session on the callback
     */
    function oAuthPostLogin(req, res) {
        console.log(req.body);
        var sessionToken = req.body.sessionToken;
        var authResponse = req.body.authResponse;
        var callback = function(error, data) {
            if (error){
                res.statusCode = 500;
                console.log('login error', error);
                console.trace('Error + ', error);
                return res.end(error);
            } else {
                console.log('login complete!', data);
                res.json(data);
            }
            
        }
        mbaasApi.session.get(sessionToken, function (err, session) {
            if (!session) {
                initSession(sessionToken, authResponse, callback);
            } else {
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

        console.log('initSession');
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

        var handleResults = function (error, responseData) {
            if (error) {
                return nodeCallback(error, null);
            } else {
                if (!responseData || responseData.count === 0) {
                    //no account, must create.
                    createAccountAndSetSession(sessionToken, authResponse, nodeCallback);
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
        mbaasApi.db({
            "act": "create",
            "type": 'account',
            "fields": [authResponse]
        }, function (error, data) {
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
        mbaasApi.session.set(sessionToken, sessionData, function (error, ignore) {
            if (error)
                return nodeCallback(error);
            else
                return nodeCallback(null, sessionData);
        });
    }

};

module.exports = new Account();
