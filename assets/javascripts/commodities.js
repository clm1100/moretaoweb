/* jshint -W020 */
/* eslint no-native-reassign: 0 */
/**
 * Created by Mamba on 4/28/15.
 */
// var commoditiesPage;
$(document).ready(function() {
  activeToolbarItem('btn-discover');
  var container = $('#container');
  commoditiesPage();

  container.scroll(function() {
    var current = parseInt(container.scrollTop());
    if(current < 50) current = 0;
    if(Math.abs(current - pageCurrentTop) > 50) {
      pageCurrentTop = current;
      storeWithExpiration.set(pageCurrentStore, pageCurrentTop, 1800);
    }
  });

  var input = $('.header #search-keyword-input');

  input.focus(function() {
    input.addClass('active');
    $('.search-submit-btn').show();
  });

  input.keyup(function(event) {
    if ($.trim(input.val()).length > 0) {
      input.addClass('active');
      $('.search-submit-btn').show();
      $('.clear-search-input-btn').show();
    } else {
      input.removeClass('active');
      $('.search-submit-btn').hide();
      $('.clear-search-input-btn').hide();
    }

    if (event.keyCode === '13') {
      search(input.val(), null, null);
    }
  });

  pageCurrentTop = storeWithExpiration.get(pageCurrentStore);
  if(pageCurrentTop > 0) {
    container.animate({ scrollTop:pageCurrentTop }, 200);
  }

  // 单击阴影收藏夹隐藏
  $('#clear-touchmove').click(function(event) {
    var panel = $('#shoucang-alert-message-panel');
    if(this === event.target) panel.foundation('reveal', 'close');
  });
});
function commoditiesPage() {
  if(!startRun()) return;

  if(currentTotal < 0) {
    $('.not-more-tips-area').fadeIn();
    stopRun();
    return;
  }

  if(currentIndex > -1) showLoading();

  Waypoint.destroyAll();

  currentIndex++;

  var size = 10;

  var type = $('#index-type-input').val();
  var url = '/api/commodities/' + type + '/pages/' + currentIndex;

  $.get(url, function(data) {
    var tpl = doT.template($('#commodity-tpl').text());
    var html = tpl(data);
    var grid = $('#commodities-area');
    var container = $('#container');

    grid.append(html);

    grid.masonry({
      itemSelector: '.grid-item',
      isAnimated: true
    });

    $('img.lazy').lazyload({ container: container, effect : 'fadeIn' });

    // 页数计算
    currentTotal = parseInt(data.total);
    if((currentIndex + 1) * size > currentTotal) currentTotal = -1;

    closeLoading();
    pageCurrentTop = storeWithExpiration.get(pageCurrentStore);
    if(pageCurrentTop > 0) container.animate({ scrollTop:pageCurrentTop }, 500);

    var opts = { offset:'bottom-in-view', context:container };
    $('#bottom-area').waypoint(function() { commoditiesPage(); }, opts);
    stopRun();
  });
}

function clearSearchInput() {
  var input = $('.header #search-keyword-input');
  input.val('');
  input.removeClass('active');
  $('.search-submit-btn').hide();
  $('.clear-search-input-btn').hide();
}

function search(keyword, category, tag) {
  var api = '/search/$TYPE/$VALUE';
  if(keyword && keyword.length > 0) api = api.replace('$TYPE', 'keyword').replace('$VALUE', keyword);
  if(category && category.length > 0) api = api.replace('$TYPE', 'category').replace('$VALUE', category);
  if(tag && tag.length > 0) api = api.replace('$TYPE', 'tag').replace('$VALUE', tag);

  var form = $('#search-form');

  form.attr('action', api);

  localStorage.setItem(searchReturnUrl, '/');

  form.submit();
}

var currentIndex = -1;
var currentTotal = 10;
var follows;

function sntextHandle(html) {
  return $.sntext(html, {
    debug: false,
    onAt: function(at, txt) { return '<a href="/users/search/' + $.removeHTMLTags(txt) + '" class="in-at-link">' + at + '</a>';},
    onTag: function(tag, txt) {
      return '<a href=\'javascript:activityToSearch("' + $.removeHTMLTags(txt) + '", "/commodities")\' class="in-comment-link">' + tag + '</a>';
    }
  });
}

