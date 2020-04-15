'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module oƒf the application.
 */
var app = angular
    .module('tcl', [
        'ngMaterial',
        'ngAnimate',
        'LocalStorageModule',
        'ngCookies',
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'angular-bind-html-compile',
        'ngIdle',
        'ui.bootstrap',
        'smart-table',
        'ngTreetable',
        'restangular',
        'angularjs-dropdown-multiselect',
        'dndLists',
        'froala',
        'ngNotificationsBar',
        'ngDragDrop',
        'ui.tree',
        'ui.bootstrap',
        'ui.bootstrap.contextMenu',
        'ui.codemirror',
        'ui-notification',
        'hit-validation-result'
    ]);
app.config(function(NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 10000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'right',
        positionY: 'top'
    });
});
var
//the HTTP headers to be used by all requests
    httpHeaders,

//the message to show on the login popup page
    loginMessage,

//the spinner used to show when we are still waiting for a server answer
    spinner,

//The list of messages we don't want to displat
    mToHide = ['usernameNotFound', 'emailNotFound', 'usernameFound', 'emailFound', 'loginSuccess', 'userAdded', 'igDocumentNotSaved', 'igDocumentSaved', 'uploadImageFailed'];

//the message to be shown to the user
var msg = {};

app.config(function ($routeProvider, RestangularProvider, $httpProvider, KeepaliveProvider, IdleProvider, notificationsConfigProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html'
        })
        .when('/home', {
            templateUrl: 'views/home.html'
        })
        .when('/tp', {
            templateUrl: 'views/tp.html'
        })
        .when('/profiles', {
            templateUrl: 'views/profiles.html'
        })
        .when('/doc', {
            templateUrl: 'views/doc.html'
        })
        .when('/setting', {
            templateUrl: 'views/setting.html'
        })
        .when('/about', {
            templateUrl: 'views/about.html'
        })
        .when('/config', {
            templateUrl: 'views/config.html'
        })
        .when('/download', {
            templateUrl: 'views/download.html'
        })
        .when('/contact', {
            templateUrl: 'views/contact.html'
        })
        .when('/forgotten', {
            templateUrl: 'views/account/forgotten.html',
            controller: 'ForgottenCtrl'
        })
        .when('/issue', {
            templateUrl: 'views/issue.html',
            controller: 'IssueCtrl'
        })
        .when('/registration', {
            templateUrl: 'views/account/registration.html',
            controller: 'RegistrationCtrl'
        }).when('/useraccount', {
            templateUrl: 'views/account/userAccount.html'
        }) .when('/glossary', {
            templateUrl: 'views/glossary.html'
        })
//        .when('/account', {
//            templateUrl: 'views/account/account.html',
//            controller: 'AccountCtrl',
//            resolve: {
//                login: ['LoginService', function(LoginService){
//                    return LoginService();
//                }]
//            }
//        })
        .when('/registerResetPassword', {
            templateUrl: 'views/account/registerResetPassword.html',
            controller: 'RegisterResetPasswordCtrl',
            resolve: {
                isFirstSetup: function () {
                    return true;
                }
            }
        })
        .when('/resetPassword', {
            templateUrl: 'views/account/registerResetPassword.html',
            controller: 'RegisterResetPasswordCtrl',
            resolve: {
                isFirstSetup: function () {
                    return false;
                }
            }
        })
        .when('/registrationSubmitted', {
            templateUrl: 'views/account/registrationSubmitted.html'
        })
        .otherwise({
            redirectTo: '/'
        });


