/* globals setupComments */

/* filters page 预设变量和方法 */
var pageId = url(-1, window.location.href);
var tpl = doT.template($('#commodity-recommends-tpl').text());
var pageApiUrl = '/api/commodities/' + pageId + '/recommends/pages/', pageSize = 8, pageAllFilters, isShowCategories = true;
function resetGridContainer() { /* filters 页面覆盖, 不需要实现 */ }
function setUpFilters(isRefresh) { /* filters 页面覆盖, 不需要实现 */ }

$(document).ready(function() {
  showReturnArrow('/');
  if($('.not-review').length < 1) loadComments(5);
  var withComment = localStorage.getItem('withComment');
  if (withComment === 'true') {
    localStorage.setItem('withComment', null);
    showCommentEditor();
  }
  var desc = $('.commodity-desc-area span');
  var id = url(-1, window.location.href);
  if (desc.length > 0) {
    var html = $.sntext(desc.html(), {
      debug: false,
      onAt: function(at, txt) { return '<a href="/users/search/' + $.removeHTMLTags(txt) + '" class="in-at-link">' + at + '</a>';},
      onTag: function(tag, txt) {
        return '<a href=\'javascript:activityToSearch("' + $.removeHTMLTags(txt) + '", "/commodities/' + id + '")\' class="in-comment-link">' + tag + '</a>';
      }
    });
    desc.html(html);
  }

  resetGridContainer();

  var checkboxs = $('#complaint-panel').find('input[type=checkbox]');
  checkboxs.click(function(e) {
    var item = $(e.target);
    if (item.prop('checked')) {
      checkboxs.prop('checked', false);
      item.prop('checked', true);
    }
  });

  $('.slick-container').click(function() {
    var images = $('.slick-container div.images img');
    var urls = [];

    $.each(images, function(i, img) {
      // 由于 slick 的特性导致会多插入两张图片, 分别是第一张和最后一张, 这里将冗余的图片排除
      if((i !== 0 && i !== (images.length - 1)) || images.length === 1) urls.push($(img).attr('src').replace('!content', ''));
    });

    alertSlideShowPanel(urls);
  });

  $('.slick-container').on('beforeChange', function(event, slick, current, next) {
    var tags = $('.custom-tag');
    if (next === 0) tags.show();
    else tags.hide();
  });

  // 显示发布提示, 暂时隐藏
  // var status = url('#status', window.location.href);
  // if (status == 'new') {
  //   $('#publish-tips-panel').show();
  //   $.each($('img.lazy'), function (i, img) {
  //     img = $(img);
  //     img.attr('src', img.attr('data-original'));
  //   });
  // }

  // 单击阴影收藏夹隐藏
  $('#clear-touchmove').click(function(event) {
    var panel = $('#shoucang-alert-message-panel');
    if (this === event.target) panel.foundation('reveal', 'close');
  });

  hideExtMenu();
});

function loadComments(number) {
  var id = url(-1, window.location.href);
  var tpl = doT.template($('#commodity-comments-tpl').text());
  var api = '/api/commodities/' + id + '/comments/' + number;
  $.get(api, function(data) {
    setupComments(data.items);
    if (number > 0 && number < parseInt(data.total)) $('.more-btn').show();
    else $('.more-btn').hide();
  });
}
var currentIndex = -1;
var currentTotal = 8;

function loadRecommends() {
  if (!startRun()) return;
  if (currentTotal < 0) {
    $('.not-more-tips-area').fadeIn();
    stopRun();
    return;
  }
  if(currentIndex > -1) showLoading();
  Waypoint.destroyAll();
  currentIndex++;
  var size = 10;
  var id = url(-1, window.location.href);
  var tpl = doT.template($('#commodity-recommends-tpl').text());
  var api = '/api/commodities/' + id + '/recommends/pages/' + currentIndex;
  var area = $('.recommends-start-area');
  $.get(api, function(data) {
    var html = tpl(data);
    $(html).hide().appendTo(area).fadeIn(500);
    var container = $('#container');
    // 页数计算
    currentTotal = parseInt(data.total);
    if((currentIndex + 1) * size > currentTotal) currentTotal = -1;
    closeLoading();
    var opts = {
      offset: 'bottom-in-view',
      context: container
    };
    $('#bottom-area').waypoint(function() {
      loadRecommends();
    }, opts);
    stopRun();
  });
}

function wechatShare() {
  showShareTipsArea();
}

function iFollowIt(uid, fid) {
  if (!startRun()) return;
  var url = '/api/users/' + uid + '/follow/' + fid;
  $.post(url, function(data) {
    var btn = $('.follower-' + fid);
    var link = btn.parent();
    var effect = 'animated bounceIn';
    btn.addClass('active').html('已关注');
    link.addClass(effect);
    $(link).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      link.removeClass(effect);
      link.html('');
      stopRun();
    });
    // 暂时屏蔽取消关注
    // btn.html('已关注');
    // btn.addClass('active');
    // var link = btn.parent();
    // var href = link.attr('href');
    // link.attr('href', href.replace('iFollowIt', 'iUnFollowIt'));
  });
}