function iZanIt(id) {
  if(!startRun()) return;

  var effect = 'animated bounceIn';
  var item = $('#like' + id);
  item.css('color', '#e84034');
  item.addClass(effect);
  $(item).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    var url = '/api/commodities/' + id + '/zans';
    $.post(url, function(data) {
      var count = $('#zans-' + id + '-count');
      var val = parseInt(count.html());
      count.html(++val);
      $('#zans-' + id + '-btn').attr('href', 'javascript:iCancelZanIt("' + id + '");');
      item.removeClass(effect);

      stopRun();
    });
  });
}

function iCancelZanIt(id) {
  if(!startRun()) return;

  var effect = 'animated bounceIn';
  var item = $('#like' + id);
  item.css('color', 'rgba(232, 64, 52, 0.5)');
  item.addClass(effect);
  $(item).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    var url = '/api/commodities/' + id + '/zans/cancel';
    $.post(url, function(data) {
      var count = $('#zans-' + id + '-count');
      var val = parseInt(count.html());
      count.html(val > 0 ? --val : 0);
      $('#zans-' + id + '-btn').attr('href', 'javascript:iZanIt("' + id + '");');
      item.removeClass(effect);

      stopRun();
    });
  });
}

function iFollowIt(uid, fid) {
  if(!startRun()) return;

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
      follows.push(fid);
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

function iUnFollowIt(uid, fid) {
  if(!startRun()) return;
  var url = '/api/users/' + uid + '/unfollow/' + fid;
  $.post(url, function(data) {
    var btn = $('.follower-' + fid);
    btn.html('<span class="fa fa-plus"></span> 关注');
    btn.removeClass('active');
    var link = btn.parent();
    var href = link.attr('href');
    link.attr('href', href.replace('iUnFollowIt', 'iFollowIt'));

    follows.splice($.inArray(uid, follows), 1);

    stopRun();
  });
}

function iFavoriteIt(uid, id) {
  if (!startRun()) return;
  var effect = 'animated bounceIn';
  var item = $('#favorite' + id).find('> i');
  item.css('color', '#f4c51e');
  item.addClass(effect);
  $(item).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    var url = '/api/users/' + uid + '/favorites';
    $.get(url, function(data) {
      item.parent().attr('href', 'javascript:iUnFavoriteIt("' + uid + '", "' + id + '");');
      item.removeClass(effect);

      stopRun();
    });
  });
}

function iUnFavoriteIt(uid, id) {
  if (!startRun()) return;
  var effect = 'animated bounceIn';
  var item = $('#favorite' + id).find('> i');
  item.css('color', '#555353');
  item.addClass(effect);
  $(item).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    var url = '/api/users/' + id + '/favorites';
    // $.post(url, function(data) {
    //  var count = $('#favorites-' + id + '-count');
    //  var val = parseInt(count.html());
    //  count.html(++val);
    item.parent().attr('href', 'javascript:iFavoriteIt("' + uid + '", "' + id + '");');
    item.removeClass(effect);

    stopRun();
    // });
  });
}

function showCommodityWithComment(cid) {
  localStorage.setItem('with_comment', null);
  window.location.href = '/commodities/' + cid;
}

// var indexPageType = ['choice', 'all', 'follow'];
// function filterHomeList(index) {
//  var divs = $('#home-filter-toolbar').find('div.link');
//
//  $('#home-filter-toolbar-active').animate({ left: (index * 50) + '%'}, 300);
//  $.each(divs, function(i, item) {
//    var div = $(item);
//    if(i === index) div.addClass('active');
//    else div.removeClass('active');
//  });
//
//  var type = $('#index-type-input');
//  var old = type.val();
//
//  var current = indexPageType[index];
//
//  if(current != old) {
//    type.val(current);
//    current_index = -1;
//    current_total = 10;
//
//    $('#commodities-area').html('');
//
//    commoditiesPage();
//  }
// }
