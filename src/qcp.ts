
// SET TO FALSE IN PRODUCTION
const DEBUG = true;

function debug(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

/**
 * This method is called by the calculator when the plugin is initialized.
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in a quote
 * @returns {Promise}
 */
export function onInit(quoteLineModels) {
  return new Promise((resolve, reject) => {
    // Perform logic here and resolve promise
    /*console.log('JJS73 onInit');
    logRecords(quoteLineModels);*/
    resolve();
  });
}


/**
 * This method is called by the calculator before calculation begins, but after formula fields have been evaluated.
 * @param {QuoteModel} quoteModel JS representation of the quote being evaluated
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {Promise}
 */
export function onBeforeCalculate(quoteModel, quoteLineModels) {
  return new Promise((resolve, reject) => {
    // Perform logic here and resolve promise
    console.log('JJS73 onBeforeCalculate');
    
    logRecords(quoteLineModels);
    resolve();
  });
}


/**
 * This method is called by the calculator before price rules are evaluated.
 * @param {QuoteModel} quoteModel JS representation of the quote being evaluated
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {Promise}
 */
export function onBeforePriceRules(quoteModel, quoteLineModels) {
  return new Promise((resolve, reject) => {
    // Perform logic here and resolve promise
    /*console.log('JJS73 onBeforePriceRules');
    logRecords(quoteLineModels);*/
    resolve();
  });
}


/**
 * This method is called by the calculator after price rules are evaluated.
 * @param {QuoteModel} quoteModel JS representation of the quote being evaluated
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {Promise}
 */
export function onAfterPriceRules(quoteModel, quoteLineModels) {
  return new Promise((resolve, reject) => {
    // Perform logic here and resolve promise
    /*console.log('JJS73 onAfterPriceRules');
    logRecords(quoteLineModels);*/
    resolve();
  });
}


/**
 * This method is called by the calculator after calculation has completed, but before formula fields are
 * re-evaluated.
 * @param {QuoteModel} quoteModel JS representation of the quote being evaluated
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {Promise}
 */
export function onAfterCalculate(quoteModel, quoteLineModels) {
  return new Promise((resolve, reject) => {
    // Perform logic here and resolve promise

    console.log('JJS73 onAfterCalculate');
    console.dir(quoteLineModels);
    calc_CMU_BLOCK(quoteLineModels);
    addCPT(quoteLineModels);
    logRecords(quoteLineModels);
    
    resolve();
  });
}

/**
 * 
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 */
function addCPT(quoteLineModels){
  var linesToZeroQuantity = [];
  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line) {
      if(line.record['SBQQ__ProductCode__c'] === 'CMU_BLOCK_AIR_VENT'){ 
        line.record['Custom_Package_Total__c'] = line.record['SBQQ__PackageTotal__c'];
        line.record['SBQQ__NetPrice__c'] = line.record['Custom_Package_Total__c']; 
        line.record['Quote_Line_Item_Section__c'] = 'Block';
        
        console.log('Components');
        console.dir(line.components);
        var tmpNetUnitPrice = 0;
        line.components.forEach(function (lineZero) {
          tmpNetUnitPrice += lineZero.record['SBQQ__NetPrice__c'];
          linesToZeroQuantity.push(lineZero);
        });
        line.record['SBQQ__NetPrice__c'] = tmpNetUnitPrice;
      }
    });

    setComponentZeroQuant(linesToZeroQuantity);
  }
}


function setComponentZeroQuant(lines){
  if (lines != null){
    lines.forEach(function(line){
      line.record['SBQQ__Quantity__c'] = 0;
    });
  }
}


