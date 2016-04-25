/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var _u = require('./utils');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  /* 详情页 */
  router.get('/favorites/:id', utils.logged, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    getFavoriteInfo(req, res, 'html');
  });

  /* 收藏夹详情 API */
  router.get('/api/favorites/:id', function(req, res) {
    getFavoriteInfo(req, res, 'json');
  });

  function getFavoriteInfo(req, res, format) {
    var id = req.params.id;

    if(_u.isMongoId(id)) {
      Favorite.findById(id).deepPopulate('commodities, commodities.tags').exec(function(err, item) {
        if(item) {
          _.each(item.commodities, function(item) {
            item.photos = _.sortBy(item.photos, 'position');
            item.user = null;
          });
        }

        if(format === 'json') res.json({ item: item });
        else res.render('favorites', { item: item, current:req.user });
      });
    } else {
      if(format === 'json') res.json({ item: null });
      else res.render('favorites', { item: null, current:req.user });
    }
  }

  // 删除商品
  router.delete('/api/favorites/:id/commodities/:cid', function(req, res) {
    var id = req.params.id;
    var cid = req.params.cid;

    if(_u.isMongoId(id)) {
      Favorite.findById(id, function(err, item) {
        var array = item.commodities;
        _.remove(array, function(ccid) { return ccid && ccid.toString() === cid; });
        if(!array) array = [];
        Favorite.update({ _id:id }, { $set:{ commodities:array } }, function(err) {
          if(err) res.json({ status:500, error:err.message, item:item });
          else res.json({ status:200, item:item });
        });
      });
    } else res.json({ status:200, item:null });
  });

  // 增加商品
  router.post('/api/favorites/:id/commodities/:cid', function(req, res) {
    var cid = req.params.cid;
    var fid = req.params.id;

    if(_u.isMongoId(fid) && _u.isMongoId(cid)) {
      Favorite.findById(fid).exec(function(err, item) {
        var array = item.commodities;
        array.push(_.trim(cid));
        array = _.uniqBy(array, function(id) { return id.toString(); });
        Favorite.update({ _id:(item.id) }, { $set:{ commodities:array } }, function(err) {
          Commodity.findById(cid, function(err, c) {
            c.save(function(err) { res.json({ collect_count: c.collect_count, item:item, error: err ? err.message : null, status: err ? 500 : 200 }); });
          });
        });
      });
    } else res.json({ collect_count: 0, item: null, status: 200 });
  });

  // 删除整个收藏夹
  router.delete('/api/favorites/:id', function(req, res) {
    var id = req.params.id;
    if(_u.isMongoId(id)) {
      Favorite.findById(id).remove(function(err) {
        if(err) res.json({ status:500, error:err.message });
        else res.json({ status:200 });
      });
    } else res.json({ status:200 });
  });

  // 创建一个新的
  router.post('/api/favorites/new', function(req, res) {
    var id = req.body.id;
    var datas = { t:req.body.t, user:req.body.uid, is_open:true };

    var cop = _u.isMongoId(id) ? { _id:id } : _.omit(datas, ['is_open']);
    Favorite.findOne(cop).exec(function(err, item) {
      if(!item) item = new Favorite(datas);
      else {
        item.t = datas.t;
        item.user = datas.user;
      }
      item.save(function(err) { res.json({ status: err ? 500 : 200, error: err ? err.message : null, item:item }); });
    });
  });

  // 修改收藏夹是否公开
  router.post('/api/favorites/:id/is_open', function(req, res) {
    var id = req.params.id;
    var isOpen = req.body.is_open;

    if(_u.isMongoId(id)) {
      Favorite.update({ _id:id }, { $set:{ is_open:isOpen } }, function(err) {
        if(err) res.json({ status:500, error:err.message });
        else res.json({ status:200 });
      });
    } else res.json({ status:200 });
  });

  // 修改收藏夹名字
  router.post('/api/favorites/:id/name', function(req, res) {
    var id = req.params.id;
    if(_u.isMongoId(id)) {
      Favorite.update({ _id:id }, { $set:{ t:_.trim(req.body.name) } }, function(err) {
        if(err) res.json({ status:500, error:err.message });
        else res.json({ status:200 });
      });
    } else res.json({ status:200 });
  });

  return router;
};
