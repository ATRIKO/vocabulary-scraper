'use strict';
module.exports = function(sequelize, DataTypes) {
	var Skipped = sequelize.define('skipped', {
		word: {
			type: DataTypes.STRING,
            primaryKey: true
		},
		vocab_set: DataTypes.INTEGER
	}, {
		classMethods: {
			associate: function(models) {
			
			}
		}
	});
	return Skipped;
};