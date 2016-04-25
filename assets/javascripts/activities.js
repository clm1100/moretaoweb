/**
 * Created by zhangxiaodong on 15/10/19.
 */

$(document).ready(function() {
  activeToolbarItem('btn-activity');
  getActivities();
});

var pagesNumber = -1; // 请求数据的起始节点
var currentTotal = 10;
// function getActivities(){
//  if(currentTotal < 0) return;
//  if(pagesNumber > -1) show_loading();
//  Waypoint.destroyAll();
//
//  pagesNumber++;
//
//  var size = 10;
//  var api = '/api/activities/pages/' + pagesNumber;
//  var tpl = doT.template($('#activity-tpl').text());
//  $.get(api, function(data) {
//    var html = tpl(data);
//    $('.activity-center').html(html);
//    close_loading();
//
//    pagesNumber++;
//
//    var url = '/api/activities/pages/' + pagesNumber;
//    $.get(url, function(data) {
//      if ( data.list.length <= 0 ) return;
//      var html = tpl(data);
//      $('.activity-center').html(html);
//      allelement = $('.activity-body');
//      // 页数计算
//      currentTotal = parseInt(data.total);
//      if((current_index + 1) * size > currentTotal) currentTotal = -1;
//    })
//    var opts = {offset: 'bottom-in-view', context: $('#container')};
//    $('#bottom-area').waypoint(function() {
//      getActivities();
//    }, opts);
//  })
// }

function getActivities() {
  if(currentTotal < 0) return;
  if(pagesNumber > -1) showLoading();
  Waypoint.destroyAll();

  pagesNumber++;

  var size = 10;

  var url = '/api/activities/pages/' + pagesNumber;
  var tpl = doT.template($('#activity-tpl').text());

  $.get(url, function(data) {
    var html = tpl(data);
    var area = $('.activity-center');
    $(html).hide().appendTo(area).fadeIn(1000);
    closeLoading();

    // 页数计算
    currentTotal = parseInt(data.total);
    if((pagesNumber + 1) * size > currentTotal) currentTotal = -1;

    var opts = { offset:'bottom-in-view', context:$('#container') };
    $('#bottom-area').waypoint(function() {
      getActivities();
    }, opts);
  });
}
// 添加切换动画
// function add_animation(allelement) {
//   var time =  $(allelement[0]).attr('data-time');//活动时间
//   var day =  $(allelement[0]).attr('data-day');//活动星期几
//   getTime(time, day);
//   $(allelement[0]).find('.control-img-size').css({'height':'60vh', 'margin-top':'0vh'}).find('.activity-img-mode').css('background','rgba(0, 0, 0, .0)');
//   $('.activity-center').on('beforeChange', function(event, slick, index, next ){
//     time =  $(allelement[next]).attr('data-time');//轮播下一个的活动时间
//     day =  $(allelement[next]).attr('data-day');//轮播下一个的活动星期几
//     getTime(time, day);
//     $(allelement[next+1]).find('.control-img-size').css({'height':'54vh', 'margin-top':'3vh'}).find('.activity-img-mode').css('background','rgba(0, 0, 0, .4)');
//     $(allelement[next-1]).find('.control-img-size').css({'height':'54vh', 'margin-top':'3vh'}).find('.activity-img-mode').css('background','rgba(0, 0, 0, .4)');
//     $(allelement[next]).find('.control-img-size').css({'height':'60vh', 'margin-top':'0vh'}).find('.activity-img-mode').css('background','rgba(0, 0, 0, .0)');
//  });
// }

function getTime(time, day) {
  $('.activity-time').find('p').html(time + '&nbsp;&nbsp;&nbsp;' + day);
}
