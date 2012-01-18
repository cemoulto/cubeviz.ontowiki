<?php
/**
 * This file is part of the {@link http://ontowiki.net OntoWiki} project.
 *
 * @copyright Copyright (c) 2011, {@link http://aksw.org AKSW}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 * @package Extensions
 */

/**
 * The file providing the title helper class for elements of a knowledge base
 */
require_once 'OntoWiki/Model/TitleHelper.php';

/**
 * Chart model class for the ChartView component. This class provides a generic
 * chart model with an default approach to process two dimensions and one
 * measure.
 *
 * @copyright Copyright (c) 2011, {@link http://aksw.org AKSW}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 * @category OntoWiki
 * @package Extensions
 * @subpackage Cubeviz
 * @author Tom-Michael Hesse <tommichael.hesse@googlemail.com>
 */
abstract class Chart {
    
    /**
     * Holds the type of the chart represented as a name string
     * @var string The type of the chart as string
     */
    static protected $_type = '';
    
    /**
     * Holds the limits as numbers of dimensions and measures of the chart for 
     * which the chart model can be applied
     * @var array The limits of the chart: 'minDimension' => int, 
     * 'maxDimension' => int, 'minMeasure' => int, 'maxMeasure' => int  
     */
    static protected $_limits = array();
    
    /**
     * Holds the xAxis data of the chart
     * @var array The xAxis data: either 'dimensionName' => string,
     * 'dimensionValues' => array() or 'measure' => string
     */
    protected $_xAxis = array();
    
    /**
     * Holds the yAxis data of the chart
     * @var array The yAxis data: either 'dimensionName' => string,
     * 'dimensionValues' => array() or 'measure' => string
     */
    protected $_yAxis = array();
    
    /**
     * Holds the zAxis data of the chart
     * @var array The zAxis data: either 'dimensionName' => string,
     * 'dimensionValues' => { 'dimensionElementUri' => 'dimensionElementName'} 
     * or 'measure' => string
     */
    protected $_zAxis = array();
    
    /**
     * Holds the numeric data of the chart series
     * @var array The chart series data: 'dimensionQName' => 
     * { 'dimensionQName' => { ... => measureValue } } 
     */
    protected $_data = array();
    
    /**
     * Holds the title strings for the chart
     * @var array The titles of the chart: 'title' => string, 'subtitle' => string 
     */
    protected $_titles = array();
    
    /**
     * Holds a warning message translation id if the process of the chart object
     * creation has been cancelled due to any errors
     * @var string The translation id as string 
     */
    protected $_message = '';
    
