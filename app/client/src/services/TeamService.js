angular.module('reg')
  .factory('TeamService', [
  '$http',
  'Session',
  function($http, Session){

    var teams = '/api/teams';
    var base = teams + '/';

    return {

      // ----------------------
      // Basic Actions
      // ----------------------
      // get: function(id){
      //   return $http.get(base + id);
      // },
      //
      getAll: function(){
        return $http.get(base);
      },

      updateProfile: function(id, profile){
        return $http.put(base + id + '/profile', {
          profile: profile
        });
      },

      //
      // getPage: function(page, size, text){
      //   return $http.get(events + '?' + $.param(
      //     {
      //       text: text,
      //       page: page ? page : 0,
      //       size: size ? size : 50
      //     })
      //   );
      // },
      //
      create: function(id, create){
        return $http.put(base + id + '/create', {
          create: create
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

    };
  }
  ]);
