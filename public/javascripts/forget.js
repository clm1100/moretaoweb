function sendSmsCode(){var a=$("#reset-form").find("input[name=mobile]").val();if(!/^1[3|4|5|8][0-9]\d{4,8}$/.test(a))return alertMessage(MOODs.dejected,"请填写正确的手机号码"),!1;var b="/api/forget/code/"+a,c=$("#send-sms-btn");return c.bind("click",!1),$.get(b,function(a){200===a.status&&c.unbind("click",!1),alertMessage(MOODs.dejected,a.msg)}),!0}function submitForm(){var a=$("#reset-form"),b=a.attr("action"),c=$.trim(a.find("input[name=mobile]").val()),d=$.trim(a.find("input[name=code]").val()),e=$.trim(a.find("input[name=password]").val());return c.length<1||d.length<1||e.length<1?(alertMessage(MOODs.dejected,"所有的信息都需要填写哦"),!1):($.post(b,a.serialize(),function(a){a.error?alertMessage(MOODs.dejected,a.error):window.location.href="/signin"}),!1)}$(document).ready(function(){showReturnArrow("javascript:window.history.back();"),$("body").css("background-color","#f7f7f7")});