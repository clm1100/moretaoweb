'use strict';
var _ = require('lodash');
var bcrypt = require('bcryptjs');
var express = require('express');
var router = express.Router();
var thunk = require('thunks')();
var request = require('request');
var urlencode = require('urlencode');
var path = require('path');
var uuid = require('uuid');
var crypto = require('crypto');

module.exports = function(utils) {
  /* 首页 */
  router.get('/', function(req, res) {
    res.cookie('moretao_return_url', req.url);
    goHome(req, res, 'html');
  });

  /* API 首页 */
  router.get('/api/home', function(req, res) {
    goHome(req, res, 'json');
  });

  function goHome(req, res, format) {
    var start = utils.moment().startOf('day').toDate(), end = utils.moment().endOf('day').toDate();
    var or = [{ start:{ $gte:start }, end:{ $lte:end } }, { start:{ $exists:false }, end:{ $exists:false } }, { start:null, end:null }];

    thunk.all([
      // 有时间限制且在时间限制内, 或者无时间限制的广告
      thunk(function(cb) { Ad.find({ type:AdTypes.banner.v }).or(or).sort('-start position').exec(function(err, ads) { cb(err, ads); }); }),
      // 首页 Tabs
      thunk(function(cb) { Tab.find().or(or).populate('ads').exec(function(err, items) { cb(err, items); }); }),
      // 有时间限制且在时间限制内, 或者无时间限制的首页功能
      thunk(function(cb) { Ad.find({ type:AdTypes.ability.v }).or(or).sort('-start position').exec(function(err, ads) { cb(err, ads); }); }),
      // 首页推荐 Fragments
      thunk(function(cb) { Fragment.find({ group:FragmentGroupNames.home_main }).sort('order').populate('ads').exec(function(err, items) { cb(err, items); }); }),
      // 当前用户关注的人
      thunk(function(cb) {
        if(req.user) Follow.find({ fan_id:req.user.id }).select('user_id').exec(function(err, items) { cb(err, items); });
        else cb(null, null);
      })
    ])(function(error, results) {
      var follows = _.map(results[4], function(f) { return f.user_id; });

      if(format === 'json') res.json({ banners:results[0], tabs:results[1], funcs:results[2], fragments:results[3] });
      else res.render('home', { banners:results[0], tabs:results[1], funcs:results[2], fragments:results[3], current:req.user });
    });
  }

  // 图片上传签名
  router.post('/api/photos/upload/signature', function(req, res) { res.json(createImageUploadSignature(req, '/photo/f/')); });

  // 头像上传签名
  router.post('/api/avatars/upload/signature', function(req, res) { res.json(createImageUploadSignature(req, '/user/avatar/')); });

  // 图片上传签名
  router.post('/api/idcards/upload/signature', function(req, res) { res.json(createImageUploadSignature(req, '/idcards/')); });

  /* 全局转发器 Get */
  router.get('/api/outdata', function(req, res) { request.get(urlencode.decode(req.query.url)).pipe(res); });

  /* 全局转发器 Post */
  router.post('/api/outdata', function(req, res) { request.post(urlencode.decode(req.body.url)).form(req.body).pipe(res); });

  function createImageUploadSignature(req, dir) {
    var filename = req.body.filename;
    var expiration = req.body.expiration;
    var ext = path.extname(filename);
    var apikey = 'DhbmJa4RXVYhrFDjTiK1NY4aaVg=';
    var newname = uuid.v4() + ext;
    var bucket = 'moretao-dev';
    var savekey = dir + newname;
    var policy = new Buffer(JSON.stringify({ bucket:bucket, expiration:expiration, 'save-key':savekey, 'x-gmkerl-rotate':'auto' })).toString('base64');
    var signature = crypto.createHash('md5').update(policy + '&' + apikey).digest('hex');

    return { policy:policy, signature:signature, filename:newname };
  }

  return router;
};
