
'use strict';

;(function(angular) {

var app = angular.module('cyTree', []);

app.service('cyTreeUtils', [function() {

    var uniqueTreeId = 0,
        prefix = 'cyTree';
    
    var genOriginalTemplate = function(treeData, childFlag, labelFlag) {
        return '<ul>' +
                '<li ng-class="{\'last-node\': $last, \'has-child\': node.' + childFlag + '.length}" ng-repeat="node in ' + treeData + '">' +
                '<i class="tree-icon css-icon" ng-if="node.' + childFlag + '.length" ng-click="treeMethods.collapseNode(node)" ng-class="{\'icon-triangle-right-small\': node.collapsed, \'icon-triangle-bottom-small\': !node.collapsed}"></i>' + 
                '<i class="tree-icon css-icon icon-space" ng-if="!node.' + childFlag + '.length"></i>' + 
                '<i class="tree-icon css-icon" ng-class="{\'icon-box\': node.nonSelected, \'icon-success\': node.selected, \'icon-box2\': node.partSelected}" ng-click="treeMethods.selectNode(node)"></i>' + 
                '<span class="tree-label">{{node.' + labelFlag + '}}</span>' +
                '<div class="cy-sub-tree" ng-if="node.' + childFlag + '.length" ng-hide="node.collapsed" tree-data="node.' + childFlag + '"></div>' +
                '</li>' +
            '</ul>';
    };

    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#genTemplate
     * @methodOf cyTree.service:cyTreeUtils
     * @description generate template, invoked by treeData directive
     *
     * @param {string} treeData specify tree data property of (parent) scope
     * @param {string} childFlag child list property name
     * @param {string} labelFlag label property name
     * @returns {string} template
     */
    this.genTemplate = genOriginalTemplate;

    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#setTemplateGenerator
     * @methodOf cyTree.service:cyTreeUtils
     * @description set template generator
     *
     * @param {function} template generator
     */
    this.setTemplateGenerator = function(tplGen) {
        this.genTemplate = tplGen;
    };

    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#genUniqueId
     * @methodOf cyTree.service:cyTreeUtils
     * @description generate unique tree id
     *
     * @returns {string} tree id
     */
    this.genUniqueId = function() {
        return prefix + (++uniqueTreeId);
    };

    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#genUniqueId
     * @methodOf cyTree.service:cyTreeUtils
     * @description generate unique tree id
     *
     * @returns {number} trees count
     */
    this.getTreeCount = function() {
        return uniqueTreeId;
    };

    function downTree(array, childFlag, parent, callback, stop) {
        var len = array && array.length,
            children,
            obj;
        if(!len || !callback) {
            return;
        }
        while(len--) {
            obj = array[len];
            children = obj[childFlag];
            callback(obj, parent, children);
            if(stop && stop(obj, parent, children)) {
                return;
            }
            downTree(children, childFlag, obj, callback);
        }
    };

    function upTree(node, parentFlag, callback, stop) {
        if(!node || !callback) {
            return;
        }
        var parent = node[parentFlag];
        callback(parent, node);
        if(stop && stop(parent, node)) {
            return;
        }
        if(parent) {
            upTree(parent, parentFlag, callback);
        }
    }

    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#iterateDown
     * @methodOf cyTree.service:cyTreeUtils
     * @description iterate tree data
     *
     * @param {array} array tree data
     * @param {string} childFlag child list property name
     * @param {object} parent parent node
     * @param {function} callback when iterate treedata, invoke for every node data
     */
    this.iterateDown = downTree;
    this.iterateUp = upTree;

    /*
        data:   [{
                    "text": "零散商户渠道",
                    "id": "agent_1",
                    "parent": "#"
                }, {
                    "text": "彼此的茶",
                    "id": "merchant_1",
                    "parent": "agent_1"
                }, {
                    "text": "艾瑞客意大利家庭料理",
                    "id": "merchant_2",
                    "parent": "agent_1"
                }]
    */
    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#formatData
     * @methodOf cyTree.service:cyTreeUtils
     * @description format an array data to data cyTree prefer
     *
     * @param {Array} list original array data, used by jsTree plugin, like [{
                    "text": "零散商户渠道",
                    "id": "agent_1",
                    "parent": "#"
                }, {
                    "text": "彼此的茶",
                    "id": "merchant_1",
                    "parent": "agent_1"
                }, {
                    "text": "艾瑞客意大利家庭料理",
                    "id": "merchant_2",
                    "parent": "agent_1"
                }]
     * @param {string} rootFlag root flag
     * @param {string} parentFlag parent flag
     * @param {string} currentFlag current id flag
     * @param {function} eachHandler when iterate list, call eachHandler before any process
     * @returns {Array} formatted data
     */
    this.formatData = function(list, rootFlag, parentFlag, currentFlag, eachHandler) {
        if(!list || !list.length) {
            return [];
        }

        var len = list.length,
            map = {},
            root;
        eachHandler = eachHandler || function() {};
        while(len--) {
            var item = list[len],
                //itemName = item[currentFlag],
                parentName = item[parentFlag];
            eachHandler(item);
            if(parentName === rootFlag) {
                root = item;
            } 
            if(!map[parentName]) {
                map[parentName] = [];
            }
            map[parentName].push(item);
        }
        root.list = map[rootFlag];
        deep(root, 'list', function(subitem) {
            subitem.list = map[subitem[currentFlag]];
        });
        return [root];
    };


    function deep(item, prop, cb) {
        if(!item || !item[prop]) {
            return;
        }
        var list = item[prop],
            count = list.length,
            cur;
        while(count--) {
            cur = list[count];
            cb && cb(cur);
            deep(cur);
        }
    }

    this.iterate = deep;
}]);

app.controller('cyTreeController', function($scope, $q, $log, cyTreeUtils) {

    var self = this;
    var treeMethods, treeId, treeInfo, watch;
    var log;
    var deferred = $q.defer();

    $scope.$handling = true;
    treeMethods = $scope.treeMethods = {};
    treeId = $scope.treeId = cyTreeUtils.genUniqueId();
    treeInfo = $scope[treeId] = {}; // tree status and info

    this.$initPromise = deferred.promise;

    this.init = function(treeData, treeChildFlag, treeLabelFlag, keepRawData, debugMode) {
        log = function () {
            if (debugMode && $log.debug) {
                $log.debug.apply(this, arguments);
            }
        };
        log('cyTree:about to init, treeData is', treeData);
        self.template = cyTreeUtils.genTemplate(treeData, treeChildFlag, treeLabelFlag);
        deferred.resolve(self.template);
        if(!keepRawData) {
            watch = $scope.$watch(treeData, function(newData, oldData) {
                if(newData !== undefined) {
                    log('cyTree:handle raw data', newData);
                    watch(); // remove watch;
                    cyTreeUtils.iterateDown($scope[treeData], treeChildFlag, null, function(item, parent, children) {
                        var count, 
                            countDup = 0, 
                            selectedCount = 0;
                        item.parent = parent;
                        if(!children || !children.length) {
                            item.selectedCount = 0;
                            item.leafNode = true; // set leaf node flag
                        } else {
                            countDup = count = children.length;
                            while(count--) {
                                if(children[count].selected) {
                                    selectedCount++;
                                }
                            }
                            item.selectedCount = selectedCount;
                        }
                        setNodeStatus(item, selectedCount, countDup);
                        item.collapsed = !!item.collapsed;
                    });
                }
            });
        }
    };

    //Collapse or Expand node when collapse icon clicked
    treeMethods.collapseNode = function(curNode) {
        log('cyTree:collapseNode', treeId);
        curNode.collapsed = !curNode.collapsed;
        treeInfo.currentCollapsedNode = curNode;
    };

    //select/deselect node when check icon clicked
    treeMethods.selectNode = function(node) {
        if(!node) {
            return;
        }
        log('cyTree:selectNode', treeId);

        var original = node.nonSelected,
            toSelect = false;
        // 全选-->不选 部分-->不选 不选-->全选
        if(original) {
            node.selected = true;
            node.nonSelected = node.partSelected = false;
            toSelect = true;
        } else {
            node.nonSelected = true;
            node.selected = node.partSelected = false;
        }
        treeInfo.currentSelectedNode = node;
        
        // handle parent chain
        cyTreeUtils.iterateUp(node, 'parent', function(parentNode, curNode) {
            if(!parentNode) {
                return;
            }
            if(toSelect) {
                parentNode.selectedCount++;
            } else {
                parentNode.selectedCount--;
            }
            setNodeStatus(parentNode, parentNode.selectedCount, parentNode[treeChildFlag].length);
        }, function(parentNode, curNode) { // whether to stop iterate
            if(!parentNode) {
                return true;
            }
            return parentNode.partSelected && parentNode.selectedCount > (toSelect ? 1 : 0);
        });

        if(node.leafNode) {
            return;
        }
        // handle children
        cyTreeUtils.iterateDown([node], treeChildFlag, null, 
            function(item, parent, children) {
                var len = 0;
                if(node === item) {
                    return;
                }
                if(toSelect) {
                    if(children) {
                        len = item.selectedCount = children.length;
                    }
                } else {
                    item.selectedCount = 0;
                }

                setNodeStatus(item, item.selectedCount, len, toSelect);
            });
    };

    function setNodeStatus(node, selectedCount, count, leafSelected) {
        if(node.leafNode) {
            if(leafSelected !== undefined) {
                node.selected = leafSelected;
                node.nonSelected = !leafSelected;
            } else {
                node.selected = !!node.selected;
                node.nonSelected = !node.selected;
            }
            return;
        }
        node.selected = false;
        node.partSelected = false;
        node.nonSelected = false;
        if(selectedCount === 0) {
            node.nonSelected = true;
        } else if(selectedCount < count) {
            node.partSelected = true;
        } else {
            node.selected = true;
        }
    }

});

app.directive('cyTree', ['$q', '$compile',
    function($q, $compile) {
        return {
            restrict: 'A',
            scope: true,
            priority: 1,
            controller: 'cyTreeController',
            link: function(scope, element, attrs, ctrl) {

                var treeData = attrs.treeData;
                var treeChildFlag = attrs.treeChildFlag || 'list';
                var treeLabelFlag = attrs.treeLabelFlag || 'name';
                var keepRawData = false; // currently set to false
                ctrl.init(treeData, treeChildFlag, treeLabelFlag, keepRawData, attrs.debugMode);
                //Rendering template.
                //console.log(ctrl.template, $compile(ctrl.template)(scope))
                //element.html('').append($compile(ctrl.template)(scope));
            }
        };
    }
]);
app.directive('treeData', ['$compile',

    function($compile) {

        return {
            restrict: 'A',
            scope: true,
            priority: 0,
            require: '?^cyTree',
            link: function(scope, element, attrs, ctrl) {

                //Rendering template.
                console.log('-----', ctrl)
                if(ctrl) {
                    ctrl.$initPromise.then(function(template) {
                        console.log(template);
                        //element.html('').append($compile(ctrl.template)(scope));
                    });
                    console.log(scope, element, attrs, ctrl.template, $compile(ctrl.template)(scope))
                }
                //element.html('').append($compile(ctrl.template)(scope));

            }
        };
    }
]);

})(angular);
