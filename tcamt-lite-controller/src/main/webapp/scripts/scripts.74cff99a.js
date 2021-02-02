/*
 *
 * Copyright (c) 2011-2014- Justin Dearing (zippy1981@gmail.com)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) version 2 licenses.
 * This software is not distributed under version 3 or later of the GPL.
 *
 * Version 1.0.2
 *
 */

if (!document) var document = { cookie: '' }; // fix crashes on node

/**
 * Javascript class that mimics how WCF serializes a object of type MongoDB.Bson.ObjectId
 * and converts between that format and the standard 24 character representation.
 */
var ObjectId = (function () {
    var increment = Math.floor(Math.random() * (16777216));
    var pid = Math.floor(Math.random() * (65536));
    var machine = Math.floor(Math.random() * (16777216));

    var setMachineCookie = function() {
        var cookieList = document.cookie.split('; ');
        for (var i in cookieList) {
            var cookie = cookieList[i].split('=');
            var cookieMachineId = parseInt(cookie[1], 10);
            if (cookie[0] == 'mongoMachineId' && cookieMachineId && cookieMachineId >= 0 && cookieMachineId <= 16777215) {
                machine = cookieMachineId;
                break;
            }
        }
        document.cookie = 'mongoMachineId=' + machine + ';expires=Tue, 19 Jan 2038 05:00:00 GMT;path=/';
    };
    if (typeof (localStorage) != 'undefined') {
        try {
            var mongoMachineId = parseInt(localStorage['mongoMachineId']);
            if (mongoMachineId >= 0 && mongoMachineId <= 16777215) {
                machine = Math.floor(localStorage['mongoMachineId']);
            }
            // Just always stick the value in.
            localStorage['mongoMachineId'] = machine;
        } catch (e) {
            setMachineCookie();
        }
    }
    else {
        setMachineCookie();
    }

    function ObjId() {
        if (!(this instanceof ObjectId)) {
            return new ObjectId(arguments[0], arguments[1], arguments[2], arguments[3]).toString();
        }

        if (typeof (arguments[0]) == 'object') {
            this.timestamp = arguments[0].timestamp;
            this.machine = arguments[0].machine;
            this.pid = arguments[0].pid;
            this.increment = arguments[0].increment;
        }
        else if (typeof (arguments[0]) == 'string' && arguments[0].length == 24) {
            this.timestamp = Number('0x' + arguments[0].substr(0, 8)),
                this.machine = Number('0x' + arguments[0].substr(8, 6)),
                this.pid = Number('0x' + arguments[0].substr(14, 4)),
                this.increment = Number('0x' + arguments[0].substr(18, 6))
        }
        else if (arguments.length == 4 && arguments[0] != null) {
            this.timestamp = arguments[0];
            this.machine = arguments[1];
            this.pid = arguments[2];
            this.increment = arguments[3];
        }
        else {
            this.timestamp = Math.floor(new Date().valueOf() / 1000);
            this.machine = machine;
            this.pid = pid;
            this.increment = increment++;
            if (increment > 0xffffff) {
                increment = 0;
            }
        }
    };
    return ObjId;
})();

ObjectId.prototype.getDate = function () {
    return new Date(this.timestamp * 1000);
};

ObjectId.prototype.toArray = function () {
    var strOid = this.toString();
    var array = [];
    var i;
    for(i = 0; i < 12; i++) {
        array[i] = parseInt(strOid.slice(i*2, i*2+2), 16);
    }
    return array;
};

/**
 * Turns a WCF representation of a BSON ObjectId into a 24 character string representation.
 */
ObjectId.prototype.toString = function () {
    if (this.timestamp === undefined
        || this.machine === undefined
        || this.pid === undefined
        || this.increment === undefined) {
        return 'Invalid ObjectId';
    }

    var timestamp = this.timestamp.toString(16);
    var machine = this.machine.toString(16);
    var pid = this.pid.toString(16);
    var increment = this.increment.toString(16);
    return '00000000'.substr(0, 8 - timestamp.length) + timestamp +
        '000000'.substr(0, 6 - machine.length) + machine +
        '0000'.substr(0, 4 - pid.length) + pid +
        '000000'.substr(0, 6 - increment.length) + increment;
};

(function() {
"use strict";

angular.module('ngTreetable', [])

    /**
     * @ngdoc service
     */
    .factory('ngTreetableParams', ['$log', function($log) {
        var params = function(baseConfiguration) {
            var self = this;

            /**
             * @ngdoc method
             * @param {<any>} parent A parent node to fetch children of, or null if fetching root nodes.
             */
            this.getNodes = function(parent) {}

            /**
             * @ngdoc method
             * @param {<any>} node A node returned from getNodes
             */
            this.getTemplate = function(node) {}

            /**
             * @ngdoc property
             */
            this.options = {};

            /**
             * @ngdoc method
             */
            this.refresh = function() {}


            if (angular.isObject(baseConfiguration)) {
                angular.forEach(baseConfiguration, function(val, key) {
                    if (['getNodes', 'getTemplate', 'options'].indexOf(key) > -1) {
                        self[key] = val;
                    } else {
                        $log.warn('ngTreetableParams - Ignoring unexpected property "' + key + '".');
                    }
                });
            }

        }
        return params;
    }])

    .controller('TreetableController', ['$scope', '$element', '$compile', '$templateCache', '$q', '$http', function($scope, $element, $compile, $templateCache, $q, $http) {

        var params = $scope.ttParams;
        var table = $element;

        $scope.compileElement = function(node, parentId, parentNode) {
            var tpl = params.getTemplate(node);

            var templatePromise = $http.get(params.getTemplate(node), {cache: $templateCache}).then(function(result) {
                return result.data;
            });

            return templatePromise.then(function(template) {
                var template_scope = $scope.$parent.$new();
                angular.extend(template_scope, {
                    node: node,
                    parentNode: parentNode
                });
                template_scope._ttParentId = parentId;
                return $compile(template)(template_scope).get(0);
            })

        }

        /**
         * Expands the given node.
         * @param parentElement the parent node element, or null for the root
         * @param shouldExpand whether all descendants of `parentElement` should also be expanded
         */
        $scope.addChildren = function(parentElement, shouldExpand) {
            var parentNode = parentElement ? parentElement.scope().node : null;
            var parentId = parentElement ? parentElement.data('ttId') : null;

            if (parentElement) {
                parentElement.scope().loading = true;
            }

            $q.when(params.getNodes(parentNode)).then(function(data) {
                var elementPromises = [];
                angular.forEach(data, function(node) {
                    elementPromises.push($scope.compileElement(node, parentId, parentNode));
                });

                $q.all(elementPromises).then(function(newElements) {
                    var parentTtNode = parentId != null ? table.treetable("node", parentId) : null;

                    $element.treetable('loadBranch', parentTtNode, newElements);

                    if (shouldExpand) {
                        angular.forEach(newElements, function(el) {
                            $scope.addChildren($(el), shouldExpand);
                        });
                    }

                    if (parentElement) {
                        parentElement.scope().loading = false;
                    }
                });

            });
        }

        /**
         * Callback for onNodeExpand to add nodes.
         */
        $scope.onNodeExpand = function() {
            if (this.row.scope().loading) return; // make sure we're not already loading
            table.treetable('unloadBranch', this); // make sure we don't double-load
            $scope.addChildren(this.row, $scope.shouldExpand());
        }

        /**
         * Callback for onNodeCollapse to remove nodes.
         */
        $scope.onNodeCollapse = function() {
            if (this.row.scope().loading) return; // make sure we're not already loading
            table.treetable('unloadBranch', this);
        }

        /**
         * Rebuilds the entire table.
         */
        $scope.refresh = function() {
            var rootNodes = table.data('treetable').nodes;
            while (rootNodes.length > 0) {
                table.treetable('removeNode', rootNodes[0].id);
            }
            $scope.addChildren(null, $scope.shouldExpand());
        }

        // attach to params for convenience
        params.refresh = $scope.refresh;


        /**
         * Build options for the internal treetable library.
         */
        $scope.getOptions = function() {
            var opts = angular.extend({
                expandable: true,
                onNodeExpand: $scope.onNodeExpand,
                onNodeCollapse: $scope.onNodeCollapse
            }, params.options);

            if (params.options) {
                // Inject required event handlers before custom ones
                angular.forEach(['onNodeCollapse', 'onNodeExpand'], function(event) {
                    if (params.options[event]) {
                        opts[event] = function() {
                            $scope[event].apply(this, arguments);
                            params.options[event].apply(this, arguments);
                        }
                    }
                });
            }

            return opts;
        }

        $scope.shouldExpand = function() {
            return $scope.options.initialState === 'expanded';
        }

        $scope.options = $scope.getOptions();
        table.treetable($scope.options);
        $scope.addChildren(null, $scope.shouldExpand());

    }])

    .directive('ttTable', [function() {
        return {
            restrict: 'AC',
            scope: {
                ttParams: '='
            },
            controller: 'TreetableController'
        }
    }])

    .directive('ttNode', [function() {
        var ttNodeCounter = 0;
        return {
            restrict: 'AC',
            scope: {
                isBranch: '=',
                parent: '='
            },
            link: function(scope, element, attrs) {
                var branch = angular.isDefined(scope.isBranch) ? scope.isBranch : true;

                // Look for a parent set by the tt-tree directive if one isn't explicitly set
                var parent = angular.isDefined(scope.parent) ? scope.parent : scope.$parent._ttParentId;

                element.attr('data-tt-id', ttNodeCounter++);
                element.attr('data-tt-branch', branch);
                element.attr('data-tt-parent-id', parent);
            }
        }

    }]);

})();

/**
 * angular-treetable
 * @version v0.3.1 - 2014-12-07
 * @link http://github.com/garrettheel/angular-treetable
 * @author Garrett Heel (garrettheel@gmail.com)
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
!function(){"use strict";angular.module("ngTreetable",[]).factory("ngTreetableParams",["$log",function(a){var b=function(b){var c=this;this.getNodes=function(){},this.getTemplate=function(){},this.options={},this.refresh=function(){},angular.isObject(b)&&angular.forEach(b,function(b,d){["getNodes","getTemplate","options"].indexOf(d)>-1?c[d]=b:a.warn('ngTreetableParams - Ignoring unexpected property "'+d+'".')})};return b}]).controller("TreetableController",["$scope","$element","$compile","$templateCache","$q","$http",function(a,b,c,d,e,f){var g=a.ttParams,h=b;a.compileElement=function(b,e,h){var i=(g.getTemplate(b),f.get(g.getTemplate(b),{cache:d}).then(function(a){return a.data}));return i.then(function(d){var f=a.$parent.$new();return angular.extend(f,{node:b,parentNode:h}),f._ttParentId=e,c(d)(f).get(0)})},a.addChildren=function(c,d){var f=c?c.scope().node:null,i=c?c.data("ttId"):null;c&&(c.scope().loading=!0),e.when(g.getNodes(f)).then(function(g){var j=[];angular.forEach(g,function(b){j.push(a.compileElement(b,i,f))}),e.all(j).then(function(e){var f=null!=i?h.treetable("node",i):null;b.treetable("loadBranch",f,e),d&&angular.forEach(e,function(b){a.addChildren($(b),d)}),c&&(c.scope().loading=!1)})})},a.onNodeExpand=function(){this.row.scope().loading||(h.treetable("unloadBranch",this),a.addChildren(this.row,a.shouldExpand()))},a.onNodeCollapse=function(){this.row.scope().loading||h.treetable("unloadBranch",this)},a.refresh=function(){for(var b=h.data("treetable").nodes;b.length>0;)h.treetable("removeNode",b[0].id);a.addChildren(null,a.shouldExpand())},g.refresh=a.refresh,a.getOptions=function(){var b=angular.extend({expandable:!0,onNodeExpand:a.onNodeExpand,onNodeCollapse:a.onNodeCollapse},g.options);return g.options&&angular.forEach(["onNodeCollapse","onNodeExpand"],function(c){g.options[c]&&(b[c]=function(){a[c].apply(this,arguments),g.options[c].apply(this,arguments)})}),b},a.shouldExpand=function(){return"expanded"===a.options.initialState},a.options=a.getOptions(),h.treetable(a.options),a.addChildren(null,a.shouldExpand())}]).directive("ttTable",[function(){return{restrict:"AC",scope:{ttParams:"="},controller:"TreetableController"}}]).directive("ttNode",[function(){var a=0;return{restrict:"AC",scope:{isBranch:"=",parent:"="},link:function(b,c){var d=angular.isDefined(b.isBranch)?b.isBranch:!0,e=angular.isDefined(b.parent)?b.parent:b.$parent._ttParentId;c.attr("data-tt-id",a++),c.attr("data-tt-branch",d),c.attr("data-tt-parent-id",e)}}}])}();
/*
 * jQuery treetable Plugin 3.1.0
 * http://ludo.cubicphuse.nl/jquery-treetable
 *
 * Copyright 2013, Ludo van den Boom
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function() {
    var $, Node, Tree, methods;

    $ = jQuery;

    Node = (function() {
        function Node(row, tree, settings) {
            var parentId;

            this.row = row;
            this.tree = tree;
            this.settings = settings;

            // TODO Ensure id/parentId is always a string (not int)
            this.id = this.row.data(this.settings.nodeIdAttr);

            // TODO Move this to a setParentId function?
            parentId = this.row.data(this.settings.parentIdAttr);
            if (parentId != null && parentId !== "") {
                this.parentId = parentId;
            }

            this.treeCell = $(this.row.children(this.settings.columnElType)[this.settings.column]);
            this.expander = $(this.settings.expanderTemplate);
            this.indenter = $(this.settings.indenterTemplate);
            this.children = [];
            this.initialized = false;
            this.treeCell.prepend(this.indenter);
        }

        Node.prototype.addChild = function(child) {
            return this.children.push(child);
        };

        Node.prototype.ancestors = function() {
            var ancestors, node;
            node = this;
            ancestors = [];
            while (node = node.parentNode()) {
                ancestors.push(node);
            }
            return ancestors;
        };

        Node.prototype.collapse = function() {
            if (this.collapsed()) {
                return this;
            }

            this.row.removeClass("expanded").addClass("collapsed");

            this._hideChildren();
            this.expander.attr("title", this.settings.stringExpand);

            if (this.initialized && this.settings.onNodeCollapse != null) {
                this.settings.onNodeCollapse.apply(this);
            }

            return this;
        };

        Node.prototype.collapsed = function() {
            return this.row.hasClass("collapsed");
        };

        // TODO destroy: remove event handlers, expander, indenter, etc.

        Node.prototype.expand = function() {
            if (this.expanded()) {
                return this;
            }

            this.row.removeClass("collapsed").addClass("expanded");

            if (this.initialized && this.settings.onNodeExpand != null) {
                this.settings.onNodeExpand.apply(this);
            }

            if ($(this.row).is(":visible")) {
                this._showChildren();
            }

            this.expander.attr("title", this.settings.stringCollapse);

            return this;
        };

        Node.prototype.expanded = function() {
            return this.row.hasClass("expanded");
        };

        Node.prototype.hide = function() {
            this._hideChildren();
            this.row.hide();
            return this;
        };

        Node.prototype.isBranchNode = function() {
            if(this.children.length > 0 || this.row.data(this.settings.branchAttr) === true) {
                return true;
            } else {
                return false;
            }
        };

        Node.prototype.updateBranchLeafClass = function(){
            this.row.removeClass('branch');
            this.row.removeClass('leaf');
            this.row.addClass(this.isBranchNode() ? 'branch' : 'leaf');
        };

        Node.prototype.level = function() {
            return this.ancestors().length;
        };

        Node.prototype.parentNode = function() {
            if (this.parentId != null) {
                return this.tree[this.parentId];
            } else {
                return null;
            }
        };

        Node.prototype.removeChild = function(child) {
            var i = $.inArray(child, this.children);
            return this.children.splice(i, 1)
        };

        Node.prototype.render = function() {
            var handler,
                settings = this.settings,
                target;

            if (settings.expandable === true && this.isBranchNode()) {
                handler = function(e) {
                    $(this).parents("table").treetable("node", $(this).parents("tr").data(settings.nodeIdAttr)).toggle();
                    return e.preventDefault();
                };

                this.indenter.html(this.expander);
                target = settings.clickableNodeNames === true ? this.treeCell : this.expander;

                target.off("click.treetable").on("click.treetable", handler);
                target.off("keydown.treetable").on("keydown.treetable", function(e) {
                    if (e.keyCode == 13) {
                        handler.apply(this, [e]);
                    }
                });
            }

            this.indenter[0].style.paddingLeft = "" + (this.level() * settings.indent) + "px";

            return this;
        };

        Node.prototype.reveal = function() {
            if (this.parentId != null) {
                this.parentNode().reveal();
            }
            return this.expand();
        };

        Node.prototype.setParent = function(node) {
            if (this.parentId != null) {
                this.tree[this.parentId].removeChild(this);
            }
            this.parentId = node.id;
            this.row.data(this.settings.parentIdAttr, node.id);
            return node.addChild(this);
        };

        Node.prototype.show = function() {
            if (!this.initialized) {
                this._initialize();
            }
            this.row.show();
            if (this.expanded()) {
                this._showChildren();
            }
            return this;
        };

        Node.prototype.toggle = function() {
            if (this.expanded()) {
                this.collapse();
            } else {
                this.expand();
            }
            return this;
        };

        Node.prototype._hideChildren = function() {
            var child, _i, _len, _ref, _results;
            _ref = this.children;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                _results.push(child.hide());
            }
            return _results;
        };

        Node.prototype._initialize = function() {
            var settings = this.settings;

            this.render();

            if (settings.expandable === true && settings.initialState === "collapsed") {
                this.collapse();
            } else {
                this.expand();
            }

            if (settings.onNodeInitialized != null) {
                settings.onNodeInitialized.apply(this);
            }

            return this.initialized = true;
        };

        Node.prototype._showChildren = function() {
            var child, _i, _len, _ref, _results;
            _ref = this.children;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                _results.push(child.show());
            }
            return _results;
        };

        return Node;
    })();

    Tree = (function() {
        function Tree(table, settings) {
            this.table = table;
            this.settings = settings;
            this.tree = {};

            // Cache the nodes and roots in simple arrays for quick access/iteration
            this.nodes = [];
            this.roots = [];
        }

        Tree.prototype.collapseAll = function() {
            var node, _i, _len, _ref, _results;
            _ref = this.nodes;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                _results.push(node.collapse());
            }
            return _results;
        };

        Tree.prototype.expandAll = function() {
            var node, _i, _len, _ref, _results;
            _ref = this.nodes;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                _results.push(node.expand());
            }
            return _results;
        };

        Tree.prototype.findLastNode = function (node) {
            if (node.children.length > 0) {
                return this.findLastNode(node.children[node.children.length - 1]);
            } else {
                return node;
            }
        };

        Tree.prototype.loadRows = function(rows) {
            var node, row, i;

            if (rows != null) {
                for (i = 0; i < rows.length; i++) {
                    row = $(rows[i]);

                    if (row.data(this.settings.nodeIdAttr) != null) {
                        node = new Node(row, this.tree, this.settings);
                        this.nodes.push(node);
                        this.tree[node.id] = node;

                        if (node.parentId != null) {
                            this.tree[node.parentId].addChild(node);
                        } else {
                            this.roots.push(node);
                        }
                    }
                }
            }

            for (i = 0; i < this.nodes.length; i++) {
                node = this.nodes[i].updateBranchLeafClass();
            }

            return this;
        };

        Tree.prototype.move = function(node, destination) {
            // Conditions:
            // 1: +node+ should not be inserted as a child of +node+ itself.
            // 2: +destination+ should not be the same as +node+'s current parent (this
            //    prevents +node+ from being moved to the same location where it already
            //    is).
            // 3: +node+ should not be inserted in a location in a branch if this would
            //    result in +node+ being an ancestor of itself.
            var nodeParent = node.parentNode();
            if (node !== destination && destination.id !== node.parentId && $.inArray(node, destination.ancestors()) === -1) {
                node.setParent(destination);
                this._moveRows(node, destination);

                // Re-render parentNode if this is its first child node, and therefore
                // doesn't have the expander yet.
                if (node.parentNode().children.length === 1) {
                    node.parentNode().render();
                }
            }

            if(nodeParent){
                nodeParent.updateBranchLeafClass();
            }
            if(node.parentNode()){
                node.parentNode().updateBranchLeafClass();
            }
            node.updateBranchLeafClass();
            return this;
        };

        Tree.prototype.removeNode = function(node) {
            // Recursively remove all descendants of +node+
            this.unloadBranch(node);

            // Remove node from DOM (<tr>)
            node.row.remove();

            // Clean up Tree object (so Node objects are GC-ed)
            delete this.tree[node.id];
            this.nodes.splice($.inArray(node, this.nodes), 1);
        }

        Tree.prototype.render = function() {
            var root, _i, _len, _ref;
            _ref = this.roots;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                root = _ref[_i];

                // Naming is confusing (show/render). I do not call render on node from
                // here.
                root.show();
            }
            return this;
        };

        Tree.prototype.sortBranch = function(node, sortFun) {
            // First sort internal array of children
            node.children.sort(sortFun);

            // Next render rows in correct order on page
            this._sortChildRows(node);

            return this;
        };

        Tree.prototype.unloadBranch = function(node) {
            var children, i;

            for (i = 0; i < node.children.length; i++) {
                this.removeNode(node.children[i]);
            }

            // Reset node's collection of children
            node.children = [];

            node.updateBranchLeafClass();

            return this;
        };

        Tree.prototype._moveRows = function(node, destination) {
            var children = node.children, i;

            node.row.insertAfter(destination.row);
            node.render();

            // Loop backwards through children to have them end up on UI in correct
            // order (see #112)
            for (i = children.length - 1; i >= 0; i--) {
                this._moveRows(children[i], node);
            }
        };

        // Special _moveRows case, move children to itself to force sorting
        Tree.prototype._sortChildRows = function(parentNode) {
            return this._moveRows(parentNode, parentNode);
        };

        return Tree;
    })();

    // jQuery Plugin
    methods = {
        init: function(options, force) {
            var settings;

            settings = $.extend({
                branchAttr: "ttBranch",
                clickableNodeNames: false,
                column: 0,
                columnElType: "td", // i.e. 'td', 'th' or 'td,th'
                expandable: false,
                expanderTemplate: "<a href='#'>&nbsp;</a>",
                indent: 19,
                indenterTemplate: "<span class='indenter'></span>",
                initialState: "collapsed",
                nodeIdAttr: "ttId", // maps to data-tt-id
                parentIdAttr: "ttParentId", // maps to data-tt-parent-id
                stringExpand: "Expand",
                stringCollapse: "Collapse",

                // Events
                onInitialized: null,
                onNodeCollapse: null,
                onNodeExpand: null,
                onNodeInitialized: null
            }, options);

            return this.each(function() {
                var el = $(this), tree;

                if (force || el.data("treetable") === undefined) {
                    tree = new Tree(this, settings);
                    tree.loadRows(this.rows).render();

                    el.addClass("treetable").data("treetable", tree);

                    if (settings.onInitialized != null) {
                        settings.onInitialized.apply(tree);
                    }
                }

                return el;
            });
        },

        destroy: function() {
            return this.each(function() {
                return $(this).removeData("treetable").removeClass("treetable");
            });
        },

        collapseAll: function() {
            this.data("treetable").collapseAll();
            return this;
        },

        collapseNode: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                node.collapse();
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        expandAll: function() {
            this.data("treetable").expandAll();
            return this;
        },

        expandNode: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                if (!node.initialized) {
                    node._initialize();
                }

                node.expand();
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        loadBranch: function(node, rows) {
            var settings = this.data("treetable").settings,
                tree = this.data("treetable").tree;

            // TODO Switch to $.parseHTML
            rows = $(rows);

            if (node == null) { // Inserting new root nodes
                this.append(rows);
            } else {
                var lastNode = this.data("treetable").findLastNode(node);
                rows.insertAfter(lastNode.row);
            }

            this.data("treetable").loadRows(rows);

            // Make sure nodes are properly initialized
            rows.filter("tr").each(function() {
                tree[$(this).data(settings.nodeIdAttr)].show();
            });

            if (node != null) {
                // Re-render parent to ensure expander icon is shown (#79)
                node.render().expand();
            }

            return this;
        },

        move: function(nodeId, destinationId) {
            var destination, node;

            node = this.data("treetable").tree[nodeId];
            destination = this.data("treetable").tree[destinationId];
            this.data("treetable").move(node, destination);

            return this;
        },

        node: function(id) {
            return this.data("treetable").tree[id];
        },

        removeNode: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                this.data("treetable").removeNode(node);
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        reveal: function(id) {
            var node = this.data("treetable").tree[id];

            if (node) {
                node.reveal();
            } else {
                throw new Error("Unknown node '" + id + "'");
            }

            return this;
        },

        sortBranch: function(node, columnOrFunction) {
            var settings = this.data("treetable").settings,
                prepValue,
                sortFun;

            columnOrFunction = columnOrFunction || settings.column;
            sortFun = columnOrFunction;

            if ($.isNumeric(columnOrFunction)) {
                sortFun = function(a, b) {
                    var extractValue, valA, valB;

                    extractValue = function(node) {
                        var val = node.row.find("td:eq(" + columnOrFunction + ")").text();
                        // Ignore trailing/leading whitespace and use uppercase values for
                        // case insensitive ordering
                        return $.trim(val).toUpperCase();
                    }

                    valA = extractValue(a);
                    valB = extractValue(b);

                    if (valA < valB) return -1;
                    if (valA > valB) return 1;
                    return 0;
                };
            }

            this.data("treetable").sortBranch(node, sortFun);
            return this;
        },

        unloadBranch: function(node) {
            this.data("treetable").unloadBranch(node);
            return this;
        }
    };

    $.fn.treetable = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            return $.error("Method " + method + " does not exist on jQuery.treetable");
        }
    };

    // Expose classes to world
    this.TreeTable || (this.TreeTable = {});
    this.TreeTable.Node = Node;
    this.TreeTable.Tree = Tree;
}).call(this);
/*
 * jQuery File Download Plugin v1.4.3
 *
 * http://www.johnculviner.com
 *
 * Copyright (c) 2013 - John Culviner
 *
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * !!!!NOTE!!!!
 * You must also write a cookie in conjunction with using this plugin as mentioned in the orignal post:
 * http://johnculviner.com/jquery-file-download-plugin-for-ajax-like-feature-rich-file-downloads/
 * !!!!NOTE!!!!
 */

