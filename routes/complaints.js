/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var __ = require('./utils');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  // 创建一个新的
  router.post('/api/complaints/new', function(req, res) {
    var item = new Complaint({ user: req.body.uid, commodity:req.body.commodity, reason:req.body.reason });
    item.save(function(err) {
      if(err) res.json({ item:null, error: err ? err.message : null, status: 500 });
      else res.json({ item:item, status:200 });
    });
  });

  // 是否举报过
  router.get('/api/complaints/:id/:cid/repeat', utils.token, function(req, res) {
    if(__.isMongoId(req.params.id) && __.isMongoId(req.params.cid)) {
      Complaint.find({ user:req.params.id, commodity:req.params.cid }, function(err, item) { res.json({ item:item }); });
    } else res.json({ item:null });
  });

  return router;
};
