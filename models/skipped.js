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
            allowNull: false,
            unique: true
		},
        vocab_set: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
	}, {
		classMethods: {
			associate: function(models) {
			
			}
		}
	});
	return Skipped;
};