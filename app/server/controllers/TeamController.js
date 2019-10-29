var _ = require('underscore');
var User = require('../models/User');
var Team = require('../models/Team');
var Settings = require('../models/Settings');
var Mailer = require('../services/email');
var Stats = require('../services/stats');

var validator = require('validator');
var moment = require('moment');

var TeamController = {};

var maxTeamSize = process.env.TEAM_MAX_SIZE || 4;

// Tests a string if it ends with target s
function endsWith(s, test){
  return test.indexOf(s, test.length - s.length) !== -1;
}

/**
 * Get all events.
 * It's going to be a lot of data, so make sure you want to do this.
 * @param  {Function} callback args(err, user)
 */
TeamController.getAll = function (callback) {
  Team.find({}, callback);
};

/**
 * Get a user by id.
 * @param  {String}   id       User id
 * @param  {Function} callback args(err, user)
 */
TeamController.getById = function (id, callback){
  User.findById(id).exec(callback);
};

/**
 * Update a user's profile object, given an id and a profile.
 *
 * @param  {String}   id       Id of the user
 * @param  {Object}   profile  Profile object
 * @param  {Function} callback Callback with args (err, user)
 */
TeamController.updateProfileById = function (id, profile, callback){
  // Validate the user profile, and mark the user as profile completed
  // when successful.
  Team.validateProfile(profile, function(err){

    if (err){
      return callback({message: 'invalid profile'});
    }

    Team.findOneAndUpdate({
      _id: id
    },
      {
        $set: {
          'lastUpdated': Date.now(),
          'profile': profile,
          'status.completedProfile': true
        }
      },
      {
        new: true
      },
      callback);

  });
};

/**
 * Update a user's confirmation object, given an id and a confirmation.
 *
 * @param  {String}   id            Id of the user
 * @param  {Object}   confirmation  Confirmation object
 * @param  {Function} callback      Callback with args (err, user)
 */
TeamController.updateConfirmationById = function (id, confirmation, callback){

  User.findById(id).exec(function(err, user){

    if(err || !user){
      return callback(err);
    }

    // Make sure that the user followed the deadline, but if they're already confirmed
    // that's okay.
    if (Date.now() >= user.status.confirmBy && !user.status.confirmed){
      return callback({
        message: "You've missed the confirmation deadline."
      });
    }

    // You can only confirm acceptance if you're admitted and haven't declined.
    User.findOneAndUpdate({
      '_id': id,
      'verified': true,
      'status.admitted': true,
      'status.declined': {$ne: true}
    },
      {
        $set: {
          'lastUpdated': Date.now(),
          'confirmation': confirmation,
          'status.confirmed': true,
        }
      }, {
        new: true
      },
      callback);

  });
};

/**
 * Decline an acceptance, given an id.
 *
 * @param  {String}   id            Id of the user
 * @param  {Function} callback      Callback with args (err, user)
 */
TeamController.declineById = function (id, callback){

  // You can only decline if you've been accepted.
  User.findOneAndUpdate({
    '_id': id,
    'verified': true,
    'status.admitted': true,
    'status.declined': false
  },
    {
      $set: {
        'lastUpdated': Date.now(),
        'status.confirmed': false,
        'status.declined': true
      }
    }, {
      new: true
    },
    callback);
};

/**
 * Verify a user's email based on an email verification token.
 * @param  {[type]}   token    token
 * @param  {Function} callback args(err, user)
 */
TeamController.verifyByToken = function(token, callback){
  User.verifyEmailVerificationToken(token, function(err, email){
    User.findOneAndUpdate({
      email: email.toLowerCase()
    },{
      $set: {
        'verified': true
      }
    }, {
      new: true
    },
    callback);
  });
};

/**
 * Get a specific user's teammates. NAMES ONLY.
 * @param  {String}   id       id of the user we're looking for.
 * @param  {Function} callback args(err, users)
 */
TeamController.getTeammates = function(id, callback){
  User.findById(id).exec(function(err, user){
    if (err || !user){
      return callback(err, user);
    }

    var code = user.teamCode;

    if (!code){
      return callback({
        message: "You're not on a team."
      });
    }

    User
      .find({
        teamCode: code
      })
      .select('profile.name')
      .exec(callback);
  });
};

/**
 * Given a team code and id, join a team.
 * @param  {String}   id       Id of the user joining/creating
 * @param  {String}   code     Code of the proposed team
 * @param  {Function} callback args(err, users)
 */
TeamController.getTeam = function(id, code, callback){

  if (!code){
    return callback({
      message: "Please enter a team name."
    });
  }

  if (typeof code !== 'string') {
    return callback({
      message: "Get outta here, punk!"
    });
  }

  User.find({
    teamCode: code
  })
  .select('profile.name')
  .exec(function(err, users){
    // Check to see if this team is joinable (< team max size)
    if (users.length >= maxTeamSize){
      return callback({
        message: "Team is full."
      });
    }

    // Otherwise, we can add that person to the team.
    User.findOneAndUpdate({
      _id: id,
      verified: true
    },{
      $set: {
        teamCode: code
      }
    }, {
      new: true
    },
    callback);

  });
};

/**
 * Given an id, remove them from any teams.
 * @param  {[type]}   id       Id of the user leaving
 * @param  {Function} callback args(err, user)
 */
