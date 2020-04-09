
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
    //calcQuantity_CMU_BLOCK(quoteLineModels);
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
    logRecords(quoteLineModels);
    
    resolve();
  });
}


/**
 * 
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 */
function calc_CMU_BLOCK(quoteLineModels){
  var parent_CMU_BLOCK = [];
  var cmuLF = [];
  var courses = [];
  var parent_CMU_V_REBAR = [];
  var descrRebarSize = [];
  var descrInOC = [];
  var intRebarSize = [];
  var intInOC = [];
  var line_V_REBAR_BAR = [];

  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line) {
      var lineKey = line.key;
      var parent = line.parentItem;

      if (parent != null) {
        var parentKey = parent.key;

        /* Quantity of Block */
        var filterPC_CMU_BLOCK_IN = parent.record['SBQQ__ProductCode__c'].substring(0,10) + parent.record['SBQQ__ProductCode__c'].slice(parent.record['SBQQ__ProductCode__c'].length - 2);

        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'CMU_LF'){
          cmuLF[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          parent_CMU_BLOCK[parentKey] = parent;
        }
        if(filterPC_CMU_BLOCK_IN === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'CMU_COURSES'){
          courses[parentKey] = line.record['SBQQ__Quantity__c'].valueOf();
          parent_CMU_BLOCK[parentKey] = parent;
        }

        /* Vertical Rebar */
        var filterPC_OC = line.record['SBQQ__ProductCode__c'].substring(0, 15);
        var filterPC_Rebar = line.record['SBQQ__ProductCode__c'].substring(0, 6) + line.record['SBQQ__ProductCode__c'].slice(line.record['SBQQ__ProductCode__c'].length - 4);

        if('CMU_V_REBAR_OC_' === filterPC_OC && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          descrInOC[parent.parentItem.key] = line.record['SBQQ__Description__c'];
          parent_CMU_V_REBAR[parent.parentItem.key] = parent;
          intInOC[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(15, 2), 10);

          console.log(parent.parentItem.key);
        }
        if('REBAR__BAR' === filterPC_Rebar && 'CMU_V_REBAR' === parent.record['SBQQ__ProductCode__c']){
          descrRebarSize[parent.parentItem.key] = line.record['SBQQ__Description__c'];
          intRebarSize[parent.parentItem.key] = parseInt(line.record['SBQQ__ProductCode__c'].substr(6, 1), 10);
          parent_CMU_V_REBAR[parent.parentItem.key] = parent;
          line_V_REBAR_BAR[parent.parentItem.key] = line;
        }
      }
    }); // END OF LINES

    
    if(parent_CMU_BLOCK){
      parent_CMU_BLOCK.forEach(function(parent_line, key) {
        /* Quantity of Block */
        parent_line.record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[key] * courses[key] / 1.33);

        /* Vertical Rebar */
        if(parent_CMU_V_REBAR){
          parent_CMU_V_REBAR[key].record['SBQQ__Description__c'] = descrRebarSize[key] + ' at ' + descrInOC[key];
          var tmpHeight = courses[key] * .66;
          var tmpQtyRebar = cmuLF[key] / (intInOC[key] / 12);
          var tmpVRebarBars = 0;
          if(tmpHeight > 6.66){
            tmpVRebarBars = Math.ceil((tmpHeight +(intRebarSize[key] * .125 * 50 / 12)) * tmpQtyRebar / 20);
          }else{
            tmpVRebarBars = Math.ceil(tmpHeight * tmpQtyRebar / 20);
          }
          line_V_REBAR_BAR[key].record['SBQQ__Quantity__c'] = tmpVRebarBars;

        }
      });
    }
    /* DEBUG TO CONSOLE
    console.log('DEBUG:');
    console.dir(parent_CMU_BLOCK);
    console.dir(cmuLF);
    console.dir(courses);
    console.dir(parent_CMU_V_REBAR);
    console.dir(descrRebarSize);
    console.dir(descrInOC);
    console.dir(intRebarSize);
    console.dir(intInOC);
    console.dir(line_V_REBAR_BAR);
    */
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