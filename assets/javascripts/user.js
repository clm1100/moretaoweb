/**
 * Created by Mamba on 5/20/15.
 */
$(document).ready(function() {
  $('.user-no-public-img img').css('width', '49%');
  $('.header').hide();
  activeToolbarItem('btn-my');
  var like = $('.user-like-button');
  var publish = $('.user-publish-button');
  var topics = $('.like-topics-button');

  $('.slick-container').on('afterChange', function(event, slick, currentIndex) {
    var divs = $('#user-filter-toolbar').find('div.link');

    // $('#user-filter-toolbar-active').animate({ left: (currentIndex * 33.333) + '%'}, 300);三个Tab栏时显示的滑动坐标
    $('#user-filter-toolbar-active').animate({ left: (currentIndex * 50) + '%' }, 300);
    $.each(divs, function(i, item) {
      var div = $(item);
      if(i === currentIndex) {
        div.addClass('active');
        $('.slick-container').slick('slickGoTo', currentIndex);
      } else {
        div.removeClass('active');
        $('.slick-container').slick('slickGoTo', currentIndex);
      }
    });
  });

  $('.fa-times-circle').click(function() {
    $('#users-name-update-input').val('');
  });
});

function filterHomeList(index) {
  var divs = $('#user-filter-toolbar').find('div.link');
  // $('#user-filter-toolbar-active').animate({ left: (index * 33.333) + '%'}, 300);三个Tab栏时移动坐标
  $('#user-filter-toolbar-active').animate({ left: (index * 50) + '%' }, 300);
  $.each(divs, function(i, item) {
    var div = $(item);
    if(i === index) {
      div.addClass('active');
      $('.slick-container').slick('slickGoTo', index);
    } else {
      div.removeClass('active');
      $('.slick-container').slick('slickGoTo', index);
    }
  });
}

function iFollowIt(uid, fid) {
  var url = '/api/users/' + uid + '/follow/' + fid;
  $.post(url, function(data) {
    if(!data.error) {
      if(!data.error) {
        var link = $('.follow-btn-link');
        link.attr('href', 'javascript:iUnfollowIt("' + uid + '", "' + fid + '")');
        link.find('.user-big-btn').html('取消关注');
      }
    }
  });
}

function iUnfollowIt(uid, fid) {
  alertConfirm('提示', '从此要当路人了吗? ', MOODs.blackline, '友尽', function() {
    var url = '/api/users/' + uid + '/unfollow/' + fid;
    $.post(url, function(data) {
      if(!data.error) {
        var link = $('.follow-btn-link');
        link.attr('href', 'javascript:iFollowIt("' + uid + '", "' + fid + '")');
        link.find('.user-big-btn').html('<span class=\'fa fa-plus\'></span> 关注我');
      }
    });
  });
}
function newFavorite() {
  var id = url(-1, window.location.href);
  var fid = $('#favorite-id-input').val();
  var t = $('#users-name-update-input').val();
  var upDefaultId = $('#no-1-favorite-name').val();
  if($.trim(t).length < 1) return;

  var api = '/api/favorites/new';
  $.post(api, { id:fid, uid:id, t:t }, function(data) {
    var fid = data.item.id;
    window.location.href = '/favorites/' + fid;
  });
}

// 上传头图并进入发布页面
function gotoPublish() {
  var panel = $('#progress-model-panel');
  panel.find('.progress-bar').css('width', '0%');
  panel.foundation('open');
  $(document).on('opened.fndtn.reveal', '[data-reveal]', function() {
    panel.find('.progress-bar').animate({ width:'90%' }, 5000);
  });
  var api = '/api/photos/upload/signature';
  var file = document.getElementById('publish-main-img-input').files[0];
  var expiration = Math.floor(new Date().getTime() / 1000) + 86400;
  $.post(api, {
    filename: file.name,
    expiration: expiration
  }, function(data) {
    var form = new FormData();
    form.append('policy', data.policy);
    form.append('signature', data.signature);
    form.append('file', file);
    form.append('x-gmkerl-rotate', 'auto');
    $.ajax({
      url: 'http://v0.api.upyun.com/moretao-dev',
      type: 'POST',
      data: form,
      mimeType: 'multipart/form-data',
      contentType: false,
      cache: false,
      processData: false,
      success: function(data, status, xhr) {
        var json = JSON.parse(data);
        panel.find('.progress-bar').animate({ width:'100%' }, function() {
          $('#progress-model-panel').foundation('close');
          window.location.href = '/publish#main=' + 'http://dev.images.moretao.com' + json.url;
        });
      }
    });
  });
}
