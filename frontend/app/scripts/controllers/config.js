/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('ConfigCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q, $sce) {
	$scope.loading = false;


	$scope.initConfigs= function () {
		$scope.loadTestStoryConfigs();
	};

	$scope.loadTestStoryConfigs = function () {
		var delay = $q.defer();

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.testStoryConfigs = [];
			$scope.loading = true;
			$http.get('api/config/').then(function(response) {
				$rootScope.testStoryConfigs = angular.fromJson(response.data);
				$scope.loading = false;
				delay.resolve(true);
			}, function(error) {
				$scope.loading = false;
				$scope.error = error.data;
				delay.reject(false);

			});
		}else{
			delay.reject(false);
		}
	};

	$scope.openDialogForEditTestStoryConfig = function (ev, tsc) {
        $rootScope.selectedTestStoryConfig = tsc;
        $mdDialog.show({
            controller: $scope.editTestStoryConfigModalCtrl,
            templateUrl: 'EditTestStoryModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function() {
            $scope.loadTestStoryConfigs();
        }, function() {

        });
    };

    $scope.deleteTestStoryConfig = function (ev, tsc) {
        $rootScope.selectedTestStoryConfig = tsc;

        $http.post('api/config/' + $rootScope.selectedTestStoryConfig.id + '/delete').then(function (response) {
            $rootScope.msg().text = "testplanDeleteSuccess";
            $rootScope.msg().type = "success";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;

            var idxP = _.findIndex($rootScope.testStoryConfigs, function (child) {
                return child.id === $rootScope.selectedTestStoryConfig.id;
            });
            $rootScope.testStoryConfigs.splice(idxP, 1);

        }, function (error) {
            $scope.error = error;
        });
    };

    $scope.editTestStoryConfigModalCtrl = function($scope, $mdDialog, $http, userInfoService) {
        $scope.needHelp = false;
        $scope.showHelp = function () {
            $scope.needHelp = true;

            if(!$rootScope.tcamtDocument) $rootScope.loadDocument();


        };
        $scope.getHtml = function (index) {
            if($rootScope.tcamtDocument){
                return $sce.trustAsHtml($rootScope.tcamtDocument.helpGuide.slides[index].contents);
            }else {
                return null;
            }
        };
    	if(!$rootScope.selectedTestStoryConfig){
            $scope.selectedTestStoryConfig =  angular.copy(_.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; }));
            $scope.selectedTestStoryConfig.id = new ObjectId().toString();
            $scope.selectedTestStoryConfig.name = 'NewTestStoryTemplate';
            $scope.selectedTestStoryConfig.accountId = userInfoService.getAccountID();
    	}else{
            $scope.selectedTestStoryConfig = $rootScope.selectedTestStoryConfig;
		}
        $scope.setPosition=function(item, index){
            for(i=0; i<$scope.selectedTestStoryConfig.testStoryConfig.length; i++){
                $scope.selectedTestStoryConfig.testStoryConfig[i].position=i+1;
            }
        };

        $scope.addField=function(){
            $scope.selectedTestStoryConfig.testStoryConfig.push({id:new ObjectId().toString(),title:"new title", scope:"user", present:true, isSummaryEntry:false, position:$scope.selectedTestStoryConfig.testStoryConfig.length + 1});
        };

        $scope.deleteItem = function (index){
            $scope.selectedTestStoryConfig.testStoryConfig.splice(index, 1);
            $scope.setPosition();
        };

        $scope.cancel = function() {
            $mdDialog.hide();
        };

        $scope.saveTestStoryConfig = function() {
            $http.post('api/config/save', $scope.selectedTestStoryConfig).then(function (response) {
                $mdDialog.hide();
            }, function () {
            });
        };
    };
});