(function($, window){
    // i'll just put them here to get evaluated on script load
    var htmlSpecialCharsRegEx = /[<>&\r\n"']/gm;
    var htmlSpecialCharsPlaceHolders = {
        '<': 'lt;',
        '>': 'gt;',
        '&': 'amp;',
        '\r': "#13;",
        '\n': "#10;",
        '"': 'quot;',
        "'": '#39;' /*single quotes just to be safe, IE8 doesn't support &apos;, so use &#39; instead */
    };

    $.extend({
        //
        //$.fileDownload('/path/to/url/', options)
        //  see directly below for possible 'options'
        fileDownload: function (fileUrl, options) {

            //provide some reasonable defaults to any unspecified options below
            var settings = $.extend({

                //
                //Requires jQuery UI: provide a message to display to the user when the file download is being prepared before the browser's dialog appears
                //
                preparingMessageHtml: null,

                //
                //Requires jQuery UI: provide a message to display to the user when a file download fails
                //
                failMessageHtml: null,

                //
                //the stock android browser straight up doesn't support file downloads initiated by a non GET: http://code.google.com/p/android/issues/detail?id=1780
                //specify a message here to display if a user tries with an android browser
                //if jQuery UI is installed this will be a dialog, otherwise it will be an alert
                //Set to null to disable the message and attempt to download anyway
                //
                androidPostUnsupportedMessageHtml: "Unfortunately your Android browser doesn't support this type of file download. Please try again with a different browser.",

                //
                //Requires jQuery UI: options to pass into jQuery UI Dialog
                //
                dialogOptions: { modal: true },

                //
                //a function to call while the dowload is being prepared before the browser's dialog appears
                //Args:
                //  url - the original url attempted
                //
                prepareCallback: function (url) { },

                //
                //a function to call after a file download dialog/ribbon has appeared
                //Args:
                //  url - the original url attempted
                //
                successCallback: function (url) { },

                //
                //a function to call after a file download dialog/ribbon has appeared
                //Args:
                //  responseHtml    - the html that came back in response to the file download. this won't necessarily come back depending on the browser.
                //                      in less than IE9 a cross domain error occurs because 500+ errors cause a cross domain issue due to IE subbing out the
                //                      server's error message with a "helpful" IE built in message
                //  url             - the original url attempted
                //
                failCallback: function (responseHtml, url) { },

                //
                // the HTTP method to use. Defaults to "GET".
                //
                httpMethod: "GET",

                //
                // if specified will perform a "httpMethod" request to the specified 'fileUrl' using the specified data.
                // data must be an object (which will be $.param serialized) or already a key=value param string
                //
                data: null,

                //
                //a period in milliseconds to poll to determine if a successful file download has occured or not
                //
                checkInterval: 100,

                //
                //the cookie name to indicate if a file download has occured
                //
                cookieName: "fileDownload",

                //
                //the cookie value for the above name to indicate that a file download has occured
                //
                cookieValue: "true",

                //
                //the cookie path for above name value pair
                //
                cookiePath: "/",

                //
                //if specified it will be used when attempting to clear the above name value pair
                //useful for when downloads are being served on a subdomain (e.g. downloads.example.com)
                //
                cookieDomain: null,

                //
                //the title for the popup second window as a download is processing in the case of a mobile browser
                //
                popupWindowTitle: "Initiating file download...",

                //
                //Functionality to encode HTML entities for a POST, need this if data is an object with properties whose values contains strings with quotation marks.
                //HTML entity encoding is done by replacing all &,<,>,',",\r,\n characters.
                //Note that some browsers will POST the string htmlentity-encoded whilst others will decode it before POSTing.
                //It is recommended that on the server, htmlentity decoding is done irrespective.
                //
                encodeHTMLEntities: true

            }, options);

            var deferred = new $.Deferred();

            //Setup mobile browser detection: Partial credit: http://detectmobilebrowser.com/
            var userAgent = (navigator.userAgent || navigator.vendor || window.opera).toLowerCase();

            var isIos;                  //has full support of features in iOS 4.0+, uses a new window to accomplish this.
            var isAndroid;              //has full support of GET features in 4.0+ by using a new window. Non-GET is completely unsupported by the browser. See above for specifying a message.
            var isOtherMobileBrowser;   //there is no way to reliably guess here so all other mobile devices will GET and POST to the current window.

            if (/ip(ad|hone|od)/.test(userAgent)) {

                isIos = true;

            } else if (userAgent.indexOf('android') !== -1) {

                isAndroid = true;

            } else {

                isOtherMobileBrowser = /avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|playbook|silk|iemobile|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));

            }

            var httpMethodUpper = settings.httpMethod.toUpperCase();

            if (isAndroid && httpMethodUpper !== "GET" && settings.androidPostUnsupportedMessageHtml) {
                //the stock android browser straight up doesn't support file downloads initiated by non GET requests: http://code.google.com/p/android/issues/detail?id=1780

                if ($().dialog) {
                    $("<div>").html(settings.androidPostUnsupportedMessageHtml).dialog(settings.dialogOptions);
                } else {
                    alert(settings.androidPostUnsupportedMessageHtml);
                }

                return deferred.reject();
            }

            var $preparingDialog = null;

            var internalCallbacks = {

                onPrepare: function (url) {

                    //wire up a jquery dialog to display the preparing message if specified
                    if (settings.preparingMessageHtml) {

                        $preparingDialog = $("<div>").html(settings.preparingMessageHtml).dialog(settings.dialogOptions);

                    } else if (settings.prepareCallback) {

                        settings.prepareCallback(url);

                    }

                },

                onSuccess: function (url) {

                    //remove the perparing message if it was specified
                    if ($preparingDialog) {
                        $preparingDialog.dialog('close');
                    }

                    settings.successCallback(url);

                    deferred.resolve(url);
                },

                onFail: function (responseHtml, url) {

                    //remove the perparing message if it was specified
                    if ($preparingDialog) {
                        $preparingDialog.dialog('close');
                    }

                    //wire up a jquery dialog to display the fail message if specified
                    if (settings.failMessageHtml) {
                        $("<div>").html(settings.failMessageHtml).dialog(settings.dialogOptions);
                    }

                    settings.failCallback(responseHtml, url);

                    deferred.reject(responseHtml, url);
                }
            };

            internalCallbacks.onPrepare(fileUrl);

            //make settings.data a param string if it exists and isn't already
            if (settings.data !== null && typeof settings.data !== "string") {
                settings.data = $.param(settings.data);
            }


            var $iframe,
                downloadWindow,
                formDoc,
                $form;

            if (httpMethodUpper === "GET") {

                if (settings.data !== null) {
                    //need to merge any fileUrl params with the data object

                    var qsStart = fileUrl.indexOf('?');

                    if (qsStart !== -1) {
                        //we have a querystring in the url

                        if (fileUrl.substring(fileUrl.length - 1) !== "&") {
                            fileUrl = fileUrl + "&";
                        }
                    } else {

                        fileUrl = fileUrl + "?";
                    }

                    fileUrl = fileUrl + settings.data;
                }

                if (isIos || isAndroid) {

                    downloadWindow = window.open(fileUrl);
                    downloadWindow.document.title = settings.popupWindowTitle;
                    window.focus();

                } else if (isOtherMobileBrowser) {

                    window.location(fileUrl);

                } else {

                    //create a temporary iframe that is used to request the fileUrl as a GET request
                    $iframe = $("<iframe>")
                        .hide()
                        .prop("src", fileUrl)
                        .appendTo("body");
                }

            } else {

                var formInnerHtml = "";

                if (settings.data !== null) {

                    $.each(settings.data.replace(/\+/g, ' ').split("&"), function () {

                        var kvp = this.split("=");

                        var key = settings.encodeHTMLEntities ? htmlSpecialCharsEntityEncode(decodeURIComponent(kvp[0])) : decodeURIComponent(kvp[0]);
                        if (key) {
                            var value = settings.encodeHTMLEntities ? htmlSpecialCharsEntityEncode(decodeURIComponent(kvp[1])) : decodeURIComponent(kvp[1]);
                            formInnerHtml += '<input type="hidden" name="' + key + '" value="' + value + '" />';
                        }
                    });
                }

                if (isOtherMobileBrowser) {

                    $form = $("<form>").appendTo("body");
                    $form.hide()
                        .prop('method', settings.httpMethod)
                        .prop('action', fileUrl)
                        .html(formInnerHtml);

                } else {

                    if (isIos) {

                        downloadWindow = window.open("about:blank");
                        downloadWindow.document.title = settings.popupWindowTitle;
                        formDoc = downloadWindow.document;
                        window.focus();

                    } else {

                        $iframe = $("<iframe style='display: none' src='about:blank'></iframe>").appendTo("body");
                        formDoc = getiframeDocument($iframe);
                    }

                    formDoc.write("<html><head></head><body><form method='" + settings.httpMethod + "' action='" + fileUrl + "'>" + formInnerHtml + "</form>" + settings.popupWindowTitle + "</body></html>");
                    $form = $(formDoc).find('form');
                }

                $form.submit();
            }


            //check if the file download has completed every checkInterval ms
            setTimeout(checkFileDownloadComplete, settings.checkInterval);


            function checkFileDownloadComplete() {
                //has the cookie been written due to a file download occuring?

                var cookieValue = settings.cookieValue;
                if(typeof cookieValue == 'string') {
                    cookieValue = cookieValue.toLowerCase();
                }

                var lowerCaseCookie = settings.cookieName.toLowerCase() + "=" + cookieValue;

                if (document.cookie.toLowerCase().indexOf(lowerCaseCookie) > -1) {

                    //execute specified callback
                    internalCallbacks.onSuccess(fileUrl);

                    //remove cookie
                    var cookieData = settings.cookieName + "=; path=" + settings.cookiePath + "; expires=" + new Date(0).toUTCString() + ";";
                    if (settings.cookieDomain) cookieData += " domain=" + settings.cookieDomain + ";";
                    document.cookie = cookieData;

                    //remove iframe
                    cleanUp(false);

                    return;
                }

                //has an error occured?
                //if neither containers exist below then the file download is occuring on the current window
                if (downloadWindow || $iframe) {

                    //has an error occured?
                    try {

                        var formDoc = downloadWindow ? downloadWindow.document : getiframeDocument($iframe);

                        if (formDoc && formDoc.body !== null && formDoc.body.innerHTML.length) {

                            var isFailure = true;

                            if ($form && $form.length) {
                                var $contents = $(formDoc.body).contents().first();

                                try {
                                    if ($contents.length && $contents[0] === $form[0]) {
                                        isFailure = false;
                                    }
                                } catch (e) {
                                    if (e && e.number == -2146828218) {
                                        // IE 8-10 throw a permission denied after the form reloads on the "$contents[0] === $form[0]" comparison
                                        isFailure = true;
                                    } else {
                                        throw e;
                                    }
                                }
                            }

                            if (isFailure) {
                                // IE 8-10 don't always have the full content available right away, they need a litle bit to finish
                                setTimeout(function () {
                                    internalCallbacks.onFail(formDoc.body.innerHTML, fileUrl);
                                    cleanUp(true);
                                }, 100);

                                return;
                            }
                        }
                    }
                    catch (err) {

                        //500 error less than IE9
                        internalCallbacks.onFail('', fileUrl);

                        cleanUp(true);

                        return;
                    }
                }


                //keep checking...
                setTimeout(checkFileDownloadComplete, settings.checkInterval);
            }

            //gets an iframes document in a cross browser compatible manner
            function getiframeDocument($iframe) {
                var iframeDoc = $iframe[0].contentWindow || $iframe[0].contentDocument;
                if (iframeDoc.document) {
                    iframeDoc = iframeDoc.document;
                }
                return iframeDoc;
            }

            function cleanUp(isFailure) {

                setTimeout(function() {

                    if (downloadWindow) {

                        if (isAndroid) {
                            downloadWindow.close();
                        }

                        if (isIos) {
                            if (downloadWindow.focus) {
                                downloadWindow.focus(); //ios safari bug doesn't allow a window to be closed unless it is focused
                                if (isFailure) {
                                    downloadWindow.close();
                                }
                            }
                        }
                    }

                    //iframe cleanup appears to randomly cause the download to fail
                    //not doing it seems better than failure...
                    //if ($iframe) {
                    //    $iframe.remove();
                    //}

                }, 0);
            }


            function htmlSpecialCharsEntityEncode(str) {
                return str.replace(htmlSpecialCharsRegEx, function(match) {
                    return '&' + htmlSpecialCharsPlaceHolders[match];
                });
            }
            var promise = deferred.promise();
            promise.abort = function() {
                cleanUp();
                $iframe.remove();
            };
            return promise;
        }
    });

})(jQuery, this);

/**
 * jQuery Lined Textarea Plugin 
 *   http://alan.blog-city.com/jquerylinedtextarea.htm
 *
 * Copyright (c) 2010 Alan Williamson
 * 
 * Version: 
 *    $Id: jquery-linedtextarea.js 464 2010-01-08 10:36:33Z alan $
 *
 * Released under the MIT License:
 *    http://www.opensource.org/licenses/mit-license.php
 * 
 * Usage:
 *   Displays a line number count column to the left of the textarea
 *   
 *   Class up your textarea with a given class, or target it directly
 *   with JQuery Selectors
 *   
 *   $(".lined").linedtextarea({
 *   	selectedLine: 10,
 *    selectedClass: 'lineselect'
 *   });
 *
 * History:
 *   - 2010.01.08: Fixed a Google Chrome layout problem
 *   - 2010.01.07: Refactored code for speed/readability; Fixed horizontal sizing
 *   - 2010.01.06: Initial Release
 *
 */
(function($) {

	$.fn.linedtextarea = function(options) {
		
		// Get the Options
		var opts = $.extend({}, $.fn.linedtextarea.defaults, options);
		
		
		/*
		 * Helper function to make sure the line numbers are always
		 * kept up to the current system
		 */
		var fillOutLines = function(codeLines, h, lineNo){
			while ( (codeLines.height() - h ) <= 0 ){
				if ( lineNo == opts.selectedLine )
					codeLines.append("<div class='lineno lineselect'>" + lineNo + "</div>");
				else
					codeLines.append("<div class='lineno'>" + lineNo + "</div>");
				
				lineNo++;
			}
			return lineNo;
		};
		
		
		/*
		 * Iterate through each of the elements are to be applied to
		 */
		return this.each(function() {
			var lineNo = 1;
			var textarea = $(this);
			
			/* Turn off the wrapping of as we don't want to screw up the line numbers */
			textarea.attr("wrap", "off");
			textarea.css({resize:'none'});
			var originalTextAreaWidth	= textarea.outerWidth();

			/* Wrap the text area in the elements we need */
			textarea.wrap("<div class='linedtextarea'></div>");
			var linedTextAreaDiv	= textarea.parent().wrap("<div class='linedwrap' style='width:" + originalTextAreaWidth + "px'></div>");
			var linedWrapDiv 			= linedTextAreaDiv.parent();
			
			linedWrapDiv.prepend("<div class='lines' style='width:50px'></div>");
			
			var linesDiv	= linedWrapDiv.find(".lines");
			linesDiv.height( textarea.height() + 6 );
			
			
			/* Draw the number bar; filling it out where necessary */
			linesDiv.append( "<div class='codelines'></div>" );
			var codeLinesDiv	= linesDiv.find(".codelines");
			lineNo = fillOutLines( codeLinesDiv, linesDiv.height(), 1 );

			/* Move the textarea to the selected line */ 
			if ( opts.selectedLine != -1 && !isNaN(opts.selectedLine) ){
				var fontSize = parseInt( textarea.height() / (lineNo-2) );
				var position = parseInt( fontSize * opts.selectedLine ) - (textarea.height()/2);
				textarea[0].scrollTop = position;
			}

			
			/* Set the width */
			var sidebarWidth					= linesDiv.outerWidth();
			var paddingHorizontal 		= parseInt( linedWrapDiv.css("border-left-width") ) + parseInt( linedWrapDiv.css("border-right-width") ) + parseInt( linedWrapDiv.css("padding-left") ) + parseInt( linedWrapDiv.css("padding-right") );
			var linedWrapDivNewWidth 	= originalTextAreaWidth - paddingHorizontal;
			var textareaNewWidth			= originalTextAreaWidth - sidebarWidth - paddingHorizontal - 20;

			textarea.width( textareaNewWidth );
			linedWrapDiv.width( linedWrapDivNewWidth );
			

			
			/* React to the scroll event */
			textarea.scroll( function(tn){
				var domTextArea		= $(this)[0];
				var scrollTop 		= domTextArea.scrollTop;
				var clientHeight 	= domTextArea.clientHeight;
				codeLinesDiv.css( {'margin-top': (-1*scrollTop) + "px"} );
				lineNo = fillOutLines( codeLinesDiv, scrollTop + clientHeight, lineNo );
			});


			/* Should the textarea get resized outside of our control */
			textarea.resize( function(tn){
				var domTextArea	= $(this)[0];
				linesDiv.height( domTextArea.clientHeight + 6 );
			});

		});
	};

  // default options
  $.fn.linedtextarea.defaults = {
  	selectedLine: -1,
  	selectedClass: 'lineselect'
  };
})(jQuery);
/******************************************************************************
 * jquery.i18n.properties
 * 
 * Dual licensed under the GPL (http://dev.jquery.com/browser/trunk/jquery/GPL-LICENSE.txt) and 
 * MIT (http://dev.jquery.com/browser/trunk/jquery/MIT-LICENSE.txt) licenses.
 * 
 * @version     1.0.x
 * @author      Nuno Fernandes
 * @url         www.codingwithcoffee.com
 * @inspiration Localisation assistance for jQuery (http://keith-wood.name/localisation.html)
 *              by Keith Wood (kbwood{at}iinet.com.au) June 2007
 * 
 *****************************************************************************/

