/*
 * 全局评论显示页
 * 使用:
 *   1. include comments, 并传递 current 参数
 *   2. 添加 class 为 comments-area 的 div
 */

// 显示评论列表
function setupComments(comments) {
  var area = $('.comments-area');
  var tpl = doT.template($('#comments-tpl').text());

  var html = tpl({ items:comments });
  html = $.sntext(html, {
    debug: false,
    onAt: function(at, txt) { return '<a href="/users/search/' + $.removeHTMLTags(txt) + '" class="in-at-link">' + at + '</a>'; },
    onTag: function(tag, txt) { return '<a href="/search/activity/' + $.removeHTMLTags(txt) + '" class="in-comment-link">' + tag + '</a>'; }
  });
  area.html('');
  $(html).hide().appendTo(area).fadeIn(500);
}

// 弹出@好友页面
function showFindUserEditor(id) {
  var url = '/api/users/' + id + '/friends';
  var effect = 'animated bounceInUp';
  var item = $('#find-user-editor');
  var atFriendTpl = doT.template($('#at-friend-tpl').text());
  $('.comment-search-input').val(''); // 清空自定义输入框
  item.css('height', document.body.clientHeight + 'px');
  item.show();
  item.addClass(effect);
  $.get(url, function(data) {
    var followersList = data.followers.items;
    var fansList = data.fans.items;
    var followersAndFans = followersList.concat(fansList);
    var friendList = [];
    for (var i = 0; i < followersAndFans.length; i++) {
      if (friendList.indexOf(followersAndFans[i]) === -1) friendList.push({ name: followersAndFans[i].nickname, icon: followersAndFans[i].icon });
    }
    var html = atFriendTpl(friendList);
    $('#friend-list').html(html);
  });

  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.removeClass(effect);
  });
}

// 添加新的@朋友到评论输入框
function newFriendClick() {
  atFriend($('#friend-input').val());
  hideFindActivityEditor();
}

// 隐藏@好友
function hideFindUserEditor(cb) {
  var effect = 'animated bounceOutDown';
  var item = $('#find-user-editor');
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.hide();
    item.removeClass(effect);
    if(cb) cb();
  });
}

// 弹出话题页面
function showFindActivityEditor() {
  var url = '/api/activities/hots/10';
  var effect = 'animated bounceInUp';
  var item = $('#find-activity-editor');
  var atFriendTpl = doT.template($('#activity-tpl').text());
  $('.comment-search-input').val('');

  item.css('height', document.body.clientHeight + 'px');
  item.show();
  item.addClass(effect);
  $.get(url, function(data) {
    var html = atFriendTpl(data);
    $('#activity-list').html(html);
  });

  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.removeClass(effect);
  });
}

// 添加新的话题到评论输入框
function newActivityClick() {
  activityClick($('#activity-input').val());
  hideFindActivityEditor();
}

// 隐藏话题弹框
function hideFindActivityEditor(cb) {
  var effect = 'animated bounceOutDown';
  var item = $('#find-activity-editor');
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.hide();
    item.removeClass(effect);
    if(cb) cb();
  });
}

// 把@的人传给评论框
function atFriend(name) {
  var nickname = name;
  var commentText = $('#comment-textarea').val();
  $('#comment-textarea').val(commentText + ' ' + '@' + nickname + ' ');
  hideFindUserEditor();
}

// 把话题传给评论框
function activityClick(text) {
  var insert = text;
  var commentText = $('#comment-textarea').val();
  $('#comment-textarea').val(commentText + '#' + insert + '#');
  hideFindActivityEditor();
}
