var _ = require('lodash');
var sha1 = require('sha1');
var jwt = require('jwt-simple');
var urlencode = require('urlencode');
var moment = require('moment');
var path = require('path');
var swig = require('swig');
var express = require('express');
var compression = require('compression');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var fs = require('fs');
var os = require('os');
var crypto = require('crypto');
var uuid = require('uuid');
var thunk = require('thunks')();
var weiboProvinces = JSON.parse(fs.readFileSync('routes/weibo-provinces.json', 'utf-8'));

var app = express();

/* env */
var isDevelopment = app.get('env') === 'development';
var domain = isDevelopment ? 'localhost:7000' : 'm.moretao.com';

/* redis */
var redisHost = (isDevelopment ? '127.0.0.1' : '10.51.85.197');
var redis = require('redis'), redisClient = redis.createClient('6379', redisHost);

redisClient.on('error', function(err) { console.error('Error ' + err); });
redisClient.on('connect', function() {});

/* 微信相关 */
global.appid = 'wx8c1226347ed11c26';
global.appsecret = 'd1da6016189771d32de6897800f63bd0';
global.wechatCallback_url = 'wechatCallback_url';
global.wechat_silent_callback_url = 'wechat_silent_callback_url';
global.wechat_userinfo_callback_url = 'wechat_userinfo_callback_url';

function isWeixin(req) {
  var ua = req.get('User-Agent').toLowerCase();
  return ua.match(/MicroMessenger/i) === 'micromessenger';
}

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, '/public/favicon.ico')));
app.use(compression());
app.use(express.static(path.join(__dirname, (isDevelopment ? '/assets' : '/public'))));
app.use(bodyParser.json({ limit:'3mb' }));
app.use(bodyParser.urlencoded({ limit:'3mb', extended:true }));
app.use(flash());

app.use(methodOverride());

var systemSecretKey = process.env.SECRET_KEY_BASE;

app.use(cookieParser(systemSecretKey));

/* 时间地区 */
moment.locale('zh-cn');

var storage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, os.tmpdir()); },
  filename: function(req, file, cb) { cb(null, uuid.v4() + path.extname(file.originalname));}
});
var uploader = multer({ storage: storage, limits: { fileSize: 3 * 1024 * 1024 } });

var utils = {
  isDevelopment: isDevelopment,
  domain: domain,
  app: app,
  redis: redis,
  redisClient: redisClient,
  systemSecretKey: systemSecretKey,
  uploader: uploader,
  moment: moment,
  logged: logged,
  token: token,
  admin:'魔淘',
  isWeixin: isWeixin,
  sayHello: sayHello,
  setUserToken:setUserToken
};

// require orm file
var orm = require('./models/orm')(utils);

var application = require('./routes/application')(utils);
var ads = require('./routes/ads')(utils);
var checkin = require('./routes/checkin')(utils);
var sharecount = require('./routes/sharecount')(utils);
var commodities = require('./routes/commodities')(utils);
var topics = require('./routes/topics')(utils);
var activities = require('./routes/activities')(utils);
var complaints = require('./routes/complaints')(utils);
var favorites = require('./routes/favorites')(utils);
var publish = require('./routes/publish')(utils);
var search = require('./routes/search')(utils);
var users = require('./routes/users')(utils);
var tags = require('./routes/tags')(utils);
var addresses = require('./routes/addresses')(utils);
var messages = require('./routes/messages')(utils);
var records = require('./routes/records')(utils);
var lotteries = require('./routes/lotteries')(utils);
var postcards = require('./routes/postcards')(utils);
var regions = require('./routes/regions')(utils);
var schedule = require('./routes/schedule')(utils);
var debug = require('./routes/debug')(utils);
var wechat = require('./routes/wechat')(app, domain);

// view engine setup
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '/views'));

// session setup
var session = require('express-session');
var RedisStore = require('connect-redis')(session);

var sessionOptions = {
  secret: systemSecretKey,
  saveUninitialized: true,
  resave: false,
  proxy: false,
  rolling: true,
  cookie: { maxAge:30 * 24 * 60 * 60 * 1000, httpOnly:true, domain:isDevelopment ? '' : domain, secure:false }
};

app.set('view cache', isDevelopment);
swig.setDefaults({ cache:(isDevelopment ? false : 'memory'), locals:{ env:app.get('env'), domain:domain, version:moment().format('YYYYMMDDHHMM'), moment:moment } });

// Session 设置
app.use(session(_.extend({ store: new RedisStore({
  client: redisClient,
  ttl: 30 * 24 * 60 * 60
}) }, sessionOptions)));

// 全局头设置
app.all('*', function(req, res, next) {
  res.set({
    'Access-Control-Allow-origin': '*',
    'Access-Control-Allow-Headers': 'X-Requested-With',
    'Access-Control-Allow-Methods': 'GET'
  });
  next();
});

