/**
 * Created by Mamba on 5/20/15.
 */
$(document).ready(function() {
  $('#pull-to-refresh').hide();
  showReturnArrow('/user');
});

function onChangeTab(index) {
  $('.slick-container').slick('slickGoTo', index);
  var tabs = $('#user-follows-toolbar div.link');
  tabs.removeClass('active');
  var item = $(tabs[index]);
  item.addClass('active');
}

// 用户关注标签
function subscribe(uid, tid) {
  if(!uid || uid.length === 0) window.location.href = '/signin';

  var api = '/api/users/' + uid + '/tags/' + tid;

  $.post(api, function(data) {
    var effect = 'animated bounceIn';
    var btn = $('#subscribe-btn');
    btn.addClass('active').html('已关注');
    btn.addClass(effect);
    btn.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      btn.removeClass(effect);
      btn.attr('onclick', 'unsubscribe("' + uid + '", "' + tid + '");');
    });
  });
}

// 用户取消关注标签
function unsubscribe(uid, tid) {
  var api = '/api/users/' + uid + '/tags/' + tid;
  $.delete(api, function(data) {
    var effect = 'animated bounceIn';
    var btn = $('#subscribe-btn');
    btn.removeClass('active').html('&#65291; 关注');
    btn.addClass(effect);
    btn.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      btn.removeClass(effect);
      btn.attr('onclick', 'subscribe("' + uid + '", "' + tid + '");');
    });
  });
}

function iFollowIt(uid, fid) {
  var url = '/api/users/' + uid + '/follow/' + fid;
  $.post(url, function(data) {
    if(!data.error) location.reload(true);
  });
}

function iUnfollowIt(uid, fid) {
  alertConfirm('提示', '从此要当路人了吗? ', MOODs.blackline, '友尽', function() {
    var url = '/api/users/' + uid + '/unfollow/' + fid;
    $.post(url, function(data) {
      if(!data.error) location.reload(true);
    });
  });
}
