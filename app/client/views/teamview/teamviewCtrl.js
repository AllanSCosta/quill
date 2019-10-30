angular.module('reg')
  .controller('TeamviewCtrl', [
    '$scope',
    '$state',
    '$http',
    'currentUser',
    'currentTeam',
    'settings',
    'Session',
    'UserService',
    'TeamService',
    'TEAM',
    function($scope, $state, $http, currentUser, currentTeam, settings, Session, UserService, TeamService, TEAM){
      var Settings = settings.data;

      $scope.teams = [];
      $scope.display_teams = [];
      $scope.TEAM = TEAM;

      $('.ui.dimmer').remove();
      $scope.selectedTeam = {};

      function updatePage(data) {
        $scope.teams = data;
        $scope.display_teams = [];
        var display = [];
        var arr = [];
        for (var i = 0; i < $scope.teams.length; i++) {
          if (i != 0 && i % 3 == 0) {
            display.push(arr);
            arr = [];
          }
          arr.push($scope.teams[i]);
          if (i == $scope.teams.length - 1) {
            display.push(arr);
          }
        }

        $scope.display_team = display;

        var p = [];
        for (var i = 0; i < data.totalPages; i++){
          p.push(i);
        }

        $scope.pages = p;
      }

      $scope.modalClose = function() {
        $('.modal.teamview-view')
          .modal('hide');
      }

      TeamService
        .getAll()
        .then(response => {
          updatePage(response.data);
        });

      function selectTeam(team){
        $scope.selectedTeam = team;
        console.log($scope.selectedTeam);
        $('.modal.teamview-view')
          .modal({backdrop: 'static', keyboard: false})
          .modal({closable  : false})
          .modal('show');
        $('#team-description').html(marked(team.profile.essay));
        ;
      }
      $scope.selectTeam = selectTeam;

}]);
