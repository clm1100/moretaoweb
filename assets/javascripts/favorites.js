/**
 * Created by zhangxiaodong on 15/8/20.
 */
$(document).ready(function() {
  showReturnArrow('/user');
  var width = $('.sliding-button').width;
  $('.sliding-button').click(function() {
    $('.sliding-button-block').css('margin-left', '50%');
  });
  edited();
  isOpenChange();
});

function removeFromFavorite(fid, cid) {
  var url = '/api/favorites/' + fid + '/commodities/' + cid + ' ';
  $.delete(url, function(data) {
    $('#' + cid).animate({ width: '0' }, function() { $('#' + cid).remove(); });
  });
}

function edited() {
  var $removeCommodity = $('.remove-favorite');
  var $editedBt = $('#edited-favorite-bt');
  var $favoritesNameInput = $('.favorites-name-input');
  var favoriteName = $favoritesNameInput.val();
  var $removeFolder = $('.mt-remove-folder');
  $editedBt.click(function() {
    $removeCommodity.toggle();
    if(favoriteName !== '默认') $removeFolder.toggle(); else $('#remove-all-favorite').css('display', 'none');
    if ($editedBt.hasClass('edited')) {
      $editedBt.text('完成').removeClass('edited');
      if (favoriteName !== '默认') {
        $favoritesNameInput.removeAttr('readonly').css({
          border: '1px #ebebeb solid',
          webkitBoxShadow: 'none',
          boxShadow: 'none'
        });
      }
    } else {
      $editedBt.text('编辑').addClass('edited');
      $favoritesNameInput.attr('readonly', 'readonly').css({
        border: 'none'
      });
      updateFavoriteName($favoritesNameInput.val());
    }
  });
}

function updateFavoriteName(name) {
  var fid = url(-1, window.location.href);
  var api = '/api/favorites/' + fid + '/name';

  if(name !== '默认') {
    $.post(api, { name: name }, function(data) {/* 忽略返回 */ });
  } else {
    $('#edited-favorite-bt').click();
    alertAutoHideMessage('默认收藏夹只能有一个哦~');
  }
}

function isOpenChange() {
  var fid = url(-1, window.location.href);
  var api = '/api/favorites/' + fid + '/isOpen';
  var $isOpen = $('.mt-switch');
  var $isOpenName = $('.is-public-input');
  var isOpen;
  $isOpen.change(function() {
    if ($isOpen.attr('checked')) {
      $isOpen.removeAttr('checked');
      $isOpenName.val('仅自己可见');
      isOpen = false;
    } else {
      $isOpen.attr('checked', 'checked');
      $isOpenName.val('所有人可见');
      isOpen = true;
    }
    $.post(api, { isOpen: isOpen });
  });
}

function deleteFavorite(fid) {
  alertConfirm('提示', '确定要删除这个收藏夹吗? ', MOODs.blackline, '删除', function() {
    var url = '/api/favorites/' + fid;
    $.delete(url, function(data) {
      if (!data.error) window.history.back();
    });
  });
}
