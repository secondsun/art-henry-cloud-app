var mbaasApi = require('fh-mbaas-api');

var globalRequestInterceptor = function(dataset_id, params, cb) {
  // This function will intercept all sync requests.
  // It is useful for checking client identities and
  // for validating authentication

  console.log('lib/sync.js - For param', params);

  return mbaasApi.session.get(params['sessionToken'][0], function(err, data) {
    console.log('lib/sync.js - For session', data);
    return cb(null);
  });

  

  // Return a non null response to cause the sync request to fail.
  // This (string) response will be returned to the client, so
  // don't leak any security information.
  
}

mbaasApi.sync.globalInterceptRequest(globalRequestInterceptor);