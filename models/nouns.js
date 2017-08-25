'use strict';
module.exports = function (sequelize, DataTypes) {
    var Nouns = sequelize.define('nouns', {

        noun_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        vocab_set: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        singular: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isAlpha: true,
                isNull: false
            }
        },

        plural: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isAlpha: true,
                isNull: false
            }
        },

        english_meaning: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isAlpha: true,
                isNull: false
            }
        }

	}, {
        classMethods: {
            associate: function (models) {

            }
        }
    });
return Nouns;
};