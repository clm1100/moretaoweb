/**
 * Created by Mamba on 5/23/15.
 */
$(document).ready(function() {
  showReturnArrow('/user');
});
var $isOpen = $('.mt-switch');
var isPublic;
function showMe(id) {
  if($isOpen.attr('checked')) {
    $isOpen.removeAttr('checked');
    isPublic = false;
  } else {
    $isOpen.attr('checked', 'checked');
    isPublic = true;
  }
  $.post('/api/users/' + id + '/exhibition', { isPublic:isPublic }, function(data) { /* 无需处理 */ });
}
