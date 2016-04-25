/**
 * Created by Mamba on 5/23/15.
 */
var NoticeType = {
  commodity_zan: 'commodity-zan',
  follow: 'follow',
  unfollow: 'unfollow'
};

$(document).ready(function() {
  showReturnArrow('/user');
  var user = $('#users-id').val();
  var url = '/api/notices/' + user + '/readall';
  $.post(url, function(data) { /* 无需处理 */ });
});

function read(id, url) {
  var api = '/api/notices/' + id + '/read';
  $.post(api, function(data) { window.location.href = url; });
}
