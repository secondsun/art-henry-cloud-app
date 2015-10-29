var mbaasApi = require('fh-mbaas-api');

var globalRequestInterceptor = function(dataset_id, params, cb) {
  // This function will intercept all sync requests.
  // It is useful for checking client identities and
  // for validating authentication

  console.log('lib/sync.js - Intercepting request for dataset', dataset_id, 'with params', params);

  // Return a non null response to cause the sync request to fail.
  // This (string) response will be returned to the client, so
  // don't leak any security information.
  return cb(null);
}

mbaasApi.sync.globalInterceptRequest(globalRequestInterceptor);