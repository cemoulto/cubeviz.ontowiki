/**
 * 
 */
class CubeViz_Visualization_HighCharts_Chart 
{
    public chartConfig:any;
    
    /**
     * Returns the chart title for the given data.
     */
    public buildChartTitle ( cubeVizLinksModule:Object, retrievedObservations:Object[] ) : string {
        
        var dsdLabel = cubeVizLinksModule ["selectedDSD"]["label"],
            dsLabel = cubeVizLinksModule ["selectedDS"]["label"],
            
            oneElementDimensions = CubeViz_Visualization_Controller.getOneElementDimensions (
                retrievedObservations, 
                cubeVizLinksModule ["selectedComponents"]["dimensions"],
                cubeVizLinksModule ["selectedComponents"]["measures"]
            ),
            // build first part of chart title
            builtTitle = dsdLabel + " - " + dsLabel;
        
        for ( var i in oneElementDimensions ) {
            builtTitle += " - " + oneElementDimensions[i]["elements"][0]["propertyLabel"];
        }
        
        return builtTitle;
    } 
    
    /**
     * 
     */
    public init ( entries:any, cubeVizLinksModule:Object, chartConfig:any, className ) : void { 
    
        var forXAxis = null,
            forSeries = null,
            selectedComponentDimensions = cubeVizLinksModule ["selectedComponents"]["dimensions"], 
            measures = cubeVizLinksModule ["selectedComponents"]["measures"], 
            measureUri = CubeViz_Visualization_Controller.getMeasureTypeUrl (cubeVizLinksModule),
            multipleDimensions = CubeViz_Visualization_Controller.getMultipleDimensions ( 
                entries, selectedComponentDimensions, measures
            ),
            observation = new DataCube_Observation (); 
        
        // save given chart config
        this ["chartConfig"] = chartConfig;
        
        console.log(" chart init > chartConfig");
        console.log(chartConfig);
        
        /**
         * Build chart title
         */
        this ["chartConfig"]["title"]["text"] = this.buildChartTitle (cubeVizLinksModule, entries);        

        // assign selected dimensions to xAxis and series (yAxis)
        for ( var hashedUrl in selectedComponentDimensions ) {
            if ( null == forXAxis ) {
                forXAxis = selectedComponentDimensions[hashedUrl]["typeUrl"];
            } else {
                forSeries = selectedComponentDimensions[hashedUrl]["typeUrl"];
            }
        }
        
        // If set, switch axes
        /*if ( true == CubeViz_Data ["_highchart_switchAxes"] ) {
            var tmp = forXAxis;
            forXAxis = forSeries;
            forSeries = tmp;
        }*/
        
        // initializing observation handling instance with given elements
        // after init, sorting the x axis elements ascending
        observation.initialize ( entries, selectedComponentDimensions, measureUri );
        var xAxisElements:Object = observation
            .sortAxis ( forXAxis, "ascending" )
            .getAxisElements ( forXAxis );
            
        if(undefined === this ["xAxis"]) {
            this ["xAxis"] = {"categories": []};
        }
            
        for ( var value in xAxisElements ) {
            this ["xAxis"]["categories"].push (
                CubeViz_Visualization_Controller.getLabelForPropertyUri ( value, forXAxis, selectedComponentDimensions )
            );
        }
        
        // now we will care about the series
        var found:bool = false,
            i:number = 0,
            length:number = _.keys(xAxisElements).length, // System.countProperties (xAxisElements),
            obj:Object = {},
            seriesElements:Object = observation.getAxisElements ( forSeries );
            
        this["series"] = [];

        for ( var seriesEntry in seriesElements ) {
            
            // this represents one item of the series array (of highcharts)
            obj = { 
                "name": CubeViz_Visualization_Controller.getLabelForPropertyUri ( 
                    seriesEntry, forSeries, selectedComponentDimensions
                ),
                "data": [],
                "color": CubeViz_Visualization_Controller.getColor ( seriesEntry )
            };
            
            // iterate over all x axis elements
            for ( var xAxisEntry in xAxisElements ) {
                
                found = false;
                
                // check for each entry of the x axis, if one of its entries contains a ref 
                // to the the given seriesEntry
                for ( var i in xAxisElements[xAxisEntry] ) {
                    
                    // if one of the xAxis entries fits with given seriesEntry, so push the related value 
                    // into the obj [data] array
                    for ( var j in xAxisElements[xAxisEntry][i][measureUri]["ref"] ) {                                                
                        if ( seriesEntry == xAxisElements[xAxisEntry][i][measureUri]["ref"][j][forSeries]["value"] ) {
                            var floatValue = parseFloat(xAxisElements[xAxisEntry][i][measureUri]["value"]);
                            if (isNaN(floatValue)) {
                                floatValue = null;
                            } 
                               
                            obj ["data"].push ( floatValue );
                            found = true;
                            
                            // .. break this loop ...
                            break;
                        }
                    }
                    // ... and this loop, because we found our related value
                    if ( true == found ) {
                        break;
                    }                     
                }                
                // Push null, if it was not possible to found the related value, to prevent highcharts sort 
                // valid values at the beginning because it violates the order of entries
                if ( false == found ) {
                    obj ["data"].push ( null );
                }
            }
            
            this["series"].push (obj);
        }
        
        console.log ( "" );
        console.log ( "generated series:" );
        console.log ( this["series"] );
    }
    
    /**
     * 
     */
    public getRenderResult () : Object 
    {
        this["chartConfig"]["xAxis"] = this ["xAxis"];
        this["chartConfig"]["series"] = this ["series"];        
        return this.chartConfig;
    }
}
