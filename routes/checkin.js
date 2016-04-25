/* jshint -W079 */
/* jshint -W020 */
//eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU2ZWJiMWM4MTc1OTViYzc3ZGM3ZTQwZiJ9.Y_ZcM_tRFVDT6ZSmRWBg6Ch7skju9GDMlMvKTvCKV58
'use strict';
var _ = require('lodash');
var express = require('express');
var router = express.Router();

module.exports = function(utils) {
  var getScore = 0;
  /* 签到 API */
  router.post('/api/checkin', function(req, res) {
    var id = req.body.id;
    console.log(id);
    var date = new Date();
    Checkin.findOne({user:id},function(err,item){
      console.log(item);
      if(!item) item = new Checkin();
      item.user = id;
      var dateArrFormat = item.date.map(function(element,index){
        return utils.moment(element).format("L").replace(/-/g,'');
      });
      var dateFormat = utils.moment(date).format("L").replace(/-/g,'');
      console.log(dateArrFormat,dateFormat);
      console.log(item.user+"userid");
      item.at = date;
      if(item.date.length <= 0){
        item.date.push(date);
      }else{
        if(Number(dateFormat)-Number(dateArrFormat[dateArrFormat.length-1]) === 0){
          return res.json({
                status:500,
                text:"err"
              });
        }else if(Number(dateFormat)-Number(dateArrFormat[dateArrFormat.length-1]) === 1){
          item.serial+=1;
          if(_.has(Score,item.serial)){
            getScore = Score[item.serial];
            console.log(getScore);
          }

        }else{
          item.serial = 0;
        }
        item.date.push(date);
      }

      item.save(function(err,checkin){
        Account.findOne({user:id},function(err,account){
          if(!account) account = new Account();
          account.user = id;
          account.points =(getScore+account.points+10);
          account.save(function(err,date){
            console.log(checkin.date);
            var newdate = checkin.date.map(function(element){
              return {
                date: utils.moment(element).format("L"),
                value: "hello world"
              }
            });
            console.log(newdate);
            res.json({
              status:200,
              text:"签到成功,积分增加为"+account.points,
              id:account.id,
              date:newdate
            });
          })
        });
      })
    });

  });

  //router.get('/api/checkin/:id', function(req, res) {
  //  var id = req.params.id;
  //  var date = utils.moment(new Date()).format("L");
  //  Checkin.findOne({user:id},function(err,item){
  //    if(item){
  //      res.json(item);
  //    }else{
  //      res.json({date:date})
  //    }
  //  });
  //});


  router.get('/api/checkined/token',utils.token,function(req,res) {
    var id = req.user.id;
    //res.json(id);
    console.log("++++++++++++++++++++++"+id);
    var date = utils.moment(new Date()).format("L");
    Checkin.findOne({user:id},function(err,item){
      if(!item){
        res.json({
          status: 100,
          text: "签到记录不存在——未签到",
          user:id
        });
      }else{
        if(utils.moment(item.at).format("L") !== date){
          res.json({
            status: 300,
            text: "时间不相等——未签到",
            user:id
          })
        }else{
          res.json({
            status: 200,
            text: "时间相等——已签到",
            user:id
          });
        }
      }
    })
  });

  return router;
};
