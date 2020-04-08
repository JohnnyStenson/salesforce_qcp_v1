export function onAfterPriceRules(quoteModels, quoteLineModels, conn) {
    return new Promise((resolve, reject) => {
        // Print out conn object so you can look and see what is available to access.
        // NOTE: you should limit the number of calls made, because they must go over the network
        console.log('conn', conn);
        quoteLineModels.forEach(function (line) {
            console.log('current ql: ', line.record['SBQQ__ProductCode__c']);
            if (line.record['SBQQ__ProductCode__c'] == 'CC-VXCB-AWS-MP') {
                var aloc = "'" + line.record['DCI_Target__c'] + "'";
                var aregion = 100;
                var zloc = "'" + line.record['Global_Location__c'] + "'";
                var zregion = 200;
                conn
                    .query('SELECT Id, Megaport_Region_Number__c FROM Location__c where Name = ' + aloc + ' LIMIT 1')
                    .then(result => {
                        console.log('Query Result', result);
                        result.records.forEach(function (record) {
                            aregion = record.Megaport_Region_Number__c;
                            console.log('aregion: ', aregion);
                            conn
                                .query('SELECT Id, Megaport_Region_Number__c FROM Location__c where Name = ' + zloc + ' LIMIT 1')
                                .then(result => {
                                    console.log('Query Result', result);
                                    result.records.forEach(function (record) {
                                        zregion = record.Megaport_Region_Number__c;
                                        console.log('zregion: ', zregion);
                                        var finalListPrice = processRegionDiff(aregion, zregion);
                                        console.log('final list: ', finalListPrice);
                                        line.record['SBQQ__ListPrice__c'] = finalListPrice;
                                    });
                                })
                                .catch(err => {
                                    console.warn('Could not query records', err);
                                });
                        });
                    })
                    .catch(err => {
                        console.warn('Could not query records', err);
                    });
            }
        });
        // Perform logic here and resolve promise
        resolve();
    });
}
function processRegionDiff(aregion, zregion) {
    var regionDiff = Math.abs(aregion - zregion);
    console.log('regionDiff: ', regionDiff);
    var listPrice = '10.00';
    if (regionDiff == 0) {
        listPrice = '.18';
    } else if (regionDiff == 1) {
        listPrice = '.24';
    } else if (regionDiff == 2) {
        listPrice = '.28';
    }
    return listPrice;
}