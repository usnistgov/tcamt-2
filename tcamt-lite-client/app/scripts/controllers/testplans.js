/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('TestPlanCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q, notifications, ElementUtils,$sce,Notification,PreferenceService) {
    $scope.loading = false;
    $scope.selectedTestCaseTab = 0;
    $scope.selectedTestStepTab = {};
    $rootScope.messageTree = null;
    $scope.selectedTestStepTab.tabNum = 0;
    $scope.hideToc = false;
    $rootScope.tps = [];
    $rootScope.sr={
        name:""
    };

    $scope.context="free";
    $scope.hideOrShowToc = function (){
        $scope.hideToc = !$scope.hideToc;
    };
    $scope.closeSelectBox = function(){
        $("md-backdrop").trigger ("click")
    }

    $scope.debugTp=function(tp){
        console.log(tp);
    };
    $('#segmentTable').treetable({expandable:true});

    $scope.currentNavItem="CfMetaData";
    $scope.expanded = false;

    $scope.expandAll = function() {
        waitingDialog.show('Expanding ...', {dialogSize: 'xs', progressType: 'info'});
        $timeout( function(){
            $scope.expanded = !$scope.expanded;
            $('#segmentTable').treetable('expandAll');
        }, 10);
        $timeout( function(){
            $('#segmentTable').treetable('expandAll');
            waitingDialog.hide();
        }, 2000 );
    };

    $scope.collapseAll = function() {
        $scope.expanded = !$scope.expanded;
        $('#segmentTable').treetable('collapseAll');
    };

    $scope.expandNode=function(id){
        //treetable('collapseAll');
        $('#segmentTable').treetable("expandNode", id)
    }
    $scope.hasError= function(cat, value){
        if(!cat || cat==""){
            return false;
        }
        if(!value||value===""){
            if(cat=="Indifferent"||cat=="NonPresence"||cat==""){
                return false;
            }else{
                return true;
            }
        }else{
            if(value&&value!==""){
                if(cat=="NonPresence"){
                    return true;
                }else return false;
            }
        }
    }



    $scope.testPlanOptions=[];
    $scope.accordi = {metaData: false, definition: true, tpList: true, tpDetails: false};
    $rootScope.usageViewFilter = 'All';
    $rootScope.selectedTemplate=null;
    $scope.DocAccordi = {};
    $scope.TestStoryAccordi = {};
    $scope.TestStoryAccordi.description = true;
    $scope.TestStoryAccordi.comments = false;
    $scope.TestStoryAccordi.preCondition = false;
    $scope.TestStoryAccordi.postCondition = false;
    $scope.TestStoryAccordi.testObjectives = false;
    $scope.TestStoryAccordi.evaluationCriteria = false;
    $scope.TestStoryAccordi.notes = false;

    $scope.DocAccordi.testdata = false;
    $scope.DocAccordi.messageContents = true;
    $scope.DocAccordi.jurorDocument = false;
    $scope.nistStd = {};
    $scope.nistStd.nist = true;
    $scope.nistStd.std = false;
    $rootScope.changesMap={};
    $rootScope.tocHeigh = 700;
    $rootScope.templateHeigh = 300;
    $(document).keydown(function(e) {
        var nodeName = e.target.nodeName.toLowerCase();



        if (e.which === 8) {
            if ((nodeName === 'input') ||
                nodeName === 'textarea') {
                // do nothing
            } else {
                e.preventDefault();
            }
        }
    });

    $scope.addIGForFilter = function (id) {
        if(!$scope.selectedTestPlan.listOfIntegrationProfileIds) {
            $scope.selectedTestPlan.listOfIntegrationProfileIds = [];
        }

        $scope.selectedTestPlan.listOfIntegrationProfileIds.push(id);
        $scope.recordChangeForGroup($scope.selectedTestPlan.listOfIntegrationProfileIds,$scope.selectedTestPlan);
        $scope.updateListOfIntegrationAbstractProfiles();
    };

    $scope.removeIGForFilter = function (id) {
        if(!$scope.selectedTestPlan.listOfIntegrationProfileIds) {
            $scope.selectedTestPlan.listOfIntegrationProfileIds = [];
        }

        var index = $scope.selectedTestPlan.listOfIntegrationProfileIds.indexOf(id);
        if (index > -1) {
            $scope.selectedTestPlan.listOfIntegrationProfileIds.splice(index, 1);
        }
        $scope.recordChangeForGroup($scope.selectedTestPlan.listOfIntegrationProfileIds,$scope.selectedTestPlan);
        $scope.updateListOfIntegrationAbstractProfiles();
    };


    $scope.findConfig = function (configId) {
        return _.find($rootScope.testStoryConfigs, function(config){ return config.id == configId; });
    };
    $scope.updateGlobalTestStoryConfigForTestPlan = function () {
        $rootScope.selectedTestPlan.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.testStoryConfigId; });
    };
    $scope.updateGlobalTestStoryConfigForTestGroup = function () {
        for(i in $rootScope.selectedTestPlan.children){
            if($rootScope.selectedTestPlan.children[i].type == 'testcasegroup'){
                $scope.updateGlobalTestStoryConfigForTestGroupInsideGroup($rootScope.selectedTestPlan.children[i]);
            }
        }
    };
    $scope.updateGlobalTestStoryConfigForTestGroupInsideGroup = function (group) {
        group.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestGroupConfigId;  });
        group.testStoryConfigId = $rootScope.selectedTestPlan.globalTestGroupConfigId;

        for(i in group.children){
            if(group.children[i].type == 'testcasegroup'){
                $scope.updateGlobalTestStoryConfigForTestGroupInsideGroup(group.children[i]);
            }
        }
    };
    $scope.updateGlobalTestStoryConfigForTestCase = function () {
        for(i in $rootScope.selectedTestPlan.children){
            if($rootScope.selectedTestPlan.children[i].type == 'testcasegroup'){
                $scope.updateGlobalTestStoryConfigForTestCaseInsideGroup($rootScope.selectedTestPlan.children[i]);
            }else if($rootScope.selectedTestPlan.children[i].type == 'testcase'){
                $rootScope.selectedTestPlan.children[i].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestCaseConfigId;  });
                $rootScope.selectedTestPlan.children[i].testStoryConfigId = $rootScope.selectedTestPlan.globalTestCaseConfigId;
            }
        }
    };
    $scope.updateGlobalTestStoryConfigForTestCaseInsideGroup = function (group){
        for(i in group.children){
            if(group.children[i].type == 'testcasegroup'){
                $scope.updateGlobalTestStoryConfigForTestCaseInsideGroup(group.children[i]);
            }else if(group.children[i].type == 'testcase'){
                group.children[i].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestCaseConfigId;  });
                group.children[i].testStoryConfigId = $rootScope.selectedTestPlan.globalTestCaseConfigId;
            }
        }
    };
    $scope.updateGlobalManualTestStoryConfigForTestStep = function () {
        for(i in $rootScope.selectedTestPlan.children){
            if($rootScope.selectedTestPlan.children[i].type == 'testcasegroup'){
                $scope.updateGlobalManualTestStoryConfigForTestStepInsideGroup($rootScope.selectedTestPlan.children[i]);
            }else if($rootScope.selectedTestPlan.children[i].type == 'testcase'){
                for(j in $rootScope.selectedTestPlan.children[i].teststeps){
                    if($rootScope.selectedTestPlan.children[i].teststeps[j].integrationProfileId == null){
                        $rootScope.selectedTestPlan.children[i].teststeps[j].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalManualTestStepConfigId;  });
                        $rootScope.selectedTestPlan.children[i].teststeps[j].testStoryConfigId = $rootScope.selectedTestPlan.globalManualTestStepConfigId;
                    }
                }
            }
        }
    };
    $scope.updateGlobalManualTestStoryConfigForTestStepInsideGroup = function (group) {
        for(i in group.children){
            if(group.children[i].type == 'testcasegroup'){
                $scope.updateGlobalManualTestStoryConfigForTestStepInsideGroup(group.children[i]);
            }else if(group.children[i].type == 'testcase'){
                for(j in group.children[i].teststeps){
                    if(group.children[i].teststeps[j].integrationProfileId == null){
                        group.children[i].teststeps[j].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalManualTestStepConfigId;  });
                        group.children[i].teststeps[j].testStoryConfigId = $rootScope.selectedTestPlan.globalManualTestStepConfigId;
                    }
                }
            }
        }
    };
    $scope.updateGlobalAutoTestStoryConfigForTestStep = function () {
        for(i in $rootScope.selectedTestPlan.children){
            if($rootScope.selectedTestPlan.children[i].type == 'testcasegroup'){
                $scope.updateGlobalAutoTestStoryConfigForTestStepInsideGroup($rootScope.selectedTestPlan.children[i]);
            }else if($rootScope.selectedTestPlan.children[i].type == 'testcase'){
                for(j in $rootScope.selectedTestPlan.children[i].teststeps){
                    if($rootScope.selectedTestPlan.children[i].teststeps[j].integrationProfileId != null){
                        $rootScope.selectedTestPlan.children[i].teststeps[j].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalAutoTestStepConfigId;  });
                        $rootScope.selectedTestPlan.children[i].teststeps[j].testStoryConfigId = $rootScope.selectedTestPlan.globalAutoTestStepConfigId;
                    }
                }
            }
        }
    };
    $scope.updateGlobalAutoTestStoryConfigForTestStepInsideGroup = function (group) {
        for(i in group.children){
            if(group.children[i].type == 'testcasegroup'){
                $scope.updateGlobalAutoTestStoryConfigForTestStepInsideGroup(group.children[i]);
            }else if(group.children[i].type == 'testcase'){
                for(j in group.children[i].teststeps){
                    if(group.children[i].teststeps[j].integrationProfileId != null){
                        group.children[i].teststeps[j].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalAutoTestStepConfigId;  });
                        group.children[i].teststeps[j].testStoryConfigId = $rootScope.selectedTestPlan.globalAutoTestStepConfigId;
                    }
                }
            }
        }
    };
    $scope.updateTestStoryConfigForTestGroup = function () {
        $rootScope.selectedTestCaseGroup.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestCaseGroup.testStoryConfigId;  });
    };
    $scope.updateTestStoryConfigForTestCase = function () {
        $rootScope.selectedTestCase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestCase.testStoryConfigId;  });
    };
    $scope.updateTestStoryConfigForTestStep = function () {
        $rootScope.selectedTestStep.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestStep.testStoryConfigId;  });
    };
    $scope.openDialogForNewTestPlan = function (ev){
        $mdDialog.show({
            controller: $scope.TestPlanCreationModalCtrl,
            templateUrl: 'TestPlanCreationModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function() {
            $scope.loadTestPlans();
        }, function() {
        });
    };
    $scope.openDialogForImportTestPlan = function (ev){
        $mdDialog.show({
            controller: $scope.TestPlanImportModalCtrl,
            templateUrl: 'TestPlanImportModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function() {
            $scope.loadTestPlans();
            $rootScope.loadProfiles();
        }, function() {
        });
    };
    $scope.TestPlanCreationModalCtrl = function($scope,$mdDialog,$http) {
        $scope.needHelp = false;
        $scope.newTestPlan = {};
        $scope.newTestPlan.accountId = userInfoService.getAccountID();
        $scope.newTestPlan.type = 'DataInstance';
        $scope.newTestPlan.longId = Math.random() * 1000000000;
        $scope.privateProfiles = $rootScope.privateProfiles;
        $scope.publicProfiles = $rootScope.publicProfiles;


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
        }

        $scope.createNewTestPlan = function() {
            var changes = angular.toJson([]);
            var data = angular.fromJson({"changes": changes, "tp": $scope.newTestPlan});
            $http.post('api/testplans/save', data).then(function (response) {
                var saveResponse = angular.fromJson(response.data);
                $rootScope.isChanged=false;


            }, function (error) {
            });
            $mdDialog.hide();
        };

        $scope.cancel = function() {
            $mdDialog.hide();
        };
    };
    $scope.TestPlanImportModalCtrl = function($scope,$mdDialog,$http) {
        $scope.needHelp = false;
        $scope.jsonFilesData = {};
        $scope.type = 'old';


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
            var importTestPlanButton = $("#importTestPlanButton");
            if($scope.jsonFilesData.jsonTestPlanFileStr != null){
                importTestPlanButton.prop('disabled', false);
            }

        };

        $scope.validateForTestPlanJSONFile = function(files) {
            var f = document.getElementById('testplanJSONFile').files[0];
            var reader = new FileReader();
            reader.onloadend = function(e) {
                $scope.jsonFilesData.jsonTestPlanFileStr = reader.result;
                var errorElm = $("#errorMessageForJSONTestPlan");
                errorElm.empty();
                errorElm.append('<span>' + files[0].name + ' is loaded!</span>');
                $scope.checkLoadAll();
            };
            reader.readAsText(f);
        };

        $scope.importTestPlanJson = function() {
            var importTestPlanButton = $("#importTestPlanButton");
            importTestPlanButton.prop('disabled', true);

            if($scope.type == 'new'){
                $http.post('api/testplans/importJSON', $scope.jsonFilesData).then(function (response) {
                    $mdDialog.hide();
                }, function () {
                });
            }else{
                $http.post('api/testplans/importOldJSON', $scope.jsonFilesData).then(function (response) {
                    $mdDialog.hide();
                }, function () {
                });
            }

        };

    };
    $scope.incrementToc=function(){
        $rootScope.tocHeigh=$rootScope.tocHeigh+50;
    };
    $scope.decrementToc=function(){
        if($rootScope.tocHeigh>50){
            $rootScope.tocHeigh=$rootScope.tocHeigh-50;
        }else{
            $rootScope.tocHeigh=$rootScope.tocHeigh;
        }
    };
    $scope.incrementTemplate=function(){
        $rootScope.templateHeigh=$rootScope.templateHeigh+50;
    };
    $scope.decrementTemplate=function(){
        if($rootScope.templateHeigh>50){
            $rootScope.templateHeigh=$rootScope.templateHeigh-50;
        }else{
            $rootScope.templateHeigh=$rootScope.templateHeigh;
        }
    };
    $scope.exportTestPackageHTML = function (tp) {
        var changes = angular.toJson([]);
        var data = angular.fromJson({"changes": changes, "tp": tp});
        $http.post('api/testplans/save', data).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            $rootScope.selectedTestPlan.lastUpdateDate = saveResponse.date;
            $rootScope.saved = true;
            var form = document.createElement("form");
            form.action = 'api/testplans/' + tp.id + '/exportTestPackageHTML/';
            form.method = "POST";
            form.target = "_target";
            var csrfInput = document.createElement("input");
            csrfInput.name = "X-XSRF-TOKEN";
            csrfInput.value = $cookies['XSRF-TOKEN'];
            form.appendChild(csrfInput);
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();

        }, function (error) {
            $rootScope.saved = false;
        });
    };
    $scope.exportResourceBundleZip = function (tp) {
        waitingDialog.show('Creating resource bundle...', {dialogSize: 'xs', progressType: 'info'});
        var changes = angular.toJson([]);
        var data = angular.fromJson({"changes": changes, "tp": tp});
        $http.post('api/testplans/save', data).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            tp.lastUpdateDate = saveResponse.date;
            $rootScope.saved = true;
            var form = document.createElement("form");
            form.action = 'api/testplans/' + tp.id + '/exportRBZip/';
            form.method = "POST";
            form.target = "_target";
            var csrfInput = document.createElement("input");
            csrfInput.name = "X-XSRF-TOKEN";
            csrfInput.value = $cookies['XSRF-TOKEN'];
            form.appendChild(csrfInput);
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();
            waitingDialog.hide();
        }, function (error) {
            $rootScope.saved = false;
            waitingDialog.hide();
        });
    };
    $scope.debug= function(node){
        console.log("DEBUGGING");
        console.log(node);
    };
    $scope.copyTestPlan = function(tp) {
        $http.post('api/testplans/' + tp.id + '/copy').then(function (response) {
            $rootScope.msg().text = "testplanCopySuccess";
            $rootScope.msg().type = "success";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;
            $scope.loadTestPlans();
        }, function (error) {
            $scope.error = error;
            $rootScope.msg().text = "testplanCopyFailed";
            $rootScope.msg().type = "danger";
            $rootScope.msg().show = true;
        });
    };
    $scope.exportTestPlanJson = function (tp) {
        var form = document.createElement("form");
        form.action = 'api/testplans/' + tp.id + '/exportJson/';
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
    $scope.exportCoverHTML = function (tp) {
        var changes = angular.toJson([]);
        var data = angular.fromJson({"changes": changes, "tp": tp});
        $http.post('api/testplans/save', data).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            tp.lastUpdateDate = saveResponse.date;
            $rootScope.saved = true;

            var form = document.createElement("form");
            form.action = "api/testplans/" + tp.id + "/exportCover/";
            form.method = "POST";
            form.target = "_target";
            var csrfInput = document.createElement("input");
            csrfInput.name = "X-XSRF-TOKEN";
            csrfInput.value = $cookies['XSRF-TOKEN'];
            form.appendChild(csrfInput);
            form.style.display = 'none';
            document.body.appendChild(form);
            form.submit();
        }, function (error) {
            $rootScope.saved = false;
        });
    };
    $scope.exportProfileXMLs = function (tp) {
        var form = document.createElement("form");
        form.action = 'api/testplans/' + tp.id + '/exportProfileXMLs/';
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
    $scope.downloadProfileXML = function () {
        var form = document.createElement("form");
        form.action = 'api/profiles/downloadProfileXML/' + $rootScope.selectedProfile.id;
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
    $scope.downloadConstraintXML = function () {
        var form = document.createElement("form");
        form.action = 'api/profiles/downloadConstraintXML/' + $rootScope.selectedProfile.id;
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
    $scope.downloadValueSetXML = function () {
        var form = document.createElement("form");
        form.action = 'api/profiles/downloadValueSetXML/' + $rootScope.selectedProfile.id;
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
    $scope.loadTestPlans = function () {
        var delay = $q.defer();
        $scope.error = null;
        $rootScope.tps = [];

        if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
            $http.get('api/testplans/getListTestPlanAbstract').then(function (response) {
                $rootScope.tps = angular.fromJson(response.data);
                $rootScope.isChanged=false;
                delay.resolve(true);
            }, function (error) {
                $scope.error = error.data;
                delay.reject(false);
            });
        } else {
            delay.reject(false);
        }
        return delay.promise;
    };
    $scope.loadTemplate = function () {
        var delay = $q.defer();

        if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
            $scope.error = null;
            $rootScope.templatesToc = [];
            $rootScope.template = {};
            $http.get('api/template').then(function(response) {
                $rootScope.template = angular.fromJson(response.data);
                $rootScope.templatesToc.push($rootScope.template);
                delay.resolve(true);
            }, function(error) {
                $scope.error = error.data;
                delay.reject(false);

            });
        } else{
            delay.reject(false);
        }
    };
    $scope.applyConformanceProfile = function (igid, mid) {
        waitingDialog.show('Apply Message Profile...', {dialogSize: 'xs', progressType: 'info'});
        $rootScope.selectedTestStep.integrationProfileId = igid;
        $rootScope.selectedTestStep.conformanceProfileId = mid;
        waitingDialog.hide();
    };
    $scope.initTestPlans = function () {
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
        if(!$rootScope.profiles || $rootScope.profiles == [] ) $rootScope.loadProfiles();
        $scope.loadTestPlans();
        $scope.loadTemplate();
        $scope.getScrollbarWidth();
        $scope.loadTestStoryConfigs();
        $scope.loadPreference();
    };
    $scope.loadPreference=function () {
        PreferenceService.find().then(function (response) {
            $rootScope.preference=response.data;
        });
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
    $scope.segmentTemplateApplicable= function(temp){
        if($rootScope.selectedTestStep){
            if($rootScope.selectedSegmentNode){
                if($rootScope.selectedSegmentNode.segmentStr){
                    if(temp.segmentName === $rootScope.selectedSegmentNode.segmentName) return true;
                }
            }
        }
        return false;
    };
    $scope.messageTemplateApplicable=function(er7Tmp){
        if($rootScope.selectedTestStep){
            var cpMeta = $rootScope.findConformanceProfileMeta($rootScope.selectedTestStep.integrationProfileId, $rootScope.selectedTestStep.conformanceProfileId);
            if(cpMeta){
                return cpMeta.structId === er7Tmp.structID;
            }
        }
        return false;
    };

    $scope.handleTestStepType = function () {
        if($rootScope.selectedTestStep.type.includes('MANUAL')) {
            $rootScope.selectedTestStep.integrationProfileId = null;
            $rootScope.selectedTestStep.conformanceProfileId = null;
            $rootScope.selectedTestStep.profileIds = null;
        }
    }
    $scope.isNotManualTestStep = function(){
        if($rootScope.selectedTestStep == null || $rootScope.selectedTestStep.type.includes('MANUAL')) {
            return false;
        }
        return true;
    };

    $scope.getIntegrationProfileName = function(){
        if($rootScope.selectedTestStep.integrationProfileId){
            for(var ip of $rootScope.integrationAbstractProfiles){
                if(ip.id === $rootScope.selectedTestStep.integrationProfileId){
                    return ip.integrationProfileMetaData.name;
                }
            }
        }
        return null;
    };

    $scope.assignProfile = function() {
        if($rootScope.selectedTestStep.profileIds){
            var res = $rootScope.selectedTestStep.profileIds.split("@");
            if(res.length == 2) {
                $rootScope.selectedTestStep.integrationProfileId = res[1];
                $rootScope.selectedTestStep.conformanceProfileId = res[0];
            }
        }
    };

    $scope.hasValidEr7Message = function(){
        if($rootScope.selectedTestStep !== null && $rootScope.selectedTestStep.er7Message && $rootScope.selectedTestStep.er7Message.startsWith('MSH'))
            return true;
        return false;
    };
    $scope.confirmDeleteTestPlan = function (testplan) {
        var modalInstance = $modal.open({
            templateUrl: 'ConfirmTestPlanDeleteCtrl.html',
            controller: 'ConfirmTestPlanDeleteCtrl',
            resolve: {
                testplanToDelete: function () {
                    return testplan;
                }
            }
        });
        modalInstance.result.then(function (testplan) {
            $scope.testplanToDelete = testplan;
            var idxP = _.findIndex($rootScope.tps, function (child) {
                return child.id === testplan.id;
            });
            $rootScope.tps.splice(idxP, 1);
        });
    };
    $scope.confirmUnsavedTestPlanAndTemplate = function () {
        if($rootScope.isChanged) {
            var modalInstance = $modal.open({
                templateUrl: 'ConfirmUnsavedTestPlan.html',
                controller: 'ConfirmUnsavedTestPlan',
                resolve: {
                    testplanToDelete: function () {}
                }
            });
            modalInstance.result.then(function () {
                $scope.closeTestPlanEdit();
            });
        }else {
            $scope.closeTestPlanEdit();
        }

    };
    $scope.showValidationInfo = function () {
        var modalInstance = $modal.open({
            templateUrl: 'validationInfo.html',
            controller: 'validationInfoController',
            size: 'lg',
            windowClass: 'my-modal-popup'
        });
        modalInstance.result.then(function () {

        });
    };
    $scope.pushRB = function (testplan,mode) {
        $mdDialog.show({
            templateUrl: 'exportGVT.html',
            controller: 'loginTestingTool',
            locals: {
                testplan:testplan

            }
        });
    };
    $scope.showReport = function () {
        var modalInstance = $modal.open({
            templateUrl: 'reportResult.html',
            controller: 'reportController',
            size: 'lg',
            windowClass: 'my-modal-popup',
            resolve: {
                report: function () {
                    return $scope.report;
                }
            }
        });
        modalInstance.result.then(function () {

        });
    };
    $scope.openCreateMessageTemplateModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'MessageTemplateCreationModal.html',
            controller: 'MessageTemplateCreationModalCtrl',
            size: 'md',
            resolve: {
            }
        });
        modalInstance.result.then(function() {
            $scope.recordChanged();
        });
    };

    $scope.openOrderIndifferentTab = function(){
        var newOIPattern = {};
        newOIPattern.selectedSegments = [];

        for(var i in $rootScope.segmentList){
            if($rootScope.segmentList[i].isSelected) {
                $rootScope.segmentList[i].isSelected = false;
                var copy = angular.copy($rootScope.segmentList[i]);
                copy.iPath = $scope.replaceDot2Dash(copy.iPath);
                newOIPattern.selectedSegments.push(copy);
            }
        }

        if(newOIPattern.selectedSegments.length > 0) {
            var keys = newOIPattern.selectedSegments[0].iPath.split("-");
            for(var i in newOIPattern.selectedSegments){
                var newKey = "";
                var path = ""
                for(var j in keys){
                    path = path + "-" + keys[j];

                    if(newOIPattern.selectedSegments[i].iPath.startsWith(path.substring(1))) {
                        newKey = path.substring(1);
                    }
                }

                keys = newKey.split("-");
            }


            if(keys[0] !== ""){
                newOIPattern.keys = keys;

                newOIPattern.keyString = newOIPattern.keys.join();
                newOIPattern.keyString = $scope.replaceAll(newOIPattern.keyString, "," , ".");

                var constraintParams = {};
                constraintParams.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
                constraintParams.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
                constraintParams.er7Message = $rootScope.selectedTestStep.er7Message;
                constraintParams.testDataCategorizationMap = $rootScope.selectedTestStep.testDataCategorizationMap;
                $http.post('api/teststep/getConstraintsData', constraintParams).then(function (response) {
                    var constraintSupplementData = angular.fromJson(response.data);
                    var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){return i;});

                    newOIPattern.listOfTDC = [];

                    keys.forEach(function(key){
                        var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];
                        var usagePath = constraintSupplementData.categorizationsUsageMap[key];
                        if(testDataCategorizationObj != undefined && testDataCategorizationObj != null && usagePath){
                            if(testDataCategorizationObj.testDataCategorization && testDataCategorizationObj.testDataCategorization !== ''){
                                var cate = {};
                                cate.iPath = testDataCategorizationObj.iPath;
                                cate.name = testDataCategorizationObj.name;
                                cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
                                cate.listData = testDataCategorizationObj.listData;
                                cate.data = constraintSupplementData.categorizationsDataMap[key];
                                cate.usagePath = usagePath;
                                cate.constraints = [];
                                var usageCheck = true;
                                var usages = cate.usagePath.split("-");
                                for(var i=0; i < usages.length; i++){
                                    var u = usages[i];
                                    if(u !== "R") {
                                        usageCheck = false;
                                    }
                                }
                                if(cate.testDataCategorization == 'NonPresence'){
                                    cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL NOT be presented.');
                                }else if(cate.testDataCategorization == 'Presence-Content Indifferent' ||
                                    cate.testDataCategorization == 'Presence-Configuration' ||
                                    cate.testDataCategorization == 'Presence-System Generated' ||
                                    cate.testDataCategorization == 'Presence-Test Case Proper'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                }else if(cate.testDataCategorization == 'Presence Length-Content Indifferent' ||
                                    cate.testDataCategorization == 'Presence Length-Configuration' ||
                                    cate.testDataCategorization == 'Presence Length-System Generated' ||
                                    cate.testDataCategorization == 'Presence Length-Test Case Proper'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                    cate.constraints.push('Length of ' + cate.iPath + ' (' + cate.name + ') SHALL be more than '+ cate.data.length);
                                }else if(cate.testDataCategorization == 'Value-Test Case Fixed'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                    cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be '+ cate.data);
                                }else if(cate.testDataCategorization == 'Value-Test Case Fixed List'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                    cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be one of '+ cate.listData);
                                }

                                if(cate.iPath.startsWith(newOIPattern.keyString)) newOIPattern.listOfTDC.push(cate);


                            }
                        }
                    });

                    newOIPattern.isOpen = true;
                    $rootScope.orderIndifferentConstraintsPatterns.push(newOIPattern);
                    $scope.testDataAccordi.segmentList = false;
                    $scope.testDataAccordi.selectedSegment = false;
                    $scope.testDataAccordi.constraintList = false;
                    $scope.testDataAccordi.constraintEditorTab = true;
                    waitingDialog.hide();
                }, function (error) {
                    waitingDialog.hide();
                });

            }


        }

    };

    $scope.openApplyMessageTemplate = function(msgTemp) {
        var modalInstance = $modal.open({
            templateUrl: 'OpenApplyMessageTemplate.html',
            controller: 'OpenApplyMessageTemplate',
            size: 'md',
            resolve: {
                messageTemp: function(){
                    return msgTemp;
                }
            }
        });
        modalInstance.result.then(function(option) {
            if(option==="Apply"){
                $scope.applyMessageTemplate(msgTemp);
            }else if(option==="Override") {
                $scope.overwriteMessageTemplate(msgTemp);
            }
            $scope.recordChanged();
        });
    };
    $scope.openApplySegmentTemplate = function(temp) {
        var modalInstance = $modal.open({
            templateUrl: 'OpenApplySegmentTemplate.html',
            controller: 'OpenApplySegmentTemplate',
            size: 'md',
            resolve: {
                segTemplate:function(){
                    return temp;
                }
            }
        });
        modalInstance.result.then(function(option) {
            if(option==="Apply"){
                $scope.applySegmentTemplate(temp);
            }else if(option==="Override"){
                $scope.overwriteSegmentTemplate(temp);
            }
            $scope.recordChanged();
        });
    };
    $scope.openCreateSegmentTemplateModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'SegmentTemplateCreationModal.html',
            controller: 'SegmentTemplateCreationModalCtrl',
            size: 'md',
            resolve: {
            }
        });
        modalInstance.result.then(function() {
            $scope.recordChanged();
        });
    };
    $scope.openCreateEr7SegmentTemplateModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'Er7SegmentTemplateCreationModal.html',
            controller: 'Er7SegmentTemplateCreationModalCtrl',
            size: 'md',
            resolve: {
            }
        });
        modalInstance.result.then(function() {
            $scope.recordChanged();
        });
    };
    $scope.openCreateEr7TemplateModal = function() {
        var modalInstance = $modal.open({
            templateUrl: 'Er7TemplateCreationModal.html',
            controller: 'Er7TemplateCreationModalCtrl',
            size: 'md',
            resolve: {
            }
        });
        modalInstance.result.then(function() {
            $scope.recordChanged();
        });
    };
    $scope.createNewTestPlan = function () {
        var newTestPlan = {
            id: new ObjectId().toString(),
            name: 'New TestPlan',
            accountId : userInfoService.getAccountID()
        };
        $scope.changesMap[newTestPlan.id]=false;
        var changes = angular.toJson([]);
        var data = angular.fromJson({"changes": changes, "tp": newTestPlan});
        $http.post('api/testplans/save', data).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            newTestPlan.lastUpdateDate = saveResponse.date;
            $rootScope.saved = true;


        }, function (error) {
            $rootScope.saved = false;
        });
        $rootScope.tps.push(newTestPlan);
        $scope.selectTestPlan(newTestPlan);
    };
    $scope.initCodemirror = function () {
        if($scope.editor == null){
            var elm = document.getElementById("er7-textarea");
            if(elm){
                $scope.editor = CodeMirror.fromTextArea(document.getElementById("er7-textarea"), {
                    mode: "javascript",
                    autoRefresh: true,
                    lineNumbers: true,
                    fixedGutter: true,
                    theme: "elegant",
                    readOnly: false,
                    showCursorWhenSelecting: true
                });
                $scope.editor.setSize("100%", $rootScope.templateHeigh+$rootScope.tocHeigh);
                $scope.editor.refresh();
                $scope.editor.on("change", function () {
                    $scope.updateEr7Message($scope.editor.getValue());
                });
            }
        }
    };
    $scope.updateEr7Message = function (m) {
        $rootScope.selectedTestStep.er7Message = m;
        $scope.recordChanged($rootScope.selectedTestStep);
    };
    $scope.initCodemirrorOnline = function () {
        if($scope.editorValidation == null){
            var elm = document.getElementById("er7-textarea-validation");

            if(elm){
                $scope.editorValidation = CodeMirror.fromTextArea(document.getElementById("er7-textarea-validation"), {
                    lineNumbers: true,
                    fixedGutter: true,
                    theme: "elegant",
                    readOnly: false,
                    showCursorWhenSelecting: true
                });
                $scope.editorValidation.setSize("100%", $rootScope.templateHeigh+$rootScope.tocHeigh);
                $scope.editorValidation.refresh();

                $scope.editorValidation.on("change", function () {
                    $scope.er7MessageOnlineValidation = $scope.editorValidation.getValue();
                });
            }
        }
    };
    $scope.closeTestPlanEdit = function () {
        $scope.loadTestPlans();
        $rootScope.selectedTestPlan = null;
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTemplate=null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.isChanged = false;
        $scope.selectTPTab(0);
    };
    $scope.updateCurrentTitle = function (type, name){
        $rootScope.CurrentTitle = type + ": " + name;
    };
    $scope.updateListOfIntegrationAbstractProfiles = function (){
        $rootScope.integrationAbstractProfiles = [];
        if($rootScope.selectedTestPlan.listOfIntegrationProfileIds == null || $rootScope.selectedTestPlan.listOfIntegrationProfileIds.length == 0){
            for(var i in $rootScope.privateProfiles){
                $rootScope.integrationAbstractProfiles.push($rootScope.privateProfiles[i]);
            }
            for(var i in $rootScope.publicProfiles){
                $rootScope.integrationAbstractProfiles.push($rootScope.publicProfiles[i]);
            }
        }else {
            for(var j in $rootScope.selectedTestPlan.listOfIntegrationProfileIds){
                for(var i in $rootScope.privateProfiles){
                    if($rootScope.privateProfiles[i].id == $rootScope.selectedTestPlan.listOfIntegrationProfileIds[j]){
                        $rootScope.integrationAbstractProfiles.push($rootScope.privateProfiles[i]);
                    }
                }
                for(var i in $rootScope.publicProfiles){
                    if($rootScope.publicProfiles[i].id == $rootScope.selectedTestPlan.listOfIntegrationProfileIds[j]){
                        $rootScope.integrationAbstractProfiles.push($rootScope.publicProfiles[i]);
                    }
                }
            }
        }
    };
    $scope.selectTestPlan = function (testplanAbstract) {
        $rootScope.isChanged=false;
        if (testplanAbstract != null) {
            waitingDialog.show('Opening Test Plan...', {dialogSize: 'xs', progressType: 'info'});
            $scope.selectTPTab(1);
            $http.get('api/testplans/' + testplanAbstract.id).then(function (response) {
                $rootScope.selectedTestPlan = angular.fromJson(response.data);
                $rootScope.testplans = [];
                $rootScope.testplans.push($rootScope.selectedTestPlan);
                $rootScope.CpIds=angular.copy(JSON.stringify($rootScope.selectedTestPlan.listOfIntegrationProfileIds));
                $scope.updateListOfIntegrationAbstractProfiles();
                $timeout(function () {
                    $scope.updateCurrentTitle("Test Plan", $rootScope.selectedTestPlan.name);
                }, 0);
                $timeout(function () {
                    $rootScope.selectedTemplate=null;
                    $rootScope.selectedSegmentNode =null;
                    $rootScope.selectedTestStep=null;
                    $rootScope.selectedTestCaseGroup = null;
                    $rootScope.selectedTestCase = null;
                    $scope.editor = null;
                    $scope.editorValidation = null;
                    if($rootScope.selectedTestPlan.testStoryConfigId){
                        $rootScope.selectedTestPlan.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.testStoryConfigId; });
                    }else {
                        $rootScope.selectedTestPlan.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                    }
                    for(i in $rootScope.selectedTestPlan.children){
                        if($rootScope.selectedTestPlan.children[i].type == 'testcasegroup'){
                            $scope.updateTestGroupTestStoryConfig($rootScope.selectedTestPlan.children[i]);
                        }else if ($rootScope.selectedTestPlan.children[i].type == 'testcase'){
                            $scope.updateTestCaseTestStoryConfig($rootScope.selectedTestPlan.children[i]);
                        }
                    }
                    waitingDialog.hide();
                    $scope.subview = "EditTestPlanMetadata.html";
                    $rootScope.isChanged=false;
                }, 100);
            }, function (error) {
                $scope.error = error.data;
                waitingDialog.hide();
            });
        }
    };
    $scope.print = function (x) {
        console.log(JSON.stringify(x));
    };

    $scope.printTestStep = function(){
        console.log($rootScope.selectedTestPlan);
        console.log($rootScope.selectedTestCaseGroup);
        console.log($rootScope.selectedTestCase);
        console.log($rootScope.selectedTestStep);
    };

    $scope.editTestPlan = function (testplan) {
        waitingDialog.show('Opening Test Plan...', {dialogSize: 'xs', progressType: 'info'});
        $rootScope.selectedTestPlan = testplan;
        $timeout(function () {
            $scope.updateCurrentTitle("Test Plan", $rootScope.selectedTestPlan.name);
            $scope.subview = "EditTestPlanMetadata.html";
        }, 0);
        $timeout(function () {
            $rootScope.selectedTemplate=null;
            $rootScope.selectedSegmentNode =null;
            $rootScope.selectedTestStep=null;
            $rootScope.selectedTestCaseGroup = null;
            $rootScope.selectedTestCase = null;
            $scope.editor = null;
            $scope.editorValidation = null;
            waitingDialog.hide();
        }, 100);
    };
    $scope.updateTestGroupTestStoryConfig = function (group) {
        if(group.testStoryConfigId){
            group.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == group.testStoryConfigId; });
        }else if($rootScope.selectedTestPlan.globalTestGroupConfigId){
            group.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestGroupConfigId;  });
            group.testStoryConfigId = $rootScope.selectedTestPlan.globalTestGroupConfigId;
        }else {
            group.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
            group.testStoryConfigId = group.testStoryConfig.id;
        }

        for(i in group.children){
            if(group.children[i].type == 'testcasegroup'){
                $scope.updateTestGroupTestStoryConfig(group.children[i]);
            }else if (group.children[i].type == 'testcase'){
                $scope.updateTestCaseTestStoryConfig(group.children[i]);
            }
        }
    };
    $scope.updateTestCaseTestStoryConfig = function (testcase){
        if(testcase.testStoryConfigId){
            testcase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == testcase.testStoryConfigId; });
        }else if($rootScope.selectedTestPlan.globalTestCaseConfigId){
            testcase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestCaseConfigId;  });
            testcase.testStoryConfigId = $rootScope.selectedTestPlan.globalTestCaseConfigId;
        }else {
            testcase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
            testcase.testStoryConfigId = testcase.testStoryConfig.id;
        }

        for(k in testcase.teststeps){
            if(testcase.teststeps[k].testStoryConfigId){
                testcase.teststeps[k].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == testcase.teststeps[k].testStoryConfigId; });
            }else {
                if(testcase.teststeps[k].integrationProfileId == null){
                    if($rootScope.selectedTestPlan.globalManualTestStepConfigId){
                        testcase.teststeps[k].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalManualTestStepConfigId;  });
                        testcase.teststeps[k].testStoryConfigId = $rootScope.selectedTestPlan.globalManualTestStepConfigId;
                    }else {
                        testcase.teststeps[k].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                        testcase.teststeps[k].testStoryConfigId = testcase.teststeps[k].testStoryConfig.id;
                    }
                }else {
                    if($rootScope.selectedTestPlan.globalAutoTestStepConfigId){
                        testcase.teststeps[k].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalAutoTestStepConfigId;  });
                        testcase.teststeps[k].testStoryConfigId = $rootScope.selectedTestPlan.globalAutoTestStepConfigId;
                    }else {
                        testcase.teststeps[k].testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                        testcase.teststeps[k].testStoryConfigId = testcase.teststeps[k].testStoryConfig.id;
                    }
                }
            }
        }
    };
    $scope.openProfileMetadata= function(p){
        $rootScope.CurrentTitle="Profile "+":"+ p.integrationProfileMetaData.name;
        $rootScope.selectedTemplate=null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTestStep=null;
        $rootScope.selectedProfile = p;
        $scope.editor = null;
        $scope.editorValidation = null;
        $scope.subview = "ViewIntegrationProfile.html";
    };
    $scope.selectTestCaseGroup = function (testCaseGroup) {
        if (testCaseGroup != null) {
            waitingDialog.show('Opening Test Group...', {dialogSize: 'xs', progressType: 'info'});
            $timeout(function () {
                $rootScope.selectedTestCaseGroup = testCaseGroup;
                $scope.updateCurrentTitle("Test Group", $rootScope.selectedTestCaseGroup.name);
                $scope.subview = "EditTestCaseGroupMetadata.html";
            }, 0);
            $timeout(function() {
                $rootScope.selectedTestStep=null;
                $rootScope.selectedTestCase = null;
                $rootScope.selectedTemplate=null;
                $rootScope.selectedSegmentNode =null;
                $scope.editor = null;
                $scope.editorValidation = null;

                if($rootScope.selectedTestCaseGroup.testStoryConfigId){
                    $rootScope.selectedTestCaseGroup.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestCaseGroup.testStoryConfigId; });
                }else if($rootScope.selectedTestPlan.globalTestGroupConfigId){
                    $rootScope.selectedTestCaseGroup.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestGroupConfigId;  });
                    $rootScope.selectedTestCaseGroup.testStoryConfigId = $rootScope.selectedTestPlan.globalTestGroupConfigId;
                }else {
                    $rootScope.selectedTestCaseGroup.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                    $rootScope.selectedTestCaseGroup.testStoryConfigId = $rootScope.selectedTestCaseGroup.testStoryConfig.id;
                }
                waitingDialog.hide();
            }, 100);
        }
    };
    $scope.selectTestCase = function (testCase) {
        if (testCase != null) {
            waitingDialog.show('Opening Test Case ...', {dialogSize: 'xs', progressType: 'info'});
            $timeout(function () {
                $rootScope.selectedTestCase = testCase;
                $scope.updateCurrentTitle("Test Case", $rootScope.selectedTestCase.name);
                $scope.subview = "EditTestCaseMetadata.html";
            }, 0);
            $timeout(function () {
                $rootScope.selectedTestStep=null;
                $rootScope.selectedTestCaseGroup=null;
                $rootScope.selectedTemplate=null;
                $rootScope.selectedSegmentNode =null;
                $scope.editor = null;
                $scope.editorValidation = null;
                $scope.selectedTestCaseTab = 0;

                if($rootScope.selectedTestCase.testStoryConfigId){
                    $rootScope.selectedTestCase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestCase.testStoryConfigId; });
                }else if($rootScope.selectedTestPlan.globalTestGroupConfigId){
                    $rootScope.selectedTestCase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalTestGroupConfigId;  });
                    $rootScope.selectedTestCase.testStoryConfigId = $rootScope.selectedTestPlan.globalTestGroupConfigId;
                }else {
                    $rootScope.selectedTestCase.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                    $rootScope.selectedTestCase.testStoryConfigId = $rootScope.selectedTestCase.testStoryConfig.id;
                }

                waitingDialog.hide();
            }, 100);
        }
    };
    $scope.initTestStepTab = function (tabnum){
        $scope.selectedTestStepTab.tabNum = tabnum;
        if(tabnum == 2) {
            $scope.initHL7EncodedMessageTab();
        }else if (tabnum == 3) {
            $scope.initTestData();
        }else if (tabnum == 4) {
            $scope.initHL7EncodedMessageForOnlineValidationTab();
        }else if (tabnum == 5) {
            $scope.genSTDNISTXML($scope.findTestCaseNameOfTestStep());
        }else if (tabnum == 6) {
            $scope.generateSupplementDocuments();
        }
    };
    $scope.selectTestStep = function (testStep) {
        waitingDialog.hide();
        if (testStep != null) {
            waitingDialog.show('Opening Test Step ...', {dialogSize: 'xs', progressType: 'info'});
            $rootScope.selectedTestStep = testStep;
            if($rootScope.selectedTestStep.conformanceProfileId && $rootScope.selectedTestStep.integrationProfileId) {
                $rootScope.selectedTestStep.profileIds = $rootScope.selectedTestStep.conformanceProfileId + '@' + $rootScope.selectedTestStep.integrationProfileId;
            }

            $scope.updateCurrentTitle("Test Step", $rootScope.selectedTestStep.name);

            $rootScope.selectedTestCaseGroup=null;
            $rootScope.selectedTestCase = null;
            $rootScope.selectedTemplate=null;
            $rootScope.selectedSegmentNode =null;
            $rootScope.orderIndifferentConstraintsPatterns = [];
            $scope.subview = "EditTestStepMetadata.html";
            $scope.selectedTestStepTab.tabNum = 0;
            $scope.initTestStepTab($scope.selectedTestStepTab.tabNum);

            if($rootScope.selectedTestStep.testStoryConfigId){
                $rootScope.selectedTestStep.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestStep.testStoryConfigId; });
            }else {
                if($rootScope.selectedTestStep.integrationProfileId == null){
                    if($rootScope.selectedTestPlan.globalManualTestStepConfigId){
                        $rootScope.selectedTestStep.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalManualTestStepConfigId;  });
                        $rootScope.selectedTestStep.testStoryConfigId = $rootScope.selectedTestPlan.globalManualTestStepConfigId;
                    }else {
                        $rootScope.selectedTestStep.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                        $rootScope.selectedTestStep.testStoryConfigId = $rootScope.selectedTestStep.testStoryConfig.id;
                    }
                }else {
                    if($rootScope.selectedTestPlan.globalAutoTestStepConfigId){
                        $rootScope.selectedTestStep.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.id == $rootScope.selectedTestPlan.globalAutoTestStepConfigId;  });
                        $rootScope.selectedTestStep.testStoryConfigId = $rootScope.selectedTestPlan.globalAutoTestStepConfigId;
                    }else {
                        $rootScope.selectedTestStep.testStoryConfig = _.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; });
                        $rootScope.selectedTestStep.testStoryConfigId = $rootScope.selectedTestStep.testStoryConfig.id;
                    }
                }
            }
            waitingDialog.hide();
        }
    };
    $scope.selectTPTab = function (value) {
        if (value === 1) {
            $scope.accordi.tpList = false;
            $scope.accordi.tpDetails = true;
        } else {
            $scope.accordi.tpList = true;
            $scope.accordi.tpDetails = false;
        }
    };
    $scope.recordChanged = function (obj) {
        if(obj){
            $rootScope.isChanged = true;

            $rootScope.changesMap[obj.id] = true;
        }
    };
    $rootScope.froalaChange=function (attribute, parent) {
        if(attribute==undefined||attribute==null||attribute===""){

        }else{

            $rootScope.isChanged = true;
            $rootScope.changesMap[parent.id] = true;
        }
    };
    $scope.recordChangeForGroup = function (ids,obj) {
        var changed=angular.copy(JSON.stringify(ids));
        if(ids&&changed!==$rootScope.CpIds){
            $rootScope.isChanged = true;
            $rootScope.changesMap[obj.id] = true;
        }
    };
    $scope.updateTransport = function () {
        if($rootScope.selectedTestPlan.type == 'DataInstance'){
            $rootScope.selectedTestPlan.transport = false;
        }else {
            $rootScope.selectedTestPlan.transport = true;
        }
    };
    $scope.saveTestPlanAndTemplates = function() {
        var changes = angular.toJson([]);
        var data = angular.fromJson({"changes": changes, "tp": $rootScope.selectedTestPlan});
        $http.post('api/testplans/save', data).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            $http.post('api/template/save', $rootScope.template).then(function (response) {
                $rootScope.changesMap={};
                $rootScope.isChanged = false;
                $rootScope.saved = true;
                Notification.success({message:"Test Plan and Templates Saved", delay: 1000});
            }, function (error) {
                $rootScope.saved = false;
                Notification.error({message:"Error Templates Saving", delay:1000});
            });

        }, function (error) {
            $rootScope.saved = false;
            Notification.error({message:"Error Saving", delay:1000});

        });
    };

    //TODO CHECK!!!
    $scope.addRepeatedSegment = function (position){
        var repeatedNode = $scope.nodeList[position];
        var instanceNum = Number(repeatedNode.iPath.substring(repeatedNode.iPath.lastIndexOf("[") + 1, repeatedNode.iPath.lastIndexOf("]"))) + 1;
        var newiPath = repeatedNode.iPath.substring(0 , repeatedNode.iPath.lastIndexOf("[")) + "[" + instanceNum + "]";
        var newPositioniPath = repeatedNode.positioniPath.substring(0 , repeatedNode.positioniPath.lastIndexOf("[")) + "[" + instanceNum + "]";

        var newNode = {
            key: repeatedNode.key,
            repeatable:  repeatedNode.repeatable,
            type: 'segment',
            path: repeatedNode.path,
            iPath: newiPath,
            positionPath: repeatedNode.positionPath,
            positioniPath: newPositioniPath,
            usagePath: repeatedNode.usagePath,
            obj : repeatedNode.obj,
            anchor : false
        };

        var result = [];
        for(var i = 0; i < $scope.nodeList.length; i++){
            result.push($scope.nodeList[i]);
            if(i === position) result.push(newNode);
        }
        $scope.nodeList = result;
    };

    $scope.initHL7EncodedMessageTab = function () {
        $scope.initCodemirror();
        if($scope.editor){
            setTimeout(function () {
                if($rootScope.selectedTestStep.er7Message == null){
                    $scope.editor.setValue("");
                }else {
                    $scope.editor.setValue($rootScope.selectedTestStep.er7Message);
                }
            }, 100);

            setTimeout(function () {
                $scope.editor.refresh();
            }, 200);
        }
    };
    $scope.initHL7EncodedMessageForOnlineValidationTab = function (){
        $scope.contextValidation=false;

        $scope.initCodemirrorOnline();
        if($scope.editorValidation){
            setTimeout(function () {
                $scope.result="";
                if($rootScope.selectedTestStep.er7Message == null){
                    $scope.editorValidation.setValue("");
                    $scope.er7MessageOnlineValidation = '';
                }else {
                    $scope.er7MessageOnlineValidation = $rootScope.selectedTestStep.er7Message;
                    $scope.editorValidation.setValue($scope.er7MessageOnlineValidation);
                }
            }, 100);
            setTimeout(function () {
                $scope.editorValidation.refresh();
            }, 200);
        }
    };
    $scope.initTestData = function () {
        waitingDialog.show(' ER7 HL7 message is being analyzed...', {dialogSize: 'xs', progressType: 'info'});
        $scope.testDataAccordi = {};
        $scope.testDataAccordi.segmentList = true;
        $scope.testDataAccordi.selectedSegment = false;
        $scope.testDataAccordi.constraintList = false;
        $rootScope.selectedSegmentNode = null;
        $rootScope.selectedSegment = null;
        $rootScope.segmentList = [];
        $rootScope.orderIndifferentConstraintsPatterns = [];
        var data = {};
        data.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        data.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        data.er7Message = $rootScope.selectedTestStep.er7Message;
        if(data.er7Message !== undefined && data.er7Message !== null && data.er7Message !== '' && data.er7Message.startsWith('MSH')){
            $http.post('api/teststep/getSegmentList', data).then(function (response) {
                $rootScope.segmentList = angular.fromJson(response.data);
                waitingDialog.hide();
            }, function (error) {
                waitingDialog.hide();
            });
        }else {
            waitingDialog.hide();
        }
    };
    $scope.selectSegment = function (segment) {
        waitingDialog.show('Loading Segment...', {dialogSize: 'xs', progressType: 'info'});
        $scope.testDataAccordi.segmentList = false;
        $scope.testDataAccordi.selectedSegment = true;
        $scope.testDataAccordi.constraintList = false;
        $scope.testDataAccordi.constraintEditorTab = false;

        $rootScope.selectedSegmentNode = {};
        $rootScope.selectedSegment = segment;

        var data = {};
        data.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        data.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        data.iPath = segment.iPath;
        data.iPositionPath = segment.positionIPath;
        data.path = segment.path;
        data.positionPath = segment.positionPath;
        data.lineStr = segment.lineStr;
        data.segmentId = segment.segmentDef.id;
        data.usagePath = segment.usagePath;
        data.testDataCategorizationMap = $rootScope.selectedTestStep.testDataCategorizationMap;
        $http.post('api/teststep/getSegmentNode', data).then(function (response) {
            $rootScope.selectedSegmentNode = angular.fromJson(response.data);
            setTimeout(function () {
                $scope.refreshTree();

                $scope.retrieveTriggerInfoForSpecificNode($rootScope.selectedSegmentNode, $rootScope.selectedTestStep.orderIndifferentInfoMap);
                waitingDialog.hide();
            }, 100);
        }, function (error) {
            aitingDialog.hide();
        });
    };
    $scope.findTestCaseNameOfTestStepInsideGroup = function (group, result){
        for(var i in group.children){
            if(group.children[i].type == "testcasegroup"){
                result = $scope.findTestCaseNameOfTestStepInsideGroup(group.children[i], result);
            }else if(group.children[i].type == "testcase"){
                group.children[i].teststeps.forEach(function(teststep){
                    if(teststep.id == $rootScope.selectedTestStep.id){
                        result = group.children[i].name;
                    }
                });
            }
        }

        return result;
    }
    $scope.findTestCaseNameOfTestStep = function(){
        var result = "NoName";
        $rootScope.selectedTestPlan.children.forEach(function(child) {
            if(child.type == "testcasegroup"){
                result = $scope.findTestCaseNameOfTestStepInsideGroup(child, result);
            }else if(child.type == "testcase"){
                child.teststeps.forEach(function(teststep){
                    if(teststep.id == $rootScope.selectedTestStep.id){
                        result = child.name;
                    }
                });
            }
        });
        return result;
    };
    $scope.generateSupplementDocuments = function () {
        waitingDialog.show('Supplementary documents are being prepared. ...', {dialogSize: 'xs', progressType: 'info'});
        $scope.jurorDocumentsHTML = null;
        $scope.testDataSpecificationHTML = null;
        $scope.messageContentsHTML = null;

        var data = {};
        data.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        data.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        data.er7Message = $rootScope.selectedTestStep.er7Message;
        data.testCaseName = $scope.findTestCaseNameOfTestStep();
        data.tdsXSL = $rootScope.selectedTestStep.tdsXSL;
        data.jdXSL = $rootScope.selectedTestStep.jdXSL;
        data.testDataCategorizationMap = $rootScope.selectedTestStep.testDataCategorizationMap;

        $http.post('api/teststep/getSupplements', data).then(function (response) {
            var result = angular.fromJson(response.data);
            $scope.jurorDocumentsHTML = $sce.trustAsHtml(result.jurorDocument);
            $scope.testDataSpecificationHTML = result.testdataSpecification;
            $scope.messageContentsHTML = result.messageContent;
            waitingDialog.hide();
        }, function (error) {
            waitingDialog.hide();
        });
    };
    $scope.openMessageMetaData = function(msg , ip) {
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.message=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTestStep = null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTemplate = null;
        $rootScope.selectedSegmentNode = null;
        $scope.editor = null;
        $scope.editorValidation = null;

        $rootScope.CurrentTitle="Message Profile:"+ msg.name;
        $rootScope.selectedMessage = msg;

        $scope.subview = "ViewMessageMetaData.html";


    };
    $scope.genSTDNISTXML = function(testcaseName){
        waitingDialog.show('XML documents are being prepared. ...', {dialogSize: 'xs', progressType: 'info'});
        $scope.nistXMLCode = null;
        $scope.stdXMLCode = null;

        var data = {};
        data.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        data.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        data.er7Message = $rootScope.selectedTestStep.er7Message;
        data.testCaseName = testcaseName;

        $http.post('api/teststep/getXMLs', data).then(function (response) {
            var result = angular.fromJson(response.data);

            $scope.nistXMLCode = result.nistXML;
            $scope.stdXMLCode = result.stdXML;

            waitingDialog.hide();
        }, function (error) {
            waitingDialog.hide();
        });
    };
    $scope.segmentListAccordionClicked = function () {
        if ($scope.testDataAccordi.segmentList === false) {
            $scope.testDataAccordi = {};
            $scope.testDataAccordi.selectedSegment = false;
            $scope.testDataAccordi.constraintList = false;
            $scope.testDataAccordi.constraintEditorTab = false;
        }
    };
    $scope.segmentAccordionClicked = function () {
        if ($scope.testDataAccordi.selectedSegment === false) {
            $scope.testDataAccordi = {};
            $scope.testDataAccordi.segmentList = false;
            $scope.testDataAccordi.constraintList = false;
            $scope.testDataAccordi.constraintEditorTab = false;
        }
    };

    $scope.orderIndifferentConstraintsAccordionClicked = function (){
        if(!$scope.testDataAccordi.constraintEditorTab){
            waitingDialog.show('OrderIndifferent reading ...', {dialogSize: 'xs', progressType: 'info'});
            $scope.testDataAccordi = {};
            $scope.testDataAccordi.segmentList = false;
            $scope.testDataAccordi.selectedSegment = false;
            $scope.testDataAccordi.constraintList = false;


            var constraintParams = {};
            constraintParams.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
            constraintParams.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
            constraintParams.er7Message = $rootScope.selectedTestStep.er7Message;
            constraintParams.testDataCategorizationMap = $rootScope.selectedTestStep.testDataCategorizationMap;
            $http.post('api/teststep/getProfileData', constraintParams).then(function (response) {
                $scope.profileData = angular.fromJson(response.data);
                $scope.conformanceProfile = _.find($scope.profileData.integrationProfile.conformanceProfiles, function(cp){
                    return cp.conformanceProfileMetaData.id == $rootScope.selectedTestStep.conformanceProfileId;
                });
                $scope.refreshPropfileTree();
                waitingDialog.hide();
            }, function (error) {
                waitingDialog.hide();
            });
        }

    };


    $scope.print = function (something) {
        console.log(something);
    };

    $scope.comparePaths = function (positionPath, namePath) {

        const positionPathList = positionPath.split('.');
        const namePathList = namePath.split('.');

        for(let i=0; i < positionPathList.length; i++) {
            if(positionPathList[i] === namePathList[i]) return i;
        }

        return positionPathList.length;

    };

    $scope.retrieveValue = function (orderIndifferentInfo, triggerInfo) {
        const key = orderIndifferentInfo.currentIPath + '.' + triggerInfo.namePath.split('.').join('[1].')  + '[1]';
        const testDataCategorization = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(key)];
        if (testDataCategorization
            && testDataCategorization.testDataCategorization
            && testDataCategorization.testDataCategorization === 'Value-Test Case Fixed List'
            && testDataCategorization.listData
            && testDataCategorization.listData.length > 0) {
            return testDataCategorization.listData.join("|")
        } else {
            const seg = $rootScope.segmentList.find(item => key.startsWith(item.iPath));
            let value = seg.lineStr
            const position = $scope.comparePaths(triggerInfo.positionPath, triggerInfo.namePath);
            const fieldPosition = triggerInfo.positionPath.split('.')[position];
            const componentPosition = triggerInfo.positionPath.split('.')[position + 1];
            const subComponentPosition = triggerInfo.positionPath.split('.')[position + 2];

            if(fieldPosition) {
                value = value.split('|')[fieldPosition];
            }
            if(componentPosition) {
                value = value.split('^')[componentPosition-1];
            }
            if(subComponentPosition) {
                value = value.split('&')[subComponentPosition-1];
            }

            return value;
        }

        return 'Not found';
    };

    $scope.retrieveTriggerInfoForSpecificNode = function (selectedSegmentNode, orderIndifferentInfoMap) {
        $scope.retrieveTriggers = [];
        if(selectedSegmentNode && selectedSegmentNode.iPositionPath && selectedSegmentNode.postionPath) {
            const iPathList = selectedSegmentNode.iPath.split('.');
            const iPositionPathList = selectedSegmentNode.iPositionPath.split('.');
            const positionPathList = selectedSegmentNode.postionPath.split('.');
            const pathList = selectedSegmentNode.path.split('.');
            let currentIPath = '';
            let currentIPositionPath = '';
            let currentPositionPath = '';
            let currentPath = '';
            for(let i = 0; i < iPositionPathList.length; i++){
                if(i === 0) {
                    currentIPath = iPathList[0];
                    currentIPositionPath = iPositionPathList[0];
                    currentPositionPath = positionPathList[0];
                    currentPath = pathList[0];
                } else {
                    currentIPath = currentIPath + "." + iPathList[i];
                    currentIPositionPath = currentIPositionPath + "-" + iPositionPathList[i];
                    currentPositionPath = currentPositionPath + "-" + positionPathList[i];
                    currentPath = currentPath + "." + pathList[i];
                }

                let triggerInfo;
                let orderIndifferentInfo = orderIndifferentInfoMap[currentIPositionPath];
                if(orderIndifferentInfo && orderIndifferentInfo.orderSpecific) {
                    triggerInfo = orderIndifferentInfo.triggerInfo;
                    triggerInfo.type = 'local';
                }

                if (!triggerInfo) {
                    orderIndifferentInfo = orderIndifferentInfoMap[currentPositionPath];
                }
                if(orderIndifferentInfo && orderIndifferentInfo.orderSpecific) {
                    triggerInfo = orderIndifferentInfo.triggerInfo;
                }

                if(triggerInfo) {
                    $scope.retrieveTriggers.push({
                        currentIPath : currentIPath,
                        currentIPositionPath : currentIPositionPath,
                        currentPositionPath : currentPositionPath,
                        currentPath : currentPath,
                        triggerInfo : triggerInfo,
                    })
                }
            }
        }
    };

    $scope.checkTriggerError = function (orderIndifferentInfo) {
        if(orderIndifferentInfo){
            const orderIndifferentNodePositionPath = $scope.replaceAll(orderIndifferentInfo.currentPositionPath, "-" , ".");
            let iPath = $scope.replaceAll(orderIndifferentInfo.currentIPositionPath, "-" , ".");
            let iPathModifed = iPath.substring(0, iPath.lastIndexOf('['));
            const relatedSegmentsList = $rootScope.segmentList.filter(seg => seg.positionIPath.startsWith(iPathModifed));
            let triggerKeyValuePaths = orderIndifferentInfo.triggerInfo.list.map(item => {
                return orderIndifferentNodePositionPath + '.' + item.positionPath;
            });
            let target = [];
            let targetKey = '';
            let resultOfCompare = {};
            relatedSegmentsList.forEach(seg => {
                let key = '';
                const size = orderIndifferentInfo.currentPositionPath.split('-').length;

                for(let i=0; i < size; i++) {
                    key = key + '-' + seg.iPath.split('.')[i];
                }
                key = key.substring(1);

                triggerKeyValuePaths = triggerKeyValuePaths.sort();
                triggerKeyValuePaths.forEach(triggerKeyValuePath => {
                    if(triggerKeyValuePath.startsWith(seg.positionPath)) {
                        const valuePathInSeg = triggerKeyValuePath.substring(seg.positionPath.length + 1);
                        let value = seg.lineStr;
                        const fieldPosition = valuePathInSeg.split('.')[0];
                        const componentPosition = valuePathInSeg.split('.')[1];
                        const subComponentPosition = valuePathInSeg.split('.')[2];

                        if(fieldPosition) {
                            value = value.split('|')[fieldPosition];
                        }
                        if(componentPosition) {
                            value = value.split('^')[componentPosition-1];
                        }
                        if(subComponentPosition) {
                            value = value.split('&')[subComponentPosition-1];
                        }

                        if(seg.positionIPath.startsWith(iPath)) {
                            target.push(`${seg.segmentName}-${valuePathInSeg} = ${value}`);
                            targetKey = key;
                        }else{
                            if (!resultOfCompare[key]) resultOfCompare[key] = [];
                            resultOfCompare[key].push(`${seg.segmentName}-${valuePathInSeg} = ${value}`);
                        }
                    }
                });
            });
            let errorList = [];
            const resultKeys = Object.keys(resultOfCompare);
            for (const resultKey of resultKeys) {
                if(resultOfCompare[resultKey].join(' , ') === target.join(' , ')) {
                    errorList.push(resultKey);

                }
            }
            if(errorList.length > 0) return [`This trigger condition is duplicated with ${errorList.join(' , ')}`];
        }
        return [];
    }

    $scope.checkDuplicatedTriggerValue = function (orderIndifferentNode, segmentList) {
        if(orderIndifferentNode){
            const orderIndifferentNodePositionPath = $scope.replaceAll(orderIndifferentNode.positionPath, "-" , ".");
            if(orderIndifferentNode.orderIndifferentInfo && orderIndifferentNode.orderIndifferentInfo.triggerInfo && orderIndifferentNode.orderIndifferentInfo.triggerInfo.list){
                let errorList = [];
                const orderIndifferentNodePositionPathSize = orderIndifferentNodePositionPath.split('.').length;
                const relatedSegmentsList = segmentList.filter(seg => seg.positionPath.startsWith(orderIndifferentNodePositionPath));

                let relatedSegmentsMap = {};
                for(let i = 0; i < relatedSegmentsList.length; i++){

                    const iPath = relatedSegmentsList[i].iPath;
                    let key = '';
                    for(let j = 0; j < orderIndifferentNodePositionPathSize - 1; j++){
                        key = key + '.' + iPath.split('.')[j];
                    }
                    if (key === '') key = 'root';
                    else key = key.substring(1);
                    if (!relatedSegmentsMap[key]) relatedSegmentsMap[key] = [];

                    relatedSegmentsMap[key].push(relatedSegmentsList[i]);
                }

                const keys = Object.keys(relatedSegmentsMap);
                for (const key of keys) {
                    let result = {};
                    const segList = relatedSegmentsMap[key];
                    segList.forEach(seg => {
                        let positionIPath = '';
                        let iPath = '';
                        const size = orderIndifferentNode.positionPath.split('-').length;

                        for(let i=0; i < size; i++) {
                            positionIPath = positionIPath + '-' + seg.positionIPath.split('.')[i];
                            iPath = iPath + '.' + seg.iPath.split('.')[i];
                        }
                        positionIPath = positionIPath.substring(1);
                        iPath = iPath.substring(1);

                        let orderIndifferentInfo = $rootScope.selectedTestStep.orderIndifferentInfoMap[positionIPath];

                        if(!orderIndifferentInfo) {
                            orderIndifferentInfo = orderIndifferentNode.orderIndifferentInfo;
                        }

                        let triggerKeyValuePaths = orderIndifferentInfo.triggerInfo.list.map(item => {
                            return orderIndifferentNodePositionPath + '.' + item.positionPath;
                        });

                        triggerKeyValuePaths = triggerKeyValuePaths.sort();
                        triggerKeyValuePaths.forEach(triggerKeyValuePath => {
                            if(triggerKeyValuePath.startsWith(seg.positionPath)) {
                                const valuePathInSeg = triggerKeyValuePath.substring(seg.positionPath.length + 1);
                                let value = seg.lineStr;
                                const fieldPosition = valuePathInSeg.split('.')[0];
                                const componentPosition = valuePathInSeg.split('.')[1];
                                const subComponentPosition = valuePathInSeg.split('.')[2];

                                if(fieldPosition) {
                                    value = value.split('|')[fieldPosition];
                                }
                                if(componentPosition) {
                                    value = value.split('^')[componentPosition-1];
                                }
                                if(subComponentPosition) {
                                    value = value.split('&')[subComponentPosition-1];
                                }
                                if(!result[iPath]) result[iPath] = [];
                                result[iPath].push(`${seg.segmentName}-${valuePathInSeg} = ${value}`);
                            }
                        });
                    });
                    let upsideDownResult = {};

                    const resultKeys = Object.keys(result);

                    for (const resultKey of resultKeys) {
                        const str = result[resultKey].join(' , ');
                        if (!upsideDownResult[str]) upsideDownResult[str] = [];
                        upsideDownResult[str].push(resultKey);
                    }
                    const upsideDownResultKeys = Object.keys(upsideDownResult);
                    for (const upsideDownResultKey of upsideDownResultKeys) {
                        if(upsideDownResult[upsideDownResultKey].length > 1) {
                            errorList.push(`Trigger Condition [${upsideDownResultKey}] is duplicated on ${upsideDownResult[upsideDownResultKey].join(' , ')}`)
                        }
                    }
                }

                return errorList;
            }
        }
        return ['Check Failed'];
    };

    $scope.removeSpecificTriggerCondition = function (orderIndifferentInfo) {
        $rootScope.selectedTestStep.orderIndifferentInfoMap[orderIndifferentInfo.currentIPositionPath] = null;
        $scope.retrieveTriggerInfoForSpecificNode($rootScope.selectedSegmentNode, $rootScope.selectedTestStep.orderIndifferentInfoMap);
    };

    $scope.openSpecificTriggerDialog = function (orderIndifferentInfo) {
        var constraintParams = {};
        constraintParams.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        constraintParams.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        constraintParams.er7Message = $rootScope.selectedTestStep.er7Message;
        constraintParams.testDataCategorizationMap = $rootScope.selectedTestStep.testDataCategorizationMap;
        $http.post('api/teststep/getProfileData', constraintParams).then(function (response) {
            $scope.profileData = angular.fromJson(response.data);
            $scope.conformanceProfile = _.find($scope.profileData.integrationProfile.conformanceProfiles, function(cp){
                return cp.conformanceProfileMetaData.id == $rootScope.selectedTestStep.conformanceProfileId;
            });

            var modalInstance = $modal.open({
                templateUrl: 'SpecificTriggerEditModal.html',
                controller: 'SpecificTriggerEditModalCtrl',
                size: 'lg',
                windowClass: 'my-modal-popup',
                resolve: {
                    orderIndifferentInfo: function () {
                        return orderIndifferentInfo;
                    },
                    profileData: function () {
                        return $scope.profileData;
                    },
                    conformanceProfile: function () {
                        return $scope.conformanceProfile;
                    }
                }
            });

            modalInstance.result.then(function() {
                $scope.retrieveTriggerInfoForSpecificNode($rootScope.selectedSegmentNode, $rootScope.selectedTestStep.orderIndifferentInfoMap);
                $scope.recordChanged();
            });

        }, function (error) {
        });


    };

    $scope.openTriggerDialog  = function (node) {
        var modalInstance = $modal.open({
            templateUrl: 'TriggerEditModal.html',
            controller: 'TriggerEditModalCtrl',
            size: 'lg',
            windowClass: 'my-modal-popup',
            resolve: {
                node: function () {
                    return node;
                },
                profileData: function () {
                    return $scope.profileData;
                },
                conformanceProfile: function () {
                    return $scope.conformanceProfile;
                }

            }
        });

        modalInstance.result.then(function() {
            $scope.recordChanged();
        });
    };

    $scope.constraintAccordionClicked = function () {
        if($scope.testDataAccordi.constraintList === false){
            $scope.testDataAccordi = {};
            $scope.testDataAccordi.segmentList = false;
            $scope.testDataAccordi.selectedSegment = false;
            $scope.testDataAccordi.constraintEditorTab = false;


            if($rootScope.selectedTestStep && $rootScope.selectedTestStep.testDataCategorizationMap){

                var constraintParams = {};
                constraintParams.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
                constraintParams.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
                constraintParams.er7Message = $rootScope.selectedTestStep.er7Message;
                constraintParams.testDataCategorizationMap = $rootScope.selectedTestStep.testDataCategorizationMap;
                $http.post('api/teststep/getConstraintsData', constraintParams).then(function (response) {
                    var constraintSupplementData = angular.fromJson(response.data);

                    var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
                        return i;
                    });

                    $scope.listOfTDC = [];

                    keys.forEach(function(key){
                        var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];
                        var usagePath = constraintSupplementData.categorizationsUsageMap[key];

                        if(testDataCategorizationObj != undefined && testDataCategorizationObj != null && usagePath){
                            if(testDataCategorizationObj.testDataCategorization && testDataCategorizationObj.testDataCategorization !== ''){
                                var cate = {};
                                cate.iPath = testDataCategorizationObj.iPath;
                                cate.name = testDataCategorizationObj.name;
                                cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
                                cate.listData = testDataCategorizationObj.listData;
                                cate.data = constraintSupplementData.categorizationsDataMap[key];
                                cate.usagePath = usagePath;
                                cate.constraints = [];
                                var usageCheck = true;
                                var usages = cate.usagePath.split("-");
                                for(var i=0; i < usages.length; i++){
                                    var u = usages[i];
                                    if(u !== "R") {
                                        usageCheck = false;
                                    }
                                }
                                if(cate.testDataCategorization == 'NonPresence'){
                                    cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL NOT be presented.');
                                }else if(cate.testDataCategorization == 'Presence-Content Indifferent' ||
                                    cate.testDataCategorization == 'Presence-Configuration' ||
                                    cate.testDataCategorization == 'Presence-System Generated' ||
                                    cate.testDataCategorization == 'Presence-Test Case Proper'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                }else if(cate.testDataCategorization == 'Presence Length-Content Indifferent' ||
                                    cate.testDataCategorization == 'Presence Length-Configuration' ||
                                    cate.testDataCategorization == 'Presence Length-System Generated' ||
                                    cate.testDataCategorization == 'Presence Length-Test Case Proper'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                    cate.constraints.push('Length of ' + cate.iPath + ' (' + cate.name + ') SHALL be more than '+ cate.data.length);
                                }else if(cate.testDataCategorization == 'Value-Test Case Fixed'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                    cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be '+ cate.data);
                                }else if(cate.testDataCategorization == 'Value-Test Case Fixed List'){
                                    if(!usageCheck) cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be presented.');
                                    cate.constraints.push(cate.iPath + ' (' + cate.name + ') SHALL be one of '+ cate.listData);
                                }


                                if(!$scope.isOrderIndifferent(cate)) $scope.listOfTDC.push(cate);
                            }
                        }
                    });
                    waitingDialog.hide();
                }, function (error) {
                    waitingDialog.hide();
                });
            }
        }
    };

    $scope.isOrderIndifferent = function(cate){
        if($rootScope.orderIndifferentConstraintsPatterns && $rootScope.orderIndifferentConstraintsPatterns.length > 0){

            for(var i in $rootScope.orderIndifferentConstraintsPatterns){
                if(cate.iPath.startsWith($rootScope.orderIndifferentConstraintsPatterns[i].keyString)) return true;
            }
        }

        return false;
    }

    $scope.editorOptions = {
        lineWrapping : false,
        lineNumbers: true,
        mode: 'xml'
    };
    $scope.refreshTree = function () {
        if ($scope.segmentParams){
            $scope.segmentParams.refresh();
        }
    };

    $scope.refreshPropfileTree = function () {
        if ($scope.profileParams){
            $scope.profileParams.refresh();
        }
    };

    $scope.minimizePath = function (iPath) {
        if($rootScope.selectedSegmentNode){
            return $scope.replaceAll(iPath.replace($rootScope.selectedSegmentNode.iPath + "." ,""), "[1]","");
        }
        return '';
    };
    $scope.getSegmentName = function (){
        if($rootScope.selectedSegmentNode){
            return $rootScope.selectedSegmentNode.segmentName;
        }
        return '';
    };

    $scope.getGroupName = function(groupName) {
        var splitsName = groupName.split('.');
        return splitsName[splitsName.length - 1];
    };

    $scope.getSegmentNameByRef = function(ref) {
        return _.find($scope.profileData.integrationProfile.segments, function(seg){
            return seg.id == ref;
        }).label;
    }

    $scope.replaceAll = function(str, search, replacement) {
        return str.split(search).join(replacement);
    };
    $scope.usageFilter = function (node) {
        if(node.type == 'field') {
            if(node.field.usage === 'R') return true;
            if(node.field.usage === 'RE') return true;
            if(node.field.usage === 'C') return true;
        } else {
            if(node.component.usage === 'R') return true;
            if(node.component.usage === 'RE') return true;
            if(node.component.usage === 'C') return true;
        }
        return false;
    };

    $scope.profileUsageFilter = function (node) {
        if(node.usage === 'R') return true;
        if(node.usage === 'RE') return true;
        if(node.usage === 'C') return true;
        return false;
    };

    $scope.changeUsageFilter = function () {
        if($rootScope.usageViewFilter === 'All') $rootScope.usageViewFilter = 'RREC';
        else $rootScope.usageViewFilter = 'All';
    };

    $scope.profileParams = new ngTreetableParams({
        getNodes: function (parent) {
            if (parent && parent != null) {
                if($rootScope.usageViewFilter != 'All'){
                    if(parent.children)
                        return $scope.retrieveOrderIndifferentInfo(parent.children, parent.positionPath).filter($scope.profileUsageFilter);
                    else [];
                }else {
                    return $scope.retrieveOrderIndifferentInfo(parent.children, parent.positionPath);
                }
            }else {
                if($rootScope.usageViewFilter != 'All'){
                    if($scope.conformanceProfile && $scope.conformanceProfile.children) {
                        return $scope.retrieveOrderIndifferentInfo($scope.conformanceProfile.children, null).filter($scope.profileUsageFilter);
                    }else {
                        return [];
                    }
                }else{
                    if($scope.conformanceProfile) return $scope.retrieveOrderIndifferentInfo($scope.conformanceProfile.children, null);
                }
            }
            return [];
        },
        getTemplate: function (node) {
            if(node.ref) return 'Segment.html';
            else return 'Group.html';
        }
    });

    $scope.retrieveOrderIndifferentInfo = function (childrenNodes, parentPositionPath){
        for(var i = 0; i < childrenNodes.length; i++){
            if(parentPositionPath){
                childrenNodes[i].positionPath = parentPositionPath + "-" + (i + 1);
            }else {
                childrenNodes[i].positionPath = "" + (i + 1);
            }
            if($rootScope.selectedTestStep){
                if(!$rootScope.selectedTestStep.orderIndifferentInfoMap) $rootScope.selectedTestStep.orderIndifferentInfoMap = {};
                var orderIndifferentInfo = $rootScope.selectedTestStep.orderIndifferentInfoMap[childrenNodes[i].positionPath];
                if(orderIndifferentInfo){
                    childrenNodes[i].orderIndifferentInfo = orderIndifferentInfo;
                }else {
                    if(childrenNodes[i].max !== '1' &&  childrenNodes[i].max !== '0'){
                        orderIndifferentInfo = {};
                        orderIndifferentInfo.orderSpecific = false;
                        $rootScope.selectedTestStep.orderIndifferentInfoMap[childrenNodes[i].positionPath] = orderIndifferentInfo;
                        childrenNodes[i].orderIndifferentInfo = orderIndifferentInfo;
                    }
                }
            }
        }
        return childrenNodes;
    };

    $scope.segmentParams = new ngTreetableParams({
        getNodes: function (parent) {
            if (parent && parent != null) {
                if($rootScope.usageViewFilter != 'All'){
                    if(parent.children)
                        return $scope.retrieveFieldOrderIndifferentInfo(parent.children).filter($scope.usageFilter);
                    else [];
                }else {
                    return $scope.retrieveFieldOrderIndifferentInfo(parent.children);
                }
            }else {
                if($rootScope.usageViewFilter != 'All'){
                    if($rootScope.selectedSegmentNode && $rootScope.selectedSegmentNode.children) {
                        return $scope.retrieveFieldOrderIndifferentInfo($rootScope.selectedSegmentNode.children).filter($scope.usageFilter);
                    }else {
                        return [];
                    }
                }else{
                    if($rootScope.selectedSegmentNode) return $scope.retrieveFieldOrderIndifferentInfo($rootScope.selectedSegmentNode.children);
                }
            }
            return [];
        },
        getTemplate: function (node) {
            if(node.type == 'field') return 'FieldTree.html';
            else if (node.type == 'component') return 'ComponentTree.html';
            else if (node.type == 'subcomponent') return 'SubComponentTree.html';
            else return 'FieldTree.html';
        }
    });

    $scope.retrieveFieldOrderIndifferentInfo = function (childrenNodes){
        if(childrenNodes){
            for(var i = 0; i < childrenNodes.length; i++){
                if($rootScope.selectedTestStep && childrenNodes[i].type === 'field'){
                    if(!$rootScope.selectedTestStep.fieldOrderIndifferentInfoMap) $rootScope.selectedTestStep.fieldOrderIndifferentInfoMap = {};
                    var orderIndifferentInfo = $rootScope.selectedTestStep.fieldOrderIndifferentInfoMap[$scope.replaceDot2Dash(childrenNodes[i].iPath)];
                    if(orderIndifferentInfo){
                        childrenNodes[i].orderIndifferentInfo = orderIndifferentInfo;
                    }else {
                        if(childrenNodes[i].field.max !== '1' &&  childrenNodes[i].field.max !== '0'){
                            orderIndifferentInfo = {};
                            orderIndifferentInfo.orderSpecific = false;
                            $rootScope.selectedTestStep.fieldOrderIndifferentInfoMap[$scope.replaceDot2Dash(childrenNodes[i].iPath)] = orderIndifferentInfo;
                            childrenNodes[i].orderIndifferentInfo = orderIndifferentInfo;
                        }
                    }
                }
            }
        }

        return childrenNodes;
    };

    $scope.hasChildren = function (node) {
        if(!node || !node.children || node.children.length === 0) return false;
        return true;
    };
    $scope.filterForSegmentList = function(segment){
        if($rootScope.usageViewFilter === "All") return true;
        if(segment.usagePath.indexOf('O') > -1 || segment.usagePath.indexOf('X') > -1){
            return false;
        }
        return true;
    };
    $scope.selectedCols = [];
    $scope.colsData = [
        {id: 1, label: "DT"},
        {id: 2, label: "Usage"},
        {id: 3, label: "Cardi."},
        {id: 4, label: "Length"},
        {id: 5, label: "ValueSet"},
        {id: 6, label: "Predicate"}];

    $scope.smartButtonSettings = {
        smartButtonMaxItems: 6,
        smartButtonTextConverter: function(itemText, originalItem) {
            return itemText;
        }
    };

    $scope.isShow = function (columnId) {
        return _.find($scope.selectedCols, function(col){
            return col.id == columnId;
        });
    };

    $scope.updateTestDataCategorizationListData = function (node, value, index, action) {
        if(action === 'change') {
            node.testDataCategorizationListData[index] = value;
        }else if(action === 'delete') {
            const i = node.testDataCategorizationListData.indexOf(value);
            if (i > -1) {
                node.testDataCategorizationListData.splice(i, 1);
            }
        }else if(action === 'add') {
            node.testDataCategorizationListData.push(value);
        }

        var cate = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)];
        cate.listData = node.testDataCategorizationListData;
        $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = cate;


    };

    $scope.updateTestDataCategorization = function (node) {
        if($rootScope.selectedTestStep.testDataCategorizationMap == undefined || $rootScope.selectedTestStep == null){
            $rootScope.selectedTestStep.testDataCategorizationMap = {};
        }

        var name = '';
        if(node.type == 'field') name = node.field.name;
        else if (node.type == 'component') name = node.component.name;
        else if (node.type == 'subcomponent') name = node.component.name;

        if(node.testDataCategorization == null || node.testDataCategorization == ''){
            $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = null;
        }else {
            var testDataCategorizationObj = {
                iPath: node.iPath,
                testDataCategorization: node.testDataCategorization,
                name: name,
                listData : []
            };

            if(node.testDataCategorization == 'Value-Test Case Fixed List'){
                node.testDataCategorizationListData = [];
                node.testDataCategorizationListData.push(node.value);
                testDataCategorizationObj.listData.push(node.value);
            }
            $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)] = testDataCategorizationObj;
        }
    };

    $scope.replaceDot2Dash = function(path){
        return path.split('.').join('-');
    };

    $scope.deleteSegmentTemplate = function (template){
        var index = $rootScope.template.segmentTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.segmentTemplates.splice(index, 1);
        }
        $scope.recordChanged();
    };

    $scope.deleteEr7SegmentTemplate = function (template){
        var index = $rootScope.template.er7segmentTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.er7segmentTemplates.splice(index, 1);
        }
        $scope.recordChanged();
    };

    $scope.applySegmentTemplate = function (template){
        if($rootScope.selectedTestStep && $rootScope.selectedSegmentNode){
            for(var i in template.categorizations){
                var cate = angular.copy(template.categorizations[i]);
                cate.iPath = $rootScope.selectedSegmentNode.iPath  + cate.iPath;
                if(cate.testDataCategorization && cate.testDataCategorization !== ''){
                    if($rootScope.selectedTestStep.testDataCategorizationMap == null)
                        $rootScope.selectedTestStep.testDataCategorizationMap = {};
                    $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(cate.iPath)] = cate;
                }
            }

            if($rootScope.selectedSegmentNode && $rootScope.selectedSegment){
                $scope.selectSegment($rootScope.selectedSegment);
            }
        }
        $scope.recordChanged($rootScope.selectedTestStep);
    };

    $scope.applyMessageTemplate = function (template){
        if(!$rootScope.selectedTestStep.testDataCategorizationMap)
            $rootScope.selectedTestStep.testDataCategorizationMap = {};
        if($rootScope.selectedTestStep){
            for(var i in template.categorizations){
                var cate = template.categorizations[i];
                if(cate.testDataCategorization && cate.testDataCategorization !== ''){
                    $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(cate.iPath)] = cate;
                }
            }
            if($rootScope.selectedSegmentNode && $rootScope.selectedSegment){
                $scope.selectSegment($rootScope.selectedSegment);
                $scope.refreshTree();
            }
        }
        Notification.success("Template "+template.name+" Applied")
        $scope.recordChanged($rootScope.selectedTestStep);
    };

    $scope.overwriteMessageTemplate = function (template){
        if($rootScope.selectedTestStep){
            $rootScope.selectedTestStep.testDataCategorizationMap = {};
            $scope.applyMessageTemplate(template);
        }
        $scope.recordChanged($rootScope.selectedTestStep);
        Notification.success("Template "+template.name+" Applied")
    };


    $scope.overwriteSegmentTemplate = function (template){
        if($rootScope.selectedTestStep.testDataCategorizationMap == null)
            $rootScope.selectedTestStep.testDataCategorizationMap = {};
        if($rootScope.selectedTestStep && $rootScope.selectedSegmentNode){
            var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
                if(i.includes($rootScope.selectedSegmentNode.iPath.split('.').join('-')))
                    return i;
            });

            keys.forEach(function(key){
                $rootScope.selectedTestStep.testDataCategorizationMap[key] = null;
            });

            $scope.applySegmentTemplate(template);
        }
        $scope.recordChanged($rootScope.selectedTestStep);
        Notification.success("Template "+template.name+" Applied")
    };

    $scope.overwriteER7Template = function (template){
        if($rootScope.selectedTestStep){
            $rootScope.selectedTestStep.er7Message = template.er7Message;
        }
        $scope.initHL7EncodedMessageTab();

        $scope.selectedTestStepTab.tabNum = 2;
        $scope.initTestStepTab($scope.selectedTestStepTab.tabNum);

        $scope.recordChanged($rootScope.selectedTestStep);
        Notification.success("Template "+template.name+" Applied")
    };

    $scope.overwriteER7SegmentTemplate = function (template){
        $rootScope.selectedSegment.segmentStr = template.content;
        var updatedER7Message = '';
        for(var i in $rootScope.segmentList){
            updatedER7Message = updatedER7Message + $rootScope.segmentList[i].segmentStr + '\n';
        }

        $rootScope.selectedTestStep.er7Message = updatedER7Message;
        $scope.initHL7EncodedMessageTab();

        $scope.selectedTestStepTab.tabNum = 2;
        $scope.initTestStepTab($scope.selectedTestStepTab.tabNum);

        $scope.recordChanged($rootScope.selectedTestStep);
        Notification.success("Template "+template.name+" Applied")
    };

    $scope.getNameFromSegment=function(segment){

        var listOfFields = segment.split("|");
        return listOfFields[0];

    };
    $scope.deleteRepeatedField = function(node){
        var index = $rootScope.selectedSegmentNode.children.indexOf(node);
        if (index > -1) {
            $rootScope.selectedSegmentNode.children.splice(index, 1);
        }
        $scope.updateValue(node);
        $scope.selectSegment($rootScope.selectedSegmentNode.segment);
        $scope.recordChanged($rootScope.selectedTestStep);
    };

    $scope.addRepeatedField = function (node) {
        var fieldStr = node.value;
        var fieldPosition = parseInt(node.path.substring(node.path.lastIndexOf('.') + 1));
        var splittedSegment = $rootScope.selectedSegmentNode.segment.segmentStr.split("|");
        if($rootScope.selectedSegmentNode.segment.obj.name == 'MSH') fieldPosition = fieldPosition -1;
        if(splittedSegment.length < fieldPosition + 1){
            var size = fieldPosition - splittedSegment.length + 1;
            for(var i = 0; i < size; i++){
                splittedSegment.push('');
            }
        }
        splittedSegment[fieldPosition] = splittedSegment[fieldPosition] + '~' + fieldStr;
        var updatedStr = '';
        for(var i in splittedSegment){
            updatedStr = updatedStr + splittedSegment[i];
            if(i < splittedSegment.length - 1) updatedStr = updatedStr + "|"
        }
        $rootScope.selectedSegmentNode.segment.segmentStr = updatedStr;
        var updatedER7Message = '';
        for(var i in $rootScope.segmentList){
            updatedER7Message = updatedER7Message + $rootScope.segmentList[i].segmentStr + '\n';
        }
        $rootScope.selectedTestStep.er7Message = updatedER7Message;
        $scope.selectSegment($rootScope.selectedSegmentNode.segment);
        $scope.recordChanged($rootScope.selectedTestStep);
    };

    $scope.updateValue =function(node){
        var segmentStr = $rootScope.selectedSegmentNode.segmentName;
        var previousFieldPath = '';
        for(var i in $rootScope.selectedSegmentNode.children){
            var fieldNode = $rootScope.selectedSegmentNode.children[i];
            if(previousFieldPath === fieldNode.positionPath){
                segmentStr = segmentStr + "~"
            }else {
                segmentStr = segmentStr + "|"
            }

            previousFieldPath = fieldNode.positionPath;

            if(!fieldNode.children || fieldNode.children.length === 0){
                if(fieldNode.value != undefined || fieldNode.value != null) segmentStr = segmentStr + fieldNode.value;
            }else {
                for(var j in fieldNode.children) {
                    var componentNode = fieldNode.children[j];
                    if(!componentNode.children || componentNode.children.length === 0){
                        if(componentNode.value != undefined || componentNode.value != null) segmentStr = segmentStr + componentNode.value;
                        segmentStr = segmentStr + "^";
                    }else {
                        for(var k in componentNode.children) {
                            var subComponentNode = componentNode.children[k];
                            if(subComponentNode.value != undefined || subComponentNode.value != null) segmentStr = segmentStr + subComponentNode.value;
                            segmentStr = segmentStr + "&";
                            if(k == componentNode.children.length - 1){
                                segmentStr = $scope.reviseStr(segmentStr, '&');
                            }
                        }
                        segmentStr = segmentStr + "^";
                    }

                    if(j == fieldNode.children.length - 1){
                        segmentStr = $scope.reviseStr(segmentStr, '^');
                    }
                }
            }

            if(i == $rootScope.selectedSegmentNode.children.length - 1){
                segmentStr = $scope.reviseStr(segmentStr, '|');
            }

        }
        if(segmentStr.substring(0,10) == "MSH|||^~\\&") segmentStr = 'MSH|^~\\&' + segmentStr.substring(10);

        $rootScope.selectedSegmentNode.segmentStr = segmentStr;
        $rootScope.segmentList[$rootScope.selectedSegment.lineNum - 1].lineStr = segmentStr;
        var updatedER7Message = '';

        for(var i in $rootScope.segmentList){
            updatedER7Message = updatedER7Message + $rootScope.segmentList[i].lineStr + '\n';
        }

        $rootScope.selectedTestStep.er7Message = updatedER7Message;

        if(node.testDataCategorization == 'Value-Test Case Fixed List'){
            if(node.testDataCategorizationListData.indexOf(node.value) == -1){
                node.testDataCategorizationListData.push(node.value);
            }
            var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(node.iPath)];
            if(testDataCategorizationObj.listData.indexOf(node.value) == -1){
                testDataCategorizationObj.listData.push(node.value);
            }
        }

        $scope.recordChanged($rootScope.selectedTestStep);
    };

    $scope.reviseStr = function (str, seperator) {
        var lastChar = str.substring(str.length - 1);
        if(seperator !== lastChar) return str;
        else{
            str = str.substring(0, str.length-1);
            return $scope.reviseStr(str, seperator);
        }

    };
    $scope.report=false;
    $scope.validationError=false;

    $scope.validate = function (mode) {
        waitingDialog.show('Processing ...', {dialogSize: 'xs', progressType: 'info'});
        var delay = $q.defer();
        $scope.validationError = false;
        $scope.report = false;
        $scope.validationResult = false;
        var message = $scope.er7MessageOnlineValidation;
        var igDocumentId = $rootScope.selectedTestStep.integrationProfileId;
        var conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        $scope.context=mode;
        $scope.contextValidation=mode;
        var context=mode;

        $scope.loadingv = true;

        var req = {
            method: 'POST',
            url: 'api/validation',
            params: { igDocumentId: igDocumentId, conformanceProfileId : conformanceProfileId , context:context}
            ,
            data:{
                ts:$rootScope.selectedTestStep, message: message
            }
        }

        $http(req).then(function(response) {
            var result = angular.fromJson(response.data);
            $scope.report=$sce.trustAsHtml(result.html);

            if(result.json!==""){
                $scope.validationResult=JSON.parse(result.json);
                $scope.loadingv = false;
            }
            else{
                $scope.validationError=result.error;
                $scope.loadingv = false;
            }
            $scope.loadingv = false;
            $scope.validationView='validation.html';
            delay.resolve(result.json);
            waitingDialog.hide();
        }, function(error) {
            $scope.loadingv = false;
            $scope.error = error.data;
            delay.reject(false);
            waitingDialog.hide();
        });
    };

    $scope.refreshingMessage=false;

    //Tree Functions
    $scope.activeModel={};
    $scope.treeOptions = {
        accept: function(sourceNodeScope, destNodesScope, destIndex) {
            //destNodesScope.expand();
            var dataTypeSource = sourceNodeScope.$element.attr('data-type');
            var dataTypeDest = destNodesScope.$element.attr('data-type');

            if(dataTypeSource==="children"){
                return false;
            }
            if(dataTypeSource==="child"){
                if(dataTypeDest==="children"){
                    return true;

                }else{
                    return false;
                }
            } else if(dataTypeSource==="case"){
                if(dataTypeDest==="children"){
                    return true;
                }else{
                    return false;
                }
            } else if(dataTypeSource==="step"){
                if(dataTypeDest==="steps"){
                    return true;
                }else{
                    return false;
                }
            } else{
                return false;
            }
        },
        dropped: function(event) {
            var sourceNode = event.source.nodeScope;
            var destNodes = event.dest.nodesScope;
            var sortBefore = event.source.index;
            var sortAfter = event.dest.index ;
            var dataType = destNodes.$element.attr('data-type');
            event.source.nodeScope.$modelValue.position = sortAfter+1;
            $scope.updatePositions(event.dest.nodesScope.$modelValue);
            $scope.updatePositions(event.source.nodesScope.$modelValue);

            if($scope.parentDrag.id!==destNodes.$parent.$modelValue.id){
                $rootScope.changesMap[sourceNode.$parent.$nodeScope.$modelValue.id]=true;
                $rootScope.changesMap[destNodes.$nodeScope.$modelValue.id]=true;
                $scope.recordChanged();
            }else {
                if($scope.checkIfChanged($scope.sourceDrag,$scope.parentDrag,destNodes.$modelValue)){
                    $rootScope.changesMap[sourceNode.$parent.$nodeScope.$modelValue.id]=true;
                    $rootScope.changesMap[destNodes.$nodeScope.$modelValue.id]=true;
                    $scope.recordChanged();
                }
            }
        },
        dragStart:function(event){
            var sourceNode = event.source.nodeScope;
            var destNodes = event.dest.nodesScope;
            $scope.sourceDrag=angular.copy(sourceNode.$modelValue);
            $scope.destDrag=angular.copy(sourceNode.$parent.$nodeScope.$modelValue);
            $scope.parentDrag=angular.copy(sourceNode.$parentNodeScope.$modelValue);
        }
    };

    $scope.checkIfChanged=function(element,parent,destination){
        var temp=[];
        if(parent.type=='testcase'){
            temp=parent.teststeps;
        }else{
            temp=parent.children;

        }
        for(i=0; i<destination.length; i++){
            if(destination[i].id===element.id){
                return temp[i].id!==element.id;

            }
        }

    };

    $scope.updatePositions= function(arr){
        for (var i = arr.length - 1; i >= 0; i--){
            arr[i].position=i+1;
        }
        // arr.sort(function(a, b){return a.position-b.position});

    };

    $scope.getWithPosition=function(arr,index){
        angular.forEach(arr,function(element){
            if(element.position&&element.position==index){
                return element;
            }
        });
    }


    $scope.Activate= function(itemScope){
        $scope.activeModel=itemScope.$modelValue;
        //$scope.activeId=itemScope.$id;
    };

    $scope.isCase = function(children){

        if(!children.teststeps){
            return false;
        }else {return true; }
    };

    $scope.cloneteststep=function(teststep){
        var model ={};
        model.name=teststep.name+"clone";
    };

    $scope.isGroup = function(children){
        return children.type == 'testcasegroup';
    };
