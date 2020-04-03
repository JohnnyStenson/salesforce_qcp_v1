
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
    /*console.log('JJS73 onBeforeCalculate');
    logRecords(quoteLineModels);*/
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
    calcQuantity_CMU_BLOCK(quoteLineModels);
    logRecords(quoteLineModels);
    
    resolve();
  });
}


/**
 * 
 * @param {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 * @returns {QuoteLineModel[]} quoteLineModels An array containing JS representations of all lines in the quote
 */
function calcQuantity_CMU_BLOCK(quoteLineModels){
  var parent_CMU_BLOCK = [];
  var cmuLF = [];
  var courses = [];

  if (quoteLineModels != null) {
    quoteLineModels.forEach(function(line) {
      var parent = line.parentItem;
      var tmpParentProductCodeFilter = '';
      if (parent != null) {
        var parentProductCode = parent.record['SBQQ__ProductCode__c'];
        tmpParentProductCodeFilter = parent.record['SBQQ__ProductCode__c'].substring(0,10) + parent.record['SBQQ__ProductCode__c'].slice(parent.record['SBQQ__ProductCode__c'].length - 2);

        console.log('START');
        //console.log(tmpParentProductCodeFilter);

        if(tmpParentProductCodeFilter === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'CMU_LF'){
          cmuLF[parentProductCode] = line.record['SBQQ__Quantity__c'];
          parent_CMU_BLOCK[parentProductCode] = parent;
          console.log('cmuLF:' + cmuLF[parentProductCode]);
          parent.record['SBQQ__Quantity__c'] = parent.record['SBQQ__Quantity__c'] * line.record['SBQQ__Quantity__c'] / 1.15325625947;
        }
        if(tmpParentProductCodeFilter === 'CMU_BLOCK_IN' && line.record['SBQQ__ProductCode__c'] === 'CMU_COURSES'){
          courses[parentProductCode] = line.record['SBQQ__Quantity__c'];
          parent_CMU_BLOCK[parentProductCode] = parent;
          console.log('coarses:' + courses[parentProductCode]);
          parent.record['SBQQ__Quantity__c'] = parent.record['SBQQ__Quantity__c'] * line.record['SBQQ__Quantity__c'] / 1.15325625947;
        }

        //console.log(line.record['SBQQ__Quantity__c']);
        //console.log(line.record['SBQQ__ProductCode__c']);
        //console.log(parent.record['SBQQ__ProductCode__c']);
        console.log('END');
      }
      
    });
    /*console.log('parent_CMU_BLOCK');
    console.dir(parent_CMU_BLOCK);
    console.log('parent_CMU_BLOCK.length:' + parent_CMU_BLOCK.length);
    if(parent_CMU_BLOCK.length > 0){
      parent_CMU_BLOCK.forEach(function(parent_line, parent_product_code) {
        parent_CMU_BLOCK[parent_product_code].record['SBQQ__Quantity__c'] = Math.ceil(cmuLF[parent_product_code] * courses[parent_product_code] / 1.33);
      });
    }*/
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