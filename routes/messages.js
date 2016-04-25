/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var _u = require('./utils');
var express = require('express');
var router = express.Router();
var thunk = require('thunks')();
var fs = require('fs');
var gm = require('gm');
var UPYUN = require('upyun');

module.exports = function(utils) {
  /* 通知页 */
  router.get('/notices', utils.logged, function(req, res) {
    findNoticesByUser(req, res, req.user.id, 'html');
  });

  /* 通知页 */
  router.get('/api/users/:id/notices', function(req, res) {
    findNoticesByUser(req, res, req.params.id, 'json');
  });

  function findNoticesByUser(req, res, uid, format) {
    if(_u.isMongoId(uid)) {
      Notice.find({ user:uid }).populate('user partner').sort('-at').limit(20).exec(function(err, items) {
        if(format === 'json') res.json({ items:items, types:NoticeTypes });
        else res.render('notices', { items:items, types:NoticeTypes, current:req.user });
      });
    } else {
      if(format === 'json') res.json({ items:[], types:NoticeTypes });
      else res.render('notices', { items:[], types:NoticeTypes, current:req.user });
    }
  }

  /* 指定收信人的通知未读数量 */
  router.get('/api/notices/to/:id/unread', utils.token, function(req, res) {
    var uid = req.params.id;

    if(_u.isMongoId(uid)) Notice.count({ user:uid, is_read:false }).exec(function(err, count) { res.json({ count:count }); });
    else res.json({ status:500, error: 'Not found user' });
  });

  /* 通知读取 */
  router.post('/api/notices/:id/read', function(req, res) {
    var id = req.params.id;
    if(_u.isMongoId(id)) Notice.findByIdAndUpdate(id, { is_read:true }, { new:true }).exec(function(err, item) { res.json({ item:item, status:200 }); });
    else res.json({ item:null, status:200 });
  });

  // 读取全部的通知
  router.post('/api/notices/:user/readall', function(req, res) {
    Notice.update({ user:req.params.user, is_read:false }, { $set:{ is_read:true } }, { multi: true }, function(err, item) {
      res.json({ item:item, status:200 });
    });
  });

  /* 私信页 */
  router.get('/messages', utils.logged, function(req, res) {
    findMessagesByUser(req, res, req.user.id, 'html');
  });

  /* 指定用户的私信列表 */
  router.get('/api/users/:id/messages/list', function(req, res) {
    findMessagesByUser(req, res, req.params.id, 'json');
  });

  function findMessagesByUser(req, res, uid, format) {
    if(_u.isNotMongoId(req.params.id)) {
      if(format === 'json') res.json({ items:[] });
      else res.render('messages', { items:[], current:req.user });
      return;
    }

    Message.find({ to:uid }).populate('from to').sort('-at').exec(function(err, items) {
      var result = _.groupBy(items, function(n) { return n.from.nickname; });

      var datas = [];

      var count = 0;
      _.each(result, function(item, key) {
        _.each(item, function(m) { if(!m.is_read) count++; });
        datas.push({ nickname:key, unread:count, items:item });
        count = 0;
      });

      if(format === 'json') res.json({ items:datas });
      else res.render('messages', { items:datas, current:req.user });
    });
  }

  /* 读取指定收信人的全部的私信 */
  router.post('/api/messages/to/:id/readall', function(req, res) {
    if(_u.isMongoId(req.params.id)) {
      Message.update({ to:req.params.id, is_read:false }, { $set:{ is_read:true } }, { multi:true }, function(err, item) {
        res.json({ item:item, status:200 });
      });
    } else res.json({ item:null, error: '用户不存在', status:500 });
  });

  /* 指定发信人的私信列表 */
  router.get('/api/users/:id/messages/from/:nickname', function(req, res) {
    var nickname = _.trim(req.params.nickname);

    User.findOne({ nickname:nickname }, function(err, from) {
      if(_u.isMongoId(req.params.id)) {
        Message.find({ to:req.params.id, from:from.id }).populate('from to').sort('-at').exec(function(err, items) {
          var count = 0;
          _.each(items, function(m) { if(!m.is_read) count++; });
          res.json({ items:items, unread:count, from:from });
        });
      } else res.json({ items:[], unread:0, from:from });
    });
  });

  /* 指定收信人的私信未读数量 */
  router.get('/api/messages/to/:id/unread', utils.token, function(req, res) {
    if(_u.isMongoId(req.params.id)) Message.count({ to:req.params.id, is_read:false }).exec(function(err, count) { res.json({ count:count }); });
    else res.json({ count:0 });
  });

  /* 指定用户的未读数量（包含未读通知和私信） */
  router.get('/api/users/:id/unread/count', utils.token, function(req, res) {
    var uid = req.params.id;

    if(_u.isNotMongoId(uid)) { res.json({ status:500, error: '用户不存在' }); return; }

    thunk.all([
      thunk(function(cb) { Message.count({ to:req.params.id, is_read:false }).exec(function(err, count) { cb(err, count); }); }),
      thunk(function(cb) { Notice.count({ user:req.params.id, is_read:false }).exec(function(err, count) { cb(err, count); }); })
    ])(function(error, results) { res.json({ count: parseInt(results[0]) + parseInt(results[1]) }); });
  });

  /* 与某人聊天的信息列表 */
  router.get('/chat/:id', utils.logged, function(req, res) {
    chatWithSomebody(req, res, req.user.id, req.params.id, null, 'html');
  });

  /* 某人与某人聊天的信息列表 */
  router.get('/api/chat/:fid/to/:tid', function(req, res) {
    chatWithSomebody(req, res, req.params.tid, req.params.fid, null, 'json');
  });

  /* 与某人指定时间之后的聊天信息列表 */
  router.get('/chat/:id/:timestamp', utils.logged, function(req, res) {
    chatWithSomebody(req, res, req.user.id, req.params.id, new Date(parseInt(req.params.timestamp)), 'html');
  });

  /* 某人与某人指定时间之后的聊天信息列表 */
  router.get('/api/chat/:fid/to/:tid/:timestamp', function(req, res) {
    chatWithSomebody(req, res, req.params.tid, req.params.fid, new Date(parseInt(req.params.timestamp)), 'json');
  });

  function chatWithSomebody(req, res, tid, fid, upto, format) {
    if(_u.isNotMongoId(tid) || _u.isNotMongoId(fid)) {
      if(format === 'json') res.json({ items:[], from: null });
      else res.render('chat', { items:[], from: null, current:req.user, now:utils.moment().calendar() });
      return;
    }

    thunk.all([
      thunk(function(cb) {
        Message.update({ to:tid, from:fid, is_read:false }, { $set:{ is_read:true } }, { multi:true }).exec(function(err, count) { cb(err, count); });
      }),
      thunk(function(cb) {
        var cop = upto !== null ? { at: { $gt: upto } } : {};
        Message.find(cop).or([{ to:tid, from:fid }, { to:fid, from:tid }]).populate('from to').sort('at').exec(function(err, items) {
          cb(err, items);
        });
      }),
      thunk(function(cb) { User.findById(fid).exec(function(err, from) { cb(err, from); }); })
    ])(function(error, results) {
      if(format === 'json') res.json({ items:results[1], from: results[2] });
      else res.render('chat', { items:results[1], from: results[2], current:req.user, now:utils.moment().calendar() });
    });
  }

  /* 发消息给某人 */
  router.post('/api/chat/:fid/to/:tid', utils.uploader.single('photo'), function(req, res) {
    var msg = new Message({ from:req.params.fid, to:req.params.tid, msg:req.body.txt });

    thunk(function(cb) {
      var photo = req.file;
      if(photo && photo.path) {
        var path = photo.path;

        gm(path).autoOrient().write(path, function(err) {
          var upyun = new UPYUN('moretao-dev', 'moretao', 'zanmeichuanmei888', 'v0', 'legacy');

          upyun.uploadFile('/message/' + req.params.fid + '/' + photo.filename, photo.path, photo.mimetype, true, function(err, result) {
            msg.photo = photo.filename;
            cb(null, null);
          });
        });
      } else cb(null, null);
    })(function(error, results) {
      msg.save(function(err) {
        Message.populate(msg, 'from to', function(err) { res.json({ error:err ? err.message : null, item:msg, status: err ? 500 : 200 }); });
      });
    });
  });

  return router;
};
