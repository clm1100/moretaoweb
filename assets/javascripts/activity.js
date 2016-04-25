/* globals setupComments */

/**
 * Created by zhangxiaodong on 15/10/22.
 */

$(document).ready(function() {
  $('#pull-to-refresh').hide();
  showReturnArrow();
  loadComments(5);
});

function loadComments(number) {
  var id = url(-1, window.location.href);
  var tpl = doT.template($('#activity-comments-tpl').text());
  var api = '/api/activities/' + id + '/comments/' + number;

  $.get(api, function(data) {
    setupComments(data.items);
    $('.more-btn').hide();
  });
}

function showCommentEditor(id, main, nickname) {
  var effect = 'animated bounceInUp';
  var item = $('#comment-editor');

  var content = $('#comment-textarea');
  var parent = $('#comment-parent-input');
  var cParent = $('#comment-cid-input');

  if(nickname) {
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

function hideCommentEditor(cb) {
  var effect = 'animated bounceOutDown';
  var item = $('#comment-editor');
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.hide();
    item.removeClass(effect);
    if(cb) cb();
  });
}

function iCommentIt() {
  var btn = $('#send-comment-btn');
  var link = btn.attr('href');
  btn.attr('href', '###');

  var id = $('#activity-id').val();
  var comment = $.trim($('textarea#comment-textarea').val());
  var parent = $('#comment-parent-input');
  var cParent = $('#comment-cid-input');
  var api = '/api/activities/' + id + '/comments';

  var reg = /^\[回复:.*\]$/g;
  if(!comment || comment === '' || comment.match(reg)) {
    btn.attr('href', link);
    return;
  }

  $.post(api, { comment:comment, parent:parent.val(), main:cParent.val() }, function(data) {
    hideCommentEditor(function() {
      loadComments(5);
      btn.attr('href', link);
    });
  });
}

function iZanIt() {
  if(!startRun()) return;

  var id = $('#activity-id').val();
  var effect = 'animated bounceIn';
  var link = $('#btn-zan-link');
  var item = link.find('> i');
  item.addClass('active');
  item.addClass(effect);

  var url = '/api/activities/' + id + '/zans';

  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $.post(url, function(data) {
      var countItem = $('.zan-count');
      countItem.text(data.result);
      link.attr('href', 'javascript:iCancelZanIt("' + data.id + '");');
      item.removeClass(effect);
      stopRun();
    });
  });
}

function iCancelZanIt() {
  if(!startRun()) return;
  var id = $('#activity-id').val();
  var url = '/api/activities/' + id + '/zans/cancel';

  var effect = 'animated bounceIn';
  var link = $('#btn-zan-link');
  var item = link.find('> i');
  item.removeClass('active');
  item.addClass(effect);

  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $.post(url, function(data) {
      var countItem = $('.zan-count');
      countItem.text(data.result);
      link.attr('href', 'javascript:iZanIt();');
      item.removeClass(effect);
      stopRun();
    });
  });
}
