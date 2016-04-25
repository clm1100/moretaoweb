/* eslint no-useless-escape:0 */

doT.templateSettings = {
  evaluate: /\[\[([\s\S]+?)\]\]/g,
  interpolate: /\[\[=([\s\S]+?)\]\]/g,
  encode: /\[\[!([\s\S]+?)\]\]/g,
  use: /\[\[#([\s\S]+?)\]\]/g,
  define: /\[\[##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\]\]/g,
  conditional: /\[\[\?(\?)?\s*([\s\S]*?)\s*\]\]/g,
  iterate: /\[\[~\s*(?:\]\]|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\]\])/g,
  varname: 'it',
  strip: false,
  append: true,
  selfcontained: false
};

(function($) {
  $.extend({
    put:function(url, data, callback, type) {
      if (jQuery.isFunction(data)) {
        type = type || callback;
        callback = data;
        data = null;
      }
      return jQuery.ajax({ type:'PUT', url:url, data:data, success:callback, dataType:type });
    },
    delete:function(url, data, callback, type) {
      if (jQuery.isFunction(data)) {
        type = type || callback;
        callback = data;
        data = null;
      }
      return jQuery.ajax({ type:'DELETE', url:url, data:data, success:callback, dataType:type });
    },
    removeHTMLTags:function(txt) { return $.trim(txt).replace(/<\/?[^>]*>/g, ''); }
  });
})(jQuery);

var pageCurrentStore = 'moretao_pageCurrentTop';
var pageCurrentTop = 0;
var searchReturnUrl = '/search';
var urlType;
var urlId;

// 检索验证邮编
var checkPatrnNumber = /^[0-9]{6}$/;

// 检索验证手机号
var checkPhoneNumber = /^1([38]\d|4[57]|5[0-35-9]|7[06-8]|8[89])\d{8}$/;
$(document).ready(function() {
  $(document).foundation();
  moment.locale('zh-CN');

  urlType = url(-2, window.location.href);
  urlId = url(-1, window.location.href);

  // 判断是否在魔淘APP。显示或隐藏顶部推广条
  var isMoretao = navigator.userAgent.indexOf('moretao') >= 0;
  if(!isMoretao) $('#extension-floating-layer').css('display', 'block');

  // 加载轮播
  $('.slick-container').slick();

  var current = $('#application-current-user-id').val();
  if (current && current.length > 5) {
    $.get('/api/users/' + current + '/unread/count', function(data) {
      if (data.count > 0) $('#message-tip').show();
      else $('#message-tip').hide();
    });
  }

  // 全局输入框清空事件
  $('.fa-times-circle').click(function() { $('.fa-times-circle-input').val(''); });
  $('.mt-star').click(function() { $('.fa-times-circle-input').val(''); });

  /* 全局推广APP相关操作 */
  $('.extension-close').click(function() { $('#extension-floating-layer').css('display', 'none'); });

  // 判断客户端
  $('.download-app-bt').click(function() { window.location = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.moretao&g_f=991653'; });
  $('.extension-info').click(function() { window.location = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.moretao&g_f=991653'; });
});

// 禁止滑动全局
$('#clear-touchmove').on('touchmove', function(e) { e.preventDefault(); });

var running = false;

function startRun() {
  if (running) return false;
  else {
    running = true;
    return true;
  }
}

function stopRun() { running = false; }

var storeWithExpiration = {
  set:function(key, val, exp) {
    localStorage.setItem(key, JSON.stringify({ val:val, exp:exp, time: new Date().getTime() / 1000 }));
  },
  get:function(key) {
    var info = JSON.parse(localStorage.getItem(key));
    if (!info) return null;
    if (new Date().getTime() / 1000 - info.time > info.exp) return null;
    return info.val;
  }
};

var MOODs = {
  dejected: '(＞﹏＜)',
  great: '<(￣3￣)>',
  happy: '(￣▽￣)',
  ashow: '︶ε╰',
  crazy: 'o(≧口≦)o',
  blackline: '(\'▔□▔)',
  surprised: 'Σ( ° △ °|||)',
  shrug: 'ㄟ( ▔, ▔ )ㄏ',
  friend: '””\\(￣ー￣) (￣ー￣)//””',
  cry: 'ಥ_ಥ'
};

// 消息确认弹框
function alertMessage(title, message, mood, enter, cb) {
  if(!enter) enter = '辣好吧';
  var panel = $('#alert-message-panel');
  panel.find('.title').html(title);
  panel.find('.message').html(mood ? message + ' ' + mood : message);
  panel.find('.yes').html(enter);
  panel.foundation('open');
  if(cb) $(document).on('closed.fndtn.reveal', '[data-reveal]', function() { cb(); });
}

// 待取消消息弹框
function alertConfirm(title, message, mood, enter, callback) {
  if(!enter) enter = '点错了';
  var panel = $('#alert-confirm-panel');
  panel.find('.title').html(title);
  panel.find('.message').html(mood ? message + ' ' + mood : message);
  panel.find('.yes').html(enter);
  panel.foundation('open');
  panel.find('.yes').click(function() {
    callback();
    panel.foundation('close');
  });
  panel.find('.no').click(function() {
    panel.foundation('close');
  });
}

// 自动隐藏提示弹框
function alertAutoHideMessage(title) {
  $('#alert-auto-hide-title').html(title);
  $('#alert-auto-hide-panel').css({ 'z-index':'9999', bottom:'100px', opacity:'1' });
  setTimeout(hiddenAlertAutoHideMessage, 2800);
}

function hiddenAlertAutoHideMessage() {
  $('#alert-auto-hide-panel').css({ 'z-index':'-1', bottom:'20px', opacity:'0' });
}

// 自动隐藏提示弹框
function alertSlideShowPanel(images) {
  var panel = $('#alert-slide-show-panel');
  var slick = panel.find('.panel .slick-panel');
  slick.html('');

  $.each(images, function(i, img) {
    if(img && img.length > 0) slick.append('<div><img src="' + img + '" width="100%"></div>');
  });

  var viewport = document.querySelector('meta[name=viewport]');
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=4.0, user-scalable=yes');

  panel.foundation('reveal', 'open');

  panel.one('click', function() {
    if ($.isFunction(slick.slick)) slick.slick('unslick');
    slick.html('');
    var viewport = document.querySelector('meta[name=viewport]');
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=yes');
    panel.foundation('reveal', 'close');
  });

  setTimeout(function() {
    slick.slick();
    var height = parseInt(slick.css('height'));
    var total = parseInt(document.body.clientHeight);
    var margin = (total - height) / 2;
    slick.css('marginTop', margin + 'px');
  }, 500);
}

function activeToolbarItem(id) {
  var btn = $('#' + id).find('.toolbar-btn');
  btn.addClass('active');
}

function showReturnArrow(link) {
  // $('#footer').remove();
  var main = $('#main');
  main.css('margin-bottom', '0');
  var arrow = $('.return-arrow').find('a:first-child');

  if(history.length === 1 && link && link.indexOf('history.back()') > -1 && link.indexOf('javascript') > -1) arrow.attr('href', '/');
  else arrow.attr('href', link);

  arrow.show();
}
// URL 校验
function urlify(text) {
  var regexp = new RegExp('(http[s]{0,1}|ftp)://[a-zA-Z0-9\\.\\-]+\\.([a-zA-Z]{2,4})(:\\d+)?(/[a-zA-Z0-9\\.\\-~!@#$%^&*+?:_/=<>]*)?', 'gi');
  var result = text.match(regexp);
  return result ? result[0] : text;
}
// 显示 loading 界面
function showLoading() {
  var loading = $('#loading-area');
  loading.show();
  loading.addClass('active');
}
// 关闭 loading 界面
function closeLoading() {
  var loading = $('#loading-area');
  loading.removeClass('active');
  loading.hide();
}

// 显示分享提示页面
function showShareTipsArea() {
  var area = $('.share-tips-area');
  area.fadeIn();
  area.click(function() { area.fadeOut(); });
}

// 全局 tag 搜索跳转
function tagToSearch(id, url) {
  if (!url) url = '/';
  localStorage.setItem(searchReturnUrl, url);
  window.location.href = '/search/tag/' + id;
}

// 全局关键字搜索跳转
function keyToSearch(key, url) {
  if (!url) url = '/';
  localStorage.setItem(searchReturnUrl, url);
  window.location.href = '/search/keyword/' + encodeURIComponent(key);
}

// 全局活动搜索跳转
function activityToSearch(key, url) {
  if (!key || key === '') return;
  if (!url) url = '/';
  localStorage.setItem(searchReturnUrl, url);
  window.location.href = '/search/activity/' + encodeURIComponent(key);
}

// 全局和谐词替换
function hexieReplace(txt) {
  var content = '<span class="hexie"><img src="/images/hexie.png"> 哔哔哔 </span>';
  return txt ? txt.replace('|||||', content) : '';
}

// 微信相关方法
function isWeixin() {
  var ua = window.navigator.userAgent.toLowerCase();
  return ua.match(/MicroMessenger/i) === 'micromessenger';
}

// function open_app() {
//  var system = navigator.userAgent;
//  var isWeixin = system.indexOf('MicroMessenger') >= 0;
//  var is_iphone = system.indexOf('iPhone') >= 0;
//  var is_android = system.indexOf('android') >= 0 || system.indexOf('Linux') >= 0;
//  //MQQBrowser
//  if (is_iphone) {
//    var is_UC = system.indexOf('UC') >= 0;
//    if (!isWeixin) {
//      //var ifr = document.createElement('iframe');
//      //var open_protocol = 'moretao://' + urlType + '/' + urlId;
//      //ifr.src = open_protocol;
//      //ifr.style.display = 'none';
//      //document.body.appendChild(ifr);
//      //window.location = open_protocol;
//      setTimeout(function () {
//      window.location = 'https://itunes.apple.com/us/app/mo-tao/id1050563287';
//      }, 1000);
//    } else {
//      window.location.href = 'http://moretao.com';
//    }
//  } else if (is_android) {
//    //var url = 'http://ota.moretao.com/versions/2001/latest'
//    //$.get('/api/outdata', {url: url}, function (json) {
//      window.location.href = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.moretao';
//    //})
//  } else {
//    alertAutoHideMessage('暂不支持当前系统');
//  }
// }

// 模糊提示

function deleteAutoComplete(hideElement) {
  this.autoObj = document.getElementById('auto');
  while (this.autoObj.hasChildNodes()) {
    this.autoObj.removeChild(this.autoObj.firstChild);
  }
  var span = document.createElement('span');
  span.className = 'mt mt-search-icon ';
  this.autoObj.className = 'auto_hidden';
  this.autoObj.appendChild(span);

  if(hideElement) {
    for (var i = 0; i < hideElement.length; i++) {
      document.getElementById(hideElement[i]).style.display = 'block';
    }
  }
}

function AutoComplete(obj, arr, top, hideElement, cb) {
  this.obj = document.getElementById(obj); // 输入框
  this.autoObj = document.getElementById('auto'); // DIV的根节点
  this.value_arr = arr; // 不要包含重复值
  this.top = top;// 列表距离顶部的位置
  this.hide_element_arry = hideElement; // 在自动完成列表出现时隐藏的其他元素
  this.index = -1; // 当前选中的DIV的索引
  this.search_value = ''; // 保存当前搜索的字符
  this.cb = cb; // 回调
}

AutoComplete.prototype = {
  // 初始化DIV的位置
  init:function() {
    this.autoObj.style.top = this.top + 'px';
    this.autoObj.style.width = '100%';
  },
  // 删除自动完成需要的所有DIV
  deleteDIV:function() {
    while (this.autoObj.hasChildNodes()) {
      this.autoObj.removeChild(this.autoObj.firstChild);
    }
    var span = document.createElement('span');
    span.className = 'mt mt-search-icon ';
    this.autoObj.className = 'auto_hidden';
    this.autoObj.appendChild(span);
  },
  // 设置值需要自动完成的输入框
  setValue:function(_this) {
    return function() {
      _this.obj.value = this.seq; // 赋值给输入框
      _this.autoObj.className = 'auto_hidden'; // 隐藏列表
      $('#autoComplete-background').css('display', 'none');
      $('.bottom-bar').css('z-index', '9999');
      // 如果需要查询
      if(_this.cb) _this.cb(this.seq);
      // 选择值之后显示列表出现时隐藏的元素
      if(_this.hide_element_arry) {
        for (var i = 0; i < _this.hide_element_arry.length; i++) {
          document.getElementById(_this.hide_element_arry[i]).style.display = 'block';
        }
      }
    };
  },
  // 程序入口
  start:function(event) {
    var i = 0;
    if (event.keyCode !== 13 && event.keyCode !== 38 && event.keyCode !== 40) {
      var eventDiv;
      if(this.obj.id === 'publish-works-input') eventDiv = 'publish-work-div';
      else if (this.obj.id === 'publish-ip-input') eventDiv = 'publish-ip-div';
      else eventDiv = 'publish-brand-div';

      if(this.hide_element_arry) {
        for (i = 0; i < this.hide_element_arry.length; i++) {
          if (this.hide_element_arry[i] !== eventDiv) {
            if (eventDiv === 'publish-ip-div' || eventDiv === 'publish-brand-div') {
              document.getElementById(this.hide_element_arry[3]).style.display = 'none';
              document.getElementById(this.hide_element_arry[4]).style.display = 'none';
              document.getElementById(this.hide_element_arry[5]).style.display = 'none';
              document.getElementById(this.hide_element_arry[6]).style.display = 'none';
              document.getElementById(this.hide_element_arry[7]).style.display = 'none';
            } else document.getElementById(this.hide_element_arry[i]).style.display = 'none';
          }
        }
      }
    }
    this.init();
    this.deleteDIV();
    this.search_value = this.obj.value;
    var valueArr = this.value_arr;
    valueArr.sort();
    if (this.obj.value.replace(/(^\s*)|(\s*$)/g, '') === '') {
      if (this.hide_element_arry) {
        for (i = 0; i < this.hide_element_arry.length; i++) {
          document.getElementById(this.hide_element_arry[i]).style.display = 'block';
        }
      }
      $('#autoComplete-background').css('display', 'none');
      $('.bottom-bar').css('z-index', '9999');
      return;
    } // 值为空，退出

    var reg;
    try { reg = new RegExp('(' + this.obj.value + ')', 'i'); } catch (e) { return; }
    var divIndex = 0; // 记录创建的DIV的索引
    for (i = 0; i < valueArr.length; i++) {
      if (reg.test(valueArr[i])) {
        if (valueArr[i].length < 25) {
          var div = document.createElement('div');
          div.className = 'auto_onmouseout small-5 large-5 columns';
          div.seq = valueArr[i];
          div.onclick = this.setValue(this);
          div.innerHTML = valueArr[i].replace(reg, '<strong>$1</strong>'); // 搜索到的字符粗体显示
          this.autoObj.appendChild(div);
          this.autoObj.className = 'auto_show small-12 large-12 columns';
          // 隐藏自定义透明背景
          $('#autoComplete-background').css('display', 'block');
          $('.bottom-bar').css('z-index', '-1');
          divIndex++;
          if (divIndex === 10) {
            return;
          }
        }
      }
    }
    if (divIndex === 1) { // 如果只有一个结果，此元素四个圆角
      $('.auto_onmouseout').css('border-radius', '12px');
    } else if (divIndex === 0) { // 如果没有结果，被隐藏元素显示
      if (this.hide_element_arry) {
        for (i = 0; i < this.hide_element_arry.length; i++) {
          document.getElementById(this.hide_element_arry[i]).style.display = 'block';
        }
      }
    }
  }
};

// 隐藏自动完成（搜索，搜索结果页）
function hideAutocomplete() {
  deleteAutoComplete();
  $('#autoComplete-background').css('display', 'none');
  $('.bottom-bar').css('z-index', '9999');
}

/* =========== 手机端方法 =========== */
// return info {title, desc, url}
/* eslint camelcase: 0 */
var shareInfoForApp = '';

function get_share_info(platform) {
  var text = shareInfoForApp && shareInfoForApp.length > 10 ? shareInfoForApp : {
    title: '来自魔淘的分享',
    desc: '新鲜、独特的电影动漫周边，尽在魔淘',
    link: moretaoDomain,
    imgUrl: moretaoDomain + '/images/logo@2x.png'
  };

  var result = JSON.stringify(text);
  if(platform === 'android') window.stub.get_share_info(result);
  return result;
}

function scrollTopForPhone(platform) {
  var container = $('#container');
  var top = parseInt(container.scrollTop());
  if (platform === 'android') window.stub.position(top);
  return top;
}

// {username, password}, return status, url
function login_location(platform, info) {
  $.ajax({
    type: 'post',
    url: '/api/signin',
    data: { username:info.username, password:info.password },
    async: false,
    success: function(data) {
      if(platform === 'android') window.stub.login_location(JSON.stringify(data));
      return JSON.stringify(data);
    }
  });
}

// info, return status, url
function login_others(platform, info) {
  info = JSON.parse(info);

  $.ajax({
    type: 'post',
    url: '/api/thirds/signin',
    data: {
      name: info.name,
      password: info.password,
      platformname: info.platformname,
      userid: info.userid,
      icon: info.icon,
      province: info.province,
      city: info.city,
      unionid: info.unionid,
      sex: info.sex
    },
    async: false,
    success:function(data) {
      if(platform === 'android') window.stub.login_others(JSON.stringify(data));
      return JSON.stringify(data);
    }
  });
}

// return boolean
function check_user_status(platform) {
  var result = $('#application-current-user-id').val().length > 0;
  if (platform === 'android') window.stub.check_user_status(result);
  return result;
}
