'use strict';
module.exports = function (sequelize, DataTypes) {
    var Adverbs = sequelize.define('adverbs', {

        adv_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        vocab_set: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        adverb: {
            type: DataTypes.STRING,
            allowNull: false
        },

        english_meaning: {
            type: DataTypes.STRING,
            allowNull: false
        }

	}, {
        classMethods: {
            associate: function (models) {

            }
        }
    });
return Adverbs;
};