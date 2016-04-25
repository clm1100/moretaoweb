/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var __ = require('./utils');
var express = require('express');
var router = express.Router();
var urlencode = require('urlencode');
var thunk = require('thunks')();

module.exports = function(utils) {
  /* 分类搜索页 */
  router.get('/search', function(req, res) {
    res.cookie('moretao_return_url', req.url);
    res.render('search', { current:req.user });
  });

  router.get('/search/:type/:key', function(req, res) {
    res.cookie('moretao_return_url', req.url);
    var params = req.params;
    res.render('search-result', { key:params.key, type:params.type, keyword:(params.type === 'keyword' ? params.key : ''), current:req.user });
  });

  /* 分类搜索 Top N */
  router.get('/api/search/hots/:number', function(req, res) {
    var number = parseInt(req.params.number);
    if(!number || number < 1) number = 10;

    SearchHistory.find().limit(number).sort('-count').exec(function(err, list) { res.json({ hots:list }); });
  });

  /* 分类搜索结果页 */
  router.get('/api/search/:type/:key/:page', function(req, res) { search(req, res); });

  /* 分类搜索结果过滤页 */
  router.get('/api/search/:type/:key/:page/:filter', function(req, res) { search(req, res); });

  /* 分类搜索 */
  function search(req, res) {
    var cop = {}, sort = { at:-1, zans_count:-1 }, params = {}, updateOption = { upsert:true, new:true };

    if(req.params.filter) params = JSON.parse(req.params.filter);
    if(params.category && params.category.length > 0) _.set(cop, 'categories', params.category);
    if(params.tags && params.tags.length > 0) _.set(cop, 'tags.$in', params.tags);
    if(params.sort && params.sort.length > 0) sort = JSON.parse(params.sort);

    if(_.isEmpty(req.params.key)) { res.json({ items:null }); return; }

    var type = req.params.type;
    var key = urlencode.decode(req.params.key);
    var page = parseInt(req.params.page);
    if(!page) page = 0;

    // 关键字搜索
    if(type === 'keyword') {
      var keyword = __.replacePunctuations(key);
      var query = { $regex:new RegExp('^' + (key === '*' ? '.*' : key) + '$', 'i') };
      var tagQuery = key === '*' ? [{ t:null }] : [{ t:query }, { synonyms:query }];
      Tag.find().or(tagQuery).exec(function(err, tags) {
        var tag;
        if(tags && tags.length > 0) {
          tag = tags[0];
          key = key + tag.synonyms.join(' ') + tag.associations.join(' ');
          query = { $regex:new RegExp('^' + tag.t + '$', 'i') };
          keyword = tag.t;
        }

        // 生成过滤条件
        var terms = [{ term:{ is_publish:true } }];

        if(cop) {
          _.each(cop, function(val, key) {
            if(key === 'tags') _.each(val.$in, function(t) { terms.push({ term:{ tags:t } }); });
            else {
              var term = {};
              _.set(term, 'term.' + key, val);
              terms.push(term);
            }
          });
        }

        var sortItem = {};
        var sortKeys = _.keys(sort);
        if(sort && sortKeys.length > 0) _.set(sortItem, sortKeys[0], parseInt(sort[sortKeys[0]]) === -1 ? 'desc' : 'asc');
        else sortItem = { at:'desc' };
        var filter = { bool:{ must:terms } };

        var searchQuery = key === '*' ? { query_string:{ query:'*' } } : { multi_match:{ type:'phrase', query:keyword, fields:['t', 'keywords'] } };

        Commodity.search({
          filtered: {
            query:searchQuery,
            filter:filter
          }
        }, { sort: sortItem, from:page * 20, size:20 }, function(err, results) {
          var items = results ? results.hits.hits : [], total = results ? results.hits.total : 0;
          thunk.all([
            thunk(function(cb) {
              if(_.isObject(key)) SearchHistory.findOneAndUpdate({ t:key }, { $set:{ t:key }, $inc:{ count:1 } }, updateOption).exec(function(err, h) { cb(err, h); });
              else cb(null, null);
            }),
            thunk(function(cb) {
              if(tag) Fragment.find({ group:'tag_' + tag.id }).populate('ads').exec(function(err, items) { cb(err, items); }); else cb(null, []);
            })
          ])(function(error, results) {
            res.json({ items:reorganizeCommodities(items), total:total, fragments:results[1], tag:tag });
          });
        });
      });
    }

    // 活动搜索
    if(type === 'activity') {
      var title = '#' + key + '#';
      var or = [{ d:{ $regex:new RegExp(title, 'i') } }];

      thunk.all([
        thunk(function(cb) {
          Commodity.find(cop).or(or).deepPopulate(commodityDeepItems).sort(sort).skip(page * 20).limit(20).exec(function(err, items) {
            cb(err, reorganizeCommodities(items));
          });
        }),
        thunk(function(cb) { Commodity.count(cop).or(or).exec(function(err, total) { cb(err, total);}); }),
        thunk(function(cb) { Activity.findOne({ t:key }).exec(function(err, activity) { cb(err, activity);}); }),
        thunk(function(cb) { SearchHistory.findOneAndUpdate({ t:key }, { $set:{ t:key }, $inc:{ count:1 } }, updateOption).exec(function(err, h) { cb(err, h); }); })
      ])(function(error, results) { res.json({ items: results[0], total:results[1], activity:results[2] }); });
    }

    // 分类搜索
    if(type === 'category') {
      if(key === 'is_abroad') _.set(cop, 'is_abroad', true);
      else _.set(cop, 'categories', key);

      thunk.all([
        thunk(function(cb) {
          Commodity.find(cop).deepPopulate(commodityDeepItems).sort(sort).skip(page * 20).limit(20).exec(function(err, items) {
            cb(err, reorganizeCommodities(items));
          });
        }),
        thunk(function(cb) { Commodity.count(cop).exec(function(err, total) { cb(err, total);}); }),
        // 相关 Fragments
        thunk(function(cb) { Fragment.find({ group:'category_' + key }).populate('ads').exec(function(err, items) { cb(err, items); }); })
      ])(function(error, results) { res.json({ items:results[0], fragments:results[2], total:results[1] }); });
    }

    // 标签搜索
    if(type === 'tag') {
      if(!cop.tags) cop.tags = key;
      else {
        var tags = cop.tags.$in;
        if(tags) tags.push(key);
        _.set(cop, 'tags', { $all:tags });
      }

      thunk.all([
        // Tag
        thunk(function(cb) { Tag.findById(key, function(err, t) { cb(err, t); }); }),
        // 分页数据
        thunk(function(cb) {
          Commodity.find(cop).deepPopulate(commodityDeepItems).sort(sort).skip(page * 20).limit(20).exec(function(err, items) {
            cb(err, reorganizeCommodities(items));
          });
        }),
        // 分页数据总数
        thunk(function(cb) { Commodity.count(cop).exec(function(err, total) { cb(err, total);}); }),
        // 相关 Fragments
        thunk(function(cb) { Fragment.find({ group:'tag_' + key }).populate('ads').exec(function(err, items) { cb(err, items); }); })
      ])(function(error, results) {
        var t = results[0];
        res.json({ tag:t, items: results[1], total:results[2], fragments:results[3], tag_count:t ? t.count : 0 });
      });
    }
  }

  function reorganizeCommodities(items) {
    _.each(items, function(item) {
      if(item) {
        if(item.photos && item.photos.length > 1) {
          item.photos = _.sortBy(item.photos, 'position');
          item.photos = _.take(item.photos);
        }
        item.user = undefined;
        item.tags = undefined;
        item.custom_tags = undefined;
      }
    });

    return items;
  }

  return router;
};
