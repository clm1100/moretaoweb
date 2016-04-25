/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var sha1 = require('sha1');
var urlencode = require('urlencode');
var wurl = require('wurl');
var request = require('request');
var express = require('express');
var router = express.Router();

module.exports = function(app, domain) {
  /* 微信中继接口 */
  router.get('/wechat/ticket', function(req, res) {
    var page = req.query.page;

    if (page && page.indexOf('from=singlemessage') > 0 && page.indexOf('&isappinstalled=0') < 0) page = page + '&isappinstalled=0';

    WeChatTicket.findOne({ appid:appid }).exec(function(err, ticket) {
      if (_.isEmpty(ticket)) { refreshTicket(appid, appsecret, page, null, res); return; }

      var difference = parseInt(new Date().getTime() / 1000) - ticket.at;

      // 如果超时
      if (difference > 7100) refreshTicket(appid, appsecret, page, ticket, res);
      else {
        var json = ticket.toJSON();
        var timestamp = parseInt(new Date().getTime() / 1000);
        json.at = timestamp;
        json.signature = wechatSignature(ticket, page, timestamp);

        res.json({ ticket:json });
      }
    });
  });

// 微信 access_token 接口
  router.get('/wechat/access_token', function(req, res) {
    getToken(appid, appsecret, function(token, error) {
      if(error) console.error(error);
      res.json(token);
    });
  });

  function getToken(appid, appsecret, cb) {
    WeChatAccessToken.findOne({ appid:appid }, function(err, token) {
      if(token) {
        var difference = parseInt(new Date().getTime() / 1000) - token.at;
        if (difference > 7100) refreshToken(appid, appsecret, function(data, err) { cb(data, err); });
        else cb(token, null);
      } else refreshToken(appid, appsecret, function(data, err) { cb(data, err); });
    });
  }

  function refreshToken(appid, appsecret, cb) {
    var accessTokenApi = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET';
    var url = accessTokenApi.replace('APPID', appid).replace('APPSECRET', appsecret);

    // 参考请求： http://localhost:7000/wechat/ticket?appid=wx8160a61c2d53fb74&appsecret=aa2c953465334823e20090156527a957
    request.get(url, function(error, response, body) {
      if(body) {
        WeChatAccessToken.findOne({ appid:appid }, function(err, token) {
          if (!token) token = new WeChatAccessToken();
          var data = JSON.parse(body);

          token.appid = appid;
          token.access_token = data.access_token;
          token.expires_in = data.expires_in;
          token.at = parseInt(new Date().getTime() / 1000);
          token.save(function(err) { cb(token, err); });
        });
      } else cb(null, error);
    });
  }

  function refreshTicket(appid, appsecret, page, ticket, res) {
    getToken(appid, appsecret, function(token, err) {
      if(err !== null) { res.json({ error:err }); return; }
      if(_.isEmpty(token.access_token)) { res.json({ error:err }); return; }

      // 获取 jsapi_ticket
      var ticketUrl = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=' + token.access_token + '&type=jsapi';

      request.get(ticketUrl, function(error, response, body) {
        var t = ticket === null ? new WeChatTicket() : ticket;
        var data = JSON.parse(body);

        if(!data.ticket) { res.json({ error:response }); return; }

        var timestamp = parseInt(new Date().getTime() / 1000);

        t.appid = appid;
        t.ticket = data.ticket;
        t.noncestr = sha1(new Date());
        t.expires_in = data.expires_in;
        t.at = timestamp;

        var signature = wechatSignature(t, page, timestamp);

        t.save(function(err) {
          var json = t.toJSON();
          json.at = timestamp;
          json.signature = signature;
          res.json({ ticket:json, error:err });
        });
      });
    });
  }

  /* 微信签名实现 */
  function wechatSignature(t, page, timestamp) {
    var string = 'jsapi_ticket=' + t.ticket + '&noncestr=' + t.noncestr + '&timestamp=' + timestamp + '&url=' + page;
    return sha1(string);
  }

  /* 微信授权接口 */
  router.get('/wechat/userinfo', function(req, res) {
    var cb = req.query.cb;
    res.cookie(wechatUserinfoCallbackUrl, cb);
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' +
          appid + '&redirect_uri=http://' + domain + '/wechat/userinfo/callback&response_type=code&scope=snsapi_userinfo#wechat_redirect';
    res.redirect(url);
  });

  router.get('/wechat/userinfo/callback', function(req, res) {
    var code = req.query.code;
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + appid + '&secret=' + appsecret + '&code=' + code + '&grant_type=authorization_code';
    request.get(url, function(error, response, body) {
      var json = JSON.parse(body);

      var refreshUrl = 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + appid + '&grant_type=refresh_token&refresh_token=' + json.refresh_token;

      request.get(refreshUrl, function(error, response, refresh) {
        var json = JSON.parse(refresh);
        var infoUrl = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + json.access_token + '&openid=' + json.openid + '&lang=zh_CN';
        request.get(infoUrl, function(error, response, info) {
          var callback = req.cookies[wechatUserinfoCallbackUrl];
          if(!callback || callback.length < 5) callback = '/';
          else {
            var protocol = wurl('protocol', callback);
            var hostname = wurl('hostname', callback);
            var path = wurl('path', callback);
            var query = wurl('query', callback);
            query = (query && query.length > 0) ? ('?' + query) : '';
            var hash = wurl('hash', callback);
            hash = (hash && hash.length > 0) ? ('#' + hash) : '';

            var str = '?data=';
            if(query && query.indexOf('?') > -1) str = '&data=';
            callback = protocol + '://' + hostname + path + query + str + encodeURIComponent(info) + hash;
          }

          res.redirect(callback);
        });
      });
    });
  });

  /* 微信静默授权接口 */
  router.get('/wechat/silent', function(req, res) {
    var cb = req.query.cb;
    res.cookie(wechatSilentCallbackUrl, cb);
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + appid +
          '&redirect_uri=http://' + domain + '/wechat/silent/callback&response_type=code&scope=snsapi_base#wechat_redirect';
    res.redirect(url);
  });

  router.get('/wechat/silent/callback', function(req, res) {
    var code = req.query.code;
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + appid + '&secret=' + appsecret + '&code=' + code + '&grant_type=authorization_code';

    request.get(url, function(error, response, body) {
      var callback = req.cookies[wechatSilentCallbackUrl];
      if(!callback || callback.length < 5) callback = '/';
      else {
        var protocol = wurl('protocol', callback);
        var hostname = wurl('hostname', callback);
        var path = wurl('path', callback);
        var query = wurl('query', callback);
        query = (query && query.length > 0) ? ('?' + query) : '';
        var hash = wurl('hash', callback);
        hash = (hash && hash.length > 0) ? ('#' + hash) : '';

        var str = '?data=';
        if(query && query.indexOf('?') > -1) str = '&data=';
        callback = protocol + '://' + hostname + path + query + str + encodeURIComponent(body) + hash;
      }

      res.redirect(callback);
    });
  });

  return router;
};
