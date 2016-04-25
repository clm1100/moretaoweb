/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var _u = require('./utils');
var express = require('express');
var router = express.Router();
var thunk = require('thunks')();

module.exports = function(utils) {
  router.get('/api/postcards/:id', utils.token, function(req, res) {
    var id = req.params.id;
    var userid = req.user.id;

    // 用户未登录
    if(!req.user) { res.json({ item:null, status: 403, error: '请您先登录.' }); return; }

    var now = new Date(), start = utils.moment(now).startOf('day'), end = utils.moment(now).endOf('day');

    PostcardRecord.findOne({ user:userid, $or:[{ at:{ $gte:start.valueOf(), $lte:end.valueOf() } }, { id:id }] }, function(err, data) {
      if(!data) res.json({ success:true, userid:userid, postcard:id });
      else res.json({ success:false });
    });
  });

  router.get('/api/postcardsplans/:plans/:id', function(req, res) {
    var plans = decodeURI(req.params.plans);
    var id = req.params.id;
    thunk.all([
      thunk(function(cb) { Postcard.findById(id, function(err, item) { var maxCount = item.plans[plans]; cb(null, maxCount); }); }),
      thunk(function(cb) { PostcardRecord.count({ card:id, plans:plans }).exec(function(err, cont) { cb(null, cont); }); })
    ])(function(error, result) { res.json({ success:result[1] < result[0] }); });
  });

  router.post('/api/postcards_receive_records/new/', function(req, res) {
    var body = req.body;
    var item = new PostcardRecord({
      card:body.card,
      plan:body.plan,
      user:body.user,
      name:body.name,
      phone:body.phone,
      address:body.address,
      zipcode:body.zipcode
    });

    item.save(function(err) { res.json({ status: err ? 500 : 200, item:item, error:err ? err.message : null }); });
  });

  return router;
};
