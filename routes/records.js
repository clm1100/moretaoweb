/* jshint -W079 */
/* jshint -W020 */

'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  // 创建一个新的
  router.post('/to_shopping_records', function(req, res) {
    var item = new ToShoppingRecord({ uid:(req.user ? req.user.id : null), cid:req.body.cid, url:req.body.url });
    item.save(function(err) {
      if(err) console.error(err);
      else res.redirect(req.body.url);
    });
  });

  return router;
};
