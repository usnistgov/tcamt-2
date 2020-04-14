/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').factory('loginTestingToolSvc',
    ['$q','$modal', '$rootScope','base64','$http',function ($q,$modal,$rootScope,base64,$http) {

        var svc = this;



        svc.exportToGVT = function(id, auth,targetUrl,targetDomain) {
            var httpHeaders = {};
            httpHeaders['target-auth'] = auth;
            httpHeaders['target-url'] = targetUrl;
            httpHeaders['target-domain'] = targetDomain;
            return $http.post('api/testplans/' + id + '/connect',{headers:httpHeaders});
        };

        svc.login = function(username, password,targetUrl) {

            var delay = $q.defer();
            var httpHeaders = {};
            httpHeaders['Accept'] = 'application/json';
            var auth =  base64.encode(username + ':' + password);
            httpHeaders['target-auth'] = 'Basic ' + auth;
            httpHeaders['target-url'] = targetUrl;
            console.log(targetUrl);
            console.log(username);
            console.log(password);
            console.log(auth);
            $http.get('api/connect/login', {headers:httpHeaders}).then(function (res) {

                console.log(auth);
                delay.resolve(auth);

            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };

        svc.createDomain = function(auth,targetUrl,key, name,homeTitle) {
            var httpHeaders = {};
            httpHeaders['Accept'] = 'application/json';
            httpHeaders['target-auth'] = auth;
            httpHeaders['target-url'] = targetUrl;
            return $http.post('api/connect/createDomain',{'key':key,'name':name,'homeTitle':homeTitle}, {headers:httpHeaders});
        };


        svc.exportToGVT = function(id, auth,targetUrl,targetDomain) {
            var httpHeaders = {};
            httpHeaders['target-auth'] = auth;
            httpHeaders['target-url'] = targetUrl;
            httpHeaders['target-domain'] = targetDomain;
            return $http.post('api/testplans/' + id + '/connect',{},{headers:httpHeaders});
        };

        svc.exportToGVTForCompositeProfile = function(id, cids, auth,targetUrl,targetDomain) {
            var httpHeaders = {};
            httpHeaders['target-auth'] = auth;
            httpHeaders['target-url'] = targetUrl;
            httpHeaders['target-domain'] = targetDomain;
            return $http.post('api/igdocuments/' + id + '/connect/composites',cids,{headers:httpHeaders});
        };

        svc.getDomains = function(targetUrl,auth) {
            var delay = $q.defer();
            var httpHeaders = {};
            httpHeaders['target-url'] = targetUrl;
            httpHeaders['target-auth'] = auth;
            $http.get("api/connect/domains",{headers:httpHeaders}).then(function (result) {
                var data = angular.fromJson(result.data);
                delay.resolve(data);
            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };



        return svc;
    }]);