/**
 * 
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 */
function calc_CMU_BLOCK(quoteLineModels){
  var parent_CMU_BLOCK = [];
  var inchBlock =[];
  var cmuLF = [];
  var courses = [];
  var parent_CMU_V_REBAR = [];
  var descrRebarSize = [];
  var descrInOC = [];
  var intRebarSize = [];
  var intInOC = [];
  var line_V_REBAR_BAR = [];
  var line_CMU_DURAWALL = [];
  var costConcretePY = 0;
  var costConcreteDelivery = 0;
  var rows_CMU_GROUT_SOLID = [];
  var line_CMU_GROUT_SOLID = [];
  var line_CMU_GROUT_REBAR = [];
  var rows_CMU_BOND_BEAM = [];
  var line_CMU_BOND_BEAM = [];
  var cost_CMU_BOND_BEAM = 0;
  var line_CMU_BOND_Quantity = [];

  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line) {
      // var lineKey = line.key;
      var parent = line.parentItem;
      
      /* Cost Inputs */
      if(line.record['SBQQ__ProductCode__c'] === 'CONCRETE_3000_PY_COST'){ costConcretePY = line.record['SBQQ__UnitCost__c']; }
      if(line.record['SBQQ__ProductCode__c'] === 'CONCRETE_DELIVERY'){ costConcreteDelivery = line.record['SBQQ__UnitCost__c']; }
      if(line.record['SBQQ__ProductCode__c'] === 'CMU_ROWS_BOND_BEAM'){ cost_CMU_BOND_BEAM = line.record['SBQQ__UnitCost__c']; }

      /* Parent Block Quote Template Line Items Section */
      var filterLine_CMU_BLOCK_IN = line.record['SBQQ__ProductCode__c'].substring(0,10) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 2);
      if(filterLine_CMU_BLOCK_IN === 'CMU_BLOCK_IN'){line.record['Quote_Line_Item_Section__c'] = 'Block'}

      if (parent != null) {
        var parentKey = parent.key;
        var filterPC_CMU_BLOCK_IN = parent.record['SBQQ__ProductCode__c'].substring(0,10) + parent.record['SBQQ__ProductCode__c'].slice(parent.record['SBQQ__ProductCode__c'].length - 2);
        

        /* Block Quote Template Line Items Section */
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN'){line.record['Quote_Line_Item_Section__c'] = 'Block'}

        /* Quantity of Block */
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'].substring(0, 16) === 'CMU_BLOCK_QUANT_'){
          line_CMU_BOND_Quantity[parentKey] = line;
        }
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'CMU_LF'){
          cmuLF[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          parent_CMU_BLOCK[parentKey] = parent;
          inchBlock[parentKey] = parseInt(parent.record['SBQQ__ProductCode__c'].substr(10,2));
          // console.log(inchBlock[parentKey]);
        }
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'CMU_COURSES'){
          courses[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          parent_CMU_BLOCK[parentKey] = parent;
        }

        /* Durawall */
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'].substring(0, 13) === 'CMU_DURAWALL_'){
          line_CMU_DURAWALL[parentKey] = line;
        }

        /* Vertical Rebar */
        var filterPC_OC = line.record['SBQQ__ProductCode__c'].substring(0, 15);
        var filterPC_Rebar = line.record['SBQQ__ProductCode__c'].substring(0, 6) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 4);

        if('CMU_V_REBAR_OC_' === filterPC_OC && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          descrInOC[parent.parentItem.key] = line.record['SBQQ__Description__c'];
          parent_CMU_V_REBAR[parent.parentItem.key] = parent;
          intInOC[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(15, 2), 10);
        }
        if('REBAR__BAR' === filterPC_Rebar && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          descrRebarSize[parent.parentItem.key] = line.record['SBQQ__Description__c'];
          intRebarSize[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(6, 1), 10);
          parent_CMU_V_REBAR[parent.parentItem.key] = parent;
          line_V_REBAR_BAR[parent.parentItem.key] = line;
        }
        
        /* Solid Grout */
        if(line.record['SBQQ__ProductCode__c'] === 'CMU_GROUT_SOLID'){
          line_CMU_GROUT_SOLID[parentKey] = line;
          rows_CMU_GROUT_SOLID[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
        }

        /* Grout Rebar Cells */
        if(line.record['SBQQ__ProductCode__c'] === 'CMU_GROUT_SOLID_V_REBAR'){
          line_CMU_GROUT_REBAR[parentKey] = line;
        }

        /* Bond Beam */
        if(line.record['SBQQ__ProductCode__c'] === 'CMU_ROWS_BOND_BEAM'){
          rows_CMU_BOND_BEAM[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          line_CMU_BOND_BEAM[parentKey] = line;
        }
      }
    }); // END OF LINES

    
    if(parent_CMU_BLOCK){
      parent_CMU_BLOCK.forEach(function(parent_line, key) {
        /* Reset Package Total on Block */
        parent_line.record['Custom_Package_Total__c'] = 0;

        /* Quantity of Block */
        parent_line.record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[key] * courses[key] / 1.33);
        line_CMU_BOND_Quantity[key].record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[key] * courses[key] / 1.33);

        /* Durawall */
        if(line_CMU_DURAWALL[key]){
          line_CMU_DURAWALL[key].record['SBQQ__Quantity__c'] = Math.floor(courses[key] / 2) * cmuLF[key] / 500;
        }

        /* Vertical Rebar */
        if(parent_CMU_V_REBAR[key]){
          parent_CMU_V_REBAR[key].record['SBQQ__Description__c'] = descrRebarSize[key] + ' at ' + descrInOC[key];
          var tmpHeight = courses[key] * .66;
          var tmpQtyRebar = cmuLF[key] / (intInOC[key] / 12);
          var tmpVRebarBars = 0;
          if(tmpHeight > 6.66){
            tmpVRebarBars = Math.ceil((tmpHeight +(intRebarSize[key] * .125 * 50 / 12)) * tmpQtyRebar / 20);
          }else{
            tmpVRebarBars = Math.ceil(tmpHeight * tmpQtyRebar / 20);
          }
          parent_CMU_V_REBAR[key].record['SBQQ__Quantity__c'] = tmpVRebarBars;
          parent_CMU_V_REBAR[key].record['SBQQ__NetPrice__c'] = line_V_REBAR_BAR[key].record['SBQQ__ListPrice__c'];
          line_V_REBAR_BAR[key].record['SBQQ__Quantity__c'] = 0;
          //parent_CMU_V_REBAR[key].record['SBQQ__PackageTotal__c'] = parent_CMU_V_REBAR[key].record['SBQQ__NetTotal__c'];
        }

        /* Solid Grout */
        if(line_CMU_GROUT_SOLID[key]){
          var tmpBlocks = Math.ceil(cmuLF[key] / 1.33 * rows_CMU_GROUT_SOLID[key]);
          var tmpFillYards = tmpBlocks * factorBlockFillYards(inchBlock[key]) / 27;
          var tmpPriceSolidGrout = tmpFillYards * costConcretePY + Math.ceil(tmpFillYards / 10) * costConcreteDelivery;
          line_CMU_GROUT_SOLID[key].record['SBQQ__NetPrice__c'] = tmpPriceSolidGrout / rows_CMU_GROUT_SOLID[key];
        }

        /* Grout Rebar Cells */
        if(line_CMU_GROUT_REBAR[key]){
          var tmpRebarFillYards = (courses[key] - rows_CMU_GROUT_SOLID[key]) * Math.ceil(cmuLF[key] / (intInOC[key] / 12)) * factorRebarCellsFillYards(inchBlock[key]) / 27;
          var tmpPriceGrout = tmpRebarFillYards * costConcretePY + Math.ceil(tmpRebarFillYards / 10) * costConcreteDelivery;
          line_CMU_GROUT_REBAR[key].record['SBQQ__NetPrice__c'] = tmpPriceGrout;
        }

        /* Bond Beam */
        if(line_CMU_BOND_BEAM[key]){
          var tmpNoBondBeamBlocks = Math.ceil(cmuLF[key] / 1.33) * rows_CMU_BOND_BEAM[key];
          line_CMU_BOND_BEAM[key].record['SBQQ__NetPrice__c'] = tmpNoBondBeamBlocks * cost_CMU_BOND_BEAM / rows_CMU_GROUT_SOLID[key];
          //console.log(tmpNoBondBeamBlocks * cost_CMU_BOND_BEAM / rows_CMU_GROUT_SOLID[key]);
        }


        /**
         * SF PAckage Total Question
         * https://success.salesforce.com/0D53A00004s13b8
         */
        /* Roll Up Package Total to Parent */
        quoteLineModels.forEach(function(line) {
          var parent = line.parentItem;
          if(parent){
            var filterPC_CMU_BLOCK_IN = parent.record['SBQQ__ProductCode__c'].substring(0,10) + parent.record['SBQQ__ProductCode__c'].slice(parent.record['SBQQ__ProductCode__c'].length - 2);

            if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN'){
              /* Compute line.CPT */
              line.record['Custom_Package_Total__c'] = line.record['SBQQ__Quantity__c'] * line.record['SBQQ__NetPrice__c'];

              /* Add line.CPT to parent.CPT */
              parent.record['Custom_Package_Total__c'] = parent.record['Custom_Package_Total__c'] + line.record['Custom_Package_Total__c'];

              console.log('childCPT ' + line.record['SBQQ__ProductName__c'] + ': ' + line.record['Custom_Package_Total__c']);
              console.dir(line);
              console.log('parentCPT ' + parent.record['SBQQ__ProductName__c'] + ': ' + parent.record['Custom_Package_Total__c']);
              console.dir(parent);
            } //is line duping?
          }
        });
      });
    }

    /* DEBUG TO CONSOLE 
    console.log('DEBUG:');
    console.dir(parent_CMU_BLOCK);
    console.dir(inchBlock);
    console.dir(cmuLF);
    console.dir(courses);
    console.dir(parent_CMU_V_REBAR);
    console.dir(descrRebarSize);
    console.dir(descrInOC);
    console.dir(intRebarSize);
    console.dir(intInOC);
    console.dir(line_V_REBAR_BAR);
    console.dir(line_CMU_DURAWALL);
    console.log(costConcretePY);
    console.log(costConcreteDelivery);
    console.dir(rows_CMU_GROUT_SOLID);
    console.dir(line_CMU_GROUT_SOLID);
    console.dir(line_CMU_GROUT_REBAR);
    console.dir(rows_CMU_BOND_BEAM);
    console.dir(line_CMU_BOND_BEAM);
    console.log(cost_CMU_BOND_BEAM);
*/
  }


}