//    $http.defaults.headers.post['X-CSRFToken'] = $cookies['csrftoken'];

    $httpProvider.interceptors.push(function ($q) {
        return {
            request: function (config) {
//            	console.log(config.url);
//                return "http://localhost:8080/igamt"+ value;
//                if(config.url.startsWith("api")){
//                   config.url = "http://localhost:8080/igamt/"+  config.url;
//                   console.log("config.url=" + config.url);
//                }
                return config || $q.when(config);
            }
        }
    });


    $httpProvider.interceptors.push(function ($rootScope, $q) {
        var setMessage = function (response) {
            //if the response has a text and a type property, it is a message to be shown
            if (response.data && response.data.text && response.data.type) {
                if (response.status === 401) {
//                        console.log("setting login message");
                    loginMessage = {
                        text: response.data.text,
                        type: response.data.type,
                        skip: response.data.skip,
                        show: true,
                        manualHandle: response.data.manualHandle
                    };

                } else if (response.status === 503) {
                    msg = {
                        text: "server.down",
                        type: "danger",
                        show: true,
                        manualHandle: true
                    };
                } else {
                    msg = {
                        text: response.data.text,
                        type: response.data.type,
                        skip: response.data.skip,
                        show: true,
                        manualHandle: response.data.manualHandle
                    };
                    var found = false;
                    var i = 0;
                    while (i < mToHide.length && !found) {
                        if (msg.text === mToHide[i]) {
                            found = true;
                        }
                        i++;
                    }
                    if (found === true) {
                        msg.show = false;
                    } else {
//                        //hide the msg in 5 seconds
//                                                setTimeout(
//                                                    function() {
//                                                        msg.show = false;
//                                                        //tell angular to refresh
//                                                        $rootScope.$apply();
//                                                    },
//                                                    10000
//                                                );
                    }
                 }
            }
        };

        return {
            response: function (response) {
                setMessage(response);
                return response || $q.when(response);
            },

            responseError: function (response) {
                setMessage(response);
                return $q.reject(response);
            }
        };

    });

    //configure $http to show a login dialog whenever a 401 unauthorized response arrives
    $httpProvider.interceptors.push(function ($rootScope, $q) {
        return {
            response: function (response) {
                return response || $q.when(response);
            },
            responseError: function (response) {
                if (response.status === 401) {
                    //We catch everything but this one. So public users are not bothered
                    //with a login windows when browsing home.
                    if (response.config.url !== 'api/authentication') {
                        //We don't intercept this request
                        if (response.config.url !== 'api/accounts/login') {
                            var deferred = $q.defer(),
                                req = {
                                    config: response.config,
                                    deferred: deferred
                                };
                            $rootScope.requests401.push(req);
                        }
                        $rootScope.$broadcast('event:loginRequired');
//                        return deferred.promise;

                        return  $q.when(response);
                    }
                }
                return $q.reject(response);
            }
        };
    });

    //intercepts ALL angular ajax http calls
    $httpProvider.interceptors.push(function ($q) {
        return {
            response: function (response) {
                //hide the spinner
                spinner = false;
                return response || $q.when(response);
            },
            responseError: function (response) {
                //hide the spinner
                spinner = false;
                return $q.reject(response);
            }
        };


    });


    IdleProvider.idle(7200);
    IdleProvider.timeout(30);
    KeepaliveProvider.interval(60);

    // auto hide
    notificationsConfigProvider.setAutoHide(true);

    // delay before hide
    notificationsConfigProvider.setHideDelay(30000);

    // delay between animation and removing the nofitication
    notificationsConfigProvider.setAutoHideAnimationDelay(1200);

    var spinnerStarter = function (data, headersGetter) {
        spinner = true;
        return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerStarter);

    httpHeaders = $httpProvider.defaults.headers;


});

