/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('ProfileCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $sce) {
	$scope.loading = false;

	$scope.initProfiles= function () {
		if(!$rootScope.profiles || $rootScope.profiles == [] ) $rootScope.loadProfiles();
	};

	$scope.confirmDeletePublicProfile = function(ev, profile) {
		var confirm = $mdDialog.prompt()
			.title('Are you sure you want to delete the Public Profile?')
			.textContent('This operation is irreversible.')
			.targetEvent(ev)
			.ok('Confirm')
			.cancel('Cancel');

		$mdDialog.show(confirm).then(function(result) {
            $http.post('api/profiles/' + profile.id + '/delete').then(function () {
                $rootScope.msg().text = "profileDeleteSuccess";
                $rootScope.msg().type = "success";
                $rootScope.msg().show = true;
                $rootScope.manualHandle = true;
                $rootScope.loadProfiles();
            }, function (error) {
                $scope.error = error;
                $scope.loading = false;
                $rootScope.msg().text = "profileDeleteFailed";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
		}, function() {
		});
	};

	$scope.confirmDeletePrivateProfile = function(ev, profile) {
		var confirm = $mdDialog.confirm()
			.title('Are you sure you want to delete the Profile?')
			.textContent('This operation is irreversible')
			.ariaLabel('Lucky day')
			.targetEvent(ev)
			.ok('Confirm')
			.cancel('Cancel');

		$mdDialog.show(confirm).then(function() {

            $http.post('api/profiles/' + profile.id + '/delete').then(function () {
                $rootScope.msg().text = "profileDeleteSuccess";
                $rootScope.msg().type = "success";
                $rootScope.msg().show = true;
                $rootScope.manualHandle = true;
                $rootScope.loadProfiles();
            }, function (error) {
                $scope.error = error;
                $scope.loading = false;
                $rootScope.msg().text = "profileDeleteFailed";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
		}, function() {
		});
	};

	$scope.openDialogForImportXMLProfile = function (ev) {
		$mdDialog.show({
			controller: $scope.ImportXMLProfileModalCtrl,
			templateUrl: 'ImportXMLProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {

		});
	};

	$scope.openDialogForReplacePrivateProfile = function (ev, profile) {
		$rootScope.toBeReplaceProfileId = profile.id;
		$mdDialog.show({
			controller: $scope.ReplaceXMLProfileModalCtrl,
			templateUrl: 'ReplaceXMLProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {
		});
	};

    $scope.openDialogToShowProfile = function (ev, profile, m) {
        $mdDialog.show({
            controller: $scope.ShowProfileModalCtrl,
            templateUrl: 'ShowProfileModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: true, // Only for -xs, -sm breakpoints.
            locals: {
                profile: profile,
                m : m
            },
        }).then(function() {
        }, function() {
        });
    };

    $scope.ShowProfileModalCtrl = function($scope,$mdDialog,$http, profile, m) {
        $scope.profile = profile;
        $scope.m = m;

        console.log(profile);
        console.log(m);
        $scope.cancel = function() {
            $mdDialog.hide();
        };

    };

	$scope.saveProfileName = function(profile) {
        $http.post('api/profiles/saveProfileMeta', profile).then(function (response) {
            var result = response.data;
            if(result.success){
                $scope.checkLoadAll();
            }
        }, function (e) {
        });
    }

	$scope.openDialogForReplacePublicProfile = function (ev, profile) {
		$rootScope.toBeReplaceProfileId = profile.id;
		$mdDialog.show({
			controller: $scope.ReplacePublicProfileModalCtrl,
			templateUrl: 'ReplacePublicProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {
		});
	};

	$scope.openDialogForImportXMLPublicProfile = function (ev) {
		$mdDialog.show({
			controller: $scope.ImportXMLPublicProfileModalCtrl,
			templateUrl: 'ImportXMLPublicProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {

		});
	};

	$scope.ImportXMLPublicProfileModalCtrl = function($scope, $mdDialog, $http) {
        $scope.needHelp = false;
		$scope.xmlFilesData = {};

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


		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var importProfileButton = $("#importPublicProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				importProfileButton.prop('disabled', false);
			}

		};

        $scope.validateForProfileXMLFile = function(files) {
            var f = document.getElementById('profilePublicFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForPublicProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForPublicProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForPublicProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForValueSetXMLFile = function(files) {
            var f = document.getElementById('valueSetPublicFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForValueSetPublic");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForValueSetPublic");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForValueSetPublic");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForConstraintsXMLFile = function(files) {
            var f = document.getElementById('constraintsPublicFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForConstraintsPublic");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForConstraintsPublic");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForConstraintsPublic");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

		$scope.importProfileXML = function() {
			var importProfileButton = $("#importPublicProfileButton");
			importProfileButton.prop('disabled', true);
			$http.post('api/profiles/importXMLFilesForPublic', $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};

	$scope.ReplacePublicProfileModalCtrl = function($scope, $mdDialog, $http) {
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
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var replaceProfileButton = $("#replacePublicProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				replaceProfileButton.prop('disabled', false);
			}

		};

        $scope.validateForProfileXMLFile = function(files) {
            var f = document.getElementById('replacePublicProfileXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplacePublicProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplacePublicProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplacePublicProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForValueSetXMLFile = function(files) {
            var f = document.getElementById('replacePublicValueSetXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplacePublicValueSet");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplacePublicValueSet");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplacePublicValueSet");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForConstraintsXMLFile = function(files) {
            var f = document.getElementById('replacePublicConstraintsXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplacePublicConstraints");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplacePublicConstraints");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplacePublicConstraints");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

		$scope.replaceProfileXML = function() {
			var replaceProfileButton = $("#replacePublicProfileButton");
			replaceProfileButton.prop('disabled', true);

			$http.post('api/profiles/replaceXMLFiles/' + $rootScope.toBeReplaceProfileId, $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};

	$scope.ReplaceXMLProfileModalCtrl  = function($scope, $mdDialog, $http) {
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
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var replaceProfileButton = $("#replaceProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				replaceProfileButton.prop('disabled', false);
			}

		};

        $scope.validateForProfileXMLFile = function(files) {
            var f = document.getElementById('replaceProfileXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplaceProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplaceProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplaceProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForValueSetXMLFile = function(files) {
            var f = document.getElementById('replaceValueSetXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplaceValueSet");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplaceValueSet");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplaceValueSet");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForConstraintsXMLFile = function(files) {
            var f = document.getElementById('replaceConstraintsXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplaceConstraints");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplaceConstraints");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplaceConstraints");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

		$scope.replaceProfileXML = function() {
			var replaceProfileButton = $("#replaceProfileButton");
			replaceProfileButton.prop('disabled', true);

			$http.post('api/profiles/replaceXMLFiles/' + $rootScope.toBeReplaceProfileId, $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};

	$scope.ImportXMLProfileModalCtrl = function($scope, $mdDialog, $http) {
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
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var importProfileButton = $("#importProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				importProfileButton.prop('disabled', false);
			}

		};

		$scope.validateForProfileXMLFile = function(files) {
			var f = document.getElementById('profileXMLFile').files[0];
			var reader = new FileReader();
            reader.readAsText(f);
			reader.onloadend = function(e) {
				var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                	var result = response.data;
                	if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForXMLProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
					}else{
                        var errorElm = $("#errorMessageForXMLProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
						}
					}
                }, function (e) {
                    var errorElm = $("#errorMessageForXMLProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
			};
		};

		$scope.validateForValueSetXMLFile = function(files) {
			var f = document.getElementById('valueSetXMLFile').files[0];
			var reader = new FileReader();
            reader.readAsText(f);
			reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForValueSetXML");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForValueSetXML");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForValueSetXML");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
			};
		};

		$scope.validateForConstraintsXMLFile = function(files) {
			var f = document.getElementById('constraintsXMLFile').files[0];
			var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForConstraintsXML");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForConstraintsXML");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForConstraintsXML");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
		};

		$scope.importProfileXML = function() {
			var importProfileButton = $("#importProfileButton");
			importProfileButton.prop('disabled', true);

			$http.post('api/profiles/importXMLFiles', $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};
});