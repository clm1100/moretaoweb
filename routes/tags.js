/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var __ = require('./utils');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var thunk = require('thunks')();

module.exports = function(utils) {
  /* 过滤器相关列表 */
  router.get('/api/tags/filters', function(req, res) {
    var filters = [TagGroupNames.filter_category, TagGroupNames.filter_sex, TagGroupNames.filter_age, TagGroupNames.filter_sort];
    Tag.find({ list:{ $in:filters } }).sort('position').exec(function(err, items) {
      if(items) items = _.groupBy(items, 'list');

      var list = [];

      list.push(items[TagGroupNames.filter_category]);

      _.each(items, function(val, key) {
        if(key !== TagGroupNames.filter_category && key !== TagGroupNames.filter_sort) list.push(val);
      });

      list.push(items[TagGroupNames.filter_sort]);

      res.json({ items:list });
    });
  });

  /* Tags By List 搜索 */
  router.get('/api/tags/list/:name', function(req, res) {
    Tag.find({ list:req.params.name }).sort('position').exec(function(err, items) { res.json({ items:items }); });
  });

  /* Tag 详情 API */
  router.get('/api/tags/:id', function(req, res) { getItem(req, res, 'json'); });

  /* Tag 详情页 */
  router.get('/tags/:id', function(req, res) { getItem(req, res, 'html'); });

  function getItem(req, res, format) {
    var id = req.params.id;
    if(__.isNotMongoId(id)) { if(format === 'html') res.redirect('/'); else res.json({ status:500, item:null, fragments:[] }); return; }

    thunk.all([
      // 有时间限制且在时间限制内, 或者无时间限制的广告
      thunk(function(cb) { Tag.findById(id).exec(function(err, item) { cb(err, item); }); }),
      // 推荐 Tab Tags
      thunk(function(cb) { Tag.find({ list:TagGroupNames.home_tabs }).exec(function(err, items) { cb(err, items); }); }),
      // tag 相关 Fragments
      thunk(function(cb) { Fragment.find({ group:'tag_' + id }).populate('ads').exec(function(err, items) { cb(err, items); }); })
    ])(function(error, results) {
      if(format === 'html') res.render('tag', { status:error ? 500 : 200, error:error, item:results[0], tabs:results[1], fragments:results[2], current: req.user });
      else res.json({ status:error ? 500 : 200, error:error, item:results[0], tabs:results[1], fragments:results[2] });
    });
  }

  return router;
};
