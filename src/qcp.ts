
// SET TO FALSE IN PRODUCTION
const DEBUG = false;

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
  //calc_LinearTrenchFootings(quoteLineModels);
  /*if (quoteLineModels != null) {
    quoteLineModels.forEach(function (line) {
      line.record["Custom_Package_Total__c"] = 0;
    });
  }  */
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
    
    //logRecords(quoteLineModels);
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
  console.log('JJS73 onAfterCalculate');
  console.dir(quoteLineModels);
  if(calc_CMU_BLOCK(quoteLineModels)){
    slabBlockPriceQuote(quoteLineModels);
  }
  calc_BOND_BEAM(quoteLineModels);
  calc_LinearTrenchFootings(quoteLineModels);
  rollupCPTtoParent(quoteLineModels);
  return new Promise((resolve, reject) => {
    // Perform logic here and resolve promise

    
    //logRecords(quoteLineModels);
    
    resolve();
  });
}


/**
 * SF PAckage Total Question
 * https://success.salesforce.com/0D53A00004s13b8
 */
function rollupCPTtoParent(quoteLineModels){
  /* Roll Up Package Total to Parent */
  quoteLineModels.forEach(function(line) {
    line.record['Custom_Package_Total__c'] = 0;

    if(line.record['SBQQ__NetPrice__c'] > 0){
      line.record['Custom_Package_Total__c'] = line.record['SBQQ__Quantity__c'] * line.record['SBQQ__NetPrice__c'];
    }
    var parent = line.parentItem;
    if(parent){
      /* Compute line.CPT */
      if(line.record['SBQQ__NetPrice__c'] > 0){
        line.record['Custom_Package_Total__c'] = line.record['SBQQ__Quantity__c'] * line.record['SBQQ__NetPrice__c'];
      }else{
        line.record['Custom_Package_Total__c'] = line.record['SBQQ__PackageTotal__c'];
      }
      
      /* Add line.CPT to parent.CPT */
      parent.record['Custom_Package_Total__c'] = parent.record['Custom_Package_Total__c'] + line.record['Custom_Package_Total__c'];

      if(parent.parentItem){
        parent.record['Custom_Package_Total__c'] = parent.record['SBQQ__PackageTotal__c'];
      }
    }

  });
}

function calc_BOND_BEAM(quoteLineModels){
  var parent_CMU_BOND_BEAM = [];
  var cmuLF = [];
  var courses = [];

  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line) {
      var parent = line.parentItem;

      if (parent != null) {
        var parentKey = parent.key;
        var filterPC_BOND_BEAM = parent.record['SBQQ__ProductCode__c'].substring(0 , 20);
        if(filterPC_BOND_BEAM === 'CMU_BOND_BEAM_BLOCK_' && line.record['SBQQ__ProductCode__c'] === 'CMU_LF'){
          cmuLF[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          parent_CMU_BOND_BEAM[parentKey] = parent;
        }

        if(filterPC_BOND_BEAM === 'CMU_BOND_BEAM_BLOCK_' && line.record['SBQQ__ProductCode__c'] === 'CMU_COURSES'){
          courses[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          parent_CMU_BOND_BEAM[parentKey] = parent;
        }
      }
    });

    if(parent_CMU_BOND_BEAM){
      parent_CMU_BOND_BEAM.forEach(function(parent_line, key){
        parent_line.record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[key] * courses[key] / 1.33);

        parent_line.record['Custom_Package_Total__c'] = parent_line.record['SBQQ__Quantity__c'] * parent_line.record['SBQQ__NetPrice__c'];
      });
    }
  }
}


