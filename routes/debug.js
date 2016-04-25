'use strict';
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var express = require('express');
var router = express.Router();
var request = require('request');
var urlencode = require('urlencode');
var path = require('path');
var uuid = require('uuid');
var crypto = require('crypto');

module.exports = function(utils) {
  /* 调试页面 */
  router.get('/debug/info', function(req, res) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.render('debug', { ip:ip, current:req.user });
  });

  return router;
};
