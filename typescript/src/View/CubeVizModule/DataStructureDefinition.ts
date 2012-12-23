/// <reference path="..\..\..\DeclarationSourceFiles\libraries\jquery.d.ts" />
/// <reference path="..\..\..\DeclarationSourceFiles\libraries\Underscore.d.ts" />
/// <reference path="..\..\..\DeclarationSourceFiles\libraries\Backbone.d.ts" />

declare var CubeViz_Links_Module: any;

class View_CubeVizModule_DataStructureDefintion extends View_Abstract 
{
    /**
     * 
     */
    constructor(attachedTo:string, viewManager:View_Manager) 
    {
        super("View_CubeVizModule_DataStructureDefintion", attachedTo, viewManager);
        this.initialize();
    }
    
    /**
     * If new option was selected
     */
    public onChange_list(event) : void 
    {
        console.log("change");
        var selectedElementId:string = $("#cubeviz-dataStructureDefinition-list").val(),
            selectedElement = this.collection.get(selectedElementId);
        
        // TODO: remember previous selection
        
        // set new selected data structure definition
        this.setSelectedDSD([selectedElement]);
    
        // reset data set view
        // this.viewManager.callView("View_CubeVizModule_DataSet");
    }
    
    /**
     * 
     */
    public initialize() : void
    {        
        var self = this;
        
        // load all data structure definitions from server
        DataCube_DataStructureDefinition.loadAll(
            
            // after all elements were loaded, add them to collection
            // and render the view
            function(entries) {
                                
                // set selected data structure definition
                self.setSelectedDSD(entries);
                
                // save given elements, doublings were ignored!
                self.collection.reset("hashedUrl");
                self.collection.addList(entries);
                
                console.log(self.collection._);
                
                // render given elements
                self.render();
                
                // load data set view
                // self.viewManager.renderView("View_CubeVizModule_DataSet");
            }
        );
    }
    
    /**
     * 
     */
    public render() : View_Abstract
    {
        var listTpl = $("#cubeviz-dataStructureDefinition-tpl-list").text();
        this["el"].append(listTpl);
        
        var list = $("#cubeviz-dataStructureDefinition-list"),
        optionTpl = _.template($("#cubeviz-dataStructureDefinition-tpl-listOption").text());
        
        // output loaded data
        $(this.collection._).each(function(i, element){
            
            // set selected variable, if element url is equal to selected dsd
            element["selected"] = element["url"] == CubeViz_Links_Module.selectedDSD.url
                ? " selected" : "";

            list.append(optionTpl(element));
        
        });

        // Delegate events to new items of the template
        this.delegateEvents({
            "change #cubeviz-dataStructureDefinition-list" : this.onChange_list
        });
        
        return this;
    }
    
    /**
     * 
     */
    public setSelectedDSD(entries:any[]) : void 
    {
        // if at least one data structure definition, than load data sets for first one
        if(0 == entries.length) {
            // todo: handle case that no data structure definition were loaded!
            CubeViz_Links_Module.selectedDSD = {};
            console.log("onComplete_LoadDataStructureDefinitions");
            console.log("no data structure definitions were loaded");
             
        } else {
            CubeViz_Links_Module.selectedDSD = entries[0];
        }
    }
}