(function($) {
$.i18n = {};

/** Map holding bundle keys (if mode: 'map') */
$.i18n.map = {};
    
/**
 * Load and parse message bundle files (.properties),
 * making bundles keys available as javascript variables.
 * 
 * i18n files are named <name>.js, or <name>_<language>.js or <name>_<language>_<country>.js
 * Where:
 *      The <language> argument is a valid ISO Language Code. These codes are the lower-case, 
 *      two-letter codes as defined by ISO-639. You can find a full list of these codes at a 
 *      number of sites, such as: http://www.loc.gov/standards/iso639-2/englangn.html
 *      The <country> argument is a valid ISO Country Code. These codes are the upper-case,
 *      two-letter codes as defined by ISO-3166. You can find a full list of these codes at a
 *      number of sites, such as: http://www.iso.ch/iso/en/prods-services/iso3166ma/02iso-3166-code-lists/list-en1.html
 * 
 * Sample usage for a bundles/Messages.properties bundle:
 * $.i18n.properties({
 *      name:      'Messages', 
 *      language:  'en_US',
 *      path:      'bundles'
 * });
 * @param  name			(string/string[], optional) names of file to load (eg, 'Messages' or ['Msg1','Msg2']). Defaults to "Messages"
 * @param  language		(string, optional) language/country code (eg, 'en', 'en_US', 'pt_PT'). if not specified, language reported by the browser will be used instead.
 * @param  path			(string, optional) path of directory that contains file to load
 * @param  mode			(string, optional) whether bundles keys are available as JavaScript variables/functions or as a map (eg, 'vars' or 'map')
 * @param  cache        (boolean, optional) whether bundles should be cached by the browser, or forcibly reloaded on each page load. Defaults to false (i.e. forcibly reloaded)
 * @param  encoding 	(string, optional) the encoding to request for bundles. Property file resource bundles are specified to be in ISO-8859-1 format. Defaults to UTF-8 for backward compatibility.
 * @param  callback     (function, optional) callback function to be called after script is terminated
 */
$.i18n.properties = function(settings) {
	// set up settings
    var defaults = {
        name:           'Messages',
        language:       '',
        path:           '',  
        mode:           'vars',
        cache:			false,
        encoding:       'UTF-8',
        callback:       null
    };
    settings = $.extend(defaults, settings);    
    if(settings.language === null || settings.language == '') {
	   settings.language = $.i18n.browserLang();
	}
	if(settings.language === null) {settings.language='';}
	
	// load and parse bundle files
	var files = getFiles(settings.name);
	for(i=0; i<files.length; i++) {
		// 1. load base (eg, Messages.properties)
		loadAndParseFile(settings.path + files[i] + '.properties', settings);
        // 2. with language code (eg, Messages_pt.properties)
		if(settings.language.length >= 2) {
            loadAndParseFile(settings.path + files[i] + '_' + settings.language.substring(0, 2) +'.properties', settings);
		}
		// 3. with language code and country code (eg, Messages_pt_PT.properties)
        if(settings.language.length >= 5) {
            loadAndParseFile(settings.path + files[i] + '_' + settings.language.substring(0, 5) +'.properties', settings);
        }
	}
	
	// call callback
	if(settings.callback){ settings.callback(); }
};


/**
 * When configured with mode: 'map', allows access to bundle values by specifying its key.
 * Eg, jQuery.i18n.prop('com.company.bundles.menu_add')
 */
$.i18n.prop = function(key /* Add parameters as function arguments as necessary  */) {
	var value = $.i18n.map[key];
	if (value == null)
		return '[' + key + ']';
	
//	if(arguments.length < 2) // No arguments.
//    //if(key == 'spv.lbl.modified') {alert(value);}
//		return value;
	
//	if (!$.isArray(placeHolderValues)) {
//		// If placeHolderValues is not an array, make it into one.
//		placeHolderValues = [placeHolderValues];
//		for (var i=2; i<arguments.length; i++)
//			placeHolderValues.push(arguments[i]);
//	}

	// Place holder replacement
	/**
	 * Tested with:
	 *   test.t1=asdf ''{0}''
	 *   test.t2=asdf '{0}' '{1}'{1}'zxcv
	 *   test.t3=This is \"a quote" 'a''{0}''s'd{fgh{ij'
	 *   test.t4="'''{'0}''" {0}{a}
	 *   test.t5="'''{0}'''" {1}
	 *   test.t6=a {1} b {0} c
	 *   test.t7=a 'quoted \\ s\ttringy' \t\t x
	 *
	 * Produces:
	 *   test.t1, p1 ==> asdf 'p1'
	 *   test.t2, p1 ==> asdf {0} {1}{1}zxcv
	 *   test.t3, p1 ==> This is "a quote" a'{0}'sd{fgh{ij
	 *   test.t4, p1 ==> "'{0}'" p1{a}
	 *   test.t5, p1 ==> "'{0}'" {1}
	 *   test.t6, p1 ==> a {1} b p1 c
	 *   test.t6, p1, p2 ==> a p2 b p1 c
	 *   test.t6, p1, p2, p3 ==> a p2 b p1 c
	 *   test.t7 ==> a quoted \ s	tringy 		 x
	 */
	
	var i;
	if (typeof(value) == 'string') {
        // Handle escape characters. Done separately from the tokenizing loop below because escape characters are 
		// active in quoted strings.
        i = 0;
        while ((i = value.indexOf('\\', i)) != -1) {
 		   if (value[i+1] == 't')
 			   value = value.substring(0, i) + '\t' + value.substring((i++) + 2); // tab
 		   else if (value[i+1] == 'r')
 			   value = value.substring(0, i) + '\r' + value.substring((i++) + 2); // return
 		   else if (value[i+1] == 'n')
 			   value = value.substring(0, i) + '\n' + value.substring((i++) + 2); // line feed
 		   else if (value[i+1] == 'f')
 			   value = value.substring(0, i) + '\f' + value.substring((i++) + 2); // form feed
 		   else if (value[i+1] == '\\')
 			   value = value.substring(0, i) + '\\' + value.substring((i++) + 2); // \
 		   else
 			   value = value.substring(0, i) + value.substring(i+1); // Quietly drop the character
        }
		
		// Lazily convert the string to a list of tokens.
		var arr = [], j, index;
		i = 0;
		while (i < value.length) {
			if (value[i] == '\'') {
				// Handle quotes
				if (i == value.length-1)
					value = value.substring(0, i); // Silently drop the trailing quote
				else if (value[i+1] == '\'')
					value = value.substring(0, i) + value.substring(++i); // Escaped quote
				else {
					// Quoted string
					j = i + 2;
					while ((j = value.indexOf('\'', j)) != -1) {
						if (j == value.length-1 || value[j+1] != '\'') {
							// Found start and end quotes. Remove them
							value = value.substring(0,i) + value.substring(i+1, j) + value.substring(j+1);
							i = j - 1;
							break;
						}
						else {
							// Found a double quote, reduce to a single quote.
							value = value.substring(0,j) + value.substring(++j);
						}
					}
					
					if (j == -1) {
						// There is no end quote. Drop the start quote
						value = value.substring(0,i) + value.substring(i+1);
					}
				}
			}
			else if (value[i] == '{') {
				// Beginning of an unquoted place holder.
				j = value.indexOf('}', i+1);
				if (j == -1)
					i++; // No end. Process the rest of the line. Java would throw an exception
				else {
					// Add 1 to the index so that it aligns with the function arguments.
					index = parseInt(value.substring(i+1, j));
					if (!isNaN(index) && index >= 0) {
						// Put the line thus far (if it isn't empty) into the array
						var s = value.substring(0, i);
						if (s != "")
							arr.push(s);
						// Put the parameter reference into the array
						arr.push(index);
						// Start the processing over again starting from the rest of the line.
						i = 0;
						value = value.substring(j+1);
					}
					else
						i = j + 1; // Invalid parameter. Leave as is.
				}
			}
			else
				i++;
		}
		
		// Put the remainder of the no-empty line into the array.
		if (value != "")
			arr.push(value);
		value = arr;
		
		// Make the array the value for the entry.
		$.i18n.map[key] = arr;
	}
	
	if (value.length == 0)
		return "";
	if (value.lengh == 1 && typeof(value[0]) == "string")
		return value[0];
	
	var s = "";
	for (i=0; i<value.length; i++) {
		if (typeof(value[i]) == "string")
			s += value[i];
		// Must be a number
		else if (value[i] + 1 < arguments.length)
			s += arguments[value[i] + 1];
		else
			s += "{"+ value[i] +"}";
	}
	
	return s;
};

/** Language reported by browser, normalized code */
$.i18n.browserLang = function() {
	return normaliseLanguageCode(navigator.language /* Mozilla */ || navigator.userLanguage /* IE */);
}


/** Load and parse .properties files */
function loadAndParseFile(filename, settings) {
	$.ajax({
        url:        filename,
        async:      false,
        cache:		settings.cache,
        contentType:'text/plain;charset='+ settings.encoding,
        dataType:   'text',
        success:    function(data, status) {
        				parseData(data, settings.mode); 
					}
    });
}

/** Parse .properties files */
function parseData(data, mode) {
   var parsed = '';
   var parameters = data.split( /\n/ );
   var regPlaceHolder = /(\{\d+\})/g;
   var regRepPlaceHolder = /\{(\d+)\}/g;
   var unicodeRE = /(\\u.{4})/ig;
   for(var i=0; i<parameters.length; i++ ) {
       parameters[i] = parameters[i].replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
       if(parameters[i].length > 0 && parameters[i].match("^#")!="#") { // skip comments
           var pair = parameters[i].split('=');
           if(pair.length > 0) {
               /** Process key & value */
               var name = unescape(pair[0]).replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
               var value = pair.length == 1 ? "" : pair[1];
               // process multi-line values
               while(value.match(/\\$/)=="\\") {
               		value = value.substring(0, value.length - 1);
               		value += parameters[++i].replace( /\s\s*$/, '' ); // right trim
               }               
               // Put values with embedded '='s back together
               for(var s=2;s<pair.length;s++){ value +='=' + pair[s]; }
               value = value.replace( /^\s\s*/, '' ).replace( /\s\s*$/, '' ); // trim
               
               /** Mode: bundle keys in a map */
               if(mode == 'map' || mode == 'both') {
                   // handle unicode chars possibly left out
                   var unicodeMatches = value.match(unicodeRE);
                   if(unicodeMatches) {
                     for(var u=0; u<unicodeMatches.length; u++) {
                        value = value.replace( unicodeMatches[u], unescapeUnicode(unicodeMatches[u]));
                     }
                   }
                   // add to map
                   $.i18n.map[name] = value;
               }
               
               /** Mode: bundle keys as vars/functions */
               if(mode == 'vars' || mode == 'both') {
                   value = value.replace( /"/g, '\\"' ); // escape quotation mark (")
                   
                   // make sure namespaced key exists (eg, 'some.key') 
                   checkKeyNamespace(name);
                   
                   // value with variable substitutions
                   if(regPlaceHolder.test(value)) {
                       var parts = value.split(regPlaceHolder);
                       // process function args
                       var first = true;
                       var fnArgs = '';
                       var usedArgs = [];
                       for(var p=0; p<parts.length; p++) {
                           if(regPlaceHolder.test(parts[p]) && (usedArgs.length == 0 || usedArgs.indexOf(parts[p]) == -1)) {
                               if(!first) {fnArgs += ',';}
                               fnArgs += parts[p].replace(regRepPlaceHolder, 'v$1');
                               usedArgs.push(parts[p]);
                               first = false;
                           }
                       }
                       parsed += name + '=function(' + fnArgs + '){';
                       // process function body
                       var fnExpr = '"' + value.replace(regRepPlaceHolder, '"+v$1+"') + '"';
                       parsed += 'return ' + fnExpr + ';' + '};';
                       
                   // simple value
                   }else{
                       parsed += name+'="'+value+'";';
                   }
               } // END: Mode: bundle keys as vars/functions
           } // END: if(pair.length > 0)
       } // END: skip comments
   }
   eval(parsed);
}

/** Make sure namespace exists (for keys with dots in name) */
// TODO key parts that start with numbers quietly fail. i.e. month.short.1=Jan
function checkKeyNamespace(key) {
	var regDot = /\./;
	if(regDot.test(key)) {
		var fullname = '';
		var names = key.split( /\./ );
		for(var i=0; i<names.length; i++) {
			if(i>0) {fullname += '.';}
			fullname += names[i];
			if(eval('typeof '+fullname+' == "undefined"')) {
				eval(fullname + '={};');
			}
		}
	}
}

/** Make sure filename is an array */
function getFiles(names) {
	return (names && names.constructor == Array) ? names : [names];
}

/** Ensure language code is in the format aa_AA. */
function normaliseLanguageCode(lang) {
    lang = lang.toLowerCase();
    if(lang.length > 3) {
        lang = lang.substring(0, 3) + lang.substring(3).toUpperCase();
    }
    return lang;
}

/** Unescape unicode chars ('\u00e3') */
function unescapeUnicode(str) {
  // unescape unicode codes
  var codes = [];
  var code = parseInt(str.substr(2), 16);
  if (code >= 0 && code < Math.pow(2, 16)) {
     codes.push(code);
  }
  // convert codes to text
  var unescaped = '';
  for (var i = 0; i < codes.length; ++i) {
    unescaped += String.fromCharCode(codes[i]);
  }
  return unescaped;
}

/* Cross-Browser Split 1.0.1
(c) Steven Levithan <stevenlevithan.com>; MIT License
An ECMA-compliant, uniform cross-browser split method */
var cbSplit;
// avoid running twice, which would break `cbSplit._nativeSplit`'s reference to the native `split`
if (!cbSplit) {    
  cbSplit = function(str, separator, limit) {
      // if `separator` is not a regex, use the native `split`
      if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
        if(typeof cbSplit._nativeSplit == "undefined")
          return str.split(separator, limit);
        else
          return cbSplit._nativeSplit.call(str, separator, limit);
      }
  
      var output = [],
          lastLastIndex = 0,
          flags = (separator.ignoreCase ? "i" : "") +
                  (separator.multiline  ? "m" : "") +
                  (separator.sticky     ? "y" : ""),
          separator = RegExp(separator.source, flags + "g"), // make `global` and avoid `lastIndex` issues by working with a copy
          separator2, match, lastIndex, lastLength;
  
      str = str + ""; // type conversion
      if (!cbSplit._compliantExecNpcg) {
          separator2 = RegExp("^" + separator.source + "$(?!\\s)", flags); // doesn't need /g or /y, but they don't hurt
      }
  
      /* behavior for `limit`: if it's...
      - `undefined`: no limit.
      - `NaN` or zero: return an empty array.
      - a positive number: use `Math.floor(limit)`.
      - a negative number: no limit.
      - other: type-convert, then use the above rules. */
      if (limit === undefined || +limit < 0) {
          limit = Infinity;
      } else {
          limit = Math.floor(+limit);
          if (!limit) {
              return [];
          }
      }
  
      while (match = separator.exec(str)) {
          lastIndex = match.index + match[0].length; // `separator.lastIndex` is not reliable cross-browser
  
          if (lastIndex > lastLastIndex) {
              output.push(str.slice(lastLastIndex, match.index));
  
              // fix browsers whose `exec` methods don't consistently return `undefined` for nonparticipating capturing groups
              if (!cbSplit._compliantExecNpcg && match.length > 1) {
                  match[0].replace(separator2, function () {
                      for (var i = 1; i < arguments.length - 2; i++) {
                          if (arguments[i] === undefined) {
                              match[i] = undefined;
                          }
                      }
                  });
              }
  
              if (match.length > 1 && match.index < str.length) {
                  Array.prototype.push.apply(output, match.slice(1));
              }
  
              lastLength = match[0].length;
              lastLastIndex = lastIndex;
  
              if (output.length >= limit) {
                  break;
              }
          }
  
          if (separator.lastIndex === match.index) {
              separator.lastIndex++; // avoid an infinite loop
          }
      }
  
      if (lastLastIndex === str.length) {
          if (lastLength || !separator.test("")) {
              output.push("");
          }
      } else {
          output.push(str.slice(lastLastIndex));
      }
  
      return output.length > limit ? output.slice(0, limit) : output;
  };
  
  cbSplit._compliantExecNpcg = /()??/.exec("")[1] === undefined; // NPCG: nonparticipating capturing group
  cbSplit._nativeSplit = String.prototype.split;

} // end `if (!cbSplit)`
String.prototype.split = function (separator, limit) {
    return cbSplit(this, separator, limit);
};

})(jQuery);
                
// Todo:
// 1) Make the button prettier
// 2) add a config option for IE users which takes a URL.  That URL should accept a POST request with a
//    JSON encoded object in the payload and return a CSV.  This is necessary because IE doesn't let you
//    download from a data-uri link
//
// Notes:  This has not been adequately tested and is very much a proof of concept at this point
function ngGridCsvExportPlugin (opts) {
    var self = this;
    self.grid = null;
    self.scope = null;
    self.services = null;
    self.init = function(scope, grid, services) {
        self.grid = grid;
        self.scope = scope;
        self.services = services;
        function showDs() {
            var keys = [];
            for (var f in grid.config.columnDefs) { keys.push(grid.config.columnDefs[f].field);}
            var csvData = '';
            function csvStringify(str) {
                if (str == null) { // we want to catch anything null-ish, hence just == not ===
                    return '';
                }
                if (typeof(str) === 'number') {
                    return '' + str;
                }
                if (typeof(str) === 'boolean') {
                    return (str ? 'TRUE' : 'FALSE') ;
                }
                if (typeof(str) === 'string') {
                    return str.replace(/"/g,'""');
                }

                return JSON.stringify(str).replace(/"/g,'""');
            }
            function swapLastCommaForNewline(str) {
                var newStr = str.substr(0,str.length - 1);
                return newStr + "\n";
            }
            // FIX to use display name headers
//            for (var k in keys) {
//                csvData += '"' + csvStringify(keys[k]) + '",';
//            }
            for (var f in grid.config.columnDefs) {
                csvData += '"' + csvStringify(grid.config.columnDefs[f].displayName) + '",';
            }
            csvData = swapLastCommaForNewline(csvData);
            var gridData = grid.data;
            for (var gridRow in gridData) {
                for ( k in keys) {
                    var curCellRaw;
                    if (opts != null && opts.columnOverrides != null && opts.columnOverrides[keys[k]] != null) {
                        // FIX line below to handle nested properties
//                        curCellRaw = opts.columnOverrides[keys[k]](gridData[gridRow][keys[k]]);
                        curCellRaw = opts.columnOverrides[keys[k]](services.UtilityService.evalProperty(gridData[gridRow],keys[k]));
                    }
                    else {
//                        // FIX line below to handle nested properties
//                        curCellRaw = gridData[gridRow][keys[k]];
                        curCellRaw = services.UtilityService.evalProperty(gridData[gridRow],keys[k]);
                    }
                    csvData += '"' + csvStringify(curCellRaw) + '",';
                }
                csvData = swapLastCommaForNewline(csvData);
            }
            var fp = grid.$root.find(".ngFooterPanel");
            var csvDataLinkPrevious = grid.$root.find('.ngFooterPanel .csv-data-link-span');
            if (csvDataLinkPrevious != null) {csvDataLinkPrevious.remove() ; }
            var csvDataLinkHtml = "<div class=\"csv-data-link-span\">";
            csvDataLinkHtml += "<br><a href=\"data:text/csv;charset=UTF-8,";
            csvDataLinkHtml += encodeURIComponent(csvData);
            csvDataLinkHtml += "\" download=\"Export.csv\">CSV Export</a></br></div>" ;
            fp.append(csvDataLinkHtml);
        }
        setTimeout(showDs, 0);
        scope.catHashKeys = function() {
            var hash = '';
            for (var idx in scope.renderedRows) {
                hash += scope.renderedRows[idx].$$hashKey;
            }
            return hash;
        };
        if (opts.customDataWatcher) {
            scope.$watch(opts.customDataWatcher, showDs);
        } else {
            scope.$watch(scope.catHashKeys, showDs);
        }
    };
}

/**
 * Created by haffo on 6/9/14.
 */


if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str) {
        return this.slice(0, str.length) == str;
    };
}


if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str) {
        return this.slice(-str.length) == str;
    };
}


var waitingDialog = (function ($) {
    // Creating modal dialog's DOM
    var $dialog = $(
            '<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
            '<div class="modal-dialog modal-m">' +
            '<div class="modal-content">' +
            '<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
            '<div class="modal-body">' +
            '<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
            '</div>' +
            '</div></div></div>');

    return {
        /**
         * Opens our dialog
         * @param message Custom message
         * @param options Custom options:
         * 				  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
         * 				  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
         */
        show: function (message, options) {
            // Assigning defaults
            var settings = $.extend({
                dialogSize: 'xs',
                progressType: ''
            }, options);
            if (typeof message === 'undefined') {
                message = 'Loading';
            }
            if (typeof options === 'undefined') {
                options = {};
            }
            // Configuring dialog
            $dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
            $dialog.find('.progress-bar').attr('class', 'progress-bar');
            if (settings.progressType) {
                $dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
            }
            $dialog.find('h3').text(message);
            // Opening dialog
            $dialog.modal();
        },
        /**
         * Closes dialog
         */
        hide: function () {
            $dialog.modal('hide');
        }
    }

})(jQuery);

'use strict';

/**
 * @ngdoc overview
 * @name clientApp
 * @description
 * # clientApp
 *
 * Main module oƒf the application.
 */
var app = angular
    .module('tcl', [
        'ngMaterial',
        'ngAnimate',
        'LocalStorageModule',
        'ngCookies',
        'ngMessages',
        'ngResource',
        'ngRoute',
        'ngSanitize',
        'ngTouch',
        'angular-bind-html-compile',
        'ngIdle',
        'ui.bootstrap',
        'smart-table',
        'ngTreetable',
        'restangular',
        'angularjs-dropdown-multiselect',
        'dndLists',
        'froala',
        'ngNotificationsBar',
        'ngDragDrop',
        'ui.tree',
        'ui.bootstrap',
        'ui.bootstrap.contextMenu',
        'ui.codemirror',
        'ui-notification',
        'hit-validation-result'
    ]);
app.config(function(NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 10000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'right',
        positionY: 'top'
    });
});
var
//the HTTP headers to be used by all requests
    httpHeaders,

//the message to show on the login popup page
    loginMessage,

//the spinner used to show when we are still waiting for a server answer
    spinner,

//The list of messages we don't want to displat
    mToHide = ['usernameNotFound', 'emailNotFound', 'usernameFound', 'emailFound', 'loginSuccess', 'userAdded', 'igDocumentNotSaved', 'igDocumentSaved', 'uploadImageFailed'];

//the message to be shown to the user
var msg = {};

app.config(function ($routeProvider, RestangularProvider, $httpProvider, KeepaliveProvider, IdleProvider, notificationsConfigProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];

    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html'
        })
        .when('/home', {
            templateUrl: 'views/home.html'
        })
        .when('/tp', {
            templateUrl: 'views/tp.html'
        })
        .when('/profiles', {
            templateUrl: 'views/profiles.html'
        })
        .when('/doc', {
            templateUrl: 'views/doc.html'
        })
        .when('/setting', {
            templateUrl: 'views/setting.html'
        })
        .when('/about', {
            templateUrl: 'views/about.html'
        })
        .when('/config', {
            templateUrl: 'views/config.html'
        })
        .when('/download', {
            templateUrl: 'views/download.html'
        })
        .when('/contact', {
            templateUrl: 'views/contact.html'
        })
        .when('/forgotten', {
            templateUrl: 'views/account/forgotten.html',
            controller: 'ForgottenCtrl'
        })
        .when('/issue', {
            templateUrl: 'views/issue.html',
            controller: 'IssueCtrl'
        })
        .when('/registration', {
            templateUrl: 'views/account/registration.html',
            controller: 'RegistrationCtrl'
        }).when('/useraccount', {
            templateUrl: 'views/account/userAccount.html'
        }) .when('/glossary', {
            templateUrl: 'views/glossary.html'
        })
//        .when('/account', {
//            templateUrl: 'views/account/account.html',
//            controller: 'AccountCtrl',
//            resolve: {
//                login: ['LoginService', function(LoginService){
//                    return LoginService();
//                }]
//            }
//        })
        .when('/registerResetPassword', {
            templateUrl: 'views/account/registerResetPassword.html',
            controller: 'RegisterResetPasswordCtrl',
            resolve: {
                isFirstSetup: function () {
                    return true;
                }
            }
        })
        .when('/resetPassword', {
            templateUrl: 'views/account/registerResetPassword.html',
            controller: 'RegisterResetPasswordCtrl',
            resolve: {
                isFirstSetup: function () {
                    return false;
                }
            }
        })
        .when('/registrationSubmitted', {
            templateUrl: 'views/account/registrationSubmitted.html'
        })
        .otherwise({
            redirectTo: '/'
        });


//    $http.defaults.headers.post['X-CSRFToken'] = $cookies['csrftoken'];

    $httpProvider.interceptors.push(function ($q) {
        return {
            request: function (config) {
//            	console.log(config.url);
//                return "http://localhost:8080/igamt"+ value;
//                if(config.url.startsWith("api")){
//                   config.url = "http://localhost:8080/igamt/"+  config.url;
//                   console.log("config.url=" + config.url);
//                }
                return config || $q.when(config);
            }
        }
    });


    $httpProvider.interceptors.push(function ($rootScope, $q) {
        var setMessage = function (response) {
            //if the response has a text and a type property, it is a message to be shown
            if (response.data && response.data.text && response.data.type) {
                if (response.status === 401) {
//                        console.log("setting login message");
                    loginMessage = {
                        text: response.data.text,
                        type: response.data.type,
                        skip: response.data.skip,
                        show: true,
                        manualHandle: response.data.manualHandle
                    };

                } else if (response.status === 503) {
                    msg = {
                        text: "server.down",
                        type: "danger",
                        show: true,
                        manualHandle: true
                    };
                } else {
                    msg = {
                        text: response.data.text,
                        type: response.data.type,
                        skip: response.data.skip,
                        show: true,
                        manualHandle: response.data.manualHandle
                    };
                    var found = false;
                    var i = 0;
                    while (i < mToHide.length && !found) {
                        if (msg.text === mToHide[i]) {
                            found = true;
                        }
                        i++;
                    }
                    if (found === true) {
                        msg.show = false;
                    } else {
//                        //hide the msg in 5 seconds
//                                                setTimeout(
//                                                    function() {
//                                                        msg.show = false;
//                                                        //tell angular to refresh
//                                                        $rootScope.$apply();
//                                                    },
//                                                    10000
//                                                );
                    }
                 }
            }
        };

        return {
            response: function (response) {
                setMessage(response);
                return response || $q.when(response);
            },

            responseError: function (response) {
                setMessage(response);
                return $q.reject(response);
            }
        };

    });

    //configure $http to show a login dialog whenever a 401 unauthorized response arrives
    $httpProvider.interceptors.push(function ($rootScope, $q) {
        return {
            response: function (response) {
                return response || $q.when(response);
            },
            responseError: function (response) {
                if (response.status === 401) {
                    //We catch everything but this one. So public users are not bothered
                    //with a login windows when browsing home.
                    if (response.config.url !== 'api/accounts/cuser') {
                        //We don't intercept this request
                        if (response.config.url !== 'api/accounts/login') {
                            var deferred = $q.defer(),
                                req = {
                                    config: response.config,
                                    deferred: deferred
                                };
                            $rootScope.requests401.push(req);
                        }
                        $rootScope.$broadcast('event:loginRequired');
//                        return deferred.promise;

                        return  $q.when(response);
                    }
                }
                return $q.reject(response);
            }
        };
    });

    //intercepts ALL angular ajax http calls
    $httpProvider.interceptors.push(function ($q) {
        return {
            response: function (response) {
                //hide the spinner
                spinner = false;
                return response || $q.when(response);
            },
            responseError: function (response) {
                //hide the spinner
                spinner = false;
                return $q.reject(response);
            }
        };


    });


    IdleProvider.idle(7200);
    IdleProvider.timeout(30);
    KeepaliveProvider.interval(60);

    // auto hide
    notificationsConfigProvider.setAutoHide(true);

    // delay before hide
    notificationsConfigProvider.setHideDelay(30000);

    // delay between animation and removing the nofitication
    notificationsConfigProvider.setAutoHideAnimationDelay(1200);

    var spinnerStarter = function (data, headersGetter) {
        spinner = true;
        return data;
    };
    $httpProvider.defaults.transformRequest.push(spinnerStarter);

    httpHeaders = $httpProvider.defaults.headers;


});

