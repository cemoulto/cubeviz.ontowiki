var CubeViz_ConfigurationLink = (function () {
    function CubeViz_ConfigurationLink() { }
    CubeViz_ConfigurationLink.saveToServer = function saveToServer(url, data, ui, callback) {
        var oldAjaxSetup = $.ajaxSetup();
        var oldSupportOrs = $.support.cors;

        $.ajaxSetup({
            async: true,
            cache: false,
            type: "POST"
        });
        $.support.cors = true;
        $.ajax({
            "url": url + "savelinktofile/",
            "data": {
                "data": data,
                "ui": ui
            }
        }).error(function (xhr, ajaxOptions, thrownError) {
            $.ajaxSetup(oldAjaxSetup);
            $.support.cors = oldSupportOrs;
            throw new Error("saveToServerFile error: " + xhr["responseText"]);
        }).done(function (result) {
            $.ajaxSetup(oldAjaxSetup);
            $.support.cors = oldSupportOrs;
            callback(JSON.parse(result));
        });
    }
    return CubeViz_ConfigurationLink;
})();
var CubeViz_Collection = (function () {
    function CubeViz_Collection(idKey) {
        this.reset(idKey);
    }
    CubeViz_Collection.prototype.add = function (element, option) {
        if(undefined === this.get(element[this.idKey])) {
            this._.push(element);
        } else {
            if((undefined !== option && undefined !== option["merge"] && option["merge"] == true)) {
                this.remove(element[this.idKey]);
                this._.push(element);
            }
        }
        return this;
    };
    CubeViz_Collection.prototype.addList = function (list) {
        var self = this;
        if(true == _.isArray(list)) {
            $(list).each(function (i, element) {
                self.add(element);
            });
        } else {
            if(true == _.isObject(list)) {
                this.addList(_.values(list));
            }
        }
        return self;
    };
    CubeViz_Collection.prototype.exists = function (id) {
        return false === _.isUndefined(this.get(id));
    };
    CubeViz_Collection.prototype.get = function (id) {
        var self = this;
        var t = _.filter(this._, function (element) {
            if(element[self.idKey] == id) {
                return true;
            } else {
                return false;
            }
        });
        return 1 == t.length ? t[0] : undefined;
    };
    CubeViz_Collection.prototype.remove = function (id) {
        var self = this;
        this._ = _.reject(this._, function (element) {
            return element[self.idKey] === id;
        });
        return this;
    };
    CubeViz_Collection.prototype.reset = function (idKey) {
        this.idKey = undefined === idKey ? (undefined === this.idKey ? "id" : this.idKey) : idKey;
        this._ = [];
        return this;
    };
    CubeViz_Collection.prototype.size = function () {
        return _.size(this._);
    };
    return CubeViz_Collection;
})();
var CubeViz_Visualization = (function () {
    function CubeViz_Visualization() {
    }
    CubeViz_Visualization.prototype.getName = function () {
        return this.name;
    };
    CubeViz_Visualization.prototype.getSupportedClassNames = function () {
        return this.supportedClassNames;
    };
    CubeViz_Visualization.prototype.load = function (c) {
        if(true === this.isResponsibleFor(c)) {
            var chartInstance;
            eval("chartInstance = new " + c + "();");
            return chartInstance;
        }
        throw new Error("Invalid c (" + c + ") given!");
    };
    CubeViz_Visualization.prototype.isResponsibleFor = function (className) {
        return _.contains(this.getSupportedClassNames(), className);
    };
    return CubeViz_Visualization;
})();
var CubeViz_View_Abstract = (function () {
    function CubeViz_View_Abstract(id, attachedTo, app) {
        this.app = app;
        this.attachedTo = attachedTo;
        this.autostart = false;
        this.collection = new CubeViz_Collection();
        this.id = id || "view";
    }
    CubeViz_View_Abstract.prototype.bindGlobalEvents = function (events) {
        this.app.bindGlobalEvents(events, this);
        return this;
    };
    CubeViz_View_Abstract.prototype.bindUserInterfaceEvents = function (events) {
        if(true === _.isUndefined(events) || 0 == _.size(events)) {
            return;
        }
        var eventName = "";
        var selector = "";
        var self = this;

        _.each(events, function (method, key) {
            if(false === _.isFunction(method)) {
                method = self[method];
            }
            if(!method) {
                throw new Error("Method " + method + " does not exist");
            }
            eventName = key.substr(0, key.indexOf(" "));
            selector = key.substr(key.indexOf(" ") + 1);
            $(selector).on(eventName, $.proxy(method, self));
        });
    };
    CubeViz_View_Abstract.prototype.destroy = function () {
        var el = $(this.attachedTo);
        el.off();
        if(true === el.is("div")) {
            el.empty();
        } else {
            if(true === el.is("select")) {
                el.find("option").remove();
            }
        }
        this.collection.reset();
        return this;
    };
    CubeViz_View_Abstract.prototype.initialize = function () {
    };
    CubeViz_View_Abstract.prototype.triggerGlobalEvent = function (eventName, data) {
        this.app.triggerEvent(eventName, data);
        return this;
    };
    return CubeViz_View_Abstract;
})();
var CubeViz_View_Application = (function () {
    function CubeViz_View_Application() {
        this._viewInstances = new CubeViz_Collection();
        this._eventHandlers = new CubeViz_Collection();
        this._ = {
        };
    }
    CubeViz_View_Application.prototype.add = function (id, attachedTo, merge) {
        var options = true === merge ? {
            merge: true
        } : undefined;
        var viewObj = {
            alreadyRendered: false,
            attachedTo: attachedTo,
            id: id,
            instance: null
        };

        eval("viewObj.instance = new " + id + "(\"" + attachedTo + "\", this);");
        this._viewInstances.add(viewObj, options);
        return this;
    };
    CubeViz_View_Application.prototype.bindGlobalEvents = function (events, callee) {
        if(true === _.isUndefined(events) || 0 == _.size(events)) {
            return this;
        }
        var self = this;
        _.each(events, function (event) {
            $(self).on(event.name, $.proxy(event.handler, callee));
        });
        return this;
    };
    CubeViz_View_Application.prototype.destroyView = function (id) {
        this._viewInstances.get(id).instance.destroy();
        return this;
    };
    CubeViz_View_Application.prototype.get = function (id) {
        return this._viewInstances.get(id);
    };
    CubeViz_View_Application.prototype.getDataCopy = function () {
        var backup = [
            this._.data.retrievedObservations, 
            this._.generatedVisualization, 
            
        ];
        this._.data.retrievedObservations = undefined;
        this._.generatedVisualization = undefined;
        var result = $.parseJSON(JSON.stringify(this._));
        this._.data.retrievedObservations = backup[0];
        this._.generatedVisualization = backup[1];
        return result;
    };
    CubeViz_View_Application.prototype.remove = function (id) {
        this._viewInstances.remove(id);
        return this;
    };
    CubeViz_View_Application.prototype.renderAll = function () {
        var self = this;
        _.each(this._viewInstances._, function (view) {
            self.renderView(view.id, view.attachedTo);
        });
        return this;
    };
    CubeViz_View_Application.prototype.renderView = function (id, attachedTo) {
        this.add(id, attachedTo).destroyView(id).get(id).instance.initialize();
        return this;
    };
    CubeViz_View_Application.prototype.reset = function () {
        $(this).off();
        var self = this;
        _.each(this._viewInstances._, function (view) {
            self.destroyView(view.id).add(view.id, view.attachedTo, true);
        });
        return this;
    };
    CubeViz_View_Application.prototype.restoreDataCopy = function (copy) {
        var backup = [
            this._.data.retrievedObservations
        ];
        this._ = $.parseJSON(JSON.stringify(copy));
        this._.data.retrievedObservations = backup[0];
        return this;
    };
    CubeViz_View_Application.prototype.triggerEvent = function (eventName, data) {
        $(this).trigger(eventName, [
            data
        ]);
        return this;
    };
    CubeViz_View_Application.prototype.unbindEvent = function (eventName) {
        $(this).off(eventName);
        return this;
    };
    return CubeViz_View_Application;
})();
var CubeViz_Visualization_Controller = (function () {
    function CubeViz_Visualization_Controller() { }
    CubeViz_Visualization_Controller.prototype.isCircularObject = function (obj, parents, tree) {
        parents = parents || [];
        tree = tree || [];
        if(!obj || false === _.isObject(obj)) {
            return false;
        }
        var keys = _.keys(obj);
        parents.push(obj);
        _.each(keys, function (key) {
            if(obj[key] && true === _.isObject(obj)) {
                tree.push(key);
                if(parents.indexOf(obj) >= 0) {
                    return true;
                }
                if(arguments.callee(obj[key], parents, tree)) {
                    return tree.join(".");
                }
                tree.pop();
            }
        });
        parents.pop();
        return false;
    };
    CubeViz_Visualization_Controller.getColor = function getColor(variable) {
        var color = "#FFFFFF";
        if(true === _.isString(variable) || true === _.isNumber(variable)) {
            color = "" + CryptoJS.MD5(variable);
            color = "#" + color.substr((color["length"] - 6), 6);
        } else {
            if(false === this.isCircularObject && true === _.isObject(variable)) {
                color = JSON.stringify(variable);
                color = "#" + color.substr((color["length"] - 6), 6);
            } else {
            }
        }
        return color;
    }
    CubeViz_Visualization_Controller.getFromChartConfigByClass = function getFromChartConfigByClass(className, charts) {
        var result = undefined;
        _.each(charts, function (chart) {
            if(true === _.isUndefined(result)) {
                if(className == chart.class) {
                    result = chart;
                }
            }
        });
        return result;
    }
    CubeViz_Visualization_Controller.getLabelForPropertyUri = function getLabelForPropertyUri(dimensionTypeUrl, propertyUrl, selectedComponentDimensions) {
        var label = propertyUrl;
        _.each(selectedComponentDimensions, function (selectedComponentDimension, hashedUrl) {
            if(label !== propertyUrl) {
                return;
            }
            if(selectedComponentDimension.typeUrl == dimensionTypeUrl) {
                _.each(selectedComponentDimension.elements, function (element) {
                    if(element.property == propertyUrl) {
                        label = element.propertyLabel;
                    }
                });
            }
        });
        return label;
    }
    CubeViz_Visualization_Controller.getSelectedMeasure = function getSelectedMeasure(selectedComponentMeasures) {
        for(var hashedTypeUrl in selectedComponentMeasures) {
            return selectedComponentMeasures[hashedTypeUrl];
        }
    }
    CubeViz_Visualization_Controller.getMultipleDimensions = function getMultipleDimensions(selectedComponentDimensions) {
        var multipleDimensions = [];
        _.each(selectedComponentDimensions, function (selectedDimension) {
            if(2 <= _.size(selectedDimension.elements)) {
                multipleDimensions.push(selectedDimension);
            }
        });
        return multipleDimensions;
    }
    CubeViz_Visualization_Controller.getOneElementDimensions = function getOneElementDimensions(selectedComponentDimensions) {
        var oneElementDimensions = [];
        _.each(selectedComponentDimensions, function (selectedDimension) {
            if(1 == _.size(selectedDimension.elements)) {
                oneElementDimensions.push(selectedDimension);
            }
        });
        return oneElementDimensions;
    }
    CubeViz_Visualization_Controller.getVisualizationType = function getVisualizationType(className) {
        var cV = new CubeViz_Visualization_CubeViz();
        var hC = new CubeViz_Visualization_HighCharts();

        if(true === hC.isResponsibleFor(className)) {
            return hC.getName();
        } else {
            if(true === cV.isResponsibleFor(className)) {
                return cV.getName();
            }
        }
        throw new Error("Unknown className " + className);
    }
    CubeViz_Visualization_Controller.setChartConfigClassEntry = function setChartConfigClassEntry(className, charts, newValue) {
        for(var i in charts) {
            if(className == charts[i].class) {
                charts[i] = newValue;
            }
        }
    }
    return CubeViz_Visualization_Controller;
})();
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
var CubeViz_Visualization_CubeViz = (function (_super) {
    __extends(CubeViz_Visualization_CubeViz, _super);
    function CubeViz_Visualization_CubeViz() {
        _super.call(this);
        this.name = "CubeViz";
        this.supportedClassNames = [
            "CubeViz_Visualization_CubeViz_Table"
        ];
    }
    return CubeViz_Visualization_CubeViz;
})(CubeViz_Visualization);
var CubeViz_Visualization_CubeViz_Visualization = (function () {
    function CubeViz_Visualization_CubeViz_Visualization() { }
    CubeViz_Visualization_CubeViz_Visualization.prototype.init = function (data, chartConfig) {
        this.chartConfig = chartConfig;
        this.data = data;
        this.retrievedObservations = data.retrievedObservations;
    };
    CubeViz_Visualization_CubeViz_Visualization.prototype.render = function () {
    };
    return CubeViz_Visualization_CubeViz_Visualization;
})();
var CubeViz_Visualization_CubeViz_Table = (function (_super) {
    __extends(CubeViz_Visualization_CubeViz_Table, _super);
    function CubeViz_Visualization_CubeViz_Table() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_CubeViz_Table;
})(CubeViz_Visualization_CubeViz_Visualization);
var CubeViz_Visualization_HighCharts = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts, _super);
    function CubeViz_Visualization_HighCharts() {
        _super.call(this);
        this.name = "HighCharts";
        this.supportedClassNames = [
            "CubeViz_Visualization_HighCharts_Area", 
            "CubeViz_Visualization_HighCharts_AreaSpline", 
            "CubeViz_Visualization_HighCharts_Bar", 
            "CubeViz_Visualization_HighCharts_Column", 
            "CubeViz_Visualization_HighCharts_Line", 
            "CubeViz_Visualization_HighCharts_Pie", 
            "CubeViz_Visualization_HighCharts_Polar", 
            "CubeViz_Visualization_HighCharts_Spline"
        ];
    }
    return CubeViz_Visualization_HighCharts;
})(CubeViz_Visualization);
var CubeViz_Visualization_HighCharts_Chart = (function () {
    function CubeViz_Visualization_HighCharts_Chart() { }
    CubeViz_Visualization_HighCharts_Chart.prototype.buildChartTitle = function (dsdLabel, dsLabel, oneElementDimensions) {
        var builtTitle = "";
        _.each(oneElementDimensions, function (dimension) {
            builtTitle += " - " + dimension.elements[0].propertyLabel;
        });
        return dsdLabel + " - " + dsLabel + builtTitle;
    };
    CubeViz_Visualization_HighCharts_Chart.prototype.init = function (chartConfig, retrievedObservations, selectedComponentDimensions, oneElementDimensions, multipleDimensions, selectedComponentMeasures, selectedMeasureUri, dsdLabel, dsLabel) {
        var forXAxis = null;
        var forSeries = null;
        var observation = new DataCube_Observation();
        var self = this;

        this.chartConfig = chartConfig;
        this.chartConfig.series = [];
        if(true === _.isUndefined(self.chartConfig.xAxis)) {
            this.chartConfig.xAxis = {
                categories: []
            };
        } else {
            this.chartConfig.xAxis.categories = [];
        }
        this.chartConfig.title.text = this.buildChartTitle(dsdLabel, dsLabel, oneElementDimensions);
        _.each(selectedComponentDimensions, function (selectedDimension) {
            if(null == forXAxis) {
                forXAxis = selectedDimension.typeUrl;
            } else {
                forSeries = selectedDimension.typeUrl;
            }
        });
        observation.initialize(retrievedObservations, selectedComponentDimensions, selectedMeasureUri);
        var xAxisElements = observation.sortAxis(forXAxis, "ascending").getAxesElements(forXAxis);
        _.each(xAxisElements, function (element, propertyUrl) {
            self.chartConfig.xAxis.categories.push(CubeViz_Visualization_Controller.getLabelForPropertyUri(forXAxis, propertyUrl, selectedComponentDimensions));
        });
        var floatValue = 0;
        var found = false;
        var i = 0;
        var length = _.keys(xAxisElements).length;
        var obj = {
        };
        var seriesElements = observation.getAxesElements(forSeries);

        self.chartConfig.series = [];
        _.each(seriesElements, function (seriesElement, seriesKey) {
            obj = {
                color: CubeViz_Visualization_Controller.getColor(seriesKey),
                data: [],
                name: CubeViz_Visualization_Controller.getLabelForPropertyUri(forSeries, seriesKey, selectedComponentDimensions)
            };
            _.each(xAxisElements, function (xAxisValue, xAxisKey) {
                found = false;
                _.each(xAxisValue, function (value, key) {
                    if(true == found) {
                        return;
                    }
                    _.each(value[selectedMeasureUri].ref, function (refValue, refKey) {
                        if(seriesKey == refValue[forSeries].value) {
                            floatValue = parseFloat(value[selectedMeasureUri].value);
                            if(isNaN(floatValue)) {
                                floatValue = null;
                            }
                            obj.data.push(floatValue);
                            found = true;
                            return;
                        }
                    });
                });
                if(false == found) {
                    obj.data.push(null);
                }
            });
            self.chartConfig.series.push(obj);
        });
    };
    CubeViz_Visualization_HighCharts_Chart.prototype.getRenderResult = function () {
        return this.chartConfig;
    };
    return CubeViz_Visualization_HighCharts_Chart;
})();
var CubeViz_Visualization_HighCharts_Area = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Area, _super);
    function CubeViz_Visualization_HighCharts_Area() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_Area;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_AreaSpline = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_AreaSpline, _super);
    function CubeViz_Visualization_HighCharts_AreaSpline() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_AreaSpline;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_Bar = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Bar, _super);
    function CubeViz_Visualization_HighCharts_Bar() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_Bar;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_Column = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Column, _super);
    function CubeViz_Visualization_HighCharts_Column() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_Column;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_Line = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Line, _super);
    function CubeViz_Visualization_HighCharts_Line() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_Line;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_Pie = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Pie, _super);
    function CubeViz_Visualization_HighCharts_Pie() {
        _super.apply(this, arguments);

    }
    CubeViz_Visualization_HighCharts_Pie.prototype.init = function (chartConfig, retrievedObservations, selectedComponentDimensions, oneElementDimensions, multipleDimensions, selectedComponentMeasures, selectedMeasureUri, dsdLabel, dsLabel) {
        if(1 < _.size(multipleDimensions)) {
            throw new Error("Pie chart is only suitable for one dimension!");
            return;
        }
        var forXAxis = multipleDimensions[0].typeUrl;
        var label = "";
        var observation = new DataCube_Observation();
        var self = this;

        this.chartConfig = chartConfig;
        this.chartConfig.series = [];
        this.chartConfig.colors = [];
        this.chartConfig.title.text = this.buildChartTitle(dsdLabel, dsLabel, oneElementDimensions);
        observation.initialize(retrievedObservations, selectedComponentDimensions, selectedMeasureUri);
        var xAxisElements = observation.sortAxis(forXAxis, "ascending").getAxesElements(forXAxis);
        this.chartConfig.series.push({
            type: "pie",
            name: this.chartConfig.title.text,
            data: []
        });
        _.each(xAxisElements, function (xAxisElement, propertyUrl) {
            var floatValue = parseFloat(xAxisElement[0][selectedMeasureUri].value);
            if(isNaN(floatValue)) {
                floatValue = null;
            }
            label = CubeViz_Visualization_Controller.getLabelForPropertyUri(forXAxis, propertyUrl, selectedComponentDimensions);
            self.chartConfig.series[0].data.push([
                label, 
                floatValue
            ]);
            self.chartConfig.colors.push(CubeViz_Visualization_Controller.getColor(propertyUrl));
        });
    };
    return CubeViz_Visualization_HighCharts_Pie;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_Polar = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Polar, _super);
    function CubeViz_Visualization_HighCharts_Polar() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_Polar;
})(CubeViz_Visualization_HighCharts_Chart);
var CubeViz_Visualization_HighCharts_Spline = (function (_super) {
    __extends(CubeViz_Visualization_HighCharts_Spline, _super);
    function CubeViz_Visualization_HighCharts_Spline() {
        _super.apply(this, arguments);

    }
    return CubeViz_Visualization_HighCharts_Spline;
})(CubeViz_Visualization_HighCharts_Chart);
var DataCube_Component = (function () {
    function DataCube_Component() { }
    DataCube_Component.loadAllDimensions = function loadAllDimensions(url, modelUrl, dsdUrl, dsUrl, callback) {
        $.ajax({
            url: url + "getcomponents",
            data: {
                m: modelUrl,
                dsdUrl: dsdUrl,
                dsUrl: dsUrl,
                cT: "dimension"
            }
        }).error(function (xhr, ajaxOptions, thrownError) {
            console.log("Component > loadAll > error");
            console.log("response text: " + xhr.responseText);
            console.log("error: " + thrownError);
        }).done(function (entries) {
            DataCube_Component.prepareLoadedAllDimensions(entries, callback);
        });
    }
    DataCube_Component.prepareLoadedAllDimensions = function prepareLoadedAllDimensions(entries, callback) {
        entries = JSON.parse(entries);
        entries.sort(function (a, b) {
            return a.label.toUpperCase().localeCompare(b.label.toUpperCase());
        });
        var tmpEntries = {
        };
        _.each(entries, function (component) {
            tmpEntries[component.hashedUrl] = component;
        });
        callback(tmpEntries);
    }
    DataCube_Component.loadAllMeasures = function loadAllMeasures(url, modelUrl, dsdUrl, dsUrl, callback) {
        $.ajax({
            url: url + "getcomponents",
            data: {
                m: modelUrl,
                dsdUrl: dsdUrl,
                dsUrl: dsUrl,
                cT: "measure"
            }
        }).error(function (xhr, ajaxOptions, thrownError) {
            console.log("Component > loadAll > error");
            console.log("response text: " + xhr.responseText);
            console.log("error: " + thrownError);
        }).done(function (entries) {
            DataCube_Component.prepareLoadedAllMeasures(entries, callback);
        });
    }
    DataCube_Component.prepareLoadedAllMeasures = function prepareLoadedAllMeasures(entries, callback) {
        entries = JSON.parse(entries);
        entries.sort(function (a, b) {
            return a.label.toUpperCase().localeCompare(b.label.toUpperCase());
        });
        var tmpEntries = {
        };
        _.each(entries, function (measure) {
            tmpEntries[measure.hashedUrl] = measure;
        });
        callback(tmpEntries);
    }
    DataCube_Component.getDefaultSelectedDimensions = function getDefaultSelectedDimensions(componentDimensions) {
        componentDimensions = $.parseJSON(JSON.stringify(componentDimensions));
        var result = {
        };
        _.each(componentDimensions, function (componentDimension, dimensionHashedUrl) {
            result[dimensionHashedUrl] = componentDimension;
            result[dimensionHashedUrl].elements = [
                componentDimension.elements[0]
            ];
        });
        return result;
    }
    return DataCube_Component;
})();
var DataCube_DataSet = (function () {
    function DataCube_DataSet() { }
    DataCube_DataSet.loadAll = function loadAll(url, modelUrl, dsdUrl, callback) {
        $.ajax({
            url: url + "getdatasets/",
            data: {
                m: modelUrl,
                dsdUrl: dsdUrl
            }
        }).error(function (xhr, ajaxOptions, thrownError) {
            throw new Error("loadAll error: " + xhr["responseText"]);
        }).done(function (entries) {
            DataCube_DataSet.prepareLoadedDataSets(entries, callback);
        });
    }
    DataCube_DataSet.prepareLoadedDataSets = function prepareLoadedDataSets(entries, callback) {
        entries.sort(function (a, b) {
            return a.label.toUpperCase().localeCompare(b.label.toUpperCase());
        });
        callback(entries);
    }
    return DataCube_DataSet;
})();
var DataCube_DataStructureDefinition = (function () {
    function DataCube_DataStructureDefinition() { }
    DataCube_DataStructureDefinition.loadAll = function loadAll(url, modelUrl, callback) {
        $.ajax({
            url: url + "getdatastructuredefinitions/",
            data: {
                m: modelUrl
            }
        }).error(function (xhr, ajaxOptions, thrownError) {
            throw new Error("loadAll error: " + xhr["responseText"]);
        }).done(function (entries) {
            DataCube_DataStructureDefinition.prepareLoadedDataStructureDefinitions(entries, callback);
        });
    }
    DataCube_DataStructureDefinition.prepareLoadedDataStructureDefinitions = function prepareLoadedDataStructureDefinitions(entries, callback) {
        entries = JSON.parse(entries);
        entries.sort(function (a, b) {
            return a["label"].toUpperCase().localeCompare(b["label"].toUpperCase());
        });
        callback(entries);
    }
    return DataCube_DataStructureDefinition;
})();
var DataCube_Observation = (function () {
    function DataCube_Observation() {
        this._axes = {
        };
        this._selectedDimensionUris = [];
    }
    DataCube_Observation.prototype.addAxisEntryPointsTo = function (uri, value, dimensionValues) {
        var self = this;
        _.each(dimensionValues, function (dimensionValue, dimensionUri) {
            dimensionValues[dimensionUri] = {
                "value": dimensionValue,
                "ref": self._axes[dimensionUri][dimensionValue]
            };
        });
        this._axes[uri][value].push(dimensionValues);
    };
    DataCube_Observation.prototype.extractSelectedDimensionUris = function (elements) {
        var resultList = [];
        _.each(elements, function (element) {
            resultList.push(element.typeUrl);
        });
        return resultList;
    };
    DataCube_Observation.prototype.getAxesElements = function (uri) {
        if(false === _.isUndefined(this._axes[uri])) {
            return this._axes[uri];
        } else {
            console.log("\nNo elements found given axisUri: " + uri);
            return {
            };
        }
    };
    DataCube_Observation.prototype.initialize = function (retrievedObservations, selectedComponentDimensions, measureUri) {
        if(0 == _.size(retrievedObservations)) {
            console.log("\nEntries is empty!");
            return;
        }
        this._selectedDimensionUris = this.extractSelectedDimensionUris(selectedComponentDimensions);
        var dimensionValues = {
        };
        var measureObj = {
        };
        var selecDimUri = "";
        var selecDimVal = "";
        var self = this;

        this._axes[measureUri] = this._axes[measureUri] || {
        };
        _.each(retrievedObservations, function (observation) {
            dimensionValues = {
            };
            measureObj = {
            };
            self._axes[measureUri][observation[measureUri][0].value] = self._axes[measureUri][observation[measureUri][0].value] || [];
            _.each(self._selectedDimensionUris, function (selecDimUri) {
                if(undefined == selecDimUri) {
                    return;
                }
                selecDimVal = observation[selecDimUri][0].value;
                dimensionValues[selecDimUri] = selecDimVal;
                if(undefined == self._axes[selecDimUri]) {
                    self._axes[selecDimUri] = {
                    };
                }
                if(undefined == self._axes[selecDimUri][selecDimVal]) {
                    self._axes[selecDimUri][selecDimVal] = [];
                }
                measureObj[measureUri] = observation[measureUri][0].value;
                self.addAxisEntryPointsTo(selecDimUri, selecDimVal, measureObj);
            });
            self.addAxisEntryPointsTo(measureUri, observation[measureUri][0].value, dimensionValues);
        });
        return this;
    };
    DataCube_Observation.loadAll = function loadAll(linkCode, url, callback) {
        $.ajax({
            url: url + "getobservations/",
            data: {
                lC: linkCode
            }
        }).error(function (xhr, ajaxOptions, thrownError) {
            throw new Error("Observation loadAll error: " + xhr.responseText);
        }).done(function (entries) {
            DataCube_Observation.prepareLoadedResultObservations(entries, callback);
        });
    }
    DataCube_Observation.prepareLoadedResultObservations = function prepareLoadedResultObservations(entries, callback) {
        var parse = $.parseJSON(entries);
        if(null == parse) {
            callback(entries);
        } else {
            callback(parse);
        }
    }
    DataCube_Observation.prototype.sortAxis = function (axisUri, mode) {
        var axesEntries = this._axes[axisUri];
        var mode = true === _.isUndefined(mode) ? "ascending" : mode;
        var sortedKeys = [];
        var sortedObj = {
        };
        var self = this;

        _.each(axesEntries, function (e, key) {
            sortedKeys.push(key);
        });
        switch(mode) {
            case "descending": {
                sortedKeys.sort(function (a, b) {
                    a = a.toString().toLowerCase();
                    b = b.toString().toLowerCase();
                    return ((a > b) ? -1 : ((a < b) ? 1 : 0));
                });
                break;

            }
            default: {
                sortedKeys.sort(function (a, b) {
                    a = a.toString().toLowerCase();
                    b = b.toString().toLowerCase();
                    return ((a < b) ? -1 : ((a > b) ? 1 : 0));
                });
                break;

            }
        }
        _.each(sortedKeys, function (key) {
            sortedObj[key] = self._axes[axisUri][key];
        });
        this._axes[axisUri] = sortedObj;
        return this;
    };
    return DataCube_Observation;
})();
var View_CubeVizModule_DataStructureDefintion = (function (_super) {
    __extends(View_CubeVizModule_DataStructureDefintion, _super);
    function View_CubeVizModule_DataStructureDefintion(attachedTo, app) {
        _super.call(this, "View_CubeVizModule_DataStructureDefintion", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_CubeVizModule_DataStructureDefintion.prototype.initialize = function () {
        this.collection.reset("hashedUrl").addList(this.app._.data.dataStructureDefinitions);
        this.render();
    };
    View_CubeVizModule_DataStructureDefintion.prototype.onChange_list = function (event) {
        var selectedElementId = $("#cubeviz-dataStructureDefinition-list").val();
        var selectedElement = this.collection.get(selectedElementId);

        this.app._.data.selectedDSD = selectedElement;
        this.triggerGlobalEvent("onChange_selectedDSD");
    };
    View_CubeVizModule_DataStructureDefintion.prototype.onClick_questionmark = function () {
        $("#cubeviz-dataStructureDefinition-dialog").dialog("open");
    };
    View_CubeVizModule_DataStructureDefintion.prototype.onStart_application = function (event, data) {
        this.initialize();
    };
    View_CubeVizModule_DataStructureDefintion.prototype.render = function () {
        var list = $("#cubeviz-dataStructureDefinition-list");
        var optionTpl = _.template($("#cubeviz-dataStructureDefinition-tpl-listOption").text());
        var self = this;

        $(this.collection._).each(function (i, element) {
            element["selected"] = element["url"] == self.app._.data.selectedDSD.url ? " selected" : "";
            list.append(optionTpl(element));
        });
        $("#cubeviz-dataStructureDefinition-dialog").dialog({
            autoOpen: false,
            draggable: false,
            hide: "slow",
            modal: true,
            overlay: {
                "background-color": "#FFFFFF",
                opacity: 0.5
            },
            show: "slow"
        });
        this.bindUserInterfaceEvents({
            "change #cubeviz-dataStructureDefinition-list": this.onChange_list,
            "click #cubeviz-dataStructureDefinition-questionMark": this.onClick_questionmark
        });
        return this;
    };
    return View_CubeVizModule_DataStructureDefintion;
})(CubeViz_View_Abstract);
var View_CubeVizModule_DataSet = (function (_super) {
    __extends(View_CubeVizModule_DataSet, _super);
    function View_CubeVizModule_DataSet(attachedTo, app) {
        _super.call(this, "View_CubeVizModule_DataSet", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onChange_selectedDSD",
                handler: this.onChange_selectedDSD
            }, 
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_CubeVizModule_DataSet.prototype.initialize = function () {
        this.collection.reset("hashedUrl");
        this.collection.addList(this.app._.data.dataSets);
        this.render();
    };
    View_CubeVizModule_DataSet.prototype.onChange_list = function () {
        var selectedElementId = $("#cubeviz-dataSet-list").val();
        var selectedElement = this["collection"].get(selectedElementId);

        this.app._.data.selectedDS = selectedElement;
        this.triggerGlobalEvent("onChange_selectedDS");
    };
    View_CubeVizModule_DataSet.prototype.onChange_selectedDSD = function (event, data) {
        this.destroy();
        var self = this;
        DataCube_DataSet.loadAll(this.app._.backend.url, this.app._.backend.modelUrl, this.app._.data.selectedDSD.url, function (entries) {
            self.app._.data.selectedDS = entries[0];
            self.collection.reset("hashedUrl");
            self.collection.addList(entries);
            self.triggerGlobalEvent("onChange_selectedDS");
            self.render();
        });
    };
    View_CubeVizModule_DataSet.prototype.onClick_questionmark = function () {
        $("#cubeviz-dataSet-dialog").dialog("open");
    };
    View_CubeVizModule_DataSet.prototype.onComplete_loadDSD = function (event, data) {
        this.onChange_selectedDSD(event, data);
    };
    View_CubeVizModule_DataSet.prototype.onStart_application = function () {
        this.initialize();
    };
    View_CubeVizModule_DataSet.prototype.render = function () {
        var list = $(this.attachedTo);
        var optionTpl = _.template($("#cubeviz-dataSet-tpl-listOption").text());
        var self = this;

        $(this.collection._).each(function (i, element) {
            element["selected"] = element["url"] == self.app._.data.selectedDSD.url ? " selected" : "";
            list.append(optionTpl(element));
        });
        $("#cubeviz-dataSet-dialog").dialog({
            autoOpen: false,
            draggable: false,
            hide: "slow",
            modal: true,
            overlay: {
                "background-color": "#FFFFFF",
                opacity: 0.5
            },
            show: "slow"
        });
        this.bindUserInterfaceEvents({
            "change #cubeviz-dataSet-list": this.onChange_list,
            "click #cubeviz-dataSet-questionMark": this.onClick_questionmark
        });
        return this;
    };
    return View_CubeVizModule_DataSet;
})(CubeViz_View_Abstract);
var View_CubeVizModule_Component = (function (_super) {
    __extends(View_CubeVizModule_Component, _super);
    function View_CubeVizModule_Component(attachedTo, app) {
        _super.call(this, "View_CubeVizModule_Component", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onChange_selectedDS",
                handler: this.onChange_selectedDS
            }, 
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_CubeVizModule_Component.prototype.configureSetupComponentDialog = function (component, componentBox, opener) {
        var dialogTpl = _.template($("#cubeviz-component-tpl-setupComponentDialog").text());
        var self = this;

        $("#cubeviz-component-setupDialogContainer").append(dialogTpl({
            label: component.label,
            hashedUrl: component.hashedUrl
        }));
        var div = $("#cubeviz-component-setupComponentDialog-" + component.hashedUrl);
        div.data("componentBox", componentBox).data("hashedUrl", component.hashedUrl).dialog({
            autoOpen: false,
            closeOnEscape: false,
            draggable: false,
            height: 485,
            hide: "slow",
            modal: true,
            open: function (event, ui) {
                $(".ui-dialog-titlebar-close", $(this).parent()).hide();
            },
            overlay: {
                "background-color": "#FFFFFF",
                opacity: 0.5
            },
            show: "slow",
            width: 700
        });
        $(div.find(".cubeviz-component-setupComponentDeselectButton").get(0)).data("dialogDiv", div);
        opener.data("dialogDiv", div);
        $($(div.children().last()).children().get(0)).data("dialogDiv", div);
        $($(div.children().last()).children().get(1)).data("dialogDiv", div);
        this.configureSetupComponentElements(component);
    };
    View_CubeVizModule_Component.prototype.configureSetupComponentElements = function (component) {
        var dialogDiv = $("#cubeviz-component-setupComponentDialog-" + component.hashedUrl);
        var componentElements = _.toArray(component.elements);
        var elementList = $(dialogDiv.find(".cubeviz-component-setupComponentElements")[0]);
        var elementTpl = _.template($("#cubeviz-component-tpl-setupComponentElement").text());
        var selectedDimensions = this.app._.data.selectedComponents.dimensions[component.hashedUrl].elements;
        var setElementChecked = null;

        componentElements.sort(function (a, b) {
            return a.propertyLabel.toUpperCase().localeCompare(b.propertyLabel.toUpperCase());
        });
        _.each(componentElements, function (element) {
            setElementChecked = undefined !== _.find(selectedDimensions, function (dim) {
                return dim.property == element.property;
            });
            if(true === setElementChecked) {
                element.checked = " checked=\"checked\"";
            } else {
                element.checked = "";
            }
            elementList.append(elementTpl(element));
        });
    };
    View_CubeVizModule_Component.prototype.destroy = function () {
        $(this.collection._).each(function (i, c) {
            $("#cubeviz-component-setupComponentDialog-" + c["hashedUrl"]).dialog("destroy");
            $("#cubeviz-component-setupComponentDialog-" + c["hashedUrl"]).remove();
        });
        $("#cubeviz-component-setupDialogContainer").empty();
        _super.prototype.destroy.call(this);
        $("#cubeviz-component-questionMarkDialog").dialog("destroy");
        return this;
    };
    View_CubeVizModule_Component.prototype.initialize = function () {
        this.collection.reset("hashedUrl");
        this.collection.addList(this.app._.data.components.dimensions);
        this.render();
    };
    View_CubeVizModule_Component.prototype.loadComponentDimensions = function (callback) {
        var self = this;
        DataCube_Component.loadAllDimensions(this.app._.backend.url, this.app._.backend.modelUrl, this.app._.data.selectedDSD.url, this.app._.data.selectedDS.url, function (entries) {
            self.app._.data.components.dimensions = entries;
            self.app._.data.selectedComponents.dimensions = DataCube_Component.getDefaultSelectedDimensions(entries);
            self.collection.reset("hashedUrl").addList(entries);
            callback();
        });
    };
    View_CubeVizModule_Component.prototype.loadComponentMeasures = function (callback) {
        var self = this;
        DataCube_Component.loadAllMeasures(this.app._.backend.url, this.app._.backend.modelUrl, this.app._.data.selectedDSD.url, this.app._.data.selectedDS.url, function (entries) {
            self.app._.data.components.measures = entries;
            self.app._.data.selectedComponents.measures = entries;
            callback();
        });
    };
    View_CubeVizModule_Component.prototype.onChange_selectedDS = function (event, data) {
        var self = this;
        this.destroy();
        this.loadComponentDimensions(function () {
            self.loadComponentMeasures($.proxy(self, "render"));
        });
    };
    View_CubeVizModule_Component.prototype.onClick_closeAndApply = function (event) {
        var dialogDiv = $(event.target).data("dialogDiv");
        var self = this;

        this.readAndSaveSetupComponentDialogChanges(dialogDiv, function () {
            $(event.target).data("dialogDiv").dialog("close");
        });
    };
    View_CubeVizModule_Component.prototype.onClick_closeAndUpdate = function (event) {
        var dialogDiv = $(event.target).data("dialogDiv");
        var self = this;

        this.readAndSaveSetupComponentDialogChanges(dialogDiv, function () {
            if(true === cubeVizApp._.backend.uiParts.index.isLoaded) {
                self.triggerGlobalEvent("onReRender_visualization");
                $(event.target).data("dialogDiv").dialog("close");
            } else {
                $(event.target).data("dialogDiv").dialog("close");
                window.location.href = self.app._.backend.url + "?m=" + encodeURIComponent(self.app._.backend.modelUrl) + "&lC=" + self.app._.data.linkCode;
            }
        });
    };
    View_CubeVizModule_Component.prototype.onClick_deselectedAllComponentElements = function (event) {
        $(event.target).data("dialogDiv").find("[type=\"checkbox\"]").attr("checked", false);
    };
    View_CubeVizModule_Component.prototype.onClick_setupComponentOpener = function (event) {
        $(event.target).data("dialogDiv").dialog("open");
        $(".ui-widget-overlay").css("height", screen.height + (screen.height * 0.5));
    };
    View_CubeVizModule_Component.prototype.onClick_questionmark = function () {
        $("#cubeviz-component-questionMarkDialog").dialog("open");
    };
    View_CubeVizModule_Component.prototype.readAndSaveSetupComponentDialogChanges = function (dialogDiv, callback) {
        var elementList = dialogDiv.find(".cubeviz-component-setupComponentElements").children();
        var componentBox = dialogDiv.data("componentBox");
        var hashedUrl = dialogDiv.data("hashedUrl");
        var input = null;
        var inputLabel = null;
        var selectedElements = [];
        var self = this;

        if(undefined === hashedUrl) {
            return;
        }
        $(elementList).each(function (i, element) {
            input = $($(element).children().get(0));
            inputLabel = $($(element).children().get(1));
            if("checked" === input.attr("checked")) {
                selectedElements.push({
                    hashedProperty: input.attr("name"),
                    property: input.val(),
                    propertyLabel: inputLabel.html()
                });
            }
        });
        if(0 == _.size(selectedElements)) {
            selectedElements = [];
            selectedElements.push(JSON.parse(JSON.stringify(this.app._.data.components.dimensions[hashedUrl].elements[0])));
            $($(dialogDiv.find(".cubeviz-component-setupComponentElements").children().get(0)).children().get(0)).attr("checked", true);
        }
        this.app._.data.selectedComponents.dimensions[hashedUrl].elements = selectedElements;
        $(componentBox.find(".cubeviz-component-selectedCount").get(0)).html(selectedElements.length);
        this.app._.data.numberOfMultipleDimensions = _.size(CubeViz_Visualization_Controller.getMultipleDimensions(this.app._.data.selectedComponents.dimensions));
        this.app._.data.numberOfOneElementDimensions = _.size(CubeViz_Visualization_Controller.getOneElementDimensions(this.app._.data.selectedComponents.dimensions));
        CubeViz_ConfigurationLink.saveToServer(this.app._.backend.url, this.app._.data, this.app._.ui, function (updatedLinkCode) {
            self.app._.data.linkCode = updatedLinkCode;
            DataCube_Observation.loadAll(updatedLinkCode, self.app._.backend.url, function (newEntities) {
                self.app._.data.retrievedObservations = newEntities;
                callback();
            });
        });
    };
    View_CubeVizModule_Component.prototype.onComplete_loadDS = function (event, data) {
        this.onChange_selectedDS(event, data);
    };
    View_CubeVizModule_Component.prototype.onComplete_loadObservations = function (event, updatedRetrievedObservations) {
        console.log("updatedRetrievedObservations");
        console.log(updatedRetrievedObservations);
        this.app._.data.retrievedObservations = updatedRetrievedObservations;
    };
    View_CubeVizModule_Component.prototype.onStart_application = function () {
        this.initialize();
    };
    View_CubeVizModule_Component.prototype.render = function () {
        var backendCollection = this.collection._;
        var list = $("#cubviz-component-listBox");
        var componentBox = null;
        var optionTpl = _.template($("#cubeviz-component-tpl-listBoxItem").text());
        var selectedComponentDimensions = this.app._.data.selectedComponents.dimensions;
        var selectedDimension = null;
        var self = this;
        var tmp = null;

        this.collection.reset();
        _.each(backendCollection, function (dimension) {
            if(undefined !== selectedComponentDimensions) {
                selectedDimension = selectedComponentDimensions[dimension.hashedUrl];
                dimension.selectedElementCount = _.keys(selectedDimension.elements).length;
            } else {
                dimension.selectedElementCount = 1;
            }
            dimension.elementCount = _.size(dimension.elements);
            componentBox = $(optionTpl(dimension));
            $(componentBox.find(".cubeviz-component-setupComponentOpener").get(0)).data("hashedUrl", dimension.hashedUrl);
            list.append(componentBox);
            self.configureSetupComponentDialog(dimension, componentBox, $(componentBox.find(".cubeviz-component-setupComponentOpener").get(0)));
            $(componentBox.find(".cubeviz-component-selectedCount").get(0)).html(dimension.selectedElementCount);
            self.collection.add(dimension);
        });
        $("#cubeviz-component-questionMarkDialog").dialog({
            autoOpen: false,
            draggable: false,
            hide: "slow",
            modal: true,
            overlay: {
                "background-color": "#FFFFFF",
                opacity: 0.5
            },
            show: "slow"
        });
        this.bindUserInterfaceEvents({
            "click .cubeviz-component-closeAndApply": this.onClick_closeAndApply,
            "click .cubeviz-component-closeAndUpdate": this.onClick_closeAndUpdate,
            "click .cubeviz-component-setupComponentDeselectButton": this.onClick_deselectedAllComponentElements,
            "click .cubeviz-component-setupComponentOpener": this.onClick_setupComponentOpener,
            "click #cubeviz-component-questionMark": this.onClick_questionmark
        });
        return this;
    };
    return View_CubeVizModule_Component;
})(CubeViz_View_Abstract);
var View_CubeVizModule_Footer = (function (_super) {
    __extends(View_CubeVizModule_Footer, _super);
    function View_CubeVizModule_Footer(attachedTo, app) {
        _super.call(this, "View_CubeVizModule_Footer", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onChange_selectedDSD",
                handler: this.onChange_selectedDSD
            }, 
            {
                name: "onChange_selectedDS",
                handler: this.onChange_selectedDS
            }, 
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_CubeVizModule_Footer.prototype.changePermaLinkButton = function () {
        var value = "";
        if(true == _.isUndefined(this.collection.get("buttonVal"))) {
            this.collection.add({
                id: "buttonVal",
                value: $("#cubeviz-footer-permaLinkButton").attr("value").toString()
            });
            this.showLink(">>");
        } else {
            value = this.collection.get("buttonVal").value;
            this.collection.remove("buttonVal");
            this.closeLink(value);
        }
    };
    View_CubeVizModule_Footer.prototype.closeLink = function (label) {
        $("#cubeviz-footer-permaLinkMenu").fadeOut(450, function () {
            $("#cubeviz-footer-permaLinkButton").animate({
                width: 75
            }, 450).attr("value", label);
        });
    };
    View_CubeVizModule_Footer.prototype.initialize = function () {
        this.render();
    };
    View_CubeVizModule_Footer.prototype.onChange_selectedDS = function () {
        this.onChange_selectedDSD();
    };
    View_CubeVizModule_Footer.prototype.onChange_selectedDSD = function () {
        if(false === _.isUndefined(this.collection.get("buttonVal"))) {
            this.changePermaLinkButton();
        }
    };
    View_CubeVizModule_Footer.prototype.onClick_permaLinkButton = function (event) {
        var self = this;
        this.app._.data.linkCode = null;
        CubeViz_ConfigurationLink.saveToServer(this.app._.backend.url, this.app._.data, this.app._.ui, function (newLinkCode) {
            self.app._.data.linkCode = newLinkCode;
            self.changePermaLinkButton();
        });
    };
    View_CubeVizModule_Footer.prototype.onClick_showVisualization = function (event) {
        var self = this;
        if(true === cubeVizApp._.backend.uiParts.index.isLoaded) {
            this.triggerGlobalEvent("onReRender_visualization");
        } else {
            CubeViz_ConfigurationLink.saveToServer(this.app._.backend.url, this.app._.data, this.app._.ui, function (updatedLinkCode) {
                window.location.href = self.app._.backend.url + "?m=" + encodeURIComponent(self.app._.backend.modelUrl) + "&lC=" + updatedLinkCode;
            });
        }
    };
    View_CubeVizModule_Footer.prototype.onStart_application = function () {
        this.initialize();
    };
    View_CubeVizModule_Footer.prototype.render = function () {
        this.bindUserInterfaceEvents({
            "click #cubeviz-footer-permaLinkButton": this.onClick_permaLinkButton,
            "click #cubeviz-footer-showVisualizationButton": this.onClick_showVisualization
        });
        return this;
    };
    View_CubeVizModule_Footer.prototype.showLink = function (label) {
        var self = this;
        $("#cubeviz-footer-permaLinkButton").attr("value", label).animate({
            width: 31
        }, 450, "linear", function () {
            var position = $("#cubeviz-footer-permaLinkButton").position();
            $("#cubeviz-footer-permaLinkMenu").css("top", position.top + 2).css("left", position.left + 32);
            var link = self.app._.backend.url + "?m=" + encodeURIComponent(self.app._.backend.modelUrl) + "&lC=" + self.app._.data.linkCode;
            var url = $("<a></a>").attr("href", link).attr("target", "_self").html($("#cubeviz-footer-permaLink").html());
            $("#cubeviz-footer-permaLinkMenu").animate({
                width: "toggle"
            }, 450);
            $("#cubeviz-footer-permaLink").show().html(url);
        });
    };
    return View_CubeVizModule_Footer;
})(CubeViz_View_Abstract);
var View_IndexAction_Header = (function (_super) {
    __extends(View_IndexAction_Header, _super);
    function View_IndexAction_Header(attachedTo, app) {
        _super.call(this, "View_IndexAction_Header", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_IndexAction_Header.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        $("#cubeviz-index-headerDialogBox").dialog("destroy");
        return this;
    };
    View_IndexAction_Header.prototype.initialize = function () {
        var self = this;
        this.render();
    };
    View_IndexAction_Header.prototype.onClick_questionMark = function () {
        $("#cubeviz-index-headerDialogBox").dialog("open");
    };
    View_IndexAction_Header.prototype.onStart_application = function () {
        this.initialize();
    };
    View_IndexAction_Header.prototype.render = function () {
        $("#cubeviz-index-headerDialogBox").dialog({
            autoOpen: false,
            draggable: false,
            height: "auto",
            hide: "slow",
            modal: true,
            overlay: {
                "background-color": "#FFFFFF",
                opacity: 0.5
            },
            show: "slow",
            width: 400
        });
        this.bindUserInterfaceEvents({
            "click #cubeviz-index-headerQuestionMarkHeadline": this.onClick_questionMark
        });
        return this;
    };
    return View_IndexAction_Header;
})(CubeViz_View_Abstract);
var View_IndexAction_Visualization = (function (_super) {
    __extends(View_IndexAction_Visualization, _super);
    function View_IndexAction_Visualization(attachedTo, app) {
        _super.call(this, "View_IndexAction_Visualization", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onChange_visualizationClass",
                handler: this.onChange_visualizationClass
            }, 
            {
                name: "onReRender_visualization",
                handler: this.onReRender_visualization
            }, 
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_IndexAction_Visualization.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        return this;
    };
    View_IndexAction_Visualization.prototype.initialize = function () {
        this.render();
    };
    View_IndexAction_Visualization.prototype.onChange_visualizationClass = function () {
        this.renderChart();
    };
    View_IndexAction_Visualization.prototype.onClick_nothingFoundNotificationLink = function (event) {
        $("#cubeviz-visualization-nothingFoundFurtherExplanation").slideDown("slow");
    };
    View_IndexAction_Visualization.prototype.onReRender_visualization = function () {
        this.render();
    };
    View_IndexAction_Visualization.prototype.onStart_application = function () {
        this.initialize();
    };
    View_IndexAction_Visualization.prototype.render = function () {
        if(1 <= _.size(this.app._.data.retrievedObservations)) {
            this.renderChart();
        } else {
            $("#cubeviz-index-visualization").html("").append($("#cubeviz-visualization-nothingFoundNotificationContainer").html());
        }
        this.bindUserInterfaceEvents({
            "click #cubeviz-visualization-nothingFoundNotificationLink": this.onClick_nothingFoundNotificationLink
        });
        return this;
    };
    View_IndexAction_Visualization.prototype.renderChart = function () {
        var offset = $(this.attachedTo).offset();
        $(this.attachedTo).css("height", $(window).height() - offset.top - 20);
        var charts = this.app._.chartConfig[this.app._.data.numberOfMultipleDimensions].charts;
        var fromChartConfig = CubeViz_Visualization_Controller.getFromChartConfigByClass(this.app._.ui.visualization.class, charts);
        var type = null;

        if(true === _.isUndefined(fromChartConfig)) {
            this.app._.ui.visualization.class = this.app._.chartConfig[this.app._.data.numberOfMultipleDimensions].charts[0].class;
            fromChartConfig = CubeViz_Visualization_Controller.getFromChartConfigByClass(this.app._.ui.visualization.class, charts);
        }
        type = CubeViz_Visualization_Controller.getVisualizationType(this.app._.ui.visualization.class);
        switch(type) {
            case "CubeViz": {
                console.log("render cubeviz visz");
                break;

            }
            default: {
                if(false === _.isUndefined(this.app._.generatedVisualization)) {
                    this.app._.generatedVisualization.destroy();
                }
                var hC = new CubeViz_Visualization_HighCharts();
                var chart = hC.load(this.app._.ui.visualization.class);
                chart.init(fromChartConfig.defaultConfig, this.app._.data.retrievedObservations, this.app._.data.selectedComponents.dimensions, CubeViz_Visualization_Controller.getOneElementDimensions(this.app._.data.selectedComponents.dimensions), CubeViz_Visualization_Controller.getMultipleDimensions(this.app._.data.selectedComponents.dimensions), this.app._.data.selectedComponents.measures, CubeViz_Visualization_Controller.getSelectedMeasure(this.app._.data.selectedComponents.measures).typeUrl, this.app._.data.selectedDSD.label, this.app._.data.selectedDS.label);
                this.app._.generatedVisualization = new Highcharts.Chart(chart.getRenderResult());
                break;

            }
        }
    };
    return View_IndexAction_Visualization;
})(CubeViz_View_Abstract);
var View_IndexAction_VisualizationSelector = (function (_super) {
    __extends(View_IndexAction_VisualizationSelector, _super);
    function View_IndexAction_VisualizationSelector(attachedTo, app) {
        _super.call(this, "View_IndexAction_VisualizationSelector", attachedTo, app);
        this.bindGlobalEvents([
            {
                name: "onReRender_visualization",
                handler: this.onReRender_visualization
            }, 
            {
                name: "onStart_application",
                handler: this.onStart_application
            }
        ]);
    }
    View_IndexAction_VisualizationSelector.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        $("#cubeviz-visualizationselector-selector").empty();
        this.hideDongle();
        this.hideMenu();
        return this;
    };
    View_IndexAction_VisualizationSelector.prototype.hideDongle = function () {
        $("#cubeviz-visualizationselector-menuDongleDiv").fadeOut("slow");
    };
    View_IndexAction_VisualizationSelector.prototype.hideMenu = function () {
        $("#cubeviz-visualizationselector-menu").fadeOut("slow", function () {
            $("#cubeviz-visualizationselector-menuItems").html("");
        });
    };
    View_IndexAction_VisualizationSelector.prototype.initialize = function () {
        this.render();
    };
    View_IndexAction_VisualizationSelector.prototype.onClick_selectorItem = function (event) {
        this.triggerGlobalEvent("onBeforeClick_selectorItem");
        var prevClass = "";
        var selectorItemDiv = null;

        if(true === _.isUndefined($(event.target).data("class"))) {
            selectorItemDiv = $($(event.target).parent());
            this.app._.ui.visualization.class = selectorItemDiv.data("class");
        } else {
            selectorItemDiv = $(event.target);
            this.app._.ui.visualization.class = selectorItemDiv.data("class");
        }
        prevClass = $($(".cubeviz-visualizationselector-selectedSelectorItem").get(0)).data("class");
        this.hideDongle();
        if(prevClass == this.app._.ui.visualization.class) {
            this.showMenu(selectorItemDiv);
        } else {
            this.hideMenu();
            $(".cubeviz-visualizationselector-selectedSelectorItem").removeClass("cubeviz-visualizationselector-selectedSelectorItem").addClass("cubeviz-visualizationselector-selectorItem");
            selectorItemDiv.removeClass("cubeviz-visualizationselector-selectorItem").addClass("cubeviz-visualizationselector-selectedSelectorItem");
            this.showMenuDongle(selectorItemDiv);
            this.triggerGlobalEvent("onChange_visualizationClass");
        }
        this.triggerGlobalEvent("onAfterClick_selectorItem");
    };
    View_IndexAction_VisualizationSelector.prototype.onReRender_visualization = function () {
        this.destroy();
        this.initialize();
    };
    View_IndexAction_VisualizationSelector.prototype.onStart_application = function () {
        this.initialize();
    };
    View_IndexAction_VisualizationSelector.prototype.render = function () {
        this.triggerGlobalEvent("onBeforeRender_visualizationSelector");
        var numberOfMultDims = this.app._.data.numberOfMultipleDimensions;
        var viszItem;
        var charts = this.app._.chartConfig[numberOfMultDims].charts;
        var selectorItemTpl = _.template($("#cubeviz-visualizationselector-tpl-selectorItem").text());
        var self = this;

        _.each(charts, function (chartObject) {
            viszItem = $(selectorItemTpl(chartObject));
            viszItem.data("class", chartObject.class);
            if(self.app._.ui.visualization.class == chartObject.class) {
                viszItem.addClass("cubeviz-visualizationselector-selectedSelectorItem").removeClass("cubeviz-visualizationselector-selectorItem");
                self.showMenuDongle(viszItem);
            }
            viszItem.on("click", $.proxy(self.onClick_selectorItem, self));
            $("#cubeviz-visualizationselector-selector").append(viszItem);
        });
        this.bindUserInterfaceEvents({
        });
        this.triggerGlobalEvent("onAfterRender_visualizationSelector");
        return this;
    };
    View_IndexAction_VisualizationSelector.prototype.showMenu = function (selectorItemDiv) {
        var charts = this.app._.chartConfig[this.app._.data.numberOfMultipleDimensions].charts;
        var fromChartConfig = CubeViz_Visualization_Controller.getFromChartConfigByClass(this.app._.ui.visualization.class, charts);
        var menuItem;
        var menuItemTpl = _.template($("#cubeviz-visualizationselector-tpl-menuItem").text());
        var menuItemsHtml = $("#cubeviz-visualizationselector-menuItems").html();
        var offset = selectorItemDiv.offset();
        var selectBox;
        var valueOption;

        if(false === _.isUndefined(fromChartConfig.options) && 0 < _.size(fromChartConfig.options) && ("" == menuItemsHtml || null == menuItemsHtml)) {
            _.each(fromChartConfig.options, function (option) {
                menuItem = $(menuItemTpl(option));
                selectBox = $(menuItem.find(".cubeviz-visualizationselector-menuSelectbox").get(0));
                valueOption = $("<option/>");
                valueOption.text(option.defaultValue.label).val(option.defaultValue.value);
                selectBox.append(valueOption);
                _.each(option.values, function (value) {
                    valueOption = $("<option/>");
                    valueOption.text(value.label).val(value.value);
                    selectBox.append(valueOption);
                });
                $("#cubeviz-visualizationselector-menuItems").append(menuItem);
            });
            $("#cubeviz-visualizationselector-menu").css("top", offset.top - 37).css("left", offset.left - 495).fadeIn("slow");
        }
    };
    View_IndexAction_VisualizationSelector.prototype.showMenuDongle = function (selectorItemDiv) {
        var charts = this.app._.chartConfig[this.app._.data.numberOfMultipleDimensions].charts;
        var fromChartConfig = CubeViz_Visualization_Controller.getFromChartConfigByClass(this.app._.ui.visualization.class, charts);

        if(false === _.isUndefined(fromChartConfig.options) && 0 < _.size(fromChartConfig.options)) {
            var offset = selectorItemDiv.offset();
            var position = selectorItemDiv.position();
            var dongleDiv = $("#cubeviz-visualizationselector-menuDongleDiv");

            dongleDiv.css("top", offset.top - 48).css("left", offset.left - 285).fadeIn("slow");
        }
    };
    return View_IndexAction_VisualizationSelector;
})(CubeViz_View_Abstract);
var cubeVizApp = new CubeViz_View_Application();
$(document).ready(function () {
    cubeVizApp.triggerEvent("onStart_application");
});