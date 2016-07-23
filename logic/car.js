/**
 * Created by pariskshitdutt on 08/03/16.
 */
var q= require('q');
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
var crypto=require('../authentication/crypto');
var bcrypt = require('bcrypt');

var carTable=db.getcardef;
var locationTable=db.getlocationdef;
var tripsTable=db.gettripdef;
var healthTable=db.gethealthdef;

var listings={
    verifyUserAndCar:function(device_id,user_id){
        var def= q.defer();
        carTable.find({device_id:device_id,owner_id:new ObjectId(user_id),is_deleted:false},"_id",function(err,rows){
            if(!err&&rows.length>0){
                def.resolve();
            }else{
                def.reject({status:403,message:config.get('error.unauthorized')});
            }
        });
        return def.promise;
    },
    getCars:function(req){
        var def= q.defer();
        carTable.find({owner_id:new ObjectId(req.user._id),is_deleted:false},"mileage name model device_id").sort({created_time:-1}).exec(function(err,rows){
            if(!err){
                def.resolve(rows);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getCarLocations:function(req){
        var def= q.defer();
        locationTable.find({device_id:req.query.device_id},"location speed distance").sort({created_date:-1}).limit(20).exec(function(err,rows){
            if(!err){
                def.resolve(rows);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getCarHealth:function(req){
        var def= q.defer();
        healthTable.findOne({"$query":{device_id:req.query.device_id},"$orderby":{_id:-1}},function(err,health){
            if(!err){
                def.resolve(health);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getTrips:function(req){
        var def= q.defer();
        tripsTable.find({car_id:req.query.device_id},"start_time start_location end_time end_location _id",function(err,rows){
            if(!err){
                def.resolve(rows);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    getTrip:function(req){
        var def= q.defer();
        tripsTable.findOne({car_id:req.query.device_id,_id:new ObjectId(req.params.trip_id)},
            "start_time start_location end_time end_location _id",function(err,trip){
            if(!err){
                def.resolve(trip);
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    startTrip:function(req){
        var def= q.defer();
        locationTable.find({device_id:req.body.device_id},"location distance").sort({_id:-1}).limit(1)
            .exec(function(err,location){
                if(!err){
                    var trip=new tripsTable({
                        car_id:req.body.device_id,
                        start_time:new Date(),
                        start_location:location[0].location,
                        start_distance:location[0].distance,
                        is_started:true,
                    });
                    trip.save(function(err,rows,info){
                        if(!err){
                            def.resolve(config.get('ok'));
                        }else{
                            def.reject({status:500,message:config.get('error.dberror')});
                        }
                    })
                }else{
                    def.reject({status:500,message:config.get('error.dberror')});
                }
            })
        return def.promise;
    },
    is_started:function(req){
        var def= q.defer();
        tripsTable.findOne({is_started:true,device_id:req.body.device_id},function(err,trip){
            if(!err){
                if(trip){
                    def.resolve(true);
                }else{
                    def.resolve(false);
                }
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    },
    endTrip:function(req){
        var def= q.defer();
        carTable.findOne({device_id:req.body.device_id},"mileage",function(err,car){
        locationTable.find({device_id:req.body.device_id},"location distance").sort({_id:-1}).limit(1)
            .exec(function(err,location){
                if(!err){
                    tripsTable.findOne({_id:new ObjectId(req.body.trip_id)},"start_time start_location start_distance modified_time",function(err,trip){
                        trip.end_time=new Date();
                        trip.end_location=location[0].location;
                        trip.end_distance=location[0].distance;
                        trip.total_distance=(location[0].distance-trip.start_distance);
                        trip.cost=trip.total_distance*car.mileage;
                        trip.is_started=false;
                        trip.modified_time=new Date();
                        trip.save(function(err,trip,info){
                            if(!err){
                                def.resolve(trip);
                            }else{
                                def.reject({status:500,message:config.get('error.dberror')});
                            }
                        });
                    })
                }else{
                    def.reject({status:500,message:config.get('error.dberror')});
                }
            })
        });
        return def.promise;
    },
    addCar:function(req){
        var def= q.defer();
                req.body.owner_id=req.user._id;
                var car=new carTable(req.body);
                car.save(function(err,car,info){
                    if(!err){
                        def.resolve(car);
                    }else{
                        def.reject({status:500,message:config.get('error.dberror')});
                    }
                })
        return def.promise;
    },
    updateCar:function(req){
        var def= q.defer();
        var device_id=req.body.device_id;
        for(var key in req.body){
            if(key!="name"&&key!="model"&&key!="mileage"){
                delete req.body[key];
            }
        }
        log.info(req.body);
        carTable.update({device_id:device_id},{$set:req.body},function(err,info){
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        })
        return def.promise;
    },
    deleteCar:function(req){
        var def= q.defer();
        log.info(req.body);
        carTable.update({device_id:req.body.device_id,is_deleted:false},{$set:{is_deleted:true}},function(err,info){
            log.info(info);
            if(!err){
                def.resolve(config.get('ok'));
            }else{
                def.reject({status:500,message:config.get('error.dberror')});
            }
        });
        return def.promise;
    }
};
module.exports=listings;