/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var _u = require('./utils');
var express = require('express');
var router = express.Router();
var thunk = require('thunks')();
var urlencode = require('urlencode');

module.exports = function(utils) {
  /* 专题列表分页 */
  router.get('/api/topics/pages/:index', utils.token, function(req, res) {
    res.setHeader('Expires', new Date(Date.now() + 1000 * 60 * 60).toUTCString());
    var index = req.params.index;

    var cop = { is_publish: true };

    thunk.all([
      thunk(function(cb) {
        Topic.find(cop).select(tinySelectsForTopic).skip(index * 10).limit(10).sort('-force_top -position -at').exec(function(err, items) {
          cb(err, items);
        });
      }),
      thunk(function(cb) { Topic.count({}).exec(function(err, count) { cb(err, count); }); }),
      thunk(function(cb) {
        if(req.user) Zan.find({ user:req.user.id, topic:{ $ne:null } }).exec(function(err, zans) {cb(err, zans);});
        else cb(null, null);
      })
    ])(function(error, results) {
      var list = results[0];
      var zans = _.map(results[2], 'topic');

      list = _.map(list, function(c) {
        c = c.toObject();
        _.set(c, 'zaned', _.find(zans, function(z) { return z.toString() === c.id; }) !== undefined);
        return c;
      });

      res.json({ list: list, total: results[1], current:req.user });
    });
  });

  /* 专题详情页. */
  router.get('/topics/:id', utils.token, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    var id = req.params.id;

    // 判断微信环境
    if(_u.isMongoId(id) && utils.isWeixin(req)) {
      // 检查是否有 user & data 参数, 判断是否跳转到微信静默登录
      // 如果有 user 没有 data, 跳转微信静默登录
      if(req.query.user && !req.query.data) {
        var url = 'http://' + utils.domain + '/topics/' + req.params.id + '?user=' + req.query.user;
        var weixin = 'http://' + utils.domain + '/wechat/silent?cb=' + urlencode(url);
        res.redirect(weixin);
      } else if(req.query.user && req.query.data) {
        // 如果没有 user 有 data, 保存分享点击记录
        var data = urlencode.decode(req.query.data);
        var datas = {
          clicker:req.user ? req.user.id : null,
          user:req.query.user,
          cid:id,
          openid:data.openid,
          type:ShareCountTypes.commodity.v
        };

        var params = _.pick(datas, ['user', 'cid', 'openid', 'type']);
        ShareCount.findOneAndUpdate(params, { $set: params }, { upsert: true, new: true }).exec(function(err, item) {
          getTopic(req, res, id, 'html');
        });
      } else getTopic(req, res, id, 'html');
    } else {
      if(_u.isMongoId(id)) getTopic(req, res, id, 'html');
      else res.redirect('/topics');
    }
  });

  /* 专题详情 API */
  router.get('/api/topics/:id', utils.token, function(req, res) {
    var id = req.params.id;
    if(_u.isMongoId(id)) getTopic(req, res, id, 'json');
    else res.json({ item: null, total: 0, comments:[] });
  });

  /* 专题详情内容页 API. */
  router.get('/api/topics/:id/content', utils.token, function(req, res) {
    res.cookie('moretao_return_url', req.url);

    if(_u.isMongoId(req.params.id)) {
      Topic.findById(req.params.id).exec(function(err, item) { res.render('topic-content', { item:item }); });
    } else res.render('topic-content', { item:null });
  });

  function getTopic(req, res, id, format) {
    thunk.all([
      thunk(function(cb) {
        if(_u.isNotMongoId(req.params.id)) { cb(null, null); return; }

        Topic.findById(id).deepPopulate(topicDeepItems).exec(function(err, item) {
          if(item && item.commodities && item.commodities.length > 0) {
            _.each(item.commodities, function(c) {
              c.photos = _.sortBy(c.photos, 'position');
              c.tags = null;
            });
          }
          cb(err, item);
        });
      }),
      thunk(function(cb) {
        if(req.user) Zan.find({ user:req.user, topic:id }).exec(function(err, zans) { cb(err, zans); });
        else cb(null, null);
      }),
      thunk(function(cb) { Comment.find({ topic:id }).limit(1).exec(function(err, comments) { cb(err, comments); }); })
    ])(function(error, results) {
      var item = null, commentsCount = 0, comments = [];
      if(results[0]) {
        item = results[0].toObject();
        _.set(item, 'zaned', req.user ? results[1].length > 0 : false);
        commentsCount = item.comments_count;
        comments = results[2];
      }

      if(format === 'html') res.render('topic', { item:item, total:commentsCount, comments:comments, current:req.user });
      else res.json({ item:item, total:commentsCount, comments:comments });
    });
  }

  /* 专题评论 */
  router.get('/api/topics/:id/comments/:number', function(req, res) {
    var id = req.params.id;
    var number = parseInt(req.params.number);

    if(_u.isMongoId(id)) {
      Comment.find({ topic:id }).sort('-at').deepPopulate(commentDeepItems).limit(number).exec(function(err, items) {
        res.json({ items: items, current:req.user });
      });
    } else res.json({ items: [], current:req.user });
  });

  /* 专题点赞 */
  router.post('/api/topics/:id/zans', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }
    if(_u.isNotMongoId(req.params.id)) { res.json({ result:0, id: req.params.id, status: 200 }); return; }

    Zan.find({ topic:req.params.id }).select('user').exec(function(err, zans) {
      // 判断是否点过
      var users = _.map(zans, function(z) { return z.user.toString(); });
      if(users.indexOf(req.user.id) > -1) { res.json({ result:zans.length, status:200 }); return; }

      var zan = new Zan({ user:req.user.id, topic:req.params.id });
      zan.save(function(err) {
        Topic.findById(req.params.id, function(err, t) {
          t.save(function(err) {
            if(err) res.json({ result:zans.length, err: err.message, status: 500 });
            else res.json({ result:t.zans_count, id: zan.id, status: 200 });
          });
        });
      });
    });
  });

  /* 专题取消赞 */
  router.post('/api/topics/:id/zans/cancel', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }

    if(_u.isMongoId(req.params.id)) {
      Zan.remove({ topic:req.params.id, user:req.user.id }, function(err) {
        Topic.findById(req.params.id).exec(function(err, t) {
          t.save(function(err) { res.json({ result: t.zans_count, err: err ? err.message : null, status: err ? 500 : 200 }); });
        });
      });
    } else res.json({ result:0, status:200 });
  });

  /* 专题评论. */
  router.post('/api/topics/:id/comments', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }

    var content = req.body.comment;

    if (_.isEmpty(content) || _.trim(content) === '') { res.json({ result:0, error:'not comment body', status:500 }); return; }
    if(_u.isNotMongoId(req.params.id)) { res.json({ result: 0, status: 200 }); return; }

    Topic.findById(req.params.id, function(err, c) {
      if (_.isEmpty(req.body.parent) || _.isEmpty(req.body.main)) {
        // 如果是评论
        var comment = new Comment({ user:req.user.id, c:content, topic:req.params.id });
        comment.save(function(cerr) {
          c.save(function(err) {
            atsNotice(c, comment, comment.c, comment.user, function() {
              res.json({ result:c.comments_count, error:err ? err.message : null, status:err ? 500 : 200 });
            });
          });
        });
      } else {
        // 如果是回复
        Comment.findById(req.body.parent, function(err, comment) {
          if(err || _.isEmpty(comment)) { res.json({ result:c.comments_count, error:err ? err.message : null, status:500 }); return; }

          var sub = new SubComment({ c:content, user:req.user.id, main:req.body.main });
          comment.sub_comments.push(sub);
          comment.save(function(err) {
            // @ 通知
            atsNotice(c, comment, content, sub.user, function() {
              res.json({ result:c.comments_count, error:err ? err.message : null, status:err ? 500 : 200 });
            });
          });
        });
      }
    });
  });

  // @ 通知
  function atsNotice(topic, comment, content, partner, callback) {
    var ats = content.match(/@.*?\s+?/g);
    ats = _.map(ats, function(at) {return at.replace('@', '').trim();});

    User.find({ nickname: { $in:ats } }, function(err, users) {
      var list = _.map(users, function(user, i) {
        return new Notice({
          type:NoticeTypes.topic_comment_at,
          user:user,
          partner:partner,
          data:{ topic: topic.id, comment: comment.id }
        });
      });

      Notice.create(list, function(err) { callback(); });
    });
  }

  /* 专题评论点赞 */
  router.post('/api/topics/:id/comments/:cid/zan', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }

    if(_u.isMongoId(req.params.cid) && _u.isMongoId(req.params.cid)) {
      Comment.findById(req.params.cid).deepPopulate(commentDeepItems).exec(function(err, c) {
        // 判断是否点过
        var zans = _.filter(c.zans, function(z) { return z.user.id === req.user.id; });
        if (zans && zans.length > 0) { res.json({ result: c.zans_count, status: 200 }); return; }
        var zan = new Zan({ user:req.user, comment:req.params.cid });
        zan.save(function(err) {
          c.zans.push(zan.id);
          c.save(function(err) { res.json({ result: c.zans_count, error: err ? err.message : null, status:err ? 500 : 200 }); });
        });
      });
    } else res.json({ result:0, status:200 });
  });

  return router;
};
