/* global top_works_list, top_ip_list, top_brand_list, top_search_list */

/**
 * Created by Mamba on 5/21/15.
 */
var historySearchItems = 'moretao-history-search';

/* filters page 预设变量和方法 */
var pageApiUrl = '/api/commodities/all/pages/', pageSize = 10, pageAllFilters, isShowCategories = true;
function resetGridContainer() { /* filters 页面覆盖, 不需要实现 */ }
function setUpFilters(isRefresh) { /* filters 页面覆盖, 不需要实现 */ }

$(document).ready(function() {
  activeToolbarItem('btn-search');
  $('#autoComplete-background').on('touchmove', function(e) { e.preventDefault(); });

  var histories = localStorage.getItem(historySearchItems);
  var used = histories && histories.length > 0 ? JSON.parse(histories) : null;
  if(used && used.length > 0) {
    $('#clear-history-btn').show();
    var area = $('#search-history-area');
    $.each(used, function(i, item) {
      area.append('<div><div class="tag"><a href="javascript:search(\'' + item + '\', null, null)">' + item + '</a></div></div>');
    });
  } else $('#clear-history-btn').hide();

  var tpl = doT.template($('#search-hots-tpl').text());
  var hotsArea = $('#search-hots-area');

  var html = tpl({ tags:top_search_list });
  $(html).hide().appendTo(hotsArea).fadeIn(500);

  var input = $('#search-keyword-input');
  input.focus(function() {
    input.addClass('active');
    $('.search-submit-btn').show();
  });

  input.keyup(function(event) {
    if ($.trim(input.val()).length > 0) $('.search-submit-btn, .clear-search-input-btn').show();
    else $('.search-submit-btn, .clear-search-input-btn').hide();

    if (event.keyCode === '13') search(input.val(), null, null);
  });

  resetGridContainer();
});

function clearHistory() {
  localStorage.setItem(historySearchItems, '{}');
  $('#clear-history-btn').hide();
  var area = $('#search-history-area');
  area.html('');
}

function clearSearchInput() {
  var input = $('#search-keyword-input');
  input.val('');
  input.removeClass('active');
  $('.search-submit-btn, .clear-search-input-btn').hide();
}

function search(keyword, category, tag) {
  var api = '/search/$TYPE/$VALUE';
  if(keyword && keyword.length > 0) {
    api = api.replace('$TYPE', 'keyword').replace('$VALUE', encodeURIComponent(keyword));

    var histories = localStorage.getItem(historySearchItems);
    var used = histories && histories.length > 0 ? JSON.parse(histories) : [];

    if(used.length > 10) used = used.splice(0, 9);
    if(used.indexOf(keyword) < 0) used.unshift(keyword);

    localStorage.setItem(historySearchItems, JSON.stringify(used));
  }

  if(category && category.length > 0) api = api.replace('$TYPE', 'category').replace('$VALUE', category);
  if(tag && tag.length > 0) api = api.replace('$TYPE', 'tag').replace('$VALUE', tag);

  var form = $('#search-form');
  form.attr('action', api);
  localStorage.setItem(searchReturnUrl, '/search');
  form.submit();
}

// 模糊提示
function getSearch() {
  var searchResult = [];
  var autoComplete = new AutoComplete(
    'search-keyword-input',
    searchResult.concat(top_brand_list, top_ip_list, top_works_list, top_search_list),
    10,
    null,
    function(keyword) { search(keyword, null, null); }
  );
}
