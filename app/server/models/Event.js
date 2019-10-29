var mongoose   = require('mongoose'),
    bcrypt     = require('bcrypt-nodejs'),
    validator  = require('validator'),
    jwt        = require('jsonwebtoken');
    JWT_SECRET = process.env.JWT_SECRET;


// define the schema for our admin model
var schema = new mongoose.Schema({
  title: {
    type: String,
    min: 1,
    max: 100,
  },

  startsAt: {
    type: Date,
  },

  endsAt: {
    type: Date,
    required: true,
  },

  color: {
    type: String,
    default: '#00576B',
  },

  description: {
    type: String,
    min: 0,
    max: 1500,
  },

  timestamp: {
    type: Number,
    required: true,
    default: Date.now(),
  },

  lastUpdated: {
    type: Number,
    default: Date.now(),
  },

  salt: {
    type: Number,
    required: true,
    default: Date.now(),
    select: false
  },
});

schema.set('toJSON', {
  virtuals: true
});

schema.set('toObject', {
  virtuals: true
});

//=========================================
// Static Methods
//=========================================

schema.statics.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

schema.statics.validateProfile = function(profile, cb){
  return cb(!(true));
};

module.exports = mongoose.model('Event', schema);