/**
 * 
 * @param inchBlock integer inch Block ie. 6" Block inchBlock = 6
 * @returns double factor to be used in Rebar Cells Fill Yards formula
 */
function factorRebarCellsFillYards(inchBlock){
  //console.log("switch:" + inchBlock);
  switch(inchBlock) {
    case 4:
      return .06;
      break;
    case 6:
      return .09;
      break;
    case 8:
      return .125;
      break;
    case 10:
      return .165;
      break;
    case 12:
      return .195;
      break;
    default:
      return 0;
  }
}


/**
 * 
 * @param inchBlock integer inch Block ie. 6" Block inchBlock = 6
 * @returns double factor to be used in Grout Solid Fill Yards formula
 */
function factorBlockFillYards(inchBlock){
  //console.log("switch:" + inchBlock);
  switch(inchBlock) {
    case 4:
      return .09;
      break;
    case 6:
      return .17;
      break;
    case 8:
      return .25;
      break;
    case 10:
      return .33;
      break;
    case 12:
      return .39;
      break;
    default:
      return 0;
  }
}


/**
 * 
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 */
function mapRecords(quoteLineModels) {
  return quoteLineModels.map(model => model.record);
}


/**
 * 
 * @param {QuoteLineModel[] || QuoteModel} quoteOrLineModel
 * @returns void
 */
function logRecords(quoteOrLineModel) {
  // serializing records removes proxy to make debugging easier,
  // BUT is a performance hit, so make sure to disable logging in production to avoid this without code changes
  if (DEBUG) {
    const models = Array.isArray(quoteOrLineModel) ? quoteOrLineModel : [quoteOrLineModel];
    debug(JSON.parse(JSON.stringify(mapRecords(models))));
  }
}

/**
 * Group all quote lines by very top level bundle
 * This is useful when you need to rollup values on a bundle by bundle basis
 */
function groupByTopLevelBundle(quoteLineModels) {
  const bundles = quoteLineModels.reduce((bundles, line) => {
    const parentKey = getParentKey(line);
    if (!bundles[parentKey]) {
      bundles[parentKey] = [];
    }
    bundles[parentKey].push(line);
    return bundles;
  }, {});

  debug('bundles', bundles);
  return bundles;
}

/** recursively get parent key */
function getParentKey(quoteLine) {
  if (quoteLine.parentItem) {
    return getParentKey(quoteLine.parentItem);
  } else {
    return quoteLine.key;
  }
}