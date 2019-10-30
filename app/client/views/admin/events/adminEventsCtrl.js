// const angular = require("angular");
// const sweetAlert = require("sweetalert");
// const sharp = require('gm');
// const moment = require('moment');
// const marked = require('marked');

// let ptBrLocale = require('moment/locale/pt');
// moment.locale('pt', ptBrLocale)

angular.module('reg')
  .controller('AdminEventsCtrl',[
    '$scope',
    '$rootScope',
    '$stateParams',
    '$state',
    '$http',
    'EventService',
    function($scope, $rootScope, $stateParams, $state, $http, EventService) {
      $scope.event = {};
      $scope.events = [];
      $scope.eventType = 'long';
      $scope.selectedEvent = {};
      $scope.viewMarkdown = false;

      $scope.colors = [
        { name: "Azul", code: '#0277BD'},
        { name: "Verde", code: '#388E3C'},
        { name: "Vermelho", code: '#D32F2F'},
        { name: "Preto", code: '#000000'}
      ];

      $scope.toggleMarkdown = function() {
        $scope.viewMarkdown = !$scope.viewMarkdown;
        $('#mdviewer').html(marked($scope.event.description));
        $('#mdviewer').height(
          $('#description-area').height()
        );
      }

      function updatePage(data) {
        $scope.events = data.map(function(datum) {
          if (datum.startsAt) {
            datum.startsAt = moment(datum.startsAt).format('MMMM Do YYYY, h:mm:ss a')
          }
          if (datum.endsAt) {
            datum.endsAt = moment(datum.endsAt).format('MMMM Do YYYY, h:mm:ss a')
          }
          return datum
        });

        var p = [];
        for (var i = 0; i < data.totalPages; i++){
          p.push(i);
        }
        $scope.pages = p;
      }

      EventService
        .getAll()
        .then(response => {
          updatePage(response.data);
        });

      function _createEvent(e){
        EventService
          .createEvent($scope.event)
          .then(response => {
            sweetAlert("Pronto", "Evento Criado", "success");
          }, response => {
            sweetAlert("Eita!", "Algo deu ruim.", "error");
          });
      }

      $scope.goEvent = function($event, event){
        $event.stopPropagation();
        $state.go('app.admin.event', {
          id: event._id
        });
      };

      $scope.submitForm = function(){
          _createEvent();
          $scope.closeNewEvent();
      };

      function formatTime(time){
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      $scope.modalClose = function() {
        $('.modal.admin-events')
          .modal({closable  : false})
          .modal('hide');
      }

      $scope.openNewEvent = function(){
        $('.modal.new-event-form')
        .modal({backdrop: 'static', keyboard: false})
        .modal({closable  : false})
        .modal('show');
      }

      $scope.closeNewEvent = function() {
        $('.modal.new-event-form')
          .modal('hide');
      }

      function selectEvent(event){
        $scope.selectedEvent = event;
        $('.modal.admin-events')
          .modal('show');
        $('.modal.admin-events').modal({backdrop: 'static', keyboard: false});
        $('#event-description').html(marked(event.description));
      }

      $scope.selectEvent = selectEvent;

  }]);
