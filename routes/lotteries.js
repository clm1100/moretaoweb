/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var _u = require('./utils');
var express = require('express');
var router = express.Router();
var thunk = require('thunks')();

module.exports = function(utils) {
  router.get('/api/lotteries/:id', function(req, res) {
    if(_u.isNotMongoId(req.params.id)) { res.json({ item:null }); return; }
    Lottery.findById(req.params.id, function(err, item) { res.json({ item:item, error:err }); });
  });

  router.get('/api/get/lottery/list', function(req, res) {
    LotteryReceiveRecord.find({ lottery:'56a753f509163ded677209a1', user:'569cd3ef736a88e87fd92c68' }, function(err, data) {
      res.json(data);
    });
  });

  router.get('/api/lotteries/:id/draw/:code', utils.token, function(req, res) {
    var id = req.params.id;
    var code = _.trim(req.params.code);

    // 用户未登录
    if(!req.user) { res.json({ item:null, status:403, error:'请您先登录.' }); return; }

    // 没有活动信息
    if(_u.isNotMongoId(req.params.id) || _.isEmpty(code)) { res.json({ item:null, status:404, error:'没有找到对应的活动信息' }); return; }

    thunk.all([
      thunk(function(cb) { Lottery.findById(id, function(err, item) { cb(err, item); }); }),
      thunk(function(cb) { LotteryReceiveRecord.count({ lottery:id, code:code }).exec(function(err, count) { cb(err, count); }); })
    ])(function(error, results) {
      var item = results[0];
      if(!item) { res.json({ item:null, status:404, error:'没有找到对应的活动信息' }); return; }

      // 如果号码重复 或 抽奖还没有开始 或 抽奖已经结束
      var today = new Date();

      if(parseInt(results[1]) > 0 || today < utils.moment(item.start).toDate() || today > utils.moment(item.end).endOf('day').toDate()) {
        var porder = item.strategy.normal[_.random(0, item.strategy.normal.length - 1)];
        var prize = _.filter(item.prizes, function(p) { return p.order === porder; })[0];

        res.json({ item:null, status:200, prize:prize }); return;
      }

      // 判断 code 是否在指定的数量区间内
      var num = parseInt(code);
      var start = parseInt(_.padEnd(item.prefix, 12, '0'));
      var end = parseInt(item.prefix + _.padStart(item.num, 8, '0'));

      if(num < start || num > end) { res.json({ item:null, status:423, error:'这个活动号码已经被使用' }); return; }

      draw(req.user, item, code, function(err, record, prize) { res.json({ item:record, prize:prize, status:200, error:null }); });
    });
  });

  function draw(user, item, code, cb) {
    var format = 'YYYY-MM-DD HH:mm';
    var today = utils.moment();
    var tstr = today.format('YYYY-MM-DD');
    var ttstr = today.format(format);

    // 时间段判断
    var pool = null;
    _.each(item.strategy.ranges, function(it) {
      var se = it.range.split('-');
      var start = utils.moment(tstr + ' ' + se[0], format);
      var end = utils.moment(tstr + ' ' + se[1], format);

      if(today.isBetween(start, end)) { pool = it; return; }
    });

    // 默认使用 normal
    var porder = item.strategy.normal[_.random(0, item.strategy.normal.length - 1)];
    var prize = _.filter(item.prizes, function(p) { return p.order === porder; })[0];

    if(pool !== null) {
      // 时间段匹配
      var array = pool.range;
      var fill = 100 * pool.pre;
      var random = _.random(0, 100, true);

      if(random <= fill) porder = pool.nums[_.random(0, pool.nums.length - 1)];
    }

    // 如果未中奖
    if(porder === -1) { cb(null, null); return; }

    // 如果中奖
    var toStart = Math.abs(utils.moment(item.start).diff(today, 'days')) + 1;
    var query = { lottery:item.id, day:parseInt(toStart), used:false, order:parseInt(porder) };

    LotteryPoolRecord.findOneAndUpdate(query, { $set:{ used:true } }, { upsert:false }, function(err, p) {
      // 还有奖项, 获取对应的奖项
      if(p) {
        prize = _.filter(item.prizes, function(p) { return p.order === porder; })[0];

        var record = new LotteryReceiveRecord({ lottery:item.id, user:user.id, prize:prize, code:code });
        record.save(function(err) { cb(null, record, prize); });
      } else cb(null, null, prize);
    });
  }

  router.post('/api/lottery_receive_records/:id', function(req, res) {
    if(_u.isNotMongoId(req.params.id)) { res.json({ status:404, item:null }); return; }

    LotteryReceiveRecord.findById(req.params.id, function(err, item) {
      if(!item) { res.json({ status:404, item:null }); return; }
      var body = req.body;
      item.name = body.name;
      item.phone = body.phone;
      item.address = body.address;
      item.zipcode = body.zipcode;
      item.idnum = body.idnum;
      item.idcard.a = body.a;
      item.idcard.b = body.b;

      item.save(function(err) { res.json({ status:err ? 500 : 200, item:item, error:err ? err.message : null }); });
    });
  });

  // 查询用户有没有抽奖
  router.get('/api/lottery_receive_records_num/:id', utils.token, function(req, res) {
    var id = req.params.id;
    var userid = req.user.id;

    // 用户未登录
    if(!req.user) { res.json({ item:null, status:403, error:'请您先登录.' }); return; }
    // var now = new Date();
    // var start = utils.moment(now).startOf('day');
    // var end = utils.moment(now).endOf('day');
    // PostcardRecord.findOne({user:userid, $or:[{at:{$gte:start.valueOf(), $lte:end.valueOf()}}, {id:id}]}, function(err, data) {
    //   if(!data) res.json({success:true, userid:userid, postcard:id});
    //   else res.json({success:false});
    // });
    LotteryReceiveRecord.findOne({ user:userid, lottery:id }, function(err, data) {
      if(!data) res.json({ success:true, userid:userid, postcard:id });
      else res.json({ success:false });
    });
  });
  return router;
};
