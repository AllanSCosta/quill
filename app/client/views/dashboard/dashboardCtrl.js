angular.module('reg')
  .controller('DashboardCtrl', [
    '$rootScope',
    '$scope',
    '$sce',
    'currentUser',
    'settings',
    'Utils',
    'AuthService',
    'UserService',
    'EventService',
    'EVENT_INFO',
    'DASHBOARD',
    function($rootScope, $scope, $sce, currentUser, settings, Utils, AuthService, UserService, EventService, EVENT_INFO, DASHBOARD){
      var Settings = settings.data;
      // console.log(moment);
      // moment.locale('ru');
      // var moment = moment();

      $scope.setToToday = function() {
        $scope.viewDate = new Date();
      }

      var user = currentUser.data;
      $scope.user = user;

      $scope.viewDate = new Date();
      $scope.view = 'month';

      $scope.timeClose = Utils.formatTime(Settings.timeClose);
      $scope.timeConfirm = Utils.formatTime(Settings.timeConfirm);

      $scope.event = {};
      $scope.events = [];
      $scope.comingEvents = [];
      $scope.selectedEvent = {};

      function updatePage(data){
        var p = [];
        for (var i = 0; i < data.totalPages; i++){
          p.push(i);
        }
        $scope.pages = p;

        $scope.events = Array.from(data).map(function(evt) {
          return {
            title: evt.title,
            startsAt: evt.startsAt ? new Date(evt.startsAt) : new Date(evt.endsAt),
            endsAt: evt.startsAt ? new Date(evt.endsAt) : null,
            color: {
              primary: evt.color,
              secondary: evt.color
            },
            description: evt.description,
            actions: [{
              label: '<i class=\'glyphicon glyphicon-pencil\'></i>',
              cssClass: 'edit-action',
              onClick: function(args) {
                console.log('Edit event', args.calendarEvent);
              }
            }],
            draggable: false,
            resizable: false,
            incrementsBadgeTotal: true,
            cssClass: 'a-css-class-name',
            allDay: false
          };
        });

        $scope.comingEvents = [...$scope.events].filter((a) => {
          const now = new Date();
          if (a.endsAt){
            return a.endsAt > now;
          } else {
            return a.startsAt > now;
          }
        });

        $scope.comingEvents.sort((a, b) => { a.startsAt > b.startsAt });
      }

     $scope.clickEvent = function(data){
       evt = Object.assign({}, data);

       if (evt.startsAt) {
         evt.startsAt = moment(evt.startsAt).format('MMMM Do YYYY, h:mm:ss a');
       }

       if (evt.endsAt) {
         evt.endsAt = moment(evt.endsAt).format('MMMM Do YYYY, h:mm:ss a');
       }

       if (evt.startsAt && evt.endsAt) {
         evt.endsAt = moment(evt.endsAt).format('h:mm:ss a');
       }

       $scope.selectedEvent = evt;
       $('.modal.calendar-events')
         .modal('show');

       $('.modal-header').css('background-color', evt.color.primary);
       $('.modal.calendar-events').modal({backdrop: 'static', keyboard: false});
       $('#event-description').html(marked(evt.description));
     }

      EventService
        .getAll()
        .then(response => {
          updatePage(response.data);
        });


      $scope.modalClose = function() {
        $('.modal.calendar-events')
          .modal('hide');
      }


      $scope.DASHBOARD = DASHBOARD;

      for (var msg in $scope.DASHBOARD) {
        if ($scope.DASHBOARD[msg].includes('[APP_DEADLINE]')) {
          $scope.DASHBOARD[msg] = $scope.DASHBOARD[msg].replace('[APP_DEADLINE]', Utils.formatTime(Settings.timeClose));
        }
        if ($scope.DASHBOARD[msg].includes('[CONFIRM_DEADLINE]')) {
          $scope.DASHBOARD[msg] = $scope.DASHBOARD[msg].replace('[CONFIRM_DEADLINE]', Utils.formatTime(user.status.confirmBy));
        }
      }

      // Is registration open?
      var regIsOpen = $scope.regIsOpen = Utils.isRegOpen(Settings);

      // Is it past the user's confirmation time?
      var pastConfirmation = $scope.pastConfirmation = Utils.isAfter(user.status.confirmBy);

      $scope.dashState = function(status){
        var user = $scope.user;
        switch (status) {
          case 'unverified':
            return !user.verified;
          case 'openAndIncomplete':
            return regIsOpen && user.verified && !user.status.completedProfile;
          case 'openAndSubmitted':
            return regIsOpen && user.status.completedProfile && !user.status.admitted;
          case 'closedAndIncomplete':
            return !regIsOpen && !user.status.completedProfile && !user.status.admitted;
          case 'closedAndSubmitted': // Waitlisted State
            return !regIsOpen && user.status.completedProfile && !user.status.admitted;
          case 'admittedAndCanConfirm':
            return !pastConfirmation &&
              user.status.admitted &&
              !user.status.confirmed &&
              !user.status.declined;
          case 'admittedAndCannotConfirm':
            return pastConfirmation &&
              user.status.admitted &&
              !user.status.confirmed &&
              !user.status.declined;
          case 'confirmed':
            return user.status.admitted && user.status.confirmed && !user.status.declined;
          case 'declined':
            return user.status.declined;
        }
        return false;
      };

      $scope.showWaitlist = !regIsOpen && user.status.completedProfile && !user.status.admitted;

      $scope.resendEmail = function(){
        AuthService
          .resendVerificationEmail()
          .then(response => {
            sweetAlert("Your email has been sent.");
          });
      };


      // -----------------------------------------------------
      // Text!
      // -----------------------------------------------------
      var converter = new showdown.Converter();
      $scope.acceptanceText = $sce.trustAsHtml(converter.makeHtml(Settings.acceptanceText));
      $scope.confirmationText = $sce.trustAsHtml(converter.makeHtml(Settings.confirmationText));
      $scope.waitlistText = $sce.trustAsHtml(converter.makeHtml(Settings.waitlistText));

      $scope.declineAdmission = function(){

      sweetAlert({
        title: "Whoa!",
        text: "Are you sure you would like to decline your admission? \n\n You can't go back!",
        icon: "warning",
        buttons: {
          cancel: {
            text: "Cancel",
            value: null,
            visible: true
          },
          confirm: {
            text: "Yes, I can't make it",
            value: true,
            visible: true,
            className: "danger-button"
          }
        }
      }).then(value => {
        if (!value) {
          return;
        }

        UserService
          .declineAdmission(user._id)
          .then(response => {
            $rootScope.currentUser = response.data;
            $scope.user = response.data;
          });
      });
    };

  }]);