function slabBlockPriceQuote(quoteLineModels){
  if (quoteLineModels != null) {
    var quant_08 = 0;
    var price_08 = 0;
    var line_08 = [];
    var slabbed_price_08 = 0;
    var quant_10 = 0;
    var price_10 = 0;
    var line_10 = [];
    var slabbed_price_10 = 0;
    var quant_12 = 0;
    var price_12 = 0;
    var line_12 = [];
    var slabbed_price_12 = 0;

    quoteLineModels.forEach(function(line) {
      if('CMU_BLOCK_QUANT_08IN' === line.record['SBQQ__ProductCode__c']){
        quant_08 = quant_08 + line.record['SBQQ__Quantity__c'];
        price_08 = line.record['SBQQ__NetPrice__c'];
        line_08.push(line);
        console.log('quant8: ' + quant_08);
      }

      if('CMU_BLOCK_QUANT_10IN' === line.record['SBQQ__ProductCode__c']){
        quant_10 = quant_10 + line.record['SBQQ__Quantity__c'];
        price_10 = line.record['SBQQ__NetPrice__c'];
        line_10.push(line);
      }

      if('CMU_BLOCK_QUANT_12IN' === line.record['SBQQ__ProductCode__c']){
        quant_12 = quant_12 + line.record['SBQQ__Quantity__c'];
        price_12 = line.record['SBQQ__NetPrice__c'];
        line_12.push(line);
      }
    });

    slabbed_price_08 = slabBlockPrice(quant_08, price_08);
    slabbed_price_10 = slabBlockPrice(quant_10, price_10);
    slabbed_price_12 = slabBlockPrice(quant_12, price_12);

    console.log('slabbed_price_08: ' + slabbed_price_08);
    console.log('slabbed_price_10: ' + slabbed_price_10);
    console.log('slabbed_price_12: ' + slabbed_price_12);

    line_08.forEach(function(line){
      line.record['SBQQ__NetPrice__c'] = slabbed_price_08;
      line.record['Custom_Package_Total__c'] = line.record['SBQQ__Quantity__c'] * line.record['SBQQ__NetPrice__c'];
    });
    line_10.forEach(function(line){
      line.record['SBQQ__NetPrice__c'] = slabbed_price_10;
      line.record['Custom_Package_Total__c'] = line.record['SBQQ__Quantity__c'] * line.record['SBQQ__NetPrice__c'];
    });
    line_12.forEach(function(line){
      line.record['SBQQ__NetPrice__c'] = slabbed_price_12;
      line.record['Custom_Package_Total__c'] = line.record['SBQQ__Quantity__c'] * line.record['SBQQ__NetPrice__c'];
    });
  }
}


function slabBlockPrice(quant, onePrice){
  var tmpTotalPrice = 0;
  var noLeft = quant;

  if(onePrice == 13){
    return onePrice;
  }

  if(noLeft - 1000 > 0){
    tmpTotalPrice = tmpTotalPrice + (noLeft - 1000) * (onePrice - 5);
    noLeft = 1000;
  }
  if(noLeft - 650 > 0){
    tmpTotalPrice = tmpTotalPrice + (noLeft - 650) * (onePrice - 4);
    noLeft = 650;
  }
  if(noLeft - 400 > 0){
    tmpTotalPrice = tmpTotalPrice + (noLeft - 400) * (onePrice - 3);
    noLeft = 400;
  }
  if(noLeft - 250 > 0){
    tmpTotalPrice = tmpTotalPrice + (noLeft - 250) * (onePrice - 2);
    noLeft = 250;
  }
  if(noLeft - 100 > 0){
    tmpTotalPrice = tmpTotalPrice + (noLeft - 100) * (onePrice - 1);
    noLeft = 100;
  }
  tmpTotalPrice = tmpTotalPrice + (noLeft * onePrice);
  return tmpTotalPrice / quant;
}