TeamController.leaveTeam = function(id, callback){
  User.findOneAndUpdate({
    _id: id
  },{
    $set: {
      teamCode: null
    }
  }, {
    new: true
  },
  callback);
};

/**
 * Resend an email verification email given a user id.
 */
TeamController.sendVerificationEmailById = function(id, callback){
  User.findOne(
    {
      _id: id,
      verified: false
    },
    function(err, user){
      if (err || !user){
        return callback(err);
      }
      var token = user.generateEmailVerificationToken();
      Mailer.sendVerificationEmail(user.email, token);
      return callback(err, user);
  });
};

/**
 * Password reset email
 * @param  {[type]}   email    [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
TeamController.sendPasswordResetEmail = function(email, callback){
  User
    .findOneByEmail(email)
    .exec(function(err, user){
      if (err || !user){
        return callback(err);
      }

      var token = user.generateTempAuthToken();
      Mailer.sendPasswordResetEmail(email, token, callback);
    });
};

/**
 * UNUSED
 *
 * Change a user's password, given their old password.
 * @param  {[type]}   id          User id
 * @param  {[type]}   oldPassword old password
 * @param  {[type]}   newPassword new password
 * @param  {Function} callback    args(err, user)
 */
TeamController.changePassword = function(id, oldPassword, newPassword, callback){
  if (!id || !oldPassword || !newPassword){
    return callback({
      message: 'Bad arguments.'
    });
  }

  User
    .findById(id)
    .select('password')
    .exec(function(err, user){
      if (user.checkPassword(oldPassword)) {
        User.findOneAndUpdate({
          _id: id
        },{
          $set: {
            password: User.generateHash(newPassword)
          }
        }, {
          new: true
        },
        callback);
      } else {
        return callback({
          message: 'Incorrect password'
        });
      }
    });
};

/**
 * Reset a user's password to a given password, given a authentication token.
 * @param  {String}   token       Authentication token
 * @param  {String}   password    New Password
 * @param  {Function} callback    args(err, user)
 */
TeamController.resetPassword = function(token, password, callback){
  if (!password || !token){
    return callback({
      message: 'Bad arguments'
    });
  }

  if (password.length < 6){
    return callback({
      message: 'Password must be 6 or more characters.'
    });
  }

  User.verifyTempAuthToken(token, function(err, id){

    if(err || !id){
      return callback(err);
    }

    User
      .findOneAndUpdate({
        _id: id
      },{
        $set: {
          password: User.generateHash(password)
        }
      }, function(err, user){
        if (err || !user){
          return callback(err);
        }

        Mailer.sendPasswordChangedEmail(user.email);
        return callback(null, {
          message: 'Password successfully reset!'
        });
      });
  });
};

/**
 * [ADMIN ONLY]
 *
 * Admit a user.
 * @param  {String}   userId   User id of the admit
 * @param  {String}   user     User doing the admitting
 * @param  {Function} callback args(err, user)
 */
TeamController.admitUser = function(id, user, callback){
  Settings.getRegistrationTimes(function(err, times){
    User
      .findOneAndUpdate({
        _id: id,
        verified: true
      },{
        $set: {
          'status.admitted': true,
          'status.admittedBy': user.email,
          'status.confirmBy': times.timeConfirm
        }
      }, {
        new: true
      },
      callback);
  });
};

/**
 * [ADMIN ONLY]
 *
 * Check in a user.
 * @param  {String}   userId   User id of the user getting checked in.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
TeamController.checkInById = function(id, user, callback){
  User.findOneAndUpdate({
    _id: id,
    verified: true
  },{
    $set: {
      'status.checkedIn': true,
      'status.checkInTime': Date.now()
    }
  }, {
    new: true
  },
  callback);
};

/**
 * [ADMIN ONLY]
 *
 * Check out a user.
 * @param  {String}   userId   User id of the user getting checked out.
 * @param  {String}   user     User checking in this person.
 * @param  {Function} callback args(err, user)
 */
TeamController.checkOutById = function(id, user, callback){
  User.findOneAndUpdate({
    _id: id,
    verified: true
  },{
    $set: {
      'status.checkedIn': false
    }
  }, {
    new: true
  },
  callback);
};

/**
 * [ADMIN ONLY]
 *
 * Make user an admin
 * @param  {String}   userId   User id of the user being made admin
 * @param  {String}   user     User making this person admin
 * @param  {Function} callback args(err, user)
 */
TeamController.makeAdminById = function(id, user, callback){
  User.findOneAndUpdate({
    _id: id,
    verified: true
  },{
    $set: {
      'admin': true
    }
  }, {
    new: true
  },
  callback);
};

/**
 * [ADMIN ONLY]
 *
 * Make user an admin
 * @param  {String}   userId   User id of the user being made admin
 * @param  {String}   user     User making this person admin
 * @param  {Function} callback args(err, user)
 */
TeamController.removeAdminById = function(id, user, callback){
  User.findOneAndUpdate({
    _id: id,
    verified: true
  },{
    $set: {
      'admin': false
    }
  }, {
    new: true
  },
  callback);
};

/**
 * [ADMIN ONLY]
 */

TeamController.getStats = function(callback){
  return callback(null, Stats.getUserStats());
};

module.exports = TeamController;
