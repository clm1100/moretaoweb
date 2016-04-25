/**
 * Created by Mamba on 4/28/15.
 */
$(document).ready(function() {
  activeToolbarItem('btn-topics');
  topicsPage();
});

var currentIndex = -1;
var currentTotal = 10;

function topicsPage() {
  if(currentTotal < 0) return;
  if(currentIndex > -1) showLoading();
  Waypoint.destroyAll();

  currentIndex++;

  var size = 10;

  var url = '/api/topics/pages/' + currentIndex;
  var tpl = doT.template($('#topic-tpl').text());

  $.get(url, function(data) {
    var html = tpl(data);
    var area = $('#topics-area');
    $(html).hide().appendTo(area).fadeIn(1000);
    closeLoading();

    // 页数计算
    currentTotal = parseInt(data.total);
    if((currentIndex + 1) * size > currentTotal) currentTotal = -1;

    var opts = { offset:'bottom-in-view', context:$('#container') };
    $('#bottom-area').waypoint(function() { topicsPage(); }, opts);
  });
}

function iZanIt(id) {
  var item = $('#zan' + id);
  var url = '/api/topics/' + id + '/zans';
  var effect = 'animated bounceIn';
  item.css('color', '#e84034');
  item.addClass(effect);
  $(item).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $.post(url, function(data) {
      item.addClass('active');

      var countItem = $('#zan-count-' + id);
      $('#zan' + id + ' > a').attr('href', 'javascript:iCancelZanIt("' + id + '");');

      countItem.html(data.result);
      item.removeClass(effect);
    });
  });
}

function iCancelZanIt(id) {
  var item = $('#zan' + id);
  var url = '/api/topics/' + id + '/zans/cancel';
  var effect = 'animated bounceIn';
  item.css('color', '#e84034');
  item.addClass(effect);
  $(item).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    $.post(url, function(data) {
      item.removeClass('active');

      var countItem = $('#zan-count-' + id);
      $('#zan' + id + ' > a').attr('href', 'javascript:iZanIt("' + id + '");');

      countItem.html(data.result);
      item.removeClass(effect);
    });
  });
}