/**
 * 
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 
function addCPT(quoteLineModels){
  var linesToZeroQuantity = [];
  return;
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
}*/


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
function calc_LinearTrenchFootings(quoteLineModels){
  var parent_LTF = [];
  var length = [];
  var width = [];
  var depth = [];
  var lineConcrete = [];

  var intHorizRebarSize = [];
  var intHorizRebarQuant = [];
  var descrHorizRebarSize = [];
  var descrHorizRebarQuant = [];
  var intHorizRebarOD = [];
  var lineHorizRebar = [];
  var lineHorizRebarBar = [];
  var lineHorizRebarLabor = [];

  var lineDowelRebar = [];
  var intDowelRebarSize = [];
  var descrDowelRebarSize = [];
  var lineDowelRebarBar = [];
  var descrDowelInOC = [];
  var intDowelInOC = [];
  var intDowelRebarOD = [];
  var lineDowelRebarLabor = [];

  var lineTransvRebar = [];
  var intTransvRebarSize = [];
  var descrTransvRebarSize = [];
  var lineTransvRebarBar = [];
  var descrTransvInOC = [];
  var intTransvInOC = [];
  var lineTransvRebarLabor = [];

  var lineLaborForm = [];
  var lineLaborPour = [];
  var lineLaborStrip = [];

  var lineArrayConcreteChems = [];

  var lineChair = [];
  var intChairInOC = [];

  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line, key) {
      var parent = line.parentItem;
      if('LINEAR_TRENCH_FOOTINGS' == line.record['SBQQ__ProductCode__c']){
        line.record['Quote_Line_Item_Section__c'] = 'CPTandPerUnit';
      }
      if (parent != null) {
        var parentKey = parent.key;
        var parentPC = parent.record['SBQQ__ProductCode__c'];
        if('LINEAR_TRENCH_FOOTINGS' == parentPC){
          /* store the LTF line */
          parent_LTF[parentKey] = parent;
          //lineArrayConcreteChems
        }
        /* child or grandchild of Linear Trench Footings */
        if('LINEAR_TRENCH_FOOTINGS' == parentPC || (parent.parentItem && 'LINEAR_TRENCH_FOOTINGS' == parent.parentItem.record['SBQQ__ProductCode__c'])){
          line.record['Quote_Line_Item_Section__c'] = 'CPTandPerUnit';
          /* collect dimensions & mix */
          if('NOMINAL_LENGTH' == line.record['SBQQ__ProductCode__c']){
            length[parentKey] = line.record['SBQQ__Quantity__c'];
            line.record['SBQQ__Description__c'] = line.record['SBQQ__Quantity__c'] + ' Feet';
          }
          if('NOMINAL_WIDTH' == line.record['SBQQ__ProductCode__c']){
            width[parentKey] = line.record['SBQQ__Quantity__c'];
            line.record['SBQQ__Description__c'] = line.record['SBQQ__Quantity__c'] + ' Feet';
          }
          if('NOMINAL_DEPTH' == line.record['SBQQ__ProductCode__c']){
            depth[parentKey] = line.record['SBQQ__Quantity__c'];
            line.record['SBQQ__Description__c'] = line.record['SBQQ__Quantity__c'] + ' Feet';
          }
          if('CONCRETE__PSI_YARD' == line.record['SBQQ__ProductCode__c'].substring(0, 9) 
              + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 9)){
            lineConcrete[parentKey] = line;
          }

          /* Capture Labor Per Foot Lines */
          if('LABOR_FORM_LF' == line.record['SBQQ__ProductCode__c']){
            lineLaborForm[parentKey] = line;
          }
          if('LABOR_POUR_LF' == line.record['SBQQ__ProductCode__c']){
            lineLaborPour[parentKey] = line;
          }
          if('LABOR_STRIP_LF' == line.record['SBQQ__ProductCode__c']){
            lineLaborStrip[parentKey] = line;
          }

          /* collect Horiz rebar inputs */
          if('HORIZ_REBAR' == parent.record['SBQQ__ProductCode__c']){
            lineHorizRebar[parent.parentItem.key] = parent;
            /* Rebar Line and Size */
            if('REBAR__BAR' == line.record['SBQQ__ProductCode__c'].substring(0, 6) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 4)){
              intHorizRebarSize[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(6, 1), 10);
              descrHorizRebarSize[parent.parentItem.key] = line.record['SBQQ__Description__c'];
              lineHorizRebarBar[parent.parentItem.key] = line;
            }

            /* Quant */
            if('NOMINAL_QUANTITY' == line.record['SBQQ__ProductCode__c']){
              intHorizRebarQuant[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
              descrHorizRebarQuant[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
            }

            /* Overlap Diameter */
            if('REBAR_OVERLAP_DIAMETERS' == line.record['SBQQ__ProductCode__c']){
              intHorizRebarOD[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
            }

            /* Labor */
            if('LABOR_PER_REBAR_BAR' == line.record['SBQQ__ProductCode__c']){
              lineHorizRebarLabor[parent.parentItem.key] = line;
              line.record['SBQQ__NetPrice__c'] = line.record['SBQQ__UnitCost__c'];
            }
          }

          /* collect Dowel rebar inputs */
          if('DOWEL_REBAR' == parent.record['SBQQ__ProductCode__c']){
            lineDowelRebar[parent.parentItem.key] = parent;

            /* Rebar Line and Size */
            if('REBAR__BAR' == line.record['SBQQ__ProductCode__c'].substring(0, 6) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 4)){
              intDowelRebarSize[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(6, 1), 10);
              descrDowelRebarSize[parent.parentItem.key] = line.record['SBQQ__Description__c'];
              lineDowelRebarBar[parent.parentItem.key] = line;
            }

            /* Off Center */
            if('INCHES_OC' == line.record['SBQQ__ProductCode__c']){
              descrDowelInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'] + '" O.C.';
              intDowelInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
            }

            /* Overlap Diameter */
            if('REBAR_OVERLAP_DIAMETERS' == line.record['SBQQ__ProductCode__c']){
              intDowelRebarOD[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
            }

            /* Labor */
            if('LABOR_PER_REBAR_BAR' == line.record['SBQQ__ProductCode__c']){
              lineDowelRebarLabor[parent.parentItem.key] = line;
              line.record['SBQQ__NetPrice__c'] = line.record['SBQQ__UnitCost__c'];
            }
          }

          /* collect Transverse rebar inputs */
          if('TRANSVERSE_REBAR' == parent.record['SBQQ__ProductCode__c']){
            lineTransvRebar[parent.parentItem.key] = parent;
            /* Rebar Line and Size */
            if('REBAR__BAR' == line.record['SBQQ__ProductCode__c'].substring(0, 6) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 4)){
              intTransvRebarSize[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(6, 1), 10);
              descrTransvRebarSize[parent.parentItem.key] = line.record['SBQQ__Description__c'];
              lineTransvRebarBar[parent.parentItem.key] = line;
            }

            /* Off Center */
            if('INCHES_OC' == line.record['SBQQ__ProductCode__c']){
              descrTransvInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'] + '" O.C.';
              intTransvInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
            }

            /* Labor */
            if('LABOR_PER_REBAR_BAR' == line.record['SBQQ__ProductCode__c']){
              lineTransvRebarLabor[parent.parentItem.key] = line;
              line.record['SBQQ__NetPrice__c'] = line.record['SBQQ__UnitCost__c'];
            }
          }

          /* Collect Concrete Chems */
          if('CONCRETE_CHEM' == line.record['SBQQ__ProductCode__c'].substring(0, 13)){
            if(null == lineArrayConcreteChems[parentKey]){ lineArrayConcreteChems[parentKey] = []; }
            lineArrayConcreteChems[parentKey].push(line);
          }

          /* Chairs */
          if('CHAIR_' == line.record['SBQQ__ProductCode__c'].substring(0, 6)){
            lineChair[parentKey] = line;
          }
          /* Off Center */
          if('INCHES_OC' == line.record['SBQQ__ProductCode__c'] && 'CHAIR_' == parent.record['SBQQ__ProductCode__c'].substring(0, 6)){
            parent.record['SBQQ__Description__c'] = line.record['SBQQ__Quantity__c'] + '" O.C.';
            intChairInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
          }
        }
      
      }
    }); // END OF LINES


    if(parent_LTF){
      parent_LTF.forEach(function(parent_line, key) {

        /* Yards of Concrete */
        parent_line.record['SBQQ__Quantity__c'] = Math.ceil(length[key] * width[key] * depth[key] / 27);

        /* Labor per Foot Quantities */
        if(lineLaborForm[key]){
          lineLaborForm[key].record['SBQQ__Quantity__c'] = length[key];
        }
        if(lineLaborPour[key]){
          lineLaborPour[key].record['SBQQ__Quantity__c'] = length[key];
        }
        if(lineLaborStrip[key]){
          lineLaborStrip[key].record['SBQQ__Quantity__c'] = length[key];
        }

        /* Horizontal Rebar*/
        if(lineHorizRebar[key]){
          /* Quant of Horiz Rebar*/
          var noHReBar = Math.ceil((length[key] * intHorizRebarQuant[key] + (length[key] * intHorizRebarQuant[key] / 20 * (intHorizRebarSize[key] * .125 * intHorizRebarOD[key] / 12))) / 20);

          lineHorizRebar[key].record['SBQQ__Description__c'] = '(' + descrHorizRebarQuant[key] + ') ' + descrHorizRebarSize[key] ;
          lineHorizRebar[key].record['SBQQ__Quantity__c'] = noHReBar;

          if(lineHorizRebarLabor[key]){
            lineHorizRebar[key].record['SBQQ__NetPrice__c'] = lineHorizRebarLabor[key].record['SBQQ__NetPrice__c'] + lineHorizRebarBar[key].record['SBQQ__NetPrice__c'];
          }else{
            lineHorizRebar[key].record['SBQQ__NetPrice__c'] = lineHorizRebarBar[key].record['SBQQ__NetPrice__c'];
          }
        }


        /* Dowel Rebar*/
        if(lineDowelRebar[key]){
          /* Quant of Dowel Rebar*/
          var lengthDRebar = Math.ceil((((intDowelRebarSize[key] * .125 * intDowelRebarOD[key]) + 8) / 12) * 10) / 10;

          var unitsDRebar = Math.ceil(length[key] / (intDowelInOC[key] / 12));

          var noDReBar = Math.ceil(unitsDRebar * lengthDRebar / 20);


          lineDowelRebar[key].record['SBQQ__Description__c'] = descrDowelRebarSize[key] + ' at ' + descrDowelInOC[key] ;
          lineDowelRebar[key].record['SBQQ__Quantity__c'] = noDReBar;
          if(lineDowelRebarLabor[key]){
            lineDowelRebar[key].record['SBQQ__NetPrice__c'] = lineDowelRebarLabor[key].record['SBQQ__NetPrice__c'] + lineDowelRebarBar[key].record['SBQQ__NetPrice__c'];
          }else{
            lineDowelRebar[key].record['SBQQ__NetPrice__c'] = lineDowelRebarBar[key].record['SBQQ__NetPrice__c'];
          }
        }
        
        /* Transverse Rebar*/
        if(lineDowelRebar[key]){
          /* Quant of Transverse Rebar*/
          var lengthTvRebar = width[key] - .5;

          var unitsTvRebar = Math.ceil(length[key] / (intTransvInOC[key] / 12));

          var noTvReBar = Math.ceil(unitsTvRebar * lengthTvRebar / 20);

          lineTransvRebar[key].record['SBQQ__Description__c'] = descrTransvRebarSize[key] + ' at ' + descrTransvInOC[key] ;
          lineTransvRebar[key].record['SBQQ__Quantity__c'] = noTvReBar;

          if(lineTransvRebarLabor[key]){
            lineTransvRebar[key].record['SBQQ__NetPrice__c'] = lineTransvRebarLabor[key].record['SBQQ__NetPrice__c'] + lineTransvRebarBar[key].record['SBQQ__NetPrice__c'];
          }else{
            lineTransvRebar[key].record['SBQQ__NetPrice__c'] = lineTransvRebarBar[key].record['SBQQ__NetPrice__c'];
          }
        }

        /* Match Yards for Concrete Chems */
        if(lineArrayConcreteChems[key]){
          lineArrayConcreteChems[key].forEach(function(lineChem){
            lineChem.record['SBQQ__Quantity__c'] = Math.ceil(length[key] * width[key] * depth[key] / 27);
          });
        }

        /* Chairs */ 
        if(lineChair[key]){
          var quantChairs = Math.ceil(Math.ceil((length[key] / (intChairInOC[key] / 12)) + 1) / Math.floor(5 / (width[key] - .5)));
          //console.log('quantChairs = Math.ceil((' + length[key] + ' / (' + intChairInOC[key] + '/ 12)) + 1) / Math.floor(5 / (' + width[key] + ' - .5))');
          lineChair[key].record['SBQQ__Quantity__c'] = quantChairs;
        }
        
      });
    }

    /* Any Nested Bundles need to have component SBQQ__NetPrice__c rolled up into the nested bundle and their quantity = 0. Nested Bundle must hold the scalar quantity. Main Product Custom Package Total = Package Total (self) + package Total (nested bundles).*/

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
  var costLaborPerFillYard = 0;
  var costLaborPerRebarBar = [];
  var line_CMU_GROUT_SOLID = [];
  var line_CMU_GROUT_REBAR = [];
  var line_QUANT_BLOCK = [];

  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line) {
      // var lineKey = line.key;
      var parent = line.parentItem;
      
      /* Cost Inputs */
      if(line.record['SBQQ__ProductCode__c'] === 'CONCRETE_3000_PY_COST'){ 
        costConcretePY = line.record['SBQQ__UnitCost__c']; 
      }

      /* Parent Block Quote Template Line Items Section */
      var filterLine_CMU_BLOCK_IN = line.record['SBQQ__ProductCode__c'].substring(0,10) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 2);
      if(filterLine_CMU_BLOCK_IN === 'CMU_BLOCK_IN'){line.record['Quote_Line_Item_Section__c'] = 'Block';}

      if (parent != null) {
        var parentKey = parent.key;
        var filterPC_CMU_BLOCK_IN = parent.record['SBQQ__ProductCode__c'].substring(0,10) + parent.record['SBQQ__ProductCode__c'].slice(parent.record['SBQQ__ProductCode__c'].length - 2);
        
        /* Grout Labor */
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'LABOR_PER_FILL_YARD_GROUT'){
          costLaborPerFillYard = line.record['SBQQ__UnitCost__c'];
        }

        /* Block Quote Template Line Items Section */
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN'){line.record['Quote_Line_Item_Section__c'] = 'Block'}

        /* Quantity of Block */
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'].substring(0, 16) === 'CMU_BLOCK_QUANT_'){
          line_QUANT_BLOCK[parentKey] = line;
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
        var filterPC_Rebar = line.record['SBQQ__ProductCode__c'].substring(0, 6) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 4);

        if('INCHES_OC' == line.record['SBQQ__ProductCode__c'] && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          descrInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'] + '" O.C.';
          parent_CMU_V_REBAR[parent.parentItem.key] = parent;
          intInOC[parent.parentItem.key] = line.record['SBQQ__Quantity__c'];
          line.record['Quote_Line_Item_Section__c'] = 'Block';
        }
        if('REBAR__BAR' === filterPC_Rebar && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          line.record['Quote_Line_Item_Section__c'] = 'Block';
          descrRebarSize[parent.parentItem.key] = line.record['SBQQ__Description__c'];
          intRebarSize[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(6, 1), 10);
          parent_CMU_V_REBAR[parent.parentItem.key] = parent;
          line_V_REBAR_BAR[parent.parentItem.key] = line;
        }
        if('LABOR_PER_REBAR_BAR' == line.record['SBQQ__ProductCode__c'] && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          costLaborPerRebarBar[parent.parentItem.key] = line.record['SBQQ__UnitCost__c']
        }
        
        /* Solid Grout */
        if(line.record['SBQQ__ProductCode__c'] === 'CMU_GROUT_SOLID'){
          line_CMU_GROUT_SOLID[parentKey] = line;
        }

        /* Grout Rebar Cells */
        if(line.record['SBQQ__ProductCode__c'] === 'CMU_GROUT_SOLID_V_REBAR'){
          line_CMU_GROUT_REBAR[parentKey] = line;
        }
      }
    }); // END OF LINES

    
    if(parent_CMU_BLOCK){
      parent_CMU_BLOCK.forEach(function(parent_line, key) {
        /* Reset Package Total on Block */
        parent_line.record['Custom_Package_Total__c'] = 0;

        /* Quantity of Block */
        parent_line.record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[key] * courses[key] / 1.33);
        line_QUANT_BLOCK[key].record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[key] * courses[key] / 1.33);
        parent_line.record['SBQQ__Description__c'] = cmuLF[key] + " LF,  " + courses[key] + " course(s) ";

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
          parent_CMU_V_REBAR[key].record['SBQQ__NetPrice__c'] = line_V_REBAR_BAR[key].record['SBQQ__ListPrice__c'] + costLaborPerRebarBar[key];
          line_V_REBAR_BAR[key].record['SBQQ__Quantity__c'] = 0;
          //parent_CMU_V_REBAR[key].record['SBQQ__PackageTotal__c'] = parent_CMU_V_REBAR[key].record['SBQQ__NetTotal__c'];
        }

        /* Solid Grout */
        if(line_CMU_GROUT_SOLID[key]){
          var tmpBlocks = Math.ceil(cmuLF[key] / 1.33 * courses[key]);
          var tmpFillYards = tmpBlocks * factorBlockFillYards(inchBlock[key]) / 27;
          var tmpPriceSolidGrout = tmpFillYards * ( costConcretePY + costLaborPerFillYard ); 
          line_CMU_GROUT_SOLID[key].record['SBQQ__NetPrice__c'] = tmpPriceSolidGrout;
        }

        /* Grout Rebar Cells */
        if(line_CMU_GROUT_REBAR[key]){
          var tmpRebarFillYards = (courses[key]) * Math.ceil(cmuLF[key] / (intInOC[key] / 12)) * factorRebarCellsFillYards(inchBlock[key]) / 27;
          var tmpPriceGrout = tmpRebarFillYards * ( costConcretePY + costLaborPerFillYard ); 
          line_CMU_GROUT_REBAR[key].record['SBQQ__NetPrice__c'] = tmpPriceGrout;
        }

        
      });
      return true;
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

  return false;
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