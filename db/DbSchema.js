/**
 * Created by pariskshitdutt on 09/06/15.
 */
var mongoose = require('mongoose');
//var mockgoose=require('mockgoose');
var config = require('config');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var ObjectId = require('mongoose').Schema.Types.ObjectId;
var validate = require('mongoose-validator');
var nameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 50],
        message: 'Name should be between 3 and 50 characters'
    })
];
var emailValidator=[
    validate({
        validator: 'isEmail',
        message: "not a valid email"
    })
];
var phoneValidator = [
    validate({
        validator: 'isLength',
        arguments: [10, 10],
        message: 'phonenumber should be 10 digits'
    })
];
var db=mongoose.createConnection(config.get('mongo.location'),config.get('mongo.database'));

var Schema = mongoose.Schema;
mongoose.set('debug', config.get('mongo.debug'));
/**
 * user schema stores the user data the password is hashed
 * @type {Schema}
 */
var userSchema=new Schema({
    email:{type:String,validate:emailValidator},
    phonenumber:{type:String,validate:phoneValidator,unique:true,dropDups:true},
    password:{type:String},
    password_interim:String,
    name:{type:String},
    device:{service:String,reg_id:String,active:{type:Boolean,default:true}},
    is_admin:{type:Boolean,default:false},
    is_verified:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});

var pinschema=new Schema({
    phonenumber:{type:String},
    pin:Number,
    used:{type:Boolean,default:false}
});

var carSchema=new Schema({
    name:String,
    model:Number,
    mileage:Number,
    device_id:{type:String},
    owner_id:{type:ObjectId, ref:'users'},
    is_deleted:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var locationSchema=new Schema({
    device_id:{type:String,index:true},
    location:{type:[Number], index:'2dsphere'},
    speed:Number,
    distance:Number,
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var healthSchema=new Schema({
    device_id:{type:String,index:true},
    voltage:String,
    coolant_temp:Number,
    vehicle_speed_sensor:Number,
    engine_rpm:Number,
    intake_air_temp:Number,
    throttle_position:Number,
    run_time:Number,
    fuel_level:Number,
    ambient_air_temp:Number,
    engine_oil_temp:Number,
    engine_fuel_rate:Number,
    engine_load:Number,
    manifold_absolute_pressure:Number,
    fuel_rail_pressure:Number,
    trouble_code:[String],
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var tripSchema=new Schema({
    device_id:{type:String,index:true},
    start_time:Date,
    start_location:{type:[Number],index:'2dsphere'},
    start_distance:Number,
    end_time:Date,
    end_location:{type:[Number],index:'2dsphere'},
    end_distance:Number,
    total_distance:Number,
    cost:Number,
    is_started:Boolean,
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});

db.on('error', function(err){
    log.info(err);
});
/**
 * once the connection is opened then the definitions of tables are exported and an event is raised
 * which is recieved in other files which read the definitions only when the event is received
 */
    var userdef=db.model('users',userSchema);
    var pindef=db.model('pins',pinschema);
    var cardef=db.model('cars',carSchema);
    var locationdef=db.model('locations',locationSchema);
    var tripdef=db.model('trips',tripSchema);
    var healthdef=db.model('health',healthSchema);

    exports.getpindef=pindef;
    exports.getuserdef= userdef;
    exports.getcardef= cardef;
    exports.gettripdef= tripdef;
    exports.getlocationdef= locationdef;
    exports.gethealthdef= healthdef;
    events.emitter.emit("db_data");

