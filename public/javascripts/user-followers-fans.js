function onChangeTab(a){$(".slick-container").slick("slickGoTo",a);var b=$("#user-follows-toolbar div.link");b.removeClass("active");var c=$(b[a]);c.addClass("active")}function subscribe(a,b){a&&0!==a.length||(window.location.href="/signin");var c="/api/users/"+a+"/tags/"+b;$.post(c,function(c){var d="animated bounceIn",e=$("#subscribe-btn");e.addClass("active").html("已关注"),e.addClass(d),e.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){e.removeClass(d),e.attr("onclick",'unsubscribe("'+a+'", "'+b+'");')})})}function unsubscribe(a,b){var c="/api/users/"+a+"/tags/"+b;$["delete"](c,function(c){var d="animated bounceIn",e=$("#subscribe-btn");e.removeClass("active").html("&#65291; 关注"),e.addClass(d),e.one("webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend",function(){e.removeClass(d),e.attr("onclick",'subscribe("'+a+'", "'+b+'");')})})}function iFollowIt(a,b){var c="/api/users/"+a+"/follow/"+b;$.post(c,function(a){a.error||location.reload(!0)})}function iUnfollowIt(a,b){alertConfirm("提示","从此要当路人了吗? ",MOODs.blackline,"友尽",function(){var c="/api/users/"+a+"/unfollow/"+b;$.post(c,function(a){a.error||location.reload(!0)})})}$(document).ready(function(){$("#pull-to-refresh").hide(),showReturnArrow("/user")});