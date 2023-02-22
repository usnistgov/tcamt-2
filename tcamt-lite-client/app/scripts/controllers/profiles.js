/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('ProfileCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $sce) {
    $scope.loading = false;

    $scope.initProfiles = function () {
        if (!$rootScope.profiles || $rootScope.profiles == []) $rootScope.loadProfiles();
    };

    $scope.confirmDeletePublicProfile = function (ev, profile) {
        var confirm = $mdDialog.prompt()
            .title('Are you sure you want to delete the Public Profile?')
            .textContent('This operation is irreversible.')
            .targetEvent(ev)
            .ok('Confirm')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function (result) {
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
        }, function () {
        });
    };

    $scope.confirmDeletePrivateProfile = function (ev, profile) {
        var confirm = $mdDialog.confirm()
            .title('Are you sure you want to delete the Profile?')
            .textContent('This operation is irreversible')
            .ariaLabel('Lucky day')
            .targetEvent(ev)
            .ok('Confirm')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {

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
        }, function () {
        });
    };

    $scope.openDialogForImportXMLProfile = function (ev) {
        $mdDialog.show({
            controller: $scope.ImportXMLProfileModalCtrl,
            templateUrl: 'ImportXMLProfileModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function () {
            $rootScope.loadProfiles();
        }, function () {

        });
    };

    $scope.openDialogForReplacePrivateProfile = function (ev, profile) {
        $rootScope.toBeReplaceProfileId = profile.id;
        $mdDialog.show({
            controller: $scope.ReplaceXMLProfileModalCtrl,
            templateUrl: 'ReplaceXMLProfileModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function () {
            $rootScope.loadProfiles();
        }, function () {
        });
    };

    $scope.openDialogToShowProfile = function (ev, profile, m) {
        $mdDialog.show({
            controller: $scope.ShowProfileModalCtrl,
            templateUrl: 'ShowProfileModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            fullscreen: true, // Only for -xs, -sm breakpoints.
            locals: {
                profile: profile,
                m: m
            },
        }).then(function () {
        }, function () {
        });
    };

    $scope.ShowProfileModalCtrl = function ($scope, $mdDialog, $http, profile, m) {
        $scope.profile = profile;
        $scope.m = m;

        console.log(profile);
        console.log(m);
        $scope.cancel = function () {
            $mdDialog.hide();
        };

    };

    $scope.saveProfileName = function (profile) {
        $http.post('api/profiles/saveProfileMeta', profile).then(function (response) {
            var result = response.data;
            if (result.success) {
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
            clickOutsideToClose: false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function () {
            $rootScope.loadProfiles();
        }, function () {
        });
    };

    $scope.openDialogForImportXMLPublicProfile = function (ev) {
        $mdDialog.show({
            controller: $scope.ImportXMLPublicProfileModalCtrl,
            templateUrl: 'ImportXMLPublicProfileModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function () {
            $rootScope.loadProfiles();
        }, function () {

        });
    };

    $scope.ReplacePublicProfileModalCtrl = function ($scope, $mdDialog, $http) {
        $scope.needHelp = false;
        $scope.showHelp = function () {
            $scope.needHelp = true;
            if (!$rootScope.tcamtDocument) $rootScope.loadDocument();
        };
        $scope.getHtml = function (index) {
            if ($rootScope.tcamtDocument) {
                return $sce.trustAsHtml($rootScope.tcamtDocument.helpGuide.slides[index].contents);
            } else {
                return null;
            }
        };
        $scope.xmlFilesData = {};
        $scope.cancel = function () {
            $mdDialog.hide();
        };

        $scope.validateForIGZIPFile = function (files) {
            var replacePublicIGZIPButton = $("#replacePublicIGZIPButton");
            replacePublicIGZIPButton.prop('disabled', false);
        };

        $scope.replaceIGZIP = function () {
            var replacePublicIGZIPButton = $("#replacePublicIGZIPButton");
            replacePublicIGZIPButton.prop('disabled', true);

            var f = document.getElementById('replacePublicProfileZIPFile').files[0];
            var fd = new FormData();
            fd.append('file', f);
            $http.post('api/profiles/replaceZIPFiles/'  + $rootScope.toBeReplaceProfileId, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).success(function () {
                    $mdDialog.hide();
            }).error(function () {
            });
        };
    };

    $scope.ReplaceXMLProfileModalCtrl = function ($scope, $mdDialog, $http) {
        $scope.needHelp = false;
        $scope.showHelp = function () {
            $scope.needHelp = true;

            if (!$rootScope.tcamtDocument) $rootScope.loadDocument();
        };
        $scope.getHtml = function (index) {
            if ($rootScope.tcamtDocument) {
                return $sce.trustAsHtml($rootScope.tcamtDocument.helpGuide.slides[index].contents);
            } else {
                return null;
            }
        };
        $scope.xmlFilesData = {};
        $scope.cancel = function () {
            $mdDialog.hide();
        };

        $scope.validateForIGZIPFile = function (files) {
            var replaceIGZIPButton = $("#replaceIGZIPButton");
            replaceIGZIPButton.prop('disabled', false);
        };

        $scope.replaceIGZIP = function () {
            var replaceIGZIPButton = $("#replaceIGZIPButton");
            replaceIGZIPButton.prop('disabled', true);

            var f = document.getElementById('replaceProfileZIPFile').files[0];
            var fd = new FormData();
            fd.append('file', f);
            $http.post('api/profiles/replaceZIPFiles/'  + $rootScope.toBeReplaceProfileId, fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).success(function () {
                    $mdDialog.hide();
            }).error(function () {
            });
        };
    };

    $scope.ImportXMLProfileModalCtrl = function ($scope, $mdDialog, $http) {
        $scope.needHelp = false;

        $scope.showHelp = function () {
            $scope.needHelp = true;
            if (!$rootScope.tcamtDocument) $rootScope.loadDocument();
        };

        $scope.getHtml = function (index) {
            if ($rootScope.tcamtDocument) {
                return $sce.trustAsHtml($rootScope.tcamtDocument.helpGuide.slides[index].contents);
            } else {
                return null;
            }
        };

        $scope.xmlFilesData = {};
        
        $scope.cancel = function () {
            $mdDialog.hide();
        };

        $scope.validateForIGZIPFile = function (files) {
            var importIGZIPButton = $("#importIGZIPButton");
            importIGZIPButton.prop('disabled', false);
        };

        $scope.importProfileZIP = function () {
            var importIGZIPButton = $("#importIGZIPButton");
            importIGZIPButton.prop('disabled', true);

            var f = document.getElementById('igZIPFile').files[0];
            var fd = new FormData();
            fd.append('file', f);
            $http.post('api/profiles/importZIPFile', fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).success(function () {
                    $mdDialog.hide();
            }).error(function () {
            });
        };
    };

    $scope.ImportXMLPublicProfileModalCtrl = function ($scope, $mdDialog, $http) {
        $scope.needHelp = false;
        $scope.xmlFilesData = {};

        $scope.showHelp = function () {
            $scope.needHelp = true;

            if (!$rootScope.tcamtDocument) $rootScope.loadDocument();


        };

        $scope.getHtml = function (index) {
            if ($rootScope.tcamtDocument) {
                return $sce.trustAsHtml($rootScope.tcamtDocument.helpGuide.slides[index].contents);
            } else {
                return null;
            }
        };

        $scope.cancel = function () {
            $mdDialog.hide();
        };

        $scope.validateForIGZIPFile = function (files) {
            var importPublicIGZIPButton = $("#importPublicIGZIPButton");
            importPublicIGZIPButton.prop('disabled', false);
        };

        $scope.importProfileZIP = function () {
            var importPublicIGZIPButton = $("#importPublicIGZIPButton");
            importPublicIGZIPButton.prop('disabled', true);

            var f = document.getElementById('igZIPFile').files[0];
            var fd = new FormData();
            fd.append('file', f);
            $http.post('api/profiles/importZipFilesForPublic', fd, {
                transformRequest: angular.identity,
                headers: { 'Content-Type': undefined }
            }).success(function () {
                    $mdDialog.hide();
            }).error(function () {
            });
        };
    };
});