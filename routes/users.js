/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var __ = require('./utils');
var express = require('express');
var router = express.Router();
var notp = require('notp');
var fs = require('fs');
var thunk = require('thunks')();
var UPYUN = require('upyun');
var gm = require('gm');
var SMSService = require('yunpiansms');
var sms = new SMSService('4d253f6279ea4f9b66ec9dad6e3eba69');

module.exports = function(utils) {
  /* 当前登录用户个人首页 */
  router.get('/user', utils.logged, function(req, res) {
    res.redirect('/users/' + req.user.id);
  });

  /* 用户个人首页 */
  router.get('/users/:id', utils.logged, function(req, res) {
    getUser(req, res, false);
  });

  /* 用户个人详细信息 API */
  router.get('/api/users/:id', function(req, res) {
    getUser(req, res, true);
  });

  /* 用户地址管理 API */
  router.get('/user-location', utils.token, utils.logged, function(req, res) {
    if(req.user) {
      Address.find({ user:req.user.id }).sort({ is_default:-1 }).exec(function(err, items) {
        res.render('user-location', { items:items, uid:req.user.id });
      });
    } else res.render('user-location', { items:null });
  });

  function getUser(req, res, json) {
    var uid = req.params.id;
    if(__.isNotMongoId(uid)) { if(json) res.json({ item:null, status:404 }); else res.redirect('/'); return; }
    thunk.all([
      thunk(function(cb) { User.findById(uid).populate('tags').exec(function(err, item) { cb(err, item); }); }),
      thunk(function(cb) {
        Favorite.find({ user:uid }).deepPopulate('commodities').sort('at').exec(function(err, favorites) {
          _.each(favorites, function(f) {
            _.each(f.commodities, function(item) {
              item.photos = _.sortBy(item.photos, 'position');
              item.user = null;
              item.tags = null;
            });
          });

          cb(err, favorites);
        });
      }),
      thunk(function(cb) {
        Zan.find({ user:uid, topic:{ $ne:null } }, function(err, zs) {
          var ids = _.map(zs, function(zan) { return zan.topic; });

          Topic.find({ _id:{ $in:ids } }).select(tinySelectsForTopic).sort('-at').exec(function(err, topics) {
            _.each(topics, function(item) { item.c = null; });

            cb(err, topics);
          });
        });
      }),
      thunk(function(cb) {
        Zan.find({ user:uid, activity:{ $ne:null } }, function(err, zs) {
          var ids = _.map(zs, function(zan) { return zan.activity; });

          Activity.find({ _id:{ $in:ids } }).select(tinySelectsForActivity).sort('-at').exec(function(err, activities) {
            _.each(activities, function(item) { item.c = null; });

            cb(err, activities);
          });
        });
      }),
      thunk(function(cb) {
        var select = 't d p price currency photos zans_count comments_count';
        Commodity.find({ user:uid }).select(select).sort('-at').exec(function(err, commodities) {
          _.each(commodities, function(item) { item.photos = _.sortBy(item.photos, 'position'); });

          cb(err, commodities);
        });
      }),
      thunk(function(cb) { Notice.count({ user:uid, is_read:false }, function(err, notices) { cb(err, notices); }); }),
      thunk(function(cb) {
        User.getFollowers(uid, function(err, followers) {
          if(followers && followers.items) _.each(followers.items, function(item) { item.tags = null; });

          cb(err, followers);
        });
      }),
      thunk(function(cb) {
        User.getFans(uid, function(err, fans) {
          if(fans && fans.items) _.each(fans.items, function(item) { item.tags = null; });

          cb(err, fans);
        });
      }),
      thunk(function(cb) { Message.count({ to:uid, is_read:false }, function(err, count) { cb(err, count); }); }),
      thunk(function(cb) {
        var params = (req.user && uid === req.user.id) ? { user:uid } : { user:uid, is_open:true };
        Favorite.count(params).exec(function(err, count) { cb(err, count); });
      }),
      thunk(function(cb) { Account.findOne({ user:uid }).select('points').exec(function(err, item) { cb(err, item); }); }),
      thunk(function(cb) {
        Hobby.findOne({ user:uid }).populate('tags').exec(function(err, item) {
          if(!err && item) cb(null, item.tags);
          else cb(err, null);
        });
      })
    ])(function(error, results) {
      var params = {
        item:results[0],
        favorites:results[1],
        topics:results[2],
        activities:results[3],
        commodities:results[4],
        notices:results[5],
        followers:results[6],
        fans:results[7],
        messages:results[8],
        open_favorites_count:results[9],
        account:results[10],
        hobbies:results[11]
      };

      thunk(function(cb) {
        // 用户默认收藏夹处理
        if(results[1].length <= 0) {
          var item = new Favorite({ t:'默认', user:req.params.id, is_open:true });
          item.save(function(err) { cb(err, null); });
        } else cb(null, null);
      })(function(error, results) {
        if(json) res.json(params);
        else { params.current = req.user; res.render('user', params); }
      });
    });
  }

  /* 用户个人信息页 */
  router.get('/users/:id/info', utils.token, function(req, res) {
    if(__.isMongoId(req.params.id)) {
      thunk.all([
        thunk(function(cb) { User.findById(req.params.id).exec(function(err, item) { cb(err, item); }); }),
        thunk(function(cb) { Account.findOne({ user:req.params.id }).select('points').exec(function(err, item) { cb(err, item); }); })
      ])(function(error, results) {
        res.render('user-info', { item:results[0], account:results[1] });
      });
    } else res.render('user-info', { item:null, account:null });
  });

  /* 用户个人信息页 */
  router.get('/api/users/:id/info/public', function(req, res) {
    if(__.isMongoId(req.params.id)) User.findById(req.params.id).select('public').exec(function(err, item) { res.json({ public:item.public }); });
    else res.json({ public:false });
  });

  /* 用户个人信息保存 */
  router.post('/users/:id/info', utils.uploader.single('avatar'), utils.logged, function(req, res) {
    userSave(req, res, 'html');
  });

  /* 检查是否有重复昵称*/
  router.get('/api/users/exist/:nickname', function(req, res) {
    User.count({ nickname:req.params.nickname }).exec(function(err, count) { res.json({ result:count }); });
  });

  /* 检查是否有重复电话号码*/
  router.get('/api/users/exist/mobile/:mobile', function(req, res) {
    User.count({ mobile:req.params.mobile }).exec(function(err, count) { res.json({ result:count }); });
  });

  /* 用户个人信息保存 API */
  router.post('/api/users/:id/info', utils.uploader.single('avatar'), function(req, res) {
    userSave(req, res, 'json');
  });

  function userSave(req, res, format) {
    var id = req.params.id;
    if(__.isNotMongoId(id)) {
      if (format !== 'json') res.render('user-info', { item:null });
      else res.json({ item:null, status:200 });
      return;
    }

    User.findById(id).exec(function(err, item) {
      if(!item) {
        if (format !== 'json') res.render('user-info', { item:null });
        else res.json({ item:item, status:500, error:new Error('用户已失效') });
        return;
      }

      var newNickname = req.body['nickname-update'];
      var newSex = req.body['sex-update'];
      var newBirthday = req.body['birthday-update'];

      var needSave = false;

      if(newNickname && newNickname !== item.nickname) { item.nickname = newNickname; needSave = true; }
      if(newSex && newSex !== item.sex) { item.sex = parseInt(newSex); needSave = true; }
      if(newBirthday && newBirthday === '未知') { item.birthday = null; needSave = true; }

      if (newBirthday && newBirthday !== '未知' && newBirthday !== utils.moment(item.birthday).format('YYYY-MM-DD')) {
        item.birthday = utils.moment(newBirthday, 'YYYY-MM-DD');
        needSave = true;
      }

      if (req.file) needSave = true;

      // 如果不需要保存
      if(!needSave) {
        if (format !== 'json') res.render('user-info', { item:item });
        else res.json({ item:item, status:200 });
        return;
      }

      item.pass = null;

      thunk(function(cb) {
        if (req.file && req.file.path) {
          var path = req.file.path;

          gm(path).autoOrient().write(path, function(err) {
            var avatar = req.file;
            var upyun = new UPYUN('moretao-dev', 'moretao', 'zanmeichuanmei888', 'v0', 'legacy');

            upyun.uploadFile('/user/avatar/' + avatar.filename, avatar.path, avatar.mimetype, true, function(err, result) {
              item.avatar = avatar.filename;
              cb(err, null);
            });
          });
        } else cb(null, null);
      })(function(error, results) {
        item.save(function(err) {
          if (format !== 'json') res.render('user-info', { item:item, status:err ? 500 : 200, error:err ? err.message : null });
          else res.json({ item:item, status:err ? 500 : 200, error: err ? err.message : null });
        });
      });
    });
  }

  /* 用户个人信息页 */
  router.get('/users/search/:nickname', utils.logged, function(req, res) {
    getUserInfoByNickname(req, res, req.params.nickname, 'html');
  });

  /* 用户昵称转换 ID API */
  router.get('/api/users/search/:nickname', function(req, res) {
    getUserInfoByNickname(req, res, req.params.nickname, 'json');
  });

  function getUserInfoByNickname(req, res, nickname, format) {
    User.findOne({ nickname:nickname }).exec(function(err, item) {
      var path = item ? ('/users/' + item.id) : '/';
      var id = item ? item.id : null;

      if (format === 'json') res.json({ id:id });
      else res.redirect(path);
    });
  }

  /* 用户关注列表页 */
  router.get('/users/:id/followers', utils.logged, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    findUserFollowsAndFans(req, res, 'user-followers');
  });

  /* 用户粉丝列表页 */
  router.get('/users/:id/fans', utils.logged, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    findUserFollowsAndFans(req, res, 'user-fans');
  });

  /* 用户相关用户列表 api */
  router.get('/api/users/:id/friends', function(req, res) {
    findUserFollowsAndFans(req, res, null, true);
  });

  function findUserFollowsAndFans(req, res, render, json) {
    var id = req.params.id;
    if(__.isNotMongoId(id)) {
      if(json) res.json({ item:null, followers:[], fans:[] });
      else res.render(render, { item:null, followers:[], fans:[], current:req.user });
      return;
    }

    thunk.all([
      thunk(function(cb) { User.findById(id).exec(function(err, item) { cb(err, item); }); }),
      thunk(function(cb) {
        User.getFollowers(id, function(err, followers) {
          cb(err, followers);
        });
      }),
      thunk(function(cb) {
        User.getFans(id, function(err, fans) {
          cb(err, fans);
        });
      })
    ])(function(error, results) {
      if(json) res.json({ item:results[0], followers:results[1], fans:results[2] });
      else res.render(render, { item:results[0], followers:results[1], fans:results[2], current:req.user });
    });
  }

  /* 用户添加关注 */
  router.post('/api/users/:id/follow/:fid', function(req, res) {
    var id = req.params.id;
    var fid = req.params.fid;
    if (__.isNotMongoId(id) || __.isNotMongoId(fid) || id === fid) { res.json({ item:id, error:null }); return; }
    thunk.all([
      thunk(function(cb) { User.findById(id).select('id').exec(function(err, me) { cb(err, me); }); }),
      thunk(function(cb) { User.findById(fid).select('id').exec(function(err, user) { cb(err, user); }); })
    ])(function(error, results) {
      var me = results[0];
      var user = results[1];

      if(_.isEmpty(me) || _.isEmpty(user)) { res.json({ error:'not found user or follower', status:500 }); return; }

      User.followed(me.id, user.id, function(err, is) {
        if(is) { res.json({ item:me }); return; }

        var follow = new Follow({ user_id:user.id, fan_id:me.id });
        follow.save(function(err) {
          var notice = new Notice({ type:NoticeTypes.follow, user:user.id, partner:me.id });
          notice.save(function(err) { res.json({ item:me, error:err ? err.message : null, status:err ? 500 : 200 }); });
        });
      });
    });
  });

  /* 用户取消关注 */
  router.post('/api/users/:id/unfollow/:fid', function(req, res) {
    var id = req.params.id;
    var fid = req.params.fid;
    if (__.isNotMongoId(id) || __.isNotMongoId(fid) || id === fid) { res.json({ error:'not found user or follower', status:500 }); return; }
    thunk.all([
      thunk(function(cb) { User.findById(id).select('id').exec(function(err, me) { cb(err, me); }); }),
      thunk(function(cb) { User.findById(fid).select('id').exec(function(err, user) { cb(err, user); }); })
    ])(function(error, results) {
      var me = results[0];
      var user = results[1];
      if(_.isEmpty(me) || _.isEmpty(user)) { res.json({ error:'not found user or follower', status:500 }); return; }

      Follow.remove({ user_id:user.id, fan_id:me.id }, function(err) {
        res.json({ item:me, error:err ? err.message : null, status:err ? 500 : 200 });
      });
    });
  });

  /* 用户添加关注标签 */
  router.post('/api/users/:id/tags/:tid', function(req, res) {
    var id = req.params.id;
    var tid = req.params.tid;
    if (__.isNotMongoId(id) || __.isNotMongoId(tid)) { res.json({ error:'not found user or tag', status: 500 }); return; }

    Hobby.findOneAndUpdate({ user:id }, { $set:{ user:id }, $addToSet:{ tags:tid } }, { upsert:true, new:true }).exec(function(err, hobby) {
      if(err) {
        res.json({ error:'not found user or tag', status: 500 });
      }else{
        Tag.findById(tid, function(err, item) {
          res.json({ error: err ? err.message : null, tag: item, status: 200 });
        });
      }
    });
  });

  /* 用户取消关注标签 */
  router.delete('/api/users/:id/tags/:tid', function(req, res) {
    var id = req.params.id;
    var tid = req.params.tid;
    if (__.isNotMongoId(id) || __.isNotMongoId(tid)) { res.json({ error:'not found user or tag', status:500 }); return; }
    Hobby.findOne({ user:req.params.id }).exec(function(err, me) {
      if(me && me.tags) {
        me.tags = _.remove(me.tags, function(t) { return t.toString() !== tid; });
        me.save(function(err) { res.json({ error: null, status: 200 }); });
      } else res.json({ error: 'not found user or tag', status: 500 });
    });
  });

  /* 用户个人首页收藏夹 */
  router.get('/api/users/:id/favorites', function(req, res) {
    var id = req.params.id;
    if(__.isMongoId(id)) {
      Favorite.find({ user:id }).populate('commodities').sort('-at').exec(function(err, items) {
        _.each(items, function(item) {
          _.each(item.commodities, function(c) {
            c.photos = _.sortBy(c.photos, 'position');
            c.user = null;
            c.tags = null;
          });
        });

        res.json({ items:items });
      });
    } else res.json({ items:[] });
  });

  /* 是否公开个人页 */
  router.post('/api/users/:id/exhibition', function(req, res) {
    var id = req.params.id;
    var isPublic = req.body.is_public;
    if(__.isMongoId(id)) {
      User.find({ _id:id }).update({ $set:{ public:isPublic } }, function(err) {
        if (err) res.json({ status: 500, error: err ? err.message : null });
        else res.json({ status: 200 });
      });
    } else res.json({ status: 200 });
  });

  /* 当前用户发布指定 URL 商品的数量 */
  router.get('/api/current/commodities/:url', utils.token, function(req, res) {
    Commodity.count({ user: req.user.id, url: decodeURIComponent(req.params.url) }, function(err, count) {
      res.json({ count:count });
    });
  });

  /* 用户爱好信息收集 API */
  router.post('/api/users/:id/hobbies', function(req, res) {
    var sex = req.body.sex;
    var hobbies = req.body.hobbies;
    if(hobbies) hobbies = JSON.parse(hobbies);
    else hobbies = [];

    var id = req.params.id;

    if(__.isNotMongoId(id)) { res.json({ status:500, error:new Error('没有对应的用户') }); return; }
    Hobby.findOneAndUpdate({ user:id }, { $set:{ user:id }, $addToSet:{ tags:{ $each:hobbies } } }, { upsert:true, new:true }).exec(function(err, hobby) {
      User.findById(id, function(err, item) {
        item.sex = req.body.sex;
        item.birthday = req.body.birthday;
        item.save(function() {
          res.json({ status:200, error:null });
        });
      });
    });
  });

  /* 用户注册页 */
  router.get('/signup', function(req, res) {
    res.render('signup');
  });

  /* 用户注册校验码 */
  router.get('/api/invitation_code/:code', function(req, res) {
    InvitationCode.findOne({ code:req.params.code }, function(err, code) { res.json({ code:code }); });
  });

  // 本地用户验证码
  router.get('/signup/code/:mobile', function(req, res) {
    var tel = req.params.mobile;
    var key = tel + utils.system_secret_key;
    var code = notp.totp.gen(key);

    User.findOne({ mobile:tel }, function(err, user) {
      if(user) { res.json({ code:1, msg:'号码已经被使用，请登录或更换一个号码' }); return; }
      utils.redisClient.get(tel, function(err, reply) {
        // '已存在: 不做任何处理'
        if (reply) { res.json({ code: 0, msg: '验证码已经发出，请您耐心等待' }); return; }

        // 发送短信
        sms.send(tel, '【魔淘应用】' + code + ' (魔淘注册验证码)，请勿泄露，5 分钟内有效').then(function(error, response, body) {
          if (error) res.json({ code: 1, msg: '抱歉, 验证码发送错误，请您再次获取' });
          else {
            setSignupCodeWithExpire(tel, code);
            res.json({ code: 0, msg: '验证码已经发送到您的手机，请注意查收' });
          }
        });
      });
    });
  });

  function setSignupCodeWithExpire(k, v) {
    if (utils.redisClient) {
      utils.redisClient.set(k, v, utils.redis.print);
      utils.redisClient.expire(k, 5 * 60, utils.redisClient.print);
    } else console.error('redis client instance is not exist.');
  }

  /* 用户注册保存页 */
  router.post('/signup', utils.uploader.single('avatar'), function(req, res) {
    var mobile = _.trim(req.body.mobile);
    var code = _.trim(req.body.code);
    var pass = _.trim(req.body.password);
    var username = _.trim(req.body.username);

    if(_.isEmpty(mobile) || _.isEmpty(code)) { res.json({ status:500, msg:'信息错误' }); return; }
    utils.redisClient.get(mobile, function(err, reply) {
      if (_.isEmpty(reply) || reply !== code) { res.json({ status:500, msg:'验证码错误' }); return; }
      var re = new RegExp('^' + username.toLowerCase() + '$', 'i');
      User.findOne({ nickname:{ $regex:re } }).exec(function(err, item) {
        if(item) { res.json({ status: 500, msg:'用户昵称已经存在' }); return; }

        var user = new User({
          pass:pass,
          confirm_pass:pass,
          nickname:username,
          email:'-' + username,
          mobile:_.parseInt(mobile),
          sign_in_count:1,
          last_sign_in_at:new Date(),
          last_sign_in_ip:(req.headers['x-forwarded-for'] || req.connection.remoteAddress)
        });

        var hello = '欢迎小伙伴来到魔淘，每天推荐给你全世界最好玩，最有趣，最酷炫的电影动漫周边。无论你是电影迷、美漫迷、日漫迷，只要你有所爱，魔淘必能满足！如果对于魔淘APP有任何使用操作、改进建议等问题，欢迎随时私信给窝呦，无节操小编欢迎大家来勾搭~';

        thunk(function(cb) {
          // 处理用户头像
          if (req.file && req.file.path) {
            var path = req.file.path;

            gm(path).autoOrient().write(path, function(err) {
              var avatar = req.file;
              var upyun = new UPYUN('moretao-dev', 'moretao', 'zanmeichuanmei888', 'v0', 'legacy');
              upyun.uploadFile('/user/avatar/' + avatar.filename, avatar.path, avatar.mimetype, true, {
                'x-gmkerl-exif-switch': true, 'x-gmkerl-rotate': 'auto'
              }, function(err, result) {
                user.avatar = avatar.filename;
                fs.unlink(avatar.path, function(err) { cb(err, null); });
              });
            });
          } else cb(null, null);
        })(function(error, result) {
          user.save(function(err) {
            // NOTE 用户注册奖励积分 20
            var content = { user:user };
            var points = 20;
            var update = { $set:content, $inc:{ points:points } };
            Account.findOneAndUpdate(content, update, { upsert:true, new:true }).exec(function(err, account) {
              // 用户自动登录
              req.login(user, function(err) {
                // 派发 Token
                utils.setUserToken(user, function(token) {
                  // 用户首次登录消息
                  utils.sayHello(user.id, hello, function() { res.json({ status:200, user:user, token:token, points:points }); });
                });
              });
            });
          });
        });
      });
    });
  });

  /* 忘记密码页 */
  router.get('/forget', function(req, res) {
    res.render('forget');
  });

  router.get('/api/forget/code/:mobile', function(req, res) {
    var tel = req.params.mobile;
    var key = tel + utils.system_secret_key;
    var code = notp.totp.gen(key);

    User.findOne({ mobile:tel }, function(err, user) {
      if(!user) { res.json({ status: 500, msg: '这个号码还没有被注册.' }); return; }

      utils.redisClient.get(tel, function(err, reply) {
        // '已存在: 不做任何处理'
        if (reply) { res.json({ code:0, msg:'验证码已经发出，请您耐心等待' }); return; }
        sms.send(tel, '【魔淘应用】' + code + ' (魔淘重置验证码)，请勿泄露，5 分钟内有效').then(function(error, response, body) {
          if(error) { res.json({ status:500, msg:'抱歉, 验证码发送错误，请您再次获取' }); return; }

          setSignupCodeWithExpire(tel, code);
          res.json({ status:200, msg:'验证码已经发送到您的手机，请注意查收' });
        });
      });
    });
  });

  // 重置密码
  router.post('/api/reset', function(req, res) {
    var mobile = req.body.mobile;
    var code = req.body.code;
    var password = req.body.password;

    if (_.isEmpty(mobile) || _.isEmpty(code) || _.isEmpty(password)) { res.json({ error: '信息错误', status: 500 }); return; }
    utils.redisClient.get(mobile, function(err, reply) {
      if (_.isEmpty(reply) || reply !== code) { res.json({ error: '验证码错误', status: 500 }); return; }
      User.findOne({ mobile:mobile }).exec(function(err, item) {
        if(item) {
          item.pass = password;
          item.confirm_pass = password;
          item.save(function(err) { res.json({ status:200, user:item }); });
        } else res.json({ error:'用户不存在', status:500 });
      });
    });
  });

  /* 设置页 */
  router.get('/settings', utils.logged, function(req, res) {
    User.find({ _id:req.user.id }).exec(function(err, item) {
      res.render('settings', { user_id: item[0].id, is_public: item[0].public });
    });
  });

  /* 关于页 */
  router.get('/aboutus', function(req, res) {
    res.render('aboutus');
  });

  /* 隐私保护页 */
  router.get('/privacy', function(req, res) {
    res.render('privacy');
  });

  /* 用户协议 */
  router.get('/agreement', function(req, res) {
    res.render('rules');
  });

  /* 反馈页 */
  router.get('/feedback', utils.logged, function(req, res) {
    res.cookie('moretao_return_url', req.url);
    res.render('feedback');
  });

  /* 社区规范页 */
  router.get('/rules', function(req, res) {
    res.render('rules');
  });

  /* 保存用户意见 */
  router.post('/api/suggests', utils.token, function(req, res) {
    var desc = req.body.desc;
    var c = req.body.c;

    if (_.isEmpty(desc) || _.isEmpty(c)) res.json({ msg:'信息错误', status:500 });
    else {
      var suggest = new Suggest({ user:req.user, desc:desc, c:c });
      suggest.save(function(err) { res.json({ msg: 'success', status:200 }); });
    }
  });

  /* Q & A 页 */
  router.get('/qanda', utils.logged, function(req, res) {
    res.render('qanda');
  });

  return router;
};
