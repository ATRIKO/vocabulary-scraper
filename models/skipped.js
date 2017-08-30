'use strict';
module.exports = function(sequelize, DataTypes) {
	var Skipped = sequelize.define('skipped', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        word: {
            type: DataTypes.STRING,
            allowNull: false
		},
        vocab_set: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
	}, {
		classMethods: {
			associate: function(models) {
			
			}
		}
	});
	return Skipped;
};