// Context menu 



    $scope.testPlanOptions = [
        ['Add New Test Group', function($itemScope) {
            if( !$itemScope.$nodeScope.$modelValue.children){
                $itemScope.$nodeScope.$modelValue.children=[];
            }
            var genId=new ObjectId().toString();
            $rootScope.changesMap[genId]=true;
            $rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
            $itemScope.$nodeScope.$modelValue.children.push({
                id: genId,
                longId: Math.random() * 1000000000,
                type : "testcasegroup",
                name: "New Test Group",
                children:[],
                isChanged:true,
                position:$itemScope.$nodeScope.$modelValue.children.length+1});

            $scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
            Notification.success({message:"New Test Group Added", delay:1000});
            $scope.recordChanged();
        }],

        ['Add New Test Case', function($itemScope) {
            if( !$itemScope.$nodeScope.$modelValue.children){
                $itemScope.$nodeScope.$modelValue.children=[];
            }
            var testCaseId=new ObjectId().toString();
            $rootScope.changesMap[testCaseId]=true;
            $rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
            $itemScope.$nodeScope.$modelValue.children.push(
                {
                    id: testCaseId,
                    longId: Math.random() * 1000000000,
                    type : "testcase",
                    name: "New Test Case",
                    teststeps:[],
                    isChanged:true,
                    position:$itemScope.$nodeScope.$modelValue.children.length+1
                });
            Notification.success("New Test Case Added");

            $scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
            $scope.recordChanged();
        }
        ]
    ];

    $scope.testGroupOptions = [
        ['Add New Test Case', function($itemScope) {
            var caseId = new ObjectId().toString();

            $rootScope.changesMap[caseId]=true;
            $rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
            $itemScope.$nodeScope.$modelValue.children.push({
                id: caseId,
                longId: Math.random() * 1000000000,
                type : "testcase",
                name: "New Test Case",
                isChanged:true,
                position: $itemScope.$nodeScope.$modelValue.children.length+1,
                teststeps:[]

            });
            $scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
            Notification.success("New Test Case Added");
            $scope.recordChanged();
        }],


        ['Add New Test Group', function($itemScope) {
            var caseId=new ObjectId().toString();
            $rootScope.changesMap[caseId]=true;
            $rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;
            $itemScope.$nodeScope.$modelValue.children.push({
                id: caseId,
                longId: Math.random() * 1000000000,
                type : "testcasegroup",
                name: "New Test Group",
                isChanged:true,
                position: $itemScope.$nodeScope.$modelValue.children.length+1,
                children:[]

            });
            $scope.activeModel=$itemScope.$nodeScope.$modelValue.children[$itemScope.$nodeScope.$modelValue.children.length-1];
            Notification.success("New Test Case Added");
            $scope.recordChanged();
        }],

        ['Clone', function($itemScope) {
            var clone = $scope.cloneTestCaseGroup($itemScope.$nodeScope.$modelValue);

            var name =  $itemScope.$nodeScope.$modelValue.name;
            var model =  $itemScope.$nodeScope.$modelValue;
            clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
            $itemScope.$nodeScope.$parent.$modelValue.push(clone);
            $scope.activeModel=clone;

        }],

        ['Delete', function($itemScope) {
            $scope.deleteGroup($itemScope.$modelValue);
            $itemScope.$nodeScope.remove();
            Notification.success("Test Group "+$itemScope.$modelValue.name +" Deleted");
            $scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
            $scope.recordChanged($itemScope.$nodeScope.$parentNodeScope.$modelValue);
        }]

    ];


    $scope.testCaseOptions =[
        ['Add New Test Step', function($itemScope) {

            if( !$itemScope.$nodeScope.$modelValue.teststeps){
                $itemScope.$nodeScope.$modelValue.teststeps=[];
            }
            var stepId = new ObjectId().toString();
            $rootScope.changesMap[stepId]=true;
            $rootScope.changesMap[$itemScope.$nodeScope.$modelValue.id]=true;


            var newTestStep = {
                id: stepId,
                longId: Math.random() * 1000000000,
                name : "New Test Step",
                type : "SUT_MANUAL",
                isChanged : true,
                position : $itemScope.$nodeScope.$modelValue.teststeps.length+1,
                testStepStory: {}
            };

            if($rootScope.selectedTestPlan.type !== 'Isolated') newTestStep.type = "MANUAL";

            newTestStep.testStepStory.comments = "No Comments";
            newTestStep.testStepStory.evaluationCriteria = "No evaluation criteria";
            newTestStep.testStepStory.notes = "No Note";
            newTestStep.testStepStory.postCondition = "No PostCondition";
            newTestStep.testStepStory.preCondition = "No PreCondition";
            newTestStep.testStepStory.testObjectives = "No Objectives";
            newTestStep.testStepStory.teststorydesc = "No Description";
            newTestStep.conformanceProfileId=null;
            newTestStep.integrationProfileId=null;
            $rootScope.selectedTestStep=newTestStep;
            $scope.selectTestStep(newTestStep);
            $scope.activeModel=newTestStep;
            $itemScope.$nodeScope.$modelValue.teststeps.push(newTestStep);
            Notification.success("New Test Step Added");

            $scope.recordChanged();

        }],

        ['Clone', function($itemScope) {

            var clone = $scope.cloneTestCase($itemScope.$nodeScope.$modelValue);
            clone.position=$itemScope.$nodeScope.$parent.$modelValue.length+1;
            $itemScope.$nodeScope.$parent.$modelValue.push(clone);
            $scope.activeModel=clone;
            Notification.success("Test Case "+$itemScope.$modelValue.name+" Cloned");


        }],

        ['Delete', function($itemScope) {
            $scope.deleteCase($itemScope.$modelValue)
            $itemScope.$nodeScope.remove();
            $scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
            $scope.recordChanged($itemScope.$nodeScope.$parentNodeScope.$modelValue);
            Notification.success("Test Case "+$itemScope.$modelValue.name+" Deleted");

        }]

    ];

    $scope.testStepOptions = [

        ['Clone', function($itemScope) {
            //var cloneModel= {};
            //var name =  $itemScope.$nodeScope.$modelValue.name;
            //name=name+"(copy)";
            //cloneModel.name=name;
            var clone=$scope.cloneTestStep($itemScope.$nodeScope.$modelValue);
            clone.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
            $scope.activeModel=clone;
            //cloneModel.position=$itemScope.$nodeScope.$parentNodesScope.$modelValue.length+1
            $itemScope.$nodeScope.$parentNodesScope.$modelValue.push(clone);
            Notification.success("Test Step "+$itemScope.$modelValue.name+" Cloned");



            //$scope.activeModel=$itemScope.$nodeScope.$parentNodesScope.$modelValue[$itemScope.$nodeScope.$parentNodesScope.$modelValue.length-1];

        }],

        ['Delete', function($itemScope) {
            $scope.deleteStep($itemScope.$modelValue);
            $itemScope.$nodeScope.remove();
            $scope.updatePositions($itemScope.$nodeScope.$parentNodesScope.$modelValue);
            $scope.recordChanged($itemScope.$nodeScope.$parentNodeScope.$modelValue);
            Notification.success("Test Step "+$itemScope.$modelValue.name+" Deleted");


        }]

    ];

    $scope.openMessageTemplate = function(msgTmp) {
        $rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
        $scope.openApplyMessageTemplate(msgTmp);
    };

    $scope.copyMessageTemplate = function (template){
        var copy =  angular.copy(template);
        copy.name = template.name+"(copy)";
        copy.id = new ObjectId().toString();
        $rootScope.template.messageTemplates.push(copy);
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been copied");
    };

    $scope.deleteMessageTemplate = function (template){
        var index = $rootScope.template.messageTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.messageTemplates.splice(index, 1);
        }
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been deleted");
    };

    $scope.openSegmentTemplate = function(segTmp) {
        $rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
        $scope.openApplySegmentTemplate(segTmp);
    };

    $scope.copySegmentTemplate = function (template){
        var copy =  angular.copy(template);
        copy.name = template.name+"(copy)";
        copy.id = new ObjectId().toString();
        $rootScope.template.segmentTemplates.push(copy);
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been copied");
    };

    $scope.deleteSegmentTemplate = function (template){
        var index = $rootScope.template.segmentTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.segmentTemplates.splice(index, 1);
        }
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been deleted");
    };

    $scope.applyEr7Message = function(er7Tmp) {
        $rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
        $scope.overwriteER7SegmentTemplate(er7Tmp);
        Notification.success("Template "+er7Tmp.name+" has been applied");
    };

    $scope.copyER7Template = function (template){
        var copy =  angular.copy(template);
        copy.name = template.name+"(copy)";
        copy.id = new ObjectId().toString();
        $rootScope.template.er7Templates.push(copy);
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been copied");
    };

    $scope.deleteER7Template = function (template){
        var index = $rootScope.template.er7Templates.indexOf(template);
        if (index > -1) {
            $rootScope.template.er7Templates.splice(index, 1);
        }
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been deleted");
    };

    $scope.applyEr7Segment = function(er7Tmp) {
        $rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
        $scope.overwriteER7SegmentTemplate(er7Tmp);
        Notification.success("Template " + er7Tmp.name + " has been applied");
    };

    $scope.copyER7SegmentTemplate = function (template){
        var copy =  angular.copy(template);
        copy.name = template.name+"(copy)";
        copy.id = new ObjectId().toString();
        $rootScope.template.er7segmentTemplates.push(copy);
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been copied");
    };

    $scope.deleteER7SegmentTemplate = function (template){
        var index = $rootScope.template.er7segmentTemplates.indexOf(template);
        if (index > -1) {
            $rootScope.template.er7segmentTemplates.splice(index, 1);
        }
        $scope.recordChanged();
        Notification.success("Template " + template.name + " has been deleted");
    };


    $scope.ApplyProfile = [
        ['Apply Profile', function($itemScope) {
            $scope.applyConformanceProfile($itemScope.ip.id, $itemScope.msg.id);
            $rootScope.changesMap[$rootScope.selectedTestStep.id]=true;
        }]];

    $scope.messagetempCollapsed=false;
    $scope.segmenttempCollapsed=false;
    $scope.Er7MessageCollapsed=false;
    $scope.Er7SegmentCollapsed=false;

    $scope.switchermsg= function(){
        $scope.messagetempCollapsed = !$scope.messagetempCollapsed;
    };
    $scope.switcherseg= function(){
        $scope.segmenttempCollapsed = !$scope.segmenttempCollapsed;
    };
    $scope.switcherEr7Message= function(){
        $scope.Er7MessageCollapsed = !$scope.Er7MessageCollapsed;
    };

    $scope.switcherEr7Segment= function(){
        $scope.Er7SegmentCollapsed = !$scope.Er7SegmentCollapsed;
    };
    $scope.ChildVisible=function(ig){
        if($rootScope.selectedTestStep===null || ig.id===$rootScope.selectedTestStep.integrationProfileId){
            return true;
        }
        else if($rootScope.selectedTestStep===null){
            return true;
        }


    };

    $scope.OpenMsgTemplateMetadata=function(msgtemp){
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTestStep = null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTemplate = null;
        $rootScope.selectedSegmentNode = null;
        $scope.editor = null;
        $scope.editorValidation = null;

        $rootScope.selectedTemplate=msgtemp;
        $scope.msgTemplate=msgtemp;
        $rootScope.CurrentTitle= "Message Template: " + msgtemp.name;

        var ipMeta = $rootScope.findIntegrationProfileMeta(msgtemp.integrationProfileId);
        var cpMeta = $rootScope.findConformanceProfileMeta(msgtemp.integrationProfileId, msgtemp.conformanceProfileId);

        if(ipMeta){
            $scope.integrationProfileTitle = ipMeta.name;
        }

        if(cpMeta){
            $scope.conformanceProfileTitle = cpMeta.structId + '-' + cpMeta.name + '-' + cpMeta.identifier;
        }
        $scope.subview = "MessageTemplateMetadata.html";
    }
    $scope.OpenTemplateMetadata=function(temp){
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTestStep = null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTemplate = null;
        $rootScope.selectedSegmentNode = null;
        $scope.editor = null;
        $scope.editorValidation = null;

        $scope.rootTemplate=temp;
        $rootScope.CurrentTitle= "Message Template: "+ temp.name;

        $scope.subview = "TemplateMetadata.html";
    }
    $scope.OpenSegmentTemplateMetadata=function(segTemp){
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTestStep = null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTemplate = null;
        $rootScope.selectedSegmentNode = null;
        $scope.editor = null;
        $scope.editorValidation = null;

        $rootScope.CurrentTitle= "Segment Template: " + segTemp.name;

        $rootScope.selectedTemplate=segTemp; //never used
        $scope.segmentTemplateObject=segTemp;
        $scope.subview = "SegmentTemplateMetadata.html";
    }

    $scope.OpenEr7TemplatesMetadata=function(er7temp){
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTestStep = null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTemplate = null;
        $rootScope.selectedSegmentNode = null;
        $scope.editor = null;
        $scope.editorValidation = null;

        $rootScope.CurrentTitle= "Er7 Message Template: " + er7temp.name;

        var ipMeta = $rootScope.findIntegrationProfileMeta(er7temp.integrationProfileId);
        var cpMeta = $rootScope.findConformanceProfileMeta(er7temp.integrationProfileId, er7temp.conformanceProfileId);

        if(ipMeta){
            $scope.integrationProfileTitle = ipMeta.name;
        }

        if(cpMeta){
            $scope.conformanceProfileTitle = cpMeta.structId + '-' + cpMeta.name + '-' + cpMeta.identifier;
        }

        $rootScope.selectedTemplate=er7temp;
        $scope.er7Template=er7temp;
        $scope.subview = "Er7TemplateMetadata.html";
    };

    $scope.OpenEr7SegmentTemplatesMetadata=function(er7temp){
        $rootScope.selectedTestCaseGroup=null;
        $rootScope.selectedTestCase = null;
        $rootScope.selectedTestStep = null;
        $rootScope.selectedSegmentNode =null;
        $rootScope.selectedTemplate = null;
        $rootScope.selectedSegmentNode = null;
        $scope.editor = null;
        $scope.editorValidation = null;

        $rootScope.CurrentTitle= "ER7 Segment Line Template: " + er7temp.name;

        $rootScope.er7SegmentTemplate=er7temp;
        $scope.er7SegmentTemplate=er7temp;
        $scope.subview = "Er7SegmentTemplateMetadata.html";
    };

    $scope.cloneTestStep=function(testStep){
        var clone= angular.copy(testStep);
        clone.name= testStep.name+" Copy";
        clone.id= new ObjectId().toString();
        clone.longId = Math.random() * 1000000000;
        $rootScope.changesMap[clone.id]=true;
        $scope.recordChanged(clone);
        return clone;
    };
    $scope.cloneTestCase= function(testCase){
        var clone= angular.copy(testCase);
        clone.name= testCase.name+" Copy";
        clone.id= new ObjectId().toString();
        clone.longId = Math.random() * 1000000000;
        $rootScope.changesMap[clone.id]=true;
        clone.teststeps=[];
        if(testCase.teststeps.length>0){
            angular.forEach(testCase.teststeps, function(teststep){
                clone.teststeps.push($scope.cloneTestStep(teststep));
            });
        }
        $scope.recordChanged(clone);
        return clone;
    };
    $scope.deleteGroup=function(group){
        if(group.id==$scope.activeModel.id){
            $scope.displayNullView();
        }
        else if(group.children&&group.children.length>0){
            angular.forEach(group.children,function(child){
                if(child.type==='testcase'){
                    $scope.deleteCase(child);
                }
                else{
                    $scope.deleteGroup(child);
                }
            });
        }
    };

    $scope.deleteCase=function(testCase){
        if(testCase.id&&testCase.id===$scope.activeModel.id){
            $scope.displayNullView();
        }else{
            angular.forEach(testCase.teststeps,function(step){
                $scope.deleteStep(step);
            });
        }

    };
    $scope.deleteStep=function(step){
        if(step.id&&step.id===$scope.activeModel.id){
            $scope.displayNullView();
        }
    };

    $scope.displayNullView= function(){
        $scope.subview="nullView.html";
        $rootScope.selectedConformanceProfileId="";
        $rootScope.integrationProfileId="";
        $rootScope.selectedTestStep=null;
        $scope.updateCurrentTitle("Error", "Not found!");
    };

    $scope.initValidation=function(){
        $scope.validationResult=$scope.validationResult1;
    };

    $scope.getAllValue=function(obj){
        var table=[];
        angular.forEach(Object.keys(obj),function(prop){
            table=_.union(table,obj[prop]);

        });
        return table;
    };

    $scope.cloneTestCaseGroup=function(testCaseGroup){
        var clone = angular.copy(testCaseGroup);
        clone.name= testCaseGroup.name+" Copy";
        clone.id= new ObjectId().toString();
        clone.longId = Math.random() * 1000000000;
        $rootScope.changesMap[clone.id]=true;
        clone.children=[];
        if(testCaseGroup.children.length>0){
            angular.forEach(testCaseGroup.children, function(child){
                if(child.type==='testcase'){
                    clone.children.push($scope.cloneTestCase(child));
                }else if(child.type==='testcasegroup'){
                    clone.children.push($scope.cloneTestCaseGroup(child));
                }



            });
        }
        $scope.recordChanged(clone);
        // Notification.success("Test Group "+testCaseGroup.name +" Clonned");
        return clone;
    };


    $rootScope.getComponentNodeName=function(obj){
        return obj.name;
    }
    $rootScope.getFieldNodeName=function (obj) {
        return obj.name;
    }
    $rootScope.getSegmentRefNodeName=function(obj){
        return obj.label;
    }
    $rootScope.getGroupNodeName=function (obj) {
        return obj.name;
    }
    $rootScope.getDatatypeLabel=function(datatype){
        if(datatype.ext!==""||datatype.ext!==null){
            return datatype.name;
        }else{
            return datatype.name+"_"+datatype.ext;
        }
    }
    $rootScope.getTableLabel=function(table){
        if(table) return table.bindingIdentifier;
        return null;
    }

});

