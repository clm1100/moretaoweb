function showLocationEditor(a,b){var c="animated bounceInUp",d=$("#location-editor");if(b)mtLocationsParams.is_edit=!0,mtLocationsParams.lid=a,mtLocationsParams.is_new=!1,$(".editor-title").html("编辑收货地址"),mtLocationsParams.street.find("input").val(""),$.get("/api/addresses/"+mtLocationsParams.lid,function(a){mtLocationsParams.to.find("input").val(a.to),mtLocationsParams.phone.find("input").val(a.phone),mtLocationsParams.province.find("input").val(all_regions[a.province].data.n),mtLocationsParams.province_code=all_regions[a.province].data.c,mtLocationsParams.city.find("input").val(all_regions[a.province].items[a.city].data.n),mtLocationsParams.city_code=all_regions[a.province].items[a.city].data.c,mtLocationsParams.district.find("input").val(all_regions[a.province].items[a.city].items[a.district].data.n),mtLocationsParams.district_code=all_regions[a.province].items[a.city].items[a.district].data.c,$.get("/api/regions/"+a.district+"/subs",function(b){if(b.length>0){var c;$("#location-table-street").css("display","block");for(var d=0;d<b.length;d++)if(b[d].code===a.street)return c=b[d].name,mtLocationsParams.street_code=b[d].code,void mtLocationsParams.street.find("input").val(c)}else $("#location-table-street").css("display","none"),mtLocationsParams.street_code=null}),mtLocationsParams.zip.find("input").val(a.zip),mtLocationsParams.addr.find("input").val(a.addr)});else{mtLocationsParams.is_new=!0,mtLocationsParams.is_edit=!1,mtLocationsParams.province_code=null,mtLocationsParams.city_code=null,mtLocationsParams.district_code=null,mtLocationsParams.street.find("input").val(""),$("#location-table-street").css("display","block");var e=[mtLocationsParams.to,mtLocationsParams.phone,mtLocationsParams.province,mtLocationsParams.city,mtLocationsParams.district,mtLocationsParams.street,mtLocationsParams.zip,mtLocationsParams.addr];$.each(e,function(a,b){b.find("input").val("")})}d.css("height",document.body.clientHeight+"px"),d.show(),d.addClass(c),d.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){d.removeClass(c)}),$(".new-location-btn-body").css("display","none")}function hideEditor(a){var b,c=$("#location-editor");"location"!==a?(b="animated bounceOutRight",c=$("#province-editor")):b="animated bounceOutDown",c.addClass(b),c.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){c.hide(),c.removeClass(b)}),$(".new-location-btn-body").css("display","block")}function showProvinceEditor(a){var b,c,d=doT.template($("#"+a+"-tpl").text()),e=$("#location-region-selection-body");if("province"===a&&(d(all_regions),e.html(d),$(".province-editor-title").html("选择省/地区")),"city"===a&&(mtLocationsParams.province_code?(b=all_regions[mtLocationsParams.province_code].items,e.html(d(b)),$(".province-editor-title").html("选择城市")):c="请先选择省/地区"),"district"===a&&(mtLocationsParams.province_code?mtLocationsParams.city_code?(b=all_regions[mtLocationsParams.province_code].items[mtLocationsParams.city_code].items,e.html(d(b)),$(".province-editor-title").html("选择区/县")):c="请先选择市":c="请先选择省/地区"),"street"===a&&(mtLocationsParams.province_code?mtLocationsParams.city_code?mtLocationsParams.district_code?$.get("/api/regions/"+mtLocationsParams.district_code+"/subs",function(a){e.html(d(a)),$(".province-editor-title").html("选择街道")}):c="请先选择区/县":c="请先选择市":c="请先选择省/地区"),c&&c.length>0)return void alertAutoHideMessage(c);var f=$("#province-editor"),g="animated bounceInRight";f.css("height",document.body.clientHeight+"px"),f.show(),f.addClass(g),f.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){f.removeClass(g)})}function getCode(a,b,c){var d,e,f=$("#location-region-selection-body");if("province"===a){var g=[mtLocationsParams.city_code,mtLocationsParams.district_code,mtLocationsParams.street_code];$.each(g,function(a,b){b=null}),g=[mtLocationsParams.city,mtLocationsParams.district,mtLocationsParams.street],$.each(g,function(a,b){b.find("input").val("")}),mtLocationsParams.province_code=b,mtLocationsParams.province.find("input").val(c),d=doT.template($("#city-tpl").text()),e=all_regions[b].items,f.html(d(e)),$(".province-editor-title").html("选择城市")}else"city"===a?b?(mtLocationsParams.district_code=null,mtLocationsParams.district.find("input").val(""),mtLocationsParams.street_code=null,mtLocationsParams.street.find("input").val(""),mtLocationsParams.city_code=b,mtLocationsParams.city.find("input").val(c),d=doT.template($("#district-tpl").text()),e=all_regions[mtLocationsParams.province_code].items[mtLocationsParams.city_code].items,f.html(d(e)),$(".province-editor-title").html("选择区县")):showProvinceEditor(a):"district"===a?b?(mtLocationsParams.street_code=null,mtLocationsParams.street.find("input").val(""),mtLocationsParams.district_code=b,mtLocationsParams.district.find("input").val(c),d=doT.template($("#street-tpl").text()),$.get("/api/regions/"+mtLocationsParams.district_code+"/subs",function(b){b.length>0?(f.html(d(b)),$("#location-table-street").css("display","block")):(hideEditor(a),$("#location-table-street").css("display","none"))}),$(".province-editor-title").html("选择街道")):showProvinceEditor(a):b?(mtLocationsParams.street_code=b,mtLocationsParams.street.find("input").val(c),hideEditor(a)):showProvinceEditor("street")}function saveLocation(a){var b,c=mtLocationsParams.phone.find("input").val(),d=mtLocationsParams.zip.find("input").val(),e=mtLocationsParams.to.find("input").val(),f=mtLocationsParams.addr.find("input").val();(!e||e.length<1||!f||f.length<5||!mtLocationsParams.district_code)&&(b="请将信息填写完整"),checkPhoneNumber.test(c)||(b="请输入正确的手机号"),checkPatrnNumber.test(d)||(b="请输入正确的邮政编码"),b?alertAutoHideMessage(b):(mtLocationsParams.is_new&&(mtLocationsParams.lid=null),$.post("/api/addresses",{id:mtLocationsParams.lid,user:a,province:mtLocationsParams.province_code,city:mtLocationsParams.city_code,district:mtLocationsParams.district_code,street:mtLocationsParams.street_code,zip:d,addr:f,to:e,phone:c,isDefault:isDefault},function(a){hideEditor("location"),location.reload()}))}function deleteLocation(){alertConfirm("","确定删除这个地址吗",MOODs.blackline,"删除",function(){$["delete"]("/api/addresses/"+mtLocationsParams.lid,function(a){location.reload()})})}function isDefault(a){var b="#"+a+"_location_",c=["user","province","city","district","street","zip","addr","to","phone","isDefault"],d={};$.each(c,function(a,c){d[c]=$(b+c).val()}),d.id=a,$.post("/api/addresses",d,function(a){location.reload()})}var mtLocationsParams={province_code:null,city_code:null,district_code:null,street_code:null,is_edit:null,isDefault:null,to:$("#to"),phone:$("#phone"),province:$("#province"),city:$("#city"),district:$("#district"),street:$("#street"),zip:$("#zip"),addr:$("#addr"),lid:null,is_new:null};$(document).ready(function(){showReturnArrow("/user-location")});