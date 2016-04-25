/**
 * Created by Mamba on 5/23/15.
 */
$(document).ready(function() {
  showReturnArrow('/user');
  getAdminMessages();
});

function getAdminMessages() {
  var tpl = doT.template($('#admin-tpl').text());
  var api = '/api/users/' + $('#current_user_id').val() + '/messages/from/魔淘';
  $.get(api, function(data) {
    var html = tpl(data);
    $('#from-user-list').prepend(html);
  });
}

function chat(uid) {
  window.location.href = '/chat/' + uid;
}