angular.module('tcl').controller('ConfirmUnsavedTestPlan', function ($scope, $modalInstance, $rootScope, $http, Notification) {
    $scope.loading = false;
    $scope.saveAndClose = function () {
        $scope.loading = true;

        var changes = angular.toJson([]);
        var data = angular.fromJson({"changes": changes, "tp": $rootScope.selectedTestPlan});

        $http.post('api/testplans/save', data).then(function (response) {
            var saveResponse = angular.fromJson(response.data);
            $http.post('api/template/save', $rootScope.template).then(function (response) {
                $rootScope.changesMap={};
                $rootScope.isChanged = false;
                $rootScope.saved = true;
                Notification.success({message:"Test Plan and Templates Saved", delay: 1000});
                $scope.loading = false;
                $modalInstance.close();
            }, function (error) {
                $rootScope.saved = false;
                Notification.error({message:"Error Templates Saving", delay:1000});
            });

        }, function (error) {
            $rootScope.saved = false;
            Notification.error({message:"Error Saving", delay:1000});

        });
    };

    $scope.close = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('ConfirmTestPlanDeleteCtrl', function ($scope, $modalInstance, testplanToDelete, $rootScope, $http) {
    $scope.testplanToDelete = testplanToDelete;
    $scope.loading = false;
    $scope.deleteTestPlan = function () {
        $scope.loading = true;
        $http.post('api/testplans/' + $scope.testplanToDelete.id + '/delete').then(function (response) {
            $rootScope.msg().text = "testplanDeleteSuccess";
            $rootScope.msg().type = "success";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;
            $scope.loading = false;
            $modalInstance.close($scope.testplanToDelete);
        }, function (error) {
            $scope.error = error;
            $scope.loading = false;
            $modalInstance.dismiss('cancel');
            $rootScope.msg().text = "testplanDeleteFailed";
            $rootScope.msg().type = "danger";
            $rootScope.msg().show = true;
        });
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('validationInfoController', function ($scope, $modalInstance,$rootScope, $http) {
    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('reportController', function ($scope, $modalInstance,$rootScope, $http,report) {
    $scope.report=report;
    $scope.close = function () {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('MessageTemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {
    var cpMeta = $rootScope.findConformanceProfileMeta($rootScope.selectedTestStep.integrationProfileId, $rootScope.selectedTestStep.conformanceProfileId);

    if(cpMeta){
        var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
            return i;
        });
        $scope.newMessageTemplate = {};
        $scope.newMessageTemplate.id = new ObjectId().toString();
        $rootScope.changesMap[$scope.newMessageTemplate.id]=true;
        $scope.newMessageTemplate.name = 'new Template for ' + cpMeta.structId;
        $scope.newMessageTemplate.descrption = 'No Desc';
        $scope.newMessageTemplate.date = new Date();
        $scope.newMessageTemplate.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        $scope.newMessageTemplate.conformanceProfileId = $rootScope.selectedTestStep.conformanceProfileId;
        $scope.newMessageTemplate.structID = cpMeta.structId;

        $scope.newMessageTemplate.categorizations = [];

        if(!$rootScope.selectedTestStep.testDataCategorizationMap) $rootScope.selectedTestStep.testDataCategorizationMap = {};

        keys.forEach(function(key){
            var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

            if(testDataCategorizationObj != undefined && testDataCategorizationObj != null){
                if(testDataCategorizationObj.testDataCategorization && testDataCategorizationObj.testDataCategorization !== ''){
                    var cate = {};
                    cate.iPath = testDataCategorizationObj.iPath;
                    cate.name = testDataCategorizationObj.name;
                    cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
                    cate.listData = testDataCategorizationObj.listData;
                    $scope.newMessageTemplate.categorizations.push(cate);
                }
            }
        });
    }


    $scope.createMessageTemplate = function() {
        $rootScope.template.messageTemplates.push($scope.newMessageTemplate);
        $modalInstance.close();

    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('SegmentTemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {

    var keys = $.map($rootScope.selectedTestStep.testDataCategorizationMap, function(v, i){
        if(i.includes($rootScope.selectedSegmentNode.iPath.split('.').join('-')))
            return i;
    });

    var segmentName = $rootScope.selectedSegmentNode.segmentName;
    $scope.newSegmentTemplate = {};
    $scope.newSegmentTemplate.id = new ObjectId().toString();
    $rootScope.changesMap[$scope.newSegmentTemplate.id]=true;
    $scope.newSegmentTemplate.name = 'new Template for ' + segmentName;
    $scope.newSegmentTemplate.descrption = 'No Desc';
    $scope.newSegmentTemplate.segmentName = segmentName;

    $scope.newSegmentTemplate.date = new Date();
    $scope.newSegmentTemplate.categorizations = [];
    keys.forEach(function(key){
        var testDataCategorizationObj = $rootScope.selectedTestStep.testDataCategorizationMap[key];

        if(testDataCategorizationObj != undefined && testDataCategorizationObj != null){
            var cate = {};
            cate.iPath = testDataCategorizationObj.iPath.replace($rootScope.selectedSegmentNode.iPath,'');
            cate.name = testDataCategorizationObj.name;
            cate.testDataCategorization = testDataCategorizationObj.testDataCategorization;
            cate.listData = testDataCategorizationObj.listData;
            $scope.newSegmentTemplate.categorizations.push(cate);
        }
    });

    $scope.createSegmentTemplate = function() {
        $rootScope.template.segmentTemplates.push($scope.newSegmentTemplate);
        $modalInstance.close();

    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('Er7TemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {
    var cpMeta = $rootScope.findConformanceProfileMeta($rootScope.selectedTestStep.integrationProfileId, $rootScope.selectedTestStep.conformanceProfileId);

    if(cpMeta){
        $scope.newEr7Template = {};
        $scope.newEr7Template.id = new ObjectId().toString();
        $rootScope.changesMap[$scope.newEr7Template.id]=true;
        $scope.newEr7Template.name = 'new ER7 Template for ' + cpMeta.structId;
        $scope.newEr7Template.descrption = 'No Desc';
        $scope.newEr7Template.date = new Date();
        $scope.newEr7Template.integrationProfileId = $rootScope.selectedTestStep.integrationProfileId;
        $scope.newEr7Template.conformanceProfileId =  $rootScope.selectedTestStep.conformanceProfileId;
        $scope.newEr7Template.er7Message = $rootScope.selectedTestStep.er7Message;
        $scope.newEr7Template.structID = cpMeta.structId;
    }

    $scope.createEr7Template = function() {
        $rootScope.template.er7Templates.push($scope.newEr7Template);
        $modalInstance.close();

    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('Er7SegmentTemplateCreationModalCtrl', function($scope, $modalInstance, $rootScope) {
    $scope.newEr7SegmentTemplate = {};
    $scope.newEr7SegmentTemplate.id = new ObjectId().toString();
    $rootScope.changesMap[$scope.newEr7SegmentTemplate.id]=true;

    $scope.newEr7SegmentTemplate.descrption = 'No Desc';
    $scope.newEr7SegmentTemplate.date = new Date();
    $scope.newEr7SegmentTemplate.content=$rootScope.selectedSegmentNode.segmentStr;
    $scope.newEr7SegmentTemplate.segmentName = $rootScope.selectedSegmentNode.segmentName;
    $scope.newEr7SegmentTemplate.name = 'new ER7 Template for '+$scope.newEr7SegmentTemplate.segmentName;


    $scope.createEr7SegmentTemplate = function() {
        if(!$rootScope.template.er7segmentTemplates){
            $rootScope.template.er7segmentTemplates=[];
        }
        $rootScope.template.er7segmentTemplates.push($scope.newEr7SegmentTemplate);
        $modalInstance.close();

    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('MessageViewCtrl', function($scope, $rootScope) {
    $scope.loading = false;
    $scope.msg = null;
    $scope.messageData = [];
    $scope.setData = function(node) {
        if (node) {
            if (node.type === 'message') {
                angular.forEach(node.children, function(segmentRefOrGroup) {
                    $scope.setData(segmentRefOrGroup);
                });
            } else if (node.type === 'group') {
                $scope.messageData.push({ name: "-- " + node.name + " begin" });
                if (node.children) {
                    angular.forEach(node.children, function(segmentRefOrGroup) {
                        $scope.setData(segmentRefOrGroup);
                    });
                }
                $scope.messageData.push({ name: "-- " + node.name + " end" });
            } else if (node.type === 'segment') {
                $scope.messageData.push + (node);
            }
        }
    };


    $scope.init = function(message) {
        $scope.loading = true;
        $scope.msg = message;
        $scope.setData($scope.msg);
        $scope.loading = false;
    };
});

angular.module('tcl').controller('OpenApplySegmentTemplate', function($scope, $modalInstance, $rootScope) {
    $scope.option="Apply";
    $scope.apply = function() {
        $modalInstance.close($scope.option);

    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('OpenApplyMessageTemplate', function($scope, $modalInstance, $rootScope) {
    $scope.option="Apply";
    $scope.apply = function() {
        $modalInstance.close($scope.option);

    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };
});

angular.module('tcl').controller('SpecificTriggerEditModalCtrl', function($scope, $http, $rootScope, profileData, conformanceProfile, $modalInstance, orderIndifferentInfo) {
    $scope.orderIndifferentInfo = orderIndifferentInfo;
    $scope.relatedSegmentList = $rootScope.segmentList.filter(seg => seg.iPath.startsWith($scope.orderIndifferentInfo.currentIPath));
    $scope.profileData = profileData;
    $scope.conformanceProfile = conformanceProfile;

    $scope.retriveDatatypeByComponent = function (datatypeId) {
        const dt = _.find($scope.profileData.integrationProfile.datatypes, function(d){
            return d.id == datatypeId;
        });
        return dt;
    };

    $scope.retriveDatatypeByField = function (segmentId, i, dmKeyValue) {

        const seg = _.find($scope.profileData.integrationProfile.segments, function(seg){
            return seg.id == segmentId;
        });

        if(seg) {
            if(dmKeyValue) {
              if(seg.dynamicMapping && seg.dynamicMapping.items) {
                  const found = seg.dynamicMapping.items.find(item => {
                      return item.value === dmKeyValue;
                  });
                  if(found && found.datatypeId) {
                      const dt = _.find($scope.profileData.integrationProfile.datatypes, function(d){
                          return d.id == found.datatypeId;
                      });
                      return dt;
                  }
              }
            } else {
                const dt = _.find($scope.profileData.integrationProfile.datatypes, function(d){
                    return d.id == seg.children[i-1].datatypeId;
                });
                return dt;
            }
        }
        return null;
    };

    $scope.relatedSegmentList.forEach(seg => {
        seg.parsingResult = [];
        const segmentId = seg.segmentDef.id;
        const fieldList = seg.lineStr.split('|');

        for (let i = 1; i < fieldList.length; i++){
            const fValue = fieldList[i];
            if (fValue && fValue !== '') {
                let fDT = null;
                if(seg.segmentName === 'OBX' && i === 5) {
                    fDT = $scope.retriveDatatypeByField(segmentId, 5, fieldList[2]);
                } else {
                    fDT = $scope.retriveDatatypeByField(segmentId, i, null);
                }
                if(fDT) {
                    if(!fDT.children) {
                        seg.parsingResult.push(
                            {
                                path : i,
                                value : fValue,
                                dt : fDT.name,
                            }
                        );
                    } else {
                        const componentList = fValue.split('^');
                        for (let j = 0; j < componentList.length; j++){
                            const cValue = componentList[j];
                            if (cValue && cValue !== '') {
                                const cDT = $scope.retriveDatatypeByComponent(fDT.children[j].datatypeId);
                                if(cDT) {
                                    if(!cDT.children) {
                                        seg.parsingResult.push(
                                            {
                                                path : i + '.' + (j + 1),
                                                value : cValue,
                                                dt : cDT.name,
                                            }
                                        );
                                    } else {
                                        const subComponentList = cValue.split('&');
                                        for (let k = 0; k < subComponentList.length; k++){
                                            const scValue = subComponentList[k];
                                            if (scValue && scValue !== '') {
                                                const scDT = $scope.retriveDatatypeByComponent(cDT.children[k].datatypeId);
                                                if(scDT) {
                                                    seg.parsingResult.push(
                                                        {
                                                            path : i + '.' + (j + 1) + '.' + (k + 1),
                                                            value : scValue,
                                                            dt : scDT.name,
                                                        }
                                                    );
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        }
    });

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.saveTrigger = function() {
        $rootScope.selectedTestStep.orderIndifferentInfoMap[$scope.orderIndifferentInfo.currentIPositionPath] = {
            orderSpecific : true,
            triggerInfo : {
                description : "This is Specific!",
                list : [],
                operation : "AND",
            }
        }

        $scope.relatedSegmentList.forEach(seg => {
            if(seg.parsingResult) {
                for(const item of seg.parsingResult) {
                    if(item.isTrigger) {
                        $rootScope.selectedTestStep.orderIndifferentInfoMap[$scope.orderIndifferentInfo.currentIPositionPath].triggerInfo.list.push(
                            {
                                namePath: (seg.path + '.' + item.path).substring($scope.orderIndifferentInfo.currentPath.length + 1),
                                positionPath : (seg.positionPath + '.' + item.path).substring($scope.orderIndifferentInfo.currentPositionPath.length + 1),
                            },
                        )
                    }
                }
            }
        });
        $modalInstance.close();
    };
});

angular.module('tcl').controller('TriggerEditModalCtrl', function($scope, $rootScope, $modalInstance, node, profileData, conformanceProfile, ngTreetableParams) {
    $scope.selectedNode = node;
    $scope.profileData = profileData;
    $scope.conformanceProfile = conformanceProfile;

    if($scope.selectedNode.ref) $scope.selectedNode.type = 'segment';
    else $scope.selectedNode.type = 'group';

    $scope.triggerParams = new ngTreetableParams({
        getNodes: function (parent) {
            if (parent && parent != null) {
                if($rootScope.usageViewFilter != 'All'){
                    if(parent.children && !parent.datatypeId)
                        return $scope.markPosition(parent.children, parent).filter($scope.profileUsageFilter);
                    else if(parent.ref && !parent.datatypeId){
                        return $scope.markPosition(_.find($scope.profileData.integrationProfile.segments, function(seg){
                            return seg.id == parent.ref;
                        }).children, parent).filter($scope.profileUsageFilter);
                    }else if (parent.datatypeId) {
                        return $scope.markPosition(_.find($scope.profileData.integrationProfile.datatypes, function(dt){
                            return dt.id == parent.datatypeId;
                        }).children, parent).filter($scope.profileUsageFilter);
                    } else {
                        return [];
                    }
                }else {
                    if(parent.children && !parent.datatypeId)
                        return $scope.markPosition(parent.children, parent);
                    else if(parent.ref && !parent.datatypeId){
                        return $scope.markPosition(_.find($scope.profileData.integrationProfile.segments, function(seg){
                            return seg.id == parent.ref;
                        }).children, parent);
                    }else if (parent.datatypeId) {
                        return $scope.markPosition(_.find($scope.profileData.integrationProfile.datatypes, function(dt){
                            return dt.id == parent.datatypeId;
                        }).children, parent);
                    } else {
                        return [];
                    }
                }
            }else {
                if($rootScope.usageViewFilter != 'All'){
                    if($scope.selectedNode && $scope.selectedNode.children) {
                        return $scope.markPosition($scope.selectedNode.children, null).filter($scope.profileUsageFilter);
                    }else if($scope.selectedNode && $scope.selectedNode.ref){
                        return $scope.markPosition($scope.getSegmentByRef($scope.selectedNode.ref).children, null).filter($scope.profileUsageFilter);
                    }
                }else{
                    if($scope.selectedNode && $scope.selectedNode.children) {
                        return $scope.markPosition($scope.selectedNode.children, null);
                    }else if($scope.selectedNode && $scope.selectedNode.ref){
                        return $scope.markPosition($scope.getSegmentByRef($scope.selectedNode.ref).children, null);
                    }

                }
            }
            return [];
        },
        getTemplate: function (node) {
            if(node.children && !node.datatypeId) return 'TriggerGroup.html';
            else if(node.ref && !node.datatypeId) return 'TriggerSegment.html';
            else if(node.datatypeId && node.max) {
                return 'TriggerField.html';
            }
            else return 'TriggerComponent.html';
        }
    });

    $scope.markPosition = function (children, parent){
        if(children && children.length > 0){
            for (var i in children){
                children[i].position = Number(i) + Number(1);

                if(parent && parent != null){
                    children[i].path = parent.path + '.' + children[i].position;
                    if(parent.type === 'group'){
                        if(children[i].ref) children[i].type = "segment";
                        else children[i].type = "group";
                    }else if(parent.type === 'segment'){
                        children[i].type = "field";
                    }else if(parent.type === 'field'){
                        children[i].type = "component";
                    }else if(parent.type === 'component'){
                        children[i].type = "subComponent";
                    }

                    if(children[i].type === "group"){
                        children[i].pathName = parent.pathName + '.' + $scope.getGroupName(children[i].name);
                    }else if(children[i].type === "segment"){
                        children[i].pathName = parent.pathName + '.' + $scope.getSegmentByRef(children[i].ref).name;
                    }else{
                        children[i].pathName = parent.pathName + '.' + children[i].position;
                    }

                } else {
                    children[i].path = children[i].position;
                    if(children[i].ref) {
                        children[i].type = "segment";
                        children[i].pathName = $scope.getSegmentByRef(children[i].ref).name;
                    }else if(children[i].datatypeId){
                        children[i].type = "field";
                        children[i].pathName = children[i].position;
                    }else {
                        children[i].type = "group";
                        children[i].pathName = $scope.getGroupName(children[i].name);
                    }
                }
            }
            return children;
        } else return [];
    };

    $scope.isSelectedNodeForTrigger = function (positionPath) {
        if($scope.selectedNode.orderIndifferentInfo.triggerInfo) {
            for(var i in $scope.selectedNode.orderIndifferentInfo.triggerInfo.list){
                if($scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].positionPath === positionPath) return true;
            }
        }

        return false;
    };

    $scope.unselectNodeForTrigger = function (positionPath) {
        if($scope.selectedNode.orderIndifferentInfo.triggerInfo && $scope.selectedNode.orderIndifferentInfo.triggerInfo.list ) {
            var index = -1;
            for(var i in $scope.selectedNode.orderIndifferentInfo.triggerInfo.list){
                if($scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].positionPath === positionPath) index = i;
            }

            if (index > -1) {
                $scope.selectedNode.orderIndifferentInfo.triggerInfo.list.splice(index, 1);
            }
        }

        $scope.generateDescription();
    };

    $scope.selectNodeForTrigger = function (positionPath, namePath) {
        if(!$scope.selectedNode.orderIndifferentInfo.triggerInfo) $scope.selectedNode.orderIndifferentInfo.triggerInfo = {};
        if(!$scope.selectedNode.orderIndifferentInfo.triggerInfo.list) $scope.selectedNode.orderIndifferentInfo.triggerInfo.list = [];
        $scope.selectedNode.orderIndifferentInfo.triggerInfo.list.push(
            {
                positionPath : positionPath,
                namePath : namePath
            }
        );
        $scope.selectedNode.orderIndifferentInfo.triggerInfo.operation = 'AND';
        $scope.generateDescription();
    };

    $scope.generateDescription = function() {
        if($scope.selectedNode.orderIndifferentInfo.triggerInfo){
            if($scope.selectedNode.orderIndifferentInfo.triggerInfo.list && $scope.selectedNode.orderIndifferentInfo.triggerInfo.list.length === 1){
                if($scope.selectedNode.type === 'segment'){
                    $scope.selectedNode.orderIndifferentInfo.triggerInfo.description = "The value of " + this.getSegmentByRef($scope.selectedNode.ref).name + '-' + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[0].namePath;
                }else if($scope.selectedNode.type === 'group'){
                    $scope.selectedNode.orderIndifferentInfo.triggerInfo.description =  "The value of " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[0].namePath;
                }
            }else if($scope.selectedNode.orderIndifferentInfo.triggerInfo.list && $scope.selectedNode.orderIndifferentInfo.triggerInfo.list.length > 1){
                if($scope.selectedNode.orderIndifferentInfo.triggerInfo.operation) {
                    var result = '';

                    for(var i in $scope.selectedNode.orderIndifferentInfo.triggerInfo.list) {
                        if(i == 0) {
                            if($scope.selectedNode.type === 'segment'){
                                result = "[The value of " + this.getSegmentByRef($scope.selectedNode.ref).name + '-' + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }else if($scope.selectedNode.type === 'group'){
                                result =  "[The value of " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }
                        }else {
                            if($scope.selectedNode.type === 'segment'){
                                result = result + " " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.operation + " [The value of " + this.getSegmentByRef($scope.selectedNode.ref).name + '-' + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }else if($scope.selectedNode.type === 'group'){
                                result = result + " " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.operation + " [The value of " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }
                        }
                    }
                    $scope.selectedNode.orderIndifferentInfo.triggerInfo.description = result;
                }else $scope.selectedNode.orderIndifferentInfo.triggerInfo.description = "Operator is not set";
            }else {
                $scope.selectedNode.orderIndifferentInfo.triggerInfo.description = "Trigger is not set";
            }
        }

    };

    $scope.profileUsageFilter = function (node) {
        if(node.usage === 'R') return true;
        if(node.usage === 'RE') return true;
        if(node.usage === 'C') return true;
        return false;
    };

    $scope.hasChildren = function (node) {
        if(node.children && !node.datatypeId) return true;
        else if(node.ref && !node.datatypeId) return true;
        else {
            if (node.datatypeId) {
                var dt = $scope.getDatatypeById(node.datatypeId);
                if (!dt || !dt.children || dt.children.length === 0) return false;
            }
        }
        return true;
    };

    $scope.getGroupName = function(groupName) {
        var splitsName = groupName.split('.');
        return splitsName[splitsName.length - 1];
    };

    $scope.getSegmentByRef = function(ref) {
        return _.find($scope.profileData.integrationProfile.segments, function(seg){
            return seg.id == ref;
        });
    };

    $scope.getDatatypeById = function(id) {
        return _.find($scope.profileData.integrationProfile.datatypes, function(dt){
            return dt.id == id;
        });
    };

    $scope.refreshTriggerTree = function () {
        if ($scope.triggerParams){
            $scope.triggerParams.refresh();
        }
    };

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.saveTrigger = function() {
        $modalInstance.close();
    };


    $scope.refreshTriggerTree();
});