app.config([
    "$routeProvider",
    "$httpProvider",
    function($routeProvider, $httpProvider){
        $httpProvider.defaults.headers.common['Access-Control-Allow-Headers'] = '*';
    }
]);
app.run(function ($rootScope, $location, Restangular, $modal, $filter, base64, userInfoService, $http, AppInfo, StorageService, $templateCache, $window, notifications, $q) {
    $rootScope.appInfo = {};
    $rootScope.froalaDocLink = "https://www.froala.com/wysiwyg-editor/examples";

    //Check if the login dialog is already displayed.
    $rootScope.loginDialogShown = false;
    $rootScope.subActivePath = null;

    // load app info
    AppInfo.get().then(function (appInfo) {
        $rootScope.appInfo = appInfo;
        console.log("INIT FROALA");
        console.log($rootScope.appInfo.uploadedImagesUrl);
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
        httpHeaders.common['appVersion'] = appInfo.version;
        var prevVersion = StorageService.getAppVersion(StorageService.APP_VERSION);
        StorageService.setAppVersion(appInfo.version);

        if (prevVersion == null || prevVersion !== appInfo.version) {
            $rootScope.clearAndReloadApp();
        }
    }, function (error) {
        $rootScope.appInfo = {};
        $rootScope.openErrorDlg("Sorry we could not communicate with the server. Please try again");
    });


    //make current message accessible to root scope and therefore all scopes
    $rootScope.msg = function () {
        return msg;
    };

    //make current loginMessage accessible to root scope and therefore all scopes
    $rootScope.loginMessage = function () {
//            console.log("calling loginMessage()");
        return loginMessage;
    };

    //showSpinner can be referenced from the view
    $rootScope.showSpinner = function () {
        return spinner;
    };

    /**
     * Holds all the requests which failed due to 401 response.
     */
    $rootScope.requests401 = [];

    $rootScope.$on('event:loginRequired', function () {
//            console.log("in loginRequired event");
        $rootScope.showLoginDialog();
    });

    /**
     * On 'event:loginConfirmed', resend all the 401 requests.
     */
    $rootScope.$on('event:loginConfirmed', function () {
        var i,
            requests = $rootScope.requests401,
            retry = function (req) {
                $http(req.config).then(function (response) {
                    req.deferred.resolve(response);
                });
            };

        for (i = 0; i < requests.length; i += 1) {
            retry(requests[i]);
        }
        $rootScope.requests401 = [];
        $location.url('/home');


        $rootScope.loadProfiles();


    });

    /*jshint sub: true */
    /**
     * On 'event:loginRequest' send credentials to the server.
     */
    $rootScope.$on('event:loginRequest', function (event, username, password) {
        httpHeaders.common['Accept'] = 'application/json';
        httpHeaders.common['Authorization'] = 'Basic ' + base64.encode(username + ':' + password);

        $http.get('api/accounts/login').success(function () {
            //If we are here in this callback, login was successfull
            //Let's get user info now
            httpHeaders.common['Authorization'] = null;
            $http.get('api/accounts/cuser').then(function (result) {
                if (result.data && result.data != null) {
                    var rs = angular.fromJson(result.data);
                    userInfoService.setCurrentUser(rs);
                    $rootScope.$broadcast('event:loginConfirmed');
                } else {
                    userInfoService.setCurrentUser(null);
                }
            }, function () {
                userInfoService.setCurrentUser(null);
            });
        });
    });

    /**
     * On 'logoutRequest' invoke logout on the server.
     */
    $rootScope.$on('event:logoutRequest', function () {
        httpHeaders.common['Authorization'] = null;
        userInfoService.setCurrentUser(null);
        $http.get('j_spring_security_logout');
    });

    /**
     * On 'loginCancel' clears the Authentication header
     */
    $rootScope.$on('event:loginCancel', function () {
        httpHeaders.common['Authorization'] = null;
    });

    $rootScope.$on('$routeChangeStart', function (next, current) {
//            console.log('route changing');
        // If there is a message while change Route the stop showing the message
        if (msg && msg.manualHandle === 'false') {
//                console.log('detected msg with text: ' + msg.text);
            msg.show = false;
        }
    });

    $rootScope.loadUserFromCookie = function () {
        if (userInfoService.hasCookieInfo() === true) {
            //console.log("found cookie!")
            userInfoService.loadFromCookie();
            httpHeaders.common['Authorization'] = userInfoService.getHthd();
        }
        else {
            //console.log("cookie not found");
        }
    };


    $rootScope.isSubActive = function (path) {
        return path === $rootScope.subActivePath;
    };

    $rootScope.setSubActive = function (path) {
        $rootScope.subActivePath = path;
    };

    $rootScope.getFullName = function () {
        if (userInfoService.isAuthenticated() === true) {
            return userInfoService.getFullName();
        }
        return '';
    };
    $rootScope.clearAndReloadApp = function () {
        $rootScope.clearTemplate();
        $rootScope.reloadPage();
    };

    $rootScope.openErrorDlg = function (errorMessage) {
        StorageService.clearAll();
        if (!$rootScope.errorModalInstance || $rootScope.errorModalInstance === null || !$rootScope.errorModalInstance.opened) {
            $rootScope.errorModalInstance = $modal.open({
                templateUrl: 'CriticalError.html',
                size: 'lg',
                backdrop: true,
                keyboard: 'true',
                'controller': 'FailureCtrl',
                resolve: {
                    error: function () {
                        return errorMessage;
                    }
                }
            });
            $rootScope.errorModalInstance.result.then(function () {
                $rootScope.clearAndReloadApp();
            }, function () {
                $rootScope.clearAndReloadApp();
            });
        }
    };

    $rootScope.openSessionExpiredDlg = function () {
        if (!$rootScope.sessionExpiredModalInstance || $rootScope.sessionExpiredModalInstance === null || !$rootScope.sessionExpiredModalInstance.opened) {
            $rootScope.sessionExpiredModalInstance = $modal.open({
                templateUrl: 'timedout-dialog.html',
                size: 'lg',
                backdrop: true,
                keyboard: 'true',
                'controller': 'FailureCtrl',
                resolve: {
                    error: function () {
                        return "";
                    }
                }
            });
            $rootScope.sessionExpiredModalInstance.result.then(function () {
                $rootScope.clearAndReloadApp();
            }, function () {
                $rootScope.clearAndReloadApp();
            });
        }
    };

    $rootScope.clearTemplate = function () {
        $templateCache.removeAll();
    };

    $rootScope.reloadPage = function () {
        $window.location.reload();
    };

    $rootScope.scrollbarWidth = 0;

    $rootScope.getScrollbarWidth = function () {
        if ($rootScope.scrollbarWidth == 0) {
            var outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.width = "100px";
            outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

            document.body.appendChild(outer);

            var widthNoScroll = outer.offsetWidth;
            // force scrollbars
            outer.style.overflow = "scroll";

            // add innerdiv
            var inner = document.createElement("div");
            inner.style.width = "100%";
            outer.appendChild(inner);

            var widthWithScroll = inner.offsetWidth;

            // remove divs
            outer.parentNode.removeChild(outer);

            $rootScope.scrollbarWidth = widthNoScroll - widthWithScroll;
        }

        return $rootScope.scrollbarWidth;
    };





});




'use strict';

angular.module('tcl').factory('userInfo', ['$resource',
    function ($resource) {
        return $resource('api/accounts/cuser');
    }
]);

angular.module('tcl').factory('userLoaderService', ['userInfo', '$q',
    function (userInfo, $q) {
        var load = function() {
            var delay = $q.defer();
            userInfo.get({},
                function(theUserInfo) {
                    delay.resolve(theUserInfo);
                },
                function() {
                    delay.reject('Unable to fetch user info');
                }
            );
            return delay.promise;
        };
        return {
            load: load
        };
    }
]);

angular.module('tcl').factory('userInfoService', ['StorageService', 'userLoaderService',
    function(StorageService,userLoaderService) {
        var currentUser = null;
        var supervisor = false,
        author = false,
        admin = false,
        id = null,
        username = '',
        fullName= '';

        //console.log("USER ID=", StorageService.get('userID'));
       
        var loadFromCookie = function() {
            console.log("UserID=", StorageService.get('userID'));
            console.log("Is Admin?", StorageService.get('admin'));

            id = StorageService.get('userID');
            username = StorageService.get('username');
            author = StorageService.get('author');
            supervisor = StorageService.get('supervisor');
            admin = StorageService.get('admin');
        };

        var saveToCookie = function() {
            StorageService.set('accountID', id);
            StorageService.set('username', username);
            StorageService.set('author', author);
            StorageService.set('supervisor', supervisor);
            StorageService.set('admin', admin);
            StorageService.set('fullName', fullName);
        };

        var clearCookie = function() {
            StorageService.remove('accountID');
            StorageService.remove('username');
            StorageService.remove('author');
            StorageService.remove('supervisor');
            StorageService.remove('admin');
            StorageService.remove('hthd');
            StorageService.remove('fullName');

        };

        var saveHthd = function(header) {
            StorageService.set('hthd', header);
        };

        var getHthd = function(header) {
            return StorageService.get('hthd');
        };

        var hasCookieInfo =  function() {
            if ( StorageService.get('username') === '' ) {
                return false;
            }
            else {
                return true;
            }
        };

        var getAccountID = function() {
            if ( isAuthenticated() ) {
                return currentUser.accountId.toString();
            }
            return '0';
        };

        var isAdmin = function() {
            return admin;
        };

        var isAuthor = function() {
            return author;
        };

//        var isAuthorizedVendor = function() {
//            return authorizedVendor;
//        };
//
//        var isCustomer = function() {
//            return (author || authorizedVendor);
//        };

        var isSupervisor = function() {
            return supervisor;
        };

        var isPending = function() {
            return isAuthenticated() && currentUser != null ? currentUser.pending: false;
        };

        var isAuthenticated = function() {
        	var res =  currentUser !== undefined && currentUser != null && currentUser.authenticated === true;
             return res;
        };

        var loadFromServer = function() {
            if ( !isAuthenticated() ) {
                userLoaderService.load().then(setCurrentUser);
            }
        };

        var setCurrentUser = function(newUser) {
            currentUser = newUser;
            if ( currentUser !== null && currentUser !== undefined ) {
                console.log(currentUser.authorities);

                username = currentUser.username;
                id = currentUser.accountId;
                fullName = currentUser.fullName;
                if ( angular.isArray(currentUser.authorities)) {
                    angular.forEach(currentUser.authorities, function(value, key){
                        switch(value.authority)
                        {
                        case 'user':
                             break;
                        case 'admin':
                            admin = true;
                             break;
                        case 'author':
                            author = true;
                             break;
                        case 'supervisor':
                            supervisor = true;
                             break;
                        default:
                         }
                    });
                }
                //saveToCookie();
            }
            else {
                supervisor = false;
                author = false;
                admin = false;
                username = '';
                id = null;
                fullName = '';
                //clearCookie();
            }
        };

        var getUsername = function() {
            return username;
        };

        var getFullName = function() {
            return fullName;
        };

        return {
            saveHthd: saveHthd,
            getHthd: getHthd,
            hasCookieInfo: hasCookieInfo,
            loadFromCookie: loadFromCookie,
            getAccountID: getAccountID,
            isAdmin: isAdmin,
            isAuthor: isAuthor,
            isAuthenticated: isAuthenticated,
            isPending: isPending,
            isSupervisor: isSupervisor,
            setCurrentUser: setCurrentUser,
            loadFromServer: loadFromServer,
            getUsername: getUsername,
            getFullName: getFullName

        };
    }
]);

'use strict';

angular.module('tcl').factory('Account', ['$resource',
    function ($resource) {
        return $resource('api/accounts/:id', {id: '@id'});
    }
]);

angular.module('tcl').factory('LoginService', ['$resource', '$q',
    function ($resource, $q) {
        return function() {
            var myRes = $resource('api/accounts/login');
            var delay = $q.defer();
            myRes.get({},
                function(res) {
                    delay.resolve(res);
                }
            );
            return delay.promise;
        };
    }
]);

angular.module('tcl').factory('AccountLoader', ['Account', '$q',
    function (Account, $q) {
        return function(acctID) {
            var delay = $q.defer();
            Account.get({id: acctID},
                function(account) {
                    delay.resolve(account);
                },
                function() {
                    delay.reject('Unable to fetch account');
                }
            );
            return delay.promise;
        };
    }
]);

/**
 * Created by haffo on 3/3/16.
 */

angular.module('tcl').factory('AppInfo', ['$http', '$q', function ($http, $q) {
    return {
        get: function () {
            var delay = $q.defer();
            $http.get('api/appInfo').then(
                function (object) {
                    delay.resolve(angular.fromJson(object.data));
                },
                function (response) {
                    delay.reject(response.data);
                }
            );
            return delay.promise;
        }
    };
}]);
/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('ElementUtils',
    ['$rootScope', 'ViewSettings', function ($rootScope, ViewSettings) {
        var ElementUtils = {
            filterConstraints: function (node, constraints) {
                if (constraints) {
                    return $filter('filter')(constraints, {constraintTarget: node.position + '[1]'}, true);
                }
                return null;
            },
            isRelevant: function (node, predicates) {
                if (predicates && predicates != null && predicates.length > 0) {
                    return  predicates[0].trueUsage === "R" || predicates[0].trueUsage === "RE" || predicates[0].falseUsage === "R" || predicates[0].falseUsage === "RE";
                } else {
                    return node.usage == null || !node.usage || node.usage === "R" || node.usage === "RE" || node.usage === "C";
                }
            },
            setUsage: function (node) {
                if( node.usage && node.min) {
                    if( node.usage === "R" && node.min == 0){
                        node.min = 1;
                    }
                    if( node.usage === "0"){
                        node.min = 0;
                    }
                }
            }
        };
        return ElementUtils;
    }]);

/**
 * Created by haffo on 3/9/16.
 */
'use strict';
angular.module('tcl').factory('IdleService',
    function ($http) {
        var IdleService = {
            keepAlive: function () {
                 return $http.get(
                    'api/session/keepAlive');
            }
        };
        return IdleService;
    });

'use strict';

angular.module('tcl').factory('Authors', ['$resource',
    function ($resource) {
        return $resource('api/shortaccounts', {filter:'accountType::author'});
    }
]);

angular.module('tcl').factory('Supervisors', ['$resource',
    function ($resource) {
        return $resource('api/shortaccounts', {filter:'accountType::supervisor'});
    }
]);


angular.module('tcl').factory('MultiAuthorsLoader', ['Authors', '$q',
    function (Authors, $q) {
        return function() {
            var delay = $q.defer();
            Authors.query(
                function(auth) {
                    delay.resolve(auth);
                },
                function() {
                    delay.reject('Unable to fetch list of authors');
                }
            );
            return delay.promise;
        };
    }
]);

angular.module('tcl').factory('MultiSupervisorsLoader', ['Supervisors', '$q',
    function (Supervisors, $q) {
        return function() {
            var delay = $q.defer();
            Supervisors.query(
                function(res) {
                    delay.resolve(res);
                },
                function() {
                    delay.reject('Unable to fetch list of supervisors');
                }
            );
            return delay.promise;
        };
    }
]);

/**
 * Created by ena3 on 11/15/17.
 */
/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').factory('PreferenceService',
    ['$q', '$rootScope','$http',function ($q,$rootScope,$http) {

        var svc = this;

        svc.find=function () {
            var delay = $q.defer();
            $http.get('api/prefs/find').then(function (re) {
                console.log(re);

                delay.resolve(re);

            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };

        svc.save=function (p) {
            var delay = $q.defer();
            $http.post('api/prefs/save', p).then(function (re) {
                console.log(re);

                delay.resolve(re);

            }, function(er){
                delay.reject(er);
            });
            return delay.promise;
        };


        return svc;
    }]);


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

/**
 * Created by haffo on 5/4/15.
 */

angular.module('tcl').factory('ViewSettings',
    ['StorageService', function (StorageService) {
        var columnOptions = [
            { id: "usage", label: "Usage"},
            { id: "cardinality", label: "Cardinality"},
            { id: "length", label: "Length"},
            { id: "confLength", label: "Conf. Length"},
            { id: "datatype", label: "Datatype"},
            { id: "valueSet", label: "Value Set"},
            { id: "predicate", label: "Predicate"},
            { id: "confStatement", label: "Conf. Statement"},
            { id: "defText", label: "Defin. Text"},
            { id: "comment", label: "Comment"}
        ];
        var visibleColumns = StorageService.get(StorageService.TABLE_COLUMN_SETTINGS_KEY) == null ? angular.copy(columnOptions) : angular.fromJson(StorageService.get(StorageService.TABLE_COLUMN_SETTINGS_KEY));
        var ViewSettings = {
            columnOptions: columnOptions,
            visibleColumns: visibleColumns,
            translations: {buttonDefaultText: 'Visible Columns'},
            extra: {displayProp: 'label', buttonClasses: 'btn btn-xs btn-primary', showCheckAll: false, showUncheckAll: false, scrollable: false},
            tableRelevance:StorageService.get(StorageService.TABLE_RELEVANCE_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_RELEVANCE_SETTINGS),
            tableConcise:StorageService.get(StorageService.TABLE_CONCISE_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_CONCISE_SETTINGS),
            tableCollapse:StorageService.get(StorageService.TABLE_COLLAPSE_SETTINGS) == null ? true : StorageService.get(StorageService.TABLE_COLLAPSE_SETTINGS),
            tableReadonly:StorageService.get(StorageService.TABLE_READONLY_SETTINGS) == null ? false : StorageService.get(StorageService.TABLE_READONLY_SETTINGS),
            events: {
                onItemSelect: function (item) {
                    ViewSettings.setVisibleColumns();
                },
                onItemDeselect: function (item) {
                    ViewSettings.setVisibleColumns();
                }
            },

            setVisibleColumns: function () {
                StorageService.set(StorageService.TABLE_COLUMN_SETTINGS_KEY, angular.toJson(ViewSettings.visibleColumns));
            },
            setTableConcise: function (concise) {
                ViewSettings.tableConcise = concise;
                StorageService.set(StorageService.TABLE_CONCISE_SETTINGS, ViewSettings.tableConcise);
            },
            setTableRelevance: function (relevance) {
                ViewSettings.tableRelevance = relevance;
                StorageService.set(StorageService.TABLE_RELEVANCE_SETTINGS, ViewSettings.tableRelevance);
            },
            setTableCollapse: function (collapse) {
                ViewSettings.tableCollapse = collapse;
                StorageService.set(StorageService.TABLE_COLLAPSE_SETTINGS, ViewSettings.tableCollapse);
            },
            setTableReadonly: function (value) {
                ViewSettings.tableReadonly = value;
                StorageService.set(StorageService.TABLE_READONLY_SETTINGS, ViewSettings.tableReadonly);
            },
            isVisibleColumn: function (column) {
                for (var i = 0; i < ViewSettings.visibleColumns.length; i++) {
                    if (ViewSettings.visibleColumns[i].id === column) {
                        return true;
                    }
                }
                return false;
            }
        };
        return ViewSettings;
    }]);


'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the clientApp
 */
angular.module('tcl')
  .controller('AboutService', function ($scope) {

  });

/*jshint bitwise: false*/

'use strict';

angular.module('tcl')
	.service('base64', function base64() {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var keyStr = 'ABCDEFGHIJKLMNOP' +
        'QRSTUVWXYZabcdef' +
        'ghijklmnopqrstuv' +
        'wxyz0123456789+/' +
        '=';
    this.encode = function (input) {
        var output = '',
            chr1, chr2, chr3 = '',
            enc1, enc2, enc3, enc4 = '',
            i = 0;

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';
        }

        return output;
    };

    this.decode = function (input) {
        var output = '',
            chr1, chr2, chr3 = '',
            enc1, enc2, enc3, enc4 = '',
            i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

        while (i < input.length) {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = '';
            enc1 = enc2 = enc3 = enc4 = '';
        }
    };
});

'use strict';

angular.module('tcl').factory('i18n', function() {
    // AngularJS will instantiate a singleton by calling "new" on this function   
    var language;
    var setLanguage = function (theLanguage) {
        $.i18n.properties({
            name: 'messages',
            path: 'lang/',
            mode: 'map',
            language: theLanguage,
            callback: function () {
                language = theLanguage;
            }
        });
    };
    setLanguage('en');
    return {
        setLanguage: setLanguage
    };
});

/*angular.module('ehrRandomizerApp')
  .service('i18n', function i18n() {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var self = this;
    this.setLanguage = function (language) {
        $.i18n.properties({
            name: 'messages',
            path: 'lang/',
            mode: 'map',
            language: language,
            callback: function () {
                self.language = language;
            }
        });
    };
    this.setLanguage('en');
  });*/
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


'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the clientApp
 */
angular.module('tcl')
  .controller('MainService', function ($scope) {
  });

/**
 * Created by haffo on 2/6/15.
 */

//
//
//// Declare factory
//angular.module('tcl').factory('Users', function(Restangular) {
//    return Restangular.service('users');
//});
//


'use strict';

angular.module('tcl').filter('bytes', [
    function () {
        return function (bytes, precision) {
            if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) { return '-'; }
            if (typeof precision === 'undefined') { precision = 1; }
            var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
                number = Math.floor(Math.log(bytes) / Math.log(1024));
            return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
        };
    }
]);

/**
 * Created by haffo on 3/3/16.
 */

angular.module('tcl').filter('flavors',function(){
    return function(inputArray,name){
        return inputArray.filter(function(item){
            return item.name === name || angular.equals(item.name,name);
        });
    };
});
'use strict';

angular.module('tcl').filter('yesno', [ function () {
    return function (input) {
        return input ? 'YES' : 'NO';
    };
}]);
angular.module('tcl').directive('preventRightClick', [

function() {
	return {
		restrict : 'A',
		link : function($scope, $ele) {
			$ele.bind("contextmenu", function(e) {
				e.preventDefault();
			});
		}
	};
} ])
/**
 * Created by haffo on 4/5/15.
 */
angular.module('tcl').directive('click', ['$location', function($location) {
        return {
            link: function(scope, element, attrs) {
                element.on('click', function() {
                    scope.$apply(function() {
                        $location.path(attrs.clickGo);
                    });
                });
            }
        }
    }]);


//angular.module('tcl').directive('csSelect', function () {
//    return {
//        require: '^stTable',
//        template: '',
//        scope: {
//            row: '=csSelect'
//        },
//        link: function (scope, element, attr, ctrl) {
//
//            element.bind('change', function (evt) {
//                scope.$apply(function () {
//                    ctrl.select(scope.row, 'single');
//                });
//            });
//
//            scope.$watch('row.isSelected', function (newValue, oldValue) {
//                if (newValue === true) {
//                    element.parent().addClass('st-selected');
//                } else {
//                    element.parent().removeClass('st-selected');
//                }
//            });
//        }
//    };
//});

/**
 * Created by haffo on 10/20/15.
 */
angular.module('tcl').directive('compile', function ($compile) {
    return function(scope, element, attrs) {
        scope.$watch(
            function(scope) {
                // watch the 'compile' expression for changes
                return scope.$eval(attrs.compile);
            },
            function(value) {
                // when the 'compile' expression changes
                // assign it into the current DOM
                element.html(value);

                // compile the new DOM and link it to the current
                // scope.
                // NOTE: we only compile .childNodes so that
                // we don't get into infinite loop compiling ourselves
                $compile(element.contents())(scope);
            }
        );
    };
});

angular.module('tcl').directive('dynamic', function ($compile) {
    return {
      restrict: 'A',
      replace: true,
      scope: { dynamic: '=dynamic'},
      link: function postLink(scope, element, attrs) {
        scope.$watch( 'dynamic' , function(html){
          element.html(html);
          $compile(element.contents())(scope);
        });
      }
    };
  });
