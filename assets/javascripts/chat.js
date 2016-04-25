/**
 * Created by Mamba on 5/23/15.
 */
'use strict';
var autoInterval;
$(document).ready(function() {
  showReturnArrow('/messages');

  var input = $('#chat-send-msg-area').find('input');
  input.focus(function() {
    $('#chat-send-msg-area').css('top', '45%');
    clearInterval(autoInterval);
  });

  input.blur(function() {
    $('#chat-send-msg-area').css('top', 'auto');
    $('#chat-send-msg-area').css('bottom', 0);
    autoInterval = setInterval(function() { history.go(0); }, 15000);
  });

  var imgInput = $('#chat-img-input');

  imgInput.click(function() {
    clearInterval(autoInterval);
  });

  imgInput.change(function() {
    var current = $('#application-current-user-id').val();
    var tid = url(-1, window.location.href);
    var api = '/api/chat/' + current + '/to/' + tid;
    var file = document.getElementById('chat-img-input').files[0];

    var form = new FormData();
    form.append('photo', file);

    $.ajax({
      url: api,
      type: 'POST',
      data: form,
      mimeType: 'multipart/form-data',
      contentType: false,
      cache: false,
      processData:false,
      success: function(data, status, xhr) {
        history.go(0);
      }
    });
  });

  $('#container').animate({ scrollTop:$('#chat-area').height() });

  autoInterval = setInterval(function() { history.go(0); }, 15000);
});

function sendMessage(current) {
  var tid = url(-1, window.location.href);
  var txt = $.trim($('#chat-msg-input').val());
  if(!txt || txt.length < 2) { return false; }

  var api = '/api/chat/' + current + '/to/' + tid;

  $.ajax({
    url: api,
    type: 'POST',
    data: { txt:txt },
    mimeType: 'multipart/form-data',
    success: function(data, status, xhr) { history.go(0); }
  });

  return true;
}
