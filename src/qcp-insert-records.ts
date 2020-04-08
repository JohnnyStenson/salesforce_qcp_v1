/**
 * Created by jfeingold on 9/27/16.
 * https://developer.salesforce.com/docs/atlas.en-us.cpq_api_dev.meta/cpq_api_dev/cpq_dev_jsqcp_insert_records.htm
 */
export function onAfterCalculate(quote, lines, conn) {
	if (lines.length) {
		var codes = [];
		lines.forEach(function(line) {
			var code = line.record['SBQQ__ProductCode__c'];
			if (code) {
				codes.push(code);
			}
		});
		if (codes.length) {
			var conditions = {
				SBQQ__Category__c: {$in: codes}
			};
			var fields = ['Id', 'Name', 'SBQQ__Category__c', 'SBQQ__Value__c'];
			return conn.sobject('SBQQ__LookupData__c')
				.find(conditions, fields)
				.execute(function(err, records) {
					console.log(records);
					if (err) {
						return Promise.reject(err);
					} else {
						var valuesByCategory = {};
						records.forEach(function(record) {
							valuesByCategory[record.SBQQ__Category__c] = record.SBQQ__Value__c;
						});
						var newRecords = [];
						lines.forEach(function(line) {
							var code = line.record['SBQQ__ProductCode__c'];
							var desc = line.record['SBQQ__Description__c'];
							if (code && desc && !valuesByCategory[code]) {
								newRecords.push({
									SBQQ__Category__c: code,
									SBQQ__Value__c: line.record['SBQQ__Description__c']
								});
							}
						});
						if (newRecords.length) {
							return conn.sobject('SBQQ__LookupData__c')
								.create(newRecords, function(err, ret) {
									console.log(ret);
								});
						}
					}
				});
		}
	}
	return Promise.resolve();
}