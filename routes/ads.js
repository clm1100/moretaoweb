/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  //* 广告 API */
  router.get('/api/ads/:type', function(req, res) {
    var start = utils.moment().startOf('day').toDate();
    var end = utils.moment().endOf('day').toDate();

    // 有时间限制且在时间限制内, 或者无时间限制的广告
    var or = [{ start:{ $lte:start }, end:{ $gte:end } }, { start:{ $exists:false }, end:{ $exists:false } }, { start:null, end:null }];
    Ad.find({ type:parseInt(req.params.type) }).or(or).sort('-start position').exec(function(err, ads) {
      res.json({ items:ads });
    });
  });

  return router;
};
