'use strict';
angular.module('tcl').factory('StorageService',
    ['localStorageService', function (localStorageService) {
        var service = {
            TABLE_COLUMN_SETTINGS_KEY: 'SETTINGS_KEY',
            SELECTED_TEST_PLAN_TYPE:'SelectedTestPlanType',
            SELECTED_TEST_PLAN_ID:'SelectedTestPlanId',
            APP_VERSION:'APP_VERSION',
            TABLE_CONCISE_SETTINGS:'TABLE_CONCISE_SETTINGS',
            TABLE_RELEVANCE_SETTINGS:'TABLE_RELEVANCE_SETTINGS',
            TABLE_COLLAPSE_SETTINGS:'TABLE_COLLAPSE_SETTINGS',
            TABLE_READONLY_SETTINGS:'TABLE_READONLY_SETTINGS',
            TEST_PLAN:'TEST_PLAN',
            GVT_BASIC_AUTH:'GVT_BASIC_AUTH',
            GVT_USERNAME:'GVT_USERNAME',
            GVT_PASSWORD:'GVT_PASSWORD',


            remove: function (key) {
                return localStorageService.remove(key);
            },

            removeList: function removeItems(key1, key2, key3) {
                return localStorageService.remove(key1, key2, key3);
            },

            clearAll: function () {
                return localStorageService.clearAll();
            },
            set: function (key, val) {
                return localStorageService.set(key, val);
            },
            get: function (key) {
                return localStorageService.get(key);
            },
            setSelectedTestPlanType: function (val) {
                this.set(this.SELECTED_TEST_PLAN_TYPE,val);
            },
            getSelectedTestPlanType: function () {
                return this.get(this.SELECTED_TEST_PLAN_TYPE);
            },
            setAppVersion: function (version) {
                this.set(this.APP_VERSION,version);
            },
            getAppVersion: function () {
                return this.get(this.APP_VERSION);
            },
            getTestPlan: function () {
                return this.get(this.TEST_PLAN) != null ? angular.fromJson(this.get(this.TEST_PLAN)):null;
            },
            setTestPlan: function (TestPlan) {
                this.set(this.TEST_PLAN,TestPlan != null ?  angular.toJson(TestPlan):null);
            },
            getGVTBasicAuth: function () {
                return this.get(this.GVT_BASIC_AUTH);
            },
            setGVTBasicAuth: function (value) {
                this.set(this.GVT_BASIC_AUTH,value);
            },
            getGvtUsername: function () {
                var value = this.get(this.GVT_USERNAME);
                return  value != undefined ? value: null;
            },
            setGvtUsername: function (value) {
                this.set(this.GVT_USERNAME,value);
            },
            getGvtPassword: function () {
                var value =  this.get(this.GVT_PASSWORD);
                return value != undefined ? value: null;
            },
            setGvtPassword: function (value) {
                this.set(this.GVT_PASSWORD,value);
            }
        };
        return service;
    }]
);
