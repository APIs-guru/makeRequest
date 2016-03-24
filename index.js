var URI = require('urijs');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'), {multiArgs: true});

module.exports = function (op, url, options) {
  op = op.toUpperCase();

  options = options || {};
  options.expectCode = options.expectCode || 200;
  options.url = url;
  options.method = op;
  options.jar = true;
  options.timeout = 5000;

  //Workaround: head requests has some problems with gzip
  if (op !== 'HEAD')
    options.gzip = true;

  var tries = 3;
  return wrapper();

  function wrapper() {
    var readableUrl = URI(url).readable();
    var errMsg = 'Can not ' + op + ' "' + readableUrl +'": ';

    return request(options)
    .then(function(result) {
      var response = result[0];
      if (response.statusCode !== options.expectCode)
        throw Error(errMsg + response.statusMessage);
      console.log(op + ' ' + readableUrl);
      return result;
    }, function (err) {
      throw Error(errMsg + err);
    })
    .catch(function (error) {
      if (--tries === 0)
       throw error;
      console.log(error);
      console.log('Retry operations, ' + tries + ' tries left.');
      return Promise.delay(1000).then(wrapper);
    });
  }
}
