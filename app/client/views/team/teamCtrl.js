angular.module('reg')
  .controller('TeamCtrl', [
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

      $scope.user = currentUser.data;
      $scope.team = currentTeam.data[0];

      $scope.team.profile = $scope.team.profile ? $scope.team.profile : {};

      $scope.TEAM = TEAM;

      $scope.selectedPic = null;
      if ($scope.team.profile && $scope.team.profile.pic) {
        $scope.selectedPic = $scope.team.profile.pic;
      }

      $scope.viewMarkdown = false;

      $scope.toggleMarkdown = function() {
        $scope.viewMarkdown = !$scope.viewMarkdown;
        $('#mdviewer').html(marked($scope.team.profile.essay));
        $('#mdviewer').height(
          $('#essay-area').height()
        );
      }

      function _populateTeammates() {
        UserService
          .getMyTeammates()
          .then(response => {
            $scope.error = null;
            $scope.teammates = response.data;
          })
      }

      function fixLinks(url) {
          const http_pattern = new RegExp("^http[s]*:\/\/");
          if (!http_pattern.test(url)){
             url = 'http://' + url;
          }
          return url;
      }

      function _updateTeam(e){
        const socialMedia = ['facebook', 'twitter', 'website', 'youtube'];

        socialMedia.map(function(medium) {
          if (!(medium in $scope.team.profile)) {
            return;
          }
          const url = $scope.team.profile[medium];
          $scope.team.profile[medium] = fixLinks(url);
        })

        TeamService
          .updateProfile($scope.team.id, $scope.team.profile)
          .then(response => {
            sweetAlert("Prontin", "Seu perfil foi salvo.", "success")
          }, response => {
            sweetAlert("Eita!", "Algo deu ruim.", "error");
          });
      }

      $scope.submitForm = function(){
          _updateTeam();
      };

      if ($scope.user.teamCode){
        _populateTeammates();
      }

      function getBase64(file) {
         var reader = new FileReader();

         reader.readAsDataURL(file);
         reader.onload = function () {
           var img = new Image;
           img.src = reader.result;
           img.onload = function() {
             const isLandscape = img.width > img.height;
             const L = isLandscape ? img.height : img.width;

             let delx = 0;
             let dely = 0;

             if (isLandscape) {
               delx = (img.width - L) / 2;
             } else {
               dely = (img.height - L) / 2;
             }

             imageClipper(reader.result, function() {
                this.crop(delx, dely, L, L)
                    .resize(150, 150)
                    .toDataURL(function(dataUrl) {
                     $scope.selectedPic = dataUrl;
                     $scope.team.profile.pic = dataUrl;
                     $('#team-logo-placeholder').css('display', 'None');
                     $('#team-logo-picture').removeClass('ng-hide');
                     $('#team-logo-picture').attr('src', dataUrl);
                 });
               })
           };
         };
      }

      $scope.onFileSelected = function(files){
        var file = files[0];
        getBase64(file);
      };

}]);
