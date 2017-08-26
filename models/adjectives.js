'use strict';
module.exports = function (sequelize, DataTypes) {
    var Adjectives = sequelize.define('adjectives', {

        adj_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        vocab_set: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        adjective: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isNull: false
            }
        },

        english_meaning: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isNull: false
            }
        }

	}, {
        classMethods: {
            associate: function (models) {

            }
        }
    });
return Adjectives;
};