
'use strict';

;(function(angular) {

var app = angular.module('cyTree', []);

/**
 * @ngdoc service
 * @name cyTree.factory:cyTreeUnits
 * @description utils for cyTree
 */
app.service('cyTreeUtils', [function() {

    var uniqueTreeId = 0,
        prefix = 'cyTree',
        tplCache = {};

    // rules: for parent nodes
    /* 1. child not change, stop handling
     * 2. child selected --> nonSelected, parent selectedCount--, normal handling
     * 3. child selected --> partSelected, parent selectedCount--, (if count=0)special handling
     * 4. child partSelected --> nonSelected, parent (if selected, do nothing and stop handling)/(if partSelected, nonSelected)
     * 5. child partSelected --> selected, parent selectedCount++, normal handling
     * 6. child nonSelected --> selected, parent selectedCount++, normal handling
     * 7. child nonSelected --> partSelected, special handling
    */
    var nodeHandlingRules = {
        // parentNode must be partSelected/selected
        's2n': function(parentNode, children) {
            var status, 
                len, partSelectedCount = 0;
            parentNode.selectedCount--;
            if(parentNode.selected) {
                if(parentNode.selectedCount === 0) {
                    status = 's2n';
                    parentNode.nonSelected = true;
                } else {
                    status = 's2p';
                    parentNode.partSelected = true;
                }
                parentNode.selected = false;
            } else { // partSelected
                if(parentNode.selectedCount > 0) {
                    status = 'stable';
                } else {
                    len = children.length;
                    while(len--) {
                        if(children[len].partSelected) {
                            partSelectedCount++;
                        }
                    }
                    status = partSelectedCount > 0 ? 'stable' : 'p2n';
                }
                if(status === 'p2n') {
                    parentNode.partSelected = false;
                    parentNode.nonSelected = true;
                }
            }
            return status;
        },
        // parentNode must be partSelected/selected
        's2p': function(parentNode) { // selectedCount>=1
            var status;
            parentNode.selectedCount--;
            if(parentNode.selected) {
                status = 's2p';
            } else { // it is surly partSelected
                status = 'stable';
            }
            parentNode.partSelected = true;
            parentNode.selected = false;
            return status;
        },
        // parentNode must be partSelected
        'p2n': function(parentNode) {
            var status;
            if(parentNode.selectedCount === 0) {
                status = 'p2n';
                parentNode.partSelected = false;
                parentNode.nonSelected = true;
            } else { // it is still partSelected
                status = 'stable';
            }
            return status;
        },
        // parentNode must be partSelected
        'p2s': function(parentNode, children) {
            var status;
            parentNode.selectedCount++;
            if(parentNode.selectedCount === children.length) {
                status = 'p2s';
                parentNode.partSelected = false;
                parentNode.selected = true;
            } else { // it is still partSelected
                status = 'stable';
            }
            return status;
        },
        // parentNode can be partSelected/nonSelected
        'n2s': function(parentNode, children) {
            var status;
            parentNode.selectedCount++;
            if(parentNode.partSelected) { // still partSelected
                if(parentNode.selectedCount === children.length) {
                    status = 'p2s';
                    parentNode.selected = true;
                    parentNode.partSelected = false;
                } else {
                    status = 'stable';
                }
            } else { // parentNode is nonSelected
                parentNode.nonSelected = false;
                if(children.length > 1) {
                    parentNode.partSelected = true;
                    status = 'n2p';
                } else {
                    parentNode.selected = true;
                    status = 'n2s';
                }
            }
            return status;
        },
        // parentNode can be partSelected/nonSelected
        'n2p': function(parentNode, children) {
            var status;
            if(parentNode.partSelected) { // still partSelected
                status = 'stable';
            } else {
                parentNode.partSelected = true;
                parentNode.nonSelected = false;
                status = 'n2p';
            }
            return status;
        }
    };
    
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
     * @name cyTree.service:cyTreeUtils#getTreeCount
     * @methodOf cyTree.service:cyTreeUtils
     * @description trees count
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
     * @description iterate down tree data
     *
     * @param {array} array tree data
     * @param {string} childFlag child list property name
     * @param {object} parent parent node(if not exist, set null)
     * @param {function} callback when iterate treedata, invoke for every node
     * @param {function} stop whether stop iterating down for current node
     */
    this.iterateDown = downTree;
    
    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#iterateUp
     * @methodOf cyTree.service:cyTreeUtils
     * @description iterate up tree data
     *
     * @param {object} node node of tree data
     * @param {string} parentFlag parent property name, typically 'parent'
     * @param {function} callback when iterate treedata, invoke for every node
     * @param {function} stop whether stop iterating up
     */
    this.iterateUp = upTree;

    /**
     * @ngdoc method
     * @name cyTree.service:cyTreeUtils#templateCache
     * @methodOf cyTree.service:cyTreeUtils
     * @description get or set sub tree template
     *
     * @param {string} treeId tree id
     * @param {string} tpl optional template string, if exists, set template, otherwise, retrive template
     * @return {string} if tpl not exists, return the template correspond with treeId
     */
    this.templateCache = function(treeId, tpl) {
        if(typeof tpl === 'string') {
            tplCache[treeId] = tpl;
        } else {
            return tplCache[treeId];
        }
    }

    // handle node click, update parent nodes' status
    // Although the method is exposed, don't change it or invoke it directly unless you're experienced.
    this.handlingNodeUp = function(node, rule, parentFlag, childFlag) {
        upTree(node, parentFlag, function(parentNode, curNode) {
            if(!parentNode) {
                return;
            }
            rule = nodeHandlingRules[rule](parentNode, parentNode[childFlag]);
        }, function(parentNode, curNode) { // stop iteration condition
            return !parentNode || rule === 'stable';
        });
    }

}]);

/**
 * @ngdoc directive
 * @name cyTree.directive:cyTree
 * @restrict A
 *
 * @description
 * Directive that handle data, add behaviour and gen template
 */
app.directive('cyTree', ['$log', '$compile', 'cyTreeUtils',
    function($log, $compile, cyTreeUtils) {
        return {
            restrict: 'A',
            scope: true,
            priority: 1,
            compile: function(element, attrs) {
                var treeData = attrs.treeData;
                var treeChildFlag = attrs.treeChildFlag || 'list';
                var treeLabelFlag = attrs.treeLabelFlag || 'name';
                var debugMode = attrs.debugMode;
                var log = function () {
                    if (debugMode && $log.debug) {
                        $log.debug.apply(this, arguments);
                    }
                };

                var treeId = cyTreeUtils.genUniqueId();
                var subTemplate = cyTreeUtils.genTemplate('node.' + treeChildFlag, treeChildFlag, treeLabelFlag);
                cyTreeUtils.templateCache(treeId, subTemplate);

                log('cyTree:generate template and cache it', treeId);

                return {
                    pre: function(scope, element, attrs, ctrl) {
                        var treeMethods = scope.treeMethods = {};
                        var treeInfo = scope.treeInfo = {};
                        var keepRawData = false; // currently set to false
                        var watch;

                        treeInfo.treeId = treeId;

                        if(!keepRawData) {
                            watch = scope.$watch(treeData, function(newData, oldData) {
                                if(newData !== undefined) {
                                    log('cyTree:about to handle raw data', newData);
                                    watch(); // remove watch;
                                    cyTreeUtils.iterateDown(scope[treeData], treeChildFlag, null, function(item, parent, children) {
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

                        //collapse or Expand node when collapse icon clicked
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

                            log('cyTree:about to select node', node);

                            var nonSelected = node.nonSelected,
                                toSelect,
                                rule;

                            // rules: for node clicked
                            // 1. selected, partSelected = true; --> nonSelected = true;
                            // 2. nonSelected = true; --> selected = true;
                            if(nonSelected) {
                                toSelect = true;
                                node.selected = true;
                                node.nonSelected = false;
                                rule = 'n2s';
                                node.selectedCount = node[treeChildFlag] ? node[treeChildFlag].length : 0;
                            } else {
                                toSelect = false;
                                rule = node.selected ? 's2n' : 'p2n';
                                node.nonSelected = true;
                                node.selected = false;
                                node.selectedCount = 0;
                            }
                            node.partSelected = false;

                            treeInfo.currentSelectedNode = node;
                            
                            cyTreeUtils.handlingNodeUp(node, rule, 'parent', treeChildFlag);

                            if(node.leafNode) {
                                return;
                            }

                            // rules: for child nodes
                            // 1. just the same status with current node
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

                    }
                }

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

                function setNodePartSelected(node) {
                    node.partSelected = true;
                    node.selected = false;
                    node.nonSelected = false;
                }
            }
        };
    }
]);

/**
 * @ngdoc directive
 * @name cyTree.directive:treeData
 * @restrict A
 *
 * @description
 * Directive that generate tree recursively
 */
app.directive('treeData', ['$q', '$log', '$compile', 'cyTreeUtils',

    function($q, $log, $compile, cyTreeUtils) {

        var isSubTree = false;

        return {
            restrict: 'A',
            scope: true,
            link: function(scope, element, attrs) {

                var treeTemplate = isSubTree ? cyTreeUtils.templateCache(scope.treeInfo.treeId) : 
                    cyTreeUtils.genTemplate(attrs.treeData, attrs.treeChildFlag || 'list', attrs.treeLabelFlag || 'name');

                //Rendering template.
                element.append($compile(treeTemplate)(scope));

            }
        };
    }
]);

})(angular);
