/*
 * 全局商品瀑布流分页
 * 使用:
 *   1. include filters
 *   2. 可以在外部页面设置以下参数
 *      pageSize(每页记录数),
 *      pageApiUrl(获取数据的 API URL),
 *      pageContainer(商品容器的 css 选择器),
 *      filtersContainer(过滤容器的 css 选择器)
 *      onPageLoaded(翻页 Callback 函数)
 */

// 相关参数
var commoditiesArea, masonryArea, pageContainer = typeof(pageContainer) !== 'undefined' ? pageContainer : '.grid-items-container';
var pageApiUrl = typeof(pageApiUrl) !== 'undefined' ? pageApiUrl : '/api/commodities/choice/pages/';
var pageSize = typeof(pageSize) !== 'undefined' ? pageSize : 20, currentIndex = -1, currentTotal = pageSize, pageAllFilters = '';
var filtersContainer = typeof(filtersContainer) !== 'undefined' ? filtersContainer : '';
var isShowCategories = typeof(isShowCategories) !== 'undefined' ? isShowCategories : true;
var onPageLoaded = typeof(onPageLoaded) !== 'undefined' ? onPageLoaded : function(data, index) {};

$(document).ready(function() {
  setUpFilters();
});

function setUpFilters(isRefresh) {
  if(filtersContainer && filtersContainer.length > 1) {
    var tpl = doT.template($('#filters-tpl').text());
    $.get('/api/tags/filters', function(data) {
      data.isShowCategories = isShowCategories;
      var html = $(tpl(data));
      $(filtersContainer).html(html);
      $('.filter-slick-container').slick();

      if(isRefresh) resetGridContainer();
    });
  }
}

// 过滤器选择事件
function onFilterSelected(fid, index) {
  var item = $('#' + fid);
  $('.filter-group[data-index=' + index + ']').removeClass('active');
  item.addClass('active');

  var groups = $('.filter-group'), max = 0, data = {};

  $.each(groups, function(index, it) {
    var ind = parseInt($(it).data('index'));
    if(ind >= max) max = ind;
  });

  $.each(groups, function(index, it) {
    it = $(it);
    var ind = parseInt(it.data('index')), is = it.hasClass('active');

    if(is && ind === 0) { data.category = it.data('d'); }
    if(is && ind === max) { data.sort = JSON.stringify(it.data('d')); }
    if(is && ind !== max && ind !== 0) {
      if(!data.tags) data.tags = [];
      if($.trim(it.data('d')).length > 0) data.tags.push(it.data('d'));
    }
  });
  pageAllFilters = '/' + encodeURIComponent(JSON.stringify(data));

  resetGridContainer();
}

// 重置商品列表
function resetGridContainer() {
  currentIndex = -1;
  currentTotal = pageSize;

  if(commoditiesArea) {
    commoditiesArea.masonry('destroy');
    commoditiesArea = null;
  }
  $(pageContainer).html('');
  onNextPage();
}

// 商品分页
function onNextPage() {
  if(currentTotal < 0) return;
  if(currentIndex > -1) showLoading();
  Waypoint.destroyAll();

  currentIndex++;

  var tpl = doT.template($('#commodity-tpl').text());

  $.get(pageApiUrl + currentIndex + pageAllFilters, function(data) {
    data.list = data.list ? data.list : data.items;
    var html = $(tpl(data));
    var grid = $(pageContainer);
    grid.append(html);

    if(commoditiesArea) {
      grid.imagesLoaded(function() {
        commoditiesArea.masonry('appended', html);
        pageLazyloadImage(data);
        onPageLoaded(data, currentIndex);
      });
    } else {
      commoditiesArea = grid.imagesLoaded(function() {
        masonryArea = grid.masonry({ itemSelector:'.grid-item', isAnimated:true });
        pageLazyloadImage(data);
      });
    }
  });
}

function pageLazyloadImage(data) {
  // Lazy 加载图片
  $('img.lazy').lazyload({ container: $('#container'), effect : 'fadeIn', load:function() {
    masonryArea.masonry({ isAnimated:false });
    $('img.lazy').removeClass('lazy');
  } });
  closeLoading();
  bindNextPage(parseInt(data.total));
  onPageLoaded(data, currentIndex);
}

// 翻页事件绑定
function bindNextPage(total) {
  // 页数计算
  currentTotal = total;
  if((currentIndex + 1) * pageSize > currentTotal) currentTotal = -1;

  var opts = { offset: 'bottom-in-view', context: $('#container') };
  $('#bottom-area').waypoint(function() { onNextPage(); }, opts);
}
