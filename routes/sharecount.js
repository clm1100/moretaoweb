/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  //* 广告 API */
  router.post('/sharecount', function(req, res) {
    var body = req.body;
    var datas = {
      clicker:(req.user ? req.user.id : null),
      userid:body.userid,
      cid:body.cid,
      openid:body.openid,
      type:body.type
    };

    ShareCount.findOne(_.omit(datas, ['clicker']), function(err, item) {
      if(!item) item = new ShareCount(datas);
      else item = _.merge(item, datas);
      item.save(function(err, data) { res.json({ status: err ? 404 : 200, error: err }); });
    });
  });

  return router;
};