    /**
     * Initializes the chart model with all needed data for generating the series
     * and meta information.
     * @param array $dimensionData The dimension data to be used in the chart;
     * generated by the cube helper
     * @param array $measureData The measure data to be used in the chart;
     * generated by the cube helper
     * @param array $nameTable The name table for the qualified names of the
     * dimensions and measures; generated by the cube helper
     * @param array $dimensions The dimensions with their axis allocation to be used
     * in the chart
     * @param array $measures The measures to be used in the chart
     * @param array $titles The titles array
     * @param Erfurt_Rdf_Model $model The model from which the labels can be aquired
     */
    public function __construct($dimensionData, $measureData, $nameTable, 
            $dimensions, $measures, $titles, $model) {
        
        //This is a generic implementation processing two dimensions and one 
        //measure as a standard approach. The processing of any other limit 
        //specification can be done by overwriting this constructor in a child 
        //class.
        $tempXAxis = array();
        $tempXLabels = array();
        $tempZAxis = array();
        $tempZLabels = array();
        $tempData = array();
        $titleHelper;
        
        //generic test for the appropriate numbers of dimensions and measures
        if(count($dimensions) >= static::$_limits['minDimension'] 
                && count($dimensions) <= static::$_limits['maxDimension'] 
                && count($measures) >= static::$_limits['minMeasure']
                && count($measures) <= static::$_limits['maxMeasure']) {
        
            //initialize the helpers and title variable
            $twoDimensions = (count($dimensions) >= 2 ? true : false);
            $xDimension = '';
            $zDimension = '';
            
            if(isset($model)) $titleHelper = new OntoWiki_Model_TitleHelper($model);
        
            $this->_titles = $titles;
            $titleHelper->addResource($this->_titles['title']);
            
            //set yAxis as fixed measure entry
            $this->_yAxis = array('measure' => $nameTable['m'][$measures[0]]['label']);
            
            //set the other axis
            $xDimension = array_search('x', $dimensions);
            $this->_xAxis = array('dimensionName' => $nameTable['d'][$xDimension]['label'], 
                'dimensionValues' => array());
            //when given, also set the zAxis
            if($twoDimensions) {
                $zDimension = array_search('z', $dimensions);
                $this->_zAxis = array('dimensionName' => $nameTable['d'][$zDimension]['label'], 
                    'dimensionValues' => array());
            }
            $measQName = $nameTable['m'][$measures[0]]['qname'];
            $dimQName0 = $nameTable['d'][$xDimension]['qname'];
            //iterate the data and rearrange the data structure in a way which 
            //is easier to handle
            foreach ($dimensionData as $index=>$dimensionTuple) {
                
                if($twoDimensions) {
                    
                    $dimQName1 = $nameTable['d'][$zDimension]['qname'];
                    
                    if(!isset($tempData[$dimensionTuple[$dimQName0]]
                            [$dimensionTuple[$dimQName1]])) {

                        $tempData[$dimensionTuple[$dimQName0]][$dimensionTuple[$dimQName1]] 
                            = $measureData[$index][$measQName];
                        $tempXLabels[$dimensionTuple[$dimQName0]] = '';
                        $titleHelper->addResource($dimensionTuple[$dimQName0]);
                        $tempZLabels[$dimensionTuple[$dimQName1]] = '';
                        $titleHelper->addResource($dimensionTuple[$dimQName1]);
                    }
                }
                else {
                    if(!isset($tempData[$dimensionTuple[$dimQName0]])) {
                        $tempData[$dimensionTuple[$dimQName0]]['sum'] 
                            = $measureData[$index][$measQName];
                        $tempXLabels[$dimensionTuple[$dimQName0]] = '';
                        $titleHelper->addResource($dimensionTuple[$dimQName0]);
                        $tempZLabels['sum'] = 'sum';
                    }
                }
               
            }
            
            //get the labels for the axis values 
            foreach($tempXLabels as $uri => $name) {
                $tempXLabels[$uri] = addslashes($titleHelper->getTitle($uri));
            }

            foreach($tempZLabels as $uri => $name) {
                $tempZLabels[$uri] = addslashes($titleHelper->getTitle($uri));
            }
                
            
            //set the data
            $this->_data = $tempData;

            //set the corresponding axis labels and titles
            $this->_xAxis['dimensionValues'] = array_unique($tempXLabels);
            if($twoDimensions) 
                $this->_zAxis['dimensionValues'] = array_unique($tempZLabels);
            $this->_titles['title'] 
                    = addslashes($titleHelper->getTitle($this->_titles['title']));
            $this->_titles['subtitle'] = addslashes($this->_titles['subtitle']);
        }
    }
    
    /**
     * Returns the xAxis data of the chart model
     * @return array The xAxis array of the chart 
     */
    public function getXAxis() {
        return $this->_xAxis;
    }
    
    /**
     * Returns the yAxis data of the chart model
     * @return array The yAxis array of the chart
     */
    public function getYAxis() {
        return $this->_yAxis;
    }
    
    /**
     * Returns the zAxis data of the chart model
     * @return array The zAxis array of the chart
     */
    public function getZAxis() {
        return $this->_zAxis;
    }
    
    /**
     * Returns the measure series data of the chart model
     * @return array The series data array of the chart
     */
    public function getData() {
        return $this->_data;
    }
    
    /**
     * Returns the titles of the chart model
     * @return array The titles array of the chart
     */
    public function getTitles() {
        return $this->_titles;
    }
    
    /**
     * Returns the warning message id if the chart object creation was terminated
     * @return string The message id as a string 
     */
    public function getMessage() {
        return $this->_message;
    }
    
    /**
     * Returns the type name of the chart model
     * @return array The name string of the chart
     */
    public static function getType() {
        return static::$_type;
    }
    
    /**
     * Returns the limits of the chart model
     * @return array The limits array of the chart
     */
    public static function getLimits() {
        return static::$_limits;
    }
   
}

?>