/**
 * Created by haffo on 2/13/15.
 */


angular.module('tcl').directive('csSelect', function () {
    return {
        require: '^stTable',
        template: '',
        scope: {
            row: '=csSelect'
        },
        link: function (scope, element, attr, ctrl) {

            element.bind('change', function (evt) {
                scope.$apply(function () {
                    ctrl.select(scope.row, 'single');
                });
            });

            scope.$watch('row.isSelected', function (newValue, oldValue) {
                if (newValue === true) {
                    element.parent().addClass('st-selected');
                } else {
                    element.parent().removeClass('st-selected');
                }
            });
        }
    };
});
angular.module('tcl').directive('windowExit', function($window, $templateCache,$http, $rootScope,StorageService,ViewSettings) {
    return {
        restrict: 'AE',
        //performance will be improved in compile
        compile: function(element, attrs){
            var myEvent = $window.attachEvent || $window.addEventListener,
                chkevent = $window.attachEvent ? 'onbeforeunload' : 'beforeunload'; /// make IE7, IE8 compatable
            myEvent(chkevent, function (e) { // For >=IE7, Chrome, Firefox
                $templateCache.removeAll();
            });
        }
    };
});
'use strict';

angular.module('tcl')
.directive('focus', [function () {
    return {
        restrict: 'EAC',
        link: function(scope, element, attrs) {
//            element[0].focus();
        }
    };
}]);

'use strict';

angular.module('tcl').directive('igCheckEmail', [ '$resource',
    function ($resource) {
        return {
            restrict: 'AC',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                var Email = $resource('api/sooa/emails/:email', {email: '@email'});

                var EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;

                element.on('keyup', function() {
                    if ( element.val().length !== 0 && EMAIL_REGEXP.test(element.val()) ) {
                        var emailToCheck = new Email({email:element.val()});
                        emailToCheck.$get(function() {
                            scope.emailUnique  = ((emailToCheck.text === 'emailNotFound') ? 'valid' : undefined);
                            scope.emailValid = (EMAIL_REGEXP.test(element.val()) ? 'valid' : undefined);
                            if(scope.emailUnique && scope.emailValid) {
                                ctrl.$setValidity('email', true);
                            } else {
                                ctrl.$setValidity('email', false);
                            }

                        }, function() {
//                            console.log('FAILURE to check email address');
                        });
                    }
                    else {
                        scope.emailUnique  = undefined;
                        scope.emailValid = undefined;
                        ctrl.$setValidity('email', false);
                    }
                });
            }
        };
    }
]);

'use strict';

//This directive is used to make sure both passwords match
angular.module('tcl').directive('igCheckEmployer', [
    function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var employer = '#' + attrs.igCheckEmployer;
                elem.add(employer).on('keyup', function () {
                    scope.$apply(function () {
//                        console.log('Pass1=', elem.val(), ' Pass2=', $(firstPassword).val());
                        var v = elem.val()===$(firstPassword).val();
                        ctrl.$setValidity('noMatch', v);
                    });
                });
            }
        };
    }
]);
'use strict';

//This directive is used to make sure both passwords match
angular.module('tcl').directive('igCheckPassword', [
    function () {
        return {
            require: 'ngModel',
            link: function (scope, elem, attrs, ctrl) {
                var firstPassword = '#' + attrs.igCheckPassword;
                elem.add(firstPassword).on('keyup', function () {
                    scope.$apply(function () {
//                        console.log('Pass1=', elem.val(), ' Pass2=', $(firstPassword).val());
                        var v = elem.val()===$(firstPassword).val();
                        ctrl.$setValidity('noMatch', v);
                    });
                });
            }
        };
    }
]);
'use strict';

angular.module('tcl').directive('igCheckPhone', [
    function () {
        return {
            restrict: 'AC',
            require: 'ngModel',
            link: function (scope, element, attrs, ctrl) {
                var NUMBER_REGEXP = /[0-9]*/;
                element.on('keyup', function() {
                     if ( element.val() &&  element.val() != null && element.val() != "") {
                             scope.phoneIsNumber  =  (NUMBER_REGEXP.test(element.val()))   && element.val() > 0 ? 'valid' : undefined;
                             scope.phoneValidLength  = element.val().length >= 7 ? 'valid' : undefined;
                             if(scope.phoneIsNumber && scope.phoneValidLength ) {
                                 ctrl.$setValidity('phone', true);
                             } else {
                                 ctrl.$setValidity('phone', false);
                             }
                     }
                     else {
                         scope.phoneIsNumber = undefined;
                         scope.phoneValidLength = undefined;
                         ctrl.$setValidity('phone', true);
                     }
                 });
            }
        };
    }
]);

'use strict';

angular.module('tcl').directive('igCheckPoaDate', [
    function () {
        return {
            replace: true,
            link: function (scope, elem, attrs, ctrl) {
                var startElem = elem.find('#inputStartDate');
                var endElem = elem.find('#inputEndDate');

                var ctrlStart = startElem.inheritedData().$ngModelController;
                var ctrlEnd = endElem.inheritedData().$ngModelController;

                var checkDates = function() {
                    var sDate = new Date(startElem.val());
                    var eDate = new Date(endElem.val());
                    if ( sDate < eDate ) {
                        //console.log("Good!");
                        ctrlStart.$setValidity('datesOK', true);
                        ctrlEnd.$setValidity('datesOK', true);
                    }
                    else {
                        //console.log(":(");
                        ctrlStart.$setValidity('datesOK', false);
                        ctrlEnd.$setValidity('datesOK', false);
                    }
                };

                startElem.on('change', checkDates);
                endElem.on('change', checkDates);
            }
        };
    }
]);
'use strict';

//This directive is used to make sure the start hour of a timerange is < of the end hour 
angular.module('tcl').directive('igCheckTimerange', [
    function () {
        return {
            replace: true,
            link: function (scope, elem, attrs, ctrl) {
                //elem is a div element containing all the select input
                //each one of them has a class for easy selection
                var myElem = elem.children();
                var sh = myElem.find('.shour');
                var sm = myElem.find('.sminute');
                var eh = myElem.find('.ehour');
                var em = myElem.find('.eminute');

                var ctrlSH, ctrlSM, ctrlEH, ctrlEM;
                ctrlSH = sh.inheritedData().$ngModelController;
                ctrlSM = sm.inheritedData().$ngModelController;
                ctrlEH = eh.inheritedData().$ngModelController;
                ctrlEM = em.inheritedData().$ngModelController;
               
                var newnew = true;

                var checkTimeRange = function() {
                    if ( newnew ) {
                        //We only do that once to set the $pristine field to false
                        //Because if $pristine==true, and $valid=false, the visual feedback 
                        //are not displayed
                        ctrlSH.$setViewValue(ctrlSH.$modelValue);
                        ctrlSM.$setViewValue(ctrlSM.$modelValue);
                        ctrlEH.$setViewValue(ctrlEH.$modelValue);
                        ctrlEM.$setViewValue(ctrlEM.$modelValue);
                        newnew = false;
                    }
                    //Getting a date object
                    var tmpDate = new Date();
                    //init the start time with the dummy date
                    var startTime = angular.copy(tmpDate);
                    //init the end time with the same dummy date
                    var endTime =  angular.copy(tmpDate);

                    startTime.setHours(sh.val());
                    startTime.setMinutes(sm.val());
                    endTime.setHours(eh.val());
                    endTime.setMinutes(em.val());
                    
                    if ( startTime < endTime ) {
                        //console.log("Excellent!");
                        ctrlSH.$setValidity('poaOK', true);
                        ctrlSM.$setValidity('poaOK', true);
                        ctrlEH.$setValidity('poaOK', true);
                        ctrlEM.$setValidity('poaOK', true);
                    }
                    else {
                        //console.log("Bad... :(");
                        ctrlSH.$setValidity('poaOK', false);
                        ctrlSM.$setValidity('poaOK', false);
                        ctrlEH.$setValidity('poaOK', false);
                        ctrlEM.$setValidity('poaOK', false);
                    }
                };

                sh.on('change', checkTimeRange);
                sm.on('change', checkTimeRange);
                eh.on('change', checkTimeRange);
                em.on('change', checkTimeRange);
            }
        };
    }
]);
'use strict';

angular.module('tcl').directive('igCheckUsername', [ '$resource',
	function ($resource) {
	    return {
	        restrict: 'AC',
	        require: 'ngModel',
	        link: function (scope, element, attrs, ctrl) {
	            var Username = $resource('api/sooa/usernames/:username', {username: '@username'});

	            element.on('keyup', function() {
	                if ( element.val().length >= 4 ) {
	                    var usernameToCheck = new Username({username:element.val()});
	                    //var delay = $q.defer();
	                    usernameToCheck.$get(function() {
	                        scope.usernameValidLength  = (element.val() && element.val().length >= 4 && element.val().length <= 20 ? 'valid' : undefined);
	                        scope.usernameUnique  = ((usernameToCheck.text === 'usernameNotFound') ? 'valid' : undefined);

	                        if(scope.usernameValidLength && scope.usernameUnique ) {
	                            ctrl.$setValidity('username', true);
	                        } else {
	                            ctrl.$setValidity('username', false);
	                        }

	                    }, function() {
	                        //console.log("FAILURE", usernameToCheck);
	                    });
	                }
	                else {
	                    scope.usernameValidLength = undefined;
	                    scope.usernameUnique = undefined;
	                    ctrl.$setValidity('username', false);
	                }
	            });
	        }
	    };
	}
]);

'use strict';

//This directive is used to check password to make sure they meet the minimum requirements
angular.module('tcl').directive('igPasswordValidate', [
	function () {
	    return {
	        require: 'ngModel',
	        link: function(scope, elm, attrs, ctrl) {
	            ctrl.$parsers.unshift(function(viewValue) {

	                scope.pwdValidLength = (viewValue && viewValue.length >= 7 ? 'valid' : undefined);
	                scope.pwdHasLowerCaseLetter = (viewValue && /[a-z]/.test(viewValue)) ? 'valid' : undefined;
	                scope.pwdHasUpperCaseLetter = (viewValue && /[A-Z]/.test(viewValue)) ? 'valid' : undefined;
	                scope.pwdHasNumber = (viewValue && /\d/.test(viewValue)) ? 'valid' : undefined;

	                if(scope.pwdValidLength && scope.pwdHasLowerCaseLetter && scope.pwdHasUpperCaseLetter && scope.pwdHasNumber) {
	                    ctrl.$setValidity('pwd', true);
	                    return viewValue;
	                } else {
	                    ctrl.$setValidity('pwd', false);
	                    return undefined;
	                }
	            });
	        }
	    };
	}
]);

'use strict';

//This directive is used to highlight the cehrt that is active
angular.module('tcl').directive('ehrbold', [
    function () {
        return {
            restrict: 'C',
            link: function(scope, element, attrs) {
//                element.on('click', function() {
//                    element.siblings().removeClass('cehrtactive');
//                    element.siblings().children().removeClass('cehrtDeleteButtonActive');
//                    element.siblings().children().addClass('cehrtDeleteButtonNotActive');
//
//                    element.addClass('cehrtactive');
//                    element.children().removeClass('cehrtDeleteButtonNotActive');
//                    element.children().addClass('cehrtDeleteButtonActive');
//                });
            }
        };
    }
]);

'use strict';

angular.module('tcl')
.directive('msg', [function () {
    return {
        restrict: 'EA',
        replace: true,
        link: function (scope, element, attrs) {
            //console.log("Dir");
            var key = attrs.key;
            if (attrs.keyExpr) {
                scope.$watch(attrs.keyExpr, function (value) {
                    key = value;
                    element.text($.i18n.prop(value));
                });
            }
            scope.$watch('language()', function (value) {
                element.text($.i18n.prop(key));
            });
        }
    };
}]);

/**
 * Created by haffo on 2/13/15.
 */
angular.module('tcl').directive('stRatio',function(){
    return {
        link:function(scope, element, attr){
            var ratio=+(attr.stRatio);
            element.css('width',ratio+'%');
        }
    };
});

'use strict';

//Angular doesn't perform any validation on file input.
//We bridge the gap by linking the required directive to the
//presence of a value on the input.
angular.module('tcl').directive('validTrustDocument', [
    function () {
        return {
            require:'ngModel',
            link:function(scope,el,attrs,ngModel){
                //change event is fired when file is selected
                el.bind('change', function() {
                    scope.$apply( function() {
                        ngModel.$setViewValue(el.val());
                        //console.log("validTrustDocument Val=", el.val());
                        //ngModel.$render();
                    });
                });
            }
        };
    }
]);

angular.module('tcl').controller('ContextMenuCtl', function ($scope, $rootScope, ContextMenuSvc) {

    $scope.clicked = function (item) {
        ContextMenuSvc.put(item);
    };
});
/**
 * Created by haffo on 3/3/16.
 */
