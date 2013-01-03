/// <reference path="..\..\..\..\declaration\libraries\CryptoJs.d.ts" />

/**
 * Provides functions to decide which visualization to load
 */
class CubeViz_Visualization_Controller 
{    
    /**
     * Copied and adapted from: http://stackoverflow.com/a/13619725
     * @param obj Variable to check
     * @return bool True if variable is a circular object, false otherwise
     */
    public isCircularObject (obj:any, parents?:any, tree?:any) : bool
    {
        parents = parents || [];
        tree = tree || [];

        if (!obj || false === _.isObject(obj))
            return false;

        var keys = _.keys(obj), 
            i = keys.length - 1, 
            value;

        parents.push(obj); // add self to current path

        for (; i >= 0; --i){
            value = obj[keys[i]];
            if (value && true === _.isObject(obj)) {
                tree.push(keys[i]);
                
                if (parents.indexOf(obj) >= 0)
                    return true;
                    
                // check child nodes
                if (arguments.callee(value, parents, tree))
                    return tree.join('.');
                tree.pop();
            }
        }

        parents.pop();
        return false;
    }
    
    /**
     * Extract a hex color code for a given URI (using hash algorithm).
     * @param uri string
     * @return string Generated hex color code
     */
    static getColor ( uri:string ) : string 
    {
        var color:string = "#FFFFFF";
        
        // uri is string or number
        if(true === _.isString(uri) || true === _.isNumber(uri)) {
            color = "" + CryptoJS.MD5 (uri);
            color = "#" + color.substr((color["length"]-6), 6);
            
        // uri is object (but not a circular one!)
        } else if (false === this.isCircularObject && true === _.isObject(uri)) {
            color = JSON.stringify(uri);
            color = "#" + color.substr((color["length"]-6), 6);
        } else {
            
        }
        
        return color;
    }
    
    /**
     * 
     */
    static getDimensionOrMeasureLabel (uri:string, CubeViz_Links_Module) : string {
        
        if ( "http://www.w3.org/2000/01/rdf-schema#label" == uri ) {
            return "Label";
        }
        
        // return the first value
        for ( var dim in CubeViz_Links_Module["selectedComponents"]["dimensions"] ) { 
            
            dim = CubeViz_Links_Module["selectedComponents"]["dimensions"][dim];
            
            if ( uri == dim ["typeUrl"] ) {
                return dim ["label"]; 
            }
        }
        
        // return the first value
        for ( var mea in CubeViz_Links_Module["selectedComponents"]["measures"] ) { 
            
            mea = CubeViz_Links_Module["selectedComponents"]["measures"][mea];
            
            if ( uri == mea ["typeUrl"] ) {
                return mea ["label"]; 
            }
        }
        
        return uri;
    }
    
    /**
     * 
     */
    static getFromChartConfigByClass ( className:string, charts:Object[] ) : string {
        for ( var i in charts ) {
            if ( className == charts [i]["class"] ) {
                return charts [i];
            }
        }
    }    
    
    /**
     * Returns the label of the given property uri.
     */
    static getLabelForPropertyUri ( propertyUri:string, dimensionType:string, selectedDimensions:Object[] ) : string {
        var dim:Object = {};
                
        for ( var hashedUrl in selectedDimensions ) {
            
            dim = selectedDimensions[hashedUrl];
            
            // Stop if the given dimension was found (by type)
            if ( dim["typeUrl"] == dimensionType ) {
                
                for ( var i in dim["elements"] ) {
                    if ( dim["elements"][i]["property"] == propertyUri ) {
                        return dim["elements"][i]["propertyLabel"];
                    }
                }
            }
        }
        
        // if nothing was found, simply return the given propertyUri
        return propertyUri;
    }
    
    /**
     * Extract the uri of the measure value
     */
    static getMeasure (CubeViz_Links_Module:any) : string {
        // return the first value
        for ( var hashedTypeUrl in CubeViz_Links_Module["selectedComponents"]["measures"] ) { 
            return CubeViz_Links_Module["selectedComponents"]["measures"][hashedTypeUrl]; 
        }
    }
    
    /**
     * Extract the uri of the measure value
     */
    static getMeasureTypeUrl (CubeViz_Links_Module) : string {
        var m = CubeViz_Visualization_Controller.getMeasure (CubeViz_Links_Module);
        return m ["typeUrl"];
    }
    
    /**
     * @return Object[]
     */
    static getMultipleDimensions(selectedDimensions:any[]) : Object [] 
    {
        // assign selected dimensions to xAxis and series (yAxis)
        var multipleDimensions:any[] = [];
        
        // for ( var hashedUrl in selectedDimensions ) {
        _.each(selectedDimensions, function(selectedDimension){
                        
            if(2 > _.size(selectedDimension.elements)) {
                return;
            }
            
            // Only put entry to multipleDimensions if it have at least 2 elements    
            multipleDimensions.push ({
                elements: selectedDimension.elements,
                label: selectedDimension.label
            }); 
        });
        
        return multipleDimensions;
    }
    
    /**
     * @return Object[]
     */
    static getOneElementDimensions ( retrievedData:Object[], selectedDimensions:Object[],
                                      measures:Object[] ) : Object [] {
                                                
        // assign selected dimensions to xAxis and series (yAxis)
        var oneElementDimensions:Object[] = [],
            tmp:Object[] = [];
            
        for ( var hashedUrl in selectedDimensions ) {
                        
            // Only put entry to multipleDimensions if it have at least 2 elements
            if ( 1 == selectedDimensions [hashedUrl] ["elements"]["length"] ) {
                oneElementDimensions.push ( {
                    "label" : selectedDimensions [hashedUrl]["label"],
                    "elements" : selectedDimensions [hashedUrl] ["elements"] 
                } ); 
            }
        }
        
        return oneElementDimensions;
    }
    
    /**
     * 
     */
    static getVisualizationType (className:string) : string {
        if ( "Visualization_CubeViz_Table" == className ) {
            return "CubeViz";
        }
        return "HighCharts";
    }
    
    /**
     * Update ChartConfig entry with new value. Required e.g. for chart selection menu.
     */
    static setChartConfigClassEntry ( className:string, charts:Object[], newValue:any ) {
        for ( var i in charts ) {
            if ( className == charts [i]["class"] ) {
                charts [i] = newValue;
            }
        }
    }
}
