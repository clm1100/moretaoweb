/* global all_regions */

/**
 * Created by zhangxiaodong on 16/1/13.
 */
var mtLocationsParams = {
  province_code: null,
  city_code: null,
  district_code: null,
  street_code: null,
  is_edit: null,
  isDefault: null,
  to: $('#to'),
  phone: $('#phone'),
  province: $('#province'),
  city: $('#city'),
  district: $('#district'),
  street: $('#street'),
  zip: $('#zip'),
  addr: $('#addr'),
  lid: null,
  is_new: null
};

$(document).ready(function() {
  showReturnArrow('/user-location');
});

// 弹出编辑器
function showLocationEditor(id, edit) {
  var effect = 'animated bounceInUp';
  var item = $('#location-editor');
  if(edit) {
    mtLocationsParams.is_edit = true;
    mtLocationsParams.lid = id;
    mtLocationsParams.is_new = false;
    $('.editor-title').html('编辑收货地址');
    mtLocationsParams.street.find('input').val('');
    $.get('/api/addresses/' + mtLocationsParams.lid, function(data) {
      mtLocationsParams.to.find('input').val(data.to);

      mtLocationsParams.phone.find('input').val(data.phone);

      mtLocationsParams.province.find('input').val(all_regions[data.province].data.n);
      mtLocationsParams.province_code = all_regions[data.province].data.c;

      mtLocationsParams.city.find('input').val(all_regions[data.province].items[data.city].data.n);
      mtLocationsParams.city_code = all_regions[data.province].items[data.city].data.c;

      mtLocationsParams.district.find('input').val(all_regions[data.province].items[data.city].items[data.district].data.n);
      mtLocationsParams.district_code = all_regions[data.province].items[data.city].items[data.district].data.c;

      $.get('/api/regions/' + data.district + '/subs', function(item) {
        if (item.length > 0) {
          var streetName;
          $('#location-table-street').css('display', 'block');
          for(var i = 0; i < item.length; i++) {
            if(item[i].code === data.street) {
              streetName = item[i].name;
              mtLocationsParams.street_code = item[i].code;
              mtLocationsParams.street.find('input').val(streetName);
              return;
            }
          }
        } else {
          $('#location-table-street').css('display', 'none');
          mtLocationsParams.street_code = null;
        }
      });
      mtLocationsParams.zip.find('input').val(data.zip);
      mtLocationsParams.addr.find('input').val(data.addr);
    });
  } else {
    mtLocationsParams.is_new = true;
    mtLocationsParams.is_edit = false;
    mtLocationsParams.province_code = null;
    mtLocationsParams.city_code = null;
    mtLocationsParams.district_code = null;
    mtLocationsParams.street.find('input').val('');
    $('#location-table-street').css('display', 'block');
    var items = [
      mtLocationsParams.to,
      mtLocationsParams.phone,
      mtLocationsParams.province,
      mtLocationsParams.city,
      mtLocationsParams.district,
      mtLocationsParams.street,
      mtLocationsParams.zip,
      mtLocationsParams.addr
    ];
    $.each(items, function(index, item) { item.find('input').val(''); });
  }
  item.css('height', document.body.clientHeight + 'px');
  item.show();
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.removeClass(effect);
  });
  $('.new-location-btn-body').css('display', 'none');
}

// 隐藏编辑器
function hideEditor(type) {
  var effect;
  var item = $('#location-editor');
  if(type !== 'location') {
    effect = 'animated bounceOutRight';
    item = $('#province-editor');
  } else effect = 'animated bounceOutDown';

  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.hide();
    item.removeClass(effect);
  });
  $('.new-location-btn-body').css('display', 'block');
}

// province-editor city-editor district-editor street-editor
// 弹出编辑器
function showProvinceEditor(type) {
  var tpl = doT.template($('#' + type + '-tpl').text());
  var regionSelectionBody = $('#location-region-selection-body');
  var data;
  var errorMsg;

  if(type === 'province') {
    tpl(all_regions);
    regionSelectionBody.html(tpl);
    $('.province-editor-title').html('选择省/地区');
  }

  if(type === 'city') {
    if(!mtLocationsParams.province_code) errorMsg = '请先选择省/地区';
    else {
      data = all_regions[mtLocationsParams.province_code].items;
      regionSelectionBody.html(tpl(data));
      $('.province-editor-title').html('选择城市');
    }
  }

  if(type === 'district') {
    if(!mtLocationsParams.province_code) errorMsg = '请先选择省/地区';
    else if(!mtLocationsParams.city_code) errorMsg = '请先选择市';
    else {
      data = all_regions[mtLocationsParams.province_code].items[mtLocationsParams.city_code].items;
      regionSelectionBody.html(tpl(data));
      $('.province-editor-title').html('选择区/县');
    }
  }

  if(type === 'street') {
    if(!mtLocationsParams.province_code) errorMsg = '请先选择省/地区';
    else if(!mtLocationsParams.city_code) errorMsg = '请先选择市';
    else if(!mtLocationsParams.district_code) errorMsg = '请先选择区/县';
    else {
      $.get('/api/regions/' + mtLocationsParams.district_code + '/subs', function(data) {
        regionSelectionBody.html(tpl(data));
        $('.province-editor-title').html('选择街道');
      });
    }
  }

  if(errorMsg && errorMsg.length > 0) { alertAutoHideMessage(errorMsg); return; }

  var item = $('#province-editor');
  var effect = 'animated bounceInRight';

  item.css('height', document.body.clientHeight + 'px');
  item.show();
  item.addClass(effect);
  item.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
    item.removeClass(effect);
  });
}

