$(function() {
  var source = $("#source-text").text();
  var text = $.sntext(source, {
    debug:true,
    onTag: function(tag, txt) { return "<a href='/search/" + txt + "'>" + tag + "</a>"; },
    onAt: function(at, txt) { return "<a href='/search/" + txt + "'>" + at + "</a>"; }
  });

  $("#result-text").html(text);
});