function iZanIt() {
  if (!startRun()) return;
  var id = $('#commodity-id').val();
  var url = '/api/commodities/' + id + '/zans';
  var btn = $('#btn-zan-link');
  $.post(url, function(data) {
    btn.attr('href', 'javascript:iCancelZanIt();');
    var icon = btn.find('i');
    icon.removeClass('mt-like');
    icon.addClass('mt-liked');
    icon.addClass('active');
    stopRun();
  });
}

function iCancelZanIt() {
  if (!startRun()) return;
  var id = $('#commodity-id').val();
  var url = '/api/commodities/' + id + '/zans/cancel';
  var btn = $('#btn-zan-link');
  $.post(url, function(data) {
    btn.attr('href', 'javascript:iZanIt();');
    var icon = btn.find('i');
    icon.removeClass('mt-liked');
    icon.removeClass('active');
    icon.addClass('mt-like');
    stopRun();
  });
}

function showExtMenu() {
  $('#commodity-ext-menu').show();
}

function hideExtMenu() {
  $('body').on('touchmove', function(e) {
    $('#commodity-ext-menu').hide();
  });
}

function showComplaintView() {
  var commodityId = $('#commodity-id').val();
  var userId = $('#current-id').val();
  var url = '/api/complaints/' + userId + '/' + commodityId + '/repeat';
  var effect = 'animated bounceInUp';
  var item = $('#complaint-panel');

  $.get(url, function(data) {
    if(data.item.length > 0 && data.item[0].processed === false) {
      var complaintInfo = data.item[0].reason;
      item.find('.default-line').remove();
      $('.user-complaint-info').show().find('.user-complaint-text').html(complaintInfo);
      $('.complaint-placeholder').html('您选择的举报原因');
      item.find('.big-btn').html('举报受理中').css('background-color', '#cacccb').removeAttr('onclick');
      $('.accusation-checkbox').find('input').attr({ readonly:'readonly', checked:'checked' });
    }
  });

  item.show();
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.removeClass(effect);
  });
}

function hideComplaintView() {
  var effect = 'animated bounceOutDown';
  var item = $('#complaint-panel');
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.hide();
    item.removeClass(effect);
  });
}

function iComplaintIt(uid, price) {
  var id = $('#commodity-id').val();
  var panel = $('#complaint-panel');
  var checkboxs = panel.find('input[type=checkbox]:checked');
  var reason = '';
  if(price) reason = '价格不符';
  else $.each(checkboxs, function(i, c) { reason += $(c).val() + ' '; });
  reason = $.trim(reason);
  var api = '/api/complaints/new';
  if(reason !== '') {
    $.post(api, { uid: uid, commodity: id, reason: reason }, function(data) {
      if(price) alertAutoHideMessage('感谢您！小编一会就改好~');
      else {
        var btn = panel.find('.big-btn');
        btn.css('background-color', '#cacccb').html('举报受理中').removeAttr('onclick');
        hideComplaintView();
      }
    });
  } else alertMessage(MOODs.dejected, '必须选择一个原因哟~');
}

// 弹出评论编辑器
function showCommentEditor(id, main, nickname) {
  var effect = 'animated bounceInUp';
  var item = $('#comment-editor');
  var content = $('#comment-textarea');
  var parent = $('#comment-parent-input');
  var cParent = $('#comment-cid-input');
  if (nickname) {
    // 判断之前是否有其他引用, 如果有其他引用就删除
    content.val('[回复: ' + nickname + '] ');
    parent.val(id);
    cParent.val(main);
  } else content.val('');
  item.css('height', document.body.clientHeight + 'px');
  item.show();
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.removeClass(effect);
  });
}

// 隐藏评论编辑器
function hideCommentEditor(cb) {
  var effect = 'animated bounceOutDown';
  var item = $('#comment-editor');
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.hide();
    item.removeClass(effect);
    if (cb) cb();
  });
}

function iCommentIt() {
  var btn = $('#send-comment-btn');
  var link = btn.attr('href');
  btn.attr('href', '###');
  var id = $('#commodity-id').val();
  var comment = $.trim($('textarea#comment-textarea').val());
  var parent = $('#comment-parent-input');
  var cParent = $('#comment-cid-input');
  var api = '/api/commodities/' + id + '/comments';
  var reg = /^\[回复:.*\]$/g;
  if (!comment || comment === '' || comment.match(reg)) {
    hideCommentEditor(function() { btn.attr('href', link); });
    return;
  }
  $.post(api, {
    comment: comment,
    parent: parent.val(),
    main: cParent.val()
  }, function(data) {
    hideCommentEditor(function() {
      $('.not-review-text').remove();
      $('.topic-comments-area').removeClass('not-review');
      loadComments(5);
      btn.attr('href', link);
    });
  });
}
