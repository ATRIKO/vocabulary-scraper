'use strict';
module.exports = function (sequelize, DataTypes) {
    var Verbs = sequelize.define('verbs', {

        verb_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        vocab_set: {
            type: DataTypes.INTEGER,
            allowNull: false
        },

        infinitive: {
            type: DataTypes.STRING,
            allowNull: false
        },

        present: {
            type: DataTypes.STRING,
            allowNull: false
        },

        past: {
            type: DataTypes.STRING,
            allowNull: false
        },

        past_participle: {
            type: DataTypes.STRING,
            allowNull: false
        },

        helping_verb: {
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
return Verbs;
};