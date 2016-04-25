/* eslint no-console: [2, { allow: ["info", "warn", "error"] }] */

'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var thunk = require('thunks')();
var schedule = require('node-schedule');

/* 管理员 */
module.exports = function(utils) {
  // 每小时一次任务
  var perHourjob = schedule.scheduleJob('0 0 * * * *', function() {
    perHourTask();
  });

  function perHourTask() {
    console.info(new Date() + ' - 开始执行每小时任务');
    var sort = '-count';
    thunk.all([
      thunk(function(cb) { Tag.find({ list:'brand' }).limit(50).sort(sort).exec(function(err, data) { cb(err, data); }); }),
      thunk(function(cb) { Tag.find({ list:'ip' }).limit(50).sort(sort).exec(function(err, data) { cb(err, data); }); }),
      thunk(function(cb) { Tag.find({ list:'works' }).limit(50).sort(sort).exec(function(err, data) { cb(err, data); }); }),
      thunk(function(cb) { SearchHistory.find().limit(10).sort(sort).exec(function(err, list) { cb(err, list);}); })
    ])(function(error, result) {
      // 生成预置 Hots JS 文件
      var brand = _.map(result[0], function(t) { return '"' + t.t + '"'; }).join(',');
      var ip = _.map(result[1], function(t) { return '"' + t.t + '"'; }).join(',');
      var works = _.map(result[2], function(t) { return '"' + t.t + '"'; }).join(',');
      var search = _.map(result[3], function(t) { return '"' + t.t + '"'; }).join(',');

      var devFile = __dirname + '/../assets/javascripts/hots.js';
      var pubFile = __dirname + '/../public/javascripts/hots.js';

      // 生成 JS 变量定义字符串
      var topBrandList = 'var top_brand_list = [' + brand + '];\n';
      var topIpList = 'var top_ip_list = [' + ip + '];\n';
      var topWorksList = 'var top_works_list = [' + works + '];\n';
      var topSearchList = 'var top_search_list = [' + search + '];\n';

      var checkComments = [
        '/* eslint camelcase: 0 */',
        '/* eslint quotes: 0 */',
        '/* eslint comma-spacing: 0 */',
        '/* eslint max-len: 0 */'
      ];
      var body = checkComments.join('\n') + '\n' + topBrandList + topIpList + topWorksList + topSearchList;

      fs.writeFile(utils.isDevelopment ? devFile : pubFile, body, function(err) {
        if(err) console.error(err);
        else console.info(new Date() + ' - 执行每小时任务成功');
      });
    });
  }

  return schedule;
};
