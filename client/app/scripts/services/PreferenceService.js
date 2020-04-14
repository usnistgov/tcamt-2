/**
 * Created by ena3 on 11/15/17.
 */
/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').factory('PreferenceService',
    ['$q', '$rootScope','$http',function ($q,$rootScope,$http) {

        var svc = this;

        svc.find=function () {
            var delay = $q.defer();
            $http.get('api/prefs/find').then(function (re) {
                console.log(re);

                delay.resolve(re);

            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };

        svc.save=function (p) {
            var delay = $q.defer();
            $http.post('api/prefs/save', p).then(function (re) {
                console.log(re);

                delay.resolve(re);

            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };


        return svc;
    }]);

