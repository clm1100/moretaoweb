$(function() {
  var url = '/api/tags/list/user_hobbies';
  var tpl = doT.template($('#hobby-tpl').html());
  $.get(url, function(data) {
    var html = tpl(data);
    var area = $('.slick_content_like ul');
    area.html(html);
  });

  tianchong($('.sel_year'), $('.sel_month'), $('.sel_day'));
  $('.slick_content_like ul').on('click', 'li', function() {
    if($(this).find('.icon').hasClass('show')) {
      $(this).find('.icon').removeClass('show');
      $(this).find('.mengceng').addClass('zhezhao');
      $(this).find('.signup-thumb').css('backgroundSize', '120%');
    }else{
      $(this).find('.icon').addClass('show');
      $(this).find('.mengceng').removeClass('zhezhao');
      $(this).find('.signup-thumb').css('backgroundSize', '100%');
    }
  });

  $('.slick_content_head_down .img').click(function() {
    var sex = $(this).attr('data-id');
    $('#child_sex').val(sex);
    $('.img .icon').hide();
    $(this).find('.icon').show();
  });
});
$(document).ready(function() {
  showReturnArrow('javascript:window.history.back();');
  $('body').css('background-color', '#f7f7f7');
  var loader = new ImagePreview('#user-avatar-input', {
    placeholder:'#user-avatar-img',
    callback:function() { $('#user-avatar-img').find('> img').click(function() {showFileChoose();}); }
  });
});

function showFileChoose() {
  return $('#user-avatar-input').click();
}

function checkInvitationCode() {
  var num = $.trim($('#signup-form').find('input[name=invitation_code]').val());
  var url = '/api/invitation_code/' + num;

  if(!num || num.length < 1) { alertMessage(MOODs.dejected, '请填写邀请码'); return; }

  $.get(url, function(data) {
    if(data && data.code) $('.slick-container').slick('slickNext');
    else alertMessage(MOODs.dejected, '没找到这个邀请码哦');
  });
}

function checkMobileCode() {
  var mobile = $.trim($('#signup-form').find('input[name=mobile]').val());
  var code = $.trim($('#signup-form').find('input[name=code]').val());
  var api = '/api/users/exist/mobile/' + mobile;
  var isMobile = !!mobile.match(/^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/);

  if(!isMobile) { alertMessage(MOODs.dejected, '请填写正确的手机号码'); return; }

  $.get(api, function(json) {
    if (json.result > 0) {
      alertMessage(MOODs.dejected, '这个手机号已经注册过啦');
      return;
    }
  });

  if(code.length < 1) { alertMessage(MOODs.dejected, '请填写正确的验证码'); return; }

  $('.slick-container').slick('slickNext');
}

function sendSmsCode() {
  var mobile = $('#signup-form').find('input[name=mobile]').val();

  if(!(/^1[3|4|5|8][0-9]\d{4,8}$/.test(mobile))) {
    alertMessage(MOODs.dejected, '请填写正确的手机号码');
    return false;
  }

  var url = '/signup/code/' + mobile;

  var btn = $('#send-sms-btn');

  btn.bind('click', false);

  $.get(url, function(data) {
    if(data.code === 1) btn.unbind('click', false);
    alertMessage(MOODs.dejected, data.msg);
  });

  return true;
}

function submitForm() {
  var form = $('#signup-form');
  var action = form.attr('action');

  var avatar = document.getElementById('user-avatar-input').files[0];
  var formData = new FormData();

  formData.append('username', $('#username-input').val());
  formData.append('password', $('#password-input').val());
  formData.append('code', form.find('input[name=code]').val());
  formData.append('mobile', form.find('input[name=mobile]').val());
  formData.append('invitation_code', form.find('input[name=invitation_code]').val());
  formData.append('avatar', avatar);
  if(!$('#password-input').val()) {
    alertMessage(MOODs.dejected, '信息不全');
    return true;
  }
  $.ajax({
    url:action,
    type:'POST',
    data:formData,
    mimeType:'multipart/form-data',
    contentType:false,
    cache:false,
    processData:false,
    success:function(data, status, xhr) {
      if(!data.error) {
        data = JSON.parse(data);
        if(data.status.toString === '500') {
          alertMessage(MOODs.dejected, data.msg);
        }else{
          $('#user-id').val(data.user.id);
          $('.slick-container').slick('slickNext');
        }
      }
    }
  });
  return true;
}

function submitForm2() {
  var userid = $('#user-id').val();
  var sex = $('#child_sex').val();
  var year = $('.sel_year').val();
  var month = $('.sel_month').val();
  var day = $('.sel_day').val();
  var birthday = year + '-' + month + '-' + day;
  birthday = new Date(birthday);

  var hobbyes = [];
  $('span.show').each(function(index, element) {
    hobbyes.push($(element).attr('date-id'));
  });
  $.ajax({
    url:'/api/users/' + userid + '/hobbies',
    type:'POST',
    data:{ sex:sex, hobbies:hobbyes, birthday:birthday },

    success:function(data, status, xhr) { if(!data.error) window.location.href = '/'; }
  });
}
function tianchong($YearSelector, $MonthSelector, $DaySelector) {
  var yearNow = new Date().getFullYear();
  var monthNow = parseInt(new Date().getMonth()) + 1;
  var dayNow = new Date().getDate();

  var i, sed;

  for (i = yearNow; i >= 1980; i--) {
    sed = yearNow === i ? 'selected' : '';
    var yearStr = '<option value="' + i + '"' + sed + '>' + i + '</option>';
    $YearSelector.append(yearStr);
  }

  for (i = 1; i <= 12; i++) {
    sed = monthNow === i ? 'selected' : '';
    var monthStr = '<option value="' + i + '"' + sed + '>' + i + '</option>';
    $MonthSelector.append(monthStr);
  }

  for (i = 1; i <= 31; i++) {
    sed = dayNow === i ? 'selected' : '';
    var dayStr = '<option value="' + i + '"' + sed + '>' + i + '</option>';
    $DaySelector.append(dayStr);
  }

  function BuildDay() {
    if ($YearSelector.val() === 0 || $MonthSelector.val() === 0) {
      $DaySelector.html('');
    } else {
      $DaySelector.html('');
      var year = parseInt($YearSelector.val());
      var month = parseInt($MonthSelector.val());
      var dayCount = 0;
      switch (month) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
          dayCount = 31;
          break;
        case 4:
        case 6:
        case 9:
        case 11:
          dayCount = 30;
          break;
        case 2:
          dayCount = 28;
          if ((year % 4 === 0) && (year % 100 !== 0) || (year % 400 === 0)) {
            dayCount = 29;
          }
          break;
        default:
          break;
      }

      var daySel = $DaySelector.attr('rel');
      for (var i = 1; i <= dayCount; i++) {
        var sed = daySel === i ? 'selected' : '';
        var dayStr = '<option value="' + i + '" ' + sed + '>' + i + '</option>';
        $DaySelector.append(dayStr);
      }
    }
  }
  if($DaySelector.attr('rel') !== '') {
    BuildDay();
  }
}
