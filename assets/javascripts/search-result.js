/* global top_works_list, top_ip_list, top_brand_list, top_search_list */

/**
 * Created by Mamba on 5/31/15.
 */

/* filters page 预设变量和方法 */
var pageApiUrl = '', pageSize = 20, pageAllFilters, filtersContainer = '.filters-area', isShowCategories = true;
function resetGridContainer() { /* filters 页面覆盖, 不需要实现 */ }
function setUpFilters(isRefresh) { /* filters 页面覆盖, 不需要实现 */ }
function onPageLoaded(data, index) {
  if(index > 0) return;
  var tagDesc = $('#search-result-tag-desc');
  var descTpl = doT.template($('#tag-desc-tpl').text());
  if(data.tag && data.tag.d) {
    tagDesc.show();
    var desc = descTpl({ item:data.tag, count:data.tag_count });
    tagDesc.html(desc);
  } else tagDesc.hide();

  var fragments = $('.home-fragments');
  var fragmentsTpl = doT.template($('#fragments-tpl').text());
  if(data.fragments) {
    var html = fragmentsTpl(data);
    fragments.html(html);
  }
}

$(document).ready(function() {
  $('.header').remove();
  $('body').css('background-color', '#f7f7f7');
  showReturnArrow('javascript:window.history.back();');
  $('#autoComplete-background').on('touchmove', function(e) { e.preventDefault(); });

  var link = localStorage.getItem(searchReturnUrl);
  $('.cancel-link').attr('href', localStorage.getItem(searchReturnUrl));

  var input = $('#search-result-keyword-input').find('> input');
  input.keyup(function(event) {
    if($.trim(input.val()).length > 0) {
      $('.search-submit-btn').show();
      $('.clear-search-input-btn').show();
    } else {
      $('.search-submit-btn').hide();
      $('.clear-search-input-btn').hide();
    }
  });

  if($.trim(input.val()).length > 0) { $('.clear-search-input-btn').show(); }

  var key = encodeURIComponent($('#search-key').val());
  var type = $('#search-type').val();

  pageApiUrl = '/api/search/' + type + '/' + key + '/';
  resetGridContainer();
});

function clearSearchInput() {
  var input = $('#search-result-keyword-input').find('> input');
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
  form.submit();
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

// 模糊提示
var searchResult = [];
var autoComplete;
function getSearch() {
  autoComplete = new AutoComplete(
    'search-result-input',
    searchResult.concat(top_brand_list, top_ip_list, top_works_list, top_search_list),
    10,
    null,
    function(keyword) { search(keyword, null, null); }
  );
}
