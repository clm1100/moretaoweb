$(document).ready(function() {
  $('#pull-to-refresh').hide();
  showReturnArrow('/user');

  var id = url(-1, window.location.href);

  $('#clear-users-name-text').click(function() {
    $('#users-name-update-input').val('');
  });

  $('#user-sex').click(function() {
    $('#user-birthday-update').css('display', 'none');
    $('#users-name-update').css('display', 'none');
    $('#user-sex-update').css('display', 'block');
    $('#users-autograph-update').css('display', 'none');
  });

  $('#user-avatar-input').change(function() {
    $('#info-update-form').submit();
  });

  $('#sex-b').click(function() {
    $('#user-sex-text').text('男');
    $('#sex-update-input').val(1);
    $('#info-update-form').submit();
  });

  $('#sex-g').click(function() {
    $('#user-sex-text').text('女');
    $('#sex-update-input').val(0);
    $('#info-update-form').submit();
  });

  $('#commit-user-name').click(function() {
    var usernameUpdate = $('#users-name-update-input').val();
    var usernameText = $('#users-name-text');
    if(usernameText.text() !== usernameUpdate) {
      var url = '/api/users/exist/' + usernameUpdate;
      $('#users-name-text').text(usernameUpdate);
      $('#name-update-input').val(usernameUpdate);
      $.get(url, function(data) {
        if(data.result === 0) {
          $('#info-update-form').submit();
          $('#user-info-edit-panel').hide();
          $('.reveal-modal-bg').hide();
        } else alertAutoHideMessage('这个昵称有人用了哟~');
      });
    } else {
      $('#user-info-edit-panel').hide();
      $('.reveal-modal-bg').hide();
    }
  });

  $('#user-birthday-input').blur(function() {
    $('#birthday-update-input').val($('#user-birthday-input').val());
    $('#info-update-form').submit();
  });

  $('#user-birthday-text').click(function() {$('#user-birthday-input').click();});

  var loader = new ImagePreview('#user-avatar-input', {
    placeholder: '#user-avatar-img',
    callback:function() {
      var avatarImg = $('#user-avatar-img').find('> img');
      avatarImg.click(function() { showFileChoose(); });
    }
  });

  $('#user-info-edit-panel').click(function() {
    $('.reveal-modal-bg').hide();
    $('#user-sex-update').hide();
  });
});

function nameUpdate() {
  $('#user-birthday-update').css('display', 'none');
  $('#user-sex-update').css('display', 'none');
  $('#users-autograph-update').css('display', 'none');
  $('#users-name-update').css('display', 'block');
}

function nameAutoGraph() {
  $('#user-birthday-update').css('display', 'none');
  $('#user-sex-update').css('display', 'none');
  $('#users-name-update').css('display', 'none');
  $('#users-autograph-update').css('display', 'block');
}

function showFileChoose() {
  return $('#user-avatar-input').click();
}
