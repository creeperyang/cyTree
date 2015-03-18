'use strict';

/**
 * @ngdoc overview
 * @name longdataMan
 * @description
 * # adminApp
 *
 * Main module of the application.
 */

// create a module for all services to register
angular.module('adminApp.services', [])
    .factory('IsJson', function() {
        var re = /^\s*\{.+\}\s*$/i;
        return function(str) {
            return re.test(str);
        }
    })
    .value('USERTYPES', ['system', 'agent', 'shop']);

// create a module for all filters to register
angular.module('adminApp.filters', []);

// create a module for all controllers to register
angular.module('adminApp.controllers', []);

// create a module for all directives to register
angular.module('adminApp.directives', ['adminApp.services']);

angular
    .module('testApp', [
        'cyTree',
        'testApp.controllers',
        'testApp.services',
    ])
    .run(function($rootScope) {
        
    });

angular.module('testApp.services', [])
    .service('dataServ', function($http) {
        this.getFormattedData = function() {
            return $http({
                url: '/res/data.json',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        };
    });
    

angular.module('testApp.controllers', [])
    .controller('Demo1', function($scope, dataServ) {
        var promise = dataServ.getFormattedData();

        $scope.data = {};
        promise.then(function(res) {
            $scope.treeData = res.data;
            $scope.treeData2 = res.data.slice(0);
        });
    });