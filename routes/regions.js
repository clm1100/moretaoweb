/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  // 获取最新的区域文件下载地址
  router.get('/api/regions/url/:date', function(req, res) {
    var date = parseInt(_.trim(req.params.date));
    if(date < 20160124) res.json({ url: cloudUrl + 'region/20160124.zip', date:20160124 });
    else res.json({});
  });

  // 获取指定区域的单层数据
  router.get('/api/regions/:code', function(req, res) {
    var code = _.trim(req.params.code);
    if(_.isEmpty(code)) res.json({});
    else Region.find({ parent: req.params.code }, function(err, items) { res.json(items); });
  });

  return router;
};
