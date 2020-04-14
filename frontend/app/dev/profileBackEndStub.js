///**
// * Created by haffo on 2/2/15.
// */

angular.module('tcl').run(function ($httpBackend, $q, $http) {

	$httpBackend.whenGET('api/session/keepAlive').respond(function (method, url, data, headers) {
        return [200, {}, {}];
    });

    $httpBackend.whenGET('api/shortaccounts?filter=accountType::author').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/shortaccounts.json', false);
        request.send(null);
        var profile = request.response;
        return [request.status, profile, {}];
    });

    $httpBackend.whenPOST('api/accounts/1/userpasswordchange').respond(function (method, url, data, headers) {
        return [200, {type: 'success',
            text: 'accountPasswordReset',
            resourceId: '1',
            manualHandle: "false"}, {}];
    });

    $httpBackend.whenPOST('api/accounts/2/userpasswordchange').respond(function (method, url, data, headers) {
        return [200, {type: 'success',
            text: 'invalidPassword',
            resourceId: '2',
            manualHandle: "false"}, {}];
    });


    $httpBackend.whenPOST('api/accounts/1/approveaccount').respond(function (method, url, data, headers) {
        return [200, {type: 'success',
            text: 'accountApproved',
            resourceId: '1',
            manualHandle: "false"}, {}];
    });

    $httpBackend.whenPOST('api/accounts/2/approveaccount').respond(function (method, url, data, headers) {
        return [200, {type: 'success',
            text: 'accountIsNotPending',
            resourceId: '2',
            manualHandle: "false"}, {}];
    });

    $httpBackend.whenPOST('api/testplans/supplementsGeneration').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/messageContentsGeneration.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });


    $httpBackend.whenPOST('api/accounts/1/suspendaccount').respond(function (method, url, data, headers) {
        return [200, {type: 'success',
            text: 'accountSuspended',
            resourceId: '1',
            manualHandle: "false"}, {}];
    });

    $httpBackend.whenGET('api/accounts/cuser').respond(function (method, url, data, headers) {
        return [200, {}, {}];
    });
    
    $httpBackend.whenGET('api/accounts/cuser').respond(function (method, url, data, headers) {
        return [200, {}, {}];
    });

    $httpBackend.whenGET('api/accounts/login').respond(function (method, url, data, headers) {
        return [200, {}, {}];
    });


    $httpBackend.whenGET(/views\//).passThrough();

    $httpBackend.whenGET(/resources\//).passThrough();
    
    $httpBackend.whenGET('api/testplans').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/testplans.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });


    $httpBackend.whenGET('api/igdocuments').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/igdocuments.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });

    $httpBackend.whenGET('api/profiles').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/profiles.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });

    $httpBackend.whenGET('api/profiles/public').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/public.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });

    // $httpBackend.whenGET('api/igdocuments/57450d2ad4c6f57e697ab7e3/tcamtProfile').respond(function (method, url, data, headers) {
    //     var request = new XMLHttpRequest();
    //     request.open('GET', '../../resources/57450d2ad4c6f57e697ab7e3.json', false);
    //     request.send(null);
    //     var profile = angular.fromJson(request.response);
    //     return [request.status, profile, {}];
    // });

    $httpBackend.whenGET('api/template').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/template.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });

    
    
    $httpBackend.whenGET('api/appInfo').respond(function (method, url, data, headers) {
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/appInfo/appInfo.json', false);
        request.send(null);
        var d = angular.fromJson(request.response);
        return [request.status, d, {}];
    });


       $httpBackend.whenGET('api/config').respond(function (method, url, data, headers) {
           console.log("config")
        var request = new XMLHttpRequest();
        request.open('GET', '../../resources/configuration.json', false);
        request.send(null);
        var profile = angular.fromJson(request.response);
        return [request.status, profile, {}];
    });

});