angular.module('tcl').controller('ErrorDetailsCtrl', function ($scope, $modalInstance, error) {
    $scope.error = error;
    $scope.ok = function () {
        $modalInstance.close($scope.error);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});

app.controller('ErrorCtrl', [ '$scope', '$modalInstance', 'StorageService', '$window',
    function ($scope, $modalInstance, StorageService, $window) {
        $scope.refresh = function () {
            $modalInstance.close($window.location.reload());
        };
    }
]);

app.controller('FailureCtrl', [ '$scope', '$modalInstance', 'StorageService', '$window', 'error',
    function ($scope, $modalInstance, StorageService, $window, error) {
        $scope.error = error;
        $scope.close = function () {
            $modalInstance.close();
        };
    }
]);
'use strict';

/**
 * @ngdoc function
 * @name clientApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the clientApp
 */
angular.module('tcl')
  .controller('AboutCtrl', function ($scope, $rootScope) {

   $scope.releaseNotes = [
        {
            "version":$rootScope.appInfo.version,
            "date":$rootScope.appInfo.date,
            updates:[
                'Update License for Editor',' Update Select IG Document Types Buttons','Update Create IG Document dialog',' Update Export as Dialog'
            ]
        },
        {
            "version":'1.0.0-beta-2',
            "date":'03/07/2016',
            updates:[
                'Display the left side table of contents for HTML export','Add Image (pfg,gif,jpeg,jpg) upload feature',' Add File (word, html,pdf) Upload feature','Export IG Document as Word Document',
                'Display the list message events by version for the creation of a new IG Document','Handle the message level predicates and conformance statements','Added Issue and About Tabs'
            ]
        }
    ];



  });

'use strict';

/* "newcap": false */

angular.module('tcl')
.controller('UserProfileCtrl', ['$scope', '$resource', 'AccountLoader', 'Account', 'userInfoService', '$location',
    function ($scope, $resource, AccountLoader, Account, userInfoService, $location) {
        var PasswordChange = $resource('api/accounts/:id/passwordchange', {id:'@id'});

        $scope.accountpwd = {};

        $scope.initModel = function(data) {
            $scope.account = data;
            $scope.accountOrig = angular.copy($scope.account);
        };

        $scope.updateAccount = function() {
            //not sure it is very clean...
            //TODO: Add call back?
            new Account($scope.account).$save();

            $scope.accountOrig = angular.copy($scope.account);
        };

        $scope.resetForm = function() {
            $scope.account = angular.copy($scope.accountOrig);
        };

        //TODO: Change that: formData is only supported on modern browsers
        $scope.isUnchanged = function(formData) {
            return angular.equals(formData, $scope.accountOrig);
        };


        $scope.changePassword = function() {
            var user = new PasswordChange();
            user.username = $scope.account.username;
            user.password = $scope.accountpwd.currentPassword;
            user.newPassword = $scope.accountpwd.newPassword;
            user.id = $scope.account.id;
            //TODO: Check return value???
            user.$save().then(function(result){
                $scope.msg = angular.fromJson(result);
            });
        };

        $scope.deleteAccount = function () {
            var tmpAcct = new Account();
            tmpAcct.id = $scope.account.id;

            tmpAcct.$remove(function() {
                //console.log("Account removed");
                //TODO: Add a real check?
                userInfoService.setCurrentUser(null);
                $scope.$emit('event:logoutRequest');
                $location.url('/home');
            });
        };

        /*jshint newcap:false */
        AccountLoader(userInfoService.getAccountID()).then(
            function(data) {
                $scope.initModel(data);
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            },
            function() {
//                console.log('Error fetching account information');
            }
        );
    }
]);


angular.module('tcl')
    .controller('UserAccountCtrl', ['$scope', '$resource', 'AccountLoader', 'Account', 'userInfoService', '$location', '$rootScope',
        function ($scope, $resource, AccountLoader, Account, userInfoService, $location,$rootScope) {


            $scope.accordi = { account : true, accounts:false};
            $scope.setSubActive = function (id) {
                if(id && id != null) {
                    $rootScope.setSubActive(id);
                    $('.accountMgt').hide();
                    $('#' + id).show();
                }
            };
            $scope.initAccount = function(){
                if($rootScope.subActivePath == null){
                    $rootScope.subActivePath = "account";
                }
                $scope.setSubActive($rootScope.subActivePath);
            };


        }
    ]);

'use strict';

angular.module('tcl')
    .controller('AccountsListCtrl', ['$scope', 'MultiAuthorsLoader', 'MultiSupervisorsLoader','Account', '$modal', '$resource','AccountLoader','userInfoService','$location',
        function ($scope, MultiAuthorsLoader, MultiSupervisorsLoader, Account, $modal, $resource, AccountLoader, userInfoService, $location) {

            //$scope.accountTypes = [{ 'name':'Author', 'type':'author'}, {name:'Supervisor', type:'supervisor'}];
            //$scope.accountType = $scope.accountTypes[0];
            $scope.tmpAccountList = [].concat($scope.accountList);
            $scope.account = null;
            $scope.accountOrig = null;
            $scope.accountType = "author";
            $scope.scrollbarWidth = $scope.getScrollbarWidth();

//        var PasswordChange = $resource('api/accounts/:id/passwordchange', {id:'@id'});
            var PasswordChange = $resource('api/accounts/:id/userpasswordchange', {id:'@id'});
            var ApproveAccount = $resource('api/accounts/:id/approveaccount', {id:'@id'});
            var SuspendAccount = $resource('api/accounts/:id/suspendaccount', {id:'@id'});
            $scope.msg = null;

            $scope.accountpwd = {};

            $scope.updateAccount = function() {
                //not sure it is very clean...
                //TODO: Add call back?
                new Account($scope.account).$save();
                $scope.accountOrig = angular.copy($scope.account);
            };

            $scope.resetForm = function() {
                $scope.account = angular.copy($scope.accountOrig);
            };

            //TODO: Change that: formData is only supported on modern browsers
            $scope.isUnchanged = function(formData) {
                return angular.equals(formData, $scope.accountOrig);
            };

            $scope.changePassword = function() {
                var user = new PasswordChange();
                user.username = $scope.account.username;
                user.password = $scope.accountpwd.currentPassword;
                user.newPassword = $scope.accountpwd.newPassword;
                user.id = $scope.account.id;
                //TODO: Check return value???
                user.$save().then(function(result){
                    $scope.msg = angular.fromJson(result);
                });
            };

            $scope.loadAccounts = function(){
                if (userInfoService.isAuthenticated() && userInfoService.isAdmin()) {
                    $scope.msg = null;
                    new MultiAuthorsLoader().then(function (response) {
                        $scope.accountList = response;
                        $scope.tmpAccountList = [].concat($scope.accountList);
                    });
                }
            };

            $scope.initManageAccounts = function(){
                $scope.loadAccounts();
            };

            $scope.selectAccount = function(row) {
                $scope.accountpwd = {};
                $scope.account = row;
                $scope.accountOrig = angular.copy($scope.account);
            };

            $scope.deleteAccount = function() {
                $scope.confirmDelete($scope.account);
            };

            $scope.confirmDelete = function (accountToDelete) {
                var modalInstance = $modal.open({
                    templateUrl: 'ConfirmAccountDeleteCtrl.html',
                    controller: 'ConfirmAccountDeleteCtrl',
                    resolve: {
                        accountToDelete: function () {
                            return accountToDelete;
                        },
                        accountList: function () {
                            return $scope.accountList;
                        }
                    }
                });
                modalInstance.result.then(function (accountToDelete,accountList ) {
                    $scope.accountToDelete = accountToDelete;
                    $scope.accountList = accountList;
                }, function () {
                });
            };

            $scope.approveAccount = function() {
                var user = new ApproveAccount();
                user.username = $scope.account.username;
                user.id = $scope.account.id;
                user.$save().then(function(result){
                    $scope.account.pending = false;
                    $scope.msg = angular.fromJson(result);
                });
            };

            $scope.suspendAccount = function(){
                var user = new SuspendAccount();
                user.username = $scope.account.username;
                user.id = $scope.account.id;
                user.$save().then(function(result){
                    $scope.account.pending = true;
                    $scope.msg = angular.fromJson(result);
                });
            };


        }
    ]);



angular.module('tcl').controller('ConfirmAccountDeleteCtrl', function ($scope, $modalInstance, accountToDelete,accountList,Account) {

    $scope.accountToDelete = accountToDelete;
    $scope.accountList = accountList;
    $scope.delete = function () {
        //console.log('Delete for', $scope.accountList[rowIndex]);
        Account.remove({id:accountToDelete.id},
            function() {
                var rowIndex = $scope.accountList.indexOf(accountToDelete);
                if(index !== -1){
                    $scope.accountList.splice(rowIndex,1);
                }
                $modalInstance.close($scope.accountToDelete);
            },
            function() {
//                            console.log('There was an error deleting the account');
            }
        );
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
});






/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('ConfigCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q, $sce) {
	$scope.loading = false;


	$scope.initConfigs= function () {
		$scope.loadTestStoryConfigs();
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

	$scope.openDialogForEditTestStoryConfig = function (ev, tsc) {
        $rootScope.selectedTestStoryConfig = tsc;
        $mdDialog.show({
            controller: $scope.editTestStoryConfigModalCtrl,
            templateUrl: 'EditTestStoryModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: false // Only for -xs, -sm breakpoints.
        }).then(function() {
            $scope.loadTestStoryConfigs();
        }, function() {

        });
    };

    $scope.deleteTestStoryConfig = function (ev, tsc) {
        $rootScope.selectedTestStoryConfig = tsc;

        $http.post('api/config/' + $rootScope.selectedTestStoryConfig.id + '/delete').then(function (response) {
            $rootScope.msg().text = "testplanDeleteSuccess";
            $rootScope.msg().type = "success";
            $rootScope.msg().show = true;
            $rootScope.manualHandle = true;

            var idxP = _.findIndex($rootScope.testStoryConfigs, function (child) {
                return child.id === $rootScope.selectedTestStoryConfig.id;
            });
            $rootScope.testStoryConfigs.splice(idxP, 1);

        }, function (error) {
            $scope.error = error;
        });
    };

    $scope.editTestStoryConfigModalCtrl = function($scope, $mdDialog, $http, userInfoService) {
        $scope.needHelp = false;
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
    	if(!$rootScope.selectedTestStoryConfig){
            $scope.selectedTestStoryConfig =  angular.copy(_.find($rootScope.testStoryConfigs, function(config){ return config.accountId == 0; }));
            $scope.selectedTestStoryConfig.id = new ObjectId().toString();
            $scope.selectedTestStoryConfig.name = 'NewTestStoryTemplate';
            $scope.selectedTestStoryConfig.accountId = userInfoService.getAccountID();
    	}else{
            $scope.selectedTestStoryConfig = $rootScope.selectedTestStoryConfig;
		}
        $scope.setPosition=function(item, index){
            for(i=0; i<$scope.selectedTestStoryConfig.testStoryConfig.length; i++){
                $scope.selectedTestStoryConfig.testStoryConfig[i].position=i+1;
            }
        };

        $scope.addField=function(){
            $scope.selectedTestStoryConfig.testStoryConfig.push({id:new ObjectId().toString(),title:"new title", scope:"user", present:true, isSummaryEntry:false, position:$scope.selectedTestStoryConfig.testStoryConfig.length + 1});
        };

        $scope.deleteItem = function (index){
            $scope.selectedTestStoryConfig.testStoryConfig.splice(index, 1);
            $scope.setPosition();
        };

        $scope.cancel = function() {
            $mdDialog.hide();
        };

        $scope.saveTestStoryConfig = function() {
            $http.post('api/config/save', $scope.selectedTestStoryConfig).then(function (response) {
                $mdDialog.hide();
            }, function () {
            });
        };
    };
});

angular.module('tcl').controller('DocCtrl', function ($scope, $rootScope, $document, $templateCache, Restangular, $http, Notification, $sce) {
    $scope.selected = null;
    $scope.isChanged = false;
    $scope.editMode = true;
    $scope.selectedDocTitle = null;
    $scope.selectedDocument = null;

    $scope.addSlide = function(event) {
        $scope.isChanged = true;
        $scope.selectedDocument.slides.push({
            title: "Slide-" + ($scope.selectedDocument.slides.length + 1),
            contents : ""
        });
    };

    $scope.addDocument = function(event) {
        $scope.selectedDocTitle = null;
        $scope.isChanged = true;
        if (!$rootScope.tcamtDocument.generalDocuments) $rootScope.tcamtDocument.generalDocuments = [];

        var newDoc = {
            title: "New Document_" + ($rootScope.tcamtDocument.generalDocuments.length + 1),
            slides : [{
                title: "Slide-1",
                contents : ""
            }]
        };
        $scope.selectedDocument = newDoc;
        $scope.selectedDocTitle = newDoc.title;
        $rootScope.tcamtDocument.generalDocuments.push(newDoc);

        console.log($scope.selectedDocTitle);
    };

    $scope.changeDoc = function(value) {
        console.log(value);
        if(value === 'UserGuide') {
            $scope.selectedDocument = $rootScope.tcamtDocument.userGuide;
        } else if(value === 'HelpGuide') {
            $scope.selectedDocument = $rootScope.tcamtDocument.helpGuide;
        } else {
            for(var i in $rootScope.tcamtDocument.generalDocuments){
                if ($rootScope.tcamtDocument.generalDocuments[i].title === value)
                    $scope.selectedDocument = $rootScope.tcamtDocument.generalDocuments[i];
            }
        }
    };

    $scope.deleteDocument = function(event) {

    };

    $scope.deleteSlide = function() {
        if($scope.selected) {
            $scope.isChanged = true;
            var index = $scope.selectedDocument.slides.indexOf($scope.selected);
            if (index > -1) {
                $scope.selectedDocument.slides.splice(index, 1);
            }
        }
    };

    $scope.deleteDocument = function() {
        if($scope.selectedDocument) {
            var index = $rootScope.tcamtDocument.generalDocuments.indexOf($scope.selectedDocument);
            if (index > -1) {
                $scope.isChanged = true;
                $rootScope.tcamtDocument.generalDocuments.splice(index, 1);
            }

        }
    };

    $scope.changeMode = function() {
        $scope.editMode = !$scope.editMode;
    };

    $scope.save = function() {
        for(var i in $rootScope.tcamtDocument.userGuide.slides){
            $rootScope.tcamtDocument.userGuide.slides[i].position = i;
        }

        for(var i in $rootScope.tcamtDocument.helpGuide.slides){
            $rootScope.tcamtDocument.helpGuide.slides[i].position = i;
        }

        for(var i in $rootScope.tcamtDocument.generalDocuments){
            for(var j in $rootScope.tcamtDocument.generalDocuments[i].slides) {
                $rootScope.tcamtDocument.generalDocuments[i].slides[j].position = j;
            }
        }

        $http.post('api/tcamtdocument/save', $rootScope.tcamtDocument).then(function (response) {
            $scope.selected = null;
            $scope.isChanged = false;
            Notification.success({message:"Document saved", delay: 1000});
        }, function (error) {
            $rootScope.saved = false;
            Notification.error({message:"Failed to save", delay:1000});
        });
    };

    $scope.selectSlide = function(slide){
        $scope.selected = slide;
    };

    $scope.recordChanged = function () {
        $scope.isChanged = true;
    };


    $scope.initDoc = function () {
        if(!$rootScope.tcamtDocument) $rootScope.loadDocument();

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
    };

    $scope.isEditMode = function () {
        return $scope.editMode;
    };

    $scope.isSelected = function () {
        if($scope.selected) {
            return true;
        }
        return false;
    };

    $scope.getHtml = function () {
        if($scope.selected){
            return $sce.trustAsHtml($scope.selected.contents);
        }else {
            return null;
        }
    }

});

/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('DownloadCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $modal, $cookies, $timeout, userInfoService, ngTreetableParams, $interval, ViewSettings, StorageService, $q) {
	$scope.loading = false;


	$scope.initDownloads= function () {
		$scope.loadRBList();
	};

	$scope.loadRBList = function () {
		var delay = $q.defer();

		if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
			$scope.error = null;
			$rootScope.rbList = [];
			$scope.loading = true;
			$http.get('api/download/').then(function(response) {
				$rootScope.rbList = angular.fromJson(response.data);
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

	$scope.downloadXMLs = function (id) {
        var form = document.createElement("form");
        form.action = $rootScope.api('api/testplans/' + id + '/downloadProfileXMLs/');
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

    $scope.downloadRB = function (id) {
        var form = document.createElement("form");
        form.action = $rootScope.api('api/testplans/' + id + '/downloadRBZip/');
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
});
'use strict';

angular.module('tcl')
.controller('ForgottenCtrl', ['$scope', '$resource','Notification',
    function ($scope, $resource,Notification) {
        var ForgottenRequest = $resource('api/sooa/accounts/passwordreset', {username:'@username'});

        $scope.requestResetPassword =  function() {
            var resetReq = new ForgottenRequest();
            resetReq.username = $scope.username;
            resetReq.$save(function() {
            	console.log("password changed");
    			console.log(resetReq);
                if ( resetReq.text === 'resetRequestProcessed' ) {
        			Notification.success({message:"An e-mail with instructions on how to resest  has been sent ", delay:1500});
                    $scope.username = '';
                }else if (resetReq.text ==='wrongUsernameOrEmail'){
        			Notification.error({message:"The username/email address was not recognized. The reset request wont be processed", delay:1500});
                }
                
            });
        };
    }
]);

'use strict';

/* "newcap": false */

angular.module('tcl')
    .controller('IdleCtrl', function($scope, Idle, Keepalive, $modal,IdleService){
//        $scope.started = false;
//
//        function closeModals() {
//            if ($scope.warning) {
//                $scope.warning.close();
//                $scope.warning = null;
//            }
//
//            if ($scope.timedout) {
//                $scope.timedout.close();
//                $scope.timedout = null;
//            }
//        }
//
//        $scope.$on('IdleStart', function() {
//            closeModals();
//
//            $scope.warning = $modal.open({
//                templateUrl: 'warning-dialog.html',
//                windowClass: 'modal-danger'
//            });
//        });
//
//        $scope.$on('IdleEnd', function() {
//            closeModals();
//        });
//
//        $scope.$on('IdleTimeout', function() {
//            closeModals();
//            $scope.timedout = $modal.open({
//                templateUrl: 'timedout-dialog.html',
//                windowClass: 'modal-danger'
//            });
//        });
//
//        $scope.$on('Keepalive', function() {
//            IdleService.keepAlive();
//        });
//
//
//        $scope.start = function() {
//            closeModals();
//            Idle.watch();
//            $scope.started = true;
//        };
//
//        $scope.stop = function() {
//            closeModals();
//            Idle.unwatch();
//            $scope.started = false;
//
//        };
    });


'use strict';

angular.module('tcl').controller('IssueCtrl', ['$scope', '$resource',
    function ($scope, $resource) {
        var Issue = $resource('api/sooa/issues/:id');

        $scope.clearIssue = function() {
            $scope.issue.title = '';
            $scope.issue.description = '';
            $scope.issue.email = '';
        };

        $scope.submitIssue = function() {
            var issueToReport = new Issue($scope.issue);
            issueToReport.$save(function() {
                if ( issueToReport.text === '') {
                    $scope.clearIssue();
                }
            });
        };
    }
]);

'use strict';

angular.module('tcl').controller('MainCtrl', ['$scope', '$rootScope', 'i18n', '$location', 'userInfoService', '$modal', 'Restangular', '$filter', 'base64', '$http', 'Idle', 'notifications', 'IdleService','StorageService',
    function ($scope, $rootScope, i18n, $location, userInfoService, $modal, Restangular, $filter, base64, $http, Idle,notifications,IdleService,StorageService) {
        userInfoService.loadFromServer();
        $rootScope.loginDialog = null;
        $rootScope.loadProfiles = function () {
            if (userInfoService.isAuthenticated() && !userInfoService.isPending()) {
                waitingDialog.show('Loading ...', {dialogSize: 'xs', progressType: 'info'});
                $http.get('api/profiles').then(function(response) {
                    $rootScope.profiles = angular.fromJson(response.data);
                    $rootScope.privateProfiles = _.filter($rootScope.profiles , function(p){ return p.sourceType == 'private'; })
                    $rootScope.publicProfiles = _.filter($rootScope.profiles , function(p){ return p.sourceType == 'public'; });
                    waitingDialog.hide();
                }, function(error) {
                    waitingDialog.hide();
                });
            }else{
            }
        };

        $rootScope.loadDocument = function () {
            waitingDialog.show('Loading ...', {dialogSize: 'xs', progressType: 'info'});
            $http.get('api/tcamtdocument').then(function(response) {
                console.log(response);
                $rootScope.tcamtDocument = angular.fromJson(response.data);
                $rootScope.tcamtDocument.userGuide.slides.sort($rootScope.compare);
                $rootScope.tcamtDocument.helpGuide.slides.sort($rootScope.compare);
                if($rootScope.tcamtDocument.generalDocuments) {
                    for(var i in $rootScope.tcamtDocument.generalDocuments){
                        $rootScope.tcamtDocument.generalDocuments[i].slides.sort($rootScope.compare);
                    }
                }

                waitingDialog.hide();
            }, function(error) {
                waitingDialog.hide();
            });
        };


        $rootScope.compare = function (a,b) {
            if (a.position < b.position)
                return -1;
            if (a.position > b.position)
                return 1;
            return 0;
        }


        $rootScope.testDataCategorizations = ['Indifferent', 'Presence-Content Indifferent', 'Presence-Configuration',
            'Presence-System Generated', 'Presence-Test Case Proper', 'Presence Length-Content Indifferent',
            'Presence Length-Configuration', 'Presence Length-System Generated', 'Presence Length-Test Case Proper',
            'Value-Test Case Fixed', 'Value-Test Case Fixed List', 'NonPresence', 'Value-Profile Fixed', 'Value-Profile Fixed List'];


        $rootScope.findConformanceProfileMeta = function (ipid, cpid){
            for(var i in $rootScope.integrationAbstractProfiles){
                if(ipid === $rootScope.integrationAbstractProfiles[i].id){
                    for(var j in $rootScope.integrationAbstractProfiles[i].conformanceProfileMetaDataSet){
                        var cpMeta = $rootScope.integrationAbstractProfiles[i].conformanceProfileMetaDataSet[j];
                        if(cpMeta.id === cpid) return cpMeta;
                    }
                }
            };

            return null;
        };


        $rootScope.findIntegrationProfileMeta = function (ipid){
            for(var i in $rootScope.integrationAbstractProfiles){
                if(ipid === $rootScope.integrationAbstractProfiles[i].id){
                    return $rootScope.integrationAbstractProfiles[i].integrationProfileMetaData;
                }
            };

            return null;
        };

        $scope.language = function () {
            return i18n.language;
        };

        $scope.setLanguage = function (lang) {
            i18n.setLanguage(lang);
        };

        $scope.activeWhen = function (value) {
            return value ? 'active' : '';
        };

        $scope.activeIfInList = function (value, pathsList) {
            var found = false;
            if (angular.isArray(pathsList) === false) {
                return '';
            }
            var i = 0;
            while ((i < pathsList.length) && (found === false)) {
                if (pathsList[i] === value) {
                    return 'active';
                }
                i++;
            }
            return '';
        };

        $scope.path = function () {
            return $location.url();
        };

        $scope.login = function () {
//        console.log("in login");
            $scope.$emit('event:loginRequest', $scope.username, $scope.password);
        };

        $scope.loginReq = function () {
//        console.log("in loginReq");
            if ($rootScope.loginMessage()) {
                $rootScope.loginMessage().text = "";
                $rootScope.loginMessage().show = false;
            }
            $scope.$emit('event:loginRequired');
        };

        $scope.logout = function () {
            $scope.execLogout();
        };

        $scope.execLogout = function () {
            userInfoService.setCurrentUser(null);
            $scope.username = $scope.password = null;
            $scope.$emit('event:logoutRequest');
            $location.url('/tp');
        };

        $scope.cancel = function () {
            $scope.$emit('event:loginCancel');
        };

        $scope.isAuthenticated = function () {
            return userInfoService.isAuthenticated();
        };

        $scope.isPending = function () {
            return userInfoService.isPending();
        };


        $scope.isSupervisor = function () {
            return userInfoService.isSupervisor();
        };

        $scope.isVendor = function () {
            return userInfoService.isAuthorizedVendor();
        };

        $scope.isAuthor = function () {
            return userInfoService.isAuthor();
        };

        $scope.isCustomer = function () {
            return userInfoService.isCustomer();
        };

        $scope.isAdmin = function () {
            return userInfoService.isAdmin();
        };

        $rootScope.isAdmin = function () {
            return userInfoService.isAdmin();
        };

        $scope.getRoleAsString = function () {
            if ($scope.isAuthor() === true) {
                return 'author';
            }
            if ($scope.isSupervisor() === true) {
                return 'Supervisor';
            }
            if ($scope.isAdmin() === true) {
                return 'Admin';
            }
            return 'undefined';
        };

        $scope.getUsername = function () {
            if (userInfoService.isAuthenticated() === true) {
                return userInfoService.getUsername();
            }
            return '';
        };

        $rootScope.showLoginDialog = function (username, password) {

            if ($rootScope.loginDialog && $rootScope.loginDialog != null && $rootScope.loginDialog.opened) {
                $rootScope.loginDialog.dismiss('cancel');
            }

            $rootScope.loginDialog = $modal.open({
                backdrop: 'static',
                keyboard: 'false',
                controller: 'LoginCtrl',
                size: 'lg',
                templateUrl: 'views/account/login.html',
                resolve: {
                    user: function () {
                        return {username: $scope.username, password: $scope.password};
                    }
                }
            });

            $rootScope.loginDialog.result.then(function (result) {
                if (result) {
                    $scope.username = result.username;
                    $scope.password = result.password;
                    $scope.login();
                } else {
                    $scope.cancel();
                }
            });
        };

        $rootScope.started = false;

        Idle.watch();

        $rootScope.$on('IdleStart', function () {
            closeModals();
            $rootScope.warning = $modal.open({
                templateUrl: 'warning-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $rootScope.$on('IdleEnd', function () {
            closeModals();
        });

        $rootScope.$on('IdleTimeout', function () {
            closeModals();
            if ($scope.isAuthenticated()) {
                $rootScope.$emit('event:execLogout');
            }
            $rootScope.timedout = $modal.open({
                templateUrl: 'timedout-dialog.html',
                windowClass: 'modal-danger'
            });
        });

        $scope.$on('Keepalive', function() {
            if ($scope.isAuthenticated()) {
                IdleService.keepAlive();
            }
        });

        $rootScope.$on('event:execLogout', function () {
            $scope.execLogout();
        });

        function closeModals() {
            if ($rootScope.warning) {
                $rootScope.warning.close();
                $rootScope.warning = null;
            }

            if ($rootScope.timedout) {
                $rootScope.timedout.close();
                $rootScope.timedout = null;
            }
        };

        $rootScope.start = function () {
            closeModals();
            Idle.watch();
            $rootScope.started = true;
        };

        $rootScope.stop = function () {
            closeModals();
            Idle.unwatch();
            $rootScope.started = false;

        };


        $scope.checkForIE = function () {
            var BrowserDetect = {
                init: function () {
                    this.browser = this.searchString(this.dataBrowser) || 'An unknown browser';
                    this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || 'an unknown version';
                    this.OS = this.searchString(this.dataOS) || 'an unknown OS';
                },
                searchString: function (data) {
                    for (var i = 0; i < data.length; i++) {
                        var dataString = data[i].string;
                        var dataProp = data[i].prop;
                        this.versionSearchString = data[i].versionSearch || data[i].identity;
                        if (dataString) {
                            if (dataString.indexOf(data[i].subString) !== -1) {
                                return data[i].identity;
                            }
                        }
                        else if (dataProp) {
                            return data[i].identity;
                        }
                    }
                },
                searchVersion: function (dataString) {
                    var index = dataString.indexOf(this.versionSearchString);
                    if (index === -1) {
                        return;
                    }
                    return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
                },
                dataBrowser: [
                    {
                        string: navigator.userAgent,
                        subString: 'Chrome',
                        identity: 'Chrome'
                    },
                    {   string: navigator.userAgent,
                        subString: 'OmniWeb',
                        versionSearch: 'OmniWeb/',
                        identity: 'OmniWeb'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'Apple',
                        identity: 'Safari',
                        versionSearch: 'Version'
                    },
                    {
                        prop: window.opera,
                        identity: 'Opera',
                        versionSearch: 'Version'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'iCab',
                        identity: 'iCab'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'KDE',
                        identity: 'Konqueror'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'Firefox',
                        identity: 'Firefox'
                    },
                    {
                        string: navigator.vendor,
                        subString: 'Camino',
                        identity: 'Camino'
                    },
                    {       // for newer Netscapes (6+)
                        string: navigator.userAgent,
                        subString: 'Netscape',
                        identity: 'Netscape'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'MSIE',
                        identity: 'Explorer',
                        versionSearch: 'MSIE'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'Gecko',
                        identity: 'Mozilla',
                        versionSearch: 'rv'
                    },
                    {       // for older Netscapes (4-)
                        string: navigator.userAgent,
                        subString: 'Mozilla',
                        identity: 'Netscape',
                        versionSearch: 'Mozilla'
                    }
                ],
                dataOS: [
                    {
                        string: navigator.platform,
                        subString: 'Win',
                        identity: 'Windows'
                    },
                    {
                        string: navigator.platform,
                        subString: 'Mac',
                        identity: 'Mac'
                    },
                    {
                        string: navigator.userAgent,
                        subString: 'iPhone',
                        identity: 'iPhone/iPod'
                    },
                    {
                        string: navigator.platform,
                        subString: 'Linux',
                        identity: 'Linux'
                    }
                ]

            };
            BrowserDetect.init();

            if (BrowserDetect.browser === 'Explorer') {
                var title = 'You are using Internet Explorer';
                var msg = 'This site is not yet optimized with Internet Explorer. For the best user experience, please use Chrome, Firefox or Safari. Thank you for your patience.';
                var btns = [
                    {result: 'ok', label: 'OK', cssClass: 'btn'}
                ];

                //$dialog.messageBox(title, msg, btns).open();


            }
        };


    }]);

angular.module('tcl').controller('LoginCtrl', ['$scope', '$modalInstance', 'user', function ($scope, $modalInstance, user) {
    $scope.user = user;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.login = function () {
//        console.log("logging in...");
        $modalInstance.close($scope.user);
    };
}]);


angular.module('tcl').controller('RichTextCtrl', ['$scope', '$modalInstance', 'editorTarget', function ($scope, $modalInstance, editorTarget) {
    $scope.editorTarget = editorTarget;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.close($scope.editorTarget);
    };
}]);


angular.module('tcl').controller('InputTextCtrl', ['$scope', '$modalInstance', 'editorTarget', function ($scope, $modalInstance, editorTarget) {
    $scope.editorTarget = editorTarget;

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.close = function () {
        $modalInstance.close($scope.editorTarget);
    };
}]);

angular.module('tcl').controller('ConfirmLogoutCtrl', ["$scope", "$modalInstance", "$rootScope", "$http", function ($scope, $modalInstance, $rootScope, $http) {
    $scope.logout = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


/**
 * Created by Jungyub on 5/12/16
 */

angular.module('tcl').controller('ProfileCtrl', function ($document, $scope, $rootScope, $templateCache, Restangular, $http, $filter, $mdDialog, $sce) {
	$scope.loading = false;

	$scope.initProfiles= function () {
		if(!$rootScope.profiles || $rootScope.profiles == [] ) $rootScope.loadProfiles();
	};

	$scope.confirmDeletePublicProfile = function(ev, profile) {
		var confirm = $mdDialog.prompt()
			.title('Are you sure you want to delete the Public Profile?')
			.textContent('This operation is irreversible.')
			.targetEvent(ev)
			.ok('Confirm')
			.cancel('Cancel');

		$mdDialog.show(confirm).then(function(result) {
            $http.post('api/profiles/' + profile.id + '/delete').then(function () {
                $rootScope.msg().text = "profileDeleteSuccess";
                $rootScope.msg().type = "success";
                $rootScope.msg().show = true;
                $rootScope.manualHandle = true;
                $rootScope.loadProfiles();
            }, function (error) {
                $scope.error = error;
                $scope.loading = false;
                $rootScope.msg().text = "profileDeleteFailed";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
		}, function() {
		});
	};

	$scope.confirmDeletePrivateProfile = function(ev, profile) {
		var confirm = $mdDialog.confirm()
			.title('Are you sure you want to delete the Profile?')
			.textContent('This operation is irreversible')
			.ariaLabel('Lucky day')
			.targetEvent(ev)
			.ok('Confirm')
			.cancel('Cancel');

		$mdDialog.show(confirm).then(function() {

            $http.post('api/profiles/' + profile.id + '/delete').then(function () {
                $rootScope.msg().text = "profileDeleteSuccess";
                $rootScope.msg().type = "success";
                $rootScope.msg().show = true;
                $rootScope.manualHandle = true;
                $rootScope.loadProfiles();
            }, function (error) {
                $scope.error = error;
                $scope.loading = false;
                $rootScope.msg().text = "profileDeleteFailed";
                $rootScope.msg().type = "danger";
                $rootScope.msg().show = true;
            });
		}, function() {
		});
	};

	$scope.openDialogForImportXMLProfile = function (ev) {
		$mdDialog.show({
			controller: $scope.ImportXMLProfileModalCtrl,
			templateUrl: 'ImportXMLProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {

		});
	};

	$scope.openDialogForReplacePrivateProfile = function (ev, profile) {
		$rootScope.toBeReplaceProfileId = profile.id;
		$mdDialog.show({
			controller: $scope.ReplaceXMLProfileModalCtrl,
			templateUrl: 'ReplaceXMLProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {
		});
	};

    $scope.openDialogToShowProfile = function (ev, profile, m) {
        $mdDialog.show({
            controller: $scope.ShowProfileModalCtrl,
            templateUrl: 'ShowProfileModal.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:false,
            fullscreen: true, // Only for -xs, -sm breakpoints.
            locals: {
                profile: profile,
                m : m
            },
        }).then(function() {
        }, function() {
        });
    };

    $scope.ShowProfileModalCtrl = function($scope,$mdDialog,$http, profile, m) {
        $scope.profile = profile;
        $scope.m = m;

        console.log(profile);
        console.log(m);
        $scope.cancel = function() {
            $mdDialog.hide();
        };

    };

	$scope.saveProfileName = function(profile) {
        $http.post('api/profiles/saveProfileMeta', profile).then(function (response) {
            var result = response.data;
            if(result.success){
                $scope.checkLoadAll();
            }
        }, function (e) {
        });
    }

	$scope.openDialogForReplacePublicProfile = function (ev, profile) {
		$rootScope.toBeReplaceProfileId = profile.id;
		$mdDialog.show({
			controller: $scope.ReplacePublicProfileModalCtrl,
			templateUrl: 'ReplacePublicProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {
		});
	};

	$scope.openDialogForImportXMLPublicProfile = function (ev) {
		$mdDialog.show({
			controller: $scope.ImportXMLPublicProfileModalCtrl,
			templateUrl: 'ImportXMLPublicProfileModal.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:false,
			fullscreen: false // Only for -xs, -sm breakpoints.
		}).then(function() {
            $rootScope.loadProfiles();
		}, function() {

		});
	};

	$scope.ImportXMLPublicProfileModalCtrl = function($scope, $mdDialog, $http) {
        $scope.needHelp = false;
		$scope.xmlFilesData = {};

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
			var importProfileButton = $("#importPublicProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				importProfileButton.prop('disabled', false);
			}

		};

        $scope.validateForProfileXMLFile = function(files) {
            var f = document.getElementById('profilePublicFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForPublicProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForPublicProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForPublicProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForValueSetXMLFile = function(files) {
            var f = document.getElementById('valueSetPublicFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForValueSetPublic");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForValueSetPublic");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForValueSetPublic");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForConstraintsXMLFile = function(files) {
            var f = document.getElementById('constraintsPublicFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForConstraintsPublic");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForConstraintsPublic");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForConstraintsPublic");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

		$scope.importProfileXML = function() {
			var importProfileButton = $("#importPublicProfileButton");
			importProfileButton.prop('disabled', true);
			$http.post('api/profiles/importXMLFilesForPublic', $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};

	$scope.ReplacePublicProfileModalCtrl = function($scope, $mdDialog, $http) {
        $scope.needHelp = false;
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
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var replaceProfileButton = $("#replacePublicProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				replaceProfileButton.prop('disabled', false);
			}

		};

        $scope.validateForProfileXMLFile = function(files) {
            var f = document.getElementById('replacePublicProfileXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplacePublicProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplacePublicProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplacePublicProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForValueSetXMLFile = function(files) {
            var f = document.getElementById('replacePublicValueSetXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplacePublicValueSet");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplacePublicValueSet");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplacePublicValueSet");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForConstraintsXMLFile = function(files) {
            var f = document.getElementById('replacePublicConstraintsXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplacePublicConstraints");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplacePublicConstraints");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplacePublicConstraints");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

		$scope.replaceProfileXML = function() {
			var replaceProfileButton = $("#replacePublicProfileButton");
			replaceProfileButton.prop('disabled', true);

			$http.post('api/profiles/replaceXMLFiles/' + $rootScope.toBeReplaceProfileId, $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};

	$scope.ReplaceXMLProfileModalCtrl  = function($scope, $mdDialog, $http) {
        $scope.needHelp = false;
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
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var replaceProfileButton = $("#replaceProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				replaceProfileButton.prop('disabled', false);
			}

		};

        $scope.validateForProfileXMLFile = function(files) {
            var f = document.getElementById('replaceProfileXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplaceProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplaceProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplaceProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForValueSetXMLFile = function(files) {
            var f = document.getElementById('replaceValueSetXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplaceValueSet");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplaceValueSet");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplaceValueSet");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

        $scope.validateForConstraintsXMLFile = function(files) {
            var f = document.getElementById('replaceConstraintsXMLFile').files[0];
            var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForReplaceConstraints");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForReplaceConstraints");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForReplaceConstraints");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
        };

		$scope.replaceProfileXML = function() {
			var replaceProfileButton = $("#replaceProfileButton");
			replaceProfileButton.prop('disabled', true);

			$http.post('api/profiles/replaceXMLFiles/' + $rootScope.toBeReplaceProfileId, $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};

	$scope.ImportXMLProfileModalCtrl = function($scope, $mdDialog, $http) {
        $scope.needHelp = false;
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
		$scope.xmlFilesData = {};
		$scope.cancel = function() {
			$mdDialog.hide();
		};

		$scope.checkLoadAll = function (){
			var importProfileButton = $("#importProfileButton");
			if($scope.xmlFilesData.profileXMLFileStr != null && $scope.xmlFilesData.valueSetXMLFileStr != null && $scope.xmlFilesData.constraintsXMLFileStr != null){
				importProfileButton.prop('disabled', false);
			}

		};

		$scope.validateForProfileXMLFile = function(files) {
			var f = document.getElementById('profileXMLFile').files[0];
			var reader = new FileReader();
            reader.readAsText(f);
			reader.onloadend = function(e) {
				var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyProfileByXSD', xmlReq).then(function (response) {
                	var result = response.data;
                	if(result.success){
                        $scope.xmlFilesData.profileXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForXMLProfile");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
					}else{
                        var errorElm = $("#errorMessageForXMLProfile");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
						}
					}
                }, function (e) {
                    var errorElm = $("#errorMessageForXMLProfile");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
			};
		};

		$scope.validateForValueSetXMLFile = function(files) {
			var f = document.getElementById('valueSetXMLFile').files[0];
			var reader = new FileReader();
            reader.readAsText(f);
			reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyValueSetByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.valueSetXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForValueSetXML");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForValueSetXML");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForValueSetXML");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
			};
		};

		$scope.validateForConstraintsXMLFile = function(files) {
			var f = document.getElementById('constraintsXMLFile').files[0];
			var reader = new FileReader();
            reader.readAsText(f);
            reader.onloadend = function(e) {
                var xmlReq = {};
                xmlReq.xml = reader.result;
                $http.post('api/profiles/verifyConstraintByXSD', xmlReq).then(function (response) {
                    var result = response.data;
                    if(result.success){
                        $scope.xmlFilesData.constraintsXMLFileStr = reader.result;
                        var errorElm = $("#errorMessageForConstraintsXML");
                        errorElm.empty();
                        errorElm.append('<li>' + files[0].name + ' is valid!</li>');
                        $scope.checkLoadAll();
                    }else{
                        var errorElm = $("#errorMessageForConstraintsXML");
                        errorElm.empty();
                        errorElm.append('<li style="color: red;">' + files[0].name + ' is not valid!</li>');
                        if(result.e){
                            errorElm.append('<li style="color: red;">[Line-' + result.e.lineNumber + ']' + result.e.message + '</li>');
                        }
                    }
                }, function (e) {
                    var errorElm = $("#errorMessageForConstraintsXML");
                    errorElm.empty();
                    errorElm.append('<li style="color: red;">' + files[0].name + ' cannot be loaded!</li>');
                });
            };
		};

		$scope.importProfileXML = function() {
			var importProfileButton = $("#importProfileButton");
			importProfileButton.prop('disabled', true);

			$http.post('api/profiles/importXMLFiles', $scope.xmlFilesData).then(function (response) {
				$mdDialog.hide();
			}, function () {
			});
		};
	};
});
'use strict';

angular.module('tcl')
.controller('RegisterResetPasswordCtrl', ['$scope', '$resource', '$modal', '$routeParams', 'isFirstSetup',
    function ($scope, $resource, $modal, $routeParams, isFirstSetup) {
        $scope.agreed = false;
        $scope.displayForm = true;
        $scope.isFirstSetup = isFirstSetup;

        if ( !angular.isDefined($routeParams.username) ) {
            $scope.displayForm = false;
        }
        if ( $routeParams.username === '' ) {
            $scope.displayForm = false;
        }
        if ( !angular.isDefined($routeParams.token) ) {
            $scope.displayForm = false;
        }
        if ( $routeParams.token === '' ) {
            $scope.displayForm = false;
        }
        if ( !angular.isDefined($routeParams.userId) ) {
            $scope.displayForm = false;
        }
        if ( $routeParams.userId === '' ) {
            $scope.displayForm = false;
        }

        //to register an account for the first time
        var AcctInitPassword = $resource('api/sooa/accounts/register/:userId/passwordreset', {userId:'@userId', token:'@token'});
        //to reset the password  
        var AcctResetPassword = $resource('api/sooa/accounts/:id/passwordreset', {id:'@userId', token:'@token'});

        $scope.user = {};
        $scope.user.username = $routeParams.username;
        $scope.user.newUsername = $routeParams.username;
        $scope.user.userId = $routeParams.userId;
        $scope.user.token = $routeParams.token;



//        $scope.confirmRegistration = function() {
//            var modalInstance = $modal.open({
//                backdrop: true,
//                keyboard: true,
//                backdropClick: false,
//                controller: 'AgreementCtrl',
//                templateUrl: 'views/agreement.html'
//            });
//            modalInstance.result.then(function (result) {
//                if(result) {
//                    var initAcctPass = new AcctInitPassword($scope.user);
//                    initAcctPass.signedConfidentialityAgreement = true;
//                    initAcctPass.$save(function() {
//                        $scope.user.password = '';
//                        $scope.user.passwordConfirm = '';
//                    });
//                }
//                else {
//                    //console.log("Agreement not accepted");
//                }
//            });
//        };

        $scope.changePassword = function() {
            if($scope.agreed) {
                var resetAcctPass = new AcctResetPassword($scope.user);
                resetAcctPass.$save(function () {
                    $scope.user.password = '';
                    $scope.user.passwordConfirm = '';
                });
            }
        };
    }
]);

'use strict';

angular.module('tcl')
.controller('RegistrationCtrl', ['$scope', '$resource', '$modal', '$location',
    function ($scope, $resource, $modal, $location) {
        $scope.account = {};
        $scope.registered = false;
        $scope.agreed = false;

        //Creating a type to check with the server if a username already exists.
        var Username = $resource('api/sooa/usernames/:username', {username: '@username'});
        var Email = $resource('api/sooa/emails/:email', {email: '@email'});

        var NewAccount = $resource('api/sooa/accounts/register');

        $scope.registerAccount = function() {
            if($scope.agreed) {
                //console.log("Creating account");
                var acctToRegister = new NewAccount();
                acctToRegister.accountType = 'author';
                acctToRegister.employer =  $scope.account.employer;
                acctToRegister.fullName =  $scope.account.fullName;
                acctToRegister.phone =  $scope.account.phone;
                acctToRegister.title =  $scope.account.title;
                acctToRegister.juridiction =  $scope.account.juridiction;
                acctToRegister.username =  $scope.account.username;
                acctToRegister.password =  $scope.account.password;
                acctToRegister.email =  $scope.account.email;
                acctToRegister.signedConfidentialityAgreement = true;
                acctToRegister.$save(
                    function() {
                        if (acctToRegister.text ===  'userAdded') {
                            $scope.account = {};
                            //should unfreeze the form
                            $scope.registered = true;
                            $location.path('/registrationSubmitted');
                        }else{
                            $scope.registered = false;
                        }
                    },
                    function() {
                        $scope.registered = false;
                    }
                );
                //should freeze the form - at least the button
                $scope.registered = true;
            }
        };

//        $scope.registerAccount = function() {
//            /* Check for username already in use
//               Verify email not already associated to an account
//               Will need to send an email if success
//               */
//            var modalInstance = $modal.open({
//                backdrop: true,
//                keyboard: true,
//                backdropClick: false,
//                controller: 'AgreementCtrl',
//                templateUrl: 'views/account/agreement.html'
//            });
//
//            modalInstance.result.then(function(result) {
//                if(result) {
//                    //console.log("Creating account");
//                    var acctToRegister = new NewAccount();
//                    acctToRegister.accountType = 'provider';
//                    acctToRegister.company =  $scope.account.company;
//                    acctToRegister.firstname =  $scope.account.firstname;
//                    acctToRegister.lastname =  $scope.account.lastname;
//                    acctToRegister.username =  $scope.account.username;
//                    acctToRegister.password =  $scope.account.password;
//                    acctToRegister.email =  $scope.account.email;
//                    acctToRegister.signedConfidentialityAgreement = true;
//
//                    acctToRegister.$save(
//                        function() {
//                            if (acctToRegister.text ===  'userAdded') {
//                                $scope.account = {};
//                                //should unfreeze the form
//                                $scope.registered = true;
//                                $location.path('/home');
//                            }
//                        },
//                        function() {
//                            $scope.registered = false;
//                        }
//                    );
//                    //should freeze the form - at least the button
//                    $scope.registered = true;
//                }
//                else {
//                    //console.log('Account not created');
//                }
//            });
//        };
    }
]);
//
//angular.module('igl').controller('AgreementCtrl', ['$scope', '$modalInstance',
//    function ($scope, $modalInstance) {
//
//        $scope.acceptAgreement =  function() {
//            var res = true;
//            $modalInstance.close(res);
//        };
//
//        $scope.doNotAcceptAgreement =  function() {
//            var res = false;
//            $modalInstance.close(res);
//        };
//    }
//]);

/**
 * Created by ena3 on 3/21/17.
 */
angular.module('tcl').controller('loginTestingTool', ['$scope', '$rootScope', '$mdDialog', 'loginTestingToolSvc', 'base64', '$http', '$q', 'Notification', 'testplan','StorageService','$timeout','$window',function ($scope, $rootScope, $mdDialog, loginTestingToolSvc, base64, $http, $q, Notification, testplan,StorageService,$timeout,$window) {

    $scope.exportStep = 'LOGIN_STEP';
    $scope.xmlFormat = 'Validation';
    $scope.selectedMessagesIDs = [];
    $scope.loading = false;
    $scope.info = {text: undefined, show: false, type: null, details: null};
    $scope.redirectUrl = null;
    $scope.user = {username: StorageService.getGvtUsername(), password: StorageService.getGvtPassword()};
    $scope.appInfo = $rootScope.appInfo;
    $scope.selected = false;
    $scope.targetApps = _.sortBy($rootScope.appInfo.connectApps,'position');
    $scope.targetDomains = null;
    $scope.error = null;
    $scope.testplan=testplan;
    $scope.app= $scope.targetApps.length && $scope.targetApps.length? $scope.targetApps[0]:null;

    $scope.target = {
        url: null, domain: null
    };


    $scope.newDomain = null;

    $scope.toggleCustom=function (customURl) {


        if(customURl) {

            $scope.targetApps = _.sortBy($rootScope.appInfo.connectApps, 'position');

            $scope.app = $scope.targetApps.length && $scope.targetApps.length ? $scope.targetApps[0] : null;

        }else{
            $scope.app={url:""};

        }
    };



    $scope.selectTargetUrl = function () {
        console.log("Target URL Change");
        console.log($scope.app.url);
        StorageService.set("EXT_TARGET_URL", $scope.app.url);
        $scope.loadingDomains = false;
        $scope.targetDomains = null;
        $scope.target.domain = null;
        $scope.newDomain = null;
        $scope.error = null;
    };

    $scope.selectTargetDomain = function () {
        $scope.newDomain = null;
        if ($scope.target.domain != null) {
            StorageService.set($scope.app.url + "/EXT_TARGET_DOMAIN", $scope.target.domain);
        }
    };


    $scope.trackSelections = function () {
        $scope.selected = false;
        for (var i in $scope.igdocumentToSelect.profile.messages.children) {
            var message = $scope.igdocumentToSelect.profile.messages.children[i];
            if (message.selected) $scope.selected = true;
        }
    };

    $scope.selectionAll = function (bool) {
        for (var i in $scope.igdocumentToSelect.profile.messages.children) {
            var message = $scope.igdocumentToSelect.profile.messages.children[i];
            message.selected = bool;
        }
        $scope.selected = bool;
    };

    $scope.generatedSelectedMessagesIDs = function () {
        $scope.selectedMessagesIDs = [];
        for (var i in $scope.igdocumentToSelect.profile.messages.children) {
            var message = $scope.igdocumentToSelect.profile.messages.children[i];
            if (message.selected) {
                $scope.selectedMessagesIDs.push(message.id);
            }
        }
    };


    $scope.goBack = function () {
        $scope.error = null;
        if ($scope.exportStep === 'DOMAIN_STEP') {
            $scope.exportStep = 'LOGIN_STEP';
        } else if ($scope.exportStep === 'ERROR_STEP') {
            $scope.loadDomains();
        }
    };

    $scope.login = function () {
        loginTestingToolSvc.login($scope.user.username, $scope.user.password, $scope.app.url).then(function (auth) {

            console.log($scope.user);
            StorageService.setGvtUsername($scope.user.username);
            StorageService.setGvtPassword($scope.user.password);
            StorageService.setGVTBasicAuth(auth);
            $scope.loadDomains();
        }, function (error) {
            $scope.error = "Invalid credentials";
        });
    };

    $scope.loadDomains = function () {
        $scope.targetDomains = [];
        $scope.target.domain = null;
        if($scope.app.url != null) {
            loginTestingToolSvc.getDomains($scope.app.url, StorageService.getGVTBasicAuth()).then(function (result) {
                $scope.targetDomains = result;
                var savedTargetDomain = StorageService.get($scope.app.url + "/EXT_TARGET_DOMAIN");
                if (savedTargetDomain != null) {
                    for (var targetDomain in $scope.targetDomains) {
                        if (targetDomain.domain === savedTargetDomain) {
                            $scope.target.domain = savedTargetDomain;
                            break;
                        }
                    }
                } else {
                    if ($scope.targetDomains != null && $scope.targetDomains.length == 1) {
                        $scope.target.domain = $scope.targetDomains[0].domain;
                    }
                }
                $scope.exportStep = 'DOMAIN_STEP';
                $scope.selectTargetDomain();
                $scope.loadingDomains = false;
            }, function (error) {

                $scope.loadingDomains = false;
            });
        }
    };


    $scope.goNext = function () {
        console.log($scope.gvtLoginForm);
        $scope.error = null;
        if ($scope.exportStep === 'LOGIN_STEP') {
            $scope.login();
        } else if ($scope.exportStep === 'DOMAIN_STEP') {
            $scope.exportToGVT();
        } else if ($scope.exportStep === 'ERROR_STEP') {
            $scope.loadDomains();
        }
    };

    $scope.createNewDomain = function () {
        $scope.newDomain = {name: null, key: null, homeTitle: null};
        $scope.error = null;
        $scope.target.domain = null;
    };




    $scope.cancel = function () {
        $mdDialog.hide();
    };


    $scope.showErrors = function (errorDetails) {
        $scope.exportStep = 'ERROR_STEP';

    };
    $scope.exportToGVT = function () {
        $scope.info.text = null;
        $scope.info.show = false;
        $scope.info.type = 'danger';
        $scope.info['details'] = null;
        var auth = StorageService.getGVTBasicAuth();
        if ($scope.app.url != null && $scope.target.domain != null && auth != null) {
            $scope.loading = true;
            loginTestingToolSvc.exportToGVT($scope.testplan.id, auth, $scope.app.url, $scope.target.domain).then(function (map) {
                $scope.loading = false;
                var response = angular.fromJson(map.data);
                if (response.success === false) {
                    $scope.info.text = "gvtExportFailed";
                    $scope.info['details'] = response.report;
                    $scope.showErrors($scope.info.details);
                    $scope.info.show = true;
                    $scope.info.type = 'danger';
                } else {
                    var token = response.token;
                    $scope.exportStep = 'ERROR_STEP';
                    $scope.info.text = 'gvtRedirectInProgress';
                    $scope.info.show = true;
                    $scope.info.type = 'info';
                    $scope.redirectUrl = $scope.app.url + $rootScope.appInfo.connectUploadTokenContext + "?x=" + encodeURIComponent(token) + "&y=" + encodeURIComponent(auth) + "&d=" + encodeURIComponent($scope.target.domain);
                   // $scope.redirectUrl = $scope.app.url + $rootScope.appInfo.connectUploadTokenContext + "?x=" + encodeURIComponent(token) + "&d=" + encodeURIComponent($scope.target.domain);
                    console.log($scope.redirectUrl);
                    $timeout(function () {
                        $scope.loading = false;
                        $window.open($scope.redirectUrl, "_blank");
                    }, 1000);
                }
            }, function (error) {
                $scope.info.text = "gvtExportFailed";
                $scope.info['details'] = "Sorry, we couldn't push your profiles. Please contact the administrator for more information";
                $scope.info.show = true;
                $scope.info.type = 'danger';
                $scope.loading = false;
                $scope.exportStep = 'ERROR_STEP';
            });
        }
    };


    $scope.exportAsZIPToGVT = function () {
        console.log("Calling ");
        $scope.loading = true;
        $scope.error = null;
        if ($scope.newDomain != null) {
            $scope.newDomain.key = $scope.newDomain.name.replace(/\s+/g, '-').toLowerCase();
            loginTestingToolSvc.createDomain(StorageService.getGVTBasicAuth(), $scope.app.url, $scope.newDomain.key, $scope.newDomain.name, $scope.newDomain.homeTitle).then(function (domain) {
                $scope.loading = false;
                $scope.target.domain = $scope.newDomain.key;

                $scope.exportToGVT();
            }, function (error) {
                console.log("ERROR");
                console.log(error);


                $scope.loading = false;
                if(error.data){
                    $scope.error= error.data.text?error.data.text: error.data;
                }else {
                    $scope.error=error;
                }

            });
        } else if ($scope.app.url != null && $scope.target.domain != null) {
            $scope.exportToGVT();
        }
    };


    if ($scope.targetApps != null) {
        var savedTargetUrl = StorageService.get("EXT_TARGET_URL");
        if (savedTargetUrl && savedTargetUrl != null) {
            for (var targetApp in $scope.targetApps) {
                if (targetApp.url === savedTargetUrl) {
                    $scope.app.url = targetApp.url;
                    break;
                }
            }
        } else if ($scope.targetApps.length == 1) {
            $scope.app.url = $scope.targetApps[0].url;
        }
        $scope.selectTargetUrl();
    }
}])

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
    $scope.selectSegmentByPath = function (path) {
        let selectedSeg = $scope.findFirstSegmentByPath(path);
        if(selectedSeg !== null) {
            $scope.selectSegment(selectedSeg);
        }
    };

    $scope.findFirstSegmentByPath= function (path) {
        for(let i in $rootScope.segmentList){
            if($rootScope.segmentList[i].iPath.indexOf(path.replace(/\s/g, '')) > -1) {
                return $rootScope.segmentList[i];
            }
        }
        return null;
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

    $scope.retrieveTriggerInfoForSpecificNodeByPath = function (path) {
        const selectedSeg = $scope.findFirstSegmentByPath(path);
        let retrieveTrigger = {};
        if(selectedSeg && selectedSeg.positionIPath && selectedSeg.positionPath) {
            const iPathList = selectedSeg.iPath.split('.');
            const iPositionPathList = selectedSeg.positionIPath.split('.');
            const positionPathList = selectedSeg.positionPath.split('.');
            const pathList = selectedSeg.path.split('.');
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
                let orderIndifferentInfo = $rootScope.selectedTestStep.orderIndifferentInfoMap[currentIPositionPath];
                if(orderIndifferentInfo && orderIndifferentInfo.orderSpecific) {
                    triggerInfo = orderIndifferentInfo.triggerInfo;
                    triggerInfo.type = 'local';
                }

                if (!triggerInfo) {
                    orderIndifferentInfo = $rootScope.selectedTestStep.orderIndifferentInfoMap[currentPositionPath];
                }
                if(orderIndifferentInfo && orderIndifferentInfo.orderSpecific) {
                    triggerInfo = orderIndifferentInfo.triggerInfo;
                }

                if(triggerInfo) {
                    retrieveTrigger = {
                        currentIPath : currentIPath,
                        currentIPositionPath : currentIPositionPath,
                        currentPositionPath : currentPositionPath,
                        currentPath : currentPath,
                        triggerInfo : triggerInfo,
                    };
                }
            }
        }
        return retrieveTrigger;
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

    $scope.findLocationTriggerValue = function(str){
        let result = str.split('^');
        result.shift();

        if(result.length > 0) return result;

        return null;
    }

    $scope.checkDuplication = function(list, item) {
        console.log(item, list);
        for (let i = 0; i < list.length; i++){
            if(list[i].split('^')[0] !== item && list[i].split('^')[0].indexOf(item) > -1) return true;
        }
        return false;
    }
    $scope.findRelatedSegmentInstancePaths = function (orderIndifferentNode, segmentList) {
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
                    const resultKeys = Object.keys(result);

                    for (const resultKey of resultKeys) {
                        const str = result[resultKey].join(' , ');
                        errorList.push([str, resultKey].join('^'));
                    }
                }

                return errorList;
            }
        }
        return [];
    };

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

                    console.log(resultKeys);

                    for (const resultKey of resultKeys) {
                        const str = result[resultKey].join(' , ');
                        if (!upsideDownResult[str]) upsideDownResult[str] = [];
                        upsideDownResult[str].push(resultKey);
                    }
                    const upsideDownResultKeys = Object.keys(upsideDownResult);
                    for (const upsideDownResultKey of upsideDownResultKeys) {
                            errorList.push([upsideDownResultKey, ...upsideDownResult[upsideDownResultKey]].join('^'));
                    }
                }

                return errorList;
            }
        }
        return [];
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
            if(node.type == 'field') {
                if(node.orderIndifferentInfo) {
                    node.orderIndifferentInfo.orderIndifferent = !node.orderIndifferentInfo.orderSpecific;
                }
                return 'FieldTree.html';
            }
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
    console.log($rootScope.selectedTestStep.testDataCategorizationMap);
    $scope.orderIndifferentInfo = orderIndifferentInfo;
    $scope.relatedSegmentList = $rootScope.segmentList.filter(seg => seg.iPath.startsWith($scope.orderIndifferentInfo.currentIPath));
    $scope.profileData = profileData;
    $scope.conformanceProfile = conformanceProfile;
    $scope.activeTab = [];
    $scope.relatedSegmentList.forEach((item, index) => {
        if (index === 0 ) $scope.activeTab[index] = !$scope.activeTab[index];
        else $scope.activeTab[index] = false;
    });

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

    $scope.retriveUsageByField = function (segmentId, i) {
        const seg = _.find($scope.profileData.integrationProfile.segments, function(seg){
            return seg.id == segmentId;
        });

        if(seg) {
            return seg.children[i-1].usage;
        }
        return null;
    };

    $scope.updateParsingResult = function() {

        let found = $rootScope.selectedTestStep.orderIndifferentInfoMap[$scope.orderIndifferentInfo.currentIPositionPath];
        if(!found) {
            found = $rootScope.selectedTestStep.orderIndifferentInfoMap[$scope.orderIndifferentInfo.currentPositionPath];
        }

        if(found) {
            $scope.relatedSegmentList.forEach(seg => {
                if (seg.parsingResult) {
                    for (const item of seg.parsingResult) {
                        for (const listItem of found.triggerInfo.list) {
                            console.log(seg.path + '.' + item.path, listItem.namePath);
                            if ((seg.path + '.' + item.path).substring($scope.orderIndifferentInfo.currentPath.length + 1) === listItem.namePath) {
                                item.isTrigger = true;
                            }
                        }
                    }
                }
            });
        }
    };

    $scope.replaceDot2Dash = function(path){
        return path.split('.').join('-');
    };

    $scope.relatedSegmentList.forEach(seg => {
        seg.parsingResult = [];
        const segmentId = seg.segmentDef.id;
        const fieldList = seg.lineStr.split('|');

        for (let i = 1; i < fieldList.length; i++){
            const fValue = fieldList[i];
            if (fValue && fValue !== '') {
                let fDT = null;
                let fUsage = null;
                const fIPath = seg.iPath + "." + i + "[1]";
                const fTD =  $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(fIPath)];
                fUsage = $scope.retriveUsageByField(segmentId, i);
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
                                usage : fUsage,
                                dt : fDT.name,
                                td: fTD,
                            }
                        );
                    } else {
                        const componentList = fValue.split('^');
                        for (let j = 0; j < componentList.length; j++){
                            const cValue = componentList[j];
                            if (cValue && cValue !== '') {
                                const cDT = $scope.retriveDatatypeByComponent(fDT.children[j].datatypeId);
                                const cUsage = fDT.children[j].usage;
                                const cIPath = fIPath + "." + (j + 1) + "[1]";
                                const cTD =  $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(cIPath)];
                                if(cDT) {
                                    if(!cDT.children) {
                                        seg.parsingResult.push(
                                            {
                                                path : i + '.' + (j + 1),
                                                value : cValue,
                                                usage : cUsage,
                                                dt : cDT.name,
                                                td : cIPath,
                                                td: cTD,
                                            }
                                        );
                                    } else {
                                        const subComponentList = cValue.split('&');
                                        for (let k = 0; k < subComponentList.length; k++){
                                            const scValue = subComponentList[k];
                                            if (scValue && scValue !== '') {
                                                const scDT = $scope.retriveDatatypeByComponent(cDT.children[k].datatypeId);
                                                const scUsage = cDT.children[k].usage;
                                                const scIPath = cIPath + "." + (k + 1) + "[1]";
                                                const scTD =  $rootScope.selectedTestStep.testDataCategorizationMap[$scope.replaceDot2Dash(scIPath)];
                                                if(scDT) {
                                                    seg.parsingResult.push(
                                                        {
                                                            path : i + '.' + (j + 1) + '.' + (k + 1),
                                                            value : scValue,
                                                            usage : scUsage,
                                                            dt : scDT.name,
                                                            td : scTD,
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

        $scope.updateParsingResult();
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
                    $scope.selectedNode.orderIndifferentInfo.triggerInfo.description = "Primary Trigger: " + this.getSegmentByRef($scope.selectedNode.ref).name + '-' + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[0].namePath;
                }else if($scope.selectedNode.type === 'group'){
                    $scope.selectedNode.orderIndifferentInfo.triggerInfo.description =  "Primary Trigger: " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[0].namePath;
                }
            }else if($scope.selectedNode.orderIndifferentInfo.triggerInfo.list && $scope.selectedNode.orderIndifferentInfo.triggerInfo.list.length > 1){
                if($scope.selectedNode.orderIndifferentInfo.triggerInfo.operation) {
                    var result = '';

                    for(var i in $scope.selectedNode.orderIndifferentInfo.triggerInfo.list) {
                        if(i == 0) {
                            if($scope.selectedNode.type === 'segment'){
                                result = "[Global Trigger: " + this.getSegmentByRef($scope.selectedNode.ref).name + '-' + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }else if($scope.selectedNode.type === 'group'){
                                result =  "[Global Trigger: " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }
                        }else {
                            if($scope.selectedNode.type === 'segment'){
                                result = result + " " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.operation + " [Primary Trigger: " + this.getSegmentByRef($scope.selectedNode.ref).name + '-' + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
                            }else if($scope.selectedNode.type === 'group'){
                                result = result + " " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.operation + " [Primary Trigger: " + $scope.selectedNode.orderIndifferentInfo.triggerInfo.list[i].namePath + "]";
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

/**
 * Created by haffo on 5/4/15.
 */

(function (angular) {
    'use strict';
    var mod = angular.module('hit-validation-result', []);

    mod.directive('validationResult', [
        function () {
            return {
                restrict: 'A',
                scope: {
                    type: '@',
                    message: '=',
                    dqa: '=',
                    tree: '=',
                    editor: '=',
                    cursor: '=',
                    format: '='
                },
                templateUrl: 'ValidationResult.html',
                replace: false,
                controller: 'ValidationResultCtrl'
            };
        }
    ]);


    mod.directive('validationResultTable', [
        function () {
            return {
                restrict: 'A',
                templateUrl: 'ValidationResultTable.html',
                replace: false
            };
        }
    ]);

    mod
        .controller('ValidationResultCtrl', ['$scope', '$filter', '$modal', '$rootScope', 'ValidationResultHighlighter', '$sce', 'NewValidationResult', '$timeout', 'ServiceDelegator', 'Settings', 'TestExecutionService',function ($scope, $filter, $modal, $rootScope, ValidationResultHighlighter, $sce, NewValidationResult, $timeout,ServiceDelegator,Settings,TestExecutionService) {
            $scope.validationTabs = new Array();
            $scope.currentType = null;
            $scope.settings = Settings;
            $scope.validationResultOriginal = null;
            $scope.activeTab = 0;
            $scope.validationResult = null;
            $scope.loadingCategory = false;
            $scope.validResultHighlither = null;
            $scope.active = {
                errors: true,
                alerts: false,
                warnings: false,
                informationals: false,
                affirmatives: false
            };

            $scope.subActive = {
                errors: {
                },
                alerts: {
                },
                warnings: {
                },
                informationals: {
                },
                affirmatives: {
                }
            };

            $scope.checkboxConfig = {
            };

            $scope.failuresConfig = {
                errors: {
                    className: "failure failure-errors",
                    checked: false,
                    active: false
                },
                alerts: {
                    className: "failure failure-alerts",
                    checked: false,
                    active: false
                },
                warnings: {
                    className: "failure failure-warnings",
                    checked: false,
                    active: false
                },
                informationals: {
                    className: "failure failure-infos",
                    checked: false,
                    active: false
                },
                affirmatives: {
                    className: "failure failure-affirmatives",
                    checked: false,
                    active: false
                }
            };

             $scope.currentCategory = null;
            $scope.currentType =null;
            $scope.tmpData = [];

            $scope.showDetails = function (element) {
                var modalInstance = $modal.open({
                    templateUrl: 'ValidationResultDetailsCtrl.html',
                    controller: 'ValidationResultDetailsCtrl',
                    resolve: {
                        selectedElement: function () {
                            return element;
                        }
                    }
                });
                modalInstance.result.then(function (selectedItem) {
                    $scope.selectedElement = selectedItem;
                }, function () {
                });
            };



            $scope.showValidationTable = function (currentCategory, currentType) {
                $scope.loadingCategory = true;
                $scope.currentCategory = currentCategory;
                $scope.currentType = currentType;
                $scope.tmpData = [].concat($scope.currentCategory.data);
                $scope.subActive = {};
                $scope.subActive[currentType] = {};
                $scope.subActive[currentType][currentCategory.title] = true;
                $scope.loadingCategory = false;
            };


            $scope.generateItemHashCode = function (item) {
               return item.path  + item.category + item['classification'] + item.description;
            };


            $scope.select = function (element) {
                var coordinate = null;
                if (element != undefined && element.path != null && element.line != -1) {
                    var node = $scope.treeService.selectNodeByPath($scope.tree.root, element.line, element.path);
                    if(node != null) {
                        var endIndex = $scope.treeService.getEndIndex(node, $scope.editor.instance.getValue());
                        node.data.endIndex = endIndex;
                        coordinate = angular.copy(node.data);
                        coordinate.lineNumber = element.line;
                    }else{
                       coordinate = $scope.cursorService != null ? $scope.cursorService.createCoordinate(element.line,element.column +1,element.column +1,element.column +1,false): null;
                    }
                    if(coordinate != null) {
                        $scope.cursor.init(coordinate, false);
                        if ($scope.editorService != null) {
                            $scope.editorService.select($scope.editor.instance, $scope.cursor);
                        }
                    }
                }
            };

            $scope.$on($scope.type + ':removeDuplicates', function (event) {
                if( $scope.validationResult  != null && !$scope.validationResult.duplicatesRemoved){
                    $scope.validationResultOriginal = angular.copy($scope.validationResult);
                    $scope.validationResult.removeAllDuplicates();
                }
                $timeout(function () {
                    $scope.$emit($scope.type + ':duplicatesRemoved');
                });
            });

            var destroyEvent1 = $rootScope.$on($scope.type + ':validationResultLoaded', function (event, mvResult,testStep) {

                if($scope.format != null) {
                    $scope.editorService = ServiceDelegator.getEditorService($scope.format);
                    $scope.treeService = ServiceDelegator.getTreeService($scope.format);
                    $scope.cursorService = ServiceDelegator.getCursorService($scope.format);
                }
                var report = null;
                var validationResult = null;
                var validationResultId = null;
                if (mvResult !== null && mvResult != undefined) {
                    if (!mvResult.result) {
                        validationResult = new NewValidationResult();
                        validationResult.init(mvResult.json);
                        mvResult['result'] = validationResult;
                    } else {
                        validationResult = mvResult.result;
                    }
                }

                if(testStep.testingType != 'TA_RESPONDER'){
                    var rs = TestExecutionService.getTestStepValidationResult(testStep);
                    if(rs === undefined) { // set default
                        TestExecutionService.setTestStepValidationResult(testStep, TestExecutionService.getTestStepMessageValidationResultDesc(testStep));
                    }
                }

                $timeout(function () {
                    if($scope.type === 'cb'){ // TODO: remove dependency
                        var reportType = testStep.testContext && testStep.testContext != null ? 'cbValidation': 'cbManual';
                        $rootScope.$emit(reportType + ':updateTestStepValidationReport', mvResult,testStep);
                    }else{
                        $rootScope.$emit($scope.type + ':createMessageValidationReport', mvResult,testStep);
                        console.log("createMessageValidationReport called");
                    }
                });

                $scope.validationResult = validationResult;
                if ($scope.validationResult && $scope.validationResult != null) {

                    $scope.checkboxConfig['errors'] = {};
                    $scope.checkboxConfig['alerts'] = {};
                    $scope.checkboxConfig['warnings'] = {};
                    $scope.checkboxConfig['affirmatives'] = {};
                    $scope.checkboxConfig['informationals'] = {};

                    if(validationResult.errors && validationResult.errors.categories) {
                        angular.forEach(validationResult.errors.categories, function (category) {
                            $scope.checkboxConfig['errors'][category.title] = false;
                        });
                    }
                    if(validationResult.alerts&& validationResult.alerts.categories) {
                        angular.forEach(validationResult.alerts.categories, function (category) {
                            $scope.checkboxConfig['alerts'][category.title] = false;
                        });
                    }
                    if(validationResult.warnings&& validationResult.warnings.categories) {
                        angular.forEach(validationResult.warnings.categories, function (category) {
                            $scope.checkboxConfig['warnings'][category.title] = false;
                        });
                    }
                    if(validationResult.affirmatives&& validationResult.affirmatives.categories) {
                        angular.forEach(validationResult.affirmatives.categories, function (category) {
                            $scope.checkboxConfig['affirmatives'][category.title] = false;
                        });
                    }
                    if(validationResult.informationals && validationResult.informationals.categories) {
                        angular.forEach(validationResult.informationals.categories, function (category) {
                            $scope.checkboxConfig['informationals'][category.title] = false;
                        });
                    }
                    $scope.validResultHighlither = new ValidationResultHighlighter($scope.failuresConfig, $scope.er7MessageOnlineValidation, $scope.validationResult, $scope.tree, $scope.editor, $scope.checkboxConfig, $scope.treeService);
                    $scope.failuresConfig.errors.checked = false;
                    $scope.failuresConfig.warnings.checked = false;
                    $scope.failuresConfig.alerts.checked = false;
                    $scope.failuresConfig.informationals.checked = false;
                    $scope.failuresConfig.affirmatives.checked = false;
                    $scope.firstLoaded = false;
                    $scope.hideAllFailures();
                    $scope.active = {};
                    $scope.active["errors"] = true;
                    $scope.showValidationTable($scope.validationResult['errors'].categories[0], 'errors');
                }
            });


            $scope.hideAllFailures = function () {
                if ($scope.validResultHighlither != null) {
                    $scope.validResultHighlither.hideAllFailures();
                }
            };

            $scope.showFailures = function () {
//                if (event.isPropagationStopped()) {
//                    event.stopPropagation();
//                }
//                if (angular.element(event.currentTarget).prop('tagName') === 'INPUT') {
//                    event.stopPropagation();
//                }
                if ($scope.validResultHighlither != null)
                    $scope.validResultHighlither.toggleFailures($scope.currentType, $scope.currentCategory);
            };

            $scope.isVFailureChecked = function (type) {
                return $scope.failuresConfig[type].checked;
            };

            $scope.toHTML = function (content) {
                return $sce.trustAsHtml(content);
            };


            $rootScope.$on('$destroy', function() {
                destroyEvent1(); // remove listener.
            });


            $scope.scrollbarWidth = $rootScope.getScrollbarWidth();

        }]);


    mod.factory('ValidationResultHighlighter', function ($http, $q) {
        var ValidationResultHighlighter = function (failuresConfig, message, result, tree, editor, checkboxConfig,treeService) {
            this.failuresConfig = failuresConfig;
            this.histMarksMap = {};
            this.message = message;
            this.result = result;
            this.tree = tree;
            this.editor = editor;
            this.checkboxConfig = checkboxConfig;
            this.treeService = treeService;
        };

        ValidationResultHighlighter.prototype.getHistMarksMap = function () {
            return this.histMarksMap;
        };

        ValidationResultHighlighter.prototype.hideFailures = function (hitMarks) {
            if (hitMarks && hitMarks.length > 0) {
                for (var i = 0; i < hitMarks.length; i++) {
                    hitMarks[i].clear();
                }
                hitMarks.length = 0;
            }
        };

        ValidationResultHighlighter.prototype.hideAllFailures = function () {
            this.hideFailures(this.histMarksMap['errors']);
            this.hideFailures(this.histMarksMap['warnings']);
            this.hideFailures(this.histMarksMap['affirmatives']);
            this.hideFailures(this.histMarksMap['informationals']);
            this.hideFailures(this.histMarksMap['alerts']);
        };

        ValidationResultHighlighter.prototype.showFailures = function (type, category) {
            if (this.result && this.result != null && this.tree.root) {
                //if(category.checked) {
                var failures = category.data;
                var colorClass = this.failuresConfig[type].className;
                var hitMarks = this.histMarksMap[type];
                var root = this.tree.root;
                var editor = this.editor;
                var content = this.message.content;
                var histMarksMap = this.histMarksMap;
                var that = this;
                if (!hitMarks || hitMarks.length === 0) {
                    this.checkboxConfig[type][category.title] = true;
                    angular.forEach(failures, function (failure) {
                        var node = that.treeService.findByPath(root, failure.line, failure.path);
                        if (node != null && node.data && node.data != null) {
                            that.treeService.getEndIndex(node, content);
                            var startLine = parseInt(node.data.start && node.data.start != null ? node.data.start.line : failure.line) -1;
                            var endLine = parseInt(node.data.end && node.data.end != null ? node.data.end.line: failure.line) -1;
                            var startIndex = parseInt(node.data.start && node.data.start != null ? node.data.start.index: node.data.startIndex) -1;
                            var endIndex = parseInt(node.data.end && node.data.end != null ? node.data.end.index: node.data.endIndex) -1;
                            var markText = editor.instance.doc.markText({
                                line: startLine,
                                ch: startIndex
                            }, {
                                line: endLine,
                                ch: endIndex
                            }, {atomic: true, className: colorClass, clearWhenEmpty: true, clearOnEnter: true, title: failure.description
                            });

                            if (!histMarksMap[type]) {
                                histMarksMap[type] = [];
                            }
                            histMarksMap[type].push(markText);
                        }
                    });
                } else {
                    this.checkboxConfig[type][category.title] = false;
                    this.hideFailures(this.histMarksMap[type]);
                }
            }
        };

        ValidationResultHighlighter.prototype.toggleFailures = function (type, category) {
            if (this.result && this.result != null && this.tree.root) {
                //if(category.checked) {
                var failures = category.data;
                var colorClass = this.failuresConfig[type].className;
                var hitMarks = this.histMarksMap[type];
                var root = this.tree.root;
                var editor = this.editor;
                var content = this.message.content;
                var histMarksMap = this.histMarksMap;
                var that = this;
                if(category.title === 'All'){
                    for (var key in this.checkboxConfig[type]) {
                        this.checkboxConfig[type][key] = this.checkboxConfig[type][category.title];
                    }
                }
                if (this.checkboxConfig[type][category.title]) {
                     angular.forEach(failures, function (failure) {
                        var node = that.treeService.findByPath(root, failure.line, failure.path);
                        if (node != null && node.data && node.data != null) {
                            try {
                                that.treeService.getEndIndex(node, content);
                                var startLine = parseInt(node.data.start && node.data.start != null ? node.data.start.line : failure.line) - 1;
                                var endLine = parseInt(node.data.end && node.data.end != null ? node.data.end.line : failure.line) - 1;
                                var startIndex = parseInt(node.data.start && node.data.start != null ? node.data.start.index : node.data.startIndex) - 1;
                                var endIndex = parseInt(node.data.end && node.data.end != null ? node.data.end.index : node.data.endIndex) - 1;
                                var markText = editor.instance.doc.markText({
                                    line: startLine,
                                    ch: startIndex
                                }, {
                                    line: endLine,
                                    ch: endIndex
                                }, {atomic: true, className: colorClass, clearWhenEmpty: true, clearOnEnter: true, title: failure.description
                                });
                                if (!histMarksMap[type]) {
                                    histMarksMap[type] = [];
                                }
                                histMarksMap[type].push(markText);
                            }catch(e){

                            }
                        }
                    });
                } else {
                     this.hideFailures(this.histMarksMap[type]);
                }
            }
        };

        return ValidationResultHighlighter;
    });


    mod.factory('NewValidationResult', function (ValidationResult, ValidationResultItem) {
        var NewValidationResult = function (key) {
            ValidationResult.apply(this, arguments);
            this.json = null;
            this.duplicatesRemoved = false;
        };

        var Entry = function () {
            this.description = null;
            this.path = null;
            this.line = null;
            this.column = null;
            this.value = null;
            this.details = null;
            this.instance = null;
            this.id = new Date().getTime();
            this.failureType = null;
        };

        Entry.prototype.initLocation = function (l) {
            if (l) {
                this.desc = l.desc;
                this.path = l.path;
                this.line = l.line;
                this.column = l.column;
            }
        };

        NewValidationResult.prototype = Object.create(ValidationResult.prototype);
        NewValidationResult.prototype.constructor = NewValidationResult;

        var guid = function () {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        };


        NewValidationResult.prototype.addResult = function (entryObject, entry) {
            var all = this.getCategory(entryObject, "All");
            all.data.push(entry);
            var other = this.getCategory(entryObject, entry.category);
            other.data.push(entry);
        };


        NewValidationResult.prototype.getCategory = function (entryObject, categoryType) {
            if (categoryType) {
                var category = null;
                for (var i = 0; i < entryObject.categories.length; i++) {
                    if (entryObject.categories[i].title === categoryType) {
                        category = entryObject.categories[i];
                        break;
                    }
                }
                if (category === null) {
                    category = {"title": categoryType, "data": []};
                    entryObject.categories.push(category);
                }
                return category;
            }

            return null;
        };




        NewValidationResult.prototype.addItem = function (entry) {
            try {
                entry['id'] = guid();
                if (entry['classification'] === 'Error') {
                    this.addResult(this.errors, entry);
                } else if (entry['classification'] === 'Warning') {
                    this.addResult(this.warnings, entry);
                } else if (entry['classification'] === 'Alert') {
                    this.addResult(this.alerts, entry);
                } else if (entry['classification'] === 'Affirmative') {
                    this.addResult(this.affirmatives, entry);
                }else if (entry['classification'] === 'Informational' || entry['classification'] === 'Info') {
                    this.addResult(this.informationals, entry);
                }
            } catch (error) {
                console.log(error);
            }
        };


        NewValidationResult.prototype.loadDetection = function (detection) {
            if (detection) {
                var that = this;
                angular.forEach(detection, function (det) {
                    angular.forEach(det, function (item) {
                        that.addItem(item);
                    });
                });
            }
        };

        NewValidationResult.prototype.removeInstanceNumber= function (path) {
            return path.replace(/\[[^\]]*?\]/g, '');
        };


        NewValidationResult.prototype.removeCategoryDuplicates = function (classificationObj) {
            var ins = this;
            for (var i = 0; i < classificationObj.categories.length; i++) {
                var category = classificationObj.categories[i];
                var filtered = _.uniq(category.data, function(item){
                    var path = ins.removeInstanceNumber(item.path);
                    return item.classification + "/" + item.category + "/"  + path + "/" + item.description;
                });
                category.data = filtered;
            }
        };

        NewValidationResult.prototype.removeAllDuplicates = function () {
            this.removeCategoryDuplicates(this.errors);
            this.removeCategoryDuplicates(this.warnings);
            this.removeCategoryDuplicates(this.alerts);
            this.removeCategoryDuplicates(this.affirmatives);
            this.removeCategoryDuplicates(this.informationals);
            this.duplicatesRemoved = true;
        };

        NewValidationResult.prototype.init = function (result, noDuplicates) {
            ValidationResult.prototype.clear.call(this);
            this.duplicatesRemoved = false;
            if (result) {
                this.json = angular.fromJson(result);
                this.loadDetection(this.json.detections['Error']);
                this.loadDetection(this.json.detections['Alert']);
                this.loadDetection(this.json.detections['Warning']);
                this.loadDetection(this.json.detections['Informational']);
                this.loadDetection(this.json.detections['Affirmative']);
            }

        };
        return NewValidationResult;
    });


})(angular);