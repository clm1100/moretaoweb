$(document).ready(function() {
  showReturnArrow('javascript:window.history.back();');
  $('body').css('background-color', '#f7f7f7');
});

function sendSmsCode() {
  var mobile = $('#reset-form').find('input[name=mobile]').val();

  if(!(/^1[3|4|5|8][0-9]\d{4,8}$/.test(mobile))) {
    alertMessage(MOODs.dejected, '请填写正确的手机号码');
    return false;
  }

  var url = '/api/forget/code/' + mobile;

  var btn = $('#send-sms-btn');

  btn.bind('click', false);

  $.get(url, function(data) {
    if(data.status === 200) btn.unbind('click', false);
    alertMessage(MOODs.dejected, data.msg);
  });

  return true;
}

function submitForm() {
  var form = $('#reset-form');
  var action = form.attr('action');

  var mobile = $.trim(form.find('input[name=mobile]').val());
  var code = $.trim(form.find('input[name=code]').val());
  var password = $.trim(form.find('input[name=password]').val());

  if(mobile.length < 1 || code.length < 1 || password.length < 1) {
    alertMessage(MOODs.dejected, '所有的信息都需要填写哦');
    return false;
  }

  $.post(action, form.serialize(), function(data) {
    if(data.error) {
      alertMessage(MOODs.dejected, data.error);
    } else {
      window.location.href = '/signin';
    }
  });

  return false;
}
