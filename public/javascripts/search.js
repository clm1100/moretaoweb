function resetGridContainer(){}function setUpFilters(a){}function clearHistory(){localStorage.setItem(historySearchItems,"{}"),$("#clear-history-btn").hide();var a=$("#search-history-area");a.html("")}function clearSearchInput(){var a=$("#search-keyword-input");a.val(""),a.removeClass("active"),$(".search-submit-btn, .clear-search-input-btn").hide()}function search(a,b,c){var d="/search/$TYPE/$VALUE";if(a&&a.length>0){d=d.replace("$TYPE","keyword").replace("$VALUE",encodeURIComponent(a));var e=localStorage.getItem(historySearchItems),f=e&&e.length>0?JSON.parse(e):[];f.length>10&&(f=f.splice(0,9)),f.indexOf(a)<0&&f.unshift(a),localStorage.setItem(historySearchItems,JSON.stringify(f))}b&&b.length>0&&(d=d.replace("$TYPE","category").replace("$VALUE",b)),c&&c.length>0&&(d=d.replace("$TYPE","tag").replace("$VALUE",c));var g=$("#search-form");g.attr("action",d),localStorage.setItem(searchReturnUrl,"/search"),g.submit()}function getSearch(){var a=[];new AutoComplete("search-keyword-input",a.concat(top_brand_list,top_ip_list,top_works_list,top_search_list),10,null,function(a){search(a,null,null)})}var historySearchItems="moretao-history-search",pageApiUrl="/api/commodities/all/pages/",pageSize=10,pageAllFilters,isShowCategories=!0;$(document).ready(function(){activeToolbarItem("btn-search"),$("#autoComplete-background").on("touchmove",function(a){a.preventDefault()});var a=localStorage.getItem(historySearchItems),b=a&&a.length>0?JSON.parse(a):null;if(b&&b.length>0){$("#clear-history-btn").show();var c=$("#search-history-area");$.each(b,function(a,b){c.append('<div><div class="tag"><a href="javascript:search(\''+b+"', null, null)\">"+b+"</a></div></div>")})}else $("#clear-history-btn").hide();var d=doT.template($("#search-hots-tpl").text()),e=$("#search-hots-area"),f=d({tags:top_search_list});$(f).hide().appendTo(e).fadeIn(500);var g=$("#search-keyword-input");g.focus(function(){g.addClass("active"),$(".search-submit-btn").show()}),g.keyup(function(a){$.trim(g.val()).length>0?$(".search-submit-btn, .clear-search-input-btn").show():$(".search-submit-btn, .clear-search-input-btn").hide(),"13"===a.keyCode&&search(g.val(),null,null)}),resetGridContainer()});