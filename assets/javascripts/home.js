/**
 * Created by Mamba on 4/28/15.
 */

// API 列表
var choiceApiUrl = '/api/commodities/choice/pages/',
  allApiUrl = '/api/search/keyword/*/',
  tagsApiUrl = '/api/search/tag/:key/',
  categoriesApiUrl = '/api/search/category/:key/',
  searchApiUrl = '/api/search/keyword/:key/';

/* filters page 预设变量和方法 */
var pageApiUrl = choiceApiUrl, pageSize = 10, filtersContainer = '.filters-area', pageAllFilters, isShowCategories = true;
function resetGridContainer() { /* filters 页面覆盖, 不需要实现 */ }
function setUpFilters(isRefresh) { /* filters 页面覆盖, 不需要实现 */ }

$(document).ready(function() {
  activeToolbarItem('btn-topics');
  resetGridContainer();
});

// 变更 Tab
function onTabChanged(tid) {
  var item = $('#tab-' + tid);
  var features = $('#home-recommends');
  var filtersArea = $(filtersContainer);

  $('.home-top-nav div.item').removeClass('home-top-nav-current');
  item.addClass('home-top-nav-current');

  pageAllFilters = '';
  isShowCategories = true;

  $('.tab-fragments').html('');

  if(tid === 'home') {
    filtersArea.hide();
    features.show();
    pageApiUrl = choiceApiUrl;
    pageSize = 10;

    resetGridContainer();
  } else {
    features.hide();
    pageSize = 20;

    var isShowFilter = false;
    if(tid === 'filter') {
      isShowFilter = true;
      pageApiUrl = allApiUrl;
    } else {
      // Tab 类型判断
      var type = parseInt(item.data('type'));
      var ref = item.data('ref');

      if(type === 1) {
        // 分类
        isShowFilter = true;
        isShowCategories = (ref && ref.length !== 24);
        pageApiUrl = categoriesApiUrl.replace(':key', ref);
      } else if(type === 2) {
        // 标签
        isShowFilter = true;
        pageApiUrl = tagsApiUrl.replace(':key', ref);
      } else if(type === 3) {
        // 专题
      } else if(type === 4) {
        // 搜索
        isShowFilter = true;
        pageApiUrl = searchApiUrl.replace(':key', ref);
      } else {
        // 其他
      }
    }

    // 如果需要就显示过滤器, 并刷新商品列表
    if(isShowFilter) {
      filtersArea.show();
      setUpFilters(true);
    }
  }
}

function onPageLoaded(data, index) {
  if(index === 0 && data && data.fragments && data.fragments.length > 0) {
    var fragmentsTpl = doT.template($('#fragments-tpl').text());
    if(data.fragments) {
      var html = fragmentsTpl(data);
      $('.tab-fragments').html(html);
    }
  }
}
