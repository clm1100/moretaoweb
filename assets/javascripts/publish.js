/* global top_works_list, top_ip_list, top_brand_list, top_search_list */

/**
 * Created by Mamba on 4/28/15.
 */
var publishData = null;
var childTriggered = false;
var isShowTip = true;
var usedTags = 'moretao-used-tags';

$(document).ready(function() {
  showReturnArrow('/publish');
  $('#alert-auto-hide-panel').css('display', 'none');
  // 提示局域
  $('#publish-click-tip').bind('tap click', function(event) {
    event.stopPropagation();
    event.preventDefault();

    isShowTip = false;

    $('#publish-click-tip').remove();
  });

  // 加载主图
  var mainImg = $('#publish-main-img');
  var image = mainImg.find('> img');
  image.attr('data-original', url('#main', window.location.href) + '!content');

  // 强制指定主图大小
  var container = $('#container');
  image.css('width', container.width());
  image.css('height', container.width());

  var first = $('#publish-img-slick').find('.publish-img:first');
  first.css('background', 'url("' + url('#main', window.location.href) + '!thumb' + '") no-repeat');
  first.css('background-size', 'contain');
  var mainLabel = $($('#publish-main-img-label-tpl').clone());
  mainLabel.attr('id', 'publish-main-img-label');
  mainLabel.removeClass('hide');
  first.append(mainLabel);

  $('img.lazy').lazyload({
    container: image,
    effect: 'fadeIn'
  });

  // 加载主图上可移动的标签
  mainImg.find('.custom-tag').pep({
    useCSSTranslation: false,
    constrainTo: 'parent'
  });

  mainImg.hammer().bind('tap', function(event) {
    if (isShowTip) return false;
    if (childTriggered) {
      childTriggered = false;
      return false;
    }

    $('#custom-tag-menu').hide();
    var point = event.gesture.pointers[0];

    $('#add-tag-x-input').val(point.clientX);
    $('#add-tag-y-input').val(point.clientY);

    var view = $('#add-tag-model');
    $('#add-tag-input').find('input').val('');
    $('#add-tag-id').val('new');
    view.foundation('reveal', 'open');

    return true;
  });

  // 添加图片
  $('#publish-img-input').change(function() {
    // 加载进度条
    var panel = $('#progress-model-panel');
    panel.find('.progress-bar').css('width', '0%');
    panel.foundation('open');
    $(document).on('opened.fndtn.reveal', '[data-reveal]', function() {
      panel.find('.progress-bar').animate({ width: '90%' }, 5000);
    });

    var api = '/api/photos/upload/signature';
    var file = document.getElementById('publish-img-input').files[0];
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
          panel.find('.progress-bar').animate({ width: '100%' }, function() {
            $('#progress-model-panel').foundation('close');
            var json = JSON.parse(data);
            var img = 'http://dev.images.moretao.com' + json.url + '!thumb';
            var html = $('#publish-img-tpl').clone();
            html.attr('id', null);
            html.removeClass('hide');
            html.css('background', 'url(' + img + ') no-repeat');
            html.css('background-size', 'contain');

            var slick = $('#publish-img-slick');
            slick.slick('slickAdd', html);
            slick.slick('slickGoTo', slick.find('.publish-img').length);

            resetPhotosPosition();
          });
        }
      });
    });
  });

  var used = JSON.parse(localStorage.getItem(usedTags));
  if (used && used.length > 0) {
    var area = $('#used-tags-area');
    $.each(used, function(i, item) {
      area.append('<div onclick="addCustomTag($(this).html())">' + item + '</div>');
    });
  }

  autosize($('#desc-textarea'));
  $('#add-tag-background').click(function() {
    $('#add-tag-model').foundation('reveal', 'close');
  });

  setTimeout(function() {
    html2canvas(document.body, {
      proxy: '/api/outdata'
    }).then(function(canvas) {
      makeBlurBg(canvas);
      $('#add-tag-background img').attr('src', canvas.toDataURL());
      $('#add-data-tag-background img').attr('src', canvas.toDataURL());
    });
  }, 1000);
});

// 模糊提示显示位置
var autoComplete;
var setAutoCompleteTop2 = document.getElementById('get-ip-top-value').offsetTop / 5.3;
var setAutoCompleteTop1 = document.getElementById('get-works-top-value').offsetTop / 8;
var allelement = ['publish-work-div', 'publish-ip-div', 'publish-brand-div', 'publish-currency-div', 'publish-price-div', 'publish-name-div', 'up-btn', 'next-btn'];

/* eslint camelcase: 0 */
// 获取作品
function getWorks() {
  autoComplete = new AutoComplete('publish-works-input', top_works_list, setAutoCompleteTop1, allelement);
}

// 获取角色
function getIp() {
  autoComplete = new AutoComplete('publish-ip-input', top_ip_list, setAutoCompleteTop2, allelement);
}

