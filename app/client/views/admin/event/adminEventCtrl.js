// const swal = require('sweetalert');
// const marked = require('marked');

angular.module('reg')
  .controller('AdminEventCtrl',[
    '$scope',
    '$http',
    'event',
    'EventService',
    function($scope, $http, evnt, EventService){
      $scope.event = evnt.data;
      $scope.eventType = $scope.event.startsAt ? 'long' : 'point';
      $scope.viewMarkdown = false;

      $scope.colors = [
        { name: "Azul", code: '#0277BD'},
        { name: "Verde", code: '#388E3C'},
        { name: "Vermelho", code: '#D32F2F'},
        { name: "Preto", code: '#000000'}
      ];

      $scope.toggleMarkdown = function() {
        $('#mdviewer').html(marked($scope.event.description));
        $('#mdviewer').height(
          $('#description-area').height()
        );
      }

      $scope.event.endsAt = new Date($scope.event.endsAt);
      $scope.event.startsAt = $scope.event.startsAt ? new Date($scope.event.startsAt) : null;

      $scope.updateProfile = function(){
        EventService
          .updateProfile($scope.event._id, $scope.event)
          .then(response => {
            $selectedEvent = response.data;
            swal("Updated!", "Profile updated.", "success");
          }, response => {
            swal("Oops, you forgot something.");
          });
      };
    }]);
