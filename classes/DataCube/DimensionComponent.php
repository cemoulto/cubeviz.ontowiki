<?php
/**
 * This class represents a DimensionComponent
 *
 * @copyright Copyright (c) 2011, {@link http://aksw.org AKSW}
 * @license http://opensource.org/licenses/gpl-license.php GNU General Public License (GPL)
 * @category OntoWiki
 * @package Extensions
 * @subpackage Cubeviz
 * @author Ivan Ermilov
 * @author Konrad Abicht
 */
class DataCube_DimensionComponent
{    
	public $property;
	public $label;
	
	public function __construct($property, $label) {
		$this->property = $property;
		$this->label = $label;
	}
}
