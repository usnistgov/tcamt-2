/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('DownloadCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q) {
	$scope.loading = false;


	$scope.initDownloads= function () {
		$scope.loadRBList();
	};

	$scope.loadRBList = function () {
		var delay = $q.defer();

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.rbList = [];
			$scope.loading = true;
			$http.get('api/download/').then(function(response) {
				$rootScope.rbList = angular.fromJson(response.data);
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

	$scope.downloadXMLs = function (id) {
        var form = document.createElement("form");
        form.action = $rootScope.api('api/testplans/' + id + '/downloadProfileXMLs/');
        form.method = "POST";
        form.target = "_target";
        var csrfInput = document.createElement("input");
        csrfInput.name = "X-XSRF-TOKEN";
        csrfInput.value = $cookies['XSRF-TOKEN'];
        form.appendChild(csrfInput);
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();
    };

    $scope.downloadRB = function (id) {
        var form = document.createElement("form");
        form.action = $rootScope.api('api/testplans/' + id + '/downloadRBZip/');
        form.method = "POST";
        form.target = "_target";
        var csrfInput = document.createElement("input");
        csrfInput.name = "X-XSRF-TOKEN";
        csrfInput.value = $cookies['XSRF-TOKEN'];
        form.appendChild(csrfInput);
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();
    };
});