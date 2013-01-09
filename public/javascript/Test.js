var cubeVizAppDataCopy;
var cubeViz_testCounter = 0;
var cubeViz_testFailCounter = 0;
var cubeViz_tests = [];

var cubeviz_setupTest = function () {
    ++cubeViz_testCounter;
    cubeVizApp.restoreDataCopy(cubeVizAppDataCopy);
    cubeVizApp.reset();
};
var cubeviz_tearDownTest = function () {
    cubeVizApp.restoreDataCopy(cubeVizAppDataCopy).reset().triggerEvent("onStart_application");
};
var cubeviz_startTests = function () {
    var testSuite = new MUNIT.Test(cubeViz_tests);
    cubeVizAppDataCopy = cubeVizApp.getDataCopy();
    testSuite.onSetup = cubeviz_setupTest;
    testSuite.onTearDown = cubeviz_tearDownTest;
    testSuite = testSuite.runTests();
    _.each(testSuite, function (test) {
        if(MUNIT.RESULT_BOO === test.result) {
            console.log("\n\n" + test.testCode + "\n> Message: " + test.message);
            ++cubeViz_testFailCounter;
        }
    });
    console.log("\n-----\n" + cubeViz_testCounter + " tests run, " + cubeViz_testFailCounter + " failed");
};
cubeViz_tests.push(function () {
    var t = function () {
        var numberOfMultDims = cubeVizApp._.data.numberOfMultipleDimensions;
        var expectItems = cubeVizApp._.chartConfig[numberOfMultDims].charts;
        var foundItems = $("#cubeviz-visualizationselector-selector").children();

        this.assertTrue(expectItems.length == foundItems.length);
    };
    cubeVizApp.bindGlobalEvents([
        {
            name: "onAfterRender_visualizationSelector",
            handler: $.proxy(t, this)
        }
    ]).triggerEvent("onStart_application");
});
cubeViz_tests.push(function () {
    cubeVizApp.triggerEvent("onStart_application");
    var viszClassBeforeItemClick = cubeVizApp._.ui.visualization.class;
    var items = $("#cubeviz-visualizationselector-selector").children();
    var secondItem = $(items[1]);
    var secondItemsClass = $(secondItem).data("class");

    $(secondItem).click();
    var t = function () {
        this.assertTrue(secondItemsClass == viszClassBeforeItemClick);
    };
    cubeVizApp.bindGlobalEvents([
        {
            name: "onAfterClick_selectorItem",
            handler: $.proxy(t, this)
        }
    ]);
});
cubeViz_tests.push(function () {
    cubeVizApp.triggerEvent("onStart_application");
    var isSecondClick = false;
    var items = $("#cubeviz-visualizationselector-selector").children();
    var secondItem = $(items[1]);
    var menuItems = $("#cubeviz-visualizationselector-menuItems").children();

    var t = function () {
        if(true == isSecondClick) {
            this.assertTrue(menuItems.length < $("#cubeviz-visualizationselector-menuItems").children().length);
        }
    };
    cubeVizApp.bindGlobalEvents([
        {
            name: "onAfterClick_selectorItem",
            handler: $.proxy(t, this)
        }
    ]);
    $(secondItem).click();
    isSecondClick = true;
    $(secondItem).click();
});