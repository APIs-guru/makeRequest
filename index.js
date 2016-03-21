var URI = require('urijs');
var async = require('async');
var request = require('request');

exports = function (op, url, options, callback) {
  op = op.toUpperCase();
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }

  options.url = url;
  options.method = op;
  options.jar = true;
  options.timeout = 5000;

  //Workaround: head requests has some problems with gzip
  if (op !== 'HEAD')
    options.gzip = true;

  var expectCode = options.expectCode || 200;
  var readableUrl = URI(url).readable();

  async.retry({}, function (asyncCallback) {
    request(options, function(err, response, data) {
      var errMsg = 'Can not ' + op + ' "' + readableUrl +'": ';
      if (err)
        return asyncCallback(new Error(errMsg + err));
      if (response.statusCode !== expectCode)
        return asyncCallback(new Error(errMsg + response.statusMessage));
      asyncCallback(null, {response: response, data: data});
    });
  }, function (err, result) {
    if (err)
      return callback(err);

    console.log(op + ' ' + readableUrl);
    callback(null, result.response, result.data);
  });
}
