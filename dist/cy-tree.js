/* 
    angular-treeview: the treeview directive
    tree-id : each tree's unique id.
    tree-model : the tree model on $scope.
    node-id : each node's id
    node-label : each node's label
    node-children: each node's children
    <div
        data-angular-treeview="true"
        data-tree-id="tree"
        data-tree-model="roleList"
        data-node-id="roleId"
        data-node-label="roleName"
        data-node-children="children" >
    </div>
*/
'use strict';

;(function(angular) {

var app = angular.module('cyTree', []);

app.service('cyTreeUtils', [function() {

    var uniqueTreeId = 0,
        prefix = 'cyTree';
    
    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#formatData
     * @methodOf cyTree.service:cyTreeUtils
     * @description format an array data to data cyTree prefer
     *
     * @param {Array} list original array data, used by jsTree plugin
     * @param {string} rootFlag root flag
     * @param {string} parentFlag parent flag
     * @param {string} currentFlag current id flag
     * @param {function} eachHandler when iterate list, call eachHandler before any process
     * @returns {Array} formatted data
     */
    var genOriginalTemplate = function() {
    };

    var genTemplate = genOriginalTemplate;

    this.genUniqueId = function() {
        return prefix + (++uniqueTreeId);
    };

    this.getTreeCount = function() {
        return uniqueTreeId;
    };

    this.iterateTree = function (array, childFlag, callback) {
        var len = array && array.length,
            childs,
            obj;
        if(!len || !callback) {
            return;
        }
        while(len--) {
            obj = array[len];
            childs = obj[childFlag];
            callback(obj);
            iterate(childs, childFlag, callback);
        }
    };

    this.template = function(template) {
        if(typeof template === 'function') {
            genTemplate = template;
        } else {
            return genTemplate;
        }
    };
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

app.directive('treeModel', ['$q', '$log', '$compile', '$templateCache', 'cyTreeUtils',

    function($q, $log, $compile, $templateCache, cyTreeUtils) {
        function toggleChildren(node, flag) {
            var children = node.list,
                i, len;
            if(children && children.length) {
                for(i = 0, len = children.length; i < len; i++) {
                    children[i].selected = flag;
                    toggleChildren(children[i], flag);
                }
            }
        }

        return {
            restrict: 'A',
            scope: true,
            link: function(scope, element, attrs) {

                var log = function () {
                    if (attrs.debugMode && $log.debug) {
                        $log.debug.apply(this, arguments);
                    }
                };

                log('cyTree:about to init');
                // whether to handle data 
                var keepRawData = attrs.keepRawData;
                var treeData = attrs.treeData;
                var treeMethods;
                //tree template
                var template = $templateCache.get('cy-tree-template/tree.html');
                if(treeData) {
                    template.replace(/treeData/g, treeData);
                } else {
                    treeData = 'treeData';
                }
                if(!keepRawData) {
                    // default collapsed
                    cyTreeUtils.iterateTree(scope[treeData], 'list', function(item, children) {
                        if(!children || !children.length) {
                            return;
                        }
                        item.collapsed = true;
                    });
                }

                log('cyTree:inited, (keepRawData, treeData)', keepRawData, treeData);


                //root node, only execute once
                if (attrs.cyTree) {

                    log('cyTree:about to add behavior');

                    treeMethods = scope.treeMethods = scope.treeMethods || {};
                    scope.treeId = cyTreeUtils.genUniqueId();
                    
                    //Collapse or Expand node when collapse icon clicked
                    scope.treeMethods.collapseNode = treeMethods.collapseNode || function(selectedNode) {
                        selectedNode.expanded = !selectedNode.expanded;
                        log('cyTree:collapseNode', scope.treeId);
                    };

                    //select/deselect node when check icon clicked
                    scope.treeMethods.selectNode = treeMethods.selectNode || function(selectedNode, parentNode) {
                        var i,
                            len,
                            siblings,
                            toSelect = true,
                            original = selectedNode.selected,
                            current = !original;
                        selectedNode.selected = current;
                        //toggleItem(selectedList, selectedListMap, selectedNode, current);
                        if(parentNode) { // check if need to select parentNode
                            siblings = parentNode.list;
                            for(i = 0, len = siblings.length; i < len; i++) {
                                if(siblings[i].selected !== true) {
                                    toSelect = false;
                                    break;
                                }
                            }
                            if(toSelect) { // parent couldn't be shop, no need to add to selectedList
                                parentNode.selected = true;
                            } else {
                                parentNode.selected = false;
                            }
                        }
                        toggleChildren(selectedNode, current);
                        //set currentNode
                        scope[treeId].currentNode = selectedNode;
                        log('cyTree:selectNode', scope.treeId);
                    };
                }

                log('cyTree:about to render tree, treeId is', scope.treeId);

                //Rendering template.
                element.html('').append($compile(template)(scope));

            }
        };
    }
]);

app.run(['$templateCache', function ($templateCache) {
    $templateCache.put('cy-tree-template/tree.html', 
        '<ul><li ng-repeat="node in treeData"><i class="css-icon" ng-if="node.list" ng-click="treeMethods.collapseNode(node)" ng-class="{\'icon-add\': node.collapsed, \'icon-minus\': !node.collapsed}"></i><i class="css-icon" ng-class="{\'icon-box\': node.selected, \'icon-success\': !node.selected}" ng-click="treeMethods.selectNode(node, parentNode)"></i><span>{{node.name}}</span></li></ul>');
}]);

})(angular);
