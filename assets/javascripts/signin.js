$(document).ready(function() {
  showReturnArrow('javascript:window.history.back();');

  // var state = {};
  // window.history.replaceState(state, '魔淘' ,'/');

  var form = $('#signin-form');

  form.find('input[name=password]').keyup(function() {
    if (event.keyCode === '13') {
      var name = $.trim(form.find('input[name=username]').val());
      var pass = $.trim(form.find('input[name=password]').val());

      if(name && pass && name.length > 0 && pass.length > 0) form.submit();
    }
  });

  var message = $('.message').val();
  if($.trim(message).length > 0) alertMessage(MOODs.dejected, '用户名或密码错误哦!');
});
