const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Temporary bypass for testing
  req.user = { id: '60d5ecb54cb7c1a368d184eb' };
  return next();
};
