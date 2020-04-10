angular.module('tcl').directive('windowExit', function($window, $templateCache,$http, $rootScope,StorageService,ViewSettings) {
    return {
        restrict: 'AE',
        //performance will be improved in compile
        compile: function(element, attrs){
            var myEvent = $window.attachEvent || $window.addEventListener,
                chkevent = $window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compatable
            myEvent(chkevent, function (e) { // For >=IE7, Chrome, Firefox
                $templateCache.removeAll();
            });
        }
    };
});