var express = require('express');
var router = express.Router();
var params = require('parameters-middleware');
var config= require('config');
var jwt = require('jwt-simple');
var ObjectId = require('mongoose').Types.ObjectId;
var moment= require('moment');
var async= require('async');
var db=require('../db/DbSchema');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var apn=require('../notificationSenders/apnsender');
var gcm=require('../notificationSenders/gcmsender');
var carLogic=require('../logic/car');
router.post('/protected/car',params({body:['name','model','device_id','mileage']},{message : config.get('error.badrequest')}),
    function(req,res){
        carLogic.addCar(req)
            .then(function(info){
                res.json(info);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    }
);
router.get('/protected/car/all',params({user:['_id']},{message : config.get('error.badrequest')}),
    function(req,res){
        carLogic.getCars(req)
            .then(function(cars){
                res.json(cars);
            })
            .catch(function(err){
                log.warn(err);
                res.status(err.status).json(err.message);
            })
    });
router.use('/protected/car',function(req,res,next){
    if(req.method=="GET"){
        carLogic.verifyUserAndCar(req.query.device_id,req.user._id)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    }else{
        carLogic.verifyUserAndCar(req.body.device_id,req.user._id)
            .then(function(){
                next();
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    }
});
router.get('/protected/car/locations',params({query:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.getCarLocations(req)
            .then(function(locations){
                res.json(locations);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.get('/protected/car/health',params({query:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.getCarHealth(req)
            .then(function(locations){
                res.json(locations);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });

router.post('/protected/car/update',params({body:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.updateCar(req)
            .then(function(info){
                res.json(info);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.delete('/protected/car/delete',params({body:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.deleteCar(req)
            .then(function(info){
                res.json(info);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.get('/protected/car/trips',params({query:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.getTrips(req)
            .then(function(trips){
                res.json(trips);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.get('/protected/car/trip/{trip_id}',params({query:['device_id'],params:['trip_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.getTrip(req)
            .then(function(trips){
                res.json(trips);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.get('/protected/car/trip/is_started',params({query:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.is_started(req)
            .then(function(info){
                if(info){
                    res.json({result:true});
                }else{
                    res.json({result:false});
                }
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });
router.post('/protected/car/trip/start',params({body:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
       carLogic.startTrip(req)
           .then(function(info){
               res.json(info);
           })
           .catch(function(err){
               res.status(err.status).json(err.message);
           })
    });
router.post('/protected/car/trip/end',params({body:['device_id']},{message : config.get('error.badrequest')}),
    function(req,res,next){
        carLogic.endTrip(req)
            .then(function(info){
                res.json(info);
            })
            .catch(function(err){
                res.status(err.status).json(err.message);
            })
    });



module.exports = router;
