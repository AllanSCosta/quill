angular.module('reg')
  .controller('ApplicationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    '$http',
    'currentUser',
    'settings',
    'Session',
    'UserService',
    function($scope, $rootScope, $state, $http, currentUser, settings, Session, UserService) {
      // Set up the user

      $scope.user = currentUser.data;
      $scope.selectedPic = $scope.user.profile.pic ? $scope.user.profile.pic : null;

      // Is the student from MIT?
      $scope.isMitStudent = $scope.user.email.split('@')[1] == 'mit.edu';

      // If so, default them to adult: true
      if ($scope.isMitStudent){
        $scope.user.profile.adult = true;
      }

      // Populate the school dropdown
      populateSchools();
      _setupForm();

      $scope.regIsClosed = Date.now() > settings.data.timeClose;

      /**
       * TODO: JANK WARNING
       */
      function populateSchools(){
        $http
          .get('/assets/schools.json')
          .then(function(res){
            var schools = res.data;
            var email = $scope.user.email.split('@')[1];

            if (schools[email]){
              $scope.user.profile.school = schools[email].school;
              $scope.autoFilledSchool = true;
            }
          });

        $http
          .get('/assets/schools.csv')
          .then(function(res){
            $scope.schools = res.data.split('\n');
            $scope.schools.push('Other');

            var content = [];

            for(i = 0; i < $scope.schools.length; i++) {
              $scope.schools[i] = $scope.schools[i].trim();
              content.push({title: $scope.schools[i]})
            }

            $('#school.ui.search')
              .search({
                source: content,
                cache: true,
                onSelect: function(result, response) {
                  $scope.user.profile.school = result.title.trim();
                }
              })
          });
      }

      function _updateUser(e){
        UserService
          .updateProfile(Session.getUserId(), $scope.user.profile)
          .then(response => {
            sweetAlert("Prontin", "Seu perfil foi salvo.", "success")
          }, response => {
            sweetAlert("Eita!", "Algo deu ruim.", "error");
          });
      }


      function isMinor() {
        return !$scope.user.profile.adult;
      }

      function minorsAreAllowed() {
        return settings.data.allowMinors;
      }

      function minorsValidation() {
        // Are minors allowed to register?
        if (isMinor() && !minorsAreAllowed()) {
          return false;
        }
        return true;
      }

      function _setupForm(){
        // Custom minors validation rule
        $.fn.form.settings.rules.allowMinors = function (value) {
          return minorsValidation();
        };

        // Semantic-UI form validation
        $('.ui.form').form({
          inline: true,
          fields: {
            name: {
              identifier: 'name',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your name.'
                }
              ]
            },
            school: {
              identifier: 'school',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your school name.'
                }
              ]
            },
            year: {
              identifier: 'year',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select your graduation year.'
                }
              ]
            },
            gender: {
              identifier: 'gender',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please select a gender.'
                }
              ]
            },
            adult: {
              identifier: 'adult',
              rules: [
                {
                  type: 'allowMinors',
                  prompt: 'You must be an adult, or an MIT student.'
                }
              ]
            }
          }
        });
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
                     $scope.user.profile.pic = dataUrl;
                     $('#profile-logo-placeholder').css('display', 'None');
                     $('#profile-logo-picture').removeClass('ng-hide');
                     $('#profile-logo-picture').attr('src', dataUrl);
                 });
               })
           };
         };
      }

      $scope.onFileSelected = function(files){
        var file = files[0];
        getBase64(file);
      };

      $scope.submitForm = function(){
        if ($('.ui.form').form('is valid')){
          _updateUser();
        } else {
          sweetAlert("Uh oh!", "Please Fill The Required Fields", "error");
        }
      };
    }]);
