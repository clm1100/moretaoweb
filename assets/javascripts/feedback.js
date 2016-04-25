/**
 * Created by Mamba on 5/23/15.
 */
$(document).ready(function() {
  showReturnArrow('/settings');
});

function submitFeedback() {
  var form = $('#feedback-form');
  var feedbackText = $.trim(form.find('textarea').val());
  var contactInformation = $.trim(form.find('input[name=c]').val());
  if (feedbackText.length < 1 || contactInformation.length < 1) {
    alertMessage(MOODs.dejected, '消息', '两项都为必填哦~');
    return false;
  } else if (feedbackText.length < 10) {
    alertMessage(MOODs.dejected, '意见至少要写10个字哦~');
    return false;
  } else {
    $.post('/api/suggests', form.serialize(), function(data) {
      if(data.status && data.status === 500) alertMessage(MOODs.dejected, data.msg);
      else alertMessage(MOODs.great, '非常感谢您的支持!', null, '客气辣', function() { window.location.href = '/settings'; });
    });

    return true;
  }
}
