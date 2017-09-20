var URI = require('urijs');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'), {multiArgs: true});

module.exports = function makeRequest(op, url, options) {
  op = op.toUpperCase();

  options = options || {};
  options.expectCode = options.expectCode || 200;
  options.retries = options.retries || 3;
  options.url = url;
  options.method = op;
  options.jar = true;
  options.timeout = 5000;

  //Workaround: head requests has some problems with gzip
  if (op !== 'HEAD')
    options.gzip = true;

  return wrapper();

  function wrapper() {
    var readableUrl = URI(url).readable();
    var errMsg = 'Can not ' + op + ' "' + readableUrl +'": ';

    return request(options)
    .then(function(result) {
      var response = result[0];
	  // TODO handle redirects
      if ((response.statusCode !== options.expectCode) && (response.statusCode !== 304))
        throw Error(errMsg + response.statusMessage);
      if (!options.silent)
        console.log(op + ' ' + readableUrl);
      return result;
    }, function (err) {
      throw Error(errMsg + err);
    })
    .catch(function (error) {
      if (--options.retries === 0)
        throw error;
      console.log(error);
      console.log('Retry operations, ' + options.retries + ' tries left.');
      return Promise.delay(1000).then(wrapper);
    });
  }
}

module.exports.get = function (url, options) {
  return module.exports('get', url, options)
    .spread((response, data) => data);
}

module.exports.getJson = function (url, options) {
  return module.exports.get(url, options)
    .then(data => JSON.parse(data));
}

module.exports.getRaw = function (url, options) {
  options = options || {};
  options.encoding = null;

  return module.exports.get(url, options);
}
