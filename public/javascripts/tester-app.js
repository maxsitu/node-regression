/**
 * Created by Situ Ma (v545192) on 11/4/2015.
 * App script for tester page
 */
var testerApp = angular.module('testerApp', ['ivh.treeview']);
testerApp.controller('TesterCtrl', ['$rootScope', '$scope', '$interval', 'allnodes', function ($rootScope, $scope, $interval, allnodes) {
    $rootScope.visibleScope = undefined;
    allnodes($scope);

    $interval(function () {
        allnodes($scope);
    }, 15000);


}])
    .factory('allnodes', ['$http', function ($http) {

        var markFailure = function (node) {
            if (node.rc && node.rc != 0) {
                node.fail = true;
                return true;
            }

            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    var child = node.children[i];
                    if (markFailure(child)) {
                        node.fail = true;
                    }
                }
            }
            if (!node.fail)
                node.fail = false;
            return node.fail;
        };

        return function (scope) {
            $http.post('/test/find_all_test_root').then(
                function (response) {
                    scope.testItemList = response.data;
                    markFailure(scope.testItemList);
                    console.log(response.data);
                },
                function (rejection) {
                    scope.testItemList = [];
                    alert('Cannot get information. Check the server side!');
                }
            );
        }

    }])
    .config(function (ivhTreeviewOptionsProvider) {
        ivhTreeviewOptionsProvider.set({
            twistieCollapsedTpl: '<span class="glyphicon glyphicon-chevron-right"></span>',
            twistieExpandedTpl: '<span class="glyphicon glyphicon-chevron-down"></span>',
            twistieLeafTpl: '&#9679;',
            defaultSelectedState: false,
            useCheckboxes: false,
            expandToDepth: 3

        });
    })
    .directive('testItem', ['$document', '$rootScope', '$log', '$http', function ($document, $rootScope, $log, $http) {
        return {
            restrict: 'E',
            scope: {
                itemNode: "="
            },
            templateUrl: '/directive/test-item',
            link: function (scope, element, attr) {
                scope.isVisible = false;
                scope.$log = $log;
                scope.toggleVisible = function () {
                    scope.isVisible = !scope.isVisible;
                    if (scope.isVisible) {
                        if ($rootScope.visibleScope && $rootScope.visibleScope != scope) {
                            $rootScope.visibleScope.isVisible = false;
                            $rootScope.visibleScope = scope;
                        }
                        else
                            $rootScope.visibleScope = scope;
                    }
                    else {
                        $rootScope.visibleScope = undefined;
                    }
                };

                scope.kickOff = function (node, event) {
                    node.isRunning = true;
                    event.stopPropagation();
                    var cmd = node.cmd;
                    if (!cmd)
                        cmd = node.path;
                    $http.post('/test/run_test_item_by_cmd', {cmd: cmd}).then(
                        function successCallback(response) {

                        },
                        function errorCallback(response) {

                        }
                    );
                };

                scope.isRunning = function (node) {
                    if (node.running)
                        return true;
                    if (node.children) {
                        for (var i = 0; i < node.children.length; i++) {
                            var child = node.children[i];
                            if (!scope.isRunning(child))
                                return false;
                        }
                        return true;
                    }
                    return false;
                };

                element.bind('click', function (event) {
                    event.stopPropagation();
                });

                $document.bind('click', function () {
                    if (scope.isVisible) {
                        scope.isVisible = false;
                        scope.$apply();
                    }
                });
            }
        };
    }])
;