// 获取当前点击项的code
function getCode(type, code, name) {
  var tpl;
  var regionSelectionBody = $('#location-region-selection-body');
  var data;

  if(type === 'province') {
    // 选择地区的任意选项都清空此项之下的选项
    var items = [mtLocationsParams.city_code, mtLocationsParams.district_code, mtLocationsParams.street_code];
    $.each(items, function(index, item) { item = null; });

    items = [mtLocationsParams.city, mtLocationsParams.district, mtLocationsParams.street];
    $.each(items, function(index, item) { item.find('input').val(''); });

    mtLocationsParams.province_code = code;
    mtLocationsParams.province.find('input').val(name);
    tpl = doT.template($('#city-tpl').text());
    data = all_regions[code].items;
    regionSelectionBody.html(tpl(data));
    $('.province-editor-title').html('选择城市');
  } else if(type === 'city') {
    if(!code) showProvinceEditor(type);
    else {
      // 选择地区的任意选项都清空此项之下的选项
      mtLocationsParams.district_code = null;
      mtLocationsParams.district.find('input').val('');
      mtLocationsParams.street_code = null;
      mtLocationsParams.street.find('input').val('');


      mtLocationsParams.city_code = code;
      mtLocationsParams.city.find('input').val(name);
      tpl = doT.template($('#district-tpl').text());
      data = all_regions[mtLocationsParams.province_code].items[mtLocationsParams.city_code].items;
      regionSelectionBody.html(tpl(data));
      $('.province-editor-title').html('选择区县');
    }
  } else if(type === 'district') {
    if(!code) showProvinceEditor(type);
    else {
      // 选择地区的任意选项都清空此项之下的选项
      mtLocationsParams.street_code = null;
      mtLocationsParams.street.find('input').val('');

      mtLocationsParams.district_code = code;
      mtLocationsParams.district.find('input').val(name);
      tpl = doT.template($('#street-tpl').text());
      $.get('/api/regions/' + mtLocationsParams.district_code + '/subs', function(data) {
        if (data.length > 0) {
          regionSelectionBody.html(tpl(data));
          $('#location-table-street').css('display', 'block');
        } else {
          hideEditor(type);
          $('#location-table-street').css('display', 'none');
        }
      });
      $('.province-editor-title').html('选择街道');
    }
  } else {
    if(!code) showProvinceEditor('street');
    else {
      mtLocationsParams.street_code = code;
      mtLocationsParams.street.find('input').val(name);
      hideEditor(type);
    }
  }
}

// 保存
function saveLocation(uid) {
  var phoneNum = mtLocationsParams.phone.find('input').val();
  var patrnNum = mtLocationsParams.zip.find('input').val();
  var toStr = mtLocationsParams.to.find('input').val();
  var addrStr = mtLocationsParams.addr.find('input').val();
  var errorMsg;

  if(!toStr || toStr.length < 1 || !addrStr || addrStr.length < 5 || !mtLocationsParams.district_code) errorMsg = '请将信息填写完整';
  if(!checkPhoneNumber.test(phoneNum)) errorMsg = '请输入正确的手机号';
  if(!checkPatrnNumber.test(patrnNum)) errorMsg = '请输入正确的邮政编码';

  if(errorMsg) alertAutoHideMessage(errorMsg);
  else {
    if(mtLocationsParams.is_new) mtLocationsParams.lid = null;
    $.post('/api/addresses', {
      id:mtLocationsParams.lid,
      user:uid,
      province:mtLocationsParams.province_code,
      city:mtLocationsParams.city_code,
      district:mtLocationsParams.district_code,
      street:mtLocationsParams.street_code,
      zip:patrnNum,
      addr:addrStr,
      to:toStr,
      phone:phoneNum,
      isDefault:isDefault
    }, function(data) {
      hideEditor('location');
      location.reload();
    });
  }
}

// 删除地址
function deleteLocation() {
  alertConfirm('', '确定删除这个地址吗', MOODs.blackline, '删除', function() {
    $.delete('/api/addresses/' + mtLocationsParams.lid, function(data) { location.reload(); });
  });
}

// 修改默认地址
function isDefault(id) {
  var prefix = '#' + id + '_location_';
  var props = ['user', 'province', 'city', 'district', 'street', 'zip', 'addr', 'to', 'phone', 'isDefault'];
  var params = {};
  $.each(props, function(index, item) {
    params[item] = $(prefix + item).val();
  });
  params.id = id;

  $.post('/api/addresses', params, function(data) { location.reload(); });
}
