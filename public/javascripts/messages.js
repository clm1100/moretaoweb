function getAdminMessages(){var a=doT.template($("#admin-tpl").text()),b="/api/users/"+$("#current_user_id").val()+"/messages/from/魔淘";$.get(b,function(b){var c=a(b);$("#from-user-list").prepend(c)})}function chat(a){window.location.href="/chat/"+a}$(document).ready(function(){showReturnArrow("/user"),getAdminMessages()});