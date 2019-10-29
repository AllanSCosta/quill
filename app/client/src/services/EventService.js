angular.module('reg')
  .factory('EventService', [
  '$http',
  'Session',
  function($http, Session){

    var events = '/api/events';
    var base = events + '/';

    return {

      // ----------------------
      // Basic Actions
      // ----------------------
      get: function(id){
        return $http.get(base + id);
      },

      getAll: function(){
        return $http.get(base);
      },

      createEvent: function(create){
        return $http.put(base + 'create', {
          create: create
        });
      },

      updateProfile: function(id, profile){
        return $http.put(base + id + '/update', {
          profile: profile
        });
      },

      updateProfileByTitle: function(title, profile){
        return $http.put(base + title + '/update_by_title', {
          profile: profile
        });
      },

      //
      // updateConfirmation: function(id, confirmation){
      //   return $http.put(base + id + '/confirm', {
      //     confirmation: confirmation
      //   });
      // },
      //
      // declineAdmission: function(id){
      //   return $http.post(base + id + '/decline');
      // },


      // -------------------------
      // Admin Only
      // -------------------------

      // getStats: function(){
      //   return $http.get(base + 'stats');
      // },
      //
      // admitUser: function(id){
      //   return $http.post(base + id + '/admit');
      // },
      //
      // checkIn: function(id){
      //   return $http.post(base + id + '/checkin');
      // },
      //
      // checkOut: function(id){
      //   return $http.post(base + id + '/checkout');
      // },
      //
      // makeAdmin: function(id){
      //   return $http.post(base + id + '/makeadmin');
      // },
      //
      // removeAdmin: function(id){
      //   return $http.post(base + id + '/removeadmin');
      // },
    };
  }
  ]);
