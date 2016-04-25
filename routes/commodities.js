/* jshint -W079 */
/* jshint -W020 */
'use strict';
var _ = require('lodash');
var __ = require('./utils');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var thunk = require('thunks')();

module.exports = function(utils) {
  // 商品列表页
  router.get('/commodities', function(req, res) {
    res.cookie('moretao_return_url', req.url);
    if(req.user) {
      Follow.find({ fan_id:req.user.id }).select('user_id').exec(function(err, follows) {
        follows = _.map(follows, function(f) { return f.user_id; });
        res.render('commodities', { follows:follows, current: req.user });
      });
    } else res.render('commodities', { follows:[], current: req.user });
  });

  // 商品分页 API
  router.get('/api/commodities/pages/:index', function(req, res) {
    res.redirect('/api/commodities/all/pages/' + req.params.index);
  });

  /* 商品列表按类型分页 */
  router.get('/api/commodities/:type/pages/:index', utils.token, function(req, res) {
    var index = req.params.index;
    var type = req.params.type;
    var cop = {};
    var or = null;
    var sort = '-force_top -position -at';
    thunk(function(cb) {
      if (type === 'choice') {
        // 编辑选择
        cop = { is_selected: true };
        cb(null, cop);
      } else if(type === 'follow') {
        // 关注用户
        Follow.find({ fan_id: req.user.id }).select('user_id').exec(function(err, items) {
          var ids = _.map(items, 'user_id');
          cop = { user: { $in: ids } };
          cb(err, cop);
        });
      } else cb(null, cop);
    })(function(error, data) {
      // 未登录
      if (!req.user) {
        _.set(cop, 'is_publish', true);
        thunk.all([
          thunk(function(cb) {
            Commodity.find(cop).populate('tags').deepPopulate(commodityDeepItems).sort(sort).skip(index * 10).limit(10).exec(function(err, items) {
              cb(err, reorganizeCommodities(items, true));
            });
          }),
          thunk(function(cb) { Commodity.count(cop).exec(function(err, count) { cb(err, count); }); })
        ])(function(error, results) { res.json({ list: results[0], total: results[1], current: req.user }); });
      } else {
        or = [{ is_publish:true }, { is_publish:false, user:req.user.id }];
        thunk.all([
          thunk(function(cb) {
            Hobby.find({ user:req.user }).exec(function(err, tags) {
              var list = _.map(tags, 'id');
              if(list && list.length > 0) or.push({ is_publish:true, tags:{ $in:list } });
              Commodity.find(cop).or(or).populate('tags').deepPopulate(commodityDeepItems).skip(index * 10).limit(10).sort(sort).exec(function(err, items) {
                cb(err, reorganizeCommodities(items, true));
              });
            });
          }),
          thunk(function(cb) { Commodity.count(cop).or(or).exec(function(err, count) { cb(err, count); }); }),
          thunk(function(cb) { Zan.find({ user:req.user, commodity:{ $ne:null } }).exec(function(err, zans) { cb(err, zans); }); }),
          thunk(function(cb) { Favorite.find({ user:req.user }).select('commodities').exec(function(err, items) { cb(err, items); }); })
        ])(function(error, results) {
          var list = results[0];
          var zans = _.map(results[2], 'commodity');
          var favorites = _.flattenDeep(_.map(results[3], 'commodities'));
          list = _.map(list, function(c) {
            c = c.toObject();
            _.set(c, 'zaned', _.find(zans, function(z) { return z.toString() === c.id; }) !== undefined);
            _.set(c, 'collected', _.find(favorites, function(f) { return f && f.toString() === c.id; }) !== undefined);
            return c;
          });
          res.json({ list: list, total: results[1], current: req.user });
        });
      }
    });
  });

  /* 商品详情页 */
  router.get('/commodities/:id', utils.token, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    var id = req.params.id;

    if(id && id.length > 0) getCommodity(req, res, id, 'html');
    else res.redirect('/commodities');
  });

  /* 商品详情页 API */
  router.get('/api/commodities/:id', utils.token, function(req, res) {
    var id = req.params.id;

    if(__.isMongoId(id)) getCommodity(req, res, id, 'json');
    else res.json({ item: null, total: 0, follows:[] });
  });

  function getCommodity(req, res, id, format) {
    if(__.isNotMongoId(id)) {
      if(format === 'html') res.redirect('/commodities');
      else res.json({ item: null, total: 0, follows: [] });
      return;
    }

    thunk.all([
      thunk(function(cb) {
        Commodity.findById(id).populate('tags').deepPopulate(commodityDeepItems).exec(function(err, item) {
          if (item && item.photos) item.photos = _.sortBy(item.photos, 'position');
          cb(err, item);
        });
      }),
      thunk(function(cb) { if(req.user) Zan.find({ user:req.user, commodity:id }).exec(function(err, zans) { cb(err, zans); }); else cb(null, null); }),
      thunk(function(cb) {
        if(req.user) Favorite.find({ user:req.user }).select('commodities').exec(function(err, favorites) { cb(err, favorites); }); else cb(null, null);
      }),
      thunk(function(cb) {
        if(req.user) Follow.find({ fan_id:req.user.id }).select('user_id').exec(function(err, follows) { cb(err, follows); }); else cb(null, null);
      }),
      thunk(function(cb) {
        Zan.find({ commodity:id }).populate({ path:'user', select:deepSelectsForUser }).sort('-at').limit(20).exec(function(err, zans) { cb(err, zans); });
      })
    ])(function(error, results) {
      if(!results[0]) {
        if(format === 'html') res.redirect('/commodities');
        else res.json({ item: null, total: 0, follows: [] });
        return;
      }
      var item = results[0].toObject();
      if (req.user) {
        var favorites = _.flattenDeep(_.map(results[2], 'commodities'));
        _.set(item, 'zaned', results[1].length > 0);
        _.set(item, 'collected', _.find(favorites, function(f) { return f.toString() === id; }) !== undefined);
        if(format === 'html') res.render('commodity', { item:item, total:results[0].comments_count, current:req.user, zans:results[4], follows:results[3] });
        else res.json({ item:item, total:results[0].comments_count, zans:results[4], follows:results[3] });
      } else {
        _.set(item, 'zaned', false);
        _.set(item, 'collected', false);
        if(format === 'html') res.render('commodity', { item:item, total:results[0].comments_count, current:req.user, zans:results[4], follows:[] });
        else res.json({ item:item, total:results[0].comments_count, zans:results[4], follows:[] });
      }
    });
  }

  /* 商品评论 */
  router.get('/api/commodities/:id/comments/:number', function(req, res) {
    var id = req.params.id;
    var number = parseInt(req.params.number);
    if(__.isNotMongoId(id)) res.json({ items: [], total: 0, current: req.user });
    else {
      var query = { commodity:id };
      thunk.all([
        thunk(function(cb) { Comment.find(query).limit(number).sort('-at').deepPopulate(commentDeepItems).exec(function(err, items) { cb(err, items); }); }),
        thunk(function(cb) { Comment.count(query).exec(function(err, count) { cb(err, count); }); })
      ])(function(error, results) {
        res.json({ items:results[0], total:results[1], current:req.user });
      });
    }
  });

  /* 推荐商品 */
  router.get('/api/commodities/:id/recommends/pages/:page', utils.token, function(req, res) {
    var id = req.params.id;
    var page = parseInt(req.params.page);
    if (!page) page = 0;

    if(__.isNotMongoId(id)) { res.json({ items: [], total: 0, current: req.user }); return; }

    Commodity.findById(id).populate('tags custom_tags').exec(function(err, item) {
      if(!item) { res.json({ items: [], total: 0, current: req.user }); return; }

      var query = __.replacePunctuations(item.t);
      var tagsText = [];
      _.each(item.tags, function(t) { tagsText.push(__.replacePunctuations(t.t)); });
      _.each(item.custom_tags, function(t) { tagsText.push(__.replacePunctuations(t.d)); });
      query += (' ' + tagsText.join(' '));
      if (query.length < 1) query = '*';

      Commodity.search({
        filtered: {
          query: { query_string: { query: query } },
          filter: {
            and: [
              { term: { is_publish: true } },
              { not: { term: { _id: item.id } } }
            ]
          }
        }
      }, { from: page * 8, size: 8, hydrateOptions: { populate: 'tags', select: deepSelectsForCommodity } }, function(err, recommends) {
        var result = (recommends ? recommends.hits.hits : []);
        var total = recommends ? recommends.hits.total : 0;
        if (result !== null) result = reorganizeCommodities(result, false);
        res.json({ items: result, total: total, current: req.user });
      });
    });
  });

  /* 商品点赞. */
  router.post('/api/commodities/:id/zans', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error: '请您先登录.', status: 403 }); return; }

    var cid = req.params.id;
    var uid = req.user.id;

    if(__.isNotMongoId(cid) || __.isNotMongoId(uid)) { res.json({ status:500, result: 0, error: 'Not found commodity or user' }); return; }

    Zan.find({ commodity: cid }).select('user').exec(function(err, zans) {
      var users = _.map(zans, function(z) { return z.user.toString(); });
      // 判断是否点过
      if (users.indexOf(uid) > -1) { res.json({ result: zans.length }); return; }

      var zan = new Zan({ user:uid, commodity:cid });
      zan.save(function(err) {
        Commodity.findById(cid, function(err, c) {
          c.save(function(err) {
            var notice = new Notice({ type:NoticeTypes.commodity_zan, user:c.user, partner:zan.user, data:{ commodity:c.id } });
            notice.save(function(err) {
              if (err) res.json({ status:500, result:zans.length, error:err.message });
              else res.json({ status:200, result:c.zans_count, id:zan.id });
            });
          });
        });
      });
    });
  });

  /* 商品取消赞 */
  router.post('/api/commodities/:id/zans/cancel', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }

    var cid = req.params.id;
    var uid = req.user.id;

    if(__.isNotMongoId(cid) || __.isNotMongoId(uid)) { res.json({ status:500, result:0, error:'Not found commodity or user' }); return; }

    Zan.remove({ commodity:cid, user:uid }, function(err) {
      Commodity.findById(cid).exec(function(err, c) {
        c.save(function(err) { res.json({ status: err ? 500 : 200, result:c.zans_count, error:err ? err.message : null }); });
      });
    });
  });

  /* 商品评论. */
  router.post('/api/commodities/:id/comments', utils.token, function(req, res) {
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }
    if(__.isNotMongoId(req.params.id)) { res.json({ status:200, result:0 }); return; }

    var content = req.body.comment;
    if (_.isEmpty(content) || _.trim(content) === '') { res.json({ status:500, result:0, error:'not comment body' }); return; }

    Commodity.findById(req.params.id, function(err, c) {
      sendComment(req, c, !(_.isEmpty(req.body.parent) || _.isEmpty(req.body.main)), content, function(err, count) {
        res.json({ status:err ? 500 : 200, result:count, error:err ? err.message : null });
      });
    });
  });

  function sendComment(req, commodity, sub, content, callback) {
    var comment;
    var subComment;

    thunk(function(cb) {
      if(sub) {
        Comment.findById(req.body.parent, function(err, item) {
          if (!err && item) {
            comment = item;
            subComment = new SubComment({ c:content, user:req.user.id, main:req.body.main });
            comment.sub_comments.push(subComment);
          }
          comment.save(function(err) { cb(err, null); });
        });
      } else {
        comment = new Comment({ user:req.user.id, c:content, commodity:req.params.id });
        comment.save(function(err) { cb(err, null); });
      }
    })(function(error, result) {
      if(!comment && !subComment) { callback(error, 0); return; }

      commodity.save(function(err) {
        var notice = new Notice({
          type:sub ? NoticeTypes.commodity_comment_reply : NoticeTypes.commodity_comment,
          user:sub ? (subComment.main ? subComment.main : comment.user) : commodity.user,
          partner:sub ? subComment.user : comment.user,
          data:{ commodity:commodity.id, comment:comment.id }
        });

        notice.save(function(err) {
          // @ 通知
          var ats = content.match(/@.*?\s+?/g);
          ats = _.map(ats, function(at) { return at.replace('@', '').trim(); });
          User.find({ nickname:{ $in:ats } }, function(err, users) {
            var list = _.map(users, function(user, i) {
              return new Notice({
                type:NoticeTypes.commodity_comment_at,
                user:user,
                partner:comment.user,
                data:{ commodity:commodity.id, comment:comment.id }
              });
            });
            Notice.create(list, function(err) { callback(err, commodity.comments_count); });
          });
        });
      });
    });
  }

  /* 商品评论点赞 */
  router.post('/api/commodities/:id/comments/:cid/zan', utils.token, function(req, res) {
    var cid = req.params.cid;
    if(!req.isAuthenticated()) { res.json({ error:'请您先登录.', status:403 }); return; }
    if(__.isNotMongoId(req.params.id) || __.isNotMongoId(cid)) { res.json({ status:200, result:0 }); return; }

    Comment.findById(cid).deepPopulate(commentDeepItems).exec(function(err, c) {
      // 判断是否点过
      var zans = _.filter(c.zans, function(z) { return z.user.id === req.user.id; });
      if (zans && zans.length > 0) res.json({ result:c.zans_count, status:200 });
      else {
        var zan = new Zan({ user:req.user, comment:cid });
        zan.save(function(zerr) { c.save(function(err) { res.json({ status:err ? 500 : 200, result:c.zans_count, error:err ? err.message : null }); }); });
      }
    });
  });

  function reorganizeCommodities(items, ext) {
    _.each(items, function(item) {
      if(item.photos && item.photos.length > 1) {
        item.photos = _.sortBy(item.photos, 'position');
        item.photos = _.take(item.photos);
      }

      if(item && !ext) {
        item.tag = undefined;
        item.custom_tags = undefined;
        item.user = undefined;
      }
    });

    return items;
  }

  return router;
};
