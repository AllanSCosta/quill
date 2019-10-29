var mongoose   = require('mongoose'),
    bcrypt     = require('bcrypt-nodejs'),
    validator  = require('validator'),
    jwt        = require('jsonwebtoken');
    JWT_SECRET = process.env.JWT_SECRET;

var profile = {
  essay: {
    type: String,
    min: 0,
    max: 1500
  },

  facebook: String,
  whatsapp: String,
  website: String,
  twitter: String,
  youtube: String,
  pic: String,

};

// define the schema for our admin model
var schema = new mongoose.Schema({
  name: {
    type: String,
    min: 1,
    max: 100,
  },

  profile: profile,

  email: {
      type: String,
      required: true,
      unique: true,
      validate: [
        validator.isEmail,
        'Invalid Email',
      ]
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
  return cb(!(
    true
    // profile.name.length > 0 &&
    // profile.adult &&
    // profile.place.length > 0
    ));
};

module.exports = mongoose.model('Team', schema);