// 获取品牌
function getBrand() {
  autoComplete = new AutoComplete('publish-brand-input', top_brand_list, setAutoCompleteTop2, allelement);
}

function hideAutoComplete() {
  deleteAutoComplete(allelement);
}

// 生成毛玻璃特效的背景
function makeBlurBg(canvas) {
  var container = $('#container');
  var width = container.width();
  var height = container.height();
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, width, height);
  var img = StackBlur.imageDataRGBA(imageData, 0, 0, width, height, 16);
  var data = img.data;
  var value = 0.7;
  for (var i = 0; i < data.length; i += 4) {
    // red
    data[i] *= value;
    // green
    data[i + 1] *= value;
    // blue
    data[i + 2] *= value;
    // alpha
    data[i + 3] = 255 * 0.9;
  }

  ctx.putImageData(img, 0, 0);
}

// 设置主图
function setMain(index) {
  if (index === 1) return;

  var slick = $('#publish-img-slick');
  var current = $(slick.find('.publish-img')[index - 1]);
  var url = $(current).css('background-image').replace('url(', '').replace('!thumb)', '!content');
  var image = $('#publish-main-img').find('> img');

  image.fadeOut(500, function() {
    image.attr('src', url);
    image.fadeIn(500);
  });

  var slide = current.clone();
  slick.slick('slickRemove', index);
  slick.slick('slickAdd', slide, 0);

  var first = slick.find('.publish-img:first');
  var mainLabel = $($('#publish-main-img-label-tpl').clone());
  mainLabel.attr('id', 'publish-main-img-label');
  mainLabel.removeClass('hide');

  $('#publish-main-img-label').remove();

  first.append(mainLabel);

  resetPhotosPosition();

  slick.slick('slickGoTo', 0);
}

// 重置 photos 的顺序
function resetPhotosPosition() {
  $.each($('#publish-img-slick').find('.publish-img'), function(i, img) {
    var image = $(img);
    var index = i + 1;
    image.find('> a').attr('href', 'javascript:setMain(' + index + ')');
    image.find('.publish-img-delete-btn > a').attr('href', 'javascript:deletePhoto(' + index + ')');
  });
}

// 删除图片
function deletePhoto(index) {
  var slick = $('#publish-img-slick');
  slick.slick('slickRemove', index);
  setMain(0);
  resetPhotosPosition();
}

// 添加用户自定义标签
function addCustomTag(val) {
  val = $.trim(val);
  if (val.length === 0) {
    $('#add-tag-model').foundation('reveal', 'close');
    return;
  }

  var mainImg = $('#publish-main-img');
  var oid = $('#add-tag-id').val();
  var id;

  if (oid === 'new') {
    var html = $('#custom-tag-tpl').clone();
    id = parseInt(Math.random() * 1000 + 1);
    html.attr('id', id);
    html.removeClass('hide');
    mainImg.append(html);
    mainImg.find('.custom-tag').pep({
      useCSSTranslation: false,
      constrainTo: 'parent',
      stop: function(e) {
        // 弹出编辑菜单
        var width = $('#container').width();
        var item = $(e.target).parent();
        var menu = $('#custom-tag-menu');
        var left = parseInt(item.css('left')) + (parseInt(item.css('width')) / 2 - 50);
        var top = parseInt(item.css('top')) - parseInt(menu.css('height'));
        if (left < 100) {
          left = 100;
        } else if (width - left < 100) {
          left = width - 100;
        }
        bindTagEditMenu(item, menu);

        menu.animate({
          left: left,
          top: top
        });
      }
    });
  } else {
    id = oid;
  }

  var tag = $('#' + id);
  var top = parseInt($('#add-tag-y-input').val());
  var left = parseInt($('#add-tag-x-input').val());
  var total = parseInt($('#container').width());

  var width = 16 * 0.8 * val.length + 38;
  var height = 16 * 0.8 + 24;

  var offsetX = left + width - total;
  if (offsetX > 0) left = left - offsetX;

  if (top < 10) top = 10;
  if (top > total - height) top = total - height;

  tag.css('top', top + 'px');
  tag.css('left', left + 'px');
  tag.find('.txt').html(val);

  var used = JSON.parse(localStorage.getItem(usedTags));
  if (!used) used = [];
  if (used.length > 10) used = used.splice(0, 9);
  if (used.indexOf(val) < 0) used.unshift(val);

  localStorage.setItem(usedTags, JSON.stringify(used));

  // 弹出编辑菜单
  tag.hammer().bind('press', function(event) {
    var item = $(event.target);

    // 弹出编辑菜单
    var menu = $('#custom-tag-menu');
    menu.show();
    var width = $('#container').width();
    var left = parseInt(item.css('left')) + (parseInt(item.css('width')) / 2 - 50);
    var top = parseInt(item.css('top')) - parseInt(menu.css('height'));
    if (left < 100) {
      left = 100;
    } else if (width - left < 100) {
      left = width - 100;
    }

    menu.animate({
      left: left,
      top: top
    });

    bindTagEditMenu(item, menu);

    childTriggered = true;
    event.stopPropagation();
  });

  // 翻转圆点位置
  tag.hammer().bind('tap', function(event) {
    $('#custom-tag-menu').hide();
    var item = $(event.target);

    var dot = item.find('.dot');
    var txt = item.find('.txt');
    var point = parseInt(dot.css('left'));

    if (point === 0) {
      dot.animate({
        left: parseInt(txt.css('width')) + 4
      });
      txt.animate({
        'border-radius': '10px 0 10px 0'
      });
    } else {
      dot.animate({
        left: 0
      });
      txt.animate({
        'border-radius': '0 10px 0 10px'
      });
    }

    event.stopPropagation();
    childTriggered = true;
    return false;
  });

  $('#add-tag-model').foundation('reveal', 'close');
}