// passport setup
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  WechatStrategy = require('passport-wx');

app.use(passport.initialize());
app.use(passport.session());

var passportDefaultPassword = '-1234567890';

// 本地用户
passport.use(new LocalStrategy(function(username, password, done) {
  var query = { $or: [{ nickname : username }, { mobile: username }] };

  User.findOne(query).select(deepSelectsForUser + ' encrypted_password').exec(function(err, user) {
    if (err) { return done(err); }
    if (!user) return done(null, false, { message:username });
    if (!user.checkPassword(password)) return done(null, false, { message:username });

    return done(null, user);
  });
}));

passport.serializeUser(function(user, done) { done(null, user.id); });
passport.deserializeUser(function(id, done) { User.findById(id).select(deepSelectsForUser).exec(function(err, user) { done(err, user); }); });

// 本地用户
app.get('/signin', function(req, res) {
  res.render('signin', { message:req.flash('error') });
});

app.post('/signin', passport.authenticate('local', {
  failureFlash: true,
  failureRedirect: '/signin'
}), function(req, res) {
  var count = req.user.sign_in_count;

  req.user.sign_in_count = count ? parseInt(count) + 1 : 1;
  req.user.last_sign_in_at = new Date();
  req.user.last_sign_in_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  setUserToken(req.user, function(token) {
    req.user.save(function(err) {
      var url = req.cookies.moretao_return_url;
      if (_.isEmpty(url)) res.redirect('/');
      else res.redirect(url);
    });
  });
});

app.post('/api/signin', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if(user) {
      var count = user.sign_in_count;
      user.sign_in_count = count ? parseInt(count) + 1 : 1;
      user.last_sign_in_at = new Date();
      user.last_sign_in_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      setUserToken(user, function(token) {
        user.save(function(err) {
          req.login(user, function(err) {
            if(err) res.json({ status:500, url:'/' });
            else {
              var url = req.cookies.moretao_return_url;
              if (_.isEmpty(url)) url = '/';
              res.json({ status:200, url:url, user:req.user, token:token });
            }
          });
        });
      });
    } else res.json({ status:500, url:'/' });
  })(req, res, next);
});

app.get('/api/thirds/exist/:platform/:id', function(req, res) {
  var params = {};
  var platform = req.params.platform ? req.params.platform.toLowerCase() : null;
  if(platform === 'qq') params = { 'qq.id':req.params.id };
  if(platform === 'wechat') params = { 'wechat.openid':req.params.id };
  if(platform === 'weibo') params = { 'weibo.id':req.params.id };

  if(platform === null) res.json({ result:0, user:null });
  else {
    User.findOne(params, function(err, user) {
      if(user) {
        user.save(function(err) {
          setUserToken(user, function(token) {
            req.login(user, function(err) { res.json({ status:200, result:1, user:user, token:token, msg:'欢迎来到魔淘!' }); });
          });
        });
      } else res.json({ result:0, user:null });
    });
  }
});

app.post('/api/thirds/signin', function(req, res) {
  var params = getThirdsParams(req);
  if(_.isEmpty(params.platform) || _.isEmpty(params.nickname)) res.json({ status:500, msg:'信息获取的不全哦 :-(' });
  else {
    thunk.all([
      thunk(function(cb) { User.count({ nickname:params.nickname }, function(err, count) { cb(err, count); }); }),
      thunk(function(cb) {
        if(_.isEmpty(params.mobile)) cb(null, 0);
        else User.count({ mobile:params.mobile }, function(err, count) { cb(err, count); });
      })
    ])(function(error, results) {
      var ncount = parseInt(results[0]);

      if(ncount > 0) res.json({ status:500, msg:'您的昵称已经有人使用了' });
      else if(parseInt(results[1]) > 0) res.json({ status:500, msg:'该电话号码已被注册' });
      else {
        var u = new User();
        bindThirdsParams(u, params, req);

        u.save(function(err) {
          setUserToken(u, function(token) {
            req.login(u, function(err) { res.json({ status:200, user:u, token:token, msg:'欢迎来到魔淘!' }); });
          });
        });
      }
    });
  }
});

