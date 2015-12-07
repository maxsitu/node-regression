/**
 * Created by Situ Ma (v545192) on 11/4/2015.
 * App script for tester page
 */
var testerApp = angular.module('testerApp', [
    'ivh.treeview',
    'ngWebSocket'
]);
testerApp.factory('WssUpdate', ['$websocket', function ($websocket) {
    var dataStream = $websocket("ws://" + window.location.hostname + ":3000/test");
    dataStream.onMessage(function (msg) {
        console.log(msg.data);
    });
    return {};
}]).service('selectTestItem', ['$http', function ($http) {
    this.selected = {};
    this.select = function (selected) {
        return function (testItem) {
            if (selected.item && selected.item == testItem) {
                return;
            }
            selected.item = testItem;
            if (testItem.cmd) {
                $http.post('/test/output_files', {cmd: testItem.cmd}).then(
                    function successCallback(response) {
                        selected.outfiles = [];
                        response.data.forEach(function (row) {
                            selected.outfiles.push(row);
                        });
                    },
                    function errorCallback(response) {

                    }
                );
            } else {
                selected.item = testItem;
                delete selected['outfiles'];
            }
        };
    }(this.selected);
}])
    .service('filecontent', ['$http', function ($http) {
        this.showContent = function (loc, scope) {
            $http.post('/test/file_content', {file: loc})
                .then(function successCb(response) {
                    scope.filecontent = response.data.content;
                },
                function errorCb(response) {

                });
        };
    }])
    .service('kickoff', ['$http', function ($http) {
        this.kickOff = function (testItem, event) {
            function setRun(node) {
                node.running = true;
                if (node.children) {
                    for (var i = 0; i < node.children.length; i++) {
                        setRun(node.children[i]);
                    }
                }
            }

            setRun(testItem);
            event.stopPropagation();
            var cmd = testItem.cmd;
            if (!cmd)
                cmd = testItem.path;
            $http.post('/test/run_test_item_by_cmd', {cmd: cmd}).then(
                function successCallback(response) {

                },
                function errorCallback(response) {

                }
            );
        };
    }])
    .controller('TesterCtrl', [
        '$rootScope',
        '$scope',
        '$interval',
        'allnodes',
        'selectTestItem',
        'filecontent',
        'kickoff',
        'WssUpdate', function ($rootScope, $scope, $interval, allnodes, selectTestItem, filecontent, kickoff, WssUpdate) {
            $scope.selected = selectTestItem.selected;

            $scope.select = function (testItem) {
                selectTestItem.select(testItem);
            };

            $scope.showContent = function (loc) {
                filecontent.showContent(loc, $scope);
            };

            $scope.kickOff = function (event) {
                kickoff.kickOff($scope.selected.item, event);
            };

            $scope.isRunning = function () {
                var apply = function (node) {
                    if (!node)
                        return false;
                    if (node.children) {
                        for (var i = 0; i < node.children.length; i++) {
                            var child = node.children[i];
                            if (!apply(child))
                                return false;
                        }
                        return true;
                    }

                    if (node.running)
                        return true;

                    return false;
                };
                return apply($scope.selected.item);
            };
            $rootScope.visibleScope = undefined;
            allnodes($scope);

            $scope.WssUpdate = WssUpdate;
//            $interval(function () {
//                allnodes($scope);
//            }, 15000);


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

        function buildTree(sep, map) {
            var apply = function (parent, path, tokens) {
                if (tokens.length == 0) return;
                var token = tokens.shift();
                if (path.length == 0)
                    path = token;
                else
                    path = path.concat(sep + token);
                if (!parent.children) {
                    parent.children = [];
                }
                if (!(path in map)) {
                    map[path] = {label: token};
                }
                var flag = false;
                for (var i = 0; i < parent.children.length; i++) {
                    if (parent.children[i].path == path) {
                        flag = true;
                        break;
                    }
                }

                if (!flag) {
                    parent.children.push(map[path]);
                }
                map[path]["path"] = path;
                apply(map[path], path, tokens);
            };
            var paths = Object.keys(map);
            var container = new Object();
            paths.forEach(function (path) {
                var tokens = path.split(sep);
                apply(container, '', tokens);
            });
            return container.children[0];
        }

        var update = function (scope, sep, items) {
            if (!scope.node_map || !scope.testItemList) {
                scope.node_map = {};
                items.forEach(function (item) {
                    scope.node_map[item.label] = item;
                    item.label = item.label.split(sep).pop();
                });
                scope.testItemList = buildTree(sep, scope.node_map);
            } else {
                items.forEach(function (item) {
                    if (item.label in scope.node_map) {
                        var rcd = scope.node_map[item.label];
                        if (item.rc)
                            rcd.rc = item.rc;
                        rcd.running = item.running;
                    }
                });
            }
        };

        return function (scope) {
            if (!scope.node_map || !scope.testItemList) {
                var keys = Object.keys(scope.selected);
                keys.forEach(function (key) {
                    delete scope.selected[key];
                });
                scope.filecontent = '';
            }
            $http.post('/test/find_all_test_items').then(
                function (response) {
                    update(scope, response.data.sep, response.data.list);
                    markFailure(scope.testItemList);
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
    .directive('testItem', ['$document', '$rootScope', '$log', '$http', 'selectTestItem', function ($document, $rootScope, $log, $http, selectTestItem) {
        return {
            restrict: 'E',
            scope: {
                itemNode: "="
            },
            templateUrl: '/directive/test-item',
            link: function (scope, element, attr) {
                scope.isVisible = false;
                scope.$log = $log;
                scope.select = function (testItem) {
                    selectTestItem.select(testItem);
                };
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

                scope.isRunning = function () {
                    var apply = function (node) {
                        if (!node)
                            return false;
                        if (node.children) {
                            for (var i = 0; i < node.children.length; i++) {
                                var child = node.children[i];
                                if (!apply(child))
                                    return false;
                            }
                            return true;
                        }

                        if (node.running)
                            return true;

                        return false;
                    };
                    return apply(scope.itemNode);
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