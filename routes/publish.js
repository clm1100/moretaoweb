/* global top_works_list, top_ip_list, top_brand_list, top_search_list */

'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();
var path = require('path');
var thunk = require('thunks')();

module.exports = function(utils) {
  /* 内容添加页 */
  router.get('/publish', utils.logged, function(req, res) {
    Commodity.aggregate([
      { $unwind: '$custom_tags' },
      { $project: { cd:'$custom_tags.d' } },
      { $match : { cd : { $ne: null } } },
      { $group: { _id: { d: '$cd' }, count: { $sum: 1 } } },
      { $sort : { count : -1 } },
      { $limit : 10 }
    ]).exec(function(err, result) {
      var hots = _.map(result, function(item) { return item._id.d; });
      res.render('publish', { env:utils.app.get('env'), hots:hots, current:req.user });
    });
  });

  /* 内容保存页 */
  router.post('/publish', utils.logged, function(req, res) {
    var data = req.body.data;
    var commodity = new Commodity({
      user:req.user,
      p:data.price ? parseFloat(data.price) : null,
      url:_.trim(data.url),
      t:_.trim(data.title),
      d:_.trim(data.desc),
      currency:_.trim(data.currency),
      is_publish:true
    });

    // 图片处理
    _.each(data.images, function(img, i) {
      var photo = new Photo();
      photo.f = path.basename(img);
      photo.position = i;

      commodity.photos.push(photo);
    });

    // 标签处理
    _.each(data.tags, function(t) {
      var tag = new CustomTag({ d:t.txt, x:t.x, y:t.y, o:t.o });
      commodity.custom_tags.push(tag);
    });

    var works = [{ list:'works', t:_.trim(data.works) }];
    var ips = [{ list:'ip', t:_.trim(data.ip) }];
    var brands = [{ list:'brand', t:_.trim(data.brand) }];

    var list = _.union(works, ips, brands);

    // 活动处理
    var activities;
    if(commodity.d && commodity.d.length > 0) {
      var activityRegStr = '#.*?#';
      var activityReg = new RegExp(activityRegStr, 'gi');
      activities = commodity.d.match(activityReg);
    }
    if(!activities) activities = [];

    // At 处理
    var ats;
    if(commodity.d && commodity.d.length > 0) {
      var atRegStr = '@.*?\\s+';
      var atReg = new RegExp(atRegStr, 'gi');
      ats = commodity.d.match(atReg);
    }
    if(!ats) ats = [];

    // 保存活动
    var activitiesFuncs = _.map(activities, function(a) {
      return thunk(function(cb) {
        var query = { t:a.replace(/#/g, '') };
        var update = { $set:query, $inc:{ count:1 } };
        Activity.findOneAndUpdate(query, update, { upsert:true, new:true }).exec(function(err, item) { cb(err, item); });
      });
    });

    // 保存 @
    var atsFuncs = _.map(ats, function(a) {
      return thunk(function(cb) {
        // 发送 @ 通知
        var nickname = _.trim(a.replace(/@/g, ''));
        User.findOne({ nickname:nickname }).exec(function(err, user) {
          if(user) {
            var notice = new Notice({
              type:NoticeTypes.commodity_comment_at,
              user:user,
              partner:commodity.user,
              data:{ commodity: commodity.id }
            });
            notice.save(function(err) { cb(err, notice); });
          } else cb(null, null);
        });
      });
    });

    // 保存结构化数据
    var listFuncs = _.map(list, function(t) {
      return thunk(function(cb) {
        if(t && t.t && t.t.length > 0) {
          var query = { t:t.t, list:t.list };
          Tag.findOneAndUpdate(query, { $set:query, $inc:{ count:1 } }, { upsert:true, new:true }).exec(function(err, item) { cb(err, item); });
        } else cb(null, null);
      });
    });

    thunk.seq([activitiesFuncs, atsFuncs, listFuncs])(function(error, result) {
      _.each(result[2], function(r) { if(r !== null) commodity.tags.push(r.id); });
      commodity.makePromotionData(function() {
        commodity.save(function(error) {
          if(!error) {
            // NOTE 用户发布商品奖励积分 10
            var content = { user:req.user.id };
            var points = 10;
            var update = { $set: content, $inc:{ points:points } };
            Account.findOneAndUpdate(content, update, { upsert:true, new:true }).exec(function(err, account) {
              res.json({ error:err ? err.message : null, result:commodity, status: err ? 500 : 200, points:points });
            });
          } else res.json({ error:error ? error.message : null, result:commodity });
        });
      });
    });
  });

  return router;
};