function bindTagEditMenu(item, menu) {
  $('.current-editing-tag').removeClass('current-editing-tag');

  item.addClass('current-editing-tag');

  // 打开编辑界面
  menu.find('.leftside img').hammer().bind('tap', function(event) {
    var view = $('#add-tag-model');
    view.foundation('reveal', 'open');

    var val = item.find('.txt').html();

    $('#add-tag-x-input').val(parseInt(item.css('left')));
    $('#add-tag-y-input').val(parseInt(item.css('top')));
    $('#add-tag-id').val(item.attr('id'));
    $('#add-tag-input').find('input').val(val);
    $('#custom-tag-menu').hide();

    $('.current-editing-tag').removeClass('current-editing-tag');

    childTriggered = true;
    event.stopPropagation();
    return false;
  });

  menu.find('.rightside img').hammer().bind('tap', function(event) {
    $('.current-editing-tag').remove();
    $('#custom-tag-menu').hide();

    childTriggered = true;
    event.stopPropagation();
    return false;
  });
}

function gotoDataTagView() {
  var view = $('#add-data-tag-panel');
  $('#publish-main-slick').slick('slickNext');
  $('#hide-select-currency-panel').click(function() {
    var panel = $('#select-currency-panel');
    panel.animate({
      bottom: -188,
      left: 0
    }, function() {
      panel.hide();
    });
  });
}

function gotoDescView() {
  $('#select-currency-panel').hide();
  var prev = $('#add-data-tag-panel');
  var view = $('#add-desc-panel');
  view.find('.row img').attr('src', $('#publish-main-img').find('> img').attr('src'));
  $('#publish-main-slick').slick('slickNext');
}

function showCurrencySelect() {
  var panel = $('#select-currency-panel');
  panel.show();
  panel.animate({
    bottom: 0,
    left: 0
  });
}

function selectCurrency(val, label) {
  var dataPanel = $('#add-data-tag-panel');
  dataPanel.find('input[name=currency]').val(val);
  dataPanel.find('input[name="currency-label"]').val(label);
  var panel = $('#select-currency-panel');
  panel.animate({
    bottom: -188,
    left: 0
  }, function() {
    panel.hide();
  });
}

function publish() {
  var btn = $('#publish-commodity-btn');
  btn.unbind();

  // 图片
  var images = [];
  var imageItems = $('#publish-img-slick').find('.publish-img');

  $.each(imageItems, function(i, img) {
    var url = $(img).css('background-image').replace('url(', '').replace('!thumb)', '');
    images.push(url);
  });

  // 自定义标签
  var tags = [];
  var tagItems = $('#publish-main-img').find('.custom-tag');
  var total = $('#container').width();

  $.each(tagItems, function(i, tag) {
    var t = $(tag);
    var txt = t.find('.txt').html();
    var point = parseInt(t.find('.dot').css('left'));
    var x = parseInt(t.css('left').replace('px', ''));
    var y = parseInt(t.css('top').replace('px', ''));
    tags.push({
      txt: txt,
      x: (x / total),
      y: (y / total),
      o: (point === 0 ? 'l' : 'r')
    });
  });

  // 结构化数据
  var works = $('input[name=works]').val();
  var ip = $('input[name=ip]').val();
  var brand = $('input[name=brand]').val();
  var title = $('input[name=title]').val();
  var currency = $('input[name=currency]').val();
  var price = $('input[name=price]').val();
  var url = $('input[name=url]').val();
  var desc = $('textarea[name=desc]').val();

  var data = {
    images: images,
    tags: tags,
    works: works,
    ip: ip,
    brand: brand,
    title: title,
    currency: currency,
    price: price,
    url: url,
    desc: desc
  };

  var api = '/publish';
  $.post(api, {
    data: data
  }, function(result) {
    if (result.err) {
      alertMessage('发布失败', '发布好像出问题了', MOODs.blackline);
      btn.click(function() {
        publish();
      });
    } else window.location.href = '/commodities/' + result.result.id + '#status=new';
  });
}