app.config([
    "$routeProvider",
    "$httpProvider",
    function($routeProvider, $httpProvider){
        $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
    }
]);
app.run(function ($rootScope, $location, Restangular, $modal, $filter, base64, userInfoService, $http, AppInfo, StorageService, $templateCache, $window, notifications, $q) {
    $rootScope.appInfo = {};
    $rootScope.froalaDocLink = "https://www.froala.com/wysiwyg-editor/examples";

    //Check if the login dialog is already displayed.
    $rootScope.loginDialogShown = false;
    $rootScope.subActivePath = null;

    // load app info
    AppInfo.get().then(function (appInfo) {
        $rootScope.appInfo = appInfo;
        console.log("INIT FROALA");
        console.log($rootScope.appInfo.uploadedImagesUrl);
        $rootScope.froalaEditorOptions = {
            placeholderText: '',
            imageUploadURL: $rootScope.appInfo.uploadedImagesUrl + "/upload",
            imageAllowedTypes: ['jpeg', 'jpg', 'png', 'gif'],
            fileUploadURL: $rootScope.appInfo.uploadedImagesUrl + "/upload",
            fileAllowedTypes: ['application/pdf', 'application/msword', 'application/x-pdf', 'text/plain', 'application/xml','text/xml'],
            charCounterCount: false,
            quickInsertTags: [''],
            immediateAngularModelUpdate:true,
            events: {
                'froalaEditor.initialized': function () {

                },
                'froalaEditor.file.error': function(e, editor, error){
                    $rootScope.msg().text= error.text;
                    $rootScope.msg().type= error.type;
                    $rootScope.msg().show= true;
                },
                'froalaEditor.image.error ':function(e, editor, error){
                    $rootScope.msg().text= error.text;
                    $rootScope.msg().type= error.type;
                    $rootScope.msg().show= true;
                }
            },
            key: 'Rg1Wb2KYd1Td1WIh1CVc2F==',
            imageResize: true,
            imageEditButtons: ['imageReplace', 'imageAlign', 'imageRemove', '|', 'imageLink', 'linkOpen', 'linkEdit', 'linkRemove', '-', 'imageAlt'],
            pastePlain: true
        };
        httpHeaders.common['appVersion'] = appInfo.version;
        var prevVersion = StorageService.getAppVersion(StorageService.APP_VERSION);
        StorageService.setAppVersion(appInfo.version);

        if (prevVersion == null || prevVersion !== appInfo.version) {
            $rootScope.clearAndReloadApp();
        }
    }, function (error) {
        $rootScope.appInfo = {};
        $rootScope.openErrorDlg("Sorry we could not communicate with the server. Please try again");
    });


    //make current message accessible to root scope and therefore all scopes
    $rootScope.msg = function () {
        return msg;
    };

    //make current loginMessage accessible to root scope and therefore all scopes
    $rootScope.loginMessage = function () {
//            console.log("calling loginMessage()");
        return loginMessage;
    };

    //showSpinner can be referenced from the view
    $rootScope.showSpinner = function () {
        return spinner;
    };

    /**
     * Holds all the requests which failed due to 401 response.
     */
    $rootScope.requests401 = [];

    $rootScope.$on('event:loginRequired', function () {
//            console.log("in loginRequired event");
        $rootScope.showLoginDialog();
    });

    /**
     * On 'event:loginConfirmed', resend all the 401 requests.
     */
    $rootScope.$on('event:loginConfirmed', function () {
        var i,
            requests = $rootScope.requests401,
            retry = function (req) {
                $http(req.config).then(function (response) {
                    req.deferred.resolve(response);
                });
            };

        for (i = 0; i < requests.length; i += 1) {
            retry(requests[i]);
        }
        $rootScope.requests401 = [];
        $location.url('/home');


        $rootScope.loadProfiles();


    });

    /*jshint sub: true */
    /**
     * On 'event:loginRequest' send credentials to the server.
     */
    $rootScope.$on('event:loginRequest', function (event, username, password) {
        httpHeaders.common['Accept'] = 'application/json';
        httpHeaders.common['Authorization'] = 'Basic ' + base64.encode(username + ':' + password);

        var loginObj = {username: username, password: password};
        $http.post('api/login', loginObj).then(function (response) {
            console.log(response);
            $http.get('api/authentication').then(function (result) {
                console.log(result);
                if (result.data && result.data != null) {
                    var rs = angular.fromJson(result.data);
                    rs.fullName = username;
                    rs.accountId = 10;
                    userInfoService.setCurrentUser(rs);
                    $rootScope.$broadcast('event:loginConfirmed');
                } else {
                    userInfoService.setCurrentUser(null);
                }
            }, function () {
                userInfoService.setCurrentUser(null);
            });
        }, function (error) {
            Notification.error({message:"Failed to login", delay:1000});
        });


        // $http.get('api/login').success(function () {
        //     //If we are here in this callback, login was successfull
        //     //Let's get user info now
        //     httpHeaders.common['Authorization'] = null;
        //     $http.get('api/accounts/cuser').then(function (result) {
        //         if (result.data && result.data != null) {
        //             var rs = angular.fromJson(result.data);
        //             userInfoService.setCurrentUser(rs);
        //             $rootScope.$broadcast('event:loginConfirmed');
        //         } else {
        //             userInfoService.setCurrentUser(null);
        //         }
        //     }, function () {
        //         userInfoService.setCurrentUser(null);
        //     });
        // });
    });

    /**
     * On 'logoutRequest' invoke logout on the server.
     */
    $rootScope.$on('event:logoutRequest', function () {
        httpHeaders.common['Authorization'] = null;
        userInfoService.setCurrentUser(null);
        $http.get('api/logout');
    });

    /**
     * On 'loginCancel' clears the Authentication header
     */
    $rootScope.$on('event:loginCancel', function () {
        httpHeaders.common['Authorization'] = null;
    });

    $rootScope.$on('$routeChangeStart', function (next, current) {
//            console.log('route changing');
        // If there is a message while change Route the stop showing the message
        if (msg && msg.manualHandle === 'false') {
//                console.log('detected msg with text: ' + msg.text);
            msg.show = false;
        }
    });

    $rootScope.loadUserFromCookie = function () {
        if (userInfoService.hasCookieInfo() === true) {
            //console.log("found cookie!")
            userInfoService.loadFromCookie();
            httpHeaders.common['Authorization'] = userInfoService.getHthd();
        }
        else {
            //console.log("cookie not found");
        }
    };


    $rootScope.isSubActive = function (path) {
        return path === $rootScope.subActivePath;
    };

    $rootScope.setSubActive = function (path) {
        $rootScope.subActivePath = path;
    };

    $rootScope.getFullName = function () {
        if (userInfoService.isAuthenticated() === true) {
            return userInfoService.getFullName();
        }
        return '';
    };
    $rootScope.clearAndReloadApp = function () {
        $rootScope.clearTemplate();
        $rootScope.reloadPage();
    };

    $rootScope.openErrorDlg = function (errorMessage) {
        StorageService.clearAll();
        if (!$rootScope.errorModalInstance || $rootScope.errorModalInstance === null || !$rootScope.errorModalInstance.opened) {
            $rootScope.errorModalInstance = $modal.open({
                templateUrl: 'CriticalError.html',
                size: 'lg',
                backdrop: true,
                keyboard: 'true',
                'controller': 'FailureCtrl',
                resolve: {
                    error: function () {
                        return errorMessage;
                    }
                }
            });
            $rootScope.errorModalInstance.result.then(function () {
                $rootScope.clearAndReloadApp();
            }, function () {
                $rootScope.clearAndReloadApp();
            });
        }
    };

    $rootScope.openSessionExpiredDlg = function () {
        if (!$rootScope.sessionExpiredModalInstance || $rootScope.sessionExpiredModalInstance === null || !$rootScope.sessionExpiredModalInstance.opened) {
            $rootScope.sessionExpiredModalInstance = $modal.open({
                templateUrl: 'timedout-dialog.html',
                size: 'lg',
                backdrop: true,
                keyboard: 'true',
                'controller': 'FailureCtrl',
                resolve: {
                    error: function () {
                        return "";
                    }
                }
            });
            $rootScope.sessionExpiredModalInstance.result.then(function () {
                $rootScope.clearAndReloadApp();
            }, function () {
                $rootScope.clearAndReloadApp();
            });
        }
    };

    $rootScope.clearTemplate = function () {
        $templateCache.removeAll();
    };

    $rootScope.reloadPage = function () {
        $window.location.reload();
    };

    $rootScope.scrollbarWidth = 0;

    $rootScope.getScrollbarWidth = function () {
        if ($rootScope.scrollbarWidth == 0) {
            var outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.width = "100px";
            outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

            document.body.appendChild(outer);

            var widthNoScroll = outer.offsetWidth;
            // force scrollbars
            outer.style.overflow = "scroll";

            // add innerdiv
            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);

            var widthWithScroll = inner.offsetWidth;

            // remove divs
            outer.parentNode.removeChild(outer);

            $rootScope.scrollbarWidth = widthNoScroll - widthWithScroll;
        }

        return $rootScope.scrollbarWidth;
    };





});



