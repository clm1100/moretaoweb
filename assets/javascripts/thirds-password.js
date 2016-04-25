$(document).ready(function() {
  showReturnArrow('javascript:window.history.back();');

  var form = $('#change-password-form');

  form.find('input[name=nickname]').focus(function() {
    $('.image-for-username').show();
    $('.image-for-password').hide();
  });

  form.find('input[type=password]').focus(function() {
    $('.image-for-username').hide();
    $('.image-for-password').show();
  });

  form.find('input[name=confirmPass]').keyup(function() {
    if(event.keyCode === '13') savePassword();
  });

  var message = $('.message').val();
  if($.trim(message).length > 0) alertMessage(MOODs.dejected, message);
});

function savePassword() {
  var form = $('#change-password-form');
  var pass = $.trim(form.find('input[name=pass]').val());
  var confirmPass = $.trim(form.find('input[name=confirmPass]').val());

  if(pass && confirmPass && pass.length > 0 && confirmPass.length > 0) $('#change-password-form').submit();
  else alertMessage(MOODs.dejected, '密码输入错误哦!');
}
