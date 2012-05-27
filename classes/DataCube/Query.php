<?php
/**
 * This class provide interface for querying the Data Cube
 *
 * @copyright Copyright (c) 2011, {@link http://aksw.org AKSW}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 * @category OntoWiki
 * @package Extensions
 * @subpackage Cubeviz
 * @author Ivan Ermilov 
 */
class DataCube_Query {
    
    private $_model = null;
    private $_titleHelper = null;
    
    /**
     * Constructor
     */
    public function __construct (&$model = null, &$titleHelper = null) {
        $this->_model = $model;
        $this->_titleHelper = $titleHelper;
    }
	
	/**
	 * Returns array of Data Structure Definitions 
     * @return array
	 */ 
	public function getDataStructureDefinition() {   
		
		$result = array();

		//get all indicators in the cube by the DataStructureDefinitions
		$sparql = 'SELECT ?dsd WHERE {
            ?dsd <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <'. DataCube_UriOf::DataStructureDefinition .'>. 
        }';
		
        $queryResultDSD = $this->_model->sparqlQuery($sparql);

		foreach($queryResultDSD as $dsd) {
			if( false == empty ($dsd['dsd']) ) {
				$result[] = $dsd['dsd'];
				if( false == empty ($this->_titleHelper) ) {
                    $this->_titleHelper->addResource($dsd['dsd']);
                }
			}
		}
		return $result;
	}  
    
	/**
	 * Function for getting datasets for this data structure
	 * @param $dsUri Data Set Uri
     * @return array
	 */
    public function getDataSets($dsUri) {	
        
        //get all data sets in the cube for the given DataStructureDefinition
        $sparql = 'SELECT ?ds WHERE {
            ?ds <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <'.DataCube_UriOf::DataSet.'>.
            ?ds <'.DataCube_UriOf::Structure.'> <'.$dsUri.'>.
        };';

        $queryResultDS = $this->_model->sparqlQuery($sparql);

        $result = array();

        foreach($queryResultDS as $ds) {
            if(false == empty($ds['ds'])) {
                $result[] = $ds['ds'];
                if( false == empty ($this->_titleHelper) ) {
                    $this->_titleHelper->addResource($dsd['ds']);
                }
            }
        }
        
        return $result;
    }
    
    /**
     * Returns an array of components (Component) with md5 of URI, type and URI.
     * @param $dsdUri Data Structure Definition URI
     * @param $dsUri Data Set URI
     * @param $component DataCube_UriOf::Dimension or ::Measure
     * @return array
     */
	public function getComponents($dsdUri, $dsUri, $componentType) {
                
        //search for the components specified by the parameters
        $sparql = 'SELECT ?comp ?comptype ?order WHERE {
            <'.$dsdUri.'> <'.DataCube_UriOf::Component.'> ?comp.                
            ?comp <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <'.DataCube_UriOf::ComponentSpecification.'>.
            ?comp <'.$componentType.'> ?comptype.
            
            OPTIONAL {?comp <'.DataCube_UriOf::Order.'> ?order.}
        }
        ORDER BY ASC(?order);';

        $queryresultComp = $this->_model->sparqlQuery($sparql);
        
        $result = array();
        
        //iterate through all found results
        foreach($queryresultComp as $comp) {
            if(false == empty($comp['comp'])) {
				//add the component properties to the result set
                $result[$comp['comp']]['uri'] = $comp['comp'];
                $result[$comp['comp']]['md5'] = md5($comp['comp']);
                $result[$comp['comp']]['type'] = $comp['comptype'];
                if($componentType == 'dimension'){
                    $result[$comp['comp']]['elementCount'] 
                        = DataCube_Query::getComponentElementCount($dsUri, $comp['comptype']);
                }
                $result[$comp['comp']]['order'] = isset($comp['order']) 
                    ? $comp['order'] : -1;
                    
                if( false == empty ($this->_titleHelper) )
                    $this->_titleHelper->addResource($comp['comp']);
            }
        }
        
        return $result;
    }
    
    /**
     * Returns an array of all dimension properties
     * @return array
     */
    public function getDimensionProperties () {
        
        $sparql = 'SELECT DISTINCT ?propertyUri ?rdfsLabel WHERE {
            ?propertyUri ?p <'. DataCube_UriOf::DimensionProperty.'>.
            OPTIONAL { ?propertyUri <http://www.w3.org/2000/01/rdf-schema#label> ?rdfsLabel }
        };';
        
        return $this->_model->sparqlQuery($sparql);
    }   
    
    /**
     * Returns an array of all measure properties
     * @return array
     */
    public function getMeasureProperties () {
        
        $sparql = 'SELECT DISTINCT ?propertyUri ?rdfsLabel WHERE {
            ?propertyUri ?p <'. DataCube_UriOf::MeasureProperty.'>.
            OPTIONAL { ?propertyUri <http://www.w3.org/2000/01/rdf-schema#label> ?rdfsLabel }
        };';
        
        return $this->_model->sparqlQuery($sparql);
    }   
    
    /**
     * Returns an array of Resources which has a certain relation ($componentProperty) to a dataset.
     * @param $dataSetUri DataSet Uri
     * @param $componentProperty Uri of a certain dimension property
     * @param $limit Limit number of result entries
     * @param $offset Start position in result 
     * @return array
     */
    public function getComponentElements($dataSetUri, $componentProperty, $limit = 0, $offset = 0) {
        
        $sparql = 'SELECT DISTINCT ?element WHERE {
            ?observation <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <'.DataCube_UriOf::Observation.'>.
            ?observation <'.DataCube_UriOf::DataSetRelation.'> <'.$dataSetUri.'>.
            ?observation <'.$componentProperty.'> ?element.
        } 
        ORDER BY ASC(?element)';
        
        $sparql .= 0 < $limit ? ' LIMIT '. $limit : '';
        $sparql .= 0 < $limit && 0 <= $offset ? ' OFFSET '. $offset .';' : '';
        
        $queryResultElements = $this->_model->sparqlQuery($sparql);
		
        $result = array();
        
		foreach($queryResultElements as $key => $element) {
            if(false == empty ($element['element'])) {
				$result[$key] = $element['element'];
			}
        }
                        
        return $result;
    }
	
	/**
	 * 
	 * 
	 */
	static private function getComponentElementCount($dsUri, $componentProperty) {
        $store = Erfurt_App::getInstance()->getStore();
        $result = 0;
                
        $queryComponentElementCount = new Erfurt_Sparql_SimpleQuery();
        $queryComponentElementCount->setProloguePart('SELECT COUNT(DISTINCT(?element)) 
            AS ?elemCount');
        $queryComponentElementCount->setWherePart('WHERE {?observation 
            <'.DataCube_Query::$rdfType.'> <'.DataCube_Query::$qb_Observation.'>.
            ?observation <'.DataCube_Query::$qb_datasetrel.'> <'.$dsUri.'>.
            ?observation <'.$componentProperty.'> ?element.}');
        
        $queryResultElementCount 
            = $store->sparqlQuery($queryComponentElementCount);

        $countRow = current($queryResultElementCount);
        $result = (int) $countRow['elemCount'];
        
        return $result;
    } 
    
    /**
     * 
     * 
     */
    static public function getResultObservations($resultCubeSpec, $model) {
        
        //$resultCubeSpec - array(8)
        //["ds"] => URI
        //["dim"] => array() URIs
        //["dimtypes"] => array() ["URI" => uri, md5, type, elemCount, order]
        //["ms"] => URI
        //["mstypes"] => array() ["URI" => uri, md5, type, order]
        //["dimOptionList"] => array() ["URI" => string()]
        //["measFunctionList"] => ["URI" => string()] - SUM
        //["measOptionList"] => ["URI" => string()] - DESC
        
        $internalNameTable = array();
        
        $titleHelper = new OntoWiki_Model_TitleHelper($model);
        
        $queryProloguePart = "SELECT";
        $queryWherePart = "WHERE { ?observation <".DataCube_Query::$rdfType."> 
            <".DataCube_Query::$qb_Observation.">.";
        $queryWherePart .= " ?observation <".DataCube_Query::$qb_datasetrel."> 
            <".$resultCubeSpec['ds'].">.";
        $queryGroupByPart = "";
        $queryOrderByPart = "";
        
        $queryComp = new Erfurt_Sparql_SimpleQuery();
        
        //add all dimensions to the query
        foreach($resultCubeSpec['dim'] as $index => $dimension) {
            
            $dimPropertyUri = $resultCubeSpec['dimtypes'][$dimension]['type'];
            $dimQName = "d".$index;
            
            /*if ( false == isset ($resultCubeSpec['dimOptionList'][$dimension]) ) {
                $resultCubeSpec['dimOptionList'][$dimension] = array ();
                $resultCubeSpec['dimOptionList'][$dimension]['order'] = '';
            }*/
            
            //$queryOrderByPart = 'ASC';
            
            $resultCubeSpec['dimOptionList'][$dimension]['order'] = 
					strtoupper($resultCubeSpec['dimOptionList'][$dimension]['order']);
            //only add those dimensions for which more than one element was
            //selected
            if($resultCubeSpec['dimtypes'][$dimension]['elemCount'] != 1) {
                $queryProloguePart.= " ?".$dimQName;
                $queryGroupByPart .= " ?".$dimQName;
                
                $queryOrderByPart .= ($resultCubeSpec['dimOptionList'][$dimension]['order'] != 'NONE' ? 
                    $resultCubeSpec['dimOptionList'][$dimension]['order'].
                    '(?'.$dimQName.') ' : '');
            }
             
            // $dimPropertyUri = http://data.lod2.eu/scoreboard/properties/country
               
            $queryWherePart.= " ?observation <".$dimPropertyUri."> ?".$dimQName.".";
            
            $titleHelper->addResource($dimension);
            
            $internalNameTable['d'][$dimension]['index'] = $index;
            $internalNameTable['d'][$dimension]['qname'] = $dimQName;
            $internalNameTable['d'][$dimension]['uri'] = $dimension;
            $internalNameTable['d'][$dimension]['type'] = $dimPropertyUri;
            
            //add constraints for the dimension element selection in the observations
            if(isset($resultCubeSpec['dimElemList'][$dimension])) {
                
                $dimElemList = DataCube_Query::getComponentElements($resultCubeSpec['ds'], $dimPropertyUri);
                $falseList = array_diff($dimElemList, $resultCubeSpec['dimElemList'][$dimension]);
                
                if(count($falseList)>0) {
                
                    //if the falselist contains less then 80 elements, use NOT 
                    //filter statement
                    if(count($falseList) < 80) {
                    
                        $queryWherePart = substr($queryWherePart,0,strlen($queryWherePart)-1).
                                " FILTER ( NOT(";

                        foreach($falseList as $element) {
                            $elementString = '<'.$element.'>';
                            if(strpos($element, 'http://') === false) 
                                    $elementString = '"'.$element.'"';
                            $queryWherePart.= " ?".$dimQName." = ".$elementString." OR";
                        }

                        $queryWherePart 
                            = substr($queryWherePart, 0, strlen($queryWherePart)-3).")).";
                                        
                    } 
                    //else use the regular filter statement
                    else {
                        
                        $queryWherePart = substr($queryWherePart,0,strlen($queryWherePart)-1).
                                " FILTER ( (";

                        foreach($resultCubeSpec['dimElemList'][$dimension] as $element) {
                            $elementString = '<'.$element.'>';
                            if(strpos($element, 'http://') === false) 
                                    $elementString = '"'.$element.'"';
                            $queryWherePart.= " ?".$dimQName." = ".$elementString." OR";
                        }

                        $queryWherePart 
                            = substr($queryWherePart, 0, strlen($queryWherePart)-3).")).";
                        
                    }
                }
            }
            
            //add element constraints if the dimension elements are paginated
            if(isset($resultCubeSpec['dimLimitList'][$dimension])) {
                
                $dimElemList = $this->getComponentElements($resultCubeSpec['ds'], 
                        $dimPropertyUri, null, $resultCubeSpec['dimLimitList'][$dimension]);
                
                $queryWherePart = substr($queryWherePart,0,strlen($queryWherePart)-1).
                        " FILTER (";
                
                foreach($dimElemList as $element) {
                    $elementString = '<'.$element.'>';
                    if(strpos($element, 'http://') === false) 
                            $elementString = '"'.$element.'"';
                    $queryWherePart.= " ?".$dimQName." = ".$elementString." OR";
                }
                
                $queryWherePart = substr($queryWherePart, 0, strlen($queryWherePart)-3).").";
            }
        }
        
        //add all measures to the query
        foreach($resultCubeSpec['ms'] as $index => $measure) {
            
            $measPropertyUri = $resultCubeSpec['mstypes'][$measure]['type'];
            $measQName = "m".$index;
            
            
            /**************
             * TODO BLOCK *
             **************/
            
            $queryProloguePart .= " ".$resultCubeSpec['measFunctionList'][$measure].
                    "(?".$measQName.") AS ?".$measQName;    
            
            $queryWherePart .= " ?observation <".$measPropertyUri."> ?".$measQName.".";
            
            $queryOrderByPart .= ($resultCubeSpec['measOptionList'][$measure]['order'] != 'NONE' ? 
                    $resultCubeSpec['measOptionList'][$measure]['order'].
                    '(?'.$measQName.') ' : '');
            
            $titleHelper->addResource($measure);
            
            $internalNameTable['m'][$measure]['index'] = $index;
            $internalNameTable['m'][$measure]['qname'] = $measQName;
            $internalNameTable['m'][$measure]['uri'] = $measure;
            $internalNameTable['m'][$measure]['type'] = $measPropertyUri;
        }
        
        foreach($internalNameTable as $type => $compSpec) {
            foreach($compSpec as $uri => $elements) {
                $internalNameTable[$type][$uri]['label'] 
                    = $titleHelper->getTitle($elements['uri']); 
            }
        }
        
        //add group-by- and order-by-statements only if there are things to group and to sort
        $queryWherePart.="}".($queryGroupByPart != "" ? " GROUP BY ".$queryGroupByPart : "")
            .($queryOrderByPart != "" ? " ORDER BY ".$queryOrderByPart : "");
        
        //create and run the query
        $queryObservations = new Erfurt_Sparql_SimpleQuery();
        
        $queryObservations->setProloguePart($queryProloguePart);
        $queryObservations->setWherePart($queryWherePart);
        
        $queryResultObservations = $model->sparqlQuery($queryObservations);
        
        
        $result = array ('observations'=>$queryResultObservations, 
            'nameTable'=>$internalNameTable);

        return $result;
        
    }
	 
}