app.post('/api/thirds/bind', function(req, res) {
  var params = getThirdsParams(req);

  if(_.isEmpty(params.platform) || _.isEmpty(params.code) || _.isEmpty(params.nickname) || _.isEmpty(params.mobile)) res.json({ status:500, msg:'信息获取的不全哦 :-(' });
  else {
    utils.redisClient.get(params.mobile, function(err, reply) {
      if (_.isEmpty(reply) || reply !== params.code) res.json({ status:500, msg:'验证码错误' });
      else {
        thunk.all([
          thunk(function(cb) {
            User.count({ nickname:params.nickname, mobile:{ $ne:params.mobile } }, function(err, count) { cb(err, count); });
          }),
          thunk(function(cb) { User.findOne({ mobile:params.mobile }, function(err, item) { cb(err, item); }); })
        ])(function(error, results) {
          var ncount = parseInt(results[0]);
          var u = results[1];

          if(ncount > 0) res.json({ status:500, msg:'您的昵称已经有人使用了' });
          else if(!u) res.json({ status:500, msg:'没有找到需要绑定的电话号码' });
          else {
            bindThirdsParams(u, params, req);
            u.save(function(err) {
              setUserToken(u, function(token) {
                req.login(u, function(err) { res.json({ status:200, user:u, token:token, msg:'欢迎回到魔淘!' }); });
              });
            });
          }
        });
      }
    });
  }
});

function getThirdsParams(req) {
  var params = {
    code:_.trim(req.body.code),
    nickname:_.trim(req.body.name),
    mobile:_.trim(req.body.mobile),
    password:req.body.password,
    platform:req.body.platformname ? req.body.platformname.toLowerCase() : null,
    openid:_.trim(req.body.userid),
    icon:req.body.icon
  };
  return params;
}

