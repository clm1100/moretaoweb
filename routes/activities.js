/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var _u = require('./utils');
var express = require('express');
var router = express.Router();
var thunk = require('thunks')();

module.exports = function(utils) {
  // 获取热门话题
  router.get('/api/activities/hots/:number', function(req, res) {
    Activity.find({}).sort('-count').limit(parseInt(req.params.number)).exec(function(err, item) {
      res.json({ hots:item });
    });
  });

  /* 活动列表页 */
  router.get('/activities', function(req, res) {
    res.render('activities');
  });

  /* 活动列表分页 API */
  router.get('/api/activities/pages/:index', function(req, res) {
    res.setHeader('Expires', new Date(Date.now() + 60 * 1000 * 30).toUTCString());
    var index = req.params.index;
    var cop = { is_publish:true };
    thunk.all([
      thunk(function(cb) {Activity.find(cop).select(tinySelectsForActivity).skip(index * 10).limit(10).sort('-at').exec(function(err, items) { cb(err, items); }); }),
      thunk(function(cb) { Activity.count(cop).exec(function(err, count) { cb(err, count); }); })
    ])(function(error, results) {
      res.json({ list:results[0], total:results[1], current:req.user });
    });
  });

  /* 活动详情页. */
  router.get('/activities/:id', utils.token, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    getActivity(req, res, req.params.id, 'html');
  });

  /* 活动详情 */
  router.get('/api/activities/:id', utils.token, function(req, res) {
    getActivity(req, res, req.params.id, 'json');
  });

  function getActivity(req, res, id, format) {
    res.setHeader('Expires', new Date(Date.now() + 60 * 1000 * 30).toUTCString());

    if(_u.isNotMongoId(id)) {
      if(format === 'html') res.redirect('/activities');
      else res.json({ item: null, total: 0, comments: [] });
      return;
    }

    thunk.all([
      thunk(function(cb) {
        Activity.findById(id).deepPopulate(activityDeepItems).exec(function(err, item) { cb(err, item); });
      }),
      thunk(function(cb) { Comment.find({ activity:id }).limit(1).exec(function(err, comments) { cb(err, comments); }); }),
      thunk(function(cb) {
        if(req.user) Zan.find({ user:req.user, activity:id }).exec(function(err, zans) { cb(err, zans); });
        else cb(null, null);
      })
    ])(function(error, results) {
      if(!results[0]) {
        if(format === 'html') res.redirect('/activities');
        else res.json({ item: null, total: 0, comments: [] });
      } else {
        var item = results[0].toObject();
        _.set(item, 'zaned', req.user ? results[2].length > 0 : false);
        if(format === 'html') res.render('activity', { item:item, total:item.comments_count, comments:results[1], current:req.user });
        else res.json({ item:item, total:item.comments_count, comments:results[1] });
      }
    });
  }

  /* 活动点赞 */
  router.post('/api/activities/:id/zans', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }

    var id = req.params.id;
    if(_u.isNotMongoId(id)) { res.json({ status:200, result:0 }); return; }

    Zan.find({ activity:id }).select('user').exec(function(err, zans) {
      var users = _.map(zans, function(z) { return z.user.toString(); });

      // 判断是否点过
      if(users.indexOf(req.user.id) > -1) res.json({ result:zans.length });
      else {
        var zan = new Zan({ activity:id, user:req.user.id });
        zan.save(function(err) {
          Activity.findById(id, function(err, t) {
            t.save(function(err) {
              if(err) res.json({ status:500, result:zans.length, error:err.message });
              else res.json({ status:200, result:t.zans_count, id:zan.id });
            });
          });
        });
      }
    });
  });

  /* 活动取消赞 */
  router.post('/api/activities/:id/zans/cancel', utils.token, function(req, res) {
    if(!req.isAuthenticated()) res.json({ error: '请您先登录.', status:403 });
    else {
      var id = req.params.id;
      if(_u.isMongoId(id)) {
        Zan.remove({ activity:id, user:req.user.id }, function(err) {
          Activity.findById(id).exec(function(err, t) {
            t.save(function(err) { res.json({ status: err ? 500 : 200, result:t.zans_count, error:err ? err.message : null }); });
          });
        });
      } else res.json({ status:200, result:0 });
    }
  });

  /* 活动评论 */
  router.get('/api/activities/:id/comments/:number', utils.token, function(req, res) {
    if(_u.isMongoId(req.params.id)) {
      var number = parseInt(req.params.number);
      Comment.find({ activity:req.params.id }).sort('-at').deepPopulate(commentDeepItems).limit(number).exec(function(err, items) {
        res.json({ items:items, current:req.user });
      });
    } else res.json({ items:[], current:req.user });
  });

  /* 活动评论. */
  router.post('/api/activities/:id/comments', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }

    var id = req.params.id;
    var content = _.trim(req.body.comment);

    if(_.isEmpty(content) || _u.isNotMongoId(id)) { res.json({ status:200, result:0 }); return; }

    Activity.findById(id, function(err, c) {
      if (_.isEmpty(req.body.parent) || _.isEmpty(req.body.main)) {
        // 如果是评论
        var comment = new Comment({ user:req.user.id, c:content, activity:id });
        comment.save(function(cerr) {
          c.save(function(err) {
            atsNotice(c, comment, comment.c, comment.user, function() {
              res.json({ result: c.comments_count, error: err ? err.message : null, status:err ? 500 : 200 });
            });
          });
        });
      } else {
        // 如果是回复
        Comment.findById(req.body.parent, function(err, comment) {
          if (!err && comment) {
            var sub = new SubComment({ c:content, user:req.user.id, main:req.body.main });
            comment.sub_comments.push(sub);
            comment.save(function(err) {
              // @ 通知
              atsNotice(c, comment, content, sub.user, function() {
                res.json({ result:c.comments_count, error:err ? err.message : null, status:err ? 500 : 200 });
              });
            });
          } else res.json({ status:err ? 500 : 200, result:c.comments_count, error:err ? err.message : null });
        });
      }
    });
  });

  // @ 通知
  function atsNotice(activity, comment, content, partner, callback) {
    var ats = content.match(/@.*?\s+?/g);
    ats = _.map(ats, function(at) {return at.replace('@', '').trim();});

    User.find({ nickname:{ $in:ats } }, function(err, users) {
      var list = _.map(users, function(user, i) {
        return new Notice({
          type:NoticeTypes.activity_comment_at,
          user:user,
          partner:partner,
          data:{ activity: activity.id, comment: comment.id }
        });
      });

      Notice.create(list, function(err) { callback(); });
    });
  }

  /* 活动评论点赞 */
  router.post('/api/activities/:id/comments/:cid/zan', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }
    if(_u.isNotMongoId(req.params.id) || _u.isNotMongoId(req.params.cid)) { res.json({ status:200, result:0 }); return; }

    Comment.findById(req.params.cid).deepPopulate(commentDeepItems).exec(function(err, c) {
      // 判断是否点过
      var zans = c !== null ? _.filter(c.zans, function(z) { return z.user.id === req.user.id; }) : [];
      if (zans && zans.length > 0) res.json({ result:c.zans_count, status:200 });
      else {
        var zan = new Zan({ user:req.user, comment:req.params.cid });
        zan.save(function(err) {
          c.zans.push(zan.id);
          c.save(function(err) { res.json({ status:err ? 500 : 200, result:c.zans_count, error:err ? err.message : null }); });
        });
      }
    });
  });

  return router;
};
