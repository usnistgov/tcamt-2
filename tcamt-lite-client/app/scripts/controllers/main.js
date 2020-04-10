'use strict';

angular.module('tcl').controller('MainCtrl', ['$scope', '$rootScope', 'i18n', '$location', 'userInfoService', '$modal', 'Restangular', '$filter', 'base64', '$http', 'Idle', 'notifications', 'IdleService','StorageService',
    function ($scope, $rootScope, i18n, $location, userInfoService, $modal, Restangular, $filter, base64, $http, Idle,notifications,IdleService,StorageService) {
        userInfoService.loadFromServer();
        $rootScope.loginDialog = null;
        $rootScope.loadProfiles = function () {
            if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
                waitingDialog.show('Loading ...', {dialogSize: 'xs', progressType: 'info'});
                $http.get('api/profiles').then(function(response) {
                    $rootScope.profiles = angular.fromJson(response.data);
                    $rootScope.privateProfiles = _.filter($rootScope.profiles , function(p){ return p.sourceType == 'private'; })
                    $rootScope.publicProfiles = _.filter($rootScope.profiles , function(p){ return p.sourceType == 'public'; });
                    waitingDialog.hide();
                }, function(error) {
                    waitingDialog.hide();
                });
            }else{
            }
        };

        $rootScope.loadDocument = function () {
            waitingDialog.show('Loading ...', {dialogSize: 'xs', progressType: 'info'});
            $http.get('api/tcamtdocument').then(function(response) {
                console.log(response);
                $rootScope.tcamtDocument = angular.fromJson(response.data);
                $rootScope.tcamtDocument.userGuide.slides.sort($rootScope.compare);
                $rootScope.tcamtDocument.helpGuide.slides.sort($rootScope.compare);
                if($rootScope.tcamtDocument.generalDocuments) {
                    for(var i in $rootScope.tcamtDocument.generalDocuments){
                        $rootScope.tcamtDocument.generalDocuments[i].slides.sort($rootScope.compare);
                    }
                }

                waitingDialog.hide();
            }, function(error) {
                waitingDialog.hide();
            });
        };


        $rootScope.compare = function (a,b) {
            if (a.position < b.position)
                return -1;
            if (a.position > b.position)
                return 1;
            return 0;
        }


        $rootScope.testDataCategorizations = ['Indifferent', 'Presence-Content Indifferent', 'Presence-Configuration',
            'Presence-System Generated', 'Presence-Test Case Proper', 'Presence Length-Content Indifferent',
            'Presence Length-Configuration', 'Presence Length-System Generated', 'Presence Length-Test Case Proper',
            'Value-Test Case Fixed', 'Value-Test Case Fixed List', 'NonPresence', 'Value-Profile Fixed', 'Value-Profile Fixed List'];


        $rootScope.findConformanceProfileMeta = function (ipid, cpid){
            for(var i in $rootScope.integrationAbstractProfiles){
                if(ipid === $rootScope.integrationAbstractProfiles[i].id){
                    for(var j in $rootScope.integrationAbstractProfiles[i].conformanceProfileMetaDataSet){
                        var cpMeta = $rootScope.integrationAbstractProfiles[i].conformanceProfileMetaDataSet[j];
                        if(cpMeta.id === cpid) return cpMeta;
                    }
                }
            };

            return null;
        };


        $rootScope.findIntegrationProfileMeta = function (ipid){
            for(var i in $rootScope.integrationAbstractProfiles){
                if(ipid === $rootScope.integrationAbstractProfiles[i].id){
                    return $rootScope.integrationAbstractProfiles[i].integrationProfileMetaData;
                }
            };

            return null;
        };

        $scope.language = function () {
            return i18n.language;
        };

        $scope.setLanguage = function (lang) {
            i18n.setLanguage(lang);
        };

        $scope.activeWhen = function (value) {
            return value ? 'active' : '';
        };

        $scope.activeIfInList = function (value, pathsList) {
            var found = false;
            if (angular.isArray(pathsList) === false) {
                return '';
            }
            var i = 0;
            while ((i < pathsList.length) && (found === false)) {
                if (pathsList[i] === value) {
                    return 'active';
                }
                i++;
            }
            return '';
        };

        $scope.path = function () {
            return $location.url();
        };

        $scope.login = function () {
//        console.log("in login");
            $scope.$emit('event:loginRequest', $scope.username, $scope.password);
        };

        $scope.loginReq = function () {
//        console.log("in loginReq");
            if ($rootScope.loginMessage()) {
                $rootScope.loginMessage().text = "";
                $rootScope.loginMessage().show = false;
            }
            $scope.$emit('event:loginRequired');
        };

        $scope.logout = function () {
            $scope.execLogout();
        };

        $scope.execLogout = function () {
            userInfoService.setCurrentUser(null);
            $scope.username = $scope.password = null;
            $scope.$emit('event:logoutRequest');
            $location.url('/tp');
        };

        $scope.cancel = function () {
            $scope.$emit('event:loginCancel');
        };

        $scope.isAuthenticated = function () {
            return userInfoService.isAuthenticated();
        };

        $scope.isPending = function () {
            return userInfoService.isPending();
        };


        $scope.isSupervisor = function () {
            return userInfoService.isSupervisor();
        };

        $scope.isVendor = function () {
            return userInfoService.isAuthorizedVendor();
        };

        $scope.isAuthor = function () {
            return userInfoService.isAuthor();
        };

        $scope.isCustomer = function () {
            return userInfoService.isCustomer();
        };

        $scope.isAdmin = function () {
            return userInfoService.isAdmin();
        };

        $rootScope.isAdmin = function () {
            return userInfoService.isAdmin();
        };

        $scope.getRoleAsString = function () {
            if ($scope.isAuthor() === true) {
                return 'author';
            }
            if ($scope.isSupervisor() === true) {
                return 'Supervisor';
            }
            if ($scope.isAdmin() === true) {
                return 'Admin';
            }
            return 'undefined';
        };

        $scope.getUsername = function () {
            if (userInfoService.isAuthenticated() === true) {
                return userInfoService.getUsername();
            }
            return '';
        };

        $rootScope.showLoginDialog = function (username, password) {

            if ($rootScope.loginDialog && $rootScope.loginDialog != null && $rootScope.loginDialog.opened) {
                $rootScope.loginDialog.dismiss('cancel');
            }

            $rootScope.loginDialog = $modal.open({
                backdrop: 'static',
                keyboard: 'false',
                controller: 'LoginCtrl',
                size: 'lg',
                templateUrl: 'views/account/login.html',
                resolve: {
                    user: function () {
                        return {username: $scope.username, password: $scope.password};
                    }
                }
            });

            $rootScope.loginDialog.result.then(function (result) {
                if (result) {
                    $scope.username = result.username;
                    $scope.password = result.password;
                    $scope.login();
                } else {
                    $scope.cancel();
                }
            });
        };

        $rootScope.started = false;

        Idle.watch();

        $rootScope.$on('IdleStart', function () {
            closeModals();
            $rootScope.warning = $modal.open({
                templateUrl: 'warning-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $rootScope.$on('IdleEnd', function () {
            closeModals();
        });

        $rootScope.$on('IdleTimeout', function () {
            closeModals();
            if ($scope.isAuthenticated()) {
                $rootScope.$emit('event:execLogout');
            }
            $rootScope.timedout = $modal.open({
                templateUrl: 'timedout-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $scope.$on('Keepalive', function() {
            if ($scope.isAuthenticated()) {
                IdleService.keepAlive();
            }
        });

        $rootScope.$on('event:execLogout', function () {
            $scope.execLogout();
        });

        function closeModals() {
            if ($rootScope.warning) {
                $rootScope.warning.close();
                $rootScope.warning = null;
            }

            if ($rootScope.timedout) {
                $rootScope.timedout.close();
                $rootScope.timedout = null;
            }
        };

        $rootScope.start = function () {
            closeModals();
            Idle.watch();
            $rootScope.started = true;
        };

        $rootScope.stop = function () {
            closeModals();
            Idle.unwatch();
            $rootScope.started = false;

        };


        $scope.checkForIE = function () {
            var BrowserDetect = {
                init: function () {
                    this.browser = this.searchString(this.dataBrowser) || 'An unknown browser';
                    this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'an unknown version';
                    this.OS = this.searchString(this.dataOS) || 'an unknown OS';
                },
                searchString: function (data) {
                    for (var i = 0; i < data.length; i++) {
                        var dataString = data[i].string;
                        var dataProp = data[i].prop;
                        this.versionSearchString = data[i].versionSearch || data[i].identity;
                        if (dataString) {
                            if (dataString.indexOf(data[i].subString) !== -1) {
                                return data[i].identity;
                            }
                        }
                        else if (dataProp) {
                            return data[i].identity;
                        }
                    }
                },
                searchVersion: function (dataString) {
                    var index = dataString.indexOf(this.versionSearchString);
                    if (index === -1) {
                        return;
                    }
                    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
                },
                dataBrowser: [
                    {
                        string: navigator.userAgent,
                        subString: 'Chrome',
                        identity: 'Chrome'
                    },
                    {   string: navigator.userAgent,
                        subString: 'OmniWeb',
                        versionSearch: 'OmniWeb/',
                        identity: 'OmniWeb'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'Apple',
                        identity: 'Safari',
                        versionSearch: 'Version'
                    },
                    {
                        prop: window.opera,
                        identity: 'Opera',
                        versionSearch: 'Version'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'iCab',
                        identity: 'iCab'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'KDE',
                        identity: 'Konqueror'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'Firefox',
                        identity: 'Firefox'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'Camino',
                        identity: 'Camino'
                    },
                    {       // for newer Netscapes (6+)
                        string: navigator.userAgent,
                        subString: 'Netscape',
                        identity: 'Netscape'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'MSIE',
                        identity: 'Explorer',
                        versionSearch: 'MSIE'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'Gecko',
                        identity: 'Mozilla',
                        versionSearch: 'rv'
                    },
                    {       // for older Netscapes (4-)
                        string: navigator.userAgent,
                        subString: 'Mozilla',
                        identity: 'Netscape',
                        versionSearch: 'Mozilla'
                    }
                ],
                dataOS: [
                    {
                        string: navigator.platform,
                        subString: 'Win',
                        identity: 'Windows'
                    },
                    {
                        string: navigator.platform,
                        subString: 'Mac',
                        identity: 'Mac'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'iPhone',
                        identity: 'iPhone/iPod'
                    },
                    {
                        string: navigator.platform,
                        subString: 'Linux',
                        identity: 'Linux'
                    }
                ]

            };
            BrowserDetect.init();

            if (BrowserDetect.browser === 'Explorer') {
                var title = 'You are using Internet Explorer';
                var msg = 'This site is not yet optimized with Internet Explorer. For the best user experience, please use Chrome, Firefox or Safari. Thank you for your patience.';
                var btns = [
                    {result: 'ok', label: 'OK', cssClass: 'btn'}
                ];

                //$dialog.messageBox(title, msg, btns).open();


            }
        };


    }]);

angular.module('tcl').controller('LoginCtrl', ['$scope', '$modalInstance', 'user', function ($scope, $modalInstance, user) {
    $scope.user = user;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.login = function () {
//        console.log("logging in...");
        $modalInstance.close($scope.user);
    };
}]);


angular.module('tcl').controller('RichTextCtrl', ['$scope', '$modalInstance', 'editorTarget', function ($scope, $modalInstance, editorTarget) {
    $scope.editorTarget = editorTarget;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.close($scope.editorTarget);
    };
}]);


angular.module('tcl').controller('InputTextCtrl', ['$scope', '$modalInstance', 'editorTarget', function ($scope, $modalInstance, editorTarget) {
    $scope.editorTarget = editorTarget;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.close($scope.editorTarget);
    };
}]);

angular.module('tcl').controller('ConfirmLogoutCtrl', ["$scope", "$modalInstance", "$rootScope", "$http", function ($scope, $modalInstance, $rootScope, $http) {
    $scope.logout = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