function bindThirdsParams(u, params, req) {
  if(params.platform === 'qq') {
    u.provider = 'qq';
    u.qq.id = params.openid;
    u.qq.profile_image_url = params.icon;
  }

  if(params.platform === 'wechat') {
    u.provider = 'wechat';
    u.wechat.openid = params.openid;
    u.wechat.headimgurl = params.icon;
  }

  if(params.platform === 'weibo') {
    u.provider = 'weibo';
    u.weibo.id = params.openid;
    u.weibo.profile_image_url = params.icon;
  }

  u.nickname = params.nickname;
  u.mobile = params.mobile;
  u.email = '-' + params.openid;
  u.province = req.body.province;
  u.city = req.body.city;
  u.pass = req.body.password;
  u.confirmPass = req.body.password;

  u.sign_in_count = u.sign_in_count ? u.sign_in_count + 1 : 1;
  u.last_sign_in_at = new Date();
  u.last_sign_in_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

// 微信-开发环境
passport.use(new WechatStrategy({
  appid: appid,
  appsecret: appsecret,
  callbackURL: 'http://' + domain + '/auth/wechat/callback',
  requireState: false,
  scope: 'snsapi_userinfo',
  state: true
}, function(accessToken, refreshToken, profile, done) { wechatCallback(accessToken, refreshToken, profile, done); }));

function wechatCallback(accessToken, refreshToken, profile, done) {
  // 如果用户不存在, 使用微信的信息创建新用户
  User.findOne({ 'wechat.openid':profile.openid }, function(err, user) {
    if (user !== null) done(null, user, profile);
    else {
      var u = new User();
      u.provider = 'wechat';
      u.mobile = '-' + profile.openid;
      u.email = '-' + profile.openid;
      u.nickname = profile.nickname;
      u.province = profile.province;
      u.country = profile.country;
      u.sex = profile.sex;
      u.pass = passportDefaultPassword;
      u.city = profile.city;
      u.confirmPass = passportDefaultPassword;
      u.wechat.openid = profile.openid;
      u.wechat.language = profile.language;
      u.wechat.headimgurl = profile.headimgurl;
      u.save(function(err, item) {
        if (err) console.error(err);
        done(null, item, profile);
      });
    }
  });
}

// 微信
app.get('/wechat/callback', function(req, res) {
  res.redirect('/auth/wechat');
});

app.get('/auth/wechat', passport.authenticate('wechat'), function(req, res) {});

app.get('/auth/wechat/callback', passport.authenticate('wechat', {
  failureFlash: true,
  failureRedirect: '/signin'
}), function(req, res) {
  if(req.user.checkPassword(passportDefaultPassword)) res.redirect('/thirds/password');
  else {
    sayHello(req.user.id, '<(￣3￣)> 欢迎回到魔淘!', function() {
      var url = req.cookies.moretao_return_url;
      if (_.isEmpty(url)) res.redirect('/');
      else res.redirect(url);
    });
  }
});

// 第三方修改密码
app.get('/thirds/password', function(req, res) {
  res.render('thirds-password', { nickname:req.user.nickname });
});

app.post('/thirds/password', function(req, res) {
  var oldname = req.body.oldname;
  var nickname = req.body.nickname;
  var pass = req.body.pass;
  var confirmPass = req.body.confirmPass;

  if(nickname && nickname.length > 1 && pass && confirmPass && pass.length > 3 && confirmPass.length > 3 && pass === confirmPass) {
    var re = new RegExp('^' + nickname.toLowerCase() + '$', 'i');
    User.find({ nickname:{ $regex:re } }, function(err, users) {
      if(!users || users.length === 0 || (users && users.length === 1 && oldname === nickname)) {
        // 用户昵称唯一
        req.user.nickname = nickname;
        req.user.pass = pass;
        req.user.confirmPass = confirmPass;

        req.user.save(function(err) {
          sayHello(req.user.id, '<(￣3￣)> 欢迎加入魔淘，新鲜、独特的电影动漫周边，尽在魔淘!', function() {
            var url = req.cookies.moretao_return_url;
            if (_.isEmpty(url)) res.redirect('/');
            res.redirect(url);
          });
        });
      } else {
        // 用户昵称不唯一, 且用户修改了原始的昵称
        res.render('thirds-password', { message:'您的昵称已经有人使用了', nickname:nickname });
      }
    });
  } else res.render('thirds-password', { message:'输入错误哦', nickname:nickname });
});

function sayHello(uid, message, cb) {
  if(!uid || uid.length < 10) return;

  thunk.all([
    thunk(function(cb) { User.findOne({ nickname:utils.admin }).select('_id').exec(function(err, user) { cb(err, user);}); }),
    thunk(function(cb) { User.findById(uid).exec(function(err, user) { cb(err, user);}); })
  ])(function(error, result) {
    if(result[0] && result[1]) {
      var msg = new Message({ from:result[0].id, to:result[1].id, msg:message });
      msg.save(function(err) {
        if(err) console.error(err);
        if(cb) cb();
      });
    }
  });
}

/* GET logout page. */
app.get('/logout', token, function(req, res) {
  if(req.user) {
    req.user.save(function(err) {
      req.logout();
      res.redirect('/');
    });
  } else {
    req.logout();
    res.redirect('/');
  }
});

/* GET logout page. */
app.get('/api/logout', function(req, res) {
  if(req.user) {
    req.user.save(function(err) {
      req.logout();
      res.json({ status:200 });
    });
  } else {
    req.logout();
    res.json({ status:200 });
  }
});

/* 判断用户是否登录 */
function logged(req, res, next) {
  if (req.isAuthenticated()) return next();
  else {
    if(req.url.indexOf('/user') < 0) res.cookie('moretao_return_url', req.url);
    res.redirect('/signin');
    return null;
  }
}

/* 判断 API 用户是否登录 */
function token(req, res, next) {
  if(req.user) next();
  else {
    var accessToken = req.query.access_token;
    if(!accessToken) accessToken = req.body.access_token;
    if(!accessToken) next();
    else {
      redisClient.get('tokens:' + accessToken, function(err, value) {
        var res = JSON.parse(value);
        if(_.isEmpty(res)) next();
        else {
          User.findById(res.id, function(err, user) {
            if(user) req.login(user, function(err) { next(); });
            else next();
          });
        }
      });
    }
  }
}

// 设置 Token
function setUserToken(user, cb) {
  var token = jwt.encode({ id:user.id }, process.env.SECRET_KEY_BASE);
  var key = 'tokens:' + token;
  redisClient.set(key, JSON.stringify({ id:user.id, at:new Date().getTime() }), redisClient.print);
  redisClient.expire(key, 7 * 24 * 60 * 60, redisClient.print);
  if(cb) cb(token);
}

/* API 用户刷新 Token */
app.post('/refresh/token', function(req, res) {
  var accessToken = req.body.access_token;
  if(!accessToken) res.json({ status:500, msg:'token 非法', token:null });
  else {
    var key = 'tokens:' + accessToken;
    redisClient.get(key, function(err, value) {
      if(value) {
        redisClient.expire(key, 7 * 24 * 60 * 60, redisClient.print);
        res.json({ status:200, token:accessToken });
      } else res.json({ status:404, msg:'token 不存在', token:null });
    });
  }
});

// routes settings
// 生成淘宝校验串
// app.all('*', function(req, res, next) {
//   var timestamp = _.padEnd(new Date().getTime(), 13, '0');
//   var message = taobao_app_secret + 'app_key' + taobao_app_key + 'timestamp' + timestamp + taobao_app_secret;
//   var crypted = crypto.createHmac('md5', taobao_app_secret).update(message).digest('hex').toUpperCase();
//   res.cookie('timestamp', timestamp);
//   res.cookie('sign', crypted);
//   next();
// });

app.use(application);
app.use(ads);
app.use(checkin);
app.use(sharecount);
app.use(commodities);
app.use(topics);
app.use(activities);
app.use(complaints);
app.use(favorites);
app.use(publish);
app.use(search);
app.use(users);
app.use(addresses);
app.use(messages);
app.use(records);
app.use(lotteries);
app.use(postcards);
app.use(tags);
app.use(regions);
app.use(debug);
app.use(wechat);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('404 Not Found');
  var full = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.error('404 URL: ' + full);
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (isDevelopment) {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('报错了! 看 log! [' + err.message + ']');
  });
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(function(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
  });
}

module.exports